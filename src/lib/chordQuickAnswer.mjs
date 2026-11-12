/** Human-readable answers computed from the tested note-spelling engine. */
import {prettyNote,prettySymbol} from './music.js';
const qualities=Object.freeze({
  major:{kind:'major triad',formula:'root, major third and perfect fifth'},
  minor:{kind:'minor triad',formula:'root, minor third and perfect fifth'},
  dominant7:{kind:'dominant seventh',formula:'root, major third, perfect fifth and minor seventh'},
  major7:{kind:'major seventh',formula:'root, major third, perfect fifth and major seventh'},
  minor7:{kind:'minor seventh',formula:'root, minor third, perfect fifth and minor seventh'}
});
const positions=['root position','first inversion','second inversion','third inversion'];
const englishList=items=>items.length===1?items[0]:items.slice(0,-1).join(', ')+' and '+items.at(-1);
export function chordQuickAnswer(chord){
  if(!chord||!Array.isArray(chord.notes)||!Array.isArray(chord.inversions)||!qualities[chord.quality])
    throw new Error('A complete supported chord is required');
  const notes=chord.notes.map(prettyNote),symbol=prettySymbol(chord.symbol),kind=qualities[chord.quality];
  const definition=chord.name+' ('+symbol+') is a '+kind.kind+' containing '+englishList(notes)+'. Its interval formula is '+kind.formula+'.';
  const inversions=chord.inversions.map((v,i)=>positions[i]+' ('+v.notes.map(prettyNote).join('–')+')');
  return {
    question:'What notes are in the '+chord.name+' piano chord?',
    definition,
    inversionQuestion:'What are the inversions of '+symbol+'?',
    inversionAnswer:symbol+' has '+chord.inversions.length+' positions: '+englishList(inversions)+'. Each inversion contains the same chord tones but puts a different note in the bass.',
    notes,symbol,type:kind.kind
  };
}
