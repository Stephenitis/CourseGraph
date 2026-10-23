/** Stable visual lanes keep shared prerequisite connections distinct without changing course layout. */
export const CONNECTION_LANE_SPACING = 6;
export const MAX_OUTSIDE_RAIL_SPREAD = 120;
export interface RouteNode { x: number; y: number; width: number; height: number }
export interface RouteLink { source: string; target: string }
export interface ConnectionLane {
  direction?: 'LR' | 'BT';
  sourceLane: number;
  sourceCount: number;
  targetLane: number;
  targetCount: number;
  sourceGutter: number;
  targetGutter: number;
  outsideRailY?: number;
  /** Canonical LR geometry. Keeping card obstacles with the lane avoids layout assumptions. */
  obstacles?: RouteNode[];
  sourceNode?: RouteNode;
  targetNode?: RouteNode;
  routedPoints?: Point[];
}
export interface Point { x: number; y: number }
export interface ConnectionRoute { path: string; points: Point[]; labelX: number; labelY: number; corridorX: number }
export const connectionId = ({ source, target }: RouteLink) => `${source}-${target}`;
const centerY = (node: RouteNode) => node.y + node.height / 2;
const compareId = (a: RouteLink, b: RouteLink) => connectionId(a).localeCompare(connectionId(b));
const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;

export function assignConnectionLanes(links: RouteLink[], nodes: Map<string, RouteNode>, direction:'LR'|'BT'='LR'): Map<string, ConnectionLane> {
  if(direction==='BT'){
    // Rotate the layout into one canonical flow axis, retaining the same lane ordering and clearance rules.
    const rotated=new Map([...nodes].map(([id,n])=>[id,{x:-n.y-n.height,y:n.x,width:n.height,height:n.width}]));
    const lanes=assignConnectionLanes(links,rotated);
    lanes.forEach(lane=>{lane.direction='BT';});
    return lanes;
  }
  const bySource = new Map<string, RouteLink[]>(), byTarget = new Map<string, RouteLink[]>();
  for (const link of links) {
    if (!nodes.has(link.source) || !nodes.has(link.target)) continue;
    bySource.set(link.source, [...(bySource.get(link.source) ?? []), link]);
    byTarget.set(link.target, [...(byTarget.get(link.target) ?? []), link]);
  }
  const result = new Map<string, ConnectionLane>();
  const all = [...nodes.values()];
  for (const [id, group] of bySource) {
    const source = nodes.get(id)!;
    const sourceRight = source.x + source.width;
    const nextColumns = all.map(n => n.x - sourceRight).filter(gap => gap > 1);
    const sourceGutter = nextColumns.length ? Math.min(...nextColumns) : 80;
    group.sort((a,b) => centerY(nodes.get(a.target)!) - centerY(nodes.get(b.target)!) || nodes.get(a.target)!.x - nodes.get(b.target)!.x || compareId(a,b));
    group.forEach((link,index) => result.set(connectionId(link), { sourceLane:index-(group.length-1)/2, sourceCount:group.length, targetLane:0, targetCount:1, sourceGutter, targetGutter:80 }));
  }
  for (const [id, group] of byTarget) {
    const target = nodes.get(id)!;
    const priorColumns = all.map(n => target.x - n.x - n.width).filter(gap => gap > 1);
    const targetGutter = priorColumns.length ? Math.min(...priorColumns) : 80;
    group.sort((a,b) => centerY(nodes.get(a.source)!) - centerY(nodes.get(b.source)!) || nodes.get(a.source)!.x - nodes.get(b.source)!.x || compareId(a,b));
    group.forEach((link,index) => Object.assign(result.get(connectionId(link))!, { targetLane:index-(group.length-1)/2, targetCount:group.length, targetGutter }));
  }
  // Route only around actual obstacles. Skipping a rank does not itself require an outer rail.
  for (const link of links) {
    const source = nodes.get(link.source), target = nodes.get(link.target);
    if (!source || !target) continue;
    const lane=result.get(connectionId(link))!;
    lane.sourceNode=source;lane.targetNode=target;
    lane.obstacles=all.filter(n=>n!==source&&n!==target);
    lane.routedPoints=routePoints({x:source.x+source.width,y:centerY(source)},{x:target.x,y:centerY(target)},lane);
    // Preserve the bounds hint consumed by the overview layout, only when genuinely needed.
    const top=Math.min(...all.map(n=>n.y)),bottom=Math.max(...all.map(n=>n.y+n.height));
    if(!lane.routedPoints.length)continue;
    const min=Math.min(...lane.routedPoints.map(p=>p.y)),max=Math.max(...lane.routedPoints.map(p=>p.y));
    if(min<top||max>bottom)lane.outsideRailY=top-min>max-bottom?min:max;
  }
  return result;
}

const equal=(a:Point,b:Point)=>Math.abs(a.x-b.x)<.001&&Math.abs(a.y-b.y)<.001;
const expanded=(n:RouteNode,padding:number):RouteNode=>({x:n.x-padding,y:n.y-padding,width:n.width+padding*2,height:n.height+padding*2});
/** Strict interior intersection: following a padded rectangle boundary is safe. */
export function segmentEntersCard(a:Point,b:Point,n:RouteNode):boolean {
  const epsilon=.0001;
  // The visibility grid is orthogonal: avoid allocating a clipping calculation
  // for its frequent horizontal/vertical checks. Curved fan samples use the
  // general segment test below.
  if(Math.abs(a.x-b.x)<epsilon)return a.x>n.x+epsilon&&a.x<n.x+n.width-epsilon&&Math.max(a.y,b.y)>n.y+epsilon&&Math.min(a.y,b.y)<n.y+n.height-epsilon;
  if(Math.abs(a.y-b.y)<epsilon)return a.y>n.y+epsilon&&a.y<n.y+n.height-epsilon&&Math.max(a.x,b.x)>n.x+epsilon&&Math.min(a.x,b.x)<n.x+n.width-epsilon;
  let low=0,high=1;
  for(const [origin,delta,min,max] of [[a.x,b.x-a.x,n.x+epsilon,n.x+n.width-epsilon],[a.y,b.y-a.y,n.y+epsilon,n.y+n.height-epsilon]]){
    if(Math.abs(delta)<epsilon){if(origin<=min||origin>=max)return false;continue;}
    const first=(min-origin)/delta,last=(max-origin)/delta;
    low=Math.max(low,Math.min(first,last));high=Math.min(high,Math.max(first,last));
    if(low>high)return false;
  }
  return high>=0&&low<=1;
}
const clear=(points:Point[],obstacles:RouteNode[])=>points.every((p,i)=>!i||!obstacles.some(n=>segmentEntersCard(points[i-1],p,n)));
function simplify(points:Point[]):Point[]{
  const result:Point[]=[];
  for(const p of points){
    if(result.length&&equal(result[result.length-1],p))continue;
    while(result.length>1){const a=result[result.length-2],b=result[result.length-1];if(Math.abs((b.x-a.x)*(p.y-b.y)-(b.y-a.y)*(p.x-b.x))>.001)break;result.pop();}
    result.push(p);
  }
  return result;
}

/** Small rectilinear visibility grid, with a bend penalty to keep routes calm. */
function obstacleRoute(start:Point,end:Point,obstacles:RouteNode[],bounds?:RouteNode):Point[] {
  const xs=[...new Set([start.x,end.x,...(bounds?[bounds.x,bounds.x+bounds.width]:[]),...obstacles.flatMap(n=>[n.x,n.x+n.width])])].filter(x=>!bounds||x>=bounds.x&&x<=bounds.x+bounds.width).sort((a,b)=>a-b);
  const ys=[...new Set([start.y,end.y,...(bounds?[bounds.y,bounds.y+bounds.height]:[]),...obstacles.flatMap(n=>[n.y,n.y+n.height])])].filter(y=>!bounds||y>=bounds.y&&y<=bounds.y+bounds.height).sort((a,b)=>a-b);
  const width=xs.length,height=ys.length,total=width*height;
  const index=(x:number,y:number)=>y*width+x;
  const source=index(xs.indexOf(start.x),ys.indexOf(start.y)),target=index(xs.indexOf(end.x),ys.indexOf(end.y));
  const point=(id:number):Point=>({x:xs[id%width],y:ys[Math.floor(id/width)]});
  // Cache visibility across the three incoming-direction states of each grid point.
  const visibility=new Map<string,boolean>();
  const visible=(a:number,b:number)=>{const key=a<b?`${a}:${b}`:`${b}:${a}`;if(!visibility.has(key))visibility.set(key,!obstacles.some(n=>segmentEntersCard(point(a),point(b),n)));return visibility.get(key)!;};
  const distances=new Float64Array(total*3).fill(Infinity),previous=new Int32Array(total*3).fill(-1);
  type Entry={state:number;cost:number;score:number};
  const queue:Entry[]=[];
  const push=(entry:Entry)=>{queue.push(entry);let i=queue.length-1;while(i){const parent=(i-1)>>1;if(queue[parent].score<=entry.score)break;queue[i]=queue[parent];i=parent;}queue[i]=entry;};
  const pop=()=>{const first=queue[0],last=queue.pop()!;if(queue.length){let i=0;while(i*2+1<queue.length){let child=i*2+1;if(child+1<queue.length&&queue[child+1].score<queue[child].score)child++;if(queue[child].score>=last.score)break;queue[i]=queue[child];i=child;}queue[i]=last;}return first;};
  const heuristic=(id:number)=>Math.abs(point(id).x-end.x)+Math.abs(point(id).y-end.y);
  distances[source*3]=0;push({state:source*3,cost:0,score:heuristic(source)});
  let found=-1;
  while(queue.length){
    const current=pop();if(current.cost!==distances[current.state])continue;
    const id=Math.floor(current.state/3),direction=current.state%3;
    if(id===target){found=current.state;break;}
    const x=id%width,y=Math.floor(id/width);
    const neighbors=[x+1<width?id+1:-1,y+1<height?id+width:-1,x>0?id-1:-1,y>0?id-width:-1];
    for(const next of neighbors){
      if(next<0||!visible(id,next))continue;
      const nextDirection=Math.abs(next-id)===1?1:2;
      const a=point(id),b=point(next);
      const cost=current.cost+Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+(direction&&direction!==nextDirection?28:0);
      const state=next*3+nextDirection;
      if(cost>=distances[state])continue;
      distances[state]=cost;previous[state]=current.state;push({state,cost,score:cost+heuristic(next)});
    }
  }
  if(found<0)return []; // The caller retries with less decorative clearance, never through a card.
  const result:Point[]=[];
  for(let state=found;state>=0;state=previous[state])result.push(point(Math.floor(state/3)));
  return simplify(result.reverse());
}

function routePoints(source:Point,target:Point,lane:ConnectionLane):Point[]{
  const gap=target.x-source.x,fan=gap>24?Math.min(18,gap/4):18;
  const sourceLaneY=source.y+finite(lane.sourceLane)*CONNECTION_LANE_SPACING;
  const targetLaneY=target.y+finite(lane.targetLane)*CONNECTION_LANE_SPACING;
  const start:Point[]=[source,{x:source.x+7,y:source.y},{x:source.x+fan,y:sourceLaneY}];
  const finish:Point[]=[{x:target.x-fan,y:targetLaneY},{x:target.x-7,y:target.y},target];
  const from=start[2],to=finish[0];
  const corridor=Math.max(from.x,Math.min(to.x,(source.x+target.x)/2+lane.targetLane*CONNECTION_LANE_SPACING));
  const ordinal=Math.max(lane.sourceLane+(lane.sourceCount-1)/2,lane.targetLane+(lane.targetCount-1)/2);
  const spacing=Math.min(CONNECTION_LANE_SPACING,MAX_OUTSIDE_RAIL_SPREAD/Math.max(1,lane.sourceCount-1,lane.targetCount-1));
  const endpointObstacles=[lane.sourceNode,lane.targetNode].filter((n):n is RouteNode=>!!n).map(n=>expanded(n,7));
  const other=lane.obstacles??[];
  const middle=[from,{x:corridor,y:from.y},{x:corridor,y:to.y},to];
  for(const padding of [24+ordinal*spacing,14,1]){
    const obstacles=[...other.map(n=>expanded(n,padding)),...endpointObstacles];
    if(gap>24&&clear(middle,obstacles))return [...start,...middle.slice(1,-1),...finish];
    // Most branches need a nearby corridor, not a search over every course on
    // the map. Restrict the first search and include every obstacle touching it.
    const margin=160;
    const bounds={x:Math.min(from.x,to.x)-margin,y:Math.min(from.y,to.y)-margin,width:Math.abs(to.x-from.x)+margin*2,height:Math.abs(to.y-from.y)+margin*2};
    const nearby=obstacles.filter(n=>n.x<=bounds.x+bounds.width&&n.x+n.width>=bounds.x&&n.y<=bounds.y+bounds.height&&n.y+n.height>=bounds.y);
    const local=obstacleRoute(from,to,nearby,bounds);
    const routed=local.length?local:obstacleRoute(from,to,obstacles);
    if(routed.length)return [...start,...routed.slice(1,-1),...finish];
  }
  // With no supplied geometry, retain a finite U-turn for callers outside the map.
  if(!other.length&&!endpointObstacles.length)return [...start,{x:from.x,y:Math.min(from.y,to.y)-80},{x:to.x,y:Math.min(from.y,to.y)-80},...finish];
  return []; // Impossible geometry must not be rendered as a misleading line through a course.
}

function roundedPolyline(input: Point[], radius=12,obstacles:RouteNode[]=[]): string {
  const points=input.filter((p,i)=>!i||p.x!==input[i-1].x||p.y!==input[i-1].y);
  if(!points.length)return '';
  const n=(value:number)=>Number(value.toFixed(3));
  let d=`M ${n(points[0].x)} ${n(points[0].y)}`;
  for(let i=1;i<points.length-1;i++){
    const before=points[i-1], at=points[i], after=points[i+1];
    const distanceBefore=Math.hypot(at.x-before.x,at.y-before.y),distanceAfter=Math.hypot(after.x-at.x,after.y-at.y);
    // A quadratic bend stays inside this square around its vertex. Limit that
    // square by actual card distance so even narrow emergency routes stay clear.
    const clearance=Math.min(Infinity,...obstacles.map(n=>Math.max(n.x-at.x,at.x-n.x-n.width,n.y-at.y,at.y-n.y-n.height,0)));
    const bend=Math.max(0,Math.min(radius,distanceBefore/2,distanceAfter/2,clearance-.01));
    if(!bend){d+=` L ${n(at.x)} ${n(at.y)}`;continue;}
    const entry={x:at.x+(before.x-at.x)*bend/distanceBefore,y:at.y+(before.y-at.y)*bend/distanceBefore};
    const exit={x:at.x+(after.x-at.x)*bend/distanceAfter,y:at.y+(after.y-at.y)*bend/distanceAfter};
    d+=` L ${n(entry.x)} ${n(entry.y)} Q ${n(at.x)} ${n(at.y)} ${n(exit.x)} ${n(exit.y)}`;
  }
  const last=points[points.length-1];
  return `${d} L ${n(last.x)} ${n(last.y)}`;
}
const defaultLane:ConnectionLane={sourceLane:0,sourceCount:1,targetLane:0,targetCount:1,sourceGutter:68,targetGutter:68};

const midpoint=(a:Point,b:Point):Point=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
/** Subdivision bounds prove an open curve clear; uncertainty falls back to the routed corridor. */
function clearQuadratic(a:Point,control:Point,b:Point,obstacles:RouteNode[],depth=0):boolean {
  const left=Math.min(a.x,control.x,b.x),right=Math.max(a.x,control.x,b.x),top=Math.min(a.y,control.y,b.y),bottom=Math.max(a.y,control.y,b.y);
  const touching=obstacles.filter(n=>right>n.x&&left<n.x+n.width&&bottom>n.y&&top<n.y+n.height);
  if(!touching.length)return true;
  if(depth>=12)return false;
  const first=midpoint(a,control),second=midpoint(control,b),middle=midpoint(first,second);
  return clearQuadratic(a,first,middle,touching,depth+1)&&clearQuadratic(middle,second,b,touching,depth+1);
}

function flowingShortcut(points:Point[],radius:number,obstacles:RouteNode[]):{path:string;label:Point}|undefined {
  if(points.length<6)return;
  const start=points[2],end=points[points.length-3];
  if(end.x-start.x<24)return;
  const middle=midpoint(start,end),first={x:middle.x,y:start.y},second={x:middle.x,y:end.y};
  const clearance=obstacles.map(n=>expanded(n,2));
  if(!clearQuadratic(start,first,middle,clearance)||!clearQuadratic(middle,second,end,clearance))return;
  const n=(v:number)=>Number(v.toFixed(3));
  const prefix=roundedPolyline(points.slice(0,3),radius,obstacles),suffix=roundedPolyline(points.slice(-3),radius,obstacles).replace(/^M [^ ]+ [^ ]+/,'');
  return {path:`${prefix} Q ${n(first.x)} ${n(first.y)} ${n(middle.x)} ${n(middle.y)} Q ${n(second.x)} ${n(second.y)} ${n(end.x)} ${n(end.y)}${suffix}`,label:middle};
}

/** All routes preserve exact port endpoints and horizontal entry/exit tangents. */
export function createConnectionRoute(source: Point, target: Point, lane: ConnectionLane=defaultLane, radius=12): ConnectionRoute {
  if(lane.direction==='BT'){
    const canonical=createConnectionRoute({x:-source.y,y:source.x},{x:-target.y,y:target.x},{...lane,direction:'LR'},radius);
    const points=canonical.points.map(p=>({x:p.y,y:-p.x}));
    const obstacles=[...(lane.obstacles??[]),lane.sourceNode,lane.targetNode].filter((n):n is RouteNode=>!!n).map(n=>({x:n.y,y:-n.x-n.width,width:n.height,height:n.width}));
    return {path:roundedPolyline(points,radius,obstacles),points,labelX:canonical.labelY,labelY:-canonical.labelX,corridorX:-canonical.corridorX};
  }
  const cleanSource={x:finite(source.x),y:finite(source.y)},cleanTarget={x:finite(target.x),y:finite(target.y)};
  const cached=lane.routedPoints;
  const points=cached?.length&&equal(cached[0],cleanSource)&&equal(cached[cached.length-1],cleanTarget)?cached:routePoints(cleanSource,cleanTarget,lane);
  let longest=0,label={x:(cleanSource.x+cleanTarget.x)/2,y:(cleanSource.y+cleanTarget.y)/2};
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.y-a.y);if(length>longest){longest=length;label={x:(a.x+b.x)/2,y:(a.y+b.y)/2};}}
  // Restrict rounding near actual cards, including emergency narrow-clearance corridors.
  const obstacles=[...(lane.obstacles??[]),lane.sourceNode,lane.targetNode].filter((n):n is RouteNode=>!!n);
  const shortcut=radius>=24?flowingShortcut(points,radius,obstacles):undefined;
  if(shortcut)label=shortcut.label;
  return {path:shortcut?.path??roundedPolyline(points,radius,obstacles),points,labelX:label.x,labelY:label.y,corridorX:points[3]?.x??label.x};
}
