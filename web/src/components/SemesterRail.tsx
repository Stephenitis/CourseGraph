import type { SavedPath } from '../domain/types';
import { TERMS } from '../lib/persistence';
export function SemesterRail({path,term,highlighted,onHover,onSelect,onClear}:{path:SavedPath;term:string;highlighted:string|null;onHover:(term:string|null)=>void;onSelect:(term:string)=>void;onClear:()=>void}) {
  return <nav className="semester-rail" aria-label="Your semester path">
    <div className="semester-rail-caption"><strong>Your semesters</strong><span>Adding to {term}</span></div>
    <div className="semester-rail-stops">{TERMS.map(semester=>{
      const courses=path.courses.filter(course=>course.term===semester);
      const completed=courses.filter(course=>course.status==='completed').length;
      return <button key={semester} className={`semester-stop ${highlighted===semester?'highlighted':''} ${term===semester?'current':''}`} aria-pressed={term===semester} onMouseEnter={()=>onHover(semester)} onMouseLeave={()=>onHover(null)} onFocus={()=>onHover(semester)} onBlur={()=>onHover(null)} onClick={()=>onSelect(semester)}><i aria-hidden="true"/><strong>{semester}</strong><small>{courses.length?`${courses.length} courses${completed?` · ${completed} done`:''}`:'Open semester'}</small></button>;
    })}<div className="semester-degree-goal"><i aria-hidden="true">◇</i><strong>Degree goal</strong><small>Advisor review required</small></div></div>
    {highlighted&&<button className="semester-clear" onClick={onClear}>Clear highlight</button>}
  </nav>;
}
