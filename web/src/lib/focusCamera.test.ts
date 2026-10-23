import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { DEFAULT_MAP_ZOOM, getCourseFocusCamera, getMapResetCamera } from './focusCamera';

test('a wide prerequisite neighborhood never clips the selected course at readable focus zoom',()=>{
 const selected={x:2200,y:1900,width:244,height:228};
 const neighbors=[{x:100,y:0,width:244,height:164},{x:2800,y:200,width:244,height:185}];
 const viewport={width:650,height:350},camera=getCourseFocusCamera(selected,neighbors,viewport);
 assert.ok(camera.zoom>=.5&&camera.zoom<=.85);
 const screen={left:viewport.width/2+(selected.x-camera.x)*camera.zoom,top:viewport.height/2+(selected.y-camera.y)*camera.zoom};
 assert.ok(screen.left>=24-.001&&screen.left+selected.width*camera.zoom<=viewport.width-24+.001);
 assert.ok(screen.top>=46-.001&&screen.top+selected.height*camera.zoom<=viewport.height-58+.001);
});

test('compact canvases reduce zoom only when needed to keep a long selected card visible',()=>{
 const selected={x:800,y:1800,width:244,height:340};
 const viewport={width:280,height:180},camera=getCourseFocusCamera(selected,[{x:0,y:0,width:244,height:160}],viewport);
 assert.ok(camera.zoom<.5&&camera.zoom>0);
 const left=viewport.width/2+(selected.x-camera.x)*camera.zoom,top=viewport.height/2+(selected.y-camera.y)*camera.zoom;
 assert.ok(left>=0&&left+selected.width*camera.zoom<=viewport.width+.001);
 assert.ok(top>=0&&top+selected.height*camera.zoom<=viewport.height+.001);
 assert.deepEqual(camera,getCourseFocusCamera(selected,[{x:0,y:0,width:244,height:160}],viewport));
});

test('selected cards remain clear of a visible minimap and its caption',()=>{
 for(const viewport of [{width:678,height:360},{width:320,height:220}]){
  const selected={x:2400,y:1900,width:244,height:228};
  const minimap={x:viewport.width-150,y:viewport.height-148,width:138,height:104};
  const camera=getCourseFocusCamera(selected,[{x:0,y:0,width:244,height:144}],viewport,{currentZoom:.75,obstacles:[minimap]});
  const screen={x:viewport.width/2+(selected.x-camera.x)*camera.zoom,y:viewport.height/2+(selected.y-camera.y)*camera.zoom,width:selected.width*camera.zoom,height:selected.height*camera.zoom};
  const overlap=screen.x<minimap.x+minimap.width&&screen.x+screen.width>minimap.x&&screen.y<minimap.y+minimap.height&&screen.y+screen.height>minimap.y;
  assert.equal(overlap,false);assert.ok(screen.x>=0&&screen.y>=0);assert.ok(screen.x+screen.width<=viewport.width+.001&&screen.y+screen.height<=viewport.height+.001);
 }
});

test('switching between courses preserves readable zoom and centers the selection',()=>{
 const viewport={width:900,height:380};
 for(const selected of [{x:100,y:200,width:244,height:144},{x:2000,y:3200,width:244,height:228}]){
  const camera=getCourseFocusCamera(selected,[{x:0,y:0,width:244,height:144}],viewport,{currentZoom:.8});
  assert.equal(camera.zoom,.8);
  assert.equal(viewport.width/2+(selected.x+selected.width/2-camera.x)*camera.zoom,viewport.width/2);
 }
});

test('reset keeps the requested readable zoom even when the full map is much larger',()=>{
 for(const width of [1800,7000]){
  const camera=getMapResetCamera({x:0,y:100,width,height:2200},{width:1000,height:600},{x:0,y:500,width:1,height:600});
  assert.equal(camera.zoom,.575);assert.equal(camera.zoom,DEFAULT_MAP_ZOOM);assert.equal(camera.y,800);
  if(width===7000)assert.ok(Math.abs(500-camera.x*camera.zoom-32)<.001);
 }
});

test('resetting a selected course keeps the preset zoom and avoids a top-right overview',()=>{
 const viewport={width:700,height:440},selected={x:2800,y:1700,width:244,height:280};
 const overview={x:530,y:12,width:140,height:118};
 const camera=getCourseFocusCamera(selected,[],viewport,{preferredZoom:DEFAULT_MAP_ZOOM,obstacles:[overview]});
 assert.equal(camera.zoom,DEFAULT_MAP_ZOOM);
 const x=viewport.width/2+(selected.x-camera.x)*camera.zoom,y=viewport.height/2+(selected.y-camera.y)*camera.zoom;
 assert.ok(x+selected.width*camera.zoom<=overview.x||y>=overview.y+overview.height);
});

test('overview fits complete routed bounds while blank-canvas browsing stays exactly at 0.4',async()=>{
 const {getOverviewCamera,getGraphViewportLimits}=await import('./focusCamera');
 for(const viewport of [{width:1200,height:700},{width:340,height:300}]){
  const bounds={x:-500,y:-300,width:7300,height:3100};
  const camera=getOverviewCamera(bounds,viewport);
  const left=viewport.width/2+(bounds.x-camera.x)*camera.zoom,top=viewport.height/2+(bounds.y-camera.y)*camera.zoom;
  assert.ok(left>=47.9&&top>=47.9);
  assert.ok(left+bounds.width*camera.zoom<=viewport.width-47.9);
  assert.ok(top+bounds.height*camera.zoom<=viewport.height-71.9);
  assert.ok(camera.zoom>=getGraphViewportLimits(bounds,viewport).minZoom);
  assert.equal(getOverviewCamera(bounds,viewport,.4).zoom,.4);
 }
});

test('window zoom converts a selected screen box into a centered graph region and caps tiny selections',async()=>{
 const {getWindowCamera}=await import('./focusCamera');
 const camera=getWindowCamera({x:100,y:80,width:400,height:200},{x:-100,y:-50,zoom:.2},{width:1000,height:600});
 assert.equal(camera.x,2000);assert.ok(Math.abs(camera.zoom-.468)<.00001);
 assert.equal(getWindowCamera({x:0,y:0,width:1,height:1},{x:0,y:0,zoom:.4},{width:1000,height:600}).zoom,1.4);
});
