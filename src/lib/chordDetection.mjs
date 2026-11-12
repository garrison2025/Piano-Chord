/** Name chords from the physical keys held; no microphone, networking, or upload. */
import {findChordMatches,mod,prettyNote,prettySymbol} from './music.js';
export function describeHeldChord(midis){
  const valid=Array.isArray(midis)?midis.filter(m=>Number.isInteger(m)&&m>=21&&m<=108):[];
  const pcs=new Set(valid.map(m=>mod(m,12)));
  if(pcs.size<3)return {kind:'idle',title:pcs.size?'Keep adding notes':'Play a chord',
    detail:'Hold three notes for a triad, or four different pitch classes for a seventh chord.'};
  const matches=findChordMatches(valid);
  if(!matches.length)return {kind:'unknown',title:'No basic chord match',
    detail:'Try a major, minor, dominant 7, major 7 or minor 7 voicing.'};
  const primary=matches[0];
  return {kind:pcs.size===4?'seventh':'triad',title:prettySymbol(primary.symbol),
    detail:primary.notes.map(prettyNote).join(' · ')+(matches.length>1
      ?' · Also: '+matches.slice(1,3).map(x=>prettySymbol(x.symbol)).join(', '):''),
    matches:matches.map(x=>({symbol:x.symbol,root:x.root,quality:x.quality}))};
}
