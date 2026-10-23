import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog } from '../data/catalog';
import type { Course, PlannedCourse, Program, Requirement, SavedPath } from './types';
import { getProgramProgress } from './programProgress';

const req = (courseId: string): Requirement => ({ kind: 'course', courseId });
const all = (...items: Requirement[]): Requirement => ({ kind: 'all', items });
const any = (...items: Requirement[]): Requirement => ({ kind: 'any', items });
const course = (id: string, prerequisites: Requirement | null = null, extra: Partial<Course> = {}): Course => ({ id, title: id, department: '6', units: 12, unitsLabel: '12 units', level: 'undergraduate', terms: ['Fall', 'Spring'], description: '', sourceUrl: '', prerequisites, ...extra });
const completed = (courseId: string): PlannedCourse => ({ courseId, term: 'Fall 2026', status: 'completed' });
const planned = (courseId: string, term = 'Spring 2027'): PlannedCourse => ({ courseId, term, status: 'planned' });
const path = (...courses: PlannedCourse[]): SavedPath => ({ id: 'progress', name: 'Progress', programId: 'major6-3', catalogYear: catalog.catalogYear, createdAt: '', updatedAt: '', courses });
const program = (requirements: Requirement | null): Program => ({ ...catalog.programs.find(item => item.id === 'major6-3')!, requirements });

test('OR coverage uses the best meaningful branch instead of requiring every alternative', () => {
  const courses = ['A', 'B', 'C'].map(id => course(id));
  const p = program(any(req('A'), all(req('B'), req('C'))));
  assert.equal(getProgramProgress(path(completed('A')), p, courses).completedPercent, 100);
  assert.equal(getProgramProgress(path(completed('B')), p, courses).completedPercent, 50);
  const full = getProgramProgress(path(completed('B'), completed('C')), p, courses);
  assert.equal(full.completedPercent, 100);
  assert.equal(full.completedCourseCount, 2);
  assert.equal(full.mappedCourseCount, 3, 'Option-pool size must not become the progress denominator');
});

test('AND, count slots and duplicate IDs have meaningful partial coverage', () => {
  const courses = ['A', 'B', 'C'].map(id => course(id));
  assert.equal(getProgramProgress(path(completed('A')), program(all(req('A'), req('B'))), courses).completedPercent, 50);
  assert.equal(getProgramProgress(path(completed('A')), program(all(req('A'), req('A'))), courses).completedPercent, 100);
  const counted: Requirement = { kind: 'count', minimum: 2, items: [req('A'), req('A'), req('B'), req('C')] };
  assert.equal(getProgramProgress(path(completed('A')), program(counted), courses).completedPercent, 50);
  assert.equal(getProgramProgress(path(completed('A'), completed('B')), program(counted), courses).completedPercent, 100);
});

test('overlapping count alternatives need distinct course witnesses to reach 100 percent', () => {
  const courses = ['A', 'B', 'C'].map(id => course(id));
  const p = program({ kind: 'count', minimum: 2, items: [any(req('A'), req('B')), any(req('A'), req('C'))] });
  const overlap = getProgramProgress(path(completed('A')), p, courses);
  assert.equal(overlap.completedPercent, 50);
  assert.equal(overlap.reviewRequired, true);
  assert.equal(getProgramProgress(path(completed('A'), completed('B')), p, courses).completedPercent, 100, 'A valid alternative allocation should prove both slots');
  assert.equal(getProgramProgress(path(completed('B'), completed('C')), p, courses).completedPercent, 100);
});

test('units count known unique credit and arranged placeholders cannot create completion', () => {
  const courses = [course('A'), course('B'), course('UNKNOWN', null, { units: 99, unitsLabel: 'Units arranged' })];
  const p = program({ kind: 'units', minimum: 24, courseIds: ['A', 'A', 'B', 'UNKNOWN'] });
  const partial = getProgramProgress(path(completed('A'), completed('UNKNOWN')), p, courses);
  assert.equal(partial.completedPercent, 50);
  assert.equal(partial.hasUnmodeledRequirements, true);
  assert.equal(getProgramProgress(path(completed('A'), completed('B')), p, courses).completedPercent, 100);
});

test('separate overlapping credit pools stay below full coverage without an allocation proof', () => {
  const courses = ['A', 'B', 'C'].map(id => course(id));
  const p = program(all(all({ kind: 'units', minimum: 12, courseIds: ['A', 'B'] }), { kind: 'units', minimum: 12, courseIds: ['A', 'C'] }));
  const overlap = getProgramProgress(path(completed('A')), p, courses);
  assert.equal(overlap.completedPercent, 50, 'One independent pool is established, not an arbitrary near-complete score');
  assert.equal(overlap.reviewRequired, true);
  assert.equal(getProgramProgress(path(completed('A'), completed('B')), p, courses).completedPercent, 100);
});

test('planned coverage is cumulative and never changes earned history or the milestone', () => {
  const courses = [course('A'), course('B', req('A'))];
  const original = path(completed('A'), planned('B'));
  const result = getProgramProgress(original, program(all(req('A'), req('B'))), courses);
  assert.equal(result.completedPercent, 50);
  assert.equal(result.plannedPercent, 100);
  assert.equal(result.completedCourseCount, 1);
  assert.equal(result.plannedCourseCount, 2);
  assert.equal(original.courses[1].status, 'planned');
  assert.equal(original.programCompletion, undefined);
  assert.equal(getProgramProgress(path(planned('A', 'Fall 2026'), planned('B')), program(all(req('A'), req('B'))), courses).completedPercent, 0);
});

test('invalid chronology and unavailable upstream offerings cannot inflate planned coverage', () => {
  const courses = [course('A'), course('B', req('A'))];
  const sameTerm = getProgramProgress(path(planned('A'), planned('B')), program(req('B')), courses);
  assert.equal(sameTerm.plannedPercent, 0);
  assert.equal(sameTerm.provisionalPlan, true);
  const unavailable = getProgramProgress(path(planned('A', 'Fall 2026'), planned('B')), program(req('B')), [course('A', null, { terms: ['Spring'] }), courses[1]]);
  assert.equal(unavailable.plannedPercent, 0);
  assert.equal(unavailable.provisionalPlan, true);
});

test('manual conditions are excluded from numeric coursework coverage and visibly require review', () => {
  const p = program(all(req('A'), { kind: 'permission', text: 'Advisor approval' }, { kind: 'unknown', text: 'GIR and credit allocation' }));
  const result = getProgramProgress(path(completed('A')), p, [course('A')]);
  assert.equal(result.completedPercent, 100);
  assert.equal(result.label, 'Mapped coursework');
  assert.equal(result.reviewRequired, true);
  assert.equal(result.hasUnmodeledRequirements, true);
  assert.match(result.coverageLabel, /full program review/);
  const empty = getProgramProgress(path(), program({ kind: 'unknown', text: 'Not modeled' }), []);
  assert.equal(empty.completedPercent, 0);
  assert.equal(empty.reviewRequired, true);
});

test('all mapped MIT subjects can reach 100 mapped percent while every real program retains manual review', () => {
  for (const p of catalog.programs) {
    const original = { ...path(...catalog.courses.map(item => completed(item.id))), programId: p.id };
    const result = getProgramProgress(original, p, catalog.courses);
    assert.equal(result.completedPercent, 100, p.id);
    assert.equal(result.plannedPercent, 100, p.id);
    assert.equal(result.reviewRequired, true, p.id);
    assert.equal(result.hasUnmodeledRequirements, true, p.id);
    assert.equal(original.programCompletion, undefined);
  }
});
