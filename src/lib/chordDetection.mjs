/** Name chords from the physical keys held; no microphone, networking, or upload. */
import {findChordMatches,mod,prettyNote,prettySymbol} from './music.js';
import {findCoreChordMatches,coreChordByKey} from './chordAtlas.mjs';
import {describeChordBass} from './chordBass.mjs';
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
  const qualityKey={dominant7:'7',major7:'maj7',minor7:'m7',diminished:'dim',augmented:'aug'};
  const reference=coreChordByKey.get(primary.root+':'+(qualityKey[primary.quality]||primary.quality));
  // The physical lowest MIDI note determines the slash bass. Pitch-class
  // inversion is not inferred from key-press order, nor from note spellings.
  const voicing=reference?describeChordBass(reference,String(mod(Math.min(...valid),12))):null;
  const displayed=prettySymbol(voicing?.slashName||primary.symbol);
  const inversionNote=voicing&&voicing.inversion>0
    ?' · '+voicing.description:'';
  return {kind:pcs.size===4?'seventh':'triad',title:displayed,
    detail:primary.notes.map(prettyNote).join(' · ')+inversionNote+(matches.length>1
      ?' · Also: '+matches.slice(1,3).map(x=>prettySymbol(x.symbol)).join(', '):''),
    bass:voicing?.inversion??null,
    matches:matches.map(x=>({symbol:x.symbol,root:x.root,quality:x.quality}))};
}
