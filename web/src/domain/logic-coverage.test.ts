import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog } from '../data/catalog';
import type { Course, Requirement, SavedPath } from './types';
import { detectScheduleConflicts, evaluateCourse, evaluateRequirement } from './requirements';

const req = (courseId: string): Requirement => ({ kind: 'course', courseId });
const all = (...items: Requirement[]): Requirement => ({ kind: 'all', items });
const any = (...items: Requirement[]): Requirement => ({ kind: 'any', items });
const get = (id: string) => catalog.courses.find(c => c.id === id)!;
const fixture = (id: string, prerequisites: Requirement | null = null): Course => ({ ...get('6.1000'), id, prerequisites, corequisites: null });
const planned = (courseId: string, term = 'Fall 2026'): SavedPath['courses'][number] => ({ courseId, term, status: 'planned' });
const completed = (courseId: string): SavedPath['courses'][number] => ({ courseId, term: 'Prior study', status: 'completed' });
const path = (...courses: SavedPath['courses']): SavedPath => ({ id: 'coverage', name: 'Coverage fixture', programId: 'major6-3', catalogYear: catalog.catalogYear, createdAt: '', updatedAt: '', courses });

test('real nested programming and algorithms choices retain the complete AND/OR structure', () => {
  const programming = get('6.1010');
  assert.equal(evaluateRequirement(programming.prerequisites, new Set(['6.1000'])).state, 'met');
  assert.equal(evaluateRequirement(programming.prerequisites, new Set(['6.100A', '16.C20'])).state, 'met');
  assert.equal(evaluateRequirement(programming.prerequisites, new Set(['6.100B'])).state, 'missing');
  const algorithms = get('6.1210');
  assert.equal(evaluateRequirement(algorithms.prerequisites, new Set(['6.100A', '6.120A', '18.05'])).state, 'met');
  assert.equal(evaluateRequirement(algorithms.prerequisites, new Set(['6.100A', '6.120A'])).state, 'missing');
});

test('overlapping count alternatives cannot spend the same subject twice and disjoint choices still work', () => {
  const overlap: Requirement = { kind: 'count', minimum: 2, items: [any(req('A'), req('B')), any(req('A'), req('C'))] };
  assert.equal(evaluateRequirement(overlap, new Set(['A'])).state, 'review');
  assert.equal(evaluateRequirement(overlap, new Set(['B', 'C'])).state, 'met');
  const spare: Requirement = { kind: 'count', minimum: 2, items: [any(req('A'), req('B')), any(req('A'), req('C')), req('D')] };
  assert.equal(evaluateRequirement(spare, new Set(['A', 'D'])).state, 'met');
  assert.equal(evaluateRequirement({ kind: 'count', minimum: 2, items: [req('A'), { kind: 'permission', text: 'Approved substitute' }] }, new Set(['A'])).state, 'review');
});

test('nested unit pools count unique known credits and leave allocation across groups for explicit review', () => {
  const courses = [fixture('A'), fixture('B'), fixture('C')];
  const pool: Requirement = { kind: 'units', minimum: 24, courseIds: ['A', 'A', 'B'] };
  assert.equal(evaluateRequirement(pool, new Set(['A']), courses).state, 'missing');
  assert.equal(evaluateRequirement(any(pool, req('C')), new Set(['C']), courses).state, 'met');
  assert.equal(evaluateRequirement(pool, new Set(['A', 'B']), courses).state, 'met');
  const audit = all(pool, { kind: 'units', minimum: 12, courseIds: ['A', 'C'] }, { kind: 'unknown', text: 'Confirm allowable overlap between degree components' });
  assert.equal(evaluateRequirement(audit, new Set(['A', 'B']), courses).state, 'review');
});

test('arranged, missing or invalid unit metadata never earns threshold credit from a placeholder', () => {
  const requirement: Requirement = { kind: 'units', minimum: 12, courseIds: ['A', 'B'] };
  for (const course of [{ ...fixture('A'), units: 99, unitsLabel: 'Units arranged' }, { ...fixture('A'), units: NaN }, { ...fixture('A'), units: -12 }]) {
    assert.equal(evaluateRequirement(requirement, new Set(['A']), [course]).state, 'review');
  }
  assert.equal(evaluateRequirement(requirement, new Set(['A']), []).state, 'review');
  assert.equal(evaluateRequirement(requirement, new Set(['A', 'B']), [{ ...fixture('A'), units: 99, unitsLabel: 'Units arranged' }, fixture('B')]).state, 'met');
  assert.equal(evaluateRequirement(requirement, new Set(), []).state, 'missing');
});

test('permission, unknown conditions and empty alternatives never become automatic approval', () => {
  assert.equal(evaluateRequirement(any(), new Set()).state, 'review');
  assert.equal(evaluateRequirement(all(req('A'), { kind: 'permission', text: 'Instructor approval' }), new Set(['A'])).state, 'review');
  assert.equal(evaluateRequirement(all(req('A'), { kind: 'unknown', text: 'Department policy' }), new Set()).state, 'missing');
  assert.equal(evaluateRequirement(any(req('A'), { kind: 'permission', text: 'Instructor approval' }), new Set(['A'])).state, 'met');
});

test('an unresolved earlier plan cannot certify a later course; a valid planned chain is conditional', () => {
  const target = get('6.1020');
  const broken = evaluateCourse(target, path(planned('6.1010'), planned(target.id, 'Spring 2027')), catalog.courses);
  assert.equal(broken.state, 'review');
  assert.match(broken.reasons[0], /6\.1010.*needs attention/);
  const valid = evaluateCourse(target, path(completed('6.1000'), planned('6.1010'), planned(target.id, 'Spring 2027')), catalog.courses);
  assert.equal(valid.state, 'met');
  assert.match(valid.reasons.join(' '), /Conditionally satisfied/);
  assert.equal(evaluateCourse(target, path(completed('6.1010'), planned(target.id, 'Spring 2027')), catalog.courses).state, 'met');
});

test('a valid OR alternative bypasses a broken unused planned route', () => {
  const courses = [fixture('GOOD'), fixture('BAD', req('MISSING')), fixture('TARGET', any(req('GOOD'), req('BAD')))];
  assert.equal(evaluateCourse(courses[2], path(completed('GOOD'), planned('BAD'), planned('TARGET', 'Spring 2027')), courses).state, 'met');
  assert.equal(evaluateCourse(courses[2], path(planned('GOOD'), planned('BAD'), planned('TARGET', 'Spring 2027')), courses).state, 'met');
  assert.equal(evaluateCourse(courses[2], path(planned('BAD'), planned('TARGET', 'Spring 2027')), courses).state, 'review');
});

test('real mutual corequisites can be concurrent when their prerequisites are established', () => {
  const p = path(completed('18.02'), completed('8.01'), completed('8.02'), planned('16.001'), planned('16.002'), planned('18.03'));
  assert.equal(evaluateCourse(get('16.001'), p, catalog.courses).state, 'met');
  assert.equal(evaluateCourse(get('16.002'), p, catalog.courses).state, 'met');
  const broken = path(completed('8.01'), completed('8.02'), planned('16.001'), planned('16.002'), planned('18.03'));
  assert.equal(evaluateCourse(get('16.001'), broken, catalog.courses).state, 'missing');
});

test('cycles and planned references absent from the catalog remain unresolved without recursion', () => {
  const courses = [fixture('A', req('B')), fixture('B', req('A'))];
  assert.equal(evaluateCourse(courses[1], path(planned('A'), planned('B', 'Spring 2027')), courses).state, 'review');
  const absent = fixture('TARGET', req('OUTSIDE'));
  assert.equal(evaluateCourse(absent, path(planned('OUTSIDE'), planned('TARGET', 'Spring 2027')), [absent]).state, 'review');
});

test('catalog unavailability is explicit while future offerings remain a separate check from prerequisites', () => {
  assert.deepEqual(get('6.5831').terms, []);
  assert.match(get('6.5831').notes!.join(' '), /Not offered in academic year 2026-2027/);
  assert.deepEqual(get('18.700').terms, ['Fall']);
  assert.equal(evaluateCourse(get('18.700'), path(completed('18.02'), planned('18.700', 'Spring 2027')), catalog.courses).state, 'met');
  // 'met' evaluates prerequisites only; the UI separately warns that the requested season differs.
});

test('selected lecture and recitation times detect only the actual overlapping section pair', () => {
  const lecture = { section: 'L01', days: [1], startMinutes: 600, endMinutes: 660, term: 'Fall 2026' };
  const recitation = { section: 'R02', days: [2], startMinutes: 660, endMinutes: 720, term: 'Fall 2026' };
  const a: Course = { ...fixture('A'), meetings: [lecture, recitation] };
  const b: Course = { ...fixture('B'), meetings: [{ ...lecture, days: [2], startMinutes: 690, endMinutes: 750 }] };
  const p = path(planned('A'), planned('B'));
  assert.deepEqual(detectScheduleConflicts(p, [a, b]).map(c => c.sections), [['R02', 'L01']]);
  const alternate = { ...a, meetings: [lecture, { ...recitation, section: 'R03', startMinutes: 840, endMinutes: 900 }] };
  assert.deepEqual(detectScheduleConflicts(p, [alternate, b]), []);
  assert.deepEqual(detectScheduleConflicts(path(planned('A'), completed('B')), [a, b]), []);
});

test('different days, different terms, invalid meetings and back-to-back meetings do not create conflicts', () => {
  const meeting = { section: 'L01', days: [1], startMinutes: 600, endMinutes: 660, term: 'Fall 2026' };
  const a = { ...fixture('A'), meetings: [meeting] };
  for (const other of [{ ...meeting, days: [2] }, { ...meeting, startMinutes: 660, endMinutes: 720 }, { ...meeting, startMinutes: 700, endMinutes: 600 }, { ...meeting, startMinutes: -1 }, { ...meeting, term: 'Spring 2027' }, { ...meeting, term: 'Someday' }]) {
    assert.deepEqual(detectScheduleConflicts(path(planned('A'), planned('B')), [a, { ...fixture('B'), meetings: [other] }]), []);
  }
  const invalidDay = { ...meeting, days: [1.5] };
  assert.deepEqual(detectScheduleConflicts(path(planned('A'), planned('B')), [{ ...a, meetings: [invalidDay] }, { ...fixture('B'), meetings: [invalidDay] }]), []);
  const repeated = { ...meeting, days: [3, 1] };
  const repeatedReordered = { ...meeting, days: [1, 3] };
  const result = detectScheduleConflicts(path(planned('A'), planned('B')), [{ ...a, meetings: [repeated, repeatedReordered] }, { ...fixture('B'), meetings: [repeated] }]);
  assert.equal(result.length, 1);
});
