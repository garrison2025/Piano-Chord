import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseChords} from '../src/data/chords.js';
import {createChord,prettyNote,prettySymbol} from '../src/lib/music.js';
import {chordQuickAnswer} from '../src/lib/chordQuickAnswer.mjs';
test('all 29 quick answers reproduce correct note names and each inversion',()=>{
  assert.equal(releaseChords.length,29);
  for(const e of releaseChords){
    const c=createChord(e),a=chordQuickAnswer(c);
    assert.ok(a.question.includes(c.name),e.slug);
    assert.ok(a.definition.includes(prettySymbol(c.symbol)),e.slug);
    assert.equal(a.notes.length,c.notes.length,e.slug);
    assert.ok(a.inversionAnswer.includes(c.inversions.length+' positions'),e.slug);
    for(const n of c.notes.map(prettyNote))assert.ok(a.definition.includes(n),e.slug);
    for(const v of c.inversions)
      assert.ok(a.inversionAnswer.includes(v.notes.map(prettyNote).join('–')),e.slug);
  }
});
test('C7/Cmaj7, sharps and flats remain musically distinct',()=>{
  const get=slug=>chordQuickAnswer(createChord(releaseChords.find(e=>e.slug===slug)));
  assert.match(get('c-7').definition,/B♭/);
  assert.match(get('c-major-7').definition,/C, E, G and B\./);
  assert.match(get('b-minor').definition,/B, D and F♯/);
  assert.match(get('b-flat-major').definition,/B♭, D and F/);
  assert.match(get('c-7').definition,/dominant seventh/);
  assert.match(get('c-major-7').definition,/major seventh/);
  assert.throws(()=>chordQuickAnswer({notes:['C'],quality:'unknown',inversions:[]}));
});
