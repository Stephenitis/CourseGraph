import type { PlannedCourse } from '../domain/types';
import { termOrder } from '../domain/requirements';

export type SemesterRevealStage = { label: string; courseIds: string[] };
/** Presentation groups only: never reassign semesters or mutate the saved plan. */
export function getSemesterRevealStages(courses: PlannedCourse[]): SemesterRevealStage[] {
  const completed = courses.filter(course => course.status === 'completed').map(course => course.courseId).sort();
  const terms = new Map<string, string[]>();
  for (const course of courses) {
    if (course.status === 'completed') continue;
    terms.set(course.term, [...(terms.get(course.term) ?? []), course.courseId]);
  }
  const planned = [...terms].sort(([a], [b]) => (termOrder(a) ?? Infinity) - (termOrder(b) ?? Infinity) || a.localeCompare(b))
    .map(([label, courseIds]) => ({label, courseIds: courseIds.sort()}));
  return [...(completed.length ? [{label: 'Completed foundations', courseIds: completed}] : []), ...planned];
}
