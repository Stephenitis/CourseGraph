import type { Course, Requirement } from '../domain/types';
import { evaluateRequirement } from '../domain/requirements';
export function readiness(id:string,selected:Set<string>,courses:Course[]){
 const course=courses.find(c=>c.id===id);
 if(!course)return {state:'review' as const,missingCourseIds:[],reasons:['Outside loaded catalog']};
 const preparation=new Set(selected);preparation.delete(id);
 return evaluateRequirement({kind:'all',items:[course.prerequisites,course.corequisites].filter((r):r is Requirement=>!!r)},preparation,courses);
}
export function changeSelection(id:string,selected:Set<string>,courses:Course[]):Set<string>{
 if(!selected.has(id))return readiness(id,selected,courses).state==='met'?new Set([...selected,id]):selected;
 const next=new Set(selected);next.delete(id);
 let changed=true;
 while(changed){changed=false;for(const candidate of next)if(readiness(candidate,next,courses).state!=='met'){next.delete(candidate);changed=true;}}
 return next;
}
