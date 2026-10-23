import { useMemo, useState } from 'react';
import { ArrowRight, Check, LockKeyhole, Plus, X } from 'lucide-react';
import { catalog } from '../data/catalog';
import { evaluateRequirement, getPrerequisiteIds } from '../domain/requirements';
import { getProgramCourseClosure } from '../domain/progression';
import type { Requirement } from '../domain/types';
import './idea2.css';
import { layoutCourses } from '../lib/courseLayout';

const byId=new Map(catalog.courses.map(c=>[c.id,c]));
const seed=['6.100A','18.01','8.01'];
export default function Idea2(){
 const [programId,setProgramId]=useState('major6-3');
 const [chosen,setChosen]=useState(new Set(seed));
 const [focus,setFocus]=useState<string|null>(null);
 const [slot,setSlot]=useState<Requirement|null>(null);
 const [notice,setNotice]=useState('');
 const program=catalog.programs.find(p=>p.id===programId)!;
 const courses=useMemo(()=>{const ids=new Set(getProgramCourseClosure(program,catalog.courses).courseIds);return catalog.courses.filter(c=>ids.has(c.id));},[program]);
 const tiers=useMemo(()=>{
  const ids=new Set(courses.map(c=>c.id));
  const links=courses.flatMap(c=>getPrerequisiteIds(c.prerequisites).filter(id=>ids.has(id)).map(source=>({source,target:c.id})));
  const ranks=layoutCourses(courses.map(c=>({id:c.id,width:1,height:1})),links,16).ranks;
  const max=Math.max(0,...ranks.values());
  return new Map([...ranks].map(([id,rank])=>[id,Math.min(3,Math.floor(rank*4/(max+1)))]));
 },[courses]);
 const ready=(id:string,selected=chosen)=>{const c=byId.get(id)!;return evaluateRequirement({kind:'all',items:[c.prerequisites,c.corequisites].filter((r):r is Requirement=>!!r)},selected,catalog.courses);};
 const active=focus?byId.get(focus):undefined;
 const need=slot??(active?{kind:'all' as const,items:[active.prerequisites,active.corequisites].filter((r):r is Requirement=>!!r)}:null);
 const highlighted=new Set(evaluateRequirement(need,chosen,catalog.courses).missingCourseIds);
 const requirements=program.requirements?.kind==='all'?program.requirements.items:program.requirements?[program.requirements]:[];
 const inspect=(id:string)=>{setFocus(id);setSlot(null);setNotice('');};
 function toggle(id:string){
  if(!chosen.has(id)&&ready(id).state!=='met')return;
  const next=new Set(chosen);
  if(next.has(id)){
   next.delete(id);let changed=true;
   while(changed){changed=false;for(const candidate of next)if(!seed.includes(candidate)&&ready(candidate,next).state!=='met'){next.delete(candidate);changed=true;}}
  }else next.add(id);
  setChosen(next);setNotice(next.has(id)?`${id} selected. New courses may now be available.`:`${id} removed; dependent experiment choices were rechecked.`);
 }
 function slotView(req:Requirement,key:string):React.ReactNode{
  const result=evaluateRequirement(req,chosen,catalog.courses),done=result.state==='met';
  if(req.kind==='all')return <div className="i2-slot-group" key={key}><span className="i2-slot-label">All of these</span>{req.items.map((r,i)=>slotView(r,`${key}-${i}`))}</div>;
  if(req.kind==='permission'||req.kind==='unknown')return <div className="i2-review" key={key}>Advisor review <small>{req.text}</small></div>;
  const ids=getPrerequisiteIds(req),selected=ids.filter(id=>chosen.has(id));
  const label=req.kind==='course'?req.courseId:req.kind==='any'?'Choose one':req.kind==='count'?`Choose ${req.minimum}`:req.kind==='units'?`${req.minimum} units`:'Requirement';
  return <button type="button" key={key} className={`i2-slot ${done?'filled':''}`} onClick={()=>{setSlot(req);setFocus(null);}} aria-label={`${label}, ${done?'filled in experiment':'open requirement'}. Show options`}><span>{done?<Check size={16}/>:<Plus size={16}/>} {label}</span><small>{selected.length?selected.join(' · '):req.kind==='course'?byId.get(req.courseId)?.title??'Outside snapshot':`${ids.length} course options`}</small>{req.kind==='count'&&<span className="i2-sockets" aria-label={`${Math.min(selected.length,req.minimum)} selections of ${req.minimum}`}>{Array.from({length:Math.min(req.minimum,12)},(_,i)=><i key={i} className={i<selected.length?'on':''}/>)}</span>}</button>;
 }
 const stages=[{label:'Start here',caption:'Build your foundations'},{label:'Build on it',caption:'Your core subjects'},{label:'Go deeper',caption:'Choose your specialization'},{label:'Beyond',caption:'Reach later pathways'}];
 return <main className="i2">
  <header className="i2-header"><a href="/">CourseGraph <span>/ idea 02</span></a><a href="/">Original map <ArrowRight size={15}/></a></header>
  <section className="i2-intro"><div><p className="i2-eyebrow">THE UNLOCK EXPERIMENT</p><h1>Start small.<br/><em>See what opens.</em></h1><p>Choose a course. Build your foundations. Find your next possibility.</p></div><div className="i2-program"><label htmlFor="i2-major">Your destination</label><select id="i2-major" value={programId} onChange={e=>{setProgramId(e.target.value);setFocus(null);setSlot(null);}}>{catalog.programs.map(p=><option value={p.id} key={p.id}>{p.shortName}</option>)}</select><span>{chosen.size} experiment choices · {courses.filter(c=>!chosen.has(c.id)&&ready(c.id).state==='met').length} available next</span><button onClick={()=>{setChosen(new Set());setFocus(null);setSlot(null);}}>Start with empty slots</button></div></section>
  <div className="i2-key"><span><i className="picked"/>Selected</span><span><i className="open"/>Available</span><span><i className="needed"/>Helps your next step</span><span><LockKeyhole size={12}/>Locked / review</span><small>Sandbox choices only · no changes to saved plans</small></div>
  <section className="i2-board" aria-label="Course progression">
   {stages.map((stage,index)=>{const members=courses.filter(c=>tiers.get(c.id)===index);return <section className={`i2-stage stage-${index}`} key={stage.label}><header><span>0{index+1}</span><div><h2>{stage.label}</h2><p>{stage.caption}</p></div><ArrowRight size={18}/></header><div className="i2-stack">{members.map(c=>{const picked=chosen.has(c.id),state=ready(c.id).state,lit=highlighted.has(c.id);return <button key={c.id} className={`i2-course ${picked?'picked':state==='met'?'open':'locked'} ${lit?'needed':''} ${focus===c.id?'focused':''}`} onClick={()=>inspect(c.id)} aria-pressed={focus===c.id}><span className="i2-course-top"><b>{c.id}</b>{picked?<Check size={17}/>:state==='met'?<Plus size={17}/>:<LockKeyhole size={15}/>}</span><strong>{c.title}</strong><span className="i2-course-bottom">{picked?'Selected':lit?'Prerequisite option':state==='met'?'Ready to choose':state==='review'?'Review needed':'Explore requirements'}<span>{c.units} units</span></span></button>;})}{!members.length&&<p className="i2-empty">No courses in this stage of the snapshot.</p>}</div></section>;})}
  </section>
  {(active||slot)&&<aside className="i2-inspector" aria-label="Course options"><button className="i2-close" aria-label="Close details" onClick={()=>{setFocus(null);setSlot(null);}}><X size={18}/></button><div><p className="i2-eyebrow">{active?active.id:'FILL THIS REQUIREMENT'}</p><h2>{active?.title??'Choose your route'}</h2><p>{active?(chosen.has(active.id)?'Selected in this experiment.':ready(active.id).state==='met'?'You have the modeled preparation to select this course.':'The highlighted cards show options that contribute to this next step.'):'Select from the highlighted courses. The requirement below preserves the catalog’s alternatives.'}</p>{active&&<button className="i2-action" disabled={!chosen.has(active.id)&&ready(active.id).state!=='met'} onClick={()=>toggle(active.id)}>{chosen.has(active.id)?'Remove from experiment':ready(active.id).state==='met'?'Select course':'Choose prerequisites first'}</button>}</div><div className="i2-requirement-detail">{need?<RequirementDetail req={need} chosen={chosen} inspect={inspect}/>:<p>No modeled prerequisites.</p>}{active?.corequisites&&<small>Includes alongside-course requirements. This experiment assumes selected preparation; it does not schedule semesters.</small>}</div></aside>}
  <details className="i2-degree" open><summary>Major requirements · click a slot to explore</summary><header><div><p className="i2-eyebrow">YOUR MAJOR, TAKING SHAPE</p><h2>Every choice has a place.</h2><p>Click an empty slot to see its course options.</p></div><span>{program.shortName}</span></header><div className="i2-slots">{requirements.map((req,i)=>slotView(req,`r${i}`))}</div></details>
  <p className="i2-notice" role="status">{notice}</p><footer>Experimental view · MIT 2026–2027 partial catalog · Stages follow prerequisite depth, not difficulty scores. Slots reflect modeled requirements, not a complete degree audit. <a href={program.sourceUrl} target="_blank" rel="noreferrer">Official requirements ↗</a></footer>
 </main>;
}
function RequirementDetail({req,chosen,inspect}:{req:Requirement;chosen:Set<string>;inspect:(id:string)=>void}){
 if(req.kind==='course')return <button className={`i2-option ${chosen.has(req.courseId)?'done':''}`} onClick={()=>inspect(req.courseId)}>{chosen.has(req.courseId)?<Check size={14}/>:<ArrowRight size={14}/>}<b>{req.courseId}</b> {byId.get(req.courseId)?.title??'Outside loaded catalog'}</button>;
 if(req.kind==='permission'||req.kind==='unknown')return <p>Review: {req.text}</p>;
 if(req.kind==='units')return <div><b>Choose {req.minimum} units</b>{req.courseIds.map(id=><RequirementDetail key={id} req={{kind:'course',courseId:id}} chosen={chosen} inspect={inspect}/>)}</div>;
 if(!('items' in req))return null;
 return <div className="i2-rule"><b>{req.kind==='all'?'All of these':req.kind==='any'?'One of these':req.kind==='count'?`Choose ${req.minimum}`:'Requirements'}</b>{req.items.length?req.items.map((r,i)=><RequirementDetail key={i} req={r} chosen={chosen} inspect={inspect}/>):<span>No modeled prerequisites</span>}</div>;
}
