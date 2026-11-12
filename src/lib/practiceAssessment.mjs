/**
 * Deterministic, local-only review of a timed progression recording.
 * A bar counts when all required pitch classes (and no extras) overlap
 * for at least 45 consecutive milliseconds inside that bar.
 *
 * This reports chord coverage, NOT general piano proficiency or expressive timing.
 */
import {noteIntervals} from './recording.mjs';
import {matchesPracticeNotes} from './practiceTransfer.mjs';

export const MIN_CHORD_HOLD_MS = 45;

export function assessGuidedTake(take,steps,bpm){
  if(!Array.isArray(steps)||steps.length<1||steps.length>8||
     steps.some(step=>!Array.isArray(step.notes)||![3,4].includes(step.notes.length)))
    throw new RangeError('Invalid guided practice steps');
  if(!Number.isInteger(bpm)||bpm<50||bpm>180)throw new RangeError('Invalid practice BPM');
  if(!take||!Number.isFinite(take.duration)||take.duration<0||!Array.isArray(take.events))
    throw new TypeError('Invalid recorded take');

  const duration=Math.max(0,take.duration),beatMs=60000/bpm,barMs=beatMs*4;
  const notes=noteIntervals(take).filter(n=>n.end>n.start&&n.start<duration&&n.end>0);
  const bars=steps.map((step,index)=>{
    const start=index*barMs,end=Math.min(start+barMs,duration);
    const basis={index,symbol:step.symbol,expected:[...step.notes],startMs:Math.round(start)};
    if(end<=start)return {...basis,status:'not-reached',matched:false,firstMatchMs:null,beat:null};

    const relevant=notes.filter(n=>n.end>start&&n.start<end);
    const boundaries=new Set([start,end]);
    for(const n of relevant){
      boundaries.add(Math.max(start,n.start));
      boundaries.add(Math.min(end,n.end));
    }
    const points=[...boundaries].sort((a,b)=>a-b);
    let first=null,runStart=null,runDuration=0;
    for(let i=0;i<points.length-1;i++){
      const left=points[i],right=points[i+1],span=right-left;
      if(span<=0)continue;
      const held=relevant.filter(n=>n.start<=left&&n.end>left).map(n=>n.midi);
      if(matchesPracticeNotes(held,step)){
        if(runStart===null)runStart=left;
        runDuration+=span;
        if(runDuration>=MIN_CHORD_HOLD_MS){first=runStart;break;}
      }else{runStart=null;runDuration=0;}
    }
    if(first===null)return {...basis,status:'missed',matched:false,firstMatchMs:null,beat:null};
    return {...basis,status:'matched',matched:true,firstMatchMs:Math.round(first-start),
      beat:Math.min(4,Math.floor((first-start)/beatMs)+1)};
  });
  const matched=bars.filter(bar=>bar.matched).length;
  return {matched,total:bars.length,coveragePercent:Math.round(matched/bars.length*100),
    bpm,barMs:Math.round(barMs),plannedDurationMs:Math.round(barMs*steps.length),
    complete:duration>=barMs*steps.length,bars};
}
