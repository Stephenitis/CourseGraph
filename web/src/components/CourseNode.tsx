import type { CSSProperties } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Check, LockKeyhole } from 'lucide-react';
import type { Course } from '../domain/types';
import type { CourseStage } from '../domain/progression';
import { getCourseTitleTypography } from '../lib/courseTypography';
export type CourseNodeData = { course:Course; preview?:boolean; stage:CourseStage; height:number; revealKey:number; revealDelay:number; revealing:boolean; status?:'completed'|'planned'; relation?:'need'|'missing'|'next'|'selected'|'quiet'; eligibility:'met'|'missing'|'review'; pinned:boolean; targetTerm:string; onToggle:()=>void; };
export type CourseFlowNode = Node<CourseNodeData, 'course'>;
export default function CourseNode({data}:NodeProps<CourseFlowNode>) {
  const {course,status,relation,pinned,eligibility}=data;
  const typography=getCourseTitleTypography(course.title,data.stage.id);
  return <div key={data.revealKey} data-stage={data.stage.id} className={`course-node stage-${data.stage.id} ${relation ?? ''} ${pinned?'pinned':''} ${data.preview||status?'chosen':eligibility==='met'?'available':'locked'} ${status??''} ${data.revealing?'journey-reveal':''}`} style={{height:data.height,'--reveal-delay':`${Math.max(0,data.revealDelay)}ms`,'--course-title-size':`${typography.fontSize}px`,'--course-title-weight':typography.fontWeight,'--course-title-family':`"${typography.fontFamily}",sans-serif`,'--course-title-leading':typography.lineHeight} as CSSProperties}>
    <Handle type="target" position={Position.Left}/>
    <div className="course-node-top"><span className="course-code">{course.id}</span><span className="course-stage" title={data.stage.explanation} aria-label={`${data.stage.label}. ${data.stage.explanation}`}><span className="stage-label">{data.stage.label}</span></span></div>
    <div className="course-node-title"><span>{course.title}</span></div>
    <div className="course-node-bottom"><span>{course.unitsLabel || `${course.units} units`}</span><span className="course-choice-stack">{data.preview?<span className="course-choice checked" role="img" aria-label="Demo preview"><Check size={27}/></span>:status==='completed'?<span className="course-choice checked completed-choice" role="img" aria-label={`${course.id} completed; history is preserved`} title="Completed history"><Check size={27} strokeWidth={3}/></span>:<button className={`course-choice nodrag nopan ${status==='planned'?'checked':eligibility==='met'?'available-choice':'locked-choice'}`} aria-label={status==='planned'?`Remove ${course.id} from this path`:eligibility==='met'?`Add ${course.id} to ${data.targetTerm}`:`View ${course.id} requirements for ${data.targetTerm}: ${eligibility==='review'?'review required':'requirements not met'}`} title={!status&&eligibility!=='met'?`View requirements for ${data.targetTerm}`:undefined} aria-pressed={eligibility==='met'||status==='planned'?status==='planned':undefined} onKeyDown={event=>{if(event.key==='Enter'||event.key===' ')event.stopPropagation();}} onClick={event=>{event.stopPropagation();data.onToggle();}}>{!status&&eligibility!=='met'?<LockKeyhole size={25} strokeWidth={2}/>:<Check size={27} strokeWidth={3}/>}</button>}<span className="node-state">{data.preview?'Demo preview':status==='completed'?'Completed':status==='planned'?'In your path':eligibility==='missing'?'Requirements not met':eligibility==='review'?'Review required':'Available'}</span></span></div>
    <Handle type="source" position={Position.Right}/>
  </div>;
}
