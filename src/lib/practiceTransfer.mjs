/** Strictly validated, URL-only progression handoff. No account or server. */
import {KEY_ROOTS,keyInfo,progressionStep} from './keyTheory.mjs';
import {pitchClass,mod} from './music.js';
export const PRACTICE_MIN_BPM=50, PRACTICE_MAX_BPM=180;
function validate({root,mode,bpm,steps}){
  if(!KEY_ROOTS[mode]?.includes(root))throw Error('Unsupported practice key');
  if(!Number.isInteger(bpm)||bpm<PRACTICE_MIN_BPM||bpm>PRACTICE_MAX_BPM)throw Error('Invalid BPM');
  if(!Array.isArray(steps)||steps.length!==4)throw Error('Requires four bars');
  const key=keyInfo(root,mode);
  const result=steps.map(step=>{
    const degree=step.degree,quality=step.quality;
    if(!Number.isInteger(degree)||degree<0||degree>6)throw Error('Invalid degree');
    const regular=key.chords[degree].quality;
    if(quality!==regular && !(mode==='minor'&&degree===4&&quality==='major'))throw Error('Unsupported alteration');
    return progressionStep(key,degree,quality);
  });
  return {root,mode,bpm,key,steps:result};
}
export function serializePractice(input){
  const p=validate(input);
  const q=new URLSearchParams();
  q.set('practice','1');q.set('root',p.root);q.set('mode',p.mode);q.set('bpm',String(p.bpm));
  q.set('steps',p.steps.map(s=>s.degree+':'+s.quality).join(','));
  return q.toString();
}
export function parsePractice(query){
  try{
    if(typeof query!=='string'||query.length>360)return null;
    const p=new URLSearchParams(query.startsWith('?')?query.slice(1):query);
    const allowed=['practice','root','mode','bpm','steps'];
    if(p.get('practice')!=='1'||[...p.keys()].some(k=>!allowed.includes(k)))return null;
    if(allowed.some(k=>p.getAll(k).length!==1))return null;
    const tempo=p.get('bpm');
    if(!/^[1-9][0-9]{1,2}$/.test(tempo||''))return null;
    const raw=(p.get('steps')||'').split(',');
    if(raw.length!==4||raw.some(s=>!/^[0-6]:(major|minor|diminished)$/.test(s)))return null;
    return validate({root:p.get('root'),mode:p.get('mode'),bpm:Number(tempo),
      steps:raw.map(s=>{const [d,q]=s.split(':');return {degree:Number(d),quality:q};})});
  }catch{return null;}
}
/** Compact C4-range keys for visual hints. Any octave is acceptable for matching. */
export function practiceHintMidis(step){
  return [...new Set(step.notes.map(n=>60+pitchClass(n)))].sort((a,b)=>a-b);
}
export function matchesPracticeNotes(played,step){
  if(!step||!Array.isArray(played))return false;
  const target=new Set(step.notes.map(pitchClass));
  const current=new Set(played.filter(n=>Number.isInteger(n)&&n>=21&&n<=108).map(n=>mod(n,12)));
  return current.size===target.size && [...target].every(n=>current.has(n));
}
