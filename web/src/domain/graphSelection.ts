import type { Course, SavedPath } from './types';
import { evaluateCourse, getDownstreamIds } from './requirements';

/**
 * Add a known catalog subject in the selected semester. An already selected
 * subject is unchanged; the graph's removal action uses a separate proposal.
 * Callers validate catalog/term selections; persistence also validates them.
 * Returning the same path for no-ops lets the UI avoid unnecessary Undo entries.
 */
export function chooseGraphCourse(path: SavedPath, courseId: string, term: string): SavedPath {
  if (path.courses.some(course => course.courseId === courseId)) return path;
  return { ...path, courses: [...path.courses, { courseId, term, status: 'planned' }] };
}

/** The explicit graph checkbox changes planned membership only, never earned history. */
export function removeGraphPlannedCourse(path: SavedPath, courseId: string): SavedPath {
  if (!path.courses.some(course => course.courseId === courseId && course.status === 'planned')) return path;
  return { ...path, courses: path.courses.filter(course => !(course.courseId === courseId && course.status === 'planned')) };
}

export interface GraphRemovalProposal {
  proposedPath: SavedPath;
  /** The explicitly clicked course first, followed by any affected planned dependents. */
  removedCourseIds: string[];
  /** Additional removals only; these are the courses to list in the confirmation. */
  affectedCourseIds: string[];
  requiresConfirmation: boolean;
  hasChanges: boolean;
}

/**
 * Propose, but do not apply, a planned-course removal and its causal consequences.
 * Only downstream courses that were eligible before this action can cascade.
 * Pre-existing missing/review states are retained for the student to resolve.
 * evaluateCourse supplies the existing chronological AND/OR/count/unit/corequisite
 * semantics; mere graph connectivity is never enough to remove a course.
 */
export function proposeGraphCourseRemoval(path: SavedPath, courseId: string, courses: Course[]): GraphRemovalProposal {
  let proposedPath = removeGraphPlannedCourse(path, courseId);
  if (proposedPath === path) return { proposedPath: path, removedCourseIds: [], affectedCourseIds: [], requiresConfirmation: false, hasChanges: false };

  const byId = new Map(courses.map(course => [course.id, course]));
  const downstream = new Set(getDownstreamIds(courseId, courses));
  const previouslyEligible = path.courses.filter(item => item.status === 'planned' && item.courseId !== courseId && downstream.has(item.courseId))
    .filter(item => {
      const course = byId.get(item.courseId);
      return course && evaluateCourse(course, path, courses).state === 'met';
    });
  const removed = new Set([courseId]);

  // Monotone, bounded removal; reevaluate after each batch to include transitive
  // effects while keeping any surviving valid prerequisite alternative.
  while (true) {
    const affected = previouslyEligible.filter(item => !removed.has(item.courseId) && evaluateCourse(byId.get(item.courseId)!, proposedPath, courses).state !== 'met');
    if (!affected.length) break;
    affected.forEach(item => removed.add(item.courseId));
    proposedPath = { ...path, courses: path.courses.filter(item => item.status === 'completed' || !removed.has(item.courseId)) };
  }

  const affectedCourseIds = path.courses.filter(item => item.courseId !== courseId && removed.has(item.courseId)).map(item => item.courseId);
  return { proposedPath, removedCourseIds: [courseId, ...affectedCourseIds], affectedCourseIds, requiresConfirmation: affectedCourseIds.length > 0, hasChanges: true };
}
