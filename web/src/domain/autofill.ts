import type { Course, PlannedCourse, Program, Requirement, SavedPath } from './types';
import { describeRequirement, evaluateCourse, evaluateRequirement, getPrerequisiteIds, termOrder } from './requirements';

export interface AutofillOptions {
  startTerm: string;
  paceUnits: number;
  mode?: 'prerequisites' | 'program';
  choices?: Record<string, string[]>;
}
export interface AutofillChoiceGroup {
  id: string;
  label: string;
  kind: 'any' | 'count' | 'units';
  minimum: number;
  options: { id: string; label: string; courseIds: string[] }[];
  selectedIds: string[];
  automatic: boolean;
}
export interface AutofillProposal {
  additions: PlannedCourse[];
  moves: { courseId: string; fromTerm: string; toTerm: string }[];
  assignments: PlannedCourse[];
  choices: AutofillChoiceGroup[];
  reviewNotes: string[];
  unscheduled: { courseId: string; reason: string }[];
  termLoads: { term: string; knownUnits: number; unknownUnitCourseIds: string[] }[];
  notes: string[];
  hasChanges: boolean;
  allSelectedCoursesScheduled: boolean;
}

interface Draft {
  assignments: Map<string, PlannedCourse>;
  choices: Map<string, AutofillChoiceGroup>;
  reviewNotes: Set<string>;
  verified: Set<string>;
}
type Attempt = { ok: true; draft: Draft } | { ok: false; reason: string };
type Relation = 'prerequisite' | 'corequisite' | 'root';
interface Visit { id: string; index: number; relation: Relation }
const clone = (draft: Draft): Draft => ({ assignments: new Map(draft.assignments), choices: new Map(draft.choices), reviewNotes: new Set(draft.reviewNotes), verified: new Set(draft.verified) });
const failure = (reason: string): Attempt => ({ ok: false, reason });
const knownUnits = (course?: Course): number | null => course && Number.isFinite(course.units) && course.units >= 0 && !/arranged/i.test(course.unitsLabel) ? course.units : null;
const season = (term: string | undefined) => term?.toLowerCase().match(/fall|spring|summer|iap|winter/)?.[0];
// Parse only the explicit credit-exclusion statement retained from the official
// source. Similar titles and joint subject numbers do not establish equivalence.
const excludedCreditIds = (course: Course): Set<string> => new Set((course.notes ?? []).flatMap(note => {
  const statement = note.match(/^Credit cannot also be received for:\s*(.+?)(?:\.\s+Double-counting requires review\.?|$)/i)?.[1];
  return statement ? statement.split(',').map(id => id.trim().replace(/\.$/, '')).filter(Boolean) : [];
}));

/**
 * Build an additive, reversible plan using only modeled requirements and catalog
 * offering patterns. Prerequisite mode never moves an existing assignment.
 * Failed alternative branches are rolled back, including their added courses.
 * This function neither marks courses completed nor creates a major milestone.
 */
export function buildAutofillProposal(path: SavedPath, program: Program, courses: Course[], terms: string[], options: AutofillOptions): AutofillProposal {
  const byId = new Map(courses.map(course => [course.id, course]));
  const creditExclusions = new Map(courses.map(course => [course.id, excludedCreditIds(course)]));
  const excludesCredit = (a: string, b: string) => a !== b && (creditExclusions.get(a)?.has(b) || creditExclusions.get(b)?.has(a));
  const original = new Map(path.courses.map(item => [item.courseId, item]));
  const orderedTerms = [...new Set(terms)].filter(term => termOrder(term) !== null).sort((a, b) => termOrder(a)! - termOrder(b)!);
  const start = orderedTerms.indexOf(options.startTerm);
  const mode = options.mode ?? 'prerequisites';
  const validOptions = start >= 0 && Number.isFinite(options.paceUnits) && options.paceUnits > 0 && options.paceUnits <= 10000;
  const notes = ['Suggestions use seasonal catalog patterns, not verified future sections or seat availability.', 'Unresolved degree rules, approvals, credit allocation and graduation timing still need advisor review.'];
  const unresolved = new Map<string, string>();
  let programUnresolved = false;
  let draft: Draft = {
    assignments: new Map(path.courses.filter(item => mode === 'prerequisites' || item.status === 'completed').map(item => [item.courseId, { ...item }])),
    choices: new Map(), reviewNotes: new Set(),
    verified: new Set(path.courses.filter(item => item.status === 'completed').map(item => item.courseId)),
  };
  const offered = (course: Course, index: number) => index >= 0 && course.terms.some(term => season(term) === season(orderedTerms[index]));
  const availableIds = (current: Draft, bound: number) => new Set([...current.assignments.values()].filter(item => item.status === 'completed' || (current.verified.has(item.courseId) && orderedTerms.indexOf(item.term) <= bound)).map(item => item.courseId));
  const addedCount = (current: Draft) => [...current.assignments.keys()].filter(id => !original.has(id)).length;
  const addedUnits = (current: Draft) => [...current.assignments.keys()].filter(id => !original.has(id)).reduce((sum, id) => sum + (knownUnits(byId.get(id)) ?? 100), 0);
  const score = (current: Draft, before: Draft) => (current.reviewNotes.size - before.reviewNotes.size) * 100000 + (addedCount(current) - addedCount(before)) * 1000 + addedUnits(current) - addedUnits(before);

  function requirement(req: Requirement | null | undefined, bound: number, key: string, label: string, current: Draft, stack: Visit[], relation: Relation): Attempt {
    if (!req) return { ok: true, draft: current };
    if (req.kind === 'course') return ensureCourse(req.courseId, bound, current, stack, relation);
    if (req.kind === 'permission' || req.kind === 'unknown') {
      const next = clone(current); next.reviewNotes.add(`${label}: ${req.text}`);
      return { ok: true, draft: next };
    }
    if (req.kind === 'all') {
      let next = current;
      for (let index = 0; index < req.items.length; index++) {
        const result = requirement(req.items[index], bound, `${key}/${index}`, label, next, stack, relation);
        if (!result.ok) return result;
        next = result.draft;
      }
      return { ok: true, draft: next };
    }
    const items: Requirement[] = req.kind === 'units' ? [...new Set(req.courseIds)].map(courseId => ({ kind: 'course', courseId })) : 'items' in req ? req.items : [];
    const minimum = 'minimum' in req ? req.minimum : 1;
    const group: AutofillChoiceGroup = {
      id: key, label: `${label}: ${describeRequirement(req)}`, kind: req.kind, minimum,
      options: items.map((item, index) => ({ id: `option-${index}`, label: describeRequirement(item), courseIds: getPrerequisiteIds(item) })),
      selectedIds: [], automatic: !Object.hasOwn(options.choices ?? {}, key),
    };
    if (!items.length) return failure(`${label}: no concrete alternatives are available in this catalog.`);
    const override = options.choices?.[key];
    if (override && (new Set(override).size !== override.length || override.some(id => !group.options.some(option => option.id === id)))) return failure(`${label}: the alternative selection is invalid.`);
    if (req.kind === 'any' && override && override.length !== 1) return failure(`${label}: choose exactly one alternative.`);
    const remaining = group.options.map((option, index) => ({ ...option, index })).filter(option => !override || override.includes(option.id));
    let next = current;
    while (remaining.length) {
      const ready = req.kind === 'units'
        ? evaluateRequirement(req, availableIds(next, bound), courses).state === 'met'
        : group.selectedIds.length >= minimum;
      if (ready && !override) break;
      const candidates = remaining.map(option => ({ option, attempt: requirement(items[option.index], bound, `${key}/${option.index}`, label, clone(next), stack, relation) }));
      const feasible = candidates.filter((candidate): candidate is typeof candidate & { attempt: { ok: true; draft: Draft } } => candidate.attempt.ok);
      feasible.sort((a, b) => score(a.attempt.draft, next) - score(b.attempt.draft, next) || a.option.index - b.option.index);
      const best = feasible[0];
      if (!best) return failure(`${label}: no selected alternative fits the available terms. ${candidates.map(candidate => !candidate.attempt.ok ? candidate.attempt.reason : '').filter(Boolean).join(' ')}`);
      next = best.attempt.draft;
      group.selectedIds.push(best.option.id);
      remaining.splice(remaining.findIndex(option => option.id === best.option.id), 1);
      if (req.kind === 'any') break;
    }
    const selectionSatisfied = req.kind === 'units'
      ? evaluateRequirement(req, availableIds(next, bound), courses).state === 'met'
      : group.selectedIds.length >= minimum;
    if (!selectionSatisfied) return failure(`${label}: the selected alternatives do not meet the ${req.kind === 'units' ? 'known-unit' : 'course-count'} requirement within this horizon.`);
    if (req.kind === 'count') {
      const checked = evaluateRequirement(req, availableIds(next, bound), courses);
      if (checked.state === 'missing') return failure(`${label}: selected items do not establish enough distinct requirements. ${checked.reasons.join(' ')}`);
      if (checked.state === 'review') checked.reasons.forEach(reason => next.reviewNotes.add(`${label}: ${reason}`));
    }
    next = clone(next); next.choices.set(key, group);
    return { ok: true, draft: next };
  }

  function ensureCourse(id: string, bound: number, current: Draft, stack: Visit[], relation: Relation): Attempt {
    const prior = current.assignments.get(id);
    if (prior?.status === 'completed') return { ok: true, draft: current };
    const course = byId.get(id);
    if (!course) return failure(`${id} is outside the imported catalog; review its requirements manually.`);
    if (mode === 'program' && !original.has(id)) {
      // Respect both the current draft and coursework the student already chose,
      // including existing planned subjects not yet visited by this proposal.
      const conflict = [...new Set([...current.assignments.keys(), ...original.keys()])].find(other => excludesCredit(id, other));
      if (conflict) return failure(`${id} and ${conflict}: the official catalog says credit cannot also be received for both. Choose a different subject or review the existing choice with an advisor.`);
    }
    const active = stack.findIndex(visit => visit.id === id);
    if (active >= 0) {
      const cycle = stack.slice(active + 1);
      if (relation === 'corequisite' && cycle.every(visit => visit.relation === 'corequisite') && stack[active].index <= bound) return { ok: true, draft: current };
      return failure(`${id} participates in a prerequisite cycle; advisor review is required.`);
    }
    if (prior && current.verified.has(id)) return orderedTerms.indexOf(prior.term) <= bound ? { ok: true, draft: current } : failure(`${id} is already assigned to ${prior.term}, too late for this requirement.`);
    const fixed = mode === 'prerequisites' ? original.get(id) : undefined;
    const fixedIndex = fixed ? orderedTerms.indexOf(fixed.term) : -1;
    if (fixed && (fixedIndex < 0 || fixedIndex > bound)) return failure(`${id} is already assigned to ${fixed.term}; its term must be reviewed manually.`);
    let candidates = fixed ? [fixedIndex] : orderedTerms.map((_, index) => index).filter(index => index >= start && index <= bound);
    if (!fixed && mode === 'prerequisites') candidates = candidates.reverse();
    let reason = `${id} has no available earlier term in this planning horizon.`;
    let fallback: { ok: true; draft: Draft } | undefined;
    const remember = (message: string) => { if (/cycle|outside the imported catalog/.test(message) || !/cycle|outside the imported catalog/.test(reason)) reason = message; };
    for (const index of candidates) {
      if (!offered(course, index)) { remember(`${id} is not listed for a suitable term in the catalog offering pattern.`); continue; }
      const next = clone(current);
      const units = knownUnits(course);
      const occupied = [...next.assignments.values()].filter(item => item.courseId !== id && item.status === 'planned' && item.term === orderedTerms[index]).reduce((sum, item) => sum + (knownUnits(byId.get(item.courseId)) ?? 0), 0);
      if (!fixed && units !== null && occupied + units > options.paceUnits) { remember(`${id} does not fit the ${options.paceUnits}-unit capacity in a suitable term.`); continue; }
      next.assignments.set(id, { courseId: id, term: orderedTerms[index], status: 'planned' });
      if (units === null) next.reviewNotes.add(`${id} has unknown or arranged units; term capacity needs review.`);
      const visits = [...stack, { id, index, relation }];
      const prerequisites = requirement(course.prerequisites, index - 1, `course:${id}:prerequisites`, `${id} prerequisites`, next, visits, 'prerequisite');
      if (!prerequisites.ok) { remember(prerequisites.reason); continue; }
      const corequisites = requirement(course.corequisites, index, `course:${id}:corequisites`, `${id} corequisites`, prerequisites.draft, visits, 'corequisite');
      if (!corequisites.ok) { remember(corequisites.reason); continue; }
      corequisites.draft.verified.add(id);
      // A first-term permission route is provisional. In program mode, look for
      // a later concrete chain before settling for that route. Explicit branch
      // overrides remain active throughout the search and are never replaced.
      if (mode === 'program' && corequisites.draft.reviewNotes.size > current.reviewNotes.size) {
        if (!fallback || score(corequisites.draft, current) < score(fallback.draft, current)) fallback = corequisites;
        continue;
      }
      return corequisites;
    }
    return fallback ?? failure(reason);
  }

  if (!validOptions) {
    draft.reviewNotes.add('Choose a supported start term and a positive planning capacity before using autocomplete.');
  } else if (program.id !== path.programId) {
    draft.reviewNotes.add('The selected program does not match this path. Reopen autocomplete for the current program.');
  } else {
    if (mode === 'program') {
      // Commit top-level groups separately so explicit unknown requirements do not
      // hide useful mapped portions; each failed branch remains transactional.
      const groups = program.requirements?.kind === 'all' ? program.requirements.items : [program.requirements];
      groups.forEach((req, index) => {
        const result = requirement(req, orderedTerms.length - 1, `program:${program.id}/${index}`, program.shortName, clone(draft), [], 'root');
        if (result.ok) draft = result.draft;
        else { programUnresolved = true; draft.reviewNotes.add(result.reason); if (req?.kind === 'course' && !draft.assignments.has(req.courseId)) unresolved.set(req.courseId, result.reason); }
      });
      draft.reviewNotes.add('This fills only modeled program requirements. The imported subset cannot establish a complete major, minor or graduate degree audit.');
      if (program.kind === 'masters') {
        const namedSubjects = getPrerequisiteIds(program.requirements).filter(id => byId.has(id));
        draft.reviewNotes.add(`This graduate model names only ${new Set(namedSubjects).size} required program subjects. Approved graduate coursework, elective allocation, thesis units and admission still need advisor review; this is not a complete graduate study plan.`);
      }
    }
    const targets = path.courses.filter(item => item.status === 'planned').sort((a, b) => (termOrder(a.term) ?? Infinity) - (termOrder(b.term) ?? Infinity) || a.courseId.localeCompare(b.courseId));
    for (const target of targets) {
      const bound = mode === 'prerequisites' ? orderedTerms.indexOf(target.term) : orderedTerms.length - 1;
      const result = ensureCourse(target.courseId, bound, clone(draft), [], 'root');
      if (result.ok) draft = result.draft;
      else unresolved.set(target.courseId, result.reason);
    }
  }
  // Never delete existing work, even if a bounded program proposal cannot place it.
  const final = new Map(path.courses.map(item => [item.courseId, { ...item }]));
  draft.assignments.forEach((item, id) => final.set(id, item));
  const assignments = [...final.values()];
  for (let index = 0; index < assignments.length; index++) {
    for (const other of assignments.slice(index + 1)) {
      const id = assignments[index].courseId;
      if (excludesCredit(id, other.courseId)) draft.reviewNotes.add(`${id} and ${other.courseId}: the official catalog says credit cannot also be received for both. Existing coursework was preserved; credit allocation needs advisor review.`);
    }
  }
  const additions = assignments.filter(item => !original.has(item.courseId));
  const moves = assignments.filter(item => original.has(item.courseId) && item.term !== original.get(item.courseId)!.term).map(item => ({ courseId: item.courseId, fromTerm: original.get(item.courseId)!.term, toTerm: item.term }));
  const proposedPath = { ...path, courses: assignments };
  for (const item of assignments.filter(item => item.status === 'planned')) {
    const course = byId.get(item.courseId);
    if (!course) continue;
    const result = evaluateCourse(course, proposedPath, courses);
    if (result.state === 'review') result.reasons.forEach(reason => draft.reviewNotes.add(`${item.courseId}: ${reason}`));
    if (result.state === 'met' && offered(course, orderedTerms.indexOf(item.term))) unresolved.delete(item.courseId);
    else if (result.state === 'missing' && !unresolved.has(item.courseId)) unresolved.set(item.courseId, result.reasons.join(' '));
  }
  const termLoads = orderedTerms.map(term => {
    const items = assignments.filter(item => item.status === 'planned' && item.term === term);
    return { term, knownUnits: items.reduce((sum, item) => sum + (knownUnits(byId.get(item.courseId)) ?? 0), 0), unknownUnitCourseIds: items.filter(item => knownUnits(byId.get(item.courseId)) === null).map(item => item.courseId) };
  });
  termLoads.filter(load => load.knownUnits > options.paceUnits).forEach(load => draft.reviewNotes.add(`${load.term} already contains ${load.knownUnits} known units, above the ${options.paceUnits}-unit planning capacity.`));
  unresolved.forEach((reason, id) => draft.reviewNotes.add(`${id}: ${reason}`));
  return { additions, moves, assignments, choices: [...draft.choices.values()], reviewNotes: [...draft.reviewNotes], unscheduled: [...unresolved].map(([courseId, reason]) => ({ courseId, reason })), termLoads, notes, hasChanges: additions.length > 0 || moves.length > 0, allSelectedCoursesScheduled: unresolved.size === 0 && !programUnresolved && validOptions && program.id === path.programId };
}
