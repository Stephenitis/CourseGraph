import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog } from '../data/catalog';
import type { Course, SavedPath } from './types';
import { estimateRemainingSemesters, getCreditLimit, getMappedRequirementProgress, getPlannedHorizon, paceScenarios, programRequirementSummaries, projectCapacity, summarizeTermWorkload, workloadGuidance } from './workload';

const path = (courses: SavedPath['courses']): SavedPath => ({ id: 'workload-test', name: 'Test', programId: 'major6-3', courses, createdAt: '', updatedAt: '', catalogYear: '2026-2027' });
const planned = (courseId: string, term: string): SavedPath['courses'][number] => ({ courseId, term, status: 'planned' });
const fixture = (id: string, units: number, unitsLabel = `${units} units`): Course => ({ ...catalog.courses[0], id, units, unitsLabel });

test('MIT guidance distinguishes normal load, first-year caps and degree component totals', () => {
  assert.equal(workloadGuidance.averageUnitsPerRegularTerm, 48);
  assert.deepEqual(paceScenarios.map(s => s.unitsPerTerm), [36, 48, 54]);
  assert.equal(getCreditLimit('Fall 2026', { isFirstYear: true }).regularUnitCap, 54);
  assert.equal(getCreditLimit('Spring 2027', { isFirstYear: true }).regularUnitCap, 60);
  assert.equal(getCreditLimit('IAP 2027').regularUnitCap, 12);
  assert.equal(getCreditLimit('Spring 2027').regularUnitCap, null);
  assert.equal(getCreditLimit('Spring 2027', { isFirstYear: true, onAcademicWarning: true }).regularUnitCap, 48);
  assert.equal(getCreditLimit('Spring 2027', { isFirstYear: true, onAcademicWarning: true }).maximumSubjects, 4);
  assert.deepEqual(programRequirementSummaries['major6-3'].unitsBeyondGIRs, { min: 180, max: 198 });
  assert.deepEqual(programRequirementSummaries['major6-4'].unitsBeyondGIRs, { min: 180, max: 189 });
  assert.equal(programRequirementSummaries['major6-3'].componentUnits, undefined);
  assert.equal(programRequirementSummaries.minor18.componentUnits, 72);
  assert.equal(programRequirementSummaries['master6-P'].componentUnits, 91);
});

test('unknown or invalid remaining units never become zero or a guessed degree total', () => {
  for (const remaining of [null, undefined, -1, NaN, Infinity]) assert.equal(estimateRemainingSemesters(remaining, 48), null);
  for (const pace of [0, -1, NaN, Infinity]) assert.equal(estimateRemainingSemesters(96, pace), null);
  assert.equal(estimateRemainingSemesters(0, 48), 0);
  assert.equal(estimateRemainingSemesters(145, 48), 4);
  assert.equal(projectCapacity(null, 48, 'Fall 2026').terms.length, 0);
});

test('capacity scenarios preserve remaining units and alternate regular terms without summer assumptions', () => {
  const projection = projectCapacity(150, 54, 'Fall 2026');
  assert.equal(projection.semesters, 3);
  assert.deepEqual(projection.terms, [{ term: 'Fall 2026', units: 54 }, { term: 'Spring 2027', units: 54 }, { term: 'Fall 2027', units: 42 }]);
  assert.equal(projection.terms.reduce((total, item) => total + item.units, 0), 150);
  assert.match(projection.limitation, /not scheduled courses or a graduation date/);
  assert.deepEqual(projectCapacity(96, 48, 'Spring 2027').terms.map(t => t.term), ['Spring 2027', 'Fall 2027']);
  assert.deepEqual(projectCapacity(48, 48, 'IAP 2027').terms, []);
});

test('term workload counts only planned unique courses and keeps arranged credit unknown', () => {
  const courses = [fixture('A', 12), fixture('B', 6), fixture('THESIS', 0, 'Units arranged')];
  const p = path([planned('A', 'Fall 2026'), planned('A', 'fall-2026'), planned('B', 'Spring 2027'), { courseId: 'B', term: 'Fall 2026', status: 'completed' }]);
  const load = summarizeTermWorkload(p, courses, 'Fall 2026');
  assert.equal(load.knownUnits, 12);
  assert.equal(load.courseCount, 1);
  assert.equal(load.approximateWeeklyHours, 12);
  assert.equal(load.approximateTermHours, 168);
  const thesis = summarizeTermWorkload(path([planned('THESIS', 'Fall 2026')]), courses, 'Fall 2026');
  assert.equal(thesis.band, 'unknown');
  assert.equal(thesis.approximateWeeklyHours, null);
  assert.deepEqual(thesis.unknownUnitCourseIds, ['THESIS']);
  const iap = summarizeTermWorkload(path([planned('A', 'IAP 2027')]), courses, 'IAP 2027');
  assert.equal(iap.approximateWeeklyHours, null);
  assert.equal(iap.approximateTermHours, 168);
});

test('loads flag regular-unit caps separately from restricted discovery allowances', () => {
  const courses = [fixture('A', 60)];
  const load = summarizeTermWorkload(path([planned('A', 'Fall 2026')]), courses, 'Fall 2026', { isFirstYear: true });
  assert.equal(load.exceedsRegularUnitCap, true);
  assert.equal(load.limit.additionalDiscoveryUnits, 6);
  assert.equal(load.band, 'above-typical');
  const courses2 = ['A', 'B', 'C', 'D', 'E'].map(id => fixture(id, 6));
  const warning = summarizeTermWorkload(path(courses2.map(c => planned(c.id, 'Spring 2027'))), courses2, 'Spring 2027', { isFirstYear: true, onAcademicWarning: true });
  assert.equal(warning.exceedsSubjectCap, true);
  assert.equal(warning.exceedsRegularUnitCap, false);
});

test('planned horizon excludes completed history and reveals empty intervening semesters', () => {
  const p = path([planned('A', 'Fall 2026'), planned('B', 'Spring 2028'), { courseId: 'C', term: 'Fall 2030', status: 'completed' }]);
  assert.deepEqual(getPlannedHorizon(p), { firstPlannedTerm: 'Fall 2026', lastPlannedTerm: 'Spring 2028', plannedTermCount: 2, regularSemesterSpan: 4, unknownTerms: [], label: 'Last term with a selected course; not a graduation estimate.' });
  const unknown = getPlannedHorizon(path([planned('A', 'Someday')]));
  assert.equal(unknown.lastPlannedTerm, null);
  assert.deepEqual(unknown.unknownTerms, ['Someday']);
  assert.equal(getPlannedHorizon(path([])).regularSemesterSpan, null);
});

test('mapped coverage reports groups, preserves unknown audit rules and never treats all alternatives as courses owed', () => {
  const program = catalog.programs.find(p => p.id === 'major6-4')!;
  const p = path([{ courseId: '6.1000', term: 'Before planning', status: 'completed' }, planned('6.1010', 'Fall 2026')]);
  const result = getMappedRequirementProgress(program, p, catalog.courses);
  assert.equal(result.mappedGroups, 7);
  assert.equal(result.completedGroups, 1);
  assert.equal(result.plannedGroups, 1);
  assert.equal(result.remainingGroups.length, 5);
  assert.ok(result.reviewReasons.length > 0);
  const all = getMappedRequirementProgress(program, path(catalog.courses.map(c => planned(c.id, 'Fall 2026'))), catalog.courses);
  assert.equal(all.remainingGroups.length, 0);
  assert.ok(all.reviewReasons.length > 0);
  assert.match(all.note, /not a count of remaining subjects, units or degree completion/);
});
