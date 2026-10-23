import { useEffect, useRef, useState } from 'react';
import type { FocusRect } from '../lib/focusCamera';
/** A screen-space selection surface; never changes courses, paths, or graph coordinates. */
export function ZoomWindow({onSelect,onCancel}:{onSelect:(rect:FocusRect)=>void;onCancel:()=>void}){
  const surface=useRef<HTMLDivElement>(null);
  const start=useRef<{x:number;y:number}|null>(null);
  const [box,setBox]=useState<FocusRect|null>(null);
  useEffect(()=>{surface.current?.focus();},[]);
  const point=(event:React.PointerEvent<HTMLDivElement>)=>{
    const bounds=event.currentTarget.getBoundingClientRect();
    return {x:Math.max(0,Math.min(bounds.width,event.clientX-bounds.left)),y:Math.max(0,Math.min(bounds.height,event.clientY-bounds.top))};
  };
  const rectangle=(end:{x:number;y:number}):FocusRect=>({x:Math.min(start.current!.x,end.x),y:Math.min(start.current!.y,end.y),width:Math.abs(end.x-start.current!.x),height:Math.abs(end.y-start.current!.y)});
  return <div ref={surface} className="zoom-window-surface" tabIndex={-1} role="region" aria-label="Drag a rectangle to zoom into the map. Escape cancels." onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onCancel();}}}
    onPointerDown={event=>{if(event.button!==0||!event.isPrimary)return;event.preventDefault();start.current=point(event);event.currentTarget.setPointerCapture(event.pointerId);setBox({...start.current,width:0,height:0});}}
    onPointerMove={event=>{if(start.current)setBox(rectangle(point(event)));}}
    onPointerUp={event=>{if(!start.current)return;const rect=rectangle(point(event));start.current=null;event.currentTarget.releasePointerCapture(event.pointerId);setBox(null);if(rect.width>=16&&rect.height>=16)onSelect(rect);}}
    onPointerCancel={()=>{start.current=null;setBox(null);}}>
    <div className="zoom-window-instruction">Drag a box to explore <span>Esc to cancel</span><button onPointerDown={event=>event.stopPropagation()} onClick={onCancel}>Cancel</button></div>
    {box&&<div className="zoom-window-box" style={{left:box.x,top:box.y,width:box.width,height:box.height}}/>}
  </div>;
}
