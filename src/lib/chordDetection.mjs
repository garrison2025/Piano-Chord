/** Name chords from the physical keys held; no microphone, networking, or upload. */
import {findChordMatches,mod,prettyNote,prettySymbol} from './music.js';
import {findCoreChordMatches} from './chordAtlas.mjs';
export function describeHeldChord(midis){
  const valid=Array.isArray(midis)?midis.filter(m=>Number.isInteger(m)&&m>=21&&m<=108):[];
  const pcs=new Set(valid.map(m=>mod(m,12)));
  if(pcs.size<3)return {kind:'idle',title:pcs.size?'Keep adding notes':'Play a chord',
    detail:'Hold three notes for a triad, or four different pitch classes for a seventh chord.'};
  // Preserve existing tertian spellings; use the unified 120-chord atlas for suspended and half-diminished forms.
  const matches=findChordMatches(valid);
  if(!matches.length)matches.push(...findCoreChordMatches(valid));
  if(!matches.length)return {kind:'unknown',title:'No basic chord match',
    detail:'Try one of the ten supported chord families: major, minor, diminished, augmented, sus2, sus4 or common sevenths.'};
  const primary=matches[0];
  return {kind:pcs.size===4?'seventh':'triad',title:prettySymbol(primary.symbol),
    detail:primary.notes.map(prettyNote).join(' · ')+(matches.length>1
      ?' · Also: '+matches.slice(1,3).map(x=>prettySymbol(x.symbol)).join(', '):''),
    matches:matches.map(x=>({symbol:x.symbol,root:x.root,quality:x.quality}))};
}
