import type { PlannedCourse } from '../domain/types';

export interface AutofillTourStep { courseId:string;term:string;action:'Added'|'Moved';fromTerm?:string }
/** Describe only real net changes in the committed plan, in semester order. */
export function buildAutofillTourSteps(before:PlannedCourse[],after:PlannedCourse[],terms:string[]):AutofillTourStep[] {
  const previous=new Map(before.map(course=>[course.courseId,course]));
  const steps:AutofillTourStep[]=[];
  for(const course of after){
    const old=previous.get(course.courseId);
    if(course.status!=='planned'||old?.status==='completed')continue;
    if(!old)steps.push({courseId:course.courseId,term:course.term,action:'Added'});
    else if(old.term!==course.term)steps.push({courseId:course.courseId,term:course.term,action:'Moved',fromTerm:old.term});
  }
  return steps.sort((a,b)=>terms.indexOf(a.term)-terms.indexOf(b.term)||a.courseId.localeCompare(b.courseId,'en',{numeric:true}));
}
