import { Check, CircleHelp, CornerDownRight } from 'lucide-react';
import type { Course, Requirement } from '../domain/types';
import { evaluateRequirement } from '../domain/requirements';
type Props={requirement:Requirement|null|undefined;courses:Course[];satisfied:Set<string>;onSelect:(id:string)=>void;optional?:boolean;groupSatisfied?:boolean;historical?:boolean};
export function RequirementTree({requirement,courses,satisfied,onSelect,optional=false,groupSatisfied=false,historical=false}:Props) {
  if(!requirement)return <p className="small-muted">No course prerequisites listed.</p>;
  if(requirement.kind==='course'){
    const course=courses.find(c=>c.id===requirement.courseId),met=satisfied.has(requirement.courseId);
    const label=met?'In place':historical?'Historical':groupSatisfied?'Alternative':optional?'Option':'Needed';
    return <button className={`requirement-course ${met?'met':optional||groupSatisfied||historical?'option':'needed'}`} onClick={()=>onSelect(requirement.courseId)}><span className="req-status">{met?<Check size={13}/>:<CornerDownRight size={13}/>}</span><span><b>{requirement.courseId}</b><small>{course?.title??'Outside this catalog subset'}</small></span><span className="req-label">{label}</span></button>;
  }
  if('text' in requirement)return <p className="requirement-review"><CircleHelp size={15}/>{requirement.text}</p>;
  const met=groupSatisfied||evaluateRequirement(requirement,satisfied,courses).state==='met';
  if(requirement.kind==='units')return <div className="requirement-group"><span className="requirement-operator">{requirement.minimum} units from these courses{met?' · in place':''}</span>{requirement.courseIds.map(id=><RequirementTree key={id} requirement={{kind:'course',courseId:id}} courses={courses} satisfied={satisfied} onSelect={onSelect} optional groupSatisfied={met} historical={historical}/>)}</div>;
  if(!('items' in requirement))return null;
  return <div className="requirement-group"><span className="requirement-operator">{requirement.kind==='all'?'All of these':requirement.kind==='any'?'Any one of these':`Choose ${'minimum' in requirement?requirement.minimum:''}`}{met?' · in place':''}</span>{requirement.items.map((item,i)=><RequirementTree key={i} requirement={item} courses={courses} satisfied={satisfied} onSelect={onSelect} optional={optional||requirement.kind==='any'||requirement.kind==='count'} groupSatisfied={met} historical={historical}/>)}</div>;
}
