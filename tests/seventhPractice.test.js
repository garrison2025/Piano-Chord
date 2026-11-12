import test from 'node:test';
import assert from 'node:assert/strict';
import {SEVENTH_PATTERNS,seventhTempo,seventhPattern,planSeventhPractice} from '../src/lib/seventhPractice.mjs';

test('only two intentionally authored seventh progressions are offered',()=>{
  assert.deepEqual(SEVENTH_PATTERNS.map(p=>p.id),['ii-v-i','turnaround']);
  assert.deepEqual(seventhPattern('ii-v-i').bars.map(x=>x.symbol),['Dm7','G7','Cmaj7']);
  assert.deepEqual(seventhPattern('turnaround').bars.map(x=>x.symbol),['Cmaj7','Am7','Dm7','G7']);
});
test('seven-chord practice retains correct notes and root voicings',()=>{
  const bars=seventhPattern('ii-v-i').bars;
  assert.deepEqual(bars.map(x=>x.notes),[
    ['D','F','A','C'],['G','B','D','F'],['C','E','G','B']
  ]);
  assert.ok(bars.every(b=>b.midi.length===4&&b.midi.every(Number.isInteger)));
});
test('120 BPM: stable four-quarter bars, 12 accentable beats, no accumulated drift',()=>{
  const plan=planSeventhPractice('ii-v-i',120,17.125);
  assert.equal(plan.durationSeconds,6);
  assert.deepEqual(plan.bars.map(x=>x.at),[17.125,19.125,21.125]);
  assert.equal(plan.endSeconds,23.125);
  assert.equal(plan.ticks.length,12);
  assert.deepEqual(plan.ticks.filter(t=>t.accent).map(t=>t.at),[17.125,19.125,21.125]);
});
test('fifty to 180 BPM boundaries and muted clicks are validated',()=>{
  assert.equal(seventhTempo('50'),50);
  assert.equal(seventhTempo(180),180);
  assert.equal(planSeventhPractice('turnaround',60,0,{click:false}).ticks.length,0);
  assert.equal(planSeventhPractice('turnaround',60).durationSeconds,16);
  for(const invalid of [0,49,181,1.5,'x','',NaN,Infinity])assert.throws(()=>seventhTempo(invalid));
  assert.throws(()=>seventhPattern('fake'));
  assert.throws(()=>planSeventhPractice('ii-v-i',90,-1));
});
