/** Shared 120-chord exploration layer. No auto-generated SEO pages. */
import {coreChords,qualities,roots} from './coreCatalog.js';
import {pitchClass} from './music.js';

export function coreChordKey(chord) {
  return chord.root+':'+chord.quality;
}
export const coreChordByKey=new Map(coreChords.map(chord=>[coreChordKey(chord),chord]));
export function coreChordVoicing(chord,inversion=0){
  if(!chord||!coreChordByKey.has(coreChordKey(chord)))throw new Error('Unknown core chord');
  const count=chord.notes.length;
  if(!Number.isInteger(inversion)||inversion<0||inversion>=count)throw new RangeError('Invalid chord inversion');
  const midi=[...chord.midi];
  for(let i=0;i<inversion;i++)midi.push(midi.shift()+12);
  const notes=[...chord.notes.slice(inversion),...chord.notes.slice(0,inversion)];
  return {inversion,midi,notes,bass:notes[0],pcs:notes.map(pitchClass)};
}
/** A safe shape compatible with PianoKeyboard, without modifying authored lessons. */
export function coreChordKeyboard(chord){
  if(!chord||!coreChordByKey.has(coreChordKey(chord)))throw new Error('Unknown core chord');
  return {...chord,slug:'core-'+roots.indexOf(chord.root)+'-'+qualities.findIndex(q=>q.id===chord.quality),
    inversions:chord.notes.map((_,i)=>coreChordVoicing(chord,i))};
}
/** Exact pitch-class matches for all 10 chord families; voicing and context may be ambiguous. */
export function findCoreChordMatches(input){
  if(!Array.isArray(input))return [];
  const pcs=[...new Set(input.map(v=>typeof v==='number'?((v%12)+12)%12:pitchClass(v)))];
  if(pcs.length<3||pcs.length>4)return [];
  return coreChords.filter(chord=>chord.notes.length===pcs.length &&
    chord.notes.every(note=>pcs.includes(pitchClass(note))));
}
