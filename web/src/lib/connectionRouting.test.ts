import { COURSE_CARD_WIDTH, COURSE_CARD_HEIGHT } from './courseTypography';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { assignConnectionLanes, connectionId, createConnectionRoute, segmentEntersCard, CONNECTION_LANE_SPACING, MAX_OUTSIDE_RAIL_SPREAD, type Point, type RouteLink, type RouteNode } from './connectionRouting';
import { catalog } from '../data/catalog';
import { getPrerequisiteIds } from '../domain/requirements';
import { getCourseStage, getProgramCourseClosure } from '../domain/progression';
import { layoutGeometricCourses } from './courseLayout';
const node=(x:number,y:number):RouteNode=>({x,y,width:244,height:150});

test('shared-target lanes are centered, ordered geometrically and stable under input reordering',()=>{
 const nodes=new Map([['upper',node(0,0)],['lower',node(0,220)],['target',node(312,110)]]);
 const links:RouteLink[]=[{source:'lower',target:'target'},{source:'upper',target:'target'}];
 const a=assignConnectionLanes(links,nodes),b=assignConnectionLanes([...links].reverse(),nodes);
 assert.equal(a.get('upper-target')!.targetLane,-.5);assert.equal(a.get('lower-target')!.targetLane,.5);
 for(const link of links)assert.deepEqual(a.get(connectionId(link)),b.get(connectionId(link)));
 const upper=createConnectionRoute({x:244,y:75},{x:312,y:185},a.get('upper-target'));
 const lower=createConnectionRoute({x:244,y:295},{x:312,y:185},a.get('lower-target'));
 assert.equal(lower.corridorX-upper.corridorX,CONNECTION_LANE_SPACING);
 assert.equal(lower.points.at(-3)!.y-upper.points.at(-3)!.y,CONNECTION_LANE_SPACING);
 assert.notEqual(upper.path,lower.path);
});

test('shared-source lanes remain distinct before smoothly returning to exact port endpoints',()=>{
 const nodes=new Map([['source',node(0,100)],['a',node(312,0)],['b',node(312,220)]]);
 const lanes=assignConnectionLanes([{source:'source',target:'a'},{source:'source',target:'b'}],nodes);
 const a=createConnectionRoute({x:244,y:175},{x:312,y:75},lanes.get('source-a'));
 const b=createConnectionRoute({x:244,y:175},{x:312,y:295},lanes.get('source-b'));
 assert.equal(b.points[2].y-a.points[2].y,6);
 for(const [route,end] of [[a,{x:312,y:75}],[b,{x:312,y:295}]] as const){
  assert.deepEqual(route.points[0],{x:244,y:175});assert.deepEqual(route.points.at(-1),end);
  assert.equal(route.points[1].y,175);assert.equal(route.points.at(-2)!.y,end.y);
  assert.ok(route.path.includes('Q'));
 }
});

test('skipping a rank takes a short local detour only when a card obstructs the route',()=>{
 const nodes=new Map([['a',node(0,100)],['b',node(0,600)],['middle',node(312,150)],['target',node(624,160)]]);
 const lanes=assignConnectionLanes([{source:'a',target:'target'},{source:'b',target:'target'}],nodes);
 const first=lanes.get('a-target')!;
 const route=createConnectionRoute({x:244,y:175},{x:624,y:235},first);
 assert.ok(route.points.length>4);assert.equal(first.outsideRailY,undefined);
 assert.ok(Math.max(...route.points.map(p=>p.y))<400,'unrelated lower cards do not create a whole-map rail');
 assertRouteClear(route.path,[...nodes.values()]);
 const unobstructed=new Map([['source',node(0,0)],['unrelated',node(312,500)],['target',node(624,10)]]);
 const direct=assignConnectionLanes([{source:'source',target:'target'}],unobstructed).get('source-target')!;
 assert.equal(direct.outsideRailY,undefined);
 assert.ok(direct.routedPoints!.every(p=>p.y>=75&&p.y<=85));
});

test('horizontal, very short and backward connections produce finite paths with intact endpoints',()=>{
 for(const [source,target] of [[{x:10,y:20},{x:78,y:20}],[{x:10,y:20},{x:12,y:20}],[{x:100,y:80},{x:10,y:40}]] as const){
  const route=createConnectionRoute(source,target);
  assert.ok(!/NaN|Infinity/.test(route.path));assert.deepEqual(route.points[0],source);assert.deepEqual(route.points.at(-1),target);
 }
});

test('upward connections keep parallel lanes and vertical arrival tangents after rotation',()=>{
 const nodes=new Map([['left',node(0,400)],['right',node(320,400)],['summit',node(160,100)]]);
 const lanes=assignConnectionLanes([{source:'left',target:'summit'},{source:'right',target:'summit'}],nodes,'BT');
 const left=createConnectionRoute({x:122,y:400},{x:282,y:250},lanes.get('left-summit'));
 const right=createConnectionRoute({x:442,y:400},{x:282,y:250},lanes.get('right-summit'));
 assert.equal(lanes.get('left-summit')!.direction,'BT');
 assert.equal(left.points[0].x,left.points[1].x);
 assert.ok(left.points[1].y<left.points[0].y);
 assert.equal(left.points.at(-2)!.x,left.points.at(-1)!.x);
 assert.ok(left.points.at(-2)!.y>left.points.at(-1)!.y);
 assert.equal(right.points.at(-3)!.x-left.points.at(-3)!.x,6);
 assert.ok(!/NaN|Infinity/.test(left.path));
});

test('horizontal open spans flow smoothly while blocked spans retain safe rounded corridors',()=>{
 for(const middle of [node(350,650),node(350,110)]){
  const nodes=new Map([['source',node(0,0)],['middle',middle],['target',node(750,260)]]);
  const lane=assignConnectionLanes([{source:'source',target:'target'}],nodes,'LR').get('source-target');
  for(const radius of [24,120]){
   const route=createConnectionRoute({x:244,y:75},{x:750,y:335},lane,radius);
   assertRouteClear(route.path,[...nodes.values()]);
   assert.deepEqual(route.points[0],{x:244,y:75});assert.deepEqual(route.points.at(-1),{x:750,y:335});
   assert.ok(route.path.includes('Q'),'resting and selected routes have gentle curves');
  }
 }
});

test('busy shared connections stay distinct and deterministic within bounded clearance',()=>{
 const nodes=new Map<string,RouteNode>([['middle',node(312,480)],['target',node(624,480)]]);
 const links:RouteLink[]=[];
 for(let i=0;i<10;i++){nodes.set(`source-${i}`,node(0,i*210));links.push({source:`source-${i}`,target:'target'});}
 const lanes=assignConnectionLanes(links,nodes);
 const routes=links.map(link=>{const n=nodes.get(link.source)!;return createConnectionRoute({x:244,y:n.y+75},{x:624,y:555},lanes.get(connectionId(link)));});
 assert.equal(new Set(routes.map(r=>r.path)).size,10);
 for(const route of routes){assertRouteClear(route.path,[...nodes.values()]);assert.ok(route.points.every(p=>p.y>=-24-MAX_OUTSIDE_RAIL_SPREAD&&p.y<=2040+24+MAX_OUTSIDE_RAIL_SPREAD));}
 const reversed=assignConnectionLanes([...links].reverse(),nodes);
 links.forEach(link=>assert.deepEqual(lanes.get(connectionId(link)),reversed.get(connectionId(link))));
});

function assertRouteClear(path:string,cards:RouteNode[],label='route'){
 assert.ok(path.length,`${label} has a visible route`);
 const tokens=path.match(/[MLQ]|-?\d+(?:\.\d+)?/g)!;let position:Point={x:0,y:0},i=0;
 const take=():Point=>({x:Number(tokens[i++]),y:Number(tokens[i++])});
 while(i<tokens.length){
  const command=tokens[i++];
  if(command==='M'){position=take();continue;}
  const control=take(),end=command==='Q'?take():control,start=position;
  for(let step=1;step<=24;step++){
   const t=step/24,u=1-t,next=command==='Q'?{x:u*u*start.x+2*u*t*control.x+t*t*end.x,y:u*u*start.y+2*u*t*control.y+t*t*end.y}:{x:start.x+(end.x-start.x)*t,y:start.y+(end.y-start.y)*t};
   assert.ok(cards.every(n=>!segmentEntersCard(position,next,n)),`${label} intersects a course near ${JSON.stringify(next)}`);position=next;
  }
 }
}

test('directional geometric MIT maps with sourced program roles keep resting and selected curves outside every course card',()=>{
 for(const program of catalog.programs){
  const ids=new Set(getProgramCourseClosure(program,catalog.courses).courseIds),courses=catalog.courses.filter(c=>ids.has(c.id));
  const sizes=courses.map(c=>({id:c.id,width:COURSE_CARD_WIDTH,height:COURSE_CARD_HEIGHT,progression:getCourseStage(c,catalog.courses,program).order}));
  const links=courses.flatMap(c=>[...new Set([...getPrerequisiteIds(c.prerequisites),...getPrerequisiteIds(c.corequisites)])].filter(id=>ids.has(id)).map(source=>({source,target:c.id})));
  const layout=layoutGeometricCourses(sizes,links),nodes=new Map(sizes.map(n=>[n.id,{...layout.positions.get(n.id)!,width:n.width,height:n.height}]));
  const lanes=assignConnectionLanes(links,nodes,'LR',true);
  for(const link of links){
   const source=nodes.get(link.source)!,target=nodes.get(link.target)!;
   for(const radius of [24,120]){
    const route=createConnectionRoute({x:source.x+source.width,y:source.y+source.height/2},{x:target.x,y:target.y+target.height/2},lanes.get(connectionId(link)),radius);
    assertRouteClear(route.path,[...nodes.values()],`${program.id}: ${connectionId(link)} at ${radius}px radius`);
    assert.ok(route.points.every(p=>p.x>=layout.overviewBounds.left&&p.x<=layout.overviewBounds.right&&p.y>=layout.overviewBounds.top&&p.y<=layout.overviewBounds.bottom),`${program.id}: ${connectionId(link)} stays within overview ${JSON.stringify(layout.overviewBounds)}; outside ${JSON.stringify(route.points.filter(p=>p.x<layout.overviewBounds.left||p.x>layout.overviewBounds.right||p.y<layout.overviewBounds.top||p.y>layout.overviewBounds.bottom))}`);
   }
  }
 }
});


test('busy targets share a straight entry trunk before the card',()=>{
 const nodes=new Map([['a',{x:0,y:0,width:244,height:160}],['b',{x:0,y:500,width:244,height:160}],['t',{x:1200,y:250,width:244,height:160}]]);
 const lanes=assignConnectionLanes([{source:'a',target:'t'},{source:'b',target:'t'}],nodes,'LR',true);
 const a=lanes.get('a-t')!.routedPoints!,b=lanes.get('b-t')!.routedPoints!;
 assert.deepEqual(a.slice(-2),b.slice(-2));
 assert.ok(a.at(-1)!.x-a.at(-2)!.x>=150);
});

test('long open geometric spans alternate steps instead of skipping lattice positions',()=>{
 const nodes=new Map([['a',{x:0,y:0,width:244,height:160}],['b',{x:1800,y:0,width:244,height:160}]]);
 const lane=assignConnectionLanes([{source:'a',target:'b'}],nodes,'LR',true).get('a-b')!;
 const points=lane.routedPoints!;
 assert.ok(points.length>6);
 for(let i=1;i<points.length;i++)assert.ok(Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y)<=620);
 assertRouteClear(createConnectionRoute({x:244,y:80},{x:1800,y:80},lane,24).path,[...nodes.values()]);
});


test('handle offsets preserve cached merged lattice routes',()=>{
 const nodes=new Map([['a',{x:0,y:0,width:244,height:160}],['b',{x:1800,y:0,width:244,height:160}]]);
 const lane=assignConnectionLanes([{source:'a',target:'b'}],nodes,'LR',true).get('a-b')!;
 const rendered=createConnectionRoute({x:245.5,y:80},{x:1798.5,y:80},lane,24);
 assert.deepEqual(rendered.points.slice(1,-1),lane.routedPoints!.slice(1,-1));
});
