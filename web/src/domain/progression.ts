import type { Course, Program } from './types';
import { getPrerequisiteIds } from './requirements';

// Existing visual IDs remain stable; labels describe curriculum roles, not difficulty.
export type CourseStageId = 'introductory' | 'intermediate' | 'advanced' | 'graduate' | 'undergraduate';
export interface CourseStage {
  id: CourseStageId;
  label: 'Foundation' | 'Core' | 'Advanced' | 'Graduate' | 'Undergraduate';
  order: 0 | 1 | 2 | 3;
  explanation: string;
  sourceUrl: string;
  sourceLabel: string;
}

const SOURCES = {
  numbering: 'https://www.eecs.mit.edu/academics/subject-numbering/',
  gir: 'https://catalog.mit.edu/mit/undergraduate-education/general-institute-requirements/',
  cs: 'https://catalog.mit.edu/degree-charts/computer-science-engineering-course-6-3/',
  ai: 'https://catalog.mit.edu/degree-charts/artifical-intelligence-decision-making-course-6-4/',
  groups: 'https://catalog.mit.edu/degree-charts/eecs-subject-groupings/',
  math: 'https://catalog.mit.edu/schools/science/mathematics/#undergraduatetext',
  programming: 'https://www.eecs.mit.edu/academics/subject-updates/changes-to-6-1903-6-1904/',
} as const;
const ids = (value: string) => new Set(value.split(' '));

// Explicit intersections of official lists with the 81-subject snapshot, checked 2026-10-23.
const SCIENCE_FOUNDATIONS = ids('18.01 18.01A 18.01L 18.02 18.02A 18.022 8.01 8.012 8.01L 8.02 8.022');
const REST_FOUNDATIONS = ids('1.00 14.30 16.001 16.C20 18.03 18.032 18.05 18.06 18.090 18.C06 2.003 9.01');
const EECS_ENTRY_POINTS = ids('6.1000 6.100A 6.100B 6.1010 6.1200 6.1210 6.1910 6.3000 6.3700 6.3800 6.3900');
const EECS_ADVANCED = ids('6.1810 6.3100 6.3260 6.3720 6.4210 6.4300 6.4400 6.4420 6.4610 6.5831 6.C571 18.404');
const EECS_ADVANCED_LABS = ids('6.4200 6.C35');
// Mathematics explicitly defines advanced subjects by the first decimal digit.
// Enumerate this snapshot instead of extrapolating the convention to other departments.
const MATH_ADVANCED = ids('18.100A 18.100B 18.100P 18.100Q 18.200 18.404 18.600 18.650 18.700 18.701');
const CS_CORE = ids('6.1020 6.1220 6.1400 6.1800');
const AI_FUNDAMENTALS = ids('6.1000 6.100A 6.100B 16.C20 6.1010 6.1200 6.1210 18.C06 18.06 6.3700 6.3800 18.05');
const AI_CENTERS = ids('6.3720 6.3900 6.3000 6.3100 6.4110 6.4420 6.4400 6.C571 6.1220 6.1400 6.3260 6.3950 6.4120 6.4590 6.C35');
const AI_APPLICATIONS = ids('6.4200 6.4210 6.4300 6.4610');

function stage(id: CourseStageId, explanation: string, sourceUrl: string, sourceLabel: string): CourseStage {
  const values = {
    introductory: { label: 'Foundation', order: 0 },
    intermediate: { label: 'Core', order: 1 },
    advanced: { label: 'Advanced', order: 2 },
    graduate: { label: 'Graduate', order: 3 },
    undergraduate: { label: 'Undergraduate', order: 1 },
  } as const;
  return { id, ...values[id], explanation, sourceUrl, sourceLabel };
}

/**
 * Source-backed curriculum roles for the imported MIT snapshot. Foundation/Core
 * are concise UI names for MIT entry points, fundamentals and departmental groups.
 * Prerequisite ordering is independent; numbers and graph depth never infer a role.
 */
export function getCourseStage(course: Course, _courses: Course[], program?: Program): CourseStage {
  const id = course.id;
  if (course.level === 'graduate') return stage('graduate', 'MIT publishes this as a graduate subject. Program admission and approval are separate requirements.', course.sourceUrl, 'MIT graduate subject level');
  if (MATH_ADVANCED.has(id)) return stage('advanced', 'MIT Mathematics classifies this subject in its advanced undergraduate group. This is a curriculum category, not a difficulty score.', SOURCES.math, 'MIT Mathematics advanced-subject rule');
  if (EECS_ADVANCED.has(id)) return stage('advanced', 'MIT lists this subject among its Advanced Undergraduate Subjects. Prerequisites still determine when it fits your path.', SOURCES.groups, 'MIT EECS Advanced Undergraduate Subjects');
  if (EECS_ADVANCED_LABS.has(id)) return stage('advanced', 'MIT lists this subject as an Advanced Departmental Laboratory. This label describes its curriculum role.', SOURCES.groups, 'MIT EECS Advanced Departmental Laboratory Subjects');
  if (program?.id === 'major6-4' && AI_FUNDAMENTALS.has(id)) return stage('introductory', 'MIT places this subject in the 6-4 Fundamentals group. CourseGraph displays that role as Foundation.', SOURCES.ai, 'MIT 6-4 Fundamentals');
  if (program?.id === 'major6-4' && (AI_CENTERS.has(id) || AI_APPLICATIONS.has(id))) return stage('intermediate', 'MIT lists this as a 6-4 Center or Application CI-M requirement option. Core describes that program role; it does not mean every option is required.', SOURCES.ai, 'MIT 6-4 departmental requirements');
  if (SCIENCE_FOUNDATIONS.has(id)) return stage('introductory', 'MIT includes this subject among the mathematics or physics options for its introductory science requirements.', SOURCES.gir, 'MIT General Institute Requirements');
  if (EECS_ENTRY_POINTS.has(id)) return stage('introductory', 'MIT EECS names this subject as a common entry point into the department. Earlier prerequisites may still be required.', SOURCES.numbering, 'MIT EECS entry-point list');
  if (id === '6.1903' || id === '6.1904') return stage('introductory', 'MIT identifies this introductory C and Assembly subject as preparation for Computation Structures. Current offering availability is shown separately.', SOURCES.programming, 'MIT introductory programming update');
  if (id === '6.100L' || id === '6.120A') return stage('introductory', id === '6.100L' ? 'MIT describes this as the introductory programming route for students without programming experience.' : 'MIT describes this as an elementary discrete mathematics and proof subject supporting later computer science.', course.sourceUrl, 'MIT subject description');
  if (REST_FOUNDATIONS.has(id)) return stage('introductory', 'MIT includes this subject in its REST science and technology foundation options. This is a curriculum role, not a recommended year or difficulty score.', SOURCES.gir, 'MIT REST foundation subjects');
  if ((!program || program.id === 'major6-3' || program.id === 'master6-P') && CS_CORE.has(id)) return stage('intermediate', 'MIT lists this in the 6-3 departmental requirements. Core identifies its undergraduate program role; alternatives and degree-credit rules still apply.', SOURCES.cs, 'MIT 6-3 departmental requirements');
  if (!program && (AI_CENTERS.has(id) || AI_APPLICATIONS.has(id))) return stage('intermediate', 'MIT lists this as a 6-4 departmental requirement option. Core describes that curriculum role.', SOURCES.ai, 'MIT 6-4 departmental requirements');
  return stage('undergraduate', 'MIT publishes this as an undergraduate subject. Its official prerequisites determine its place in the map.', course.sourceUrl, 'MIT undergraduate subject level');
}

export interface ProgramCourseClosure { courseIds: string[]; missingCourseIds: string[] }

/** All available subjects in this program snapshot, with full pre/corequisite closure; not a complete degree audit. */
export function getProgramCourseClosure(program: Program, courses: Course[], additionalCourseIds: string[] = []): ProgramCourseClosure {
  const byId = new Map(courses.map(course => [course.id, course]));
  const queue = [...program.courseIds, ...getPrerequisiteIds(program.requirements), ...additionalCourseIds];
  const visited = new Set<string>();
  const courseIds: string[] = [], missingCourseIds: string[] = [];
  for (let index = 0; index < queue.length; index++) {
    const id = queue[index];
    if (visited.has(id)) continue;
    visited.add(id);
    const course = byId.get(id);
    if (!course) { missingCourseIds.push(id); continue; }
    courseIds.push(id);
    queue.push(...getPrerequisiteIds(course.prerequisites), ...getPrerequisiteIds(course.corequisites));
  }
  return { courseIds, missingCourseIds };
}
