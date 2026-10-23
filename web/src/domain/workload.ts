import type { Course, Program, Requirement, SavedPath } from './types';
import { describeRequirement, evaluateRequirement, termOrder } from './requirements';

/** MIT-specific facts checked against the linked primary sources on October 23, 2026. */
export const workloadGuidance = {
  school: 'MIT',
  verifiedOn: '2026-10-23',
  catalogYear: '2026-2027',
  averageUnitsPerRegularTerm: 48,
  expectedUndergraduateRegularTerms: 8,
  typicalUnitsRange: [48, 54] as const,
  hoursPerUnitPerTerm: 14,
  firstYearLimits: { fall: 54, spring: 60, iap: 12, restrictedDiscoveryAllowance: 6, springOnAcademicWarning: 48 },
  summary: 'MIT plans around an average of 48 units per regular term over eight terms. The Office of the First Year describes 48–54 units as typical; 60 is a first-year spring upper limit, not an expectation.',
  unitHoursNote: 'One MIT unit represents about 14 hours of work over a term, or about one hour per week for a full-term subject. This includes class, lab and preparation; actual workloads vary.',
  firstYearNote: 'First-year limits are 54 regular units in fall and 60 in spring, with up to 6 additional units restricted to approved discovery/advising subjects. IAP is limited to 12 units. Academic warning or other individual limits can be lower.',
  sources: [
    { label: 'MIT academic standards', url: 'https://catalog.mit.edu/mit/procedures/academic-performance-grades/' },
    { label: 'First-year workload and limits', url: 'https://firstyear.mit.edu/academics-exploration/credit-limits-grading/' },
    { label: 'Registrar first-year guidance', url: 'https://registrar.mit.edu/registration-academics/advising-resources-students/progressing-through-mit-first-year' },
    { label: 'MIT units and work hours', url: 'https://registrar.mit.edu/registration-academics/academic-requirements/subject-levels-credit' },
    { label: 'Full-term workload definition', url: 'https://catalog.mit.edu/mit/procedures/registration/' },
  ],
} as const;

export interface UnitRange { min: number; max: number }
export interface ProgramRequirementSummary {
  programId: string;
  kind: Program['kind'];
  headline: string;
  detail: string;
  sourceUrl: string;
  /** These ranges overlap; they must not be added together to invent a degree total. */
  unitsInMajor?: UnitRange;
  unitsBeyondGIRs?: UnitRange;
  unrestrictedElectives?: UnitRange;
  girOverlapUnits?: UnitRange;
  girSubjectCount?: number;
  /** Only the minor or graduate component, never an entire SB + MEng combination. */
  componentUnits?: number;
  requiredSubjectCount?: number;
  requirements: string[];
}

export const programRequirementSummaries: Record<string, ProgramRequirementSummary> = {
  'major6-3': {
    programId: 'major6-3', kind: 'major', headline: '17 GIR subjects + 180–198 units beyond the GIRs',
    detail: 'The major includes 177–183 units, with 36–60 units also satisfying GIRs. These are overlapping totals, not amounts to add together. Track choices, communication, PE and credit rules still apply.',
    sourceUrl: 'https://catalog.mit.edu/degree-charts/computer-science-engineering-course-6-3/',
    unitsInMajor: { min: 177, max: 183 }, unitsBeyondGIRs: { min: 180, max: 198 }, unrestrictedElectives: { min: 48, max: 60 }, girOverlapUnits: { min: 36, max: 60 }, girSubjectCount: 17,
    requirements: ['Computer science foundations and core choices', 'Track electives, advanced undergraduate and AI subjects', 'GIRs, communication, PE and all credit/overlap conditions'],
  },
  'major6-4': {
    programId: 'major6-4', kind: 'major', headline: '17 GIR subjects + 180–189 units beyond the GIRs',
    detail: 'The major includes 168–177 units; 36 also satisfy GIRs. There are 48 unrestricted elective units. These are overlapping totals; centers, communication and SERC requirements need valid allocation.',
    sourceUrl: 'https://catalog.mit.edu/degree-charts/artifical-intelligence-decision-making-course-6-4/',
    unitsInMajor: { min: 168, max: 177 }, unitsBeyondGIRs: { min: 180, max: 189 }, unrestrictedElectives: { min: 48, max: 48 }, girOverlapUnits: { min: 36, max: 36 }, girSubjectCount: 17,
    requirements: ['Programming, algorithms, mathematics and probability foundations', 'Five centers covering five areas, application CI-M and electives', 'Second CI-M, SERC, GIRs, PE and credit/overlap conditions'],
  },
  minor18: {
    programId: 'minor18', kind: 'minor', headline: '6 mathematics subjects · 72 units in the minor',
    detail: 'Six 12-unit subjects beyond the Institute Mathematics Requirement, including at least three advanced subjects, with essentially different content. A minor supplements a degree; it does not necessarily add 72 new units to an existing major plan.',
    sourceUrl: 'https://catalog.mit.edu/schools/science/mathematics/#undergraduatetext',
    componentUnits: 72, requiredSubjectCount: 6,
    requirements: ['Six 12-unit mathematics subjects beyond the Institute Mathematics Requirement', 'At least three advanced subjects', 'Different content, eligibility and overlap reviewed with an advisor'],
  },
  'master6-P': {
    programId: 'master6-P', kind: 'masters', headline: '91 units in the graduate component, after eligible SB requirements',
    detail: 'The 6-P MEng requires separate admission and an eligible MIT EECS bachelor degree. The graduate component includes a 24-unit thesis, 1-unit internship, 48 approved graduate units and 18 qualifying electives. A unit budget cannot predict thesis completion.',
    sourceUrl: 'https://catalog.mit.edu/degree-charts/master-electrical-engineering-computer-science-course-6-p/',
    componentUnits: 91,
    requirements: ['24-unit MEng thesis and 1-unit professional internship', 'Four approved graduate subjects totaling at least 48 units, with concentration requirements', 'At least 18 qualifying Course 6/18 elective units, admission and degree approvals'],
  },
};

export interface PaceScenario { id: 'lighter' | 'typical' | 'intensive'; label: string; unitsPerTerm: number; description: string }
export const paceScenarios: PaceScenario[] = [
  { id: 'lighter', label: 'Lighter', unitsPerTerm: 36, description: 'Our lighter planning scenario: roughly three 12-unit subjects. This is not an MIT recommendation or a guarantee of satisfactory progress.' },
  { id: 'typical', label: 'Typical', unitsPerTerm: 48, description: 'MIT’s average planning pace: roughly four 12-unit subjects per regular term.' },
  { id: 'intensive', label: 'Intensive', unitsPerTerm: 54, description: 'Our more intensive scenario, at the upper end of MIT’s typical 48–54-unit range. It does not promise faster graduation.' },
];

export interface CreditLimit {
  regularUnitCap: number | null;
  additionalDiscoveryUnits: number;
  maximumSubjects?: number;
  explanation: string;
}
export interface StudentLoadContext { isFirstYear?: boolean; onAcademicWarning?: boolean }

export function getCreditLimit(term: string, context: StudentLoadContext = {}): CreditLimit {
  const season = term.toLowerCase();
  if (/\b(iap|winter)\b/.test(season)) return { regularUnitCap: 12, additionalDiscoveryUnits: 0, explanation: 'IAP has a 12-unit limit. Its short calendar makes weekly intensity different from a regular term.' };
  if (context.isFirstYear && /\bspring\b/.test(season) && context.onAcademicWarning) return { regularUnitCap: 48, additionalDiscoveryUnits: 0, maximumSubjects: 4, explanation: 'First-year students placed on CAP warning after fall have a spring limit of four subjects, up to 48 units. Confirm individual conditions with an advisor.' };
  if (context.isFirstYear && /\bfall\b|\bautumn\b/.test(season)) return { regularUnitCap: 54, additionalDiscoveryUnits: 6, explanation: 'First-year fall: 54 regular units, plus up to 6 units only in eligible discovery/advising subjects. The allowance is not six unrestricted extra units.' };
  if (context.isFirstYear && /\bspring\b/.test(season)) return { regularUnitCap: 60, additionalDiscoveryUnits: 6, explanation: 'First-year spring: 60 regular units, plus up to 6 eligible discovery units. Sixty is an upper limit, not the normal expectation.' };
  return { regularUnitCap: null, additionalDiscoveryUnits: 0, explanation: context.onAcademicWarning ? 'An individual credit limit may apply; confirm it with your advisor.' : 'No general upper-level cap is inferred here. Individual advising and registration limits may apply.' };
}

export interface TermWorkload {
  term: string;
  courseCount: number;
  knownUnits: number;
  unknownUnitCourseIds: string[];
  approximateTermHours: number;
  /** Average across a regular term, not a prediction of each week; null for IAP/summer/unknown terms. */
  approximateWeeklyHours: number | null;
  band: 'empty' | 'below-typical' | 'typical' | 'above-typical' | 'unknown';
  limit: CreditLimit;
  exceedsRegularUnitCap: boolean;
  exceedsSubjectCap: boolean;
  notes: string[];
}

export function summarizeTermWorkload(path: SavedPath, courses: Course[], term: string, context: StudentLoadContext = {}): TermWorkload {
  const order = termOrder(term);
  const entries = path.courses.filter(item => item.status === 'planned' && (order === null ? item.term === term : termOrder(item.term) === order));
  const ids = [...new Set(entries.map(item => item.courseId))];
  const byId = new Map(courses.map(course => [course.id, course]));
  const unknownUnitCourseIds = ids.filter(id => {
    const course = byId.get(id);
    return !course || !Number.isFinite(course.units) || course.units < 0 || /arranged/i.test(course.unitsLabel);
  });
  const unknown = new Set(unknownUnitCourseIds);
  const knownUnits = ids.reduce((total, id) => total + (unknown.has(id) ? 0 : byId.get(id)!.units), 0);
  const regularTerm = order !== null && /\b(fall|autumn|spring)\b/i.test(term);
  const limit = getCreditLimit(term, context);
  const notes = ['Unit-based workload is an average planning aid, not measured study time. Half-term subjects and labs can make individual weeks more intense.'];
  if (unknown.size) notes.push('Some units are arranged or unavailable. The total is a known-unit subtotal, not the complete workload.');
  if (!regularTerm && ids.length) notes.push('Weekly hours are not estimated for IAP, summer or unknown terms.');
  return {
    term, courseCount: ids.length, knownUnits, unknownUnitCourseIds,
    approximateTermHours: knownUnits * workloadGuidance.hoursPerUnitPerTerm,
    approximateWeeklyHours: regularTerm && !unknown.size ? knownUnits : null,
    band: unknown.size ? 'unknown' : !ids.length ? 'empty' : !regularTerm ? 'unknown' : knownUnits < 48 ? 'below-typical' : knownUnits <= 54 ? 'typical' : 'above-typical',
    limit,
    exceedsRegularUnitCap: limit.regularUnitCap !== null && knownUnits > limit.regularUnitCap,
    exceedsSubjectCap: limit.maximumSubjects !== undefined && ids.length > limit.maximumSubjects,
    notes,
  };
}

/** The caller supplies advisor-confirmed net remaining units. Never subtract this subset from a guessed degree total. */
export function estimateRemainingSemesters(remainingUnits: number | null | undefined, unitsPerTerm: number): number | null {
  if (remainingUnits == null || !Number.isFinite(remainingUnits) || remainingUnits < 0 || !Number.isFinite(unitsPerTerm) || unitsPerTerm <= 0) return null;
  return Math.ceil(remainingUnits / unitsPerTerm);
}

export interface CapacityTerm { term: string; units: number }
export interface CapacityProjection { semesters: number | null; terms: CapacityTerm[]; limitation: string }
export const capacityLimitation = 'Capacity estimate only. Prerequisite chains, seasonal offerings, course sizes, thesis work, approvals and degree rules can require more semesters. These are unit budgets, not scheduled courses or a graduation date.';

export function projectCapacity(remainingUnits: number | null, unitsPerTerm: number, startTerm: string): CapacityProjection {
  const semesters = estimateRemainingSemesters(remainingUnits, unitsPerTerm);
  if (semesters === null) return { semesters: null, terms: [], limitation: 'Enter advisor-confirmed remaining units to compare capacity. ' + capacityLimitation };
  const parsed = startTerm.match(/\b(20\d{2})\b/);
  const isFall = /\b(fall|autumn)\b/i.test(startTerm);
  const isSpring = /\bspring\b/i.test(startTerm);
  if (!parsed || (!isFall && !isSpring)) return { semesters, terms: [], limitation: 'Choose a fall or spring starting semester to display the capacity timeline. ' + capacityLimitation };
  // Bound chart rendering without silently changing the computed semester count.
  let year = Number(parsed[1]), fall = isFall, remaining = remainingUnits!;
  const terms: CapacityTerm[] = [];
  for (let index = 0; index < Math.min(semesters, 40); index++) {
    const units = Math.min(unitsPerTerm, remaining);
    terms.push({ term: `${fall ? 'Fall' : 'Spring'} ${year}`, units });
    remaining = Math.max(0, remaining - units);
    if (fall) year++;
    fall = !fall;
  }
  return { semesters, terms, limitation: (semesters > 40 ? 'The timeline displays the first 40 semesters. ' : '') + capacityLimitation };
}

export interface PlannedHorizon {
  firstPlannedTerm: string | null;
  lastPlannedTerm: string | null;
  plannedTermCount: number;
  regularSemesterSpan: number | null;
  unknownTerms: string[];
  /** A selected-course horizon is never a degree completion prediction. */
  label: string;
}

export function getPlannedHorizon(path: SavedPath): PlannedHorizon {
  const raw = [...new Set(path.courses.filter(item => item.status === 'planned').map(item => item.term))];
  const known = raw.filter(term => termOrder(term) !== null).sort((a, b) => termOrder(a)! - termOrder(b)!);
  const canonical = [...new Map(known.map(term => [termOrder(term), term])).values()];
  const regular = canonical.filter(term => /\b(fall|autumn|spring)\b/i.test(term));
  const semesterIndex = (term: string) => Number(term.match(/\b(20\d{2})\b/)![1]) * 2 + (/\b(fall|autumn)\b/i.test(term) ? 1 : 0);
  const unknownTerms = raw.filter(term => termOrder(term) === null);
  return {
    firstPlannedTerm: canonical[0] ?? null, lastPlannedTerm: canonical.at(-1) ?? null,
    plannedTermCount: canonical.length,
    regularSemesterSpan: regular.length ? semesterIndex(regular.at(-1)!) - semesterIndex(regular[0]) + 1 : null,
    unknownTerms,
    label: unknownTerms.length ? 'Some planned terms are unknown; the horizon is incomplete.' : canonical.length ? 'Last term with a selected course; not a graduation estimate.' : 'Add planned courses to see your selected-course horizon.',
  };
}

export interface MappedRequirementGroup {
  label: string;
  status: 'completed' | 'covered-by-plan' | 'missing' | 'review';
  candidateCourseIds: string[];
}
export interface MappedRequirementProgress {
  mappedGroups: number;
  completedGroups: number;
  plannedGroups: number;
  remainingGroups: MappedRequirementGroup[];
  groups: MappedRequirementGroup[];
  reviewReasons: string[];
  note: string;
}

function hasReviewCondition(requirement: Requirement): boolean {
  return requirement.kind === 'permission' || requirement.kind === 'unknown'
    || ('items' in requirement && requirement.items.some(hasReviewCondition));
}

export function getMappedRequirementProgress(program: Program, path: SavedPath, courses: Course[]): MappedRequirementProgress {
  const requirements = !program.requirements ? [] : program.requirements.kind === 'all' ? program.requirements.items : [program.requirements];
  const review = requirements.filter(hasReviewCondition);
  const mapped = requirements.filter(item => !hasReviewCondition(item));
  const completed = new Set(path.courses.filter(item => item.status === 'completed').map(item => item.courseId));
  const selected = new Set(path.courses.map(item => item.courseId));
  const groups: MappedRequirementGroup[] = mapped.map(requirement => {
    const done = evaluateRequirement(requirement, completed, courses);
    const planned = evaluateRequirement(requirement, selected, courses);
    return {
      label: describeRequirement(requirement),
      status: done.state === 'met' ? 'completed' : planned.state === 'met' ? 'covered-by-plan' : planned.state,
      candidateCourseIds: planned.missingCourseIds,
    };
  });
  return {
    mappedGroups: groups.length,
    completedGroups: groups.filter(group => group.status === 'completed').length,
    plannedGroups: groups.filter(group => group.status === 'covered-by-plan').length,
    remainingGroups: groups.filter(group => group.status === 'missing' || group.status === 'review'),
    groups,
    reviewReasons: review.map(describeRequirement),
    note: 'Only explicitly modeled requirement groups are counted. Selected courses are conditional coverage, not earned credit or prerequisite approval. Groups may overlap; this is not a count of remaining subjects, units or degree completion.',
  };
}
