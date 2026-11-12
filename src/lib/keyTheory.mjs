import {parseNote,mod,pitchClass,chordNotes,prettyNote} from './music.js';

const NATURAL={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const LETTERS=['C','D','E','F','G','A','B'];
export const KEY_ROOTS=Object.freeze({
  major:['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'],
  minor:['C','C#','D','Eb','E','F','F#','G','G#','A','Bb','B']
});
export const KEY_INTERVALS=Object.freeze({
  major:[0,2,4,5,7,9,11],
  minor:[0,2,3,5,7,8,10]
});
const ROMAN={
  major:['I','ii','iii','IV','V','vi','vii°'],
  minor:['i','ii°','III','iv','v','VI','VII']
};
const DEGREE_NAMES=['Tonic','Supertonic','Mediant','Subdominant','Dominant','Submediant','Leading/subtonic'];
function spell(root,index,semitones){
  const parsed=parseNote(root);
  const letter=LETTERS[(LETTERS.indexOf(parsed.letter)+index)%7];
  let delta=mod(parsed.pc+semitones-NATURAL[letter],12);
  if(delta>6)delta-=12;
  if(Math.abs(delta)>2)throw new Error('Unsupported key spelling');
  return letter+(delta<0?'b'.repeat(-delta):'#'.repeat(delta));
}
export function keyInfo(root='C',mode='major'){
  if(!KEY_ROOTS[mode]?.includes(root))throw new Error('Unsupported key: '+root+' '+mode);
  const steps=KEY_INTERVALS[mode];
  const notes=steps.map((semi,i)=>spell(root,i,semi));
  const chords=notes.map((note,i)=>{
    const third=notes[(i+2)%7],fifth=notes[(i+4)%7];
    const thirdSemi=mod(pitchClass(third)-pitchClass(note),12);
    const fifthSemi=mod(pitchClass(fifth)-pitchClass(note),12);
    let quality;
    if(thirdSemi===4&&fifthSemi===7)quality='major';
    else if(thirdSemi===3&&fifthSemi===7)quality='minor';
    else if(thirdSemi===3&&fifthSemi===6)quality='diminished';
    else throw new Error('Unsupported diatonic triad for '+root+' '+mode+' degree '+i);
    const named=chordNotes(note,quality);
    if([note,third,fifth].join('|')!==named.join('|'))throw new Error('Diatonic triad spelling mismatch');
    return {degree:i,roman:ROMAN[mode][i],root:note,quality,
      symbol:prettyNote(note)+(quality==='minor'?'m':quality==='diminished'?'dim':''),
      notes:named};
  });
  return {root,mode,name:prettyNote(root)+' '+(mode==='major'?'major':'natural minor'),
    intervals:steps,notes,chords,relative:prettyNote(notes[mode==='major'?5:2])+
      (mode==='major'?' minor':' major'),degreeNames:DEGREE_NAMES};
}
export const PROGRESSION_PRESETS=Object.freeze({
  major:[
    {id:'pop',label:'Pop favorite · I–V–vi–IV',degrees:[0,4,5,3]},
    {id:'classic',label:'Classic · I–vi–IV–V',degrees:[0,5,3,4]},
    {id:'jazz',label:'Jazz turnaround · ii–V–I–I',degrees:[1,4,0,0]},
    {id:'rock',label:'Rock · I–IV–V–I',degrees:[0,3,4,0]}
  ],
  minor:[
    {id:'cinematic',label:'Cinematic · i–VI–III–VII',degrees:[0,5,2,6]},
    {id:'cadence',label:'Harmonic minor · i–iv–V–i',degrees:[0,3,4,0],overrides:{2:'major'}},
    {id:'folk',label:'Folk · i–VII–VI–VII',degrees:[0,6,5,6]},
    {id:'natural',label:'Natural minor · i–iv–v–i',degrees:[0,3,4,0]}
  ]
});
export function chordMidis(notes){
  if(!Array.isArray(notes)||!notes.length)return [];
  const first=48+pitchClass(notes[0]);
  const midis=[first];
  for(const n of notes.slice(1)){
    let midi=48+pitchClass(n);
    while(midi<=midis.at(-1))midi+=12;
    midis.push(midi);
  }
  return midis;
}
export function progression(root='C',mode='major',presetId){
  const key=keyInfo(root,mode);
  const preset=(PROGRESSION_PRESETS[mode]||[]).find(p=>p.id===presetId)||PROGRESSION_PRESETS[mode][0];
  return {key,preset,steps:preset.degrees.map((degree,index)=>progressionStep(key,degree,preset.overrides?.[index]))};
}
export function progressionStep(key,degree,override){
  if(!Number.isInteger(degree)||degree<0||degree>6)throw new Error('Invalid progression degree');
  const entry=key.chords[degree];
  const quality=override||entry.quality;
  if(!['major','minor','diminished'].includes(quality))throw new Error('Invalid quality');
  const notes=chordNotes(entry.root,quality);
  return {degree,quality,roman:quality===entry.quality?entry.roman:(quality==='major'?['I','II','III','IV','V','VI','VII'][degree]:entry.roman),
    root:entry.root,symbol:prettyNote(entry.root)+(quality==='minor'?'m':quality==='diminished'?'dim':''),
    notes,midi:chordMidis(notes),altered:quality!==entry.quality};
}
