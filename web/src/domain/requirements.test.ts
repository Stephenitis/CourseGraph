import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog } from '../data/catalog';
import { detectScheduleConflicts, evaluateCourse, evaluateRequirement, getDownstreamIds, getPrerequisiteIds, termOrder } from './requirements';
import type { Course, Requirement, SavedPath } from './types';

const courseReq = (courseId: string): Requirement => ({ kind: 'course', courseId });
const a = (items: Requirement[]): Requirement => ({ kind: 'all', items });
const o = (items: Requirement[]): Requirement => ({ kind: 'any', items });
const find = (id: string) => catalog.courses.find(course => course.id === id)!;
const path = (courses: SavedPath['courses']): SavedPath => ({ id: 'test', name: 'Test', programId: 'major6-4', courses, createdAt: '', updatedAt: '', catalogYear: catalog.catalogYear });
const planned = (courseId: string, term: string): SavedPath['courses'][number] => ({ courseId, term, status: 'planned' });

test('nested alternatives preserve AND/OR and do not demand unused alternatives', () => {
  const requirement = a([o([courseReq('A'), courseReq('B')]), courseReq('C')]);
  assert.equal(evaluateRequirement(requirement, new Set(['A', 'C'])).state, 'met');
  const partial = evaluateRequirement(requirement, new Set(['A']));
  assert.deepEqual(partial.missingCourseIds, ['C']);
  assert.equal(partial.state, 'missing');
});

test('instructor permission stays unresolved unless a concrete alternative is fulfilled', () => {
  const requirement = o([courseReq('A'), { kind: 'permission', text: 'Permission of instructor' }]);
  assert.equal(evaluateRequirement(requirement, new Set()).state, 'review');
  assert.equal(evaluateRequirement(requirement, new Set(['A'])).state, 'met');
  assert.equal(evaluateRequirement({ kind: 'unknown', text: 'Admission' }, new Set(['A'])).state, 'review');
});

test('MIT machine learning real prerequisite alternatives work without inventing a programming chain', () => {
  const ml = find('6.3900');
  assert.equal(evaluateRequirement(ml.prerequisites, new Set(['6.1000', '18.06'])).state, 'met');
  assert.equal(evaluateRequirement(ml.prerequisites, new Set(['6.1210', '18.03'])).state, 'met');
  assert.equal(evaluateRequirement(ml.prerequisites, new Set(['6.100A', '18.06'])).state, 'missing');
});

test('same-term or later planned prerequisites cannot satisfy a course', () => {
  const course = find('6.1020');
  assert.equal(evaluateCourse(course, path([{ courseId: '6.1000', term: 'Before planning', status: 'completed' }, planned('6.1010', 'Fall 2026'), planned('6.1020', 'Spring 2027')]), catalog.courses).state, 'met');
  assert.equal(evaluateCourse(course, path([planned('6.1010', 'Spring 2027'), planned('6.1020', 'Spring 2027')]), catalog.courses).state, 'missing');
  assert.equal(evaluateCourse(course, path([planned('6.1010', 'Fall 2027'), planned('6.1020', 'Spring 2027')]), catalog.courses).state, 'missing');
});

test('completed academic history counts even without a parseable term', () => {
  const p = path([{ courseId: '6.1010', term: 'Before MIT', status: 'completed' }, planned('6.1020', 'Spring 2027')]);
  assert.equal(evaluateCourse(find('6.1020'), p, catalog.courses).state, 'met');
});

test('corequisites accept same-term study while unknown terms cannot prove chronology', () => {
  const target: Course = { ...find('6.1020'), prerequisites: null, corequisites: courseReq('6.1010') };
  assert.equal(evaluateCourse(target, path([{ courseId: '6.1000', term: 'Before planning', status: 'completed' }, planned('6.1010', 'Spring 2027'), planned(target.id, 'Spring 2027')]), [...catalog.courses.filter(c => c.id !== target.id), target]).state, 'met');
  assert.equal(evaluateCourse(find('6.1020'), path([planned('6.1010', 'Spring 2027'), planned('6.1020', 'Later')]), catalog.courses).state, 'review');
  assert.equal(termOrder('Fall 2026')! < termOrder('IAP 2027')!, true);
  assert.equal(termOrder('spring-2027'), termOrder('Spring 2027'));
});

test('count and units requirements avoid duplicate credit and flag missing unit data', () => {
  assert.equal(evaluateRequirement({ kind: 'count', minimum: 2, items: [courseReq('18.06'), courseReq('18.06')] }, new Set(['18.06'])).state, 'missing');
  const units: Requirement = { kind: 'units', minimum: 24, courseIds: ['18.06', '18.06', '18.03'] };
  assert.equal(evaluateRequirement(units, new Set(['18.06']), catalog.courses).state, 'missing');
  assert.equal(evaluateRequirement(units, new Set(['18.06', '18.03']), catalog.courses).state, 'met');
  assert.equal(evaluateRequirement({ kind: 'units', minimum: 24, courseIds: ['6.THM'] }, new Set(['6.THM']), catalog.courses).state, 'review');
});

test('downstream traversal is transitive and cycle safe; enabling does not mean eligible', () => {
  const courses = [
    { ...find('6.1010'), id: 'A', prerequisites: courseReq('C') },
    { ...find('6.1010'), id: 'B', prerequisites: a([courseReq('A'), courseReq('X')]) },
    { ...find('6.1010'), id: 'C', prerequisites: courseReq('B') },
  ];
  assert.deepEqual(new Set(getDownstreamIds('A', courses)), new Set(['B', 'C']));
  assert.equal(evaluateRequirement(courses[1].prerequisites, new Set(['A'])).state, 'missing');
});

test('conflicts require actual same-term meetings, overlapping days and time; adjacency is allowed', () => {
  const first: Course = { ...find('6.1010'), meetings: [{ section: 'L01', days: [1, 3], startMinutes: 600, endMinutes: 660, term: 'Fall 2026' }] };
  const second: Course = { ...find('18.06'), meetings: [{ section: 'L01', days: [3, 5], startMinutes: 630, endMinutes: 690, term: 'Fall 2026' }] };
  const p = path([planned(first.id, 'Fall 2026'), planned(second.id, 'Fall 2026')]);
  assert.deepEqual(detectScheduleConflicts(p, [first, second]), [{ courseIds: [first.id, second.id], term: 'Fall 2026', days: [3], startMinutes: 630, endMinutes: 660, sections: ['L01', 'L01'] }]);
  assert.deepEqual(detectScheduleConflicts(path([planned(first.id, 'Fall 2027'), planned(second.id, 'Fall 2027')]), [first, second]), []);
  assert.deepEqual(detectScheduleConflicts(p, [first, { ...second, meetings: [{ ...second.meetings![0], startMinutes: 660 }] }]), []);
  assert.deepEqual(detectScheduleConflicts(p, catalog.courses), []);
});

test('catalog keeps dependency closure, unique IDs, current provenance and manual audit boundaries', () => {
  const ids = new Set(catalog.courses.map(c => c.id));
  assert.equal(ids.size, catalog.courses.length);
  assert.ok(catalog.courses.length >= 50);
  for (const course of catalog.courses) {
    for (const id of [...getPrerequisiteIds(course.prerequisites), ...getPrerequisiteIds(course.corequisites)]) assert.ok(ids.has(id), `${course.id}: dangling ${id}`);
    assert.ok(course.sourceUrl.startsWith('https://catalog.mit.edu/'));
    assert.ok(course.prerequisiteText?.startsWith('Prereq:'));
    assert.ok(!course.meetings?.length, 'No unverified schedule should enter the snapshot');
  }
  for (const program of catalog.programs) {
    program.courseIds.forEach(id => assert.ok(ids.has(id), `${program.id}: missing ${id}`));
    assert.equal(evaluateRequirement(program.requirements, ids, catalog.courses).state, 'review', `${program.id} must not pretend to complete a degree audit`);
  }
  assert.equal(catalog.catalogYear, '2026-2027');
  assert.deepEqual(find('6.5831').terms, []);
});
