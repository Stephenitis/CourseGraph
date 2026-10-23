import { useId, useState } from 'react';
import { type Node, type NodeProps } from '@xyflow/react';
import { ArrowRight, Check, ChevronRight, LockKeyhole, X } from 'lucide-react';
import './ProgramMilestone.css';

const PIN_OUTLINE='M100 7 151 18 177 44 171 119 149 151 100 181 51 151 29 119 23 44 49 18Z';
const PIN_INSET='M100 18 146 28 165 48 159 115 140 143 100 168 60 143 41 115 35 48 54 28Z';

// Original CourseGraph artwork: academic motifs, not an institutional seal.
const CREST_OUTLINE='M300 18 356 47 455 53 490 99 548 121 531 207 518 232 513 345Q505 425 438 482L337 558Q300 585 263 558L162 482Q95 425 87 345L82 232 69 207 52 121 110 99 145 53 244 47Z';
const CREST_FIELD='M300 42 351 69 445 75 475 115 521 136 510 199 496 226 491 343Q483 414 423 465L324 540Q300 557 276 540L177 465Q117 414 109 343L104 226 90 199 79 136 125 115 155 75 249 69Z';

function AcademicCrest({earned,code,kind}:{earned:boolean;code?:string;kind?:string}){
  const uid=useId().replace(/:/g,'');
  const id=(name:string)=>`${uid}-crest-${name}`;
  const leaves=[
    {x:128,y:257,angle:-37},{x:126,y:291,angle:-28},{x:130,y:327,angle:-18},
    {x:141,y:362,angle:-7},{x:158,y:395,angle:8},{x:183,y:424,angle:21},
  ];
  return <svg className={`degree-pin degree-pin-crest ${earned?'is-recorded':''}`} viewBox="0 0 600 600" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={id('metal')} x1="92" y1="47" x2="476" y2="559" gradientUnits="userSpaceOnUse"><stop stopColor="#fff1c0"/><stop offset=".13" stopColor="#d2a45c"/><stop offset=".29" stopColor="#ffe6a5"/><stop offset=".43" stopColor="#a26830"/><stop offset=".58" stopColor="#eed095"/><stop offset=".74" stopColor="#b17b3b"/><stop offset=".88" stopColor="#ffe9b3"/><stop offset="1" stopColor="#795026"/></linearGradient>
      <linearGradient id={id('enamel')} x1="181" y1="81" x2="409" y2="532" gradientUnits="userSpaceOnUse"><stop stopColor="#bd2940"/><stop offset=".3" stopColor="#9d142e"/><stop offset=".69" stopColor="#790c26"/><stop offset="1" stopColor="#480e1b"/></linearGradient>
      <linearGradient id={id('ivory')} x1="202" y1="282" x2="371" y2="399" gradientUnits="userSpaceOnUse"><stop stopColor="#fff8de"/><stop offset=".45" stopColor="#f9eecf"/><stop offset="1" stopColor="#dbbe87"/></linearGradient>
      <linearGradient id={id('ribbon')} x1="300" y1="433" x2="300" y2="508" gradientUnits="userSpaceOnUse"><stop stopColor="#fff0c2"/><stop offset=".46" stopColor="#e7be76"/><stop offset="1" stopColor="#b47c39"/></linearGradient>
      <linearGradient id={id('shine')} x1="0" y1="0" x2="1" y2=".35"><stop stopColor="white" stopOpacity="0"/><stop offset=".43" stopColor="white" stopOpacity="0"/><stop offset=".5" stopColor="white" stopOpacity=".6"/><stop offset=".57" stopColor="white" stopOpacity="0"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
      <clipPath id={id('clip')}><path d={CREST_OUTLINE}/></clipPath>
      <g id={id('leaf')}><path d="M0 0C-22-4-37-21-34-39-14-38 2-22 0 0Z" fill={`url(#${id('metal')})`} stroke="#64411f" strokeWidth="2"/><path d="M-3-6-26-30" stroke="#fff0c1" strokeWidth="1.6" strokeLinecap="round" opacity=".7"/></g>
    </defs>
    <path d={CREST_OUTLINE} transform="translate(0 10)" fill="#4d3022" stroke="#4d3022" strokeWidth="4" strokeLinejoin="round"/>
    <path d={CREST_OUTLINE} fill={`url(#${id('metal')})`} stroke="#6e4523" strokeWidth="3" strokeLinejoin="round"/>
    <path d={CREST_OUTLINE} transform="translate(300 300) scale(.978) translate(-300 -300)" stroke="#fff2c9" strokeWidth="2" strokeLinejoin="round" opacity=".8"/>
    <path d={CREST_FIELD} fill={`url(#${id('enamel')})`} stroke="#704522" strokeWidth="4" strokeLinejoin="round"/>
    <path d={CREST_FIELD} transform="translate(300 300) scale(.975) translate(-300 -300)" stroke="#f5cf88" strokeWidth="1.7" opacity=".72"/>
    <path d="M90 144 131 125 160 86 251 80 300 54 349 80 440 86 469 125" stroke="#ffe4ab" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".65"/>
    <path d="M107 160Q294 77 505 158L494 224Q312 155 109 260Z" fill="#fff4d6" opacity=".055"/>
    <path d="m300 48 0 492M122 220l178 320 178-320" stroke="#f9d497" strokeWidth="1.5" opacity=".08"/>
    <text x="300" y="94" fill="#fae6b7" textAnchor="middle" fontSize="25" fontWeight="800" letterSpacing="10" fontFamily="Arial, sans-serif">MIT</text>
    {/* The beacon and branching circuits share a single raised metal stem. */}
    <g stroke="#4e1c20" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" opacity=".7" transform="translate(0 4)"><path d="M300 297V180M300 242l-66-37v-42M300 242l66-37v-42M265 274l-68-37v-30M335 274l68-37v-30"/></g>
    <g stroke={`url(#${id('metal')})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"><path d="M300 297V180M300 242l-66-37v-42M300 242l66-37v-42M265 274l-68-37v-30M335 274l68-37v-30"/></g>
    {[[234,160],[366,160],[197,204],[403,204]].map(([x,y])=><g key={`${x}-${y}`}><circle cx={x} cy={y} r="11" fill={`url(#${id('metal')})`} stroke="#643a21" strokeWidth="2"/><circle cx={x} cy={y} r="4" fill="#fff0cc"/></g>)}
    <path d="m300 108 12 31 32 12-32 12-12 31-12-31-32-12 32-12Z" transform="translate(0 4)" fill="#511c20"/>
    <path d="m300 106 12 31 32 12-32 12-12 31-12-31-32-12 32-12Z" fill={`url(#${id('metal')})`} stroke="#fff0c4" strokeWidth="2" strokeLinejoin="round"/>
    <path d="m300 117 0 64M268 149h64" stroke="#fff6db" strokeWidth="1.6" opacity=".8"/>
    <path d="m275 121-6-7m56 7 6-7m-56 64-6 7m56-7 6 7" stroke="#e7c589" strokeWidth="3" strokeLinecap="round"/>
    {/* Two laurel branches frame the book, rather than reading as a seal. */}
    {[false,true].map(mirrored=><g key={String(mirrored)} transform={mirrored?'translate(600 0) scale(-1 1)':undefined}>
      <path d="M125 233C111 326 139 404 210 451" stroke="#57301e" strokeWidth="10" strokeLinecap="round"/>
      <path d="M125 233C111 326 139 404 210 451" stroke={`url(#${id('metal')})`} strokeWidth="6" strokeLinecap="round"/>
      {leaves.map(({x,y,angle})=><use key={y} href={`#${id('leaf')}`} transform={`translate(${x} ${y}) rotate(${angle})`}/>)}
      <path d="M137 289c10-15 22-22 35-19-2 17-14 28-35 30m7 23c11-12 24-17 35-12-5 16-17 23-32 23m17 23c12-10 24-11 34-5-6 14-18 20-29 15" fill={`url(#${id('metal')})`} stroke="#6d4220" strokeWidth="1.6"/>
    </g>)}
    {/* A deep book binding makes the ivory pages feel inset into the pin. */}
    <path d="M175 285q64-17 125 17 61-34 125-17v111q-64-14-125 22-61-36-125-22Z" transform="translate(0 6)" fill="#4f1c1e" stroke="#4f1c1e" strokeWidth="10" strokeLinejoin="round"/>
    <path d="M175 285q64-17 125 17 61-34 125-17v111q-64-14-125 22-61-36-125-22Z" fill={`url(#${id('metal')})`} stroke="#704923" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M186 281q60-14 114 18v105q-54-33-114-18Z" fill={`url(#${id('ivory')})`} stroke="#bb9252" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M414 281q-60-14-114 18v105q54-33 114-18Z" fill="#fff3d5" stroke="#bb9252" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M300 303v96" stroke="#755025" strokeWidth="4"/>
    {[310,331,352,373].map(y=><g key={y} stroke="#b69257" strokeWidth="3" strokeLinecap="round" opacity=".75"><path d={`M204 ${y}q36-2 76 19`}/><path d={`M320 ${y+19}q40-21 76-19`}/></g>)}
    <path d="M192 285q50-10 104 19m8 0q54-29 104-19" stroke="#fffdf0" strokeWidth="3" strokeLinecap="round"/>
    {/* An integrated metal nameplate finishes the lower shield. */}
    <path d="m142 441 24-12 134 13 134-13 24 12-13 37 11 24-46-9H190l-46 9 11-24Z" fill="#703f25" stroke="#4e2c20" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M162 433q138 25 276 0v62q-138 25-276 0Z" fill={`url(#${id('ribbon')})`} stroke="#724823" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M168 438q132 24 264 0m-264 52q132 24 264 0" stroke="#fff0bd" strokeWidth="2" opacity=".8"/>
    <text x="300" y="483" fill="#68182a" textAnchor="middle" fontSize={code&&code.length>4?36:42} fontWeight="900" letterSpacing="4" fontFamily="Arial, sans-serif">{code??'MIT'}</text>
    <text x="300" y="533" fill="#f2d79f" textAnchor="middle" fontSize="13" fontWeight="800" letterSpacing="4" fontFamily="Arial, sans-serif">{kind}</text>
    <circle cx="110" cy="142" r="5" fill="#ffedba"/><circle cx="490" cy="142" r="5" fill="#a77237"/>
    <g clipPath={`url(#${id('clip')})`}><rect className="degree-pin-sheen degree-crest-sheen" x="-440" y="-80" width="700" height="760" fill={`url(#${id('shine')})`} transform="rotate(-14 300 300)"/></g>
    <path className="degree-pin-glint degree-pin-glint-one" d="m454 55 5 15 15 5-15 5-5 15-5-15-15-5 15-5Z" fill="#fff7dc"/>
    <path className="degree-pin-glint degree-pin-glint-two" d="m104 350 3 10 10 3-10 3-3 10-3-10-10-3 10-3Z" fill="#fff7dc"/>
    {earned&&<g transform="translate(463 438)"><circle cy="5" r="36" fill="#4c2f20"/><circle r="36" fill={`url(#${id('metal')})`} stroke="#644020" strokeWidth="2"/><circle r="27" fill="#fff1ce" stroke="#ad7839" strokeWidth="2"/><path d="m-13 0 9 9 18-21" stroke="#881a30" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></g>}
  </svg>;
}

function EnamelPin({earned=false,code,kind,compact=false}:{earned?:boolean;code?:string;kind?:string;compact?:boolean}){
  const uid=useId().replace(/:/g,'');
  const id=(name:string)=>`${uid}-${name}`;
  if(!compact)return <AcademicCrest earned={earned} code={code} kind={kind}/>;
  return <svg className={`degree-pin ${compact?'degree-pin-compact':''} ${earned?'is-recorded':''}`} viewBox="0 0 200 194" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={id('metal')} x1="31" y1="19" x2="165" y2="173" gradientUnits="userSpaceOnUse"><stop stopColor="#fff4cf"/><stop offset=".22" stopColor="#bd8a45"/><stop offset=".39" stopColor="#fff3cc"/><stop offset=".62" stopColor="#a56c30"/><stop offset=".8" stopColor="#edc57d"/><stop offset="1" stopColor="#744322"/></linearGradient>
      <linearGradient id={id('enamel')} x1="55" y1="24" x2="149" y2="167" gradientUnits="userSpaceOnUse"><stop stopColor="#b41e35"/><stop offset=".48" stopColor="#85081f"/><stop offset="1" stopColor="#430a18"/></linearGradient>
      <linearGradient id={id('shine')} x1="0" y1="0" x2="1" y2=".35"><stop stopColor="white" stopOpacity="0"/><stop offset=".45" stopColor="white" stopOpacity="0"/><stop offset=".52" stopColor="white" stopOpacity=".65"/><stop offset=".6" stopColor="white" stopOpacity="0"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
      <clipPath id={id('clip')}><path d={PIN_OUTLINE}/></clipPath>
    </defs>
    <path d={PIN_OUTLINE} transform="translate(0 5)" fill="#432d21" stroke="#3c291f" strokeWidth="2"/>
    <path d={PIN_OUTLINE} fill={`url(#${id('metal')})`} stroke="#e2b56c" strokeWidth="1"/>
    <path d="M100 11 149 22 172 46 167 117 145 148 100 176 55 148 33 117 28 46 51 22Z" stroke="#fff4d8" strokeOpacity=".65" strokeWidth="1"/>
    <path d={PIN_INSET} fill={`url(#${id('enamel')})`} stroke="#57331f" strokeWidth="2"/>
    <path d="M100 23 143 32 160 50 155 113 136 139 100 162 64 139 45 113 40 50 57 32Z" stroke="#e1b872" strokeOpacity=".68" strokeWidth="1"/>
    <path d="m40 50 17-18 43-9 43 9" stroke="#ffefd5" strokeOpacity=".44" strokeWidth="2" strokeLinecap="round"/>
    <path d="M43 54C76 36 114 37 157 53L154 83C108 70 72 71 41 92Z" fill="white" fillOpacity=".055"/>
    {compact?<><path d="m69 94 31-31 31 31-31 31Z" stroke="#f4d79d" strokeWidth="5"/><path d="M100 63v62M69 94h62" stroke="#f4d79d" strokeWidth="3"/>{[ [100,63],[69,94],[131,94],[100,125] ].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill="#f4d79d"/>)}</>:<>
      <text x="100" y="57" fill="#f6dfb1" textAnchor="middle" fontSize="15" fontWeight="800" letterSpacing="4" fontFamily="Arial, sans-serif">MIT</text>
      <path d="M63 68h74" stroke="#d6ad71" strokeOpacity=".55"/>
      <text x="100" y="109" fill="#fff2d0" textAnchor="middle" fontSize={code&&code.length>4?31:39} fontWeight="800" letterSpacing="-1" fontFamily="Arial, sans-serif">{code??'MIT'}</text>
      <text x="100" y="130" fill="#e9c993" textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="2" fontFamily="Arial, sans-serif">{kind}</text>
      <path d="m87 145 13 8 13-8M100 141v12" stroke="#e9c993" strokeWidth="1.7" strokeLinecap="round"/>
    </>}
    <circle cx="37" cy="47" r="2.2" fill="#fff1c6"/><circle cx="163" cy="47" r="2.2" fill="#a77738"/>
    <g clipPath={`url(#${id('clip')})`}><rect className="degree-pin-sheen" x="-155" y="-15" width="250" height="240" fill={`url(#${id('shine')})`} transform="rotate(-13 100 95)"/></g>
    <path className="degree-pin-glint degree-pin-glint-one" d="m152 23 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#fff6d9"/>
    <path className="degree-pin-glint degree-pin-glint-two" d="m42 124 1.5 5 5 1.5-5 1.5-1.5 5-1.5-5-5-1.5 5-1.5Z" fill="#fff6d9"/>
    {earned&&<g transform="translate(143 137)"><circle r="16" fill={`url(#${id('metal')})`} stroke="#56351f"/><circle r="12" fill="#215448"/><path d="m-6 0 4 4 8-9" stroke="#fff3ce" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/></g>}
  </svg>;
}

export function SummitEmblem({earned=false}:{earned?:boolean}){
  return <span className={`summit-emblem ${earned?'earned':''}`} aria-hidden="true"><EnamelPin earned={earned} compact/></span>;
}
export type SummitFlowNode=Node<{programName:string;programKind?:'major'|'minor'|'masters';completedPercent?:number;plannedPercent?:number; eligible:boolean; recorded:boolean; onReview:()=>void},'summit'>;
export default function ProgramMilestone({data}:NodeProps<SummitFlowNode>){
  const percent=(value:number|undefined)=>Number.isFinite(value)?Math.min(100,Math.max(0,Math.round(value!))):0;
  const completed=percent(data.completedPercent),planned=Math.max(completed,percent(data.plannedPercent));
  const kind=data.programKind==='minor'?'MINOR':data.programKind==='masters'?'MASTER’S':'MAJOR';
  const code=data.programName.includes('·')?data.programName.split('·').at(-1)!.trim():data.programKind==='minor'?'18':'MIT';
  const scope='Progress covers modeled coursework only. It does not verify full degree requirements. Advisor-review records are separate.';
  return <div className={`program-summit degree-goal ${data.recorded?'recorded':''}`} title={scope}>
    <div className="degree-pin-wrap"><EnamelPin earned={data.recorded} code={code} kind={kind}/></div>
    <div className="degree-goal-heading"><span>{data.recorded?'ADVISOR REVIEW RECORDED':`MIT · ${kind}`}</span><h3>{data.programName}</h3></div>
    <div className="degree-progress" title={`${completed}% completed; ${planned}% including valid planned coursework. ${scope}`}>
      <div className="degree-progress-label"><span>Mapped coursework</span><strong>{completed}% completed</strong></div>
      <div className="degree-progress-track" role="progressbar" aria-label="Completed mapped coursework" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completed} aria-valuetext={`${completed}% completed; ${planned}% including valid planned coursework. Full degree requirements need review.`}><span className="degree-progress-planned" style={{width:`${planned}%`}}/><span className="degree-progress-completed" style={{width:`${completed}%`}}/></div>
      <div className="degree-progress-scale"><span>0%</span><span>{planned}% with plan</span><span>100%</span></div>
    </div>
    {data.eligible?<button className="degree-review nodrag nopan" onClick={data.onReview}>{data.recorded?'View advisor review':'Record advisor review'}<ArrowRight size={12}/></button>:<span className="degree-review-note">Program review required</span>}
    <div className="degree-next" aria-label="Further study requires separate advisor and admissions review">{data.programKind!=='masters'&&<><span><LockKeyhole size={9}/>Master’s</span><ChevronRight size={9}/></>}<span><LockKeyhole size={9}/>PhD</span></div>
  </div>;
}
export function AdvisorReviewDialog({programName,catalogYear,recordedAt,onConfirm,onReset,onClose}:{programName:string;catalogYear:string;recordedAt?:string;onConfirm:()=>void;onReset:()=>void;onClose:()=>void}){
  const [checks,setChecks]=useState([false,false,false]);
  const labels=[`I reviewed the full ${programName} major requirements with my advisor, beyond the courses shown here.`,`My advisor confirmed that I have fulfilled those major requirements for catalog ${catalogYear}.`,'I understand this is my own record of that review. CourseGraph has not verified it with MIT.'];
  return <section className="dialog review-dialog" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="review-title"><button autoFocus className="dialog-close icon-button" aria-label="Close advisor review" onClick={onClose}><X size={18}/></button><SummitEmblem earned={!!recordedAt}/><span className="eyebrow">ADVISOR REVIEW</span><h2 id="review-title">{recordedAt?'Your review is recorded.':'Record major completion'}</h2><p>{recordedAt?`You recorded an advisor review for ${programName} on ${new Date(recordedAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}.`:'When you have reviewed your full major requirements with an advisor, you can record that milestone here.'}</p><div className="review-scope"><b>Major fulfillment is one milestone.</b><p>This record does not certify graduation, other degree requirements, or eligibility for a master’s or PhD. Further study has its own advising and admissions process.</p></div>{!recordedAt&&<fieldset className="review-checklist"><legend className="sr-only">Confirm your advisor review</legend>{labels.map((label,i)=><label key={label}><input type="checkbox" checked={checks[i]} onChange={e=>setChecks(previous=>previous.map((v,index)=>index===i?e.target.checked:v))}/><span>{label}</span></label>)}</fieldset>}{recordedAt?<><div className="review-recorded-note"><Check size={15}/><span>User-recorded advisor review · saved with this path</span></div><button className="primary-button" onClick={onClose}>Back to your path<ArrowRight size={16}/></button><button className="review-reset" onClick={onReset}>Remove this record</button></>:<button className="primary-button" disabled={!checks.every(Boolean)} onClick={onConfirm}>Record my advisor review<Check size={16}/></button>}<p className="review-footnote">You can remove the record or undo this change. Changes to your completed history require a new review.</p></section>;
}
