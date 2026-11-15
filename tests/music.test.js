import test from 'node:test';
import assert from 'node:assert/strict';
import {chordNotes,midiVoicing,createChord,findChordMatches,prettyNote,parseNote,allFindableChords} from '../src/lib/music.js';
import {releaseChords} from '../src/data/chords.js';
import {chordLessons} from '../src/data/editorials.js';
import {keyboardSvg} from '../src/lib/pianoSvg.js';
const CASES=[
 ['C','major',['C','E','G']],['B','minor',['B','D','F#']],['C','dominant7',['C','E','G','Bb']],
 ['C','major7',['C','E','G','B']],['C','minor7',['C','Eb','G','Bb']],['A','major7',['A','C#','E','G#']],
 ['D#','minor7',['D#','F#','A#','C#']],['C#','major',['C#','E#','G#']],
 ['G#','major7',['G#','B#','D#','F##']],['Eb','major',['Eb','G','Bb']],
 ['Bb','major',['Bb','D','F']],['D','minor',['D','F','A']],
 ['F','minor',['F','Ab','C']],['E','major',['E','G#','B']],
];
for(const [root,type,expected] of CASES)test(`${root} ${type} spelled notes`,()=>assert.deepEqual(chordNotes(root,type),expected));
test('root positions and inversions preserve ascending MIDI notes',()=>{
  for(const chord of allFindableChords())for(let inv=0;inv<chord.notes.length;inv++){
    const v=midiVoicing(chord.root,chord.quality,inv);
    assert.deepEqual([...v.midi].sort((a,b)=>a-b),v.midi);
    assert.equal(v.bass,v.notes[0]);
    assert.deepEqual(new Set(v.pcs),new Set(chord.pcs));
  }
});
test('Bm/D first inversion has D bass',()=>assert.deepEqual(midiVoicing('B','minor',1).notes,['D','F#','B']));
test('C7/Bb third inversion has Bb bass',()=>assert.deepEqual(midiVoicing('C','dominant7',3).notes,['Bb','C','E','G']));
test('no substitution between dominant seventh and major seventh',()=>assert.notDeepEqual(chordNotes('C','dominant7'),chordNotes('C','major7')));
test('pitch spelling and accidentals strict',()=>{assert.equal(prettyNote('F##'),'F♯♯');assert.throws(()=>parseNote('C#b'));});
test('finder recognizes C minor and C major separately',()=>{
  assert(findChordMatches([0,3,7]).some(v=>v.root==='C'&&v.quality==='minor'));
  assert(!findChordMatches([0,3,7]).some(v=>v.root==='C'&&v.quality==='major'));
});
test('29 authored chord lessons without duplicate canonical slugs',()=>{
  assert.equal(releaseChords.length,29);
  assert.equal(releaseChords.filter(c=>c.quality==='major').length,12);
  assert.equal(releaseChords.filter(c=>c.quality==='minor').length,12);
  assert.equal(releaseChords.filter(c=>c.quality==='dominant7').length,2);
  assert.equal(releaseChords.filter(c=>c.quality==='major7').length,1);
  assert.equal(releaseChords.filter(c=>c.quality==='minor7').length,2);
  assert.equal(new Set(releaseChords.map(c=>c.slug)).size,29);
  assert(releaseChords.every(c=>chordNotes(c.root,c.quality).length>=3));
});
test('keyboard SVG includes original image and accessible labels',()=>{
  const svg=keyboardSvg(createChord(releaseChords[0]));
  assert.match(svg,/viewBox="0 0 692 195"/); assert.match(svg,/Highlighted piano keys/);
  assert.equal((svg.match(/<rect x=/g)||[]).length,36);
});

test('all 92 static lesson diagrams distinguish their inversion and bass-note voicings',()=>{
 let images=0;
 for(const entry of releaseChords){
   const chord=createChord(entry);
   for(const [i,voicing] of chord.inversions.entries()){
     const svg=keyboardSvg(chord,{inversion:i});
     assert.ok(svg.includes('Highlighted piano keys: '+voicing.notes.map(prettyNote).join(' · ')+'.'),
       entry.slug+' inversion '+i+' theory spelling');
     assert.ok(svg.includes('ttl-'+entry.slug+'-'+i),entry.slug+' inversion '+i+' accessible title');
     assert.equal((svg.match(/<rect x=/g)||[]).length,36,entry.slug+' key count');
     assert.deepEqual(voicing.midi,[...voicing.midi].sort((a,b)=>a-b),
       entry.slug+' inversion '+i+' must ascend from '+voicing.bass);
     if(i>0)assert.match(svg,new RegExp('inversion '+i));
     images++;
   }
 }
 assert.equal(images,92);
});

test('all 29 SEO chord lessons contain distinct authored exercises',()=>{
 const lessons=releaseChords.map(x=>chordLessons[x.slug]);
 assert(lessons.every(x=>x && x.character.length>60 && x.comparison.length>70 && x.exercise.length>70 && x.pitfall.length>50));
 assert.equal(new Set(lessons.map(x=>x.exercise)).size,29);
});

import {coreChords,roots,qualities} from '../src/lib/coreCatalog.js';
test('120-core-chord atlas has ten types in each of twelve roots',()=>{assert.equal(coreChords.length,120);assert.equal(roots.length,12);assert.equal(qualities.length,10);assert.equal(new Set(coreChords.map(c=>c.root+':'+c.quality)).size,120);});
test('new chord atlas preserves theoretical spellings',()=>{const lookup=(r,q)=>coreChords.find(x=>x.root===r&&x.quality===q).notes;assert.deepEqual(lookup('C','sus2'),['C','D','G']);assert.deepEqual(lookup('C','m7b5'),['C','Eb','Gb','Bb']);assert.deepEqual(lookup('Gb','maj7'),['Gb','Bb','Db','F']);});

// The nine new lesson roots are deliberately sharp/flat-spelled for learner clarity.
test('new major/minor lessons have correct note names',()=>{
 const expected={"d-flat-major":["Db","F","Ab"],"g-flat-major":["Gb","Bb","Db"],"a-flat-major":["Ab","C","Eb"],"a-major":["A","C#","E"],"c-sharp-minor":["C#","E","G#"],"e-flat-minor":["Eb","Gb","Bb"],"f-sharp-minor":["F#","A","C#"],"g-sharp-minor":["G#","B","D#"],"b-flat-minor":["Bb","Db","F"]};
 for(const [slug,spelling] of Object.entries(expected)){
  const entry=releaseChords.find(c=>c.slug===slug);
  assert.ok(entry,'Missing '+slug);
  assert.deepEqual(chordNotes(entry.root,entry.quality),spelling,slug);
 }
});

import {relatedLessons} from '../src/lib/chordRelations.mjs';
test('related chord lessons prefer shared tones and meaningful contrast',()=>{
  const find=slug=>releaseChords.find(e=>e.slug===slug);
  const fsharp=relatedLessons(find('f-sharp-minor')).map(e=>e.slug);
  assert.ok(fsharp.includes('a-major'),'Relative A major should be recommended for F# minor');
  assert.ok(fsharp.includes('d-major'),'D major shares F# and A with F# minor');
  const dflat=relatedLessons(find('d-flat-major')).map(e=>e.slug);
  assert.ok(dflat.includes('b-flat-minor'),'Relative B-flat minor should be recommended for D-flat major');
  for(const entry of releaseChords){
    const matches=relatedLessons(entry);
    assert.equal(matches.length,3);
    assert.equal(new Set(matches.map(e=>e.slug)).size,3);
    assert.ok(matches.every(e=>e.slug!==entry.slug));
  }
});

test('selected seventh chords have distinct four-note spelling and four voicings',()=>{
 const expected={
  'c-7':['C','E','G','Bb'],'c-major-7':['C','E','G','B'],
  'a-minor-7':['A','C','E','G'],'d-minor-7':['D','F','A','C'],
  'g-7':['G','B','D','F']
 };
 for(const [slug,notes] of Object.entries(expected)){
  const entry=releaseChords.find(e=>e.slug===slug);
  assert.ok(entry,'Missing '+slug);
  const chord=createChord(entry);
  assert.deepEqual(chord.notes,notes,slug);
  assert.equal(chord.inversions.length,4);
  assert.ok(chord.inversions.every((v,i)=>v.notes[0]===notes[i]),'Inversion should have correct bass: '+slug);
  assert.equal(chordLessons[slug].pitfall.length>60,true);
 }
 assert.notDeepEqual(chordNotes('C','dominant7'),chordNotes('C','major7'));
 assert.notDeepEqual(chordNotes('A','minor7'),chordNotes('A','major7'));
});


import {priorityChordGuides} from '../src/data/priorityChordGuides.js';
test('five researched chord intents are represented by distinct authored learning pathways',()=>{
 const slugs=['b-minor','b-flat-major','d-minor','e-minor','g-major'];
 assert.deepEqual(Object.keys(priorityChordGuides),slugs);
 const links=new Set(),exercises=new Set(),questions=new Set();
 const inversionTerms={
  'b-minor':['Bm/D','Bm/F♯'],
  'b-flat-major':['Bb/D','Bb/F'],
  'd-minor':['Dm/F','Dm/A'],
  'e-minor':['Em/G','Em/B'],
  'g-major':['G/B','G/D']
 };
 for(const slug of slugs){
  const guide=priorityChordGuides[slug];
  const entry=releaseChords.find(e=>e.slug===slug);
  assert.ok(entry,slug+' must have a real authored lesson');
  assert.ok(guide.heading.length>35&&guide.intro.length>90);
  assert.ok(guide.answer.length>120&&guide.contrast.length>50);
  assert.equal(guide.steps.length,3);
  assert.ok(guide.steps.every(s=>s.length>50));
  assert.ok(guide.steps.every(s=>!s.includes('always use fingers')));
  assert.ok(inversionTerms[slug].every(term=>guide.answer.includes(term)),
    slug+' must explain both slash basses');
  assert.ok(guide.intro.includes(prettyNote(entry.root)),
    slug+' root spelling must agree with music theory');
  const url=new URL(guide.compareHref,'https://pianochordexplorer.com');
  assert.equal(url.pathname,'/tools/chord-compare/');
  assert.equal(url.searchParams.get('a'),slug);
  assert.ok(releaseChords.some(e=>e.slug===url.searchParams.get('b')));
  assert.ok(releaseChords.some(e=>'/chords/'+e.slug+'/'===guide.nextHref));
  links.add(guide.nextHref);exercises.add(guide.steps.join(' '));questions.add(guide.question);
 }
 assert.equal(exercises.size,5,'Exercises may not be lightly spun duplicates');
 assert.equal(questions.size,5,'Each page must answer a distinct bass-note task');
 assert.equal(links.size,5,'Distinct pedagogical handoffs are expected');
});
