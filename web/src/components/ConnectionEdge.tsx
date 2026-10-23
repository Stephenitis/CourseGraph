import { useMemo } from 'react';
import { BaseEdge, useViewport, type EdgeProps } from '@xyflow/react';
import { createConnectionRoute, type ConnectionLane } from '../lib/connectionRouting';
export default function ConnectionEdge({id,sourceX,sourceY,targetX,targetY,data,style,markerEnd,markerStart,label,labelStyle,labelBgStyle,labelBgPadding,labelBgBorderRadius}:EdgeProps){
  const {zoom}=useViewport();
  const scale=Math.max(.01,zoom);
  const dash=typeof style?.strokeDasharray==='string'?style.strokeDasharray.split(' ').map(n=>Number(n)/scale).join(' '):undefined;
  const lane=data?.lane as ConnectionLane|undefined;
  const route=useMemo(()=>createConnectionRoute({x:sourceX,y:sourceY},{x:targetX,y:targetY},lane,120),[sourceX,sourceY,targetX,targetY,lane]);
  const state=data?.state;
  return <>{state==='chosen'&&<path className="route-halo" d={route.path} fill="none" stroke="var(--route-chosen)" strokeWidth={8/scale} opacity={.13} vectorEffect="non-scaling-stroke"/>}<BaseEdge id={id} path={route.path} labelX={route.labelX} labelY={route.labelY} label={label} labelStyle={labelStyle} labelBgStyle={labelBgStyle} labelBgPadding={labelBgPadding} labelBgBorderRadius={labelBgBorderRadius} style={{...style,strokeWidth:Number(style?.strokeWidth??1.35)/scale,strokeDasharray:dash,vectorEffect:'non-scaling-stroke'}} markerEnd={markerEnd} markerStart={markerStart} interactionWidth={10}/>{state==='chosen'&&<circle className="route-spark" r={1.8/scale} fill="var(--route-spark)" pointerEvents="none"><animateMotion dur="9s" repeatCount="indefinite" path={route.path}/></circle>}</>;
}
