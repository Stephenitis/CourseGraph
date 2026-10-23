import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { buildAutofillTourSteps } from './autofillTour';
import type { PlannedCourse } from '../domain/types';
const planned=(courseId:string,term:string):PlannedCourse=>({courseId,term,status:'planned'});

test('walkthrough includes only actual additions and moves, never unchanged or earned courses',()=>{
 const before:PlannedCourse[]=[{courseId:'earned',term:'Fall 2026',status:'completed'},planned('same','Fall 2026'),planned('moved','Fall 2026')];
 const after:PlannedCourse[]=[...before.filter(c=>c.courseId!=='moved'),planned('moved','Spring 2027'),planned('new','Fall 2026')];
 assert.deepEqual(buildAutofillTourSteps(before,after,['Fall 2026','Spring 2027']),[
  {courseId:'new',term:'Fall 2026',action:'Added'},
  {courseId:'moved',term:'Spring 2027',action:'Moved',fromTerm:'Fall 2026'},
 ]);
 assert.deepEqual(before[2],planned('moved','Fall 2026'));
});

test('no-op proposals produce no walkthrough and ordering is stable',()=>{
 const before=[planned('6.100B','Fall 2026')];
 assert.deepEqual(buildAutofillTourSteps(before,before,['Fall 2026']),[]);
 const after=[...before,planned('18.06','Fall 2026'),planned('6.1010','Fall 2026')];
 assert.deepEqual(buildAutofillTourSteps(before,after,['Fall 2026']),buildAutofillTourSteps(before,[...after].reverse(),['Fall 2026']));
});
