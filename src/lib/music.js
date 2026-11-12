/** Small dependency-free equal-tempered music-theory engine. Preserves letter spelling. */
const NATURAL = Object.freeze({ C:0,D:2,E:4,F:5,G:7,A:9,B:11 });
const LETTERS = Object.freeze(['C','D','E','F','G','A','B']);
const INTERVALS = Object.freeze({
  major: [0,4,7], minor:[0,3,7], diminished:[0,3,6], augmented:[0,4,8],
  dominant7:[0,4,7,10], major7:[0,4,7,11], minor7:[0,3,7,10],
});
const LABELS = Object.freeze({ major:'Major',minor:'Minor',diminished:'Diminished',augmented:'Augmented',dominant7:'Dominant seventh',major7:'Major seventh',minor7:'Minor seventh' });
const SYMBOL_SUFFIX = Object.freeze({major:'',minor:'m',diminished:'dim',augmented:'aug',dominant7:'7',major7:'maj7',minor7:'m7'});
const PREFERRED_ROOTS = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const SIGN = Object.freeze({ '#':'♯', 'b':'♭' });
export function mod(n,m){return ((n%m)+m)%m;}
export function parseNote(note){
  const m=/^([A-G])([#b]{0,2})$/.exec(note);
  if(!m || (m[2] && m[2][0]!==m[2].at(-1))) throw new Error(`Invalid spelled pitch: ${note}`);
  return { letter:m[1], accidental:m[2], pc:mod(NATURAL[m[1]]+[...m[2]].reduce((s,c)=>s+(c==='#'?1:-1),0),12) };
}
export function prettyNote(note){return note.replaceAll('#','♯').replaceAll('b','♭');}
export function prettySymbol(symbol){return symbol.replaceAll('#','♯').replaceAll('b','♭');}
export function pitchClass(note){return parseNote(note).pc;}
function intervalSpelling(root, degree, semitones){
  const r=parseNote(root), rootIndex=LETTERS.indexOf(r.letter), letter=LETTERS[(rootIndex+degree*2)%7], target=mod(r.pc+semitones,12);
  let diff=mod(target-NATURAL[letter],12);
  if(diff>6)diff-=12;
  if(![-2,-1,0,1,2].includes(diff))throw new Error(`Unsupported spelling for ${root} degree ${degree}`);
  return letter+(diff<0?'b'.repeat(-diff):'#'.repeat(diff));
}
export function chordNotes(root,quality){
  const ints=INTERVALS[quality];
  if(!ints)throw new Error(`Unknown chord quality ${quality}`);
  parseNote(root);
  return ints.map((value,i)=>intervalSpelling(root,i,value));
}
export function rootMidi(root){
  const {letter,accidental}=parseNote(root);
  const base=60+NATURAL[letter];
  return base+[...accidental].reduce((s,c)=>s+(c==='#'?1:-1),0);
}
export function midiVoicing(root,quality,inversion=0){
  const notes=chordNotes(root,quality), max=notes.length;
  if(!Number.isInteger(inversion)||inversion<0||inversion>=max)throw new Error('Invalid inversion');
  const pcs=notes.map(pitchClass), rootStart=rootMidi(root);
  const mids=[rootStart];
  for(let i=1;i<pcs.length;i++){
    let p=60+pcs[i]; while(p<=mids.at(-1))p+=12; mids.push(p);
  }
  for(let i=0;i<inversion;i++)mids.push(mids.shift()+12);
  const reordered=[...notes.slice(inversion),...notes.slice(0,inversion)];
  return {notes:reordered,midi:mids,pcs:reordered.map(pitchClass),bass:reordered[0],inversion};
}
export function createChord({slug,root,quality,symbol,name,keyword}={}){
  const notes=chordNotes(root,quality), pcs=notes.map(pitchClass);
  return {slug,root,quality,symbol:symbol||root+SYMBOL_SUFFIX[quality],name:name||`${prettyNote(root)} ${LABELS[quality]}`,keyword,notes,pcs,intervals:[...INTERVALS[quality]],qualityName:LABELS[quality],inversions:notes.map((_,i)=>midiVoicing(root,quality,i))};
}
export function allFindableChords(){
  return PREFERRED_ROOTS.flatMap(root=>['major','minor','diminished','augmented','dominant7','major7','minor7'].map(quality=>createChord({root,quality})));
}
export function findChordMatches(input){
  const selected=[...new Set(input.map(n=>typeof n==='number'?mod(n,12):pitchClass(n)))].sort((a,b)=>a-b);
  if(selected.length<3 || selected.length>4)return [];
  return allFindableChords().filter(chord=>selected.length===chord.pcs.length&&chord.pcs.every(pc=>selected.includes(pc)));
}
export const CHROMATIC=[
  {label:'C',pc:0},{label:'C♯ / D♭',pc:1},{label:'D',pc:2},{label:'D♯ / E♭',pc:3},
  {label:'E',pc:4},{label:'F',pc:5},{label:'F♯ / G♭',pc:6},{label:'G',pc:7},
  {label:'G♯ / A♭',pc:8},{label:'A',pc:9},{label:'A♯ / B♭',pc:10},{label:'B',pc:11},
];
