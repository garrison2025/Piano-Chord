import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseChords} from '../src/data/chords.js';
import {chordSearchDescriptions} from '../src/data/chordSeo.js';
import {createChord,prettyNote} from '../src/lib/music.js';
test('all 29 authored lessons have unique, legible non-boilerplate SEO descriptions',()=>{
  assert.deepEqual(Object.keys(chordSearchDescriptions).sort(),releaseChords.map(x=>x.slug).sort());
  const descriptions=Object.values(chordSearchDescriptions);
  assert.equal(new Set(descriptions).size,29);
  for(const entry of releaseChords){
    const s=chordSearchDescriptions[entry.slug];
    assert.ok(s.length>=105&&s.length<=165,entry.slug+' length '+s.length);
    assert.match(s,/(piano|chord)/i);
    const spelled=createChord(entry).notes.map(prettyNote);
    assert.ok(spelled.every(note=>s.includes(note)),entry.slug+' must specify actual chord notes');
  }
});
