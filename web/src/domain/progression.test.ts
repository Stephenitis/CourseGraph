import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog } from '../data/catalog';
import type { Course, Program, Requirement } from './types';
import { getCourseStage, getProgramCourseClosure } from './progression';

const req = (courseId: string): Requirement => ({ kind: 'course', courseId });
const fixture = (id: string, prerequisites: Requirement | null = null, corequisites: Requirement | null = null): Course => ({ ...catalog.courses[0], id, level: 'undergraduate', prerequisites, corequisites });
const get = (id: string) => catalog.courses.find(course => course.id === id)!;

test('MIT curriculum roles replace prerequisite-depth ratings and graduate level wins', () => {
  const cs = catalog.programs.find(p => p.id === 'major6-3')!;
  for (const [id, label, order] of [['6.1000', 'Foundation', 0], ['6.1210', 'Foundation', 0], ['6.1020', 'Core', 1], ['6.1220', 'Core', 1], ['6.1810', 'Advanced', 2], ['6.5831', 'Advanced', 2], ['6.7900', 'Graduate', 3]] as const) {
    const result = getCourseStage(get(id), catalog.courses, cs);
    assert.equal(result.label, label, id);
    assert.equal(result.order, order, id);
    assert.ok(result.sourceUrl.startsWith('https://'));
    assert.doesNotMatch(result.explanation, /inferred|provisional/i);
  }
  const unusualGraduate = { ...get('6.1000'), level: 'graduate' as const };
  assert.equal(getCourseStage(unusualGraduate, catalog.courses, cs).label, 'Graduate', 'Published subject level has priority over a curriculum map');
});

test('a program-specific Center role overrides a general department entry-point label', () => {
  const cs = catalog.programs.find(p => p.id === 'major6-3')!;
  const ai = catalog.programs.find(p => p.id === 'major6-4')!;
  assert.equal(getCourseStage(get('6.3900'), catalog.courses, cs).label, 'Foundation');
  assert.equal(getCourseStage(get('6.3900'), catalog.courses, ai).label, 'Core');
  assert.equal(getCourseStage(get('6.3000'), catalog.courses, ai).label, 'Core');
  assert.equal(getCourseStage(get('18.06'), catalog.courses, ai).sourceLabel, 'MIT 6-4 Fundamentals');
  assert.equal(getCourseStage(get('6.3100'), catalog.courses, ai).label, 'Advanced', 'An explicit official advanced designation remains visible even in a Center group');
});

test('official science foundations and mathematics advanced groups are explicit and sourced', () => {
  const minor = catalog.programs.find(p => p.id === 'minor18')!;
  for (const id of ['18.01', '18.01A', '18.02', '18.022', '8.01', '8.022', '18.03', '18.06']) {
    const result = getCourseStage(get(id), catalog.courses, minor);
    assert.equal(result.label, 'Foundation', id);
    assert.match(result.sourceUrl, /general-institute-requirements/);
  }
  for (const id of ['18.100A', '18.100Q', '18.200', '18.404', '18.600', '18.650', '18.700', '18.701']) {
    const result = getCourseStage(get(id), catalog.courses, minor);
    assert.equal(result.label, 'Advanced', id);
    assert.match(result.sourceUrl, /science\/mathematics/);
  }
});

test('large numbers, deep chains, missing references and cycles cannot invent curriculum roles', () => {
  const courses = [fixture('A'), fixture('B', req('A')), fixture('C', req('B')), fixture('6.9999', req('C'))];
  const a = fixture('X', req('Y')), b = fixture('Y', req('X'));
  for (const item of [...courses, a, b, fixture('18.999', req('OUTSIDE'))]) {
    const result = getCourseStage(item, [...courses, a, b]);
    assert.equal(result.label, 'Undergraduate', item.id);
    assert.equal(result.order, 1);
    assert.equal(result.sourceUrl, item.sourceUrl);
  }
});

test('every current subject has a source-backed role or published-level fallback without a student credit-status claim', () => {
  for (const program of catalog.programs) {
    for (const course of catalog.courses) {
      const result = getCourseStage(course, catalog.courses, program);
      assert.ok(['Foundation', 'Core', 'Advanced', 'Graduate', 'Undergraduate'].includes(result.label));
      assert.match(result.sourceUrl, /^https:\/\/(?:catalog|www\.eecs)\.mit\.edu\//);
      assert.doesNotMatch(result.explanation, /inferred|provisional|transfer credit awarded/i);
      assert.ok(!('prerequisiteDepth' in result), 'Graph depth must not reappear as a curriculum label');
    }
  }
});

test('full program closure includes modeled choices, recursive basics, corequisites and additional planned courses once', () => {
  const courses = [fixture('A'), fixture('B', req('A')), fixture('C', req('B'), req('D')), fixture('D', null, req('C')), fixture('E')];
  const program: Program = { id: 'test', name: 'Test', shortName: 'Test', kind: 'major', courseIds: ['C'], requirements: { kind: 'any', items: [req('C'), req('E')] }, sourceUrl: '', notes: [] };
  const result = getProgramCourseClosure(program, courses, ['A', 'OUTSIDE']);
  assert.deepEqual(new Set(result.courseIds), new Set(['A', 'B', 'C', 'D', 'E']));
  assert.equal(result.courseIds.length, 5);
  assert.deepEqual(result.missingCourseIds, ['OUTSIDE']);
});

test('every imported program expands without dangling references and includes basic foundations', () => {
  for (const program of catalog.programs) {
    const result = getProgramCourseClosure(program, catalog.courses);
    assert.deepEqual(result.missingCourseIds, [], program.id);
    program.courseIds.forEach(id => assert.ok(result.courseIds.includes(id)));
    assert.ok(result.courseIds.includes('18.01'), program.id);
    assert.equal(result.courseIds.length, new Set(result.courseIds).size);
  }
  const ai = getProgramCourseClosure(catalog.programs.find(p => p.id === 'major6-4')!, catalog.courses);
  assert.ok(ai.courseIds.includes('8.02'));
  assert.ok(ai.courseIds.includes('16.002'));
});
