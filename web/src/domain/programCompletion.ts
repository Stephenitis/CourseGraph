import type { Catalog, ProgramCompletionRecord, SavedPath } from './types';

export interface ProgramCompletionStatus {
  state: 'unrecorded' | 'recorded' | 'stale' | 'ineligible';
  reason: string;
  record?: ProgramCompletionRecord;
}

function completedIds(path: SavedPath): string[] {
  return [...new Set(path.courses.filter(course => course.status === 'completed').map(course => course.courseId))].sort();
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

/** Validate imported data before using it; an acknowledgement is not an external verification. */
export function isProgramCompletionRecord(value: unknown): value is ProgramCompletionRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const ids = record.completedCourseIds;
  return record.kind === 'user-recorded-advisor-review'
    && record.advisorReviewAcknowledged === true
    && ['pathId', 'programId', 'catalogYear'].every(key => typeof record[key] === 'string' && record[key].length > 0 && record[key].length <= 200)
    && isTimestamp(record.confirmedAt)
    && Array.isArray(ids) && ids.length <= 2000
    && ids.every(id => typeof id === 'string' && id.length > 0 && id.length <= 200)
    && new Set(ids).size === ids.length;
}

/** Never infer this milestone from the partial catalog's course counts or requirement result. */
export function getProgramCompletionStatus(path: SavedPath, catalog: Catalog): ProgramCompletionStatus {
  const program = catalog.programs.find(item => item.id === path.programId);
  if (program?.kind !== 'major') return { state: 'ineligible', reason: 'This milestone records an undergraduate major; minors and graduate programs have separate requirements.' };
  const record = path.programCompletion;
  if (record === undefined) return { state: 'unrecorded', reason: 'Record major fulfillment only after discussing the full requirements with an advisor.' };
  if (!isProgramCompletionRecord(record)) return { state: 'stale', reason: 'This review record is invalid. Record a new advisor review.' };
  if (record.pathId !== path.id || record.programId !== path.programId || record.catalogYear !== path.catalogYear || path.catalogYear !== catalog.catalogYear) {
    return { state: 'stale', reason: 'The path, major or catalog changed after this review. Review this path again.' };
  }
  if (JSON.stringify([...record.completedCourseIds].sort()) !== JSON.stringify(completedIds(path))) {
    return { state: 'stale', reason: 'Completed-course history changed after this review. Review the major milestone again.' };
  }
  return { state: 'recorded', record, reason: 'Major fulfillment recorded by you after advisor review. This is not MIT verification, a degree award or graduate admission.' };
}

/** Call only after the student explicitly confirms the advisor discussion and major fulfillment. */
export function recordProgramCompletion(path: SavedPath, catalog: Catalog, confirmedAt = new Date().toISOString()): SavedPath {
  if (catalog.programs.find(item => item.id === path.programId)?.kind !== 'major') throw new Error('Only an undergraduate major can receive this milestone.');
  if (path.catalogYear !== catalog.catalogYear) throw new Error('Review the major against the current catalog before recording this milestone.');
  if (!isTimestamp(confirmedAt)) throw new Error('Use a valid ISO timestamp for the review record.');
  return { ...path, programCompletion: {
    kind: 'user-recorded-advisor-review', pathId: path.id, programId: path.programId,
    catalogYear: path.catalogYear, confirmedAt, advisorReviewAcknowledged: true,
    completedCourseIds: completedIds(path),
  } };
}

/** Return a new path without the record; ordinary app Undo can restore the prior path. */
export function clearProgramCompletion(path: SavedPath): SavedPath {
  if (path.programCompletion === undefined) return path;
  const next = { ...path };
  delete next.programCompletion;
  return next;
}

/** Run after every path mutation, including shared completed-history updates and imported copies. */
export function reconcileProgramCompletion(path: SavedPath, catalog: Catalog): SavedPath {
  return path.programCompletion === undefined || getProgramCompletionStatus(path, catalog).state === 'recorded'
    ? path : clearProgramCompletion(path);
}
