import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { changeSelection, readiness } from './selection';
import type { Course, Requirement } from '../domain/types';
const c=(id:string,prerequisites:Requirement|null=null,corequisites?:Requirement):Course=>({id,title:id,department:'test',units:12,unitsLabel:'12',level:'undergraduate',terms:[],description:'',sourceUrl:'',prerequisites,corequisites});
const ref=(courseId:string):Requirement=>({kind:'course',courseId});
test('all and alternative requirements gate selection and preserve valid alternatives on removal',()=>{
 const courses=[c('a'),c('b'),c('d',{kind:'any',items:[ref('a'),ref('b')]}),c('e',{kind:'all',items:[ref('a'),ref('d')]})];
 assert.equal(changeSelection('d',new Set(),courses).size,0);
 assert.equal(readiness('d',new Set(['a']),courses).state,'met');
 assert.deepEqual([...changeSelection('a',new Set(['a','b','d','e']),courses)].sort(),['b','d']);
});
test('corequisites, unit thresholds, distinct counts and manual reviews remain enforced',()=>{
 const courses=[c('a'),c('b'),c('core',null,ref('b')),c('units',{kind:'units',minimum:24,courseIds:['a','b']}),c('count',{kind:'count',minimum:2,items:[ref('a'),ref('a')]}),c('review',{kind:'permission',text:'Instructor approval'})];
 for(const id of ['core','units','count','review'])assert.notEqual(readiness(id,new Set(['a']),courses).state,'met');
 assert.equal(readiness('units',new Set(['a','b']),courses).state,'met');
 assert.equal(readiness('core',new Set(['b']),courses).state,'met');
 assert.equal(changeSelection('review',new Set(['a','b']),courses).has('review'),false);
});
