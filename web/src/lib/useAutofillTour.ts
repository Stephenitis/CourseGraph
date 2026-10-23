import { useCallback, useEffect, useRef, useState } from 'react';
import type { AutofillTourStep } from './autofillTour';

export interface AutofillTourState { runId:number;pathId:string;steps:AutofillTourStep[];index:number;paused:boolean }
export function useAutofillTour(onStep:(step:AutofillTourStep)=>void,onFinish:()=>void) {
  const [current,setCurrent]=useState<AutofillTourState|null>(null);
  const currentRef=useRef(current),sequence=useRef(0),stepRef=useRef(onStep),finishRef=useRef(onFinish);
  stepRef.current=onStep;finishRef.current=onFinish;
  const replace=useCallback((next:AutofillTourState|null)=>{currentRef.current=next;setCurrent(next);},[]);
  const stop=useCallback(()=>replace(null),[replace]);
  const start=useCallback((pathId:string,steps:AutofillTourStep[])=>replace(steps.length?{runId:++sequence.current,pathId,steps,index:0,paused:false}:null),[replace]);
  const togglePause=useCallback(()=>{const state=currentRef.current;if(state)replace({...state,paused:!state.paused});},[replace]);
  const skip=useCallback(()=>{stop();finishRef.current();},[stop]);
  useEffect(()=>{if(current)stepRef.current(current.steps[current.index]);},[current?.runId,current?.index]);
  useEffect(()=>{
    if(!current||current.paused)return;
    const timer=setTimeout(()=>{
      if(currentRef.current!==current)return;
      if(current.index+1<current.steps.length)replace({...current,index:current.index+1});
      else{replace(null);finishRef.current();}
    },1500);
    return()=>clearTimeout(timer);
  },[current,replace]);
  return {current,start,stop,togglePause,skip};
}
