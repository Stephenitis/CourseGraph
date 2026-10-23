import { BaseEdge, type EdgeProps } from '@xyflow/react';
import { createConnectionRoute, type ConnectionLane } from '../lib/connectionRouting';
export default function ConnectionEdge({id,sourceX,sourceY,targetX,targetY,data,style,markerEnd,markerStart,label,labelStyle,labelBgStyle,labelBgPadding,labelBgBorderRadius}:EdgeProps){
  const lane=data?.lane as ConnectionLane|undefined;
  const route=createConnectionRoute({x:sourceX,y:sourceY},{x:targetX,y:targetY},lane,40);
  return <BaseEdge id={id} path={route.path} labelX={route.labelX} labelY={route.labelY} label={label} labelStyle={labelStyle} labelBgStyle={labelBgStyle} labelBgPadding={labelBgPadding} labelBgBorderRadius={labelBgBorderRadius} style={style} markerEnd={markerEnd} markerStart={markerStart} interactionWidth={10}/>;
}
