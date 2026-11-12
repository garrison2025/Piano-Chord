/** Browser-only seventh-chord practice model. All events are deterministic. */
import {releaseChords} from '../data/chords.js';
import {createChord} from './music.js';

export const SEVENTH_PATTERNS=Object.freeze([
  Object.freeze({id:'ii-v-i',label:'ii–V–I in C · Dm7 – G7 – Cmaj7',slugs:Object.freeze(['d-minor-7','g-7','c-major-7'])}),
  Object.freeze({id:'turnaround',label:'I–vi–ii–V · Cmaj7 – Am7 – Dm7 – G7',slugs:Object.freeze(['c-major-7','a-minor-7','d-minor-7','g-7'])}),
]);
export const SEVENTH_MIN_BPM=50;
export const SEVENTH_MAX_BPM=180;
export function seventhTempo(raw){
  const bpm=Number(raw);
  if(!Number.isInteger(bpm)||bpm<SEVENTH_MIN_BPM||bpm>SEVENTH_MAX_BPM)
    throw new RangeError('Tempo must be an integer between 50 and 180 BPM');
  return bpm;
}
export function seventhPattern(id){
  const config=SEVENTH_PATTERNS.find(p=>p.id===id);
  if(!config)throw new Error('Unknown seventh-chord practice pattern');
  return {
    id:config.id,label:config.label,
    bars:config.slugs.map(slug=>{
      const entry=releaseChords.find(c=>c.slug===slug);
      if(!entry)throw new Error('Missing published seventh chord '+slug);
      const chord=createChord(entry);
      if(chord.notes.length!==4)throw new Error('Practice chord must contain a seventh');
      return {slug,symbol:chord.symbol,notes:chord.notes,midi:chord.inversions[0].midi};
    })
  };
}
/**
 * Schedule in AudioContext seconds: each chord lasts a whole 4/4 bar.
 * Visual timers use these exact time anchors instead of accumulating Date.now drift.
 */
export function planSeventhPractice(id,bpm,startSeconds=0,{click=true}={}){
  const tempo=seventhTempo(bpm),pattern=seventhPattern(id);
  if(!Number.isFinite(startSeconds)||startSeconds<0)throw new Error('Invalid start time');
  const beatSeconds=60/tempo,barSeconds=4*beatSeconds;
  const bars=pattern.bars.map((chord,i)=>({
    ...chord,index:i,at:startSeconds+i*barSeconds,
    durationSeconds:barSeconds,holdSeconds:barSeconds*.88
  }));
  const ticks=click?bars.flatMap(bar=>Array.from({length:4},(_,i)=>({
    at:bar.at+i*beatSeconds,accent:i===0,barIndex:bar.index,beat:i+1
  }))):[];
  return {patternId:id,bpm:tempo,barSeconds,beatSeconds,bars,ticks,
    startSeconds,durationSeconds:bars.length*barSeconds,endSeconds:startSeconds+bars.length*barSeconds};
}
