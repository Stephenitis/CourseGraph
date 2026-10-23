import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { catalog } from '../data/catalog';
import type { SavedPath } from './types';
import { clearProgramCompletion, getProgramCompletionStatus, isProgramCompletionRecord, reconcileProgramCompletion, recordProgramCompletion } from './programCompletion';

const confirmedAt = '2026-10-23T18:00:00.000Z';
const fixture = (): SavedPath => ({
  id: 'major-path', name: 'An undergraduate direction', programId: 'major6-3',
  catalogYear: catalog.catalogYear, createdAt: confirmedAt, updatedAt: confirmedAt,
  courses: [{ courseId: '18.01', term: 'Fall 2026', status: 'completed' }, { courseId: '6.100A', term: 'Spring 2027', status: 'planned' }],
  remainingUnits: 144, paceUnits: 48,
});

test('even every mapped course and zero remaining units cannot automatically fulfill a major', () => {
  const path: SavedPath = { ...fixture(), remainingUnits: 0, courses: catalog.courses.map(course => ({ courseId: course.id, term: 'Fall 2026', status: 'completed' })) };
  assert.equal(getProgramCompletionStatus(path, catalog).state, 'unrecorded');
  assert.equal(reconcileProgramCompletion(path, catalog).programCompletion, undefined);
});

test('an explicit review records its scope and earned history without inventing graduation or remaining units', () => {
  const path = fixture();
  const reviewed = recordProgramCompletion(path, catalog, confirmedAt);
  assert.equal(path.programCompletion, undefined, 'The action must not mutate the prior undo state');
  assert.deepEqual(reviewed.programCompletion, {
    kind: 'user-recorded-advisor-review', advisorReviewAcknowledged: true,
    pathId: path.id, programId: path.programId, catalogYear: path.catalogYear,
    confirmedAt, completedCourseIds: ['18.01'],
  });
  const status = getProgramCompletionStatus(reviewed, catalog);
  assert.equal(status.state, 'recorded');
  assert.match(status.reason, /not MIT verification.*degree award.*graduate admission/);
  assert.equal(reviewed.remainingUnits, 144, 'A major milestone is not a whole-degree unit audit');
});

test('only current undergraduate majors can record this milestone with a valid date', () => {
  for (const programId of ['minor18', 'master6-P', 'unknown']) {
    const path = { ...fixture(), programId };
    assert.equal(getProgramCompletionStatus(path, catalog).state, 'ineligible');
    assert.throws(() => recordProgramCompletion(path, catalog, confirmedAt), /undergraduate major/);
  }
  assert.throws(() => recordProgramCompletion({ ...fixture(), catalogYear: '2025-2026' }, catalog, confirmedAt), /current catalog/);
  for (const date of ['', 'invalid', '2026-02-30T18:00:00.000Z']) assert.throws(() => recordProgramCompletion(fixture(), catalog, date), /ISO timestamp/);
});

test('planning and presentation edits preserve the record while completed membership remains identical', () => {
  const reviewed = recordProgramCompletion(fixture(), catalog, confirmedAt);
  const changed: SavedPath = { ...reviewed, name: 'A new name', paceUnits: 36, remainingUnits: 120,
    courses: [...reviewed.courses].reverse().map(course => ({ ...course, term: 'Fall 2027' })),
  };
  assert.equal(getProgramCompletionStatus(changed, catalog).state, 'recorded');
  assert.equal(reconcileProgramCompletion(changed, catalog), changed);
});

test('path, major, catalog and completed-course edits invalidate the milestone instead of transferring it', () => {
  const reviewed = recordProgramCompletion(fixture(), catalog, confirmedAt);
  const changedPaths: SavedPath[] = [
    { ...reviewed, id: 'copy-or-imported-path' },
    { ...reviewed, programId: 'major6-4' },
    { ...reviewed, catalogYear: '2027-2028' },
    { ...reviewed, courses: reviewed.courses.filter(course => course.status !== 'completed') },
    { ...reviewed, courses: reviewed.courses.map(course => ({ ...course, status: 'completed' })) },
  ];
  for (const changed of changedPaths) {
    assert.equal(getProgramCompletionStatus(changed, catalog).state, 'stale');
    assert.equal(reconcileProgramCompletion(changed, catalog).programCompletion, undefined);
  }
  assert.equal(getProgramCompletionStatus(reviewed, { ...catalog, catalogYear: '2027-2028' }).state, 'stale');
  assert.equal(reconcileProgramCompletion({ ...reviewed, programId: 'minor18' }, catalog).programCompletion, undefined);
});

test('reset preserves the prior record for undo and does not change the underlying path', () => {
  const original = fixture();
  const reviewed = recordProgramCompletion(original, catalog, confirmedAt);
  assert.deepEqual(clearProgramCompletion(reviewed), original);
  assert.equal(getProgramCompletionStatus(reviewed, catalog).state, 'recorded');
  assert.equal(clearProgramCompletion(original), original);
});

test('imported review shapes require an explicit acknowledgement, date and unique course snapshot', () => {
  const record = recordProgramCompletion(fixture(), catalog, confirmedAt).programCompletion!;
  assert.equal(isProgramCompletionRecord(record), true);
  for (const value of [null, [], true, {}, { ...record, advisorReviewAcknowledged: false }, { ...record, kind: 'verified-by-MIT' }, { ...record, pathId: '' }, { ...record, confirmedAt: 'tomorrow' }, { ...record, completedCourseIds: ['18.01', '18.01'] }, { ...record, completedCourseIds: [42] }]) {
    assert.equal(isProgramCompletionRecord(value), false);
  }
});
