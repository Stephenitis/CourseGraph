import type { PlannedCourse } from '../domain/types';
import { termOrder } from '../domain/requirements';

/** A solid route is a selected contribution supported by the actual semester plan. */
export function supportsChosenConnection(source: PlannedCourse | undefined, target: PlannedCourse | undefined, corequisite: boolean, sourceEligible: boolean): boolean {
  if (!source || !target) return false;
  if (source.status === 'completed') return true;
  if (!sourceEligible || target.status === 'completed') return false;
  const from = termOrder(source.term), to = termOrder(target.term);
  return from !== null && to !== null && (from < to || (corequisite && from === to));
}
