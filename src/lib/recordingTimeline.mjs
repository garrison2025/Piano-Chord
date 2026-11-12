/** Read-only timeline from recorded note-on/off MIDI events; no audio analysis, storage or upload. */
import {noteIntervals} from './recording.mjs';
import {describeHeldChord} from './chordDetection.mjs';

const MIN_STABLE_MS=90;
function safeDuration(take){
  return Math.max(0,Math.min(90000,Number.isFinite(take?.duration)?take.duration:0));
}
export function soundingNotesAt(take,timeMs){
  const duration=safeDuration(take);
  const t=Math.max(0,Math.min(duration,Number.isFinite(timeMs)?timeMs:0));
  return noteIntervals(take||{events:[]})
    .filter(n=>n.start<=t&&n.end>t).map(n=>n.midi).sort((a,b)=>a-b);
}
/** Stable, named chords only; short transitional voicings are suppressed. */
export function buildChordTimeline(take){
  const duration=safeDuration(take),notes=noteIntervals(take||{events:[]});
  if(!notes.length||!duration)return [];
  const edges=[...new Set([0,duration,...notes.flatMap(n=>[
    Math.max(0,Math.min(duration,n.start)),Math.max(0,Math.min(duration,n.end))
  ])])].sort((a,b)=>a-b);
  const runs=[];
  for(let i=0;i<edges.length-1;i++){
    const start=edges[i],end=edges[i+1];
    if(end<=start)continue;
    const held=notes.filter(n=>n.start<=start&&n.end>start).map(n=>n.midi);
    const chord=describeHeldChord(held);
    const symbol=(chord.kind==='triad'||chord.kind==='seventh')?chord.title:null;
    const previous=runs[runs.length-1];
    if(symbol && previous?.symbol===symbol && Math.abs(previous.end-start)<.1){
      previous.end=end;
    }else if(symbol)runs.push({start,end,symbol,kind:chord.kind});
  }
  return runs.filter(seg=>seg.end-seg.start>=MIN_STABLE_MS)
    .map(seg=>({...seg,start:Math.round(seg.start),end:Math.round(seg.end)}));
}
/** Choose a visibly meaningful first cover frame, but let the user override it. */
export function suggestCoverTime(take,segments=buildChordTimeline(take)){
  const duration=safeDuration(take);
  if(!duration)return 0;
  const firstChord=segments.find(s=>s.end-s.start>=150);
  if(firstChord)return Math.min(duration,firstChord.start+Math.min(260,(firstChord.end-firstChord.start)/2));
  const first=noteIntervals(take).find(n=>n.end>n.start);
  return first?Math.min(duration,first.start+Math.min(140,(first.end-first.start)/2)):0;
}
