/** Selection-independent path state. A highlighted option is not a degree guarantee. */
export type ConnectionState='chosen'|'available'|'missing'|'context'|'neutral';
export interface ConnectionFacts {
  sourceChosen:boolean; targetChosen:boolean; sourceAvailable:boolean; targetAvailable:boolean;
  supportsTarget:boolean; incoming:boolean; outgoing:boolean; direct:boolean; missing:boolean;
}
export function connectionState(f:ConnectionFacts):ConnectionState {
  if(f.sourceChosen&&f.targetChosen&&f.supportsTarget)return 'chosen';
  if(f.incoming&&f.missing)return 'missing';
  if((f.sourceChosen&&f.targetAvailable&&!f.targetChosen)||(f.sourceAvailable&&!f.sourceChosen&&(f.targetChosen||f.incoming)))return 'available';
  if(f.incoming||f.outgoing)return 'context';
  return 'neutral';
}
