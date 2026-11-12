import test from 'node:test';
import assert from 'node:assert/strict';
import {serializeSeventhTransfer,parseSeventhTransfer,seventhHintMidis} from '../src/lib/seventhTransfer.mjs';
import {matchesPracticeNotes} from '../src/lib/practiceTransfer.mjs';
test('ii–V–I preserves three correct four-note bars and tempo',()=>{
  const query=serializeSeventhTransfer({patternId:'ii-v-i',bpm:80});
  assert.equal(query,'practice=7&pattern=ii-v-i&bpm=80');
  const data=parseSeventhTransfer('?'+query);
  assert.equal(data.bpm,80);
  assert.deepEqual(data.steps.map(x=>x.symbol),['Dm7','G7','Cmaj7']);
  assert.deepEqual(data.steps.map(x=>x.roman),['ii7','V7','Imaj7']);
  assert.deepEqual(data.steps[0].notes,['D','F','A','C']);
  assert.deepEqual(seventhHintMidis(data.steps[0]),[62,65,69,72]);
});
test('turnaround preserves four bars and dominant seventh',()=>{
  const data=parseSeventhTransfer(serializeSeventhTransfer({patternId:'turnaround',bpm:130}));
  assert.deepEqual(data.steps.map(x=>x.symbol),['Cmaj7','Am7','Dm7','G7']);
  assert.deepEqual(data.steps[3].notes,['G','B','D','F']);
});
test('four pitch classes match across inversions/octaves, not missing or extra notes',()=>{
  const step=parseSeventhTransfer('practice=7&pattern=ii-v-i&bpm=90').steps[0];
  assert.equal(matchesPracticeNotes([62,65,69,72],step),true);
  assert.equal(matchesPracticeNotes([50,65,69,84],step),true);
  assert.equal(matchesPracticeNotes([62,65,69],step),false);
  assert.equal(matchesPracticeNotes([62,65,69,71],step),false);
  assert.equal(matchesPracticeNotes([62,65,69,72,76],step),false);
});
test('tampered and duplicate seventh URLs are rejected',()=>{
  const q=serializeSeventhTransfer({patternId:'ii-v-i',bpm:100});
  for(const bad of ['',q+'&bpm=101',q+'&foo=1',q.replace('practice=7','practice=1'),
    q.replace('pattern=ii-v-i','pattern=fake'),q.replace('bpm=100','bpm=0'),
    q.replace('bpm=100','bpm=181'),q.replace('bpm=100','bpm=75.5'),'a'.repeat(121)])
    assert.equal(parseSeventhTransfer(bad),null,bad);
});
