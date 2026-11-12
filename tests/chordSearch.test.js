import test from 'node:test';
import assert from 'node:assert/strict';
import {coreChords} from '../src/lib/coreCatalog.js';
import {chordMatchesSearch,normalizeChordSearch} from '../src/lib/chordSearch.mjs';
const find=q=>coreChords.filter(chord=>chordMatchesSearch(chord,q).matches);
test('sharp aliases locate matching flat-spelled chords without duplicating entries',()=>{
  for(const [q,root,quality] of [
    ['C♯maj7','Db','maj7'],['C#maj7','Db','maj7'],
    ['F# minor','Gb','minor'],['F♯ minor','Gb','minor'],
    ['D#7','Eb','7'],['G#sus4','Ab','sus4'],['A#dim','Bb','dim']
  ]){
    const chord=find(q).find(c=>c.root===root&&c.quality===quality);
    assert.ok(chord,q+' should find '+root+':'+quality);
    assert.equal(chordMatchesSearch(chord,q).aliasOnly,true);
  }
});
test('canonical flat spelling, empty search and false positives are unchanged',()=>{
  assert.equal(coreChords.length,120);
  assert.equal(find('').length,120);
  assert.ok(find('D♭maj7').some(c=>c.root==='Db'&&c.quality==='maj7'));
  assert.ok(find('G♭ minor').some(c=>c.root==='Gb'&&c.quality==='minor'));
  assert.equal(find('F# minor').length,1,'Specific minor triad search excludes minor seventh');
  assert.equal(find('F♯ major').length,1,'Specific major triad search excludes major seventh');
  assert.equal(find('G♭ minor').length,1);
  assert.equal(normalizeChordSearch('  C♯maj7  '),'c#maj7');
  assert.equal(find('not-a-chord').length,0);
});
