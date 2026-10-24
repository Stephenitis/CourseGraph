import { BaseEdge, type EdgeProps } from '@xyflow/react';
import { createConnectionRoute, type ConnectionLane } from '../lib/connectionRouting';
export default function ConnectionEdge({id,sourceX,sourceY,targetX,targetY,data,style,markerEnd,markerStart,label,labelStyle,labelBgStyle,labelBgPadding,labelBgBorderRadius}:EdgeProps){
  const lane=data?.lane as ConnectionLane|undefined;
  const route=createConnectionRoute({x:sourceX,y:sourceY},{x:targetX,y:targetY},lane,40);
  const effect=data?.effect;
  const phase=[...id].reduce((sum,char)=>sum+char.charCodeAt(0),0)%17/4;
  return <>{effect&&<path className="route-aura" d={route.path} fill="none" stroke={style?.stroke} strokeWidth={12} aria-hidden="true"/>}<BaseEdge id={id} path={route.path} labelX={route.labelX} labelY={route.labelY} label={label} labelStyle={labelStyle} labelBgStyle={labelBgStyle} labelBgPadding={labelBgPadding} labelBgBorderRadius={labelBgBorderRadius} style={style} markerEnd={markerEnd} markerStart={markerStart} interactionWidth={10}/>{effect&&<path className={`route-spark route-spark-${effect}`} d={route.path} pathLength={1000} fill="none" stroke={style?.stroke} strokeWidth={effect==='chosen'?5:4} style={{animationDelay:`-${phase}s`}} aria-hidden="true"/>}</>;
}
