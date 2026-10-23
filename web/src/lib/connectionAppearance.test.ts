import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { connectionState, type ConnectionFacts } from './connectionAppearance';
const base:ConnectionFacts={sourceChosen:false,targetChosen:false,sourceAvailable:false,targetAvailable:false,supportsTarget:false,incoming:false,outgoing:false,direct:false,missing:false};
test('chosen paths remain continuous across unrelated inspection and overview',()=>{
 for(const focus of [{},{incoming:true,direct:true},{outgoing:true},{missing:true}])assert.equal(connectionState({...base,sourceChosen:true,targetChosen:true,supportsTarget:true,...focus}),'chosen');
});
test('same-term prerequisites and invalid planned sources do not imply a supported chosen connection',()=>{
 assert.equal(connectionState({...base,sourceChosen:true,targetChosen:true,supportsTarget:false}),'neutral');
 assert.equal(connectionState({...base,sourceChosen:true,targetChosen:true,supportsTarget:false,incoming:true,missing:true}),'missing');
});
test('available next and previous options are dotted even without focus',()=>{
 assert.equal(connectionState({...base,sourceChosen:true,targetAvailable:true}),'available');
 assert.equal(connectionState({...base,sourceAvailable:true,targetChosen:true}),'available');
 assert.equal(connectionState({...base,sourceChosen:true,targetAvailable:false}),'neutral');
});
