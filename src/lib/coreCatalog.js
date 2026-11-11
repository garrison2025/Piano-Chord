import {parseNote,mod,prettyNote} from './music.js';
const letters=['C','D','E','F','G','A','B'];
const natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
export const roots=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
export const qualities=[
{id:'major',name:'Major',s:'',steps:[0,2,4],ints:[0,4,7]},
{id:'minor',name:'Minor',s:'m',steps:[0,2,4],ints:[0,3,7]},
{id:'dim',name:'Diminished',s:'dim',steps:[0,2,4],ints:[0,3,6]},
{id:'aug',name:'Augmented',s:'aug',steps:[0,2,4],ints:[0,4,8]},
{id:'sus2',name:'Suspended 2nd',s:'sus2',steps:[0,1,4],ints:[0,2,7]},
{id:'sus4',name:'Suspended 4th',s:'sus4',steps:[0,3,4],ints:[0,5,7]},
{id:'7',name:'Dominant 7th',s:'7',steps:[0,2,4,6],ints:[0,4,7,10]},
{id:'maj7',name:'Major 7th',s:'maj7',steps:[0,2,4,6],ints:[0,4,7,11]},
{id:'m7',name:'Minor 7th',s:'m7',steps:[0,2,4,6],ints:[0,3,7,10]},
{id:'m7b5',name:'Half-diminished 7th',s:'m7b5',steps:[0,2,4,6],ints:[0,3,6,10]}
];
function spell(root,step,semi){const r=parseNote(root);const l=letters[(letters.indexOf(r.letter)+step)%7];let d=mod(r.pc+semi-natural[l],12);if(d>6)d-=12;if(Math.abs(d)>2)throw Error('Unsupported spelling');return l+(d<0?'b'.repeat(-d):'#'.repeat(d));}
export const coreChords=roots.flatMap(root=>qualities.map(q=>({root,quality:q.id,symbol:prettyNote(root)+q.s,name:prettyNote(root)+' '+q.name,notes:q.steps.map((v,i)=>spell(root,v,q.ints[i])),midi:q.ints.map(i=>60+parseNote(root).pc+i)})));
