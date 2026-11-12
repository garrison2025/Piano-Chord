/** Allowlisted seventh-chord practice handoff. No user content or server state. */
import {seventhPattern,seventhTempo} from './seventhPractice.mjs';
const ROMANS=Object.freeze({'ii-v-i':['ii7','V7','Imaj7'],'turnaround':['Imaj7','vi7','ii7','V7']});
export function serializeSeventhTransfer({patternId,bpm}){
  const pattern=seventhPattern(patternId),tempo=seventhTempo(bpm),q=new URLSearchParams();
  q.set('practice','7');q.set('pattern',pattern.id);q.set('bpm',String(tempo));return q.toString();
}
export function parseSeventhTransfer(query){
  try{
    if(typeof query!=='string'||query.length>120)return null;
    const p=new URLSearchParams(query.startsWith('?')?query.slice(1):query);
    const allowed=['practice','pattern','bpm'];
    if([...p.keys()].length!==3||[...p.keys()].some(k=>!allowed.includes(k))||
      allowed.some(k=>p.getAll(k).length!==1)||p.get('practice')!=='7')return null;
    const raw=p.get('bpm');if(!/^[1-9][0-9]{1,2}$/.test(raw||''))return null;
    const bpm=seventhTempo(Number(raw)),pattern=seventhPattern(p.get('pattern'));
    return {kind:'seventh',patternId:pattern.id,label:pattern.label,bpm,
      steps:pattern.bars.map((bar,i)=>({...bar,roman:ROMANS[pattern.id][i]}))};
  }catch{return null;}
}
export function seventhHintMidis(step){
  if(!step||!Array.isArray(step.midi)||step.midi.length!==4||
    step.midi.some(m=>!Number.isInteger(m)||m<21||m>108))throw Error('Invalid seventh voicing');
  return [...step.midi];
}
