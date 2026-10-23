import type { Course, Meeting, Requirement, RequirementResult, SavedPath } from './types';

const unique = <T,>(items: T[]): T[] => [...new Set(items)];
const met = (): RequirementResult => ({ state: 'met', missingCourseIds: [], reasons: [] });
const aggregate = (results: RequirementResult[]): RequirementResult => ({
  state: results.some(r => r.state === 'missing') ? 'missing' : results.some(r => r.state === 'review') ? 'review' : 'met',
  missingCourseIds: unique(results.flatMap(r => r.missingCourseIds)),
  reasons: unique(results.flatMap(r => r.reasons)),
});

/** Missing IDs in an any/count/units branch are options, not individually mandatory courses. */
export function evaluateRequirement(requirement: Requirement | null | undefined, satisfiedCourseIds: Set<string>, courses: Course[] = []): RequirementResult {
  if (!requirement) return met();
  switch (requirement.kind) {
    case 'course':
      return satisfiedCourseIds.has(requirement.courseId) ? met() : {
        state: 'missing', missingCourseIds: [requirement.courseId], reasons: [`Requires ${requirement.courseId}.`],
      };
    case 'permission':
    case 'unknown':
      return { state: 'review', missingCourseIds: [], reasons: [`Manual review: ${requirement.text}`] };
    case 'all':
      return aggregate(requirement.items.map(item => evaluateRequirement(item, satisfiedCourseIds, courses)));
    case 'any': {
      if (!requirement.items.length) return { state: 'review', missingCourseIds: [], reasons: ['No alternatives have been specified.'] };
      const results = requirement.items.map(item => evaluateRequirement(item, satisfiedCourseIds, courses));
      if (results.some(r => r.state === 'met')) return met();
      return {
        state: results.some(r => r.state === 'review') ? 'review' : 'missing',
        missingCourseIds: unique(results.flatMap(r => r.missingCourseIds)),
        reasons: [`Choose one alternative: ${requirement.items.map(describeRequirement).join(' OR ')}.`, ...unique(results.filter(r => r.state === 'review').flatMap(r => r.reasons))],
      };
    }
    case 'count': {
      const distinctItems = [...new Map(requirement.items.map(item => [JSON.stringify(item), item])).values()];
      const results = distinctItems.map(item => evaluateRequirement(item, satisfiedCourseIds, courses));
      const achieved = results.filter(r => r.state === 'met').length;
      if (achieved >= requirement.minimum) {
        const witnesses = distinctItems.filter((_, index) => results[index].state === 'met').map(item => getPrerequisiteIds(item).filter(id => satisfiedCourseIds.has(id)));
        const hasOverlap = witnesses.flat().length !== new Set(witnesses.flat()).size;
        if (requirement.minimum > 1 && hasOverlap && !hasDisjointWitnesses(witnesses, requirement.minimum)) return {
          state: 'review', missingCourseIds: [], reasons: ['Manual review: these count alternatives overlap. Distinct course allocation is not established; the same course must not be counted twice.'],
        };
        return met();
      }
      const pendingReview = results.filter(r => r.state === 'review').length;
      return {
        state: achieved + pendingReview >= requirement.minimum ? 'review' : 'missing',
        missingCourseIds: unique(results.flatMap(r => r.missingCourseIds)),
        reasons: [`Choose ${Math.max(0, requirement.minimum - achieved)} more of ${distinctItems.map(describeRequirement).join(', ')}.`, ...unique(results.filter(r => r.state === 'review').flatMap(r => r.reasons))],
      };
    }
    case 'units': {
      const ids = unique(requirement.courseIds);
      const byId = new Map(courses.map(course => [course.id, course]));
      const done = ids.filter(id => satisfiedCourseIds.has(id));
      const knownDone = done.filter(id => {
        const course = byId.get(id);
        return course && Number.isFinite(course.units) && course.units >= 0 && !course.unitsLabel.toLowerCase().includes('arranged');
      });
      const unknownUnits = knownDone.length !== done.length;
      const total = knownDone.reduce((sum, id) => sum + byId.get(id)!.units, 0);
      if (total >= requirement.minimum) return met();
      return {
        state: unknownUnits ? 'review' : 'missing',
        missingCourseIds: ids.filter(id => !satisfiedCourseIds.has(id)),
        reasons: [`${total} of ${requirement.minimum} required units counted in this group.${unknownUnits ? ' Some selected subjects have unknown or arranged units; manual review required.' : ''}`],
      };
    }
  }
}


/** Conservative proof only: complex overlapping alternatives otherwise need an allocation review. */
function hasDisjointWitnesses(groups: string[][], minimum: number, index = 0, used = new Set<string>()): boolean {
  if (minimum <= 0) return true;
  if (groups.length - index < minimum) return false;
  for (let i = index; i < groups.length; i++) {
    if (groups[i].some(id => used.has(id))) continue;
    if (hasDisjointWitnesses(groups, minimum - 1, i + 1, new Set([...used, ...groups[i]]))) return true;
  }
  return false;
}

/** Validate whole term groups so genuine mutual corequisites work without circular prerequisite credit. */
function getValidatedPlannedCourses(path: SavedPath, courses: Course[]): Set<string> {
  const byId = new Map(courses.map(course => [course.id, course]));
  const verified = new Set(path.courses.filter(item => item.status === 'completed').map(item => item.courseId));
  const terms = [...new Set(path.courses.filter(item => item.status === 'planned').map(item => termOrder(item.term)).filter((term): term is number => term !== null))].sort((a, b) => a - b);
  for (const term of terms) {
    let candidates = new Set(path.courses.filter(item => item.status === 'planned' && termOrder(item.term) === term && byId.has(item.courseId)).map(item => item.courseId));
    while (candidates.size) {
      const accepted = new Set([...candidates].filter(id => {
        const course = byId.get(id)!;
        const alongside = new Set([...verified, ...candidates]); alongside.delete(id);
        return evaluateRequirement(course.prerequisites, verified, courses).state === 'met'
          && evaluateRequirement(course.corequisites, alongside, courses).state === 'met';
      }));
      if (accepted.size === candidates.size) break;
      candidates = accepted;
    }
    candidates.forEach(id => verified.add(id));
  }
  return verified;
}

export function describeRequirement(requirement: Requirement): string {
  switch (requirement.kind) {
    case 'course': return requirement.courseId;
    case 'all': return `(${requirement.items.map(describeRequirement).join(' + ')})`;
    case 'any': return `(${requirement.items.map(describeRequirement).join(' or ')})`;
    case 'count': return `${requirement.minimum} of ${requirement.items.map(describeRequirement).join(', ')}`;
    case 'units': return `${requirement.minimum} units from ${requirement.courseIds.join(', ')}`;
    default: return requirement.text;
  }
}

export function getPrerequisiteIds(requirement: Requirement | null | undefined): string[] {
  if (!requirement) return [];
  if (requirement.kind === 'course') return [requirement.courseId];
  if (requirement.kind === 'units') return unique(requirement.courseIds);
  if ('items' in requirement) return unique(requirement.items.flatMap(getPrerequisiteIds));
  return [];
}

/** Calendar-year ordering: IAP 2027 precedes Spring 2027, which precedes Fall 2027. */
export function termOrder(term: string): number | null {
  const year = term.match(/\b(20\d{2})\b/)?.[1];
  const season = term.toLowerCase().match(/\b(iap|winter|spring|summer|fall|autumn)\b/)?.[1];
  if (!year || !season) return null;
  const seasons: Record<string, number> = { iap: 0, winter: 0, spring: 1, summer: 2, fall: 3, autumn: 3 };
  return Number(year) * 4 + seasons[season];
}

export function evaluateCourse(course: Course, path: SavedPath, courses: Course[]): RequirementResult {
  const own = path.courses.find(item => item.courseId === course.id);
  if (own?.status === 'completed') return met();
  const targetTerm = own ? termOrder(own.term) : null;
  const prior = new Set(path.courses.filter(item => item.courseId !== course.id && (
    item.status === 'completed' || (targetTerm !== null && termOrder(item.term) !== null && termOrder(item.term)! < targetTerm)
  )).map(item => item.courseId));
  const concurrent = new Set([...prior, ...path.courses.filter(item => item.courseId !== course.id && targetTerm !== null && termOrder(item.term) === targetTerm).map(item => item.courseId)]);
  const result = aggregate([
    evaluateRequirement(course.prerequisites, prior, courses),
    evaluateRequirement(course.corequisites, concurrent, courses),
  ]);
  if (own && targetTerm !== null) {
    const validated = getValidatedPlannedCourses(path, [...courses.filter(item => item.id !== course.id), course]);
    const reliablePrior = new Set([...prior].filter(id => validated.has(id)));
    const reliableConcurrent = new Set([...concurrent].filter(id => validated.has(id)));
    const reliable = aggregate([
      evaluateRequirement(course.prerequisites, reliablePrior, courses),
      evaluateRequirement(course.corequisites, reliableConcurrent, courses),
    ]);
    if (result.state === 'met' && reliable.state !== 'met') {
      result.state = 'review';
      const referenced = new Set([...getPrerequisiteIds(course.prerequisites), ...getPrerequisiteIds(course.corequisites)]);
      const unresolved = [...concurrent].filter(id => referenced.has(id) && !validated.has(id));
      result.reasons.unshift(`Planned prerequisite or corequisite ${unresolved.join(', ') || 'choices'} still needs attention in its own term. A planned course is not earned credit.`);
    } else if (result.state === 'met') {
      const completed = new Set(path.courses.filter(item => item.status === 'completed').map(item => item.courseId));
      if (evaluateRequirement(course.prerequisites, completed, courses).state !== 'met' || evaluateRequirement(course.corequisites, completed, courses).state !== 'met') {
        result.reasons.push('Conditionally satisfied if the earlier and concurrent planned courses are completed; this is not earned credit.');
      }
    }
  }
  if (own && targetTerm === null && result.state !== 'met') {
    result.state = 'review';
    result.reasons.unshift('Term is unknown; planned courses cannot establish prerequisite order.');
  }
  if (!own && result.state !== 'met' && path.courses.some(item => item.status === 'planned')) {
    result.reasons.push('Choose a term for this course to check which planned prerequisites come before it.');
  }
  return result;
}

/** Includes transitive dependents; a highlighted dependent is not a claim of eligibility. */
export function getDownstreamIds(courseId: string, courses: Course[]): string[] {
  const reverse = new Map<string, string[]>();
  courses.forEach(course => {
    unique([...getPrerequisiteIds(course.prerequisites), ...getPrerequisiteIds(course.corequisites)]).forEach(id => {
      reverse.set(id, [...(reverse.get(id) ?? []), course.id]);
    });
  });
  const visited = new Set<string>([courseId]);
  const queue = [...(reverse.get(courseId) ?? [])];
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    queue.push(...(reverse.get(id) ?? []));
  }
  visited.delete(courseId);
  return [...visited];
}

export interface ScheduleConflict {
  courseIds: [string, string];
  term: string;
  days: number[];
  startMinutes: number;
  endMinutes: number;
  sections: [string, string];
}

function sameTerm(a: string, b: string): boolean {
  const x = termOrder(a), y = termOrder(b);
  return x !== null && y !== null && x === y;
}
function validMeeting(meeting: Meeting): boolean {
  return Number.isFinite(meeting.startMinutes) && Number.isFinite(meeting.endMinutes)
    && meeting.startMinutes >= 0 && meeting.endMinutes <= 1440 && meeting.startMinutes < meeting.endMinutes;
}

/** Meetings must describe the selected/required sections for a known term, never all alternative sections. */
export function detectScheduleConflicts(path: SavedPath, courses: Course[]): ScheduleConflict[] {
  const byId = new Map(courses.map(course => [course.id, course]));
  const planned = path.courses.filter(item => item.status === 'planned');
  const conflicts: ScheduleConflict[] = [];
  for (let i = 0; i < planned.length; i++) {
    for (let j = i + 1; j < planned.length; j++) {
      const a = planned[i], b = planned[j];
      if (a.courseId === b.courseId || !sameTerm(a.term, b.term)) continue;
      const first = (byId.get(a.courseId)?.meetings ?? []).filter(m => sameTerm(m.term, a.term) && validMeeting(m));
      const second = (byId.get(b.courseId)?.meetings ?? []).filter(m => sameTerm(m.term, b.term) && validMeeting(m));
      for (const x of first) for (const y of second) {
        const days = unique(x.days.filter(day => y.days.includes(day) && Number.isInteger(day) && day >= 0 && day <= 6)).sort((a, b) => a - b);
        const startMinutes = Math.max(x.startMinutes, y.startMinutes);
        const endMinutes = Math.min(x.endMinutes, y.endMinutes);
        if (days.length && startMinutes < endMinutes) conflicts.push({
          courseIds: [a.courseId, b.courseId], term: a.term, days, startMinutes, endMinutes, sections: [x.section, y.section],
        });
      }
    }
  }
  return [...new Map(conflicts.map(conflict => [JSON.stringify(conflict), conflict])).values()];
}
