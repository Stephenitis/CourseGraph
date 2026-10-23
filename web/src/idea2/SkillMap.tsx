import { useMemo } from 'react';
import { ReactFlow, Controls, Background, Handle, Position, type Node, type NodeProps, type Edge } from '@xyflow/react';
import { Check, Plus, LockKeyhole } from 'lucide-react';
import type { Course } from '../domain/types';
import { getPrerequisiteIds } from '../domain/requirements';
import { layoutCourses } from '../lib/courseLayout';

type SkillData={course:Course;picked:boolean;available:boolean;needed:boolean;focused:boolean;enabled:boolean;inspect:()=>void;toggle:()=>void};
type SkillNode=Node<SkillData,'skill'>;
function SkillCard({data:d}:NodeProps<SkillNode>){return <div className={`i2-skill ${d.picked?'picked':d.available?'available':'locked'} ${d.needed?'needed':''} ${d.focused?'focused':''} ${d.enabled?'enabled':''}`}>
 <Handle type="target" position={Position.Left}/><button className="i2-skill-inspect nodrag" onClick={d.inspect} aria-label={`Inspect ${d.course.id}: ${d.course.title}`}><b>{d.course.id}</b><strong>{d.course.title}</strong><small>{d.picked?'Selected':d.needed?'Prerequisite option':d.enabled?'Unlocked option':d.available?'Available':'Locked / review'}</small></button>
 <button className="i2-skill-pick nodrag" onClick={event=>{event.stopPropagation();(d.picked||d.available?d.toggle:d.inspect)();}} aria-label={d.picked?`Remove ${d.course.id}`:d.available?`Select ${d.course.id}`:`Show requirements for ${d.course.id}`} aria-pressed={d.picked}>{d.picked?<Check size={20}/>:d.available?<Plus size={20}/>:<LockKeyhole size={18}/>}</button><Handle type="source" position={Position.Right}/></div>}
const nodeTypes={skill:SkillCard};
export default function SkillMap({courses,chosen,focus,needed,available,inspect,toggle}:{courses:Course[];chosen:Set<string>;focus:string|null;needed:Set<string>;available:Set<string>;inspect:(id:string)=>void;toggle:(id:string)=>void}){
 const geometry=useMemo(()=>{
  const ids=new Set(courses.map(c=>c.id));
  const links=courses.flatMap(c=>[...new Set([...getPrerequisiteIds(c.prerequisites),...getPrerequisiteIds(c.corequisites)])].filter(id=>ids.has(id)).map(source=>({source,target:c.id})));
  const ranked=layoutCourses(courses.map(c=>({id:c.id,width:160,height:112})),links,16);
  const maxCount=Math.max(...ranked.bands.map(b=>b.courseIds.length));
  const positions=new Map(ranked.bands.flatMap(b=>b.courseIds.map((id,i)=>[id,{x:b.rank*235,y:(maxCount-b.courseIds.length)*70+i*140}] as const)));
  return {links,positions};
 },[courses]);
 const enabled=new Set(geometry.links.filter(e=>chosen.has(e.source)&&available.has(e.target)&&!chosen.has(e.target)).map(e=>e.target));
 const nodes:SkillNode[]=courses.map(c=>({id:c.id,type:'skill',style:{pointerEvents:'all'},position:geometry.positions.get(c.id)!,width:160,height:112,data:{course:c,picked:chosen.has(c.id),available:available.has(c.id),needed:needed.has(c.id),focused:focus===c.id,enabled:enabled.has(c.id),inspect:()=>inspect(c.id),toggle:()=>toggle(c.id)}}));
 const edges:Edge[]=geometry.links.map(e=>{
  const missing=needed.has(e.source)&&(e.target===focus||needed.has(e.target));
  const selected=chosen.has(e.source)&&chosen.has(e.target);
  const next=chosen.has(e.source)&&enabled.has(e.target);
  return {...e,id:`${e.source}-${e.target}`,type:'smoothstep',zIndex:missing?5:selected?4:next?3:0,style:{stroke:missing?'#edcc74':selected?'#9ee4c5':next?'#b5a2ef':'#52636c',strokeWidth:missing||selected||next?3:1.3,strokeDasharray:missing||next?'6 5':undefined,opacity:missing||selected||next?1:.5},ariaLabel:`${e.source} contributes to ${e.target}${missing?', missing option':next?', available next':selected?', selected connection':''}`};
 });
 return <div className="i2-skill-map"><ReactFlow key={courses.map(c=>c.id).join(',')} nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:.08}} minZoom={.08} maxZoom={1.8} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} onlyRenderVisibleElements={false}><Background color="#44545c" gap={24} size={1}/><Controls showInteractive={false}/></ReactFlow><div className="i2-map-caption">All {courses.length} courses · pan or zoom to explore · + selects a course</div></div>;
}
