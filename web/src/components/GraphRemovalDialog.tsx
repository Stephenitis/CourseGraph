import { GitBranch, X } from 'lucide-react';
import type { Course, SavedPath } from '../domain/types';
import type { GraphRemovalProposal } from '../domain/graphSelection';

export function GraphRemovalDialog({proposal,courses,path,onCancel,onConfirm}:{proposal:GraphRemovalProposal;courses:Course[];path:SavedPath;onCancel:()=>void;onConfirm:()=>void}){
  const count=proposal.removedCourseIds.length;
  return <section className="dialog removal-dialog" role="dialog" aria-modal="true" aria-labelledby="removal-title" aria-describedby="removal-description" onClick={e=>e.stopPropagation()}>
    <button className="dialog-close icon-button" aria-label="Cancel course removal" onClick={onCancel}><X size={18}/></button>
    <span className="dialog-symbol"><GitBranch size={24}/></span>
    <h2 id="removal-title">Remove {count} planned courses?</h2>
    <p id="removal-description">Removing {proposal.removedCourseIds[0]} also affects these dependent courses. They will be unselected together.</p>
    <ul className="removal-course-list">{proposal.removedCourseIds.map((id,index)=><li key={id}><div><strong>{id}</strong><span>{courses.find(c=>c.id===id)?.title??id}</span></div><small>{path.courses.find(c=>c.courseId===id)?.term}{index===0?' · Selected course':' · Dependent'}</small></li>)}</ul>
    <div className="removal-actions"><button autoFocus className="secondary-button" onClick={onCancel}>Cancel</button><button className="primary-button" onClick={onConfirm}>Remove {count} courses</button></div>
  </section>;
}
