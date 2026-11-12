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
/** A fully qualified "F# minor" means the triad, not F#m7. */
export function explicitTriadQuality(value){
  return /^[a-g](?:#|b)? (major|minor)$/.exec(normalizeChordSearch(value))?.[1]||null;
}
export function chordMatchesSearch(chord,value){
  const query=normalizeChordSearch(value),fields=chordSearchFields(chord);
  const direct=fields.canonical.includes(query),viaAlias=!!query&&fields.alias.includes(query);
  const precise=explicitTriadQuality(query);
  const qualityAllowed=!precise||chord.quality===precise;
  return {matches:qualityAllowed&&(!query||direct||viaAlias),aliasOnly:qualityAllowed&&!direct&&viaAlias,
    equivalentLabel:fields.equivalentLabel};
}
