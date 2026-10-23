import { useRef } from 'react';
import { ChevronDown, Pause, Play, SkipForward, Sparkles } from 'lucide-react';
import './Autofill.css';

export type AutofillMode='prerequisites'|'program';
export function AutofillControl({onApply,isMajor}:{onApply:(mode:AutofillMode)=>void;isMajor:boolean}){
  const menu=useRef<HTMLDetailsElement>(null);
  return <div className="autofill-control"><button className="autofill-button" onClick={()=>onApply('program')} title="Apply the modeled program plan, then walk through its changes. Planned courses may move to different semesters."><Sparkles size={14}/><span>Autofill</span></button><details ref={menu} className="autofill-options" onKeyDown={e=>{if(e.key==='Escape'&&menu.current)menu.current.open=false;}}><summary aria-label="Autofill options"><ChevronDown size={13}/></summary><div className="autofill-menu"><button onClick={()=>{if(menu.current)menu.current.open=false;onApply('prerequisites');}}><b>Fill missing prerequisites</b><small>Keep existing course choices and semesters. {isMajor?'Major':'Program'} requirements are not added.</small></button></div></details></div>;
}

export interface AutofillReport { title:string;message:string;changes:string[];notes:string[];canUndo:boolean;showDetails?:boolean }
export function AutofillFeedback({report,onUndo,onDismiss}:{report:AutofillReport;onUndo:()=>void;onDismiss:()=>void}){
  const details=useRef<HTMLDetailsElement>(null);
  return <section className="autofill-feedback" aria-label="Autofill result"><div className="autofill-result-main"><Sparkles size={17} aria-hidden="true"/><div className="autofill-result-copy" role="status" aria-live="polite"><strong>{report.title}</strong><p>{report.message}</p></div><div className="autofill-result-actions">{report.canUndo&&<button className="autofill-undo" onClick={onUndo}>Undo, make my own choices</button>}{(report.changes.length>0||report.notes.length>0)&&<details ref={details} className="autofill-details" open={report.showDetails} onKeyDown={e=>{if(e.key==='Escape'&&details.current){e.stopPropagation();details.current.open=false;}}}><summary>Review details</summary><div><button className="autofill-details-close" onClick={()=>{if(details.current)details.current.open=false;}}>Close details</button>{report.notes.length>0&&<><h3>Requirements and choices to review</h3><ul>{report.notes.map((note,i)=><li key={`${i}-${note}`}>{note}</li>)}</ul></>}{report.changes.length>0&&<><h3>Applied to this path</h3><ul>{report.changes.map((change,i)=><li key={`${i}-${change}`}>{change}</li>)}</ul></>}</div></details>}<button className="autofill-dismiss" onClick={onDismiss} aria-label="Dismiss autofill result">Dismiss</button></div></div></section>;
}

export function AutofillWalkthrough({step,index,total,paused,onPause,onSkip,onUndo}:{step:{courseId:string;term:string;action:string};index:number;total:number;paused:boolean;onPause:()=>void;onSkip:()=>void;onUndo:()=>void}){
  return <section className="autofill-tour" aria-label="Applied plan walkthrough"><div className="autofill-tour-step" aria-live="polite"><span className="tour-label">Applied plan</span><span>{index+1} / {total}</span><strong>{step.action} {step.courseId}</strong><span>{step.term}</span></div><div className="autofill-tour-actions"><button onClick={onPause}>{paused?<Play size={12}/>:<Pause size={12}/>}<span>{paused?'Resume':'Pause'}</span></button><button onClick={onSkip}><SkipForward size={12}/>Skip walkthrough</button><button className="tour-undo" onClick={onUndo}>Undo, make my own choices</button></div></section>;
}
