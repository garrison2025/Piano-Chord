import test from 'node:test';
import assert from 'node:assert/strict';
import {describeHeldChord} from '../src/lib/chordDetection.mjs';
test('recognizes dominant, major and minor sevenths in inversions and octaves',()=>{
  for(const [midi,symbol,quality] of [
    [[60,64,67,70],'C7','dominant7'],[[48,64,67,71],'Cmaj7','major7'],
    [[57,60,64,67],'Am7','minor7'],[[72,69,65,50],'Dm7','minor7']]){
    const result=describeHeldChord(midi);
    assert.equal(result.kind,'seventh');
    assert.ok(result.matches.some(x=>x.symbol===symbol&&x.quality===quality),symbol);
  }
});
test('triads, doubled octaves, incomplete and non-chord combinations',()=>{
  assert.ok(describeHeldChord([60,64,67]).matches.some(x=>x.symbol==='C'));
  assert.equal(describeHeldChord([60,72,64,67]).kind,'triad');
  assert.equal(describeHeldChord([60,64]).kind,'idle');
  assert.equal(describeHeldChord([60,64,67,70,74]).kind,'seventh');
  assert.equal(describeHeldChord([60,64,67,70,73]).kind,'unknown');
  assert.equal(describeHeldChord([0,999,'60']).kind,'idle');
});
