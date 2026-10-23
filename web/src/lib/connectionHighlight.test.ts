import assert from 'node:assert/strict';
import test from 'node:test';
import { supportsChosenConnection } from './connectionHighlight';
import type { PlannedCourse } from '../domain/types';
const source: PlannedCourse = {courseId:'A',term:'Fall 2026',status:'planned'};
const target: PlannedCourse = {courseId:'B',term:'Spring 2027',status:'planned'};
test('chosen routes require both selections and a valid source',()=>{
  assert.equal(supportsChosenConnection(source,target,false,true),true);
  assert.equal(supportsChosenConnection(source,undefined,false,true),false);
  assert.equal(supportsChosenConnection(undefined,target,false,true),false);
  assert.equal(supportsChosenConnection(source,target,false,false),false);
});
test('semester timing distinguishes prerequisites from corequisites',()=>{
  const same={...target,term:source.term};
  assert.equal(supportsChosenConnection(source,same,false,true),false);
  assert.equal(supportsChosenConnection(source,same,true,true),true);
  assert.equal(supportsChosenConnection(target,source,true,true),false);
  assert.equal(supportsChosenConnection({...source,term:'unknown'},target,false,true),false);
});
test('earned history supports routes but a future plan cannot support earned credit',()=>{
  assert.equal(supportsChosenConnection({...source,status:'completed'},target,false,false),true);
  assert.equal(supportsChosenConnection(source,{...target,status:'completed'},false,true),false);
});
