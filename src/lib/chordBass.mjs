/** Present a user-supplied physical bass note without inventing chord identity. */
import {pitchClass,prettyNote} from './music.js';
const labels=Object.freeze(['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B']);
const ordinal=Object.freeze(['Root position','First inversion','Second inversion','Third inversion']);
export function describeChordBass(chord,rawBass){
  if(!chord||!Array.isArray(chord.notes))throw new Error('Chord note list required');
  if(rawBass===''||rawBass===null||rawBass===undefined)
    return {slashName:chord.symbol,description:'Bass not specified · inversion cannot be identified',kind:'unspecified',inversion:null};
  const bass=Number(rawBass);
  if(!Number.isInteger(bass)||bass<0||bass>11)throw new RangeError('Bass must be one of 12 pitch classes');
  const index=chord.notes.findIndex(note=>pitchClass(note)===bass);
  if(index>=0){
    const bassLabel=prettyNote(chord.notes[index]);
    const name=index===0?chord.symbol:chord.symbol+'/'+bassLabel;
    return {slashName:name,description:ordinal[index]+' · Lowest note '+bassLabel,
      kind:'inversion',inversion:index};
  }
  const bassLabel=labels[bass];
  return {slashName:chord.symbol+'/'+bassLabel,
    description:'Non-chord bass '+bassLabel+' · Slash chord with an added bass, not an inversion. Actual context matters.',
    kind:'external-bass',inversion:null};
}
