/** Search aliases are for discovery only: actual chord spellings stay canonical. */
import {qualities} from './coreCatalog.js';
const aliases=Object.freeze({Db:'C#',Eb:'D#',Gb:'F#',Ab:'G#',Bb:'A#'});
export function normalizeChordSearch(value){
  return String(value??'').toLowerCase().replaceAll('♯','#').replaceAll('♭','b')
    .trim().replace(/\s+/g,' ');
}
export function chordSearchFields(chord){
  const canonical=normalizeChordSearch([chord.name,chord.symbol,chord.root,...chord.notes].join(' '));
  const root=aliases[chord.root];
  const quality=qualities.find(q=>q.id===chord.quality);
  if(!quality)throw new Error('Unexpected chord quality');
  const alias=root?normalizeChordSearch([root+quality.s,root+' '+quality.name,root+' '+quality.s,root].join(' ')):'';
  return {canonical,alias,equivalentLabel:root?root.replaceAll('#','♯')+quality.s:''};
}
export function chordMatchesSearch(chord,value){
  const query=normalizeChordSearch(value),fields=chordSearchFields(chord);
  const direct=fields.canonical.includes(query),viaAlias=!!query&&fields.alias.includes(query);
  return {matches:!query||direct||viaAlias,aliasOnly:!direct&&viaAlias,
    equivalentLabel:fields.equivalentLabel};
}
