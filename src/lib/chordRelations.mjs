import {releaseChords} from '../data/chords.js';
import {createChord,pitchClass} from './music.js';
/** Rank pedagogically relevant chords using real common tones and parallel-major/minor contrast. */
export function relatedLessons(entry,limit=3){
  const current=createChord(entry);
  return releaseChords.filter(other=>other.slug!==entry.slug).map(other=>{
    const chord=createChord(other);
    const overlap=chord.pcs.filter(pc=>current.pcs.includes(pc)).length;
    const parallel=other.root===entry.root && other.quality!==entry.quality;
    const alternateRoot=other.root!==entry.root && pitchClass(other.root)===pitchClass(entry.root);
    // Prefer shared voices. Exact spelled-root comparison is helpful; avoid
    // promoting enharmonic names over familiar relative-major/minor partners.
    const score=overlap*20+(parallel?25:0)+(other.quality!==entry.quality?2:0)-(alternateRoot?12:0);
    return {entry:other,score,overlap};
  }).sort((a,b)=>b.score-a.score||b.overlap-a.overlap||a.entry.name.localeCompare(b.entry.name))
    .slice(0,limit).map(v=>v.entry);
}
