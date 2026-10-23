export interface FocusRect { x:number; y:number; width:number; height:number }
export interface FocusOptions { currentZoom?:number; preferredZoom?:number; obstacles?:FocusRect[] }
export const DEFAULT_MAP_ZOOM=.575;

/** Keep the full graph readable at the furthest zoom and reachable within a bounded canvas. */
export function getGraphViewportLimits(bounds:FocusRect,viewport:{width:number;height:number}){
  const width=Math.max(1,viewport.width),height=Math.max(1,viewport.height);
  const minZoom=Math.min(DEFAULT_MAP_ZOOM,Math.max(.01,Math.min(
    Math.max(1,width-48)/Math.max(1,bounds.width),
    Math.max(1,height-48)/Math.max(1,bounds.height),
  )));
  // Enough space to focus boundary cards, without allowing a pan into an empty canvas.
  const marginX=width/(2*DEFAULT_MAP_ZOOM),marginY=height/(2*DEFAULT_MAP_ZOOM);
  const translateExtent:[[number,number],[number,number]]=[
    [bounds.x-marginX,bounds.y-marginY],
    [bounds.x+bounds.width+marginX,bounds.y+bounds.height+marginY],
  ];
  return {minZoom,translateExtent};
}

/** A readable starting scale is independent of the number of mapped courses. */
export function getMapResetCamera(bounds:FocusRect,viewport:{width:number;height:number},anchor?:FocusRect){
  const zoom=DEFAULT_MAP_ZOOM;
  const halfWidth=Math.max(1,viewport.width)/(2*zoom);
  const margin=32/zoom;
  const x=bounds.width>2*halfWidth?bounds.x+halfWidth-margin:bounds.x+bounds.width/2;
  return {x,y:anchor?anchor.y+anchor.height/2:bounds.y+bounds.height/2,zoom};
}

/** Center the selected course in free canvas, preserving a readable zoom across selections. */
export function getCourseFocusCamera(selected:FocusRect,neighbors:FocusRect[],viewport:{width:number;height:number},options:FocusOptions={}) {
  const width=Math.max(1,viewport.width),height=Math.max(1,viewport.height);
  const side=Math.min(24,width*.08),top=Math.min(46,height*.15),bottom=Math.min(78,height*.22);
  const usableWidth=width-2*side,usableHeight=height-top-bottom;
  const boxes=[selected,...neighbors];
  const left=Math.min(...boxes.map(b=>b.x)),right=Math.max(...boxes.map(b=>b.x+b.width));
  const first=Math.min(...boxes.map(b=>b.y)),last=Math.max(...boxes.map(b=>b.y+b.height));
  const neighborhoodFit=Math.min(usableWidth/(right-left+48),usableHeight/(last-first+48));
  const desiredZoom=options.preferredZoom??(options.currentZoom!==undefined&&options.currentZoom>=.55?options.currentZoom:Math.min(.85,Math.max(.65,neighborhoodFit)));
  let free={x:side,y:top,width:usableWidth,height:usableHeight};
  const intersects=(a:FocusRect,b:FocusRect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
  for(const obstacle of options.obstacles??[]){
    if(!intersects(free,obstacle))continue;
    const zoom=Math.min(desiredZoom,free.width/selected.width,free.height/selected.height);
    const centered={x:free.x+(free.width-selected.width*zoom)/2,y:free.y+(free.height-selected.height*zoom)/2,width:selected.width*zoom,height:selected.height*zoom};
    const blocked={x:obstacle.x-12,y:obstacle.y-12,width:obstacle.width+24,height:obstacle.height+24};
    if(!intersects(centered,blocked))continue;
    const candidates=[
      {...free,width:blocked.x-free.x},
      {...free,x:blocked.x+blocked.width,width:free.x+free.width-blocked.x-blocked.width},
      {...free,height:blocked.y-free.y},
      {...free,y:blocked.y+blocked.height,height:free.y+free.height-blocked.y-blocked.height},
    ].filter(rect=>rect.width>0&&rect.height>0);
    candidates.sort((a,b)=>b.width*b.height-a.width*a.height);
    if(candidates[0])free=candidates[0];
  }
  const zoom=Math.min(desiredZoom,free.width/selected.width,free.height/selected.height);
  return {
    zoom,
    x:selected.x+selected.width/2+(width/2-free.x-free.width/2)/zoom,
    y:selected.y+selected.height/2+(height/2-free.y-free.height/2)/zoom,
  };
}
