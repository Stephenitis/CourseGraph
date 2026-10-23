import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../data/catalog';
import type { SavedPath } from '../domain/types';
import { createPathFromShare, createSharedPathUrl, readSharedPath } from './pathShare';

const path: SavedPath = { id: 'private-id', name: 'Stephen’s future 🚀', programId: 'major6-3', catalogYear: catalog.catalogYear, createdAt: '2026-10-23', updatedAt: '2026-10-23', remainingUnits: 100, paceUnits: 48, courses: [{ courseId: '6.100A', term: 'Fall 2026', status: 'completed' }, { courseId: '6.1010', term: 'Spring 2027', status: 'planned' }] };

test('shared links round-trip Unicode choices and semesters without personal history or private metadata', () => {
  const url = new URL(createSharedPathUrl(path, catalog));
  assert.equal(url.origin, 'https://coursegraph.my');
  assert.equal(url.search, '');
  const snapshot = readSharedPath(url.hash, catalog)!;
  assert.equal(snapshot.name, path.name);
  assert.deepEqual(snapshot.courses, path.courses.map(({ courseId, term }) => ({ courseId, term })));
  assert.deepEqual(Object.keys(snapshot).sort(), ['catalogYear', 'courses', 'name', 'programId', 'version']);
  assert.ok(!JSON.stringify(snapshot).includes('completed'));
  assert.ok(!JSON.stringify(snapshot).includes('private-id'));
});

test('accepting a shared path creates a new identity and never imports another student’s earned credit', () => {
  const snapshot = readSharedPath(new URL(createSharedPathUrl(path, catalog)).hash, catalog)!;
  const copy = createPathFromShare(snapshot, catalog, [{ courseId: '18.01', term: 'Fall 2026', status: 'completed' }]);
  assert.notEqual(copy.id, path.id);
  assert.equal(copy.courses.find(c => c.courseId === '6.100A')?.status, 'planned');
  assert.equal(copy.courses.find(c => c.courseId === '18.01')?.status, 'completed');
  assert.equal(copy.programCompletion, undefined);
  assert.equal(copy.remainingUnits, undefined);
  assert.equal(copy.paceUnits, undefined);
  const ownCredit = createPathFromShare(snapshot, catalog, path.courses);
  assert.equal(ownCredit.courses.find(c => c.courseId === '6.100A')?.status, 'completed');
  assert.equal(ownCredit.courses.filter(c => c.courseId === '6.100A').length, 1);
});

test('malformed, oversized, unsupported and unknown-course shares fail without changing any path', () => {
  const before = JSON.stringify(path);
  assert.equal(readSharedPath('#section', catalog), null);
  for (const hash of ['#path=', '#path=??', '#path=abc', '#path=' + 'a'.repeat(20001)]) assert.throws(() => readSharedPath(hash, catalog));
  for (const override of [{ catalogYear: '2025-2026' }, { programId: 'unknown' }, { courses: [{ courseId: 'unknown', term: 'Fall 2026', status: 'planned' as const }] }, { courses: [...path.courses, path.courses[0]] }]) assert.throws(() => createSharedPathUrl({ ...path, ...override }, catalog));
  assert.equal(JSON.stringify(path), before);
});
