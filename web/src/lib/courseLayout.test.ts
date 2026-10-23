import { COURSE_CARD_WIDTH, COURSE_CARD_HEIGHT } from './courseTypography';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { COURSE_COLUMN_GAP, COURSE_ROW_GAP, PROGRAM_GOAL_WIDTH, PROGRAM_GOAL_HEIGHT, PROGRAM_GOAL_GAP, getProgramGoalPosition, ORGANIC_HORIZONTAL_GAP, ORGANIC_VERTICAL_GAP, layoutBalancedCourses, layoutGeometricCourses, layoutCourses, softenCoursePlacement, type LayoutCourse, type LayoutLink } from './courseLayout';
import { catalog } from '../data/catalog';
import { getCourseStage, getProgramCourseClosure } from '../domain/progression';
import { getPrerequisiteIds } from '../domain/requirements';
const course=(id:string,height=160):LayoutCourse=>({id,width:244,height});
const snapshot=(layout:ReturnType<typeof layoutCourses>)=>[...layout.positions].sort(([a],[b])=>a.localeCompare(b));

test('balanced placement is independent of panel, selection and viewport state',()=>{
 const courses=Array.from({length:20},(_,i)=>course(`course-${i}`));
 const links=Array.from({length:10},(_,i)=>({source:`course-${i}`,target:`course-${i+10}`}));
 const first=layoutBalancedCourses(courses,links),again=layoutBalancedCourses([...courses].reverse(),[...links].reverse());
 assert.deepEqual(snapshot(first),snapshot(again));assert.equal(first.columns,again.columns);assert.equal(first.aspectRatio,again.aspectRatio);
 assert.ok(first.overviewBounds.top<first.bounds.top);assert.ok(first.overviewBounds.width>=first.bounds.width);
});

test('wide foundation ranks wrap vertically within the column budget without card overlap',()=>{
 const courses=Array.from({length:19},(_,i)=>course(`root-${i}`,160+i%3*21));
 for(const columns of [2,3,4] as const){
  const layout=layoutCourses(courses,[],columns);
  assert.ok(layout.bounds.width<=columns*244+(columns-1)*COURSE_COLUMN_GAP);
  assert.equal(layout.bands[0].rows,Math.ceil(courses.length/columns));
  for(let i=0;i<courses.length;i++)for(let j=i+1;j<courses.length;j++){
   const a=layout.positions.get(courses[i].id)!,b=layout.positions.get(courses[j].id)!;
   const horizontal=a.x+244<=b.x||b.x+244<=a.x;
   const vertical=a.y+courses[i].height+COURSE_ROW_GAP<=b.y||b.y+courses[j].height+COURSE_ROW_GAP<=a.y;
   assert.ok(horizontal||vertical,`${courses[i].id} overlaps ${courses[j].id}`);
  }
 }
});

test('all acyclic prerequisites rise to a separate higher band, including long alternative routes',()=>{
 const courses=['a','b','c','d','e','f','g','h'].map(id=>course(id));
 const links:LayoutLink[]=[{source:'a',target:'d'},{source:'b',target:'d'},{source:'c',target:'e'},{source:'d',target:'f'},{source:'e',target:'f'},{source:'a',target:'h'},{source:'f',target:'h'}];
 const layout=layoutCourses(courses,links,2);
 for(const link of links){const from=layout.positions.get(link.source)!,to=layout.positions.get(link.target)!;assert.ok(from.y>=to.y+160+104);assert.ok(layout.ranks.get(link.source)!<layout.ranks.get(link.target)!);}
});

test('course and connection input permutations preserve the exact layout and ordering',()=>{
 const courses=Array.from({length:14},(_,i)=>course(`6.${i}`,144+i%4*21));
 const links:LayoutLink[]=[{source:'6.0',target:'6.7'},{source:'6.1',target:'6.7'},{source:'6.7',target:'6.13'},{source:'6.5',target:'6.12'},{source:'6.3',target:'6.12'}];
 const a=layoutCourses(courses,links,3),b=layoutCourses([...courses].reverse(),[...links].reverse(),3);
 assert.deepEqual(snapshot(a),snapshot(b));assert.deepEqual(a.bands,b.bands);assert.deepEqual(a.links,b.links);
});

test('mutual corequisites and cycles stay finite in the same logical band',()=>{
 const courses=['foundation','a','b','c','next'].map(id=>course(id));
 const links:LayoutLink[]=[{source:'foundation',target:'a'},{source:'a',target:'b'},{source:'b',target:'c'},{source:'c',target:'a'},{source:'c',target:'next'}];
 const layout=layoutCourses(courses,links,2);
 assert.equal(layout.ranks.get('a'),layout.ranks.get('b'));assert.equal(layout.ranks.get('b'),layout.ranks.get('c'));
 assert.ok(layout.ranks.get('foundation')!<layout.ranks.get('a')!);assert.ok(layout.ranks.get('a')!<layout.ranks.get('next')!);
 for(const p of layout.positions.values())assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
});

test('empty and incomplete imports have finite bounds and ignore absent connection endpoints',()=>{
 const empty=layoutCourses([],[],4);assert.equal(empty.bounds.height,0);assert.equal(empty.bounds.width,0);
 const layout=layoutCourses([course('a')],[{source:'a',target:'outside'}],2);assert.equal(layout.links.length,0);assert.equal(layout.positions.size,1);
});

test('real MIT programs form a horizontal story with a right-side goal and bounded routes',()=>{
 for(const program of catalog.programs){
  const ids=new Set(getProgramCourseClosure(program,catalog.courses).courseIds);
  const courses=catalog.courses.filter(c=>ids.has(c.id));
  const nodes=courses.map(c=>({id:c.id,width:COURSE_CARD_WIDTH,height:COURSE_CARD_HEIGHT,progression:getCourseStage(c,catalog.courses,program).order}));
  const links=courses.flatMap(c=>[...new Set([...getPrerequisiteIds(c.prerequisites),...getPrerequisiteIds(c.corequisites)])].filter(id=>ids.has(id)).map(source=>({source,target:c.id})));
  const layout=layoutBalancedCourses(nodes,links);
  assert.ok(layout.aspectRatio>=1.8&&layout.aspectRatio<=2.1,`${program.id} aspect ${layout.aspectRatio}`);
  assert.ok(layout.columns>=2&&layout.columns<=12);
  for(const {source,target} of links)if(layout.ranks.get(source)!<layout.ranks.get(target)!){
   const size=nodes.find(n=>n.id===target)!;
   assert.ok(layout.positions.get(target)!.x>=layout.positions.get(source)!.x+size.width+ORGANIC_HORIZONTAL_GAP-0.002);
  }
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
   const a=layout.positions.get(nodes[i].id)!,b=layout.positions.get(nodes[j].id)!;
   const horizontal=a.x+nodes[i].width+ORGANIC_HORIZONTAL_GAP<=b.x+.002||b.x+nodes[j].width+ORGANIC_HORIZONTAL_GAP<=a.x+.002;
   const vertical=a.y+nodes[i].height+ORGANIC_VERTICAL_GAP<=b.y+.002||b.y+nodes[j].height+ORGANIC_VERTICAL_GAP<=a.y+.002;
   assert.ok(horizontal||vertical,`${program.id}: ${nodes[i].id} crowds ${nodes[j].id}`);
  }
  assert.ok(layout.overviewBounds.right>=layout.bounds.right+320,'The goal must have space to the right of the course story.');
  const movedAgain=layoutBalancedCourses([...nodes].reverse(),[...links].reverse());
  assert.deepEqual(snapshot(layout),snapshot(movedAgain));
 }
});

test('branch attraction reduces horizontal travel while deterministic vertical slack softens a row',()=>{
 const nodes=['a','b','c','d','e','f','g','h','t1','t2','t3'].map(id=>course(id));
 const links:LayoutLink[]=[{source:'a',target:'t1'},{source:'b',target:'t1'},{source:'c',target:'t1'},{source:'d',target:'t2'},{source:'e',target:'t2'},{source:'f',target:'t3'},{source:'g',target:'t3'},{source:'h',target:'t1'},{source:'h',target:'t3'}];
 const grid=layoutCourses(nodes,links,5),organic=softenCoursePlacement(grid,nodes);
 const horizontalTravel=(layout:typeof grid)=>links.reduce((n,link)=>n+Math.abs(layout.positions.get(link.source)!.x-layout.positions.get(link.target)!.x),0);
 assert.ok(horizontalTravel(organic)<horizontalTravel(grid));
 const rootCenters=['a','b','c','d','e'].map(id=>organic.positions.get(id)!.y+80);
 assert.ok(new Set(rootCenters).size>1);
 assert.deepEqual(snapshot(organic),snapshot(softenCoursePlacement(grid,[...nodes].reverse())));
});

test('isolated courses receive breathing room without gratuitous sideways jitter',()=>{
 const nodes=Array.from({length:6},(_,i)=>course(`isolated-${i}`)),grid=layoutCourses(nodes,[],3),organic=softenCoursePlacement(grid,nodes);
 nodes.forEach(n=>assert.equal(organic.positions.get(n.id)!.x,grid.positions.get(n.id)!.x));
 assert.ok(organic.bounds.height>grid.bounds.height);
});


test('the taller degree goal stays centered and fully inside the overview for empty, small, and full maps',()=>{
 const samples:LayoutCourse[][]=[[],[course('one',144)],Array.from({length:36},(_,i)=>course(`course-${i}`,144+i%4*21))];
 for(const nodes of samples){
  const layout=layoutBalancedCourses(nodes,[]),goal=getProgramGoalPosition(layout.bounds),overview=layout.overviewBounds;
  assert.equal(goal.y+PROGRAM_GOAL_HEIGHT/2,(layout.bounds.top+layout.bounds.bottom)/2);
  assert.ok(goal.x>=layout.bounds.right+PROGRAM_GOAL_GAP);
  assert.ok(goal.x>=overview.left&&goal.x+PROGRAM_GOAL_WIDTH<=overview.right);
  assert.ok(goal.y>=overview.top&&goal.y+PROGRAM_GOAL_HEIGHT<=overview.bottom);
 }
});


test('sourced curriculum roles advance left to right while prerequisite order takes precedence',()=>{
 const nodes=[{...course('99.foundation'),progression:0},{...course('1.core'),progression:1},{...course('0.advanced'),progression:2},{...course('2.graduate'),progression:3}];
 const layout=layoutBalancedCourses(nodes,[]);
 for(let i=1;i<nodes.length;i++)assert.ok(layout.positions.get(nodes[i].id)!.x>layout.positions.get(nodes[i-1].id)!.x);
 const dependency=layoutBalancedCourses(nodes,[{source:'0.advanced',target:'99.foundation'}]);
 assert.ok(dependency.positions.get('99.foundation')!.x>dependency.positions.get('0.advanced')!.x);
 assert.deepEqual(snapshot(layout),snapshot(layoutBalancedCourses([...nodes].reverse(),[])));
});

test('layer sweeps untangle a crossed matching, including long edges through intermediate ranks',async()=>{
 const {orderCourseLayers}=await import('./courseLayout');
 const ids=['a','b','c','d','e'];const ranks=new Map([['a',0],['b',0],['c',2],['d',2],['e',1]]);
 const links=[{source:'a',target:'d'},{source:'b',target:'c'}];
 const rows=orderCourseLayers(ids,ranks,links),first=rows.get(0)!,last=rows.get(2)!;
 assert.ok((first.indexOf('a')-first.indexOf('b'))*(last.indexOf('d')-last.indexOf('c'))>0);
 assert.deepEqual(rows,orderCourseLayers([...ids].reverse(),ranks,[...links].reverse()));
});


test('directional lattice preserves forward dependencies, symmetric slots and stable geometry for every major',()=>{
 for(const program of catalog.programs){
  const ids=new Set(getProgramCourseClosure(program,catalog.courses).courseIds);
  const courses=catalog.courses.filter(c=>ids.has(c.id));
  const nodes=courses.map(c=>({id:c.id,width:COURSE_CARD_WIDTH,height:COURSE_CARD_HEIGHT,progression:getCourseStage(c,catalog.courses,program).order}));
  const links=courses.flatMap(c=>[...new Set([...getPrerequisiteIds(c.prerequisites),...getPrerequisiteIds(c.corequisites)])].filter(id=>ids.has(id)).map(source=>({source,target:c.id})));
  const layout=layoutGeometricCourses(nodes,links);
  for(const e of links)if(layout.ranks.get(e.source)!<layout.ranks.get(e.target)!)assert.ok(layout.positions.get(e.target)!.x>layout.positions.get(e.source)!.x+COURSE_CARD_WIDTH);
  for(const band of layout.bands){
   const ys=band.courseIds.map(id=>layout.positions.get(id)!.y).sort((a,b)=>a-b);
   assert.ok(Math.abs(ys[0]+ys.at(-1)!+COURSE_CARD_HEIGHT-layout.bounds.height)<.001);
   for(let i=1;i<ys.length;i++)assert.ok(ys[i]-ys[i-1]>=COURSE_CARD_HEIGHT+179);
  }
  assert.deepEqual(snapshot(layout),snapshot(layoutGeometricCourses([...nodes].reverse(),[...links].reverse())));
  assert.ok(layout.bounds.width/layout.bounds.height>=2.59);
 }
});
