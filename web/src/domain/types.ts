export type Theme = 'plain' | 'dark' | 'mit' | 'nyu' | 'stanford' | 'virginia-tech';

export type Requirement =
  | { kind: 'course'; courseId: string }
  | { kind: 'all' | 'any'; items: Requirement[] }
  | { kind: 'count'; minimum: number; items: Requirement[] }
  | { kind: 'units'; minimum: number; courseIds: string[] }
  | { kind: 'permission' | 'unknown'; text: string };

export interface Meeting {
  section: string;
  days: number[];
  startMinutes: number;
  endMinutes: number;
  term: string;
}

export interface Course {
  id: string;
  title: string;
  department: string;
  units: number;
  unitsLabel: string;
  level: 'undergraduate' | 'graduate';
  terms: string[];
  description: string;
  prerequisites: Requirement | null;
  corequisites?: Requirement | null;
  prerequisiteText?: string;
  sourceUrl: string;
  meetings?: Meeting[];
  notes?: string[];
}

export interface Program {
  id: string;
  name: string;
  shortName: string;
  kind: 'major' | 'minor' | 'masters';
  courseIds: string[];
  requirements: Requirement | null;
  sourceUrl: string;
  notes: string[];
}

export interface Catalog {
  school: 'MIT';
  catalogYear: string;
  fetchedAt: string;
  sourceUrls: string[];
  courses: Course[];
  programs: Program[];
  notes: string[];
}

export interface PlannedCourse {
  courseId: string;
  term: string;
  status: 'planned' | 'completed';
}

/** A student's record of an advisor discussion, not an institutional degree verification. */
export interface ProgramCompletionRecord {
  kind: 'user-recorded-advisor-review';
  pathId: string;
  programId: string;
  catalogYear: string;
  confirmedAt: string;
  advisorReviewAcknowledged: true;
  /** Earned-course membership when the student recorded this milestone. */
  completedCourseIds: string[];
}

export interface SavedPath {
  id: string;
  name: string;
  programId: string;
  courses: PlannedCourse[];
  createdAt: string;
  updatedAt: string;
  catalogYear: string;
  /** Advisor-confirmed remaining units; never inferred from this partial catalog. */
  remainingUnits?: number;
  /** A planning capacity scenario, not an approved enrollment or graduation plan. */
  paceUnits?: number;
  /** Major fulfillment reported by the student after advisor review; scoped to this path/history. */
  programCompletion?: ProgramCompletionRecord;
}

export interface RequirementResult {
  state: 'met' | 'missing' | 'review';
  missingCourseIds: string[];
  reasons: string[];
}
