import type { Course, Program, Requirement, SavedPath } from './types';
import { evaluateCourse, getPrerequisiteIds, termOrder } from './requirements';

export interface ProgramProgress {
  completedPercent: number;
  /** Cumulative completed plus valid planned coverage; do not add to completedPercent. */
  plannedPercent: number;
  completedCourseCount: number;
  plannedCourseCount: number;
  /** Available referenced option pool, not the number of courses required. */
  mappedCourseCount: number;
  label: 'Mapped coursework';
  coverageLabel: string;
  reviewRequired: boolean;
  hasUnmodeledRequirements: boolean;
  provisionalPlan: boolean;
  notes: string[];
}

type Measure = { earned: number; required: number; review: boolean };
const distinct = (items: Requirement[]) => [...new Map(items.map(item => [JSON.stringify(item), item])).values()];
const ratio = (measure: Measure) => measure.required > 0 ? Math.min(1, measure.earned / measure.required) : 0;
const knownUnits = (course?: Course): number | null => course && Number.isFinite(course.units) && course.units >= 0 && !/arranged/i.test(course.unitsLabel) ? course.units : null;

/** Coursework coverage of the explicit model, never degree certification or a milestone action. */
export function getProgramProgress(path: SavedPath, program: Program, courses: Course[]): ProgramProgress {
  const byId = new Map(courses.map(course => [course.id, course]));
  let hasUnmodeledRequirements = false;
  function known(req: Requirement | null | undefined): Requirement | null {
    if (!req) return null;
    if (req.kind === 'permission' || req.kind === 'unknown') { hasUnmodeledRequirements = true; return null; }
    if (req.kind === 'course') {
      if (!byId.has(req.courseId)) { hasUnmodeledRequirements = true; return null; }
      return req;
    }
    if (req.kind === 'units') {
      const ids = [...new Set(req.courseIds)].filter(id => knownUnits(byId.get(id)) !== null);
      if (ids.length !== new Set(req.courseIds).size) hasUnmodeledRequirements = true;
      return ids.length ? { ...req, courseIds: ids } : null;
    }
    if ('items' in req) {
      const children = req.items.map(known).filter((item): item is Requirement => item !== null);
      if (!children.length) { hasUnmodeledRequirements = true; return null; }
      const items = distinct(req.kind === 'all' ? children.flatMap(item => item.kind === 'all' ? item.items : [item]) : children);
      if (req.kind === 'count') return { ...req, items, minimum: children.length < req.items.length ? Math.min(req.minimum, items.length) : req.minimum };
      return { ...req, items };
    }
    return null;
  }
  const modeled = known(program.requirements);
  const mapped = new Set(getPrerequisiteIds(modeled));
  const completed = new Set(path.courses.filter(item => item.status === 'completed').map(item => item.courseId));
  const season = (term: string) => term.toLowerCase().match(/fall|spring|summer|iap|winter/)?.[0];
  let candidates = path.courses.filter(item => item.status === 'planned' && termOrder(item.term) !== null && byId.get(item.courseId)?.terms.some(term => season(term) === season(item.term)));
  // Remove invalid upstream routes as well as invalid targets. Mutual corequisites
  // remain together while unavailable offerings cannot support a later course.
  while (candidates.length) {
    const candidatePath = { ...path, courses: [...path.courses.filter(item => item.status === 'completed'), ...candidates] };
    const accepted = candidates.filter(item => evaluateCourse(byId.get(item.courseId)!, candidatePath, courses).state === 'met');
    if (accepted.length === candidates.length) break;
    candidates = accepted;
  }
  const planned = new Set([...completed, ...candidates.map(item => item.courseId)]);
  const provisionalPlan = path.courses.some(item => item.status === 'planned' && mapped.has(item.courseId) && !planned.has(item.courseId));

  function coverage(satisfied: Set<string>): Measure {
    const cache = new Map<string, string[][]>();
    const normalize = (sets: string[][]) => [...new Map(sets.map(set => { const ids = [...new Set(set)].sort(); return [ids.join('\u0000'), ids]; })).values()].slice(0, 64);
    function allocate(groups: string[][][], minimum: number): string[][] {
      const results: string[][] = [];
      let visits = 0;
      function visit(index: number, needed: number, used: Set<string>) {
        if (++visits > 5000 || results.length >= 64) return;
        if (needed <= 0) { results.push([...used]); return; }
        if (groups.length - index < needed) return;
        for (let i = index; i < groups.length; i++) for (const witness of groups[i]) {
          if (!witness.some(id => used.has(id))) visit(i + 1, needed - 1, new Set([...used, ...witness]));
          if (results.length >= 64 || visits > 5000) return;
        }
      }
      visit(0, minimum, new Set());
      return normalize(results);
    }
    function witnesses(req: Requirement): string[][] {
      const key = JSON.stringify(req);
      const cached = cache.get(key); if (cached) return cached;
      let result: string[][] = [];
      if (req.kind === 'course') result = satisfied.has(req.courseId) ? [[req.courseId]] : [];
      else if (req.kind === 'units') {
        const ids = req.courseIds.filter(id => satisfied.has(id) && (knownUnits(byId.get(id)) ?? 0) > 0);
        let visits = 0;
        const visit = (index: number, total: number, selected: string[]) => {
          if (++visits > 5000 || result.length >= 64) return;
          if (total >= req.minimum) { result.push(selected); return; }
          for (let i = index; i < ids.length; i++) visit(i + 1, total + knownUnits(byId.get(ids[i]))!, [...selected, ids[i]]);
        };
        visit(0, 0, []);
      } else if ('items' in req) {
        const children = distinct(req.items).map(witnesses);
        if (req.kind === 'any') result = children.flat();
        else if (req.kind === 'count') result = allocate(children, req.minimum);
        else {
          result = [[]];
          for (const child of children) result = normalize(result.flatMap(left => child.map(right => [...left, ...right])));
        }
      }
      result = normalize(result); cache.set(key, result); return result;
    }
    function measure(req: Requirement | null): Measure {
      if (!req) return { earned: 0, required: 0, review: false };
      if (req.kind === 'course') return { earned: satisfied.has(req.courseId) ? 1 : 0, required: 1, review: false };
      if (req.kind === 'units') {
        const units = req.courseIds.filter(id => satisfied.has(id)).reduce((sum, id) => sum + (knownUnits(byId.get(id)) ?? 0), 0);
        return { earned: req.minimum > 0 ? Math.min(1, units / req.minimum) : 0, required: req.minimum > 0 ? 1 : 0, review: false };
      }
      if (!('items' in req)) return { earned: 0, required: 0, review: true };
      const items = distinct(req.items), parts = items.map(measure);
      if (req.kind === 'any') return [...parts].sort((a, b) => ratio(b) - ratio(a) || a.required - b.required)[0] ?? { earned: 0, required: 0, review: true };
      if (req.kind === 'count') {
        const groups = items.map(witnesses);
        let fulfilled = Math.min(req.minimum, groups.filter(group => group.length).length);
        while (fulfilled > 0 && !allocate(groups, fulfilled).length) fulfilled--;
        const partial = parts.filter(part => ratio(part) > 0 && ratio(part) < 1).map(ratio).sort((a, b) => b - a).slice(0, Math.max(0, req.minimum - fulfilled));
        const overlap = groups.filter(group => group.length).length > fulfilled && fulfilled < req.minimum;
        return { earned: fulfilled + partial.reduce((sum, value) => sum + value, 0), required: req.minimum, review: overlap || req.minimum > items.length || parts.some(part => part.review) };
      }
      const total = { earned: parts.reduce((sum, part) => sum + part.earned, 0), required: parts.reduce((sum, part) => sum + part.required, 0), review: parts.some(part => part.review) };
      // Separate unit pools must have a disjoint witness before the same credits
      // can establish complete coverage of both. Unknown allocation is review.
      const unitGroups = items.filter(item => item.kind === 'units').map(witnesses);
      if (unitGroups.length > 1 && unitGroups.every(group => group.length) && !allocate(unitGroups, unitGroups.length).length) {
        let independentlyFulfilled = unitGroups.length - 1;
        while (independentlyFulfilled > 0 && !allocate(unitGroups, independentlyFulfilled).length) independentlyFulfilled--;
        total.review = true;
        total.earned -= unitGroups.length - independentlyFulfilled;
      }
      return total;
    }
    return measure(modeled);
  }
  const earned = coverage(completed), future = coverage(planned);
  const percent = (value: Measure) => Math.max(0, Math.min(100, Math.floor(ratio(value) * 100 + 1e-8)));
  const completedPercent = percent(earned), plannedPercent = Math.max(completedPercent, percent(future));
  const reviewRequired = hasUnmodeledRequirements || provisionalPlan || earned.review || future.review || !modeled;
  const notes = ['Percentages describe the modeled coursework, not degree completion, admission or an institutionally verified transcript.'];
  if (hasUnmodeledRequirements) notes.push('Permission, unknown rules and unavailable course/unit data are outside the numeric score and still require review.');
  if (provisionalPlan) notes.push('Planned courses with unresolved prerequisite chains, term order or catalog offering patterns are excluded from planned coverage.');
  if (earned.review || future.review) notes.push('Overlapping requirements cannot establish full coverage without a distinct-course or credit-allocation proof.');
  notes.push('Planned coverage includes completed coursework. Future sections, enrollment and actual completion remain unverified.');
  return { completedPercent, plannedPercent, completedCourseCount: [...mapped].filter(id => completed.has(id)).length, plannedCourseCount: [...mapped].filter(id => planned.has(id)).length, mappedCourseCount: mapped.size, label: 'Mapped coursework', coverageLabel: modeled ? 'Modeled requirements only · full program review still required' : 'No numeric coursework coverage is modeled for this program', reviewRequired, hasUnmodeledRequirements, provisionalPlan, notes };
}
