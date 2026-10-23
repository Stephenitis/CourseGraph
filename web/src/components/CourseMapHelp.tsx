import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import './CourseMapHelp.css';

export function CourseMapHelp(){
  const details=useRef<HTMLDetailsElement>(null);
  const [height,setHeight]=useState(240);
  const close=()=>{if(details.current){details.current.open=false;details.current.querySelector('summary')?.focus({preventScroll:true});}};
  return <details ref={details} className="map-help" onToggle={e=>{if(e.currentTarget.open)setHeight(Math.max(110,(e.currentTarget.closest('.map-canvas')?.clientHeight??300)-54));}} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}}}>
    <summary>Course numbers &amp; labels</summary>
    <div className="map-help-content" style={{maxHeight:height}} role="region" aria-label="MIT course numbers and labels">
      <button className="map-help-close" onClick={close} aria-label="Close course numbers guide"><X size={14}/></button>
      <h3>Reading the map</h3>
      <dl>
        <dt>6 · 18 · 8</dt><dd>EECS · Mathematics · Physics. The number before the decimal identifies the department.</dd>
        <dt>6-3 vs 6.1010</dt><dd>6-3 is a major; 6.1010 is a subject. Higher numbers do not measure difficulty.</dd>
        <dt>A / B · J</dt><dd>A/B can mark parts or variants: 6.100A + 6.100B are two parts. J marks a cross-listed subject.</dd>
        <dt>U / G</dt><dd>Undergraduate / graduate subject level.</dd>
        <dt>3-0-9 · 12 units</dt><dd>Class · lab · preparation components, totaling 12 units. Consult the subject listing for its workload details.</dd>
        <dt>Prerequisite · Corequisite</dt><dd>Complete a prerequisite earlier; a corequisite may be taken alongside.</dd>
        <dt>Foundation · Core · Advanced · Graduate</dt><dd>Curriculum roles from MIT sources for the selected program, not difficulty scores. Undergraduate is used when no specific role is documented.</dd>
      </dl>
      <div className="map-help-sources"><a href="https://www.eecs.mit.edu/academics/subject-numbering/" target="_blank" rel="noreferrer">EECS numbering</a><a href="https://registrar.mit.edu/registration-academics/academic-requirements/subject-levels-credit" target="_blank" rel="noreferrer">Levels &amp; credit</a><a href="https://registrar.mit.edu/faculty-curriculum-support/faculty-curriculum-committees/committee-curricula/committee-guidelines-6" target="_blank" rel="noreferrer">Subject designations</a></div>
    </div>
  </details>;
}
