import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog } from '../data/catalog';
import { proposeGraphCourseRemoval } from './graphSelection';
import type { Course, PlannedCourse, Requirement, SavedPath } from './types';

const req = (courseId: string): Requirement => ({ kind: 'course', courseId });
const all = (...items: Requirement[]): Requirement => ({ kind: 'all', items });
const any = (...items: Requirement[]): Requirement => ({ kind: 'any', items });
const course = (id: string, prerequisites: Requirement | null = null, corequisites: Requirement | null = null): Course => ({ ...catalog.courses[0], id, title: id, units: 12, unitsLabel: '12 units', terms: ['Fall', 'Spring'], prerequisites, corequisites });
const planned = (courseId: string, term = 'Fall 2026'): PlannedCourse => ({ courseId, term, status: 'planned' });
const completed = (courseId: string): PlannedCourse => ({ courseId, term: 'Fall 2026', status: 'completed' });
const path = (...courses: PlannedCourse[]): SavedPath => ({ id: 'removal-path', name: 'My path', programId: 'major6-3', catalogYear: catalog.catalogYear, createdAt: '', updatedAt: '', paceUnits: 48, courses });

test('a prerequisite chain produces one immutable removal proposal with the exact confirmation list', () => {
  const courses = [course('A'), course('B', req('A')), course('C', req('B')), course('UNRELATED')];
  const before = path(planned('A'), planned('B', 'Spring 2027'), planned('C', 'Fall 2027'), planned('UNRELATED'));
  const snapshot = structuredClone(before);
  Object.freeze(before.courses); Object.freeze(before);
  const proposal = proposeGraphCourseRemoval(before, 'A', courses);
  assert.deepEqual(proposal.removedCourseIds, ['A', 'B', 'C']);
  assert.deepEqual(proposal.affectedCourseIds, ['B', 'C']);
  assert.equal(proposal.requiresConfirmation, true);
  assert.deepEqual(proposal.proposedPath.courses, [planned('UNRELATED')]);
  assert.deepEqual(before, snapshot, 'Cancel requires no rollback because proposing does not mutate the saved path');
  assert.deepEqual({ ...proposal.proposedPath, courses: before.courses }, before, 'Applying changes only coursework, preserving the original snapshot for one Undo');
});

test('a valid OR alternative retains both the direct dependent and its later chain', () => {
  const courses = [course('A'), course('OTHER'), course('B', any(req('A'), req('OTHER'))), course('C', req('B'))];
  for (const alternative of [completed('OTHER'), planned('OTHER')]) {
    const before = path(planned('A'), alternative, planned('B', 'Spring 2027'), planned('C', 'Fall 2027'));
    const proposal = proposeGraphCourseRemoval(before, 'A', courses);
    assert.deepEqual(proposal.removedCourseIds, ['A']);
    assert.equal(proposal.requiresConfirmation, false);
    assert.equal(proposal.proposedPath.courses.length, 3);
  }
});

test('required AND branches and shared prerequisites remove all affected dependents without duplicates', () => {
  const courses = [course('A'), course('X'), course('Y'), course('B', all(req('A'), any(req('X'), req('Y')))), course('C', req('A')), course('D', all(req('B'), req('C')))];
  const before = path(planned('A'), planned('X'), planned('B', 'Spring 2027'), planned('C', 'Spring 2027'), planned('D', 'Fall 2027'));
  const proposal = proposeGraphCourseRemoval(before, 'A', courses);
  assert.deepEqual(proposal.removedCourseIds, ['A', 'B', 'C', 'D']);
  assert.deepEqual(proposal.proposedPath.courses, [planned('X')]);
  assert.equal(new Set(proposal.removedCourseIds).size, proposal.removedCourseIds.length);
});

test('same-term corequisites cascade, including genuine mutual corequisites, while completed subjects remain', () => {
  const courses = [course('A', null, req('B')), course('B', null, req('A')), course('LATER', req('B')), course('EARNED', req('A'))];
  const before = path(planned('A'), planned('B'), planned('LATER', 'Spring 2027'), completed('EARNED'));
  const proposal = proposeGraphCourseRemoval(before, 'A', courses);
  assert.deepEqual(proposal.removedCourseIds, ['A', 'B', 'LATER']);
  assert.deepEqual(proposal.proposedPath.courses, [completed('EARNED')]);
});

test('a future or same-term prerequisite alternative cannot prevent a chronological cascade', () => {
  const courses = [course('A'), course('OTHER'), course('B', any(req('A'), req('OTHER'))), course('TOO_EARLY', req('A'))];
  for (const alternativeTerm of ['Spring 2027', 'Fall 2027']) {
    const before = path(planned('A'), planned('OTHER', alternativeTerm), planned('B', 'Spring 2027'), planned('TOO_EARLY'));
    const proposal = proposeGraphCourseRemoval(before, 'A', courses);
    assert.deepEqual(proposal.removedCourseIds, ['A', 'B']);
    assert.ok(proposal.proposedPath.courses.some(item => item.courseId === 'TOO_EARLY'), 'A pre-existing timing error is not caused by this removal');
  }
});

test('already missing, manual-review and cyclic plans are retained rather than swept away', () => {
  const courses = [course('A'), course('B', req('A')), course('MISSING', req('OUTSIDE')), course('PARTIAL', all(req('A'), req('OUTSIDE'))), course('REVIEW', all(req('A'), { kind: 'permission', text: 'Advisor approval' })), course('LOOP', req('LOOP'))];
  const before = path(planned('A'), ...['B', 'MISSING', 'PARTIAL', 'REVIEW', 'LOOP'].map(id => planned(id, 'Spring 2027')));
  const proposal = proposeGraphCourseRemoval(before, 'A', courses);
  assert.deepEqual(proposal.removedCourseIds, ['A', 'B']);
  assert.deepEqual(proposal.proposedPath.courses.map(item => item.courseId), ['MISSING', 'PARTIAL', 'REVIEW', 'LOOP']);
});

test('count and unit alternatives are retained only while another sufficient allocation remains', () => {
  const courses = [course('A'), course('B'), course('C'), course('COUNT', { kind: 'count', minimum: 2, items: [req('A'), req('B'), req('C')] }), course('UNITS', { kind: 'units', minimum: 24, courseIds: ['A', 'B', 'C'] })];
  const sufficient = path(planned('A'), planned('B'), planned('C'), planned('COUNT', 'Spring 2027'), planned('UNITS', 'Spring 2027'));
  assert.deepEqual(proposeGraphCourseRemoval(sufficient, 'A', courses).removedCourseIds, ['A']);
  const insufficient = { ...sufficient, courses: sufficient.courses.filter(item => item.courseId !== 'C') };
  assert.deepEqual(proposeGraphCourseRemoval(insufficient, 'A', courses).removedCourseIds, ['A', 'COUNT', 'UNITS']);
});

test('removing absent or completed courses is a no-op, and a single removal needs no cascade confirmation', () => {
  const courses = [course('A'), course('B', req('A'))];
  const before = path(completed('A'), planned('B', 'Spring 2027'));
  for (const id of ['A', 'ABSENT']) {
    const proposal = proposeGraphCourseRemoval(before, id, courses);
    assert.equal(proposal.proposedPath, before);
    assert.deepEqual(proposal.removedCourseIds, []);
    assert.equal(proposal.hasChanges, false);
    assert.equal(proposal.requiresConfirmation, false);
  }
  const single = proposeGraphCourseRemoval(before, 'B', courses);
  assert.deepEqual(single.removedCourseIds, ['B']);
  assert.equal(single.hasChanges, true);
  assert.equal(single.requiresConfirmation, false);
});
