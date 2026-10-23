import type { Catalog, PlannedCourse, SavedPath } from '../domain/types';
import { TERMS, uid } from './persistence';

export interface SharedPathSnapshot {
  version: 1;
  name: string;
  programId: string;
  catalogYear: string;
  courses: { courseId: string; term: string }[];
}
const MAX_ENCODED_LENGTH = 20000;

function validateSnapshot(raw: unknown, catalog: Catalog): SharedPathSnapshot {
  if (!raw || typeof raw !== 'object') throw new Error('This shared path could not be read.');
  const value = raw as Partial<SharedPathSnapshot>;
  if (value.version !== 1 || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 80 || !catalog.programs.some(p => p.id === value.programId)) throw new Error('This shared path has an unsupported name or program.');
  if (value.catalogYear !== catalog.catalogYear) throw new Error(`This shared path uses a different catalog. This prototype supports ${catalog.catalogYear}.`);
  if (!Array.isArray(value.courses) || value.courses.length > catalog.courses.length) throw new Error('This shared path has an invalid course list.');
  const known = new Set(catalog.courses.map(c => c.id));
  const seen = new Set<string>();
  const courses = value.courses.map(course => {
    if (!course || typeof course.courseId !== 'string' || !known.has(course.courseId) || seen.has(course.courseId) || !TERMS.includes(course.term)) throw new Error('This shared path contains an unknown course, duplicate, or semester.');
    seen.add(course.courseId);
    return { courseId: course.courseId, term: course.term };
  });
  return { version: 1, name: value.name.trim(), programId: value.programId!, catalogYear: value.catalogYear, courses };
}

/** The link contains course choices, never earned-credit status, profile, or advisor records. */
export function createSharedPathUrl(path: SavedPath, catalog: Catalog, baseUrl = 'https://coursegraph.my/'): string {
  const snapshot = validateSnapshot({ version: 1, name: path.name, programId: path.programId, catalogYear: path.catalogYear, courses: path.courses.map(({ courseId, term }) => ({ courseId, term })) }, catalog);
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  const encoded = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (encoded.length > MAX_ENCODED_LENGTH) throw new Error('This path is too large for a link. Export it as a file instead.');
  const url = new URL(baseUrl);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Use a web address for this shared path.');
  url.search = '';
  url.hash = `path=${encoded}`;
  return url.toString();
}

/** Decoding is read-only; the caller asks the recipient before adding a local copy. */
export function readSharedPath(hash: string, catalog: Catalog): SharedPathSnapshot | null {
  if (!hash.startsWith('#path=')) return null;
  const encoded = hash.slice(6);
  if (!encoded || encoded.length > MAX_ENCODED_LENGTH || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('This shared path link is incomplete or too large.');
  let raw: unknown;
  try {
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0))));
  } catch { throw new Error('This shared path link is damaged. Ask for a new link.'); }
  return validateSnapshot(raw, catalog);
}

/** A shared plan never grants the recipient someone else's completed credits. */
export function createPathFromShare(snapshot: SharedPathSnapshot, catalog: Catalog, ownCompletedCourses: PlannedCourse[]): SavedPath {
  const valid = validateSnapshot(snapshot, catalog);
  const known = new Set(catalog.courses.map(c => c.id));
  const completed = [...new Map(ownCompletedCourses.filter(c => c.status === 'completed' && known.has(c.courseId) && TERMS.includes(c.term)).map(c => [c.courseId, { ...c }])).values()];
  const completedIds = new Set(completed.map(c => c.courseId));
  const timestamp = new Date().toISOString();
  return { id: uid(), name: valid.name, programId: valid.programId, catalogYear: valid.catalogYear, createdAt: timestamp, updatedAt: timestamp, courses: [...completed, ...valid.courses.filter(c => !completedIds.has(c.courseId)).map(c => ({ ...c, status: 'planned' as const }))] };
}
