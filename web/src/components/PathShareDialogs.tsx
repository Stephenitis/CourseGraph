import { useState } from 'react';
import { Check, Copy, GitBranch, Link, X } from 'lucide-react';
import type { Catalog } from '../domain/types';
import type { SharedPathSnapshot } from '../lib/pathShare';
import './PathShareDialogs.css';

export function SharePathDialog({ url, pathName, onClose }: { url: string; pathName: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setCopyError(false); } catch { setCopyError(true); } };
  return <section className="dialog path-share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={event => event.stopPropagation()}>
    <button autoFocus className="dialog-close icon-button" aria-label="Close sharing" onClick={onClose}><X size={18}/></button>
    <span className="dialog-symbol"><Link size={24}/></span><h2 id="share-title">Share this path</h2><p className="share-path-name">{pathName}</p>
    <p>Anyone with the link can preview these course choices and save their own copy.</p>
    <label className="dialog-label">Path link<textarea readOnly value={url} aria-label="Shared path link" onFocus={event => event.currentTarget.select()}/></label>
    <button className="primary-button" onClick={copy}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Link copied' : 'Copy link'}</button>
    {copyError && <p role="status">Select the link above and copy it with your keyboard.</p>}
    {copied && <span className="sr-only" role="status">Path link copied.</span>}
    <p className="share-footnote">Includes the path name, courses, and semesters. Completed-credit status, advisor-review records, and profile details stay on this device.</p>
  </section>;
}

export function SharedPathDialog({ snapshot, catalog, onAccept, onClose }: { snapshot: SharedPathSnapshot; catalog: Catalog; onAccept: () => void; onClose: () => void }) {
  const program = catalog.programs.find(p => p.id === snapshot.programId);
  return <section className="dialog path-share-dialog" role="dialog" aria-modal="true" aria-labelledby="shared-path-title" onClick={event => event.stopPropagation()}>
    <button autoFocus className="dialog-close icon-button" aria-label="Close shared path" onClick={onClose}><X size={18}/></button>
    <span className="dialog-symbol"><GitBranch size={24}/></span><span className="eyebrow">SHARED PATH</span><h2 id="shared-path-title">{snapshot.name}</h2>
    <p>{program?.name} · {snapshot.courses.length} course choices</p>
    <ul className="shared-course-list">{snapshot.courses.map(c => <li key={c.courseId}><strong>{c.courseId}</strong><span>{catalog.courses.find(course => course.id === c.courseId)?.title}<small>{c.term}</small></span></li>)}</ul>
    <p className="share-footnote">Adds a new plan. Your existing paths and completed history stay intact. These choices do not grant completed credit.</p>
    <button className="primary-button" onClick={onAccept}>Add to my saved paths<GitBranch size={16}/></button>
  </section>;
}
