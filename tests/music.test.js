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
test('24 major/minor + C7 chord lessons without duplicate canonical slugs',()=>{
  assert.equal(releaseChords.length,25);
  assert.equal(releaseChords.filter(c=>c.quality==='major').length,12);
  assert.equal(releaseChords.filter(c=>c.quality==='minor').length,12);
  assert.equal(releaseChords.filter(c=>c.quality==='dominant7').length,1);
  assert.equal(new Set(releaseChords.map(c=>c.slug)).size,25);
  assert(releaseChords.every(c=>chordNotes(c.root,c.quality).length>=3));
});
test('keyboard SVG includes original image and accessible labels',()=>{
  const svg=keyboardSvg(createChord(releaseChords[0]));
  assert.match(svg,/viewBox="0 0 692 195"/); assert.match(svg,/Highlighted piano keys/);
  assert.equal((svg.match(/<rect x=/g)||[]).length,36);
});

test('all 25 SEO chord lessons contain distinct authored exercises',()=>{
 const lessons=releaseChords.map(x=>chordLessons[x.slug]);
 assert(lessons.every(x=>x && x.character.length>60 && x.comparison.length>70 && x.exercise.length>70 && x.pitfall.length>50));
 assert.equal(new Set(lessons.map(x=>x.exercise)).size,25);
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
