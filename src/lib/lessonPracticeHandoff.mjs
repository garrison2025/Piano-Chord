/**
 * Route an authored lesson to a progression that actually includes its chord.
 * Triads are the tonic (bar 1) of a valid existing 4-bar progression.
 * Seventh lessons use the existing four-note practice patterns; C7 has a
 * separate authentic dominant-to-tonic resolution example in F major.
 *
 * Query parameters change player state, never create a new indexable URL.
 */
import {KEY_ROOTS,progression} from './keyTheory.mjs';
import {seventhPattern} from './seventhPractice.mjs';

const SEVENTH_ROUTE=Object.freeze({
  'c-7':{kind:'resolution',href:'/guides/seventh-chords-piano/#c7-resolution',
    label:'Hear C7 resolve to F',description:'Two-chord dominant-to-tonic cadence with the complete four-note C7.'},
  'c-major-7':{kind:'seventh',pattern:'ii-v-i'},
  'a-minor-7':{kind:'seventh',pattern:'turnaround'},
  'd-minor-7':{kind:'seventh',pattern:'ii-v-i'},
  'g-7':{kind:'seventh',pattern:'ii-v-i'}
});

export function lessonPracticeHandoff(entry){
  if(!entry?.slug||!entry.root||!entry.quality)throw new Error('Missing chord lesson entry');
  const seven=SEVENTH_ROUTE[entry.slug];
  if(seven){
    if(seven.kind==='resolution')return seven;
    const seq=seventhPattern(seven.pattern);
    if(!seq.bars.some(x=>x.slug===entry.slug))
      throw new Error('Linked seventh progression omits '+entry.slug);
    return {kind:'seventh',pattern:seven.pattern,
      href:'/guides/seventh-chords-piano/?pattern='+encodeURIComponent(seven.pattern)+'#cadence',
      label:'Practice '+entry.symbol+' in a seventh-chord sequence',
      description:'The selected pattern includes the full four-note '+entry.symbol+' chord.'};
  }
  const mode=entry.quality;
  if(!['major','minor'].includes(mode)||!KEY_ROOTS[mode].includes(entry.root))
    throw new Error('Unsupported tonic handoff for '+entry.slug);
  const preset=mode==='major'?'rock':'cadence';
  const seq=progression(entry.root,mode,preset);
  const first=seq.steps[0];
  if(first.root!==entry.root||first.quality!==mode)
    throw new Error('First bar is not the requested tonic chord');
  return {kind:'triad',root:entry.root,mode,preset,
    href:'/tools/chord-progressions/?root='+encodeURIComponent(entry.root)+
      '&mode='+mode+'&preset='+preset+'#progression-builder',
    label:'Practice '+entry.symbol+' in a four-bar progression',
    description:'Opens a '+seq.key.name+' progression with '+entry.symbol+' as the first bar.'};
}
