import { MAX_OUTSIDE_RAIL_SPREAD } from './connectionRouting';
/** A compact, deterministic upward map. Course state and panel dimensions never affect placement. */
export interface LayoutCourse { id:string; width:number; height:number; progression?:number }
export interface LayoutLink { source:string; target:string }
export interface LayoutPoint { x:number; y:number }
export interface LayoutBand { rank:number; courseIds:string[]; top:number; bottom:number; rows:number }
export interface CourseLayout {
  positions:Map<string,LayoutPoint>;
  ranks:Map<string,number>;
  links:LayoutLink[];
  bands:LayoutBand[];
  bounds:{left:number;right:number;top:number;bottom:number;width:number;height:number};
}
export const COURSE_COLUMN_GAP=48;
export const COURSE_ROW_GAP=76;
export const COURSE_BAND_GAP=104;
export const PROGRAM_GOAL_WIDTH=640;
export const PROGRAM_GOAL_HEIGHT=760;
export const PROGRAM_GOAL_GAP=80;
const byId=(a:string,b:string)=>a.localeCompare(b,'en',{numeric:true});
const dimension=(value:number,fallback:number)=>Number.isFinite(value)&&value>0?value:fallback;

export function getProgramGoalPosition(bounds:CourseLayout['bounds']):LayoutPoint {
  return {x:bounds.right+PROGRAM_GOAL_GAP,y:(bounds.top+bounds.bottom-PROGRAM_GOAL_HEIGHT)/2};
}
function overviewBoundsFor(bounds:CourseLayout['bounds']):CourseLayout['bounds'] {
  const goal=getProgramGoalPosition(bounds),railPadding=MAX_OUTSIDE_RAIL_SPREAD+28;
  const left=bounds.left-railPadding,right=goal.x+PROGRAM_GOAL_WIDTH;
  const top=Math.min(bounds.top-railPadding,goal.y),bottom=Math.max(bounds.bottom+railPadding,goal.y+PROGRAM_GOAL_HEIGHT);
  return {left,right,top,bottom,width:right-left,height:bottom-top};
}

export function layoutCourses(input:LayoutCourse[],inputLinks:LayoutLink[],columnLimit:number):CourseLayout {
  const nodes=new Map<string,LayoutCourse>();
  for(const course of input){
    const previous=nodes.get(course.id);
    nodes.set(course.id,{id:course.id,width:Math.max(previous?.width??0,dimension(course.width,244)),height:Math.max(previous?.height??0,dimension(course.height,160)),progression:Math.max(previous?.progression??0,Number.isFinite(course.progression)?Math.max(0,Math.min(3,Math.floor(course.progression!))):0)});
  }
  const ids=[...nodes.keys()].sort(byId);
  const links=[...new Map(inputLinks.filter(link=>nodes.has(link.source)&&nodes.has(link.target)).map(link=>[`${link.source}\0${link.target}`,{source:link.source,target:link.target}])).values()].sort((a,b)=>byId(a.source,b.source)||byId(a.target,b.target));
  const outgoing=new Map(ids.map(id=>[id,[] as string[]]));
  links.forEach(link=>outgoing.get(link.source)!.push(link.target));

  // Collapse strongly connected components before ranking. Mutual corequisites stay in one logical band.
  const index=new Map<string,number>(),low=new Map<string,number>(),stack:string[]=[],onStack=new Set<string>(),components:string[][]=[];
  let nextIndex=0;
  const visit=(id:string)=>{
    index.set(id,nextIndex);low.set(id,nextIndex++);stack.push(id);onStack.add(id);
    for(const target of outgoing.get(id)!){
      if(!index.has(target)){visit(target);low.set(id,Math.min(low.get(id)!,low.get(target)!));}
      else if(onStack.has(target))low.set(id,Math.min(low.get(id)!,index.get(target)!));
    }
    if(low.get(id)===index.get(id)){
      const component:string[]=[];let member:string;
      do{member=stack.pop()!;onStack.delete(member);component.push(member);}while(member!==id);
      components.push(component.sort(byId));
    }
  };
  ids.forEach(id=>{if(!index.has(id))visit(id);});
  components.sort((a,b)=>byId(a[0],b[0]));
  const componentOf=new Map(components.flatMap((group,i)=>group.map(id=>[id,i] as const)));
  const predecessors=components.map(()=>new Set<number>());
  for(const {source,target} of links){const from=componentOf.get(source)!,to=componentOf.get(target)!;if(from!==to)predecessors[to].add(from);}
  const roles=new Map<number,number>(),localRanks=new Map<number,number>();
  const role=(component:number):number=>{
    if(roles.has(component))return roles.get(component)!;
    // An earlier prerequisite always wins if curriculum-role lists overlap or conflict.
    const value=Math.max(...components[component].map(id=>nodes.get(id)!.progression??0),...[...predecessors[component]].map(role));
    roles.set(component,value);return value;
  };
  const localRank=(component:number):number=>{
    if(localRanks.has(component))return localRanks.get(component)!;
    const previous=[...predecessors[component]].filter(before=>role(before)===role(component));
    const value=previous.length?Math.max(...previous.map(before=>localRank(before)+1)):0;
    localRanks.set(component,value);return value;
  };
  const roleOffsets=new Map<number,number>();let offset=0;
  for(const value of [...new Set(components.map((_,i)=>role(i)))].sort((a,b)=>a-b)){
    roleOffsets.set(value,offset);
    offset+=1+Math.max(...components.flatMap((_,i)=>role(i)===value?[localRank(i)]:[]));
  }
  const ranks=new Map(ids.map(id=>{const component=componentOf.get(id)!;return [id,roleOffsets.get(role(component))!+localRank(component)];}));
  const rankNumbers=[...new Set(ranks.values())].sort((a,b)=>b-a);
  const columns=Number.isFinite(columnLimit)?Math.min(16,Math.max(1,Math.floor(columnLimit))):4;
  const slotWidth=nodes.size?Math.max(...[...nodes.values()].map(node=>node.width)):244;
  const maximumColumns=Math.min(columns,Math.max(1,...rankNumbers.map(value=>ids.filter(id=>ranks.get(id)===value).length)));
  const maximumWidth=maximumColumns*slotWidth+(maximumColumns-1)*COURSE_COLUMN_GAP;
  const positions=new Map<string,LayoutPoint>(),bands:LayoutBand[]=[];
  let y=0;
  for(const value of rankNumbers){
    const members=ids.filter(id=>ranks.get(id)===value);
    // Align neighboring branches where possible; IDs settle all ties so input/selection order never matters.
    const anchor=(id:string)=>{
      const targets=outgoing.get(id)!.filter(target=>positions.has(target));
      return targets.length?targets.reduce((sum,target)=>sum+positions.get(target)!.x+nodes.get(target)!.width/2,0)/targets.length:maximumWidth/2;
    };
    members.sort((a,b)=>anchor(a)-anchor(b)||byId(a,b));
    const top=y;
    for(let start=0;start<members.length;start+=columns){
      const row=members.slice(start,start+columns),height=Math.max(...row.map(id=>nodes.get(id)!.height));
      const rowWidth=row.length*slotWidth+(row.length-1)*COURSE_COLUMN_GAP;
      const left=(maximumWidth-rowWidth)/2;
      row.forEach((id,i)=>{const node=nodes.get(id)!;positions.set(id,{x:left+i*(slotWidth+COURSE_COLUMN_GAP)+(slotWidth-node.width)/2,y:y+(height-node.height)/2});});
      y+=height;if(start+columns<members.length)y+=COURSE_ROW_GAP;
    }
    bands.push({rank:value,courseIds:members,top,bottom:y,rows:Math.ceil(members.length/columns)});
    y+=COURSE_BAND_GAP;
  }
  const height=rankNumbers.length?y-COURSE_BAND_GAP:0;
  return {positions,ranks,links,bands,bounds:{left:0,right:ids.length?maximumWidth:0,top:0,bottom:height,width:ids.length?maximumWidth:0,height}};
}

export interface BalancedCourseLayout extends CourseLayout {
  columns:number;
  aspectRatio:number;
  overviewBounds:CourseLayout['bounds'];
}
export const ORGANIC_HORIZONTAL_GAP=40;
export const ORGANIC_VERTICAL_GAP=36;
const ORGANIC_ROW_SPACE=68;
const ORGANIC_Y_SLACK=60;
const ORGANIC_X_SLACK=180;
const ORGANIC_BOUNDARY_SLACK=84;

/** Pull related branches together within separated row corridors. No random jitter or runtime simulation. */
export function softenCoursePlacement(layout:CourseLayout,input:LayoutCourse[]):CourseLayout {
  if(!layout.positions.size)return layout;
  const sizes=new Map(input.map(node=>[node.id,{width:dimension(node.width,244),height:dimension(node.height,160)}]));
  const initial=new Map<string,LayoutPoint>(),positions=new Map<string,LayoutPoint>();
  const rowMap=new Map<number,string[]>();
  for(const [id,p] of layout.positions){const center=p.y+sizes.get(id)!.height/2;rowMap.set(center,[...(rowMap.get(center)??[]),id]);}
  const rows=[...rowMap].sort(([a],[b])=>a-b).map(([,ids])=>ids.sort((a,b)=>layout.positions.get(a)!.x-layout.positions.get(b)!.x||byId(a,b)));
  rows.forEach((row,index)=>row.forEach(id=>{const original=layout.positions.get(id)!;const point={x:original.x,y:original.y+index*ORGANIC_ROW_SPACE};initial.set(id,point);positions.set(id,{...point});}));
  const adjacent=new Map([...positions.keys()].map(id=>[id,[] as {id:string;weight:number}[]]));
  layout.links.forEach(({source,target})=>{
    if(source===target)return;
    const weight=1/Math.max(1,Math.abs(layout.ranks.get(source)!-layout.ranks.get(target)!));
    adjacent.get(source)!.push({id:target,weight});adjacent.get(target)!.push({id:source,weight});
  });
  const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
  const left=layout.bounds.left-ORGANIC_BOUNDARY_SLACK,right=layout.bounds.right+ORGANIC_BOUNDARY_SLACK;
  // Fixed-count, simultaneous barycentric passes are reproducible and cannot drift when a panel opens.
  for(let pass=0;pass<8;pass++){
    const desired=new Map<string,number>();
    for(const [id,point] of positions){
      const neighbors=adjacent.get(id)!,base=initial.get(id)!,size=sizes.get(id)!;
      const sum=neighbors.reduce((n,neighbor)=>n+neighbor.weight,0);
      const center=sum?neighbors.reduce((n,neighbor)=>n+(positions.get(neighbor.id)!.x+sizes.get(neighbor.id)!.width/2)*neighbor.weight,0)/sum:point.x+size.width/2;
      desired.set(id,clamp(base.x*.35+(center-size.width/2)*.65,Math.max(left,base.x-ORGANIC_X_SLACK),Math.min(right-size.width,base.x+ORGANIC_X_SLACK)));
    }
    for(const row of rows){
      // Project desired positions back into ordered, nonoverlapping corridors rather than moving neighbors randomly.
      const xs=row.map(id=>desired.get(id)!);
      for(let i=1;i<row.length;i++)xs[i]=Math.max(xs[i],xs[i-1]+sizes.get(row[i-1])!.width+ORGANIC_VERTICAL_GAP);
      const overflow=Math.max(0,xs.at(-1)!+sizes.get(row.at(-1)!)!.width-right);
      if(overflow)for(let i=0;i<xs.length;i++)xs[i]-=overflow;
      for(let i=row.length-2;i>=0;i--)xs[i]=Math.min(xs[i],xs[i+1]-sizes.get(row[i])!.width-ORGANIC_VERTICAL_GAP);
      const underflow=Math.max(0,left-xs[0]);
      row.forEach((id,i)=>{positions.get(id)!.x=xs[i]+underflow;});
    }
  }
  for(const [id,point] of positions){
    const neighbors=adjacent.get(id)!,base=initial.get(id)!,size=sizes.get(id)!;
    const sum=neighbors.reduce((n,neighbor)=>n+neighbor.weight,0);
    const verticalPull=sum?neighbors.reduce((n,neighbor)=>{
      const otherSize=sizes.get(neighbor.id)!,other=positions.get(neighbor.id)!,otherBase=initial.get(neighbor.id)!;
      const dx=other.x+otherSize.width/2-point.x-size.width/2;
      const dy=otherBase.y+otherSize.height/2-base.y-size.height/2;
      return n+dy*neighbor.weight/Math.sqrt(1+(dx/400)**2);
    },0)/sum:0;
    // The signed pull expresses branch proximity; the smooth bound avoids identical clamped offsets.
    point.y=base.y+ORGANIC_Y_SLACK*Math.tanh(verticalPull/320);
    point.x=Number(point.x.toFixed(3));point.y=Number(point.y.toFixed(3));
  }
  const bands=layout.bands.map(band=>({...band,top:Math.min(...band.courseIds.map(id=>positions.get(id)!.y)),bottom:Math.max(...band.courseIds.map(id=>positions.get(id)!.y+sizes.get(id)!.height))}));
  const xs=[...positions].map(([id,p])=>[p.x,p.x+sizes.get(id)!.width]),ys=[...positions].map(([id,p])=>[p.y,p.y+sizes.get(id)!.height]);
  const bounds={left:Math.min(...xs.map(p=>p[0])),right:Math.max(...xs.map(p=>p[1])),top:Math.min(...ys.map(p=>p[0])),bottom:Math.max(...ys.map(p=>p[1]))};
  return {...layout,positions,bands,bounds:{...bounds,width:bounds.right-bounds.left,height:bounds.bottom-bounds.top}};
}
function turnLayoutRight(layout:CourseLayout,input:LayoutCourse[]):CourseLayout {
  if(!layout.positions.size)return layout;
  const sizes=new Map(input.map(node=>[node.id,{width:dimension(node.width,244),height:dimension(node.height,160)}]));
  const raw=new Map([...layout.positions].map(([id,p])=>[id,{x:-p.y-sizes.get(id)!.width,y:p.x}]));
  const left=Math.min(...[...raw.values()].map(p=>p.x)),top=Math.min(...[...raw.values()].map(p=>p.y));
  const positions=new Map([...raw].map(([id,p])=>[id,{x:Number((p.x-left).toFixed(3)),y:Number((p.y-top).toFixed(3))}]));
  const right=Math.max(...[...positions].map(([id,p])=>p.x+sizes.get(id)!.width)),bottom=Math.max(...[...positions].map(([id,p])=>p.y+sizes.get(id)!.height));
  const bands=layout.bands.map(band=>({...band,top:Math.min(...band.courseIds.map(id=>positions.get(id)!.y)),bottom:Math.max(...band.courseIds.map(id=>positions.get(id)!.y+sizes.get(id)!.height))}));
  return {...layout,positions,bands,bounds:{left:0,right,top:0,bottom,width:right,height:bottom}};
}
/** Balance a left-to-right story, including its right-side goal and bounded routing clearance. */
export function layoutBalancedCourses(input:LayoutCourse[],links:LayoutLink[],targetAspect=1.95):BalancedCourseLayout {
  let best:BalancedCourseLayout|undefined,bestScore=Infinity;
  const aspect=Number.isFinite(targetAspect)&&targetAspect>0?targetAspect:1.95;
  const canonical=input.map(node=>({id:node.id,width:dimension(node.height,160),height:dimension(node.width,244),progression:node.progression}));
  for(let columns=2;columns<=12;columns++){
    const candidate=turnLayoutRight(softenCoursePlacement(layoutCourses(canonical,links,columns),canonical),input);
    // Reserve the router's bounded outside clearance without solving every edge for every candidate.
    const overviewBounds=overviewBoundsFor(candidate.bounds);
    const aspectRatio=overviewBounds.width/overviewBounds.height;
    const score=Math.abs(Math.log(aspectRatio/aspect));
    // Prefer fewer columns when two candidates have exactly the same geometry.
    if(score<bestScore-1e-9){bestScore=score;best={...candidate,columns,aspectRatio,overviewBounds};}
  }
  if(best&&best.positions.size>1&&(best.aspectRatio/aspect<.925||best.aspectRatio/aspect>1.075)){
    // Discrete row counts can straddle the desired shape. Adjust actual whitespace, never card scale or empty padding.
    const axis: 'x'|'y'=best.aspectRatio>aspect?'y':'x';
    const sizes=new Map(input.map(node=>[node.id,{width:dimension(node.width,244),height:dimension(node.height,160)}]));
    const horizontalPadding=PROGRAM_GOAL_GAP+PROGRAM_GOAL_WIDTH+MAX_OUTSIDE_RAIL_SPREAD+28;
    const desired=axis==='y'?best.overviewBounds.width/aspect-2*(MAX_OUTSIDE_RAIL_SPREAD+28):best.overviewBounds.height*aspect-horizontalPadding;
    const extent=(scale:number)=>Math.max(...[...best!.positions].map(([id,p])=>p[axis]*scale+(axis==='y'?sizes.get(id)!.height:sizes.get(id)!.width)));
    if([...best.positions.values()].some(p=>p[axis]>0)&&desired>extent(1)){
      let low=1,high=2;while(extent(high)<desired&&high<8)high*=2;
      for(let i=0;i<28;i++){const middle=(low+high)/2;if(extent(middle)<desired)low=middle;else high=middle;}
      const positions=new Map([...best.positions].map(([id,p])=>[id,{...p,[axis]:Number((p[axis]*high).toFixed(3))}]));
      const right=Math.max(...[...positions].map(([id,p])=>p.x+sizes.get(id)!.width)),bottom=Math.max(...[...positions].map(([id,p])=>p.y+sizes.get(id)!.height));
      const bands=best.bands.map(band=>({...band,top:Math.min(...band.courseIds.map(id=>positions.get(id)!.y)),bottom:Math.max(...band.courseIds.map(id=>positions.get(id)!.y+sizes.get(id)!.height))}));
      const overviewBounds=overviewBoundsFor({left:0,right,top:0,bottom,width:right,height:bottom});
      best={...best,positions,bands,bounds:{left:0,right,top:0,bottom,width:right,height:bottom},overviewBounds,aspectRatio:overviewBounds.width/overviewBounds.height};
    }
  }
  return best!;
}

/** A monotone spatial expansion opens room around a selection without reordering branches. */
export function openCourseNeighborhood(layout:BalancedCourseLayout,input:LayoutCourse[],focusedId:string|null):BalancedCourseLayout {
  const focused=focusedId?layout.positions.get(focusedId):undefined;
  if(!focused)return layout;
  const sizes=new Map(input.map(course=>[course.id,course]));
  const focusSize=sizes.get(focusedId!)!;
  const center={x:focused.x+focusSize.width/2,y:focused.y+focusSize.height/2};
  // Increasing center-to-center separation on both axes preserves existing card clearance.
  const positions=new Map([...layout.positions].map(([id,p])=>{
    const size=sizes.get(id)!;
    return [id,{
      x:p.x+60*Math.tanh((p.x+size.width/2-center.x)/340),
      y:p.y+112*Math.tanh((p.y+size.height/2-center.y)/400),
    }];
  }));
  const left=Math.min(...[...positions.values()].map(p=>p.x));
  const top=Math.min(...[...positions.values()].map(p=>p.y));
  const right=Math.max(...[...positions].map(([id,p])=>p.x+sizes.get(id)!.width));
  const bottom=Math.max(...[...positions].map(([id,p])=>p.y+sizes.get(id)!.height));
  const bounds={left,right,top,bottom,width:right-left,height:bottom-top};
  return {...layout,positions,bounds};
}
