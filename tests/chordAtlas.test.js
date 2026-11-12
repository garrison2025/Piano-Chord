import test from 'node:test';
import assert from 'node:assert/strict';
import {coreChords,qualities} from '../src/lib/coreCatalog.js';
import {coreChordVoicing,coreChordKeyboard,coreChordByKey,findCoreChordMatches} from '../src/lib/chordAtlas.mjs';
import {pitchClass} from '../src/lib/music.js';

test('full 120-chord catalog has named root, quality and valid voicings',()=>{
  assert.equal(coreChords.length,120);assert.equal(coreChordByKey.size,120);
  for(const chord of coreChords){
    const model=coreChordKeyboard(chord);
    assert.equal(model.inversions.length,chord.notes.length);
    for(const [i,voice] of model.inversions.entries()){
      assert.deepEqual(voice,coreChordVoicing(chord,i));
      assert.equal(voice.bass,voice.notes[0]);
      assert.deepEqual([...voice.midi].sort((a,b)=>a-b),voice.midi,'Ascending MIDI '+model.symbol);
      assert.deepEqual(new Set(voice.midi.map(x=>x%12)),new Set(chord.notes.map(pitchClass)));
      assert.ok(voice.midi.every(x=>x>=60&&x<=108),'Out of physical piano range '+model.symbol);
    }
  }
});
test('suspended, diminished, augmented, sevenths and half diminished are findable',()=>{
  for(const q of qualities){
    const chord=coreChords.find(c=>c.root==='C'&&c.quality===q.id);
    assert.ok(findCoreChordMatches(chord.notes).some(m=>m.root==='C'&&m.quality===q.id),q.id);
  }
  assert.ok(findCoreChordMatches(['C','F','G']).some(x=>x.symbol==='Csus4'));
  assert.ok(findCoreChordMatches(['C','Eb','Gb','Bb']).some(x=>x.symbol==='Cm7b5'));
});
test('enharmonic spellings map to the same pitch classes, not false separate notes',()=>{
  assert.ok(findCoreChordMatches([61,65,68]).some(x=>x.root==='Db'&&x.quality==='major'));
  assert.ok(findCoreChordMatches(['Db','F','Ab']).some(x=>x.root==='Db'&&x.quality==='major'));
  assert.equal(findCoreChordMatches(['C','D']).length,0);
  assert.equal(findCoreChordMatches(['C','D','E','F','G']).length,0);
});
test('inversion roots and invalid combinations are guarded',()=>{
  const c=coreChords.find(x=>x.root==='C'&&x.quality==='maj7');
  assert.deepEqual(coreChordVoicing(c,3).notes,['B','C','E','G']);
  assert.equal(coreChordVoicing(c,3).bass,'B');
  assert.throws(()=>coreChordVoicing(c,4));
  assert.throws(()=>coreChordKeyboard({root:'P',quality:'sus4'}));
});
