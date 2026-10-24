import test from 'node:test';
import assert from 'node:assert/strict';
import {getSemesterRevealStages} from './semesterReveal';
import type {PlannedCourse} from '../domain/types';
test('earned history leads a chronological semester sequence regardless of insertion order',()=>{
  const courses:PlannedCourse[]=[
    {courseId:'C',term:'Fall 2027',status:'planned'},
    {courseId:'A',term:'Spring 2027',status:'planned'},
    {courseId:'B',term:'IAP 2027',status:'planned'},
    {courseId:'D',term:'Spring 2027',status:'planned'},
    {courseId:'E',term:'Fall 2026',status:'completed'},
  ];
  const original=structuredClone(courses);
  assert.deepEqual(getSemesterRevealStages(courses),[
    {label:'Completed foundations',courseIds:['E']},
    {label:'IAP 2027',courseIds:['B']},
    {label:'Spring 2027',courseIds:['A','D']},
    {label:'Fall 2027',courseIds:['C']},
  ]);
  assert.deepEqual(courses,original);
});
test('empty plans have no stages; unknown semesters remain visible after dated terms',()=>{
  assert.deepEqual(getSemesterRevealStages([]),[]);
  assert.deepEqual(getSemesterRevealStages([
    {courseId:'B',term:'Undecided',status:'planned'},
    {courseId:'A',term:'Fall 2026',status:'planned'},
  ]).map(stage=>stage.label),['Fall 2026','Undecided']);
});
