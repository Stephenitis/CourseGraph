import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseGraphCourse, removeGraphPlannedCourse } from './graphSelection';
import type { SavedPath } from './types';

const fixture = (): SavedPath => ({
  id: 'active-path', name: 'My path', programId: 'major6-3', catalogYear: '2026-2027',
  createdAt: '2026-10-23T12:00:00Z', updatedAt: '2026-10-23T12:00:00Z',
  remainingUnits: 144, paceUnits: 48,
  courses: [
    { courseId: '6.100A', term: 'Fall 2026', status: 'completed' },
    { courseId: '6.1010', term: 'Spring 2027', status: 'planned' },
  ],
});

test('initial choice adds one planned assignment without changing the Undo snapshot or path metadata', () => {
  const before = fixture();
  const snapshot = structuredClone(before);
  Object.freeze(before.courses);
  Object.freeze(before);
  const chosen = chooseGraphCourse(before, '6.1200', 'Fall 2027');
  assert.deepEqual(before, snapshot);
  assert.deepEqual(chosen.courses, [...snapshot.courses, { courseId: '6.1200', term: 'Fall 2027', status: 'planned' }]);
  assert.deepEqual({ ...chosen, courses: snapshot.courses }, snapshot);
});

test('repeated choice preserves an existing planned semester and returns the same path for a no-op', () => {
  const before = fixture();
  assert.equal(chooseGraphCourse(before, '6.1010', 'Spring 2030'), before);
  assert.equal(before.courses.find(course => course.courseId === '6.1010')?.term, 'Spring 2027');
  const chosen = chooseGraphCourse(before, '6.1200', 'Fall 2027');
  assert.equal(chooseGraphCourse(chosen, '6.1200', 'Spring 2028'), chosen);
  assert.equal(chosen.courses.filter(course => course.courseId === '6.1200').length, 1);
});

test('neither choosing nor unchecking an earned subject alters completed history', () => {
  const before = fixture();
  assert.equal(chooseGraphCourse(before, '6.100A', 'Spring 2030'), before);
  assert.equal(removeGraphPlannedCourse(before, '6.100A'), before);
  assert.deepEqual(before.courses[0], { courseId: '6.100A', term: 'Fall 2026', status: 'completed' });
});

test('explicit uncheck removes only the selected planned assignment and can be reversed using its original snapshot', () => {
  const before = fixture();
  const removed = removeGraphPlannedCourse(before, '6.1010');
  assert.deepEqual(removed.courses, [before.courses[0]]);
  assert.equal(before.courses.length, 2);
  assert.equal(removeGraphPlannedCourse(removed, '6.1010'), removed);
  assert.equal(removeGraphPlannedCourse(removed, 'not-selected'), removed);
  assert.deepEqual(chooseGraphCourse(removed, '6.1010', 'Spring 2027'), before);
});
