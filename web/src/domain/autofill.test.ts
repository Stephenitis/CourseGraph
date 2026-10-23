import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog } from '../data/catalog';
import { TERMS } from '../lib/persistence';
import type { Course, PlannedCourse, Program, Requirement, SavedPath } from './types';
import { buildAutofillProposal } from './autofill';
import { evaluateCourse } from './requirements';

const req = (courseId: string): Requirement => ({ kind: 'course', courseId });
const all = (...items: Requirement[]): Requirement => ({ kind: 'all', items });
const any = (...items: Requirement[]): Requirement => ({ kind: 'any', items });
const get = (id: string) => catalog.courses.find(course => course.id === id)!;
const course = (id: string, prerequisites: Requirement | null = null, extra: Partial<Course> = {}): Course => ({ ...get('6.1000'), id, title: id, prerequisites, corequisites: null, units: 12, unitsLabel: '12 units', terms: ['Fall', 'Spring'], ...extra });
const planned = (courseId: string, term = TERMS[1]): PlannedCourse => ({ courseId, term, status: 'planned' });
const completed = (courseId: string): PlannedCourse => ({ courseId, term: TERMS[0], status: 'completed' });
const path = (...courses: PlannedCourse[]): SavedPath => ({ id: 'autofill-path', name: 'Autofill', programId: 'major6-3', catalogYear: catalog.catalogYear, createdAt: '', updatedAt: '', courses });
const program = (requirements: Requirement | null): Program => ({ ...catalog.programs.find(item => item.id === 'major6-3')!, requirements });
const options = { startTerm: TERMS[0], paceUnits: 48 };

test('real MIT programming repair chooses one feasible route and preserves earned history and existing terms', () => {
  const original = path(completed('6.100A'), planned('6.1010'));
  const result = buildAutofillProposal(original, program(null), catalog.courses, TERMS, options);
  assert.equal(result.hasChanges, true);
  assert.equal(result.moves.length, 0);
  assert.deepEqual(result.assignments.slice(0, original.courses.length), original.courses);
  assert.equal(result.additions.length, 1);
  assert.equal(result.additions[0].courseId, '6.100B', 'Reuse completed 6.100A through the smaller 6-unit continuation instead of a redundant 9-unit introduction');
  assert.equal(result.additions[0].term, TERMS[0]);
  assert.equal(result.additions[0].status, 'planned');
  assert.equal(evaluateCourse(get('6.1010'), { ...original, courses: result.assignments }, catalog.courses).state, 'met');
  assert.equal(original.courses.length, 2, 'Proposals do not mutate the undo snapshot');
  assert.ok(result.choices.some(choice => choice.selectedIds.length === 1 && choice.automatic));
});

test('a larger feasible alternative wins over a smaller branch with no earlier offering', () => {
  const courses = [course('TARGET', any(req('SMALL'), all(req('A'), req('B')))), course('SMALL', null, { terms: ['Spring'] }), course('A'), course('B')];
  const result = buildAutofillProposal(path(planned('TARGET')), program(null), courses, TERMS, options);
  assert.deepEqual(result.additions.map(item => item.courseId).sort(), ['A', 'B']);
  assert.equal(result.unscheduled.length, 0);
  assert.ok(!result.assignments.some(item => item.courseId === 'SMALL'));
});

test('failed branches and too-short horizons leave no speculative courses behind', () => {
  const courses = [course('TARGET', any(all(req('EASY'), req('BLOCKED')), req('OTHER'))), course('EASY'), course('BLOCKED', null, { terms: [] }), course('OTHER', req('DEEP')), course('DEEP')];
  const original = path(planned('TARGET'));
  const result = buildAutofillProposal(original, program(null), courses, TERMS, options);
  assert.deepEqual(result.assignments, original.courses);
  assert.equal(result.hasChanges, false);
  assert.equal(result.unscheduled[0].courseId, 'TARGET');
  const lateStart = buildAutofillProposal(path(planned('TARGET')), program(null), [course('TARGET', req('EASY')), course('EASY')], TERMS, { ...options, startTerm: TERMS[1] });
  assert.equal(lateStart.additions.length, 0);
});

test('existing later assignments are not silently moved and unrelated existing work is preserved', () => {
  const original = path(planned('A', TERMS[2]), planned('TARGET', TERMS[1]), planned('EXTRA', TERMS[0]));
  const courses = [course('TARGET', req('A')), course('A'), course('EXTRA')];
  const result = buildAutofillProposal(original, program(null), courses, TERMS, options);
  assert.deepEqual(result.assignments, original.courses);
  assert.deepEqual(result.moves, []);
  assert.ok(result.unscheduled.some(item => item.courseId === 'TARGET'));
});

test('manual rules remain visible and an impossible prerequisite cycle adds nothing', () => {
  const permission: Requirement = { kind: 'permission', text: 'Instructor approval required' };
  const manual = buildAutofillProposal(path(planned('TARGET')), program(null), [course('TARGET', all(req('A'), permission)), course('A')], TERMS, options);
  assert.ok(manual.reviewNotes.some(note => note.includes('Instructor approval')));
  assert.equal(manual.additions[0].courseId, 'A');
  const cyclic = buildAutofillProposal(path(planned('TARGET', TERMS[3])), program(null), [course('TARGET', req('A')), course('A', req('B')), course('B', req('A'))], TERMS, options);
  assert.equal(cyclic.additions.length, 0);
  assert.ok(cyclic.reviewNotes.some(note => /cycle/.test(note)));
  const missing = buildAutofillProposal(path(planned('TARGET')), program(null), [course('TARGET', req('OUTSIDE'))], TERMS, options);
  assert.ok(missing.reviewNotes.some(note => /outside/.test(note)));
});

test('same-term and genuine mutual corequisites can be added without weakening prerequisite timing', () => {
  const courses = [course('A', null, { corequisites: req('B') }), course('B', null, { corequisites: req('A') })];
  const result = buildAutofillProposal(path(planned('A', TERMS[0])), program(null), courses, TERMS, options);
  assert.deepEqual(result.additions, [planned('B', TERMS[0])]);
  assert.equal(result.unscheduled.length, 0);
  const invalid = buildAutofillProposal(path(planned('A', TERMS[0])), program(null), [course('A', req('B')), course('B')], TERMS, options);
  assert.equal(invalid.additions.length, 0);
});

test('known capacity limits block overfilling and duplicate shared prerequisites are only added once', () => {
  const courses = [course('A'), course('ONE', req('A')), course('TWO', req('A')), course('FULL', null, { units: 48 })];
  const shared = buildAutofillProposal(path(planned('ONE'), planned('TWO')), program(null), courses, TERMS, options);
  assert.equal(shared.additions.filter(item => item.courseId === 'A').length, 1);
  const full = buildAutofillProposal(path(planned('FULL', TERMS[0]), planned('ONE')), program(null), courses, TERMS, options);
  assert.equal(full.additions.length, 0);
  assert.ok(full.reviewNotes.some(note => /capacity/.test(note)));
});

test('program mode uses actual requirement choices, exposes moves, and never adds every program option', () => {
  const courses = [course('A'), course('B'), course('C', req('A')), course('UNRELATED')];
  const p = { ...program(all(req('C'), any(req('A'), req('B')), { kind: 'unknown' as const, text: 'Complete institute requirements' })), courseIds: ['A', 'B', 'C', 'UNRELATED'] };
  const original = path(planned('C', TERMS[0]));
  const result = buildAutofillProposal(original, p, courses, TERMS, { ...options, mode: 'program' });
  assert.deepEqual(result.additions.map(item => item.courseId), ['A']);
  assert.deepEqual(result.moves, [{ courseId: 'C', fromTerm: TERMS[0], toTerm: TERMS[1] }]);
  assert.equal(result.assignments.every(item => item.status === 'planned'), true);
  assert.ok(result.reviewNotes.some(note => /institute requirements/.test(note)));
  assert.ok(!result.assignments.some(item => ['B', 'UNRELATED'].includes(item.courseId)));
});

test('choice keys are stable and an explicit different branch recomputes without mutating prior proposals', () => {
  const courses = [course('TARGET', any(req('A'), req('B'))), course('A'), course('B')];
  const original = path(planned('TARGET'));
  const first = buildAutofillProposal(original, program(null), courses, TERMS, options);
  const choice = first.choices.find(group => group.id === 'course:TARGET:prerequisites')!;
  const changed = buildAutofillProposal(original, program(null), courses, TERMS, { ...options, choices: { [choice.id]: ['option-1'] } });
  assert.deepEqual(first.additions.map(item => item.courseId), ['A']);
  assert.deepEqual(changed.additions.map(item => item.courseId), ['B']);
  assert.equal(changed.choices[0].automatic, false);
});

test('program count and known-unit pools choose bounded subsets instead of all catalog options', () => {
  const courses = [course('A'), course('B'), course('C')];
  for (const requirements of [{ kind: 'count' as const, minimum: 2, items: [req('A'), req('B'), req('C')] }, { kind: 'units' as const, minimum: 24, courseIds: ['A', 'A', 'B', 'C'] }]) {
    const result = buildAutofillProposal(path(), program(requirements), courses, TERMS, { ...options, mode: 'program' });
    assert.equal(result.additions.length, 2);
    assert.ok(result.termLoads.every(load => load.knownUnits <= 48));
  }
});

test('all four real MIT program proposals remain bounded, planned-only and explicitly incomplete', () => {
  for (const p of catalog.programs) {
    const original = { ...path(), programId: p.id };
    const result = buildAutofillProposal(original, p, catalog.courses, TERMS, { ...options, mode: 'program' });
    assert.ok(result.additions.length > 0, p.id);
    assert.equal(new Set(result.assignments.map(item => item.courseId)).size, result.assignments.length);
    assert.ok(result.assignments.every(item => item.status === 'planned' && TERMS.includes(item.term) && catalog.courses.some(c => c.id === item.courseId)));
    assert.ok(result.termLoads.every(load => load.knownUnits <= 48));
    assert.ok(result.reviewNotes.some(note => /cannot establish a complete/.test(note)));
    assert.equal(original.programCompletion, undefined);
  }
});

test('an impossible program alternative is a single unresolved choice, not every alternative being mandatory', () => {
  const courses = [course('A', null, { terms: [] }), course('B', null, { terms: [] })];
  const result = buildAutofillProposal(path(), program(any(req('A'), req('B'))), courses, TERMS, { ...options, mode: 'program' });
  assert.equal(result.additions.length, 0);
  assert.equal(result.unscheduled.length, 0, 'An unresolved OR group must not label both candidates as required missing courses');
  assert.equal(result.allSelectedCoursesScheduled, false);
  assert.ok(result.reviewNotes.some(note => /alternative/.test(note)));
});

test('unknown unit workload is disclosed, and invalid options or mismatched programs cannot change a path', () => {
  const courses = [course('TARGET', req('ARRANGED')), course('ARRANGED', null, { units: 0, unitsLabel: 'Units arranged' })];
  const original = path(planned('TARGET'));
  const result = buildAutofillProposal(original, program(null), courses, TERMS, options);
  assert.ok(result.termLoads.some(load => load.unknownUnitCourseIds.includes('ARRANGED')));
  assert.ok(result.reviewNotes.some(note => /unknown or arranged/.test(note)));
  for (const mode of ['prerequisites', 'program'] as const) {
    for (const invalid of [{ ...options, startTerm: 'Unknown term' }, { ...options, paceUnits: NaN }, { ...options, paceUnits: 0 }]) {
      const noChange = buildAutofillProposal(original, program(req('TARGET')), courses, TERMS, { ...invalid, mode });
      assert.deepEqual(noChange.assignments, original.courses);
      assert.equal(noChange.allSelectedCoursesScheduled, false);
    }
  }
  const mismatch = buildAutofillProposal(original, { ...program(null), id: 'minor18' }, courses, TERMS, options);
  assert.deepEqual(mismatch.assignments, original.courses);
  assert.equal(mismatch.hasChanges, false);
});

test('duplicate counted items cannot create a fulfilled count and overlapping groups require review', () => {
  const courses = [course('A'), course('B'), course('C')];
  const duplicate: Requirement = { kind: 'count', minimum: 2, items: [req('A'), req('A')] };
  const result = buildAutofillProposal(path(), program(duplicate), courses, TERMS, { ...options, mode: 'program' });
  assert.equal(result.additions.length, 0, 'A failed count branch must roll back its speculative subjects');
  assert.equal(result.allSelectedCoursesScheduled, false);
  assert.ok(result.reviewNotes.some(note => /distinct requirements/.test(note)));
  const overlap: Requirement = { kind: 'count', minimum: 2, items: [any(req('A'), req('B')), any(req('A'), req('C'))] };
  const reviewed = buildAutofillProposal(path(), program(overlap), courses, TERMS, { ...options, mode: 'program' });
  assert.ok(reviewed.reviewNotes.some(note => /overlap|allocation/.test(note)));
});

test('the full builder seed repairs programming while retaining independent timing and offering warnings', () => {
  const original = path(completed('6.100A'), completed('18.01'), completed('8.01'), ...['6.1010', '6.1200', '6.1210', '18.02', '6.1220', '6.1020'].map((id, index) => planned(id, TERMS[Math.min(1 + Math.floor(index / 3), 4)])));
  const result = buildAutofillProposal(original, catalog.programs.find(p => p.id === original.programId)!, catalog.courses, TERMS, options);
  assert.deepEqual(result.additions, [planned('6.100B', TERMS[0])]);
  assert.deepEqual(result.moves, []);
  assert.deepEqual(result.assignments.slice(0, original.courses.length), original.courses);
  assert.deepEqual(result.unscheduled.map(item => item.courseId).sort(), ['6.1020', '6.1210', '6.1220']);
  assert.ok(result.reviewNotes.some(note => /6\.1200.*too late/.test(note)));
  assert.ok(result.reviewNotes.some(note => /6\.1020.*offering pattern/.test(note)));
});

test('program mode prefers a later concrete chain while preserving an explicitly selected permission branch', () => {
  const courses = [course('TARGET', any(req('A'), { kind: 'permission', text: 'Permission of instructor' })), course('A', req('B')), course('B')];
  const p = program(req('TARGET'));
  const automatic = buildAutofillProposal(path(), p, courses, TERMS, { ...options, mode: 'program' });
  assert.deepEqual(automatic.assignments.map(item => [item.courseId, item.term]), [['TARGET', TERMS[2]], ['A', TERMS[1]], ['B', TERMS[0]]]);
  assert.equal(evaluateCourse(courses[0], { ...path(), courses: automatic.assignments }, courses).state, 'met');
  assert.ok(!automatic.reviewNotes.some(note => /Permission of instructor/.test(note)));

  const explicit = buildAutofillProposal(path(), p, courses, TERMS, { ...options, mode: 'program', choices: { 'course:TARGET:prerequisites': ['option-1'] } });
  assert.deepEqual(explicit.additions, [planned('TARGET', TERMS[0])]);
  assert.ok(explicit.reviewNotes.some(note => /Permission of instructor/.test(note)));
  assert.deepEqual(explicit.choices[0].selectedIds, ['option-1']);
  assert.equal(explicit.choices[0].automatic, false);
});

test('real 6-3 program autofill builds the concrete digital-systems prerequisite chain within eight terms', () => {
  const p = catalog.programs.find(item => item.id === 'major6-3')!;
  const result = buildAutofillProposal(path(), p, catalog.courses, TERMS, { ...options, mode: 'program' });
  assert.ok(result.assignments.some(item => item.courseId === '8.02'));
  assert.ok(result.assignments.some(item => item.courseId === '6.1903'));
  assert.deepEqual(result.choices.find(choice => choice.id === 'course:6.1910:prerequisites')?.selectedIds, ['option-0']);
  const proposed = { ...path(), courses: result.assignments };
  assert.equal(evaluateCourse(get('6.1910'), proposed, catalog.courses).state, 'met');
  assert.equal(evaluateCourse(get('6.1800'), proposed, catalog.courses).state, 'met');
  assert.equal(result.unscheduled.length, 0);
  assert.ok(result.termLoads.every(load => load.knownUnits <= 48));
});

test('real mathematics minor chooses six distinct-credit subjects including three advanced subjects', () => {
  const p = catalog.programs.find(item => item.id === 'minor18')!;
  const original = { ...path(), programId: p.id };
  const result = buildAutofillProposal(original, p, catalog.courses, TERMS, { ...options, mode: 'program' });
  const ids = new Set(result.assignments.map(item => item.courseId));
  for (const [a, b] of [['18.03', '18.032'], ['18.06', '18.C06'], ['18.06', '18.700'], ['18.100A', '18.100B'], ['18.100A', '18.100P'], ['18.100B', '18.100P']]) {
    assert.ok(!(ids.has(a) && ids.has(b)), `${a} and ${b} must not both be automatically selected for credit`);
  }
  assert.equal(p.courseIds.filter(id => ids.has(id)).length, 6);
  assert.equal(['18.100A', '18.100B', '18.100P', '18.200', '18.404', '18.600', '18.650', '18.700', '18.701'].filter(id => ids.has(id)).length, 3);
  assert.equal(result.unscheduled.length, 0);
  assert.ok(result.reviewNotes.some(note => /essentially different content/.test(note)));
});

test('official credit exclusions respect existing choices and never silently replace a manual alternative', () => {
  const courses = [course('A', null, { notes: ['Credit cannot also be received for: B. Double-counting requires review.'] }), course('B'), course('C')];
  const original = path(completed('A'));
  const p = program(any(req('B'), req('C')));
  const automatic = buildAutofillProposal(original, p, courses, TERMS, { ...options, mode: 'program' });
  assert.deepEqual(automatic.additions, [planned('C', TERMS[0])]);
  assert.deepEqual(automatic.assignments[0], original.courses[0]);

  const explicit = buildAutofillProposal(original, p, courses, TERMS, { ...options, mode: 'program', choices: { 'program:major6-3/0': ['option-0'] } });
  assert.deepEqual(explicit.assignments, original.courses);
  assert.equal(explicit.allSelectedCoursesScheduled, false);
  assert.ok(explicit.reviewNotes.some(note => /credit cannot also be received/.test(note)));

  const existingConflict = path(completed('A'), planned('B', TERMS[2]));
  const kept = buildAutofillProposal(existingConflict, program(null), courses, TERMS, options);
  assert.deepEqual(kept.assignments, existingConflict.courses);
  assert.ok(kept.reviewNotes.some(note => /Existing coursework was preserved/.test(note)));
});

test('MEng autocomplete explicitly discloses that its two modeled subjects do not form a complete graduate plan', () => {
  const p = catalog.programs.find(item => item.id === 'master6-P')!;
  const original = { ...path(), programId: p.id };
  const result = buildAutofillProposal(original, p, catalog.courses, TERMS, { ...options, mode: 'program' });
  assert.deepEqual(result.additions.map(item => item.courseId).sort(), ['6.9830', '6.THM']);
  assert.ok(result.reviewNotes.some(note => /only 2 required program subjects/.test(note) && /not a complete graduate study plan/.test(note)));
  assert.ok(result.reviewNotes.some(note => /48 units/.test(note) && /18 units/.test(note)));
  assert.equal(result.termLoads[0].knownUnits, 1, 'Arranged thesis credit must not be invented');
  assert.deepEqual(result.termLoads[0].unknownUnitCourseIds, ['6.THM']);
});

test('the retired 6.1904 offering is not auto-scheduled but historical credit remains intact', () => {
  assert.deepEqual(get('6.1904').terms, []);
  assert.deepEqual(get('6.1903').terms, ['Fall', 'Spring']);
  const p = program(any(req('6.1904'), req('6.1903')));
  const result = buildAutofillProposal(path(completed('6.100A')), p, catalog.courses, TERMS, { ...options, mode: 'program' });
  assert.ok(result.additions.some(item => item.courseId === '6.1903'));
  assert.ok(!result.additions.some(item => item.courseId === '6.1904'));
  const original = path(completed('6.1904'));
  const historical = buildAutofillProposal(original, p, catalog.courses, TERMS, { ...options, mode: 'program' });
  assert.deepEqual(historical.assignments, original.courses);
  assert.equal(historical.hasChanges, false);
});
