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
/** A complete chord symbol (such as F#m, F#m7 or C#maj7) is exact.
 * Root-only searches and family terms (such as F# or sus4) remain fuzzy. */
function explicitChordSymbol(value){
  const match=/^([a-g](?:#|b)?)([a-z0-9]+)$/.exec(normalizeChordSearch(value));
  if(!match)return null;
  const quality=qualities.find(q=>q.s && normalizeChordSearch(q.s)===match[2]);
  return quality?{root:match[1],quality:quality.id}:null;
}
/** A fully qualified "F# minor" means the triad, not F#m7. */
export function explicitTriadQuality(value){
  return /^[a-g](?:#|b)? (major|minor)$/.exec(normalizeChordSearch(value))?.[1]||null;
}
export function chordMatchesSearch(chord,value){
  const query=normalizeChordSearch(value),fields=chordSearchFields(chord);
  const exact=explicitChordSymbol(query);
  if(exact){
    const canonicalRoot=normalizeChordSearch(chord.root);
    const aliasRoot=aliases[chord.root] && normalizeChordSearch(aliases[chord.root]);
    const matches=chord.quality===exact.quality &&
      (exact.root===canonicalRoot || exact.root===aliasRoot);
    return {matches,aliasOnly:matches&&exact.root!==canonicalRoot,
      equivalentLabel:fields.equivalentLabel};
  }
  const direct=fields.canonical.includes(query),viaAlias=!!query&&fields.alias.includes(query);
  const precise=explicitTriadQuality(query);
  const qualityAllowed=!precise||chord.quality===precise;
  return {matches:qualityAllowed&&(!query||direct||viaAlias),aliasOnly:qualityAllowed&&!direct&&viaAlias,
    equivalentLabel:fields.equivalentLabel};
}
