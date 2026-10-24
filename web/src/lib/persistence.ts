import { HYPOTHETICAL_OUTCOMES } from '../domain/types';
import type { Catalog, SavedPath, Theme } from '../domain/types';
import { isProgramCompletionRecord, reconcileProgramCompletion } from '../domain/programCompletion';
export interface Store { version: 1; selectedPathId: string; theme: Theme; paths: SavedPath[] }
const KEY = 'coursegraph.paths.v1';
const BACKUP = 'coursegraph.paths.backup.v1';
export const themes: Theme[] = ['plain', 'dark', 'mit', 'nyu', 'stanford', 'virginia-tech'];
export const TERMS = ['Fall 2026', 'Spring 2027', 'Fall 2027', 'Spring 2028', 'Fall 2028', 'Spring 2029', 'Fall 2029', 'Spring 2030'];
export function uid() { return globalThis.crypto?.randomUUID?.() ?? `path-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
export function validateStore(raw: unknown, catalog: Catalog): Store {
  if (!raw || typeof raw !== 'object') throw new Error('This file is not a CourseGraph export.');
  const x = raw as Record<string, unknown>;
  if (x.version !== 1 || !Array.isArray(x.paths) || !x.paths.length || x.paths.length > 100) throw new Error('Use a CourseGraph version 1 export with 1–100 paths.');
  const ids = new Set(catalog.courses.map(c => c.id));
  const seen = new Set<string>();
  const paths = x.paths.map((value: unknown) => {
    if (!value || typeof value !== 'object') throw new Error('A saved path is invalid.');
    const p = value as SavedPath;
    if (typeof p.id !== 'string' || !p.id || seen.has(p.id) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 80 || !catalog.programs.some(c => c.id === p.programId) || !Array.isArray(p.courses) || p.courses.length > 2000 || typeof p.catalogYear !== 'string' || typeof p.createdAt !== 'string' || typeof p.updatedAt !== 'string') throw new Error('A saved path contains missing or unsupported fields.');
    if(p.catalogYear!==catalog.catalogYear)throw new Error(`This path uses catalog ${p.catalogYear}. This prototype supports ${catalog.catalogYear}; an advisor-reviewed catalog migration is required before import.`);
    if(p.remainingUnits!==undefined&&(!Number.isFinite(p.remainingUnits)||p.remainingUnits<0||p.remainingUnits>10000))throw new Error('Remaining units must be between 0 and 10,000.');
    if(p.paceUnits!==undefined&&![36,48,54].includes(p.paceUnits))throw new Error('Choose a supported workload pace: 36, 48 or 54 units.');
    if(p.programCompletion!==undefined&&!isProgramCompletionRecord(p.programCompletion))throw new Error('The major review record is invalid. Use an original CourseGraph export or reset the record.');
    seen.add(p.id);
    const assigned = new Set<string>();
    for (const c of p.courses) {
      if (!c || !ids.has(c.courseId) || assigned.has(c.courseId) || typeof c.term !== 'string' || !TERMS.includes(c.term) || !['completed','planned'].includes(c.status)) throw new Error('A path has an unknown course, duplicate assignment, term, or status.');
      assigned.add(c.courseId);
    }
    if(p.hypotheticalOutcomes!==undefined && (!p.hypotheticalOutcomes || typeof p.hypotheticalOutcomes!=='object' || Array.isArray(p.hypotheticalOutcomes) || Object.entries(p.hypotheticalOutcomes).some(([id,value])=>!ids.has(id)||!HYPOTHETICAL_OUTCOMES.includes(value))))throw new Error('Hypothetical outcomes must use known courses and a supported grade or Pass/Fail.');
    const review=p.programCompletion;
    return {id:p.id, ...(p.hypotheticalOutcomes?{hypotheticalOutcomes:{...p.hypotheticalOutcomes}}:{}), ...(p.remainingUnits!==undefined?{remainingUnits:p.remainingUnits}:{}), ...(p.paceUnits!==undefined?{paceUnits:p.paceUnits}:{}), ...(review?{programCompletion:{kind:review.kind,pathId:review.pathId,programId:review.programId,catalogYear:review.catalogYear,confirmedAt:review.confirmedAt,advisorReviewAcknowledged:review.advisorReviewAcknowledged,completedCourseIds:[...review.completedCourseIds].sort()}}:{}), name:p.name.trim(), programId:p.programId, catalogYear:p.catalogYear, createdAt:p.createdAt, updatedAt:p.updatedAt, courses:p.courses.map(c => ({courseId:c.courseId, term:c.term, status:c.status}))};
  });
  const completed=[...new Map(paths.flatMap(p=>p.courses.filter(c=>c.status==='completed')).map(c=>[c.courseId,c])).values()];
  const syncedPaths=paths.map(p=>reconcileProgramCompletion({...p,courses:[...completed,...p.courses.filter(c=>!completed.some(d=>d.courseId===c.courseId))]},catalog));
  return {version:1, selectedPathId:paths.some(p => p.id === x.selectedPathId) ? String(x.selectedPathId) : paths[0].id, theme:themes.includes(x.theme as Theme) ? x.theme as Theme : 'plain', paths:syncedPaths};
}
export function loadStore(catalog: Catalog, fallback: Store): {store: Store; notice?: string} {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {store:fallback};
    try { return {store:validateStore(JSON.parse(raw), catalog)}; }
    catch {
      const backup = localStorage.getItem(BACKUP);
      if (backup) { try {return {store:validateStore(JSON.parse(backup),catalog),notice:'Your previous saved version was recovered. Export a backup to keep it safe.'};} catch { /* Preserve invalid data below. */ } }
      localStorage.setItem(`${KEY}.recovery.${Date.now()}`,raw);
      return {store:fallback,notice:'Your saved data could not be read. It was preserved in browser recovery storage; example paths are shown.'};
    }
  } catch { return {store:fallback,notice:'Browser storage is unavailable. You can explore here and export your paths to save them.'}; }
}
export function saveStore(store: Store, catalog: Catalog): string | null {
  try {
    const validated=validateStore(store,catalog);
    const existing = localStorage.getItem(KEY);
    if (existing) {try {validateStore(JSON.parse(existing),catalog); localStorage.setItem(BACKUP,existing);} catch { /* Never replace recovery with invalid data. */ }}
    localStorage.setItem(KEY,JSON.stringify(validated));
    return null;
  } catch { return 'Saving on this device failed. Export your paths before closing this page.'; }
}
export function serializeStore(store:Store,catalog:Catalog):string {
  return JSON.stringify(validateStore(store,catalog),null,2);
}
export function exportStore(store:Store,catalog:Catalog) {
  const url=URL.createObjectURL(new Blob([serializeStore(store,catalog)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='coursegraph-paths.json';a.click();URL.revokeObjectURL(url);
}
