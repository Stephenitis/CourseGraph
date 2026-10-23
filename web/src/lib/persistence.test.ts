import { strict as assert } from 'node:assert';
import { test, beforeEach } from 'node:test';
import { catalog } from '../data/catalog';
import { loadStore, saveStore, serializeStore, validateStore, type Store } from './persistence';
import { getProgramCompletionStatus, recordProgramCompletion } from '../domain/programCompletion';
import { chooseGraphCourse, removeGraphPlannedCourse } from '../domain/graphSelection';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

const fixture = (): Store => ({
  version: 1,
  selectedPathId: 'path-one',
  theme: 'mit',
  paths: [{
    id: 'path-one', name: 'My possible future', programId: catalog.programs[0].id,
    catalogYear: catalog.catalogYear, createdAt: '2026-10-23T12:00:00Z', updatedAt: '2026-10-23T12:00:00Z',
    courses: [{ courseId: '6.1010', term: 'Spring 2027', status: 'planned' }],
  }],
});

let memory: MemoryStorage;
beforeEach(() => {
  memory = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: memory, configurable: true });
});

test('saved alternatives, target term and appearance survive a fresh load', () => {
  const state = fixture();
  assert.equal(saveStore(state, catalog), null);
  assert.deepEqual(loadStore(catalog, { ...fixture(), theme: 'plain' }).store, state);
});

test('corrupted primary save recovers the last valid prior state', () => {
  const first = fixture();
  saveStore(first, catalog);
  saveStore({ ...first, theme: 'dark' }, catalog);
  memory.setItem('coursegraph.paths.v1', '{broken');
  const result = loadStore(catalog, fixture());
  assert.deepEqual(result.store, first);
  assert.match(result.notice ?? '', /recover/i);
});

test('unreadable data is preserved in recovery storage when no backup works', () => {
  memory.setItem('coursegraph.paths.v1', 'not-json');
  const result = loadStore(catalog, fixture());
  assert.match(result.notice ?? '', /preserv|recover/i);
  assert.ok([...memory.values].some(([key, value]) => key.includes('.recovery.') && value === 'not-json'));
});

test('unknown courses and duplicate path IDs are rejected on import', () => {
  const unknown = fixture();
  unknown.paths[0].courses[0].courseId = 'not-an-MIT-subject';
  assert.throws(() => validateStore(unknown, catalog));
  const duplicates = fixture();
  duplicates.paths.push({ ...duplicates.paths[0] });
  assert.throws(() => validateStore(duplicates, catalog));
});

test('oversized combined path collections are rejected by validation', () => {
  const state = fixture();
  state.paths = Array.from({ length: 101 }, (_, i) => ({ ...state.paths[0], id: `path-${i}` }));
  assert.throws(() => validateStore(state, catalog));
});

test('a different catalog year requires migration and its original saved data is preserved', () => {
  const older = fixture();
  older.paths[0].catalogYear = '2025-2026';
  assert.throws(() => validateStore(older, catalog), /catalog.*migration/i);
  const original = JSON.stringify(older);
  memory.setItem('coursegraph.paths.v1', original);
  const result = loadStore(catalog, fixture());
  assert.match(result.notice ?? '', /preserved/i);
  assert.ok([...memory.values].some(([key, value]) => key.includes('.recovery.') && value === original));
});

test('blocked browser storage reports a recoverable save failure', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('Storage blocked'); },
  });
  assert.match(saveStore(fixture(), catalog) ?? '', /failed|export/i);
  assert.match(loadStore(catalog, fixture()).notice ?? '', /unavailable|export/i);
});

test('advisor-confirmed zero and each supported pace survive serialization and a fresh load', () => {
  for (const paceUnits of [36, 48, 54]) {
    memory.clear();
    const state = fixture();
    state.paths[0] = { ...state.paths[0], remainingUnits: 0, paceUnits };
    assert.equal(saveStore(state, catalog), null);
    const restored = loadStore(catalog, fixture()).store.paths[0];
    assert.equal(restored.remainingUnits, 0, 'Explicit zero must not become an unknown estimate');
    assert.equal(restored.paceUnits, paceUnits);
    assert.equal(Object.hasOwn(restored, 'remainingUnits'), true);
  }
});

test('blank remaining units stay absent and clearing a saved estimate does not restore an old value', () => {
  const state = fixture();
  assert.equal(saveStore(state, catalog), null);
  assert.equal(Object.hasOwn(loadStore(catalog, fixture()).store.paths[0], 'remainingUnits'), false);
  const confirmed = { ...state, paths: [{ ...state.paths[0], remainingUnits: 144, paceUnits: 48 }] };
  assert.equal(saveStore(confirmed, catalog), null);
  const cleared = { ...confirmed, paths: [{ ...confirmed.paths[0], remainingUnits: undefined }] };
  assert.equal(saveStore(cleared, catalog), null);
  const restored = loadStore(catalog, fixture());
  assert.equal(restored.notice, undefined, 'A deliberately blank estimate is a valid save, not corruption');
  assert.equal(Object.hasOwn(restored.store.paths[0], 'remainingUnits'), false);
  assert.equal(restored.store.paths[0].paceUnits, 48, 'Clearing the estimate should preserve the comparison pace');
});

test('workload settings remain private to each saved path and retain their program scope', () => {
  const state = fixture();
  state.paths[0] = { ...state.paths[0], remainingUnits: 144, paceUnits: 36 };
  state.paths.push({ ...state.paths[0], id: 'math-path', name: 'Math supplement', programId: 'minor18', remainingUnits: 24, paceUnits: 48 });
  state.paths.push({ ...state.paths[0], id: 'meng-path', name: 'Graduate component', programId: 'master6-P', remainingUnits: 91, paceUnits: 54 });
  state.selectedPathId = 'math-path';
  assert.equal(saveStore(state, catalog), null);
  const restored = loadStore(catalog, fixture()).store;
  assert.equal(restored.selectedPathId, 'math-path');
  assert.deepEqual(restored.paths.map(p => [p.programId, p.remainingUnits, p.paceUnits]), [
    [catalog.programs[0].id, 144, 36], ['minor18', 24, 48], ['master6-P', 91, 54],
  ]);
});

test('imports reject invalid remaining-unit values rather than coercing blank or text to zero', () => {
  for (const remainingUnits of [-1, 10001, NaN, Infinity, -Infinity, '', '144', null, true, {}, []]) {
    const state = fixture();
    const imported: unknown = { ...state, paths: [{ ...state.paths[0], remainingUnits }] };
    assert.throws(() => validateStore(imported, catalog), /Remaining units/);
  }
  const state = fixture();
  assert.equal(validateStore({ ...state, paths: [{ ...state.paths[0], remainingUnits: 10000 }] }, catalog).paths[0].remainingUnits, 10000);
});

test('imports reject unsupported or malformed paces while older exports remain valid', () => {
  for (const paceUnits of [0, -1, 12, 60, 384, NaN, Infinity, '', '48', null, true, {}]) {
    const state = fixture();
    const imported: unknown = { ...state, paths: [{ ...state.paths[0], paceUnits }] };
    assert.throws(() => validateStore(imported, catalog), /supported workload pace/);
  }
  const restored = validateStore(JSON.parse(JSON.stringify(fixture())), catalog);
  assert.equal(Object.hasOwn(restored.paths[0], 'remainingUnits'), false);
  assert.equal(Object.hasOwn(restored.paths[0], 'paceUnits'), false);
});

test('invalid workload edits do not overwrite the last valid saved path', () => {
  const state = fixture();
  state.paths[0] = { ...state.paths[0], remainingUnits: 120, paceUnits: 48 };
  assert.equal(saveStore(state, catalog), null);
  const priorJson = memory.getItem('coursegraph.paths.v1');
  const invalid = { ...state, paths: [{ ...state.paths[0], remainingUnits: -12 }] };
  assert.match(saveStore(invalid, catalog) ?? '', /failed|export/i);
  assert.equal(memory.getItem('coursegraph.paths.v1'), priorJson);
  assert.equal(loadStore(catalog, fixture()).store.paths[0].remainingUnits, 120);
});

test('a program change can clear its old confirmed estimate without losing the selected pace', () => {
  const state = fixture();
  state.paths[0] = { ...state.paths[0], remainingUnits: 144, paceUnits: 54 };
  assert.equal(saveStore(state, catalog), null);
  // Mirrors the domain data change produced by the program selector; UI behavior is tested separately.
  const changed = { ...state, paths: [{ ...state.paths[0], programId: 'master6-P', remainingUnits: undefined }] };
  assert.equal(saveStore(changed, catalog), null);
  const restored = loadStore(catalog, fixture()).store.paths[0];
  assert.equal(restored.programId, 'master6-P');
  assert.equal(Object.hasOwn(restored, 'remainingUnits'), false, 'The bachelor estimate must not leak into the graduate component');
  assert.equal(restored.paceUnits, 54);
  assert.throws(() => validateStore({ ...changed, paths: [{ ...changed.paths[0], programId: 'unrecognized-degree' }] }, catalog), /unsupported fields/);
});

test('a user-recorded major review survives saving, export and same-path restoration with its date', () => {
  const state = fixture();
  state.paths[0] = recordProgramCompletion(state.paths[0], catalog, '2026-10-23T18:00:00.000Z');
  assert.equal(saveStore(state, catalog), null);
  const loaded = loadStore(catalog, fixture()).store;
  assert.deepEqual(loaded.paths[0].programCompletion, state.paths[0].programCompletion);
  const exported = validateStore(JSON.parse(serializeStore(loaded, catalog)), catalog);
  assert.deepEqual(exported, loaded);
  assert.equal(getProgramCompletionStatus(exported.paths[0], catalog).state, 'recorded');
});

test('legacy exports have no implicit milestone and malformed review fields fail without overwriting valid data', () => {
  const legacy = fixture();
  assert.equal(validateStore(JSON.parse(serializeStore(legacy, catalog)), catalog).paths[0].programCompletion, undefined);
  assert.equal(saveStore(legacy, catalog), null);
  const prior = memory.getItem('coursegraph.paths.v1');
  const validRecord = recordProgramCompletion(legacy.paths[0], catalog).programCompletion!;
  for (const programCompletion of [null, true, {}, { ...validRecord, advisorReviewAcknowledged: false }, { ...validRecord, confirmedAt: '2026-99-99' }]) {
    const invalid = { ...legacy, paths: [{ ...legacy.paths[0], programCompletion }] };
    assert.throws(() => validateStore(invalid, catalog), /review record is invalid/);
    assert.match(saveStore(invalid as Store, catalog) ?? '', /failed/);
    assert.equal(memory.getItem('coursegraph.paths.v1'), prior);
  }
});

test('valid but stale review scope is removed on saving and exporting instead of reviving a milestone', () => {
  const state = fixture();
  state.paths[0] = recordProgramCompletion(state.paths[0], catalog);
  for (const edit of [{ id: 'new-import-id' }, { programId: 'major6-4' }, { programCompletion: { ...state.paths[0].programCompletion!, catalogYear: '2025-2026' } }]) {
    const stale = { ...state, paths: [{ ...state.paths[0], ...edit }] };
    assert.equal(saveStore(stale, catalog), null);
    assert.equal(JSON.parse(memory.getItem('coursegraph.paths.v1')!).paths[0].programCompletion, undefined);
    assert.equal(JSON.parse(serializeStore(stale, catalog)).paths[0].programCompletion, undefined);
  }
});

test('shared history synchronization invalidates an earlier review before the store is restored', () => {
  const state = fixture();
  state.paths[0] = recordProgramCompletion(state.paths[0], catalog);
  state.paths.push({ ...fixture().paths[0], id: 'second-path', courses: [{ courseId: '18.01', term: 'Fall 2026', status: 'completed' }] });
  const restored = validateStore(state, catalog);
  assert.ok(restored.paths[0].courses.some(course => course.courseId === '18.01' && course.status === 'completed'));
  assert.equal(restored.paths[0].programCompletion, undefined, 'New shared earned history needs a fresh major review');
});

test('graph choices remain checked in the active path after reload and export without moving an existing semester', () => {
  const state = fixture();
  state.paths.push({ ...state.paths[0], id: 'alternative', courses: [{ courseId: '6.1200', term: 'Spring 2029', status: 'planned' }] });
  state.paths[0] = chooseGraphCourse(state.paths[0], '6.1200', 'Fall 2027');
  state.paths[0] = chooseGraphCourse(state.paths[0], '6.1200', 'Spring 2030');
  assert.equal(saveStore(state, catalog), null);
  const restored = loadStore(catalog, fixture()).store;
  const selected = restored.paths.find(path => path.id === restored.selectedPathId)!;
  assert.deepEqual(selected.courses.find(course => course.courseId === '6.1200'), { courseId: '6.1200', term: 'Fall 2027', status: 'planned' });
  assert.equal(selected.courses.filter(course => course.courseId === '6.1200').length, 1);
  assert.equal(restored.paths[1].courses[0].term, 'Spring 2029', 'Alternative plans keep their own semester decisions');
  assert.deepEqual(validateStore(JSON.parse(serializeStore(restored, catalog)), catalog), restored);
});

test('graph uncheck persists only planned removal and leaves shared completed history intact', () => {
  const state = fixture();
  state.paths[0].courses.unshift({ courseId: '6.100A', term: 'Fall 2026', status: 'completed' });
  state.paths.push({ ...state.paths[0], id: 'alternative', courses: [...state.paths[0].courses] });
  state.paths[0] = removeGraphPlannedCourse(state.paths[0], '6.1010');
  state.paths[0] = removeGraphPlannedCourse(state.paths[0], '6.100A');
  assert.equal(saveStore(state, catalog), null);
  const restored = loadStore(catalog, fixture()).store;
  assert.ok(!restored.paths[0].courses.some(course => course.courseId === '6.1010'));
  assert.ok(restored.paths[1].courses.some(course => course.courseId === '6.1010' && course.status === 'planned'));
  for (const path of restored.paths) {
    assert.deepEqual(path.courses.find(course => course.courseId === '6.100A'), { courseId: '6.100A', term: 'Fall 2026', status: 'completed' });
  }
});
