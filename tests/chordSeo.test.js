import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseChords} from '../src/data/chords.js';
import {chordLessons} from '../src/data/editorials.js';
import {chordSearchDescriptions,chordSearchTitles} from '../src/data/chordSeo.js';
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


test('all 29 chord lesson titles are distinct, concise and aligned to intent',()=>{
  assert.deepEqual(Object.keys(chordSearchTitles).sort(),releaseChords.map(x=>x.slug).sort());
  assert.equal(new Set(Object.values(chordSearchTitles)).size,29);
  for(const chord of releaseChords){
    const t=chordSearchTitles[chord.slug];
    assert.ok(t.length>=25&&t.length<=65,chord.slug+' title length '+t.length);
    assert.match(t,/piano chord/i,chord.slug+' intent');
    assert.ok(t.toLowerCase().includes(chord.symbol.toLowerCase()),chord.slug+' symbol '+chord.symbol);
  }
});


test('C-major to A-minor exercise correctly distinguishes root position and inversion',()=>{
  const exercise=chordLessons['c-major'].exercise;
  assert.match(exercise,/root position/);
  assert.match(exercise,/C and E steady/);
  assert.doesNotMatch(exercise,/A minor inversion/);
});
