import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_ACTIVE_PIANO_VOICES,selectVoiceToEvict} from '../src/lib/pianoPolyphony.mjs';
test('piano polyphony is bounded to 24 voices (72 oscillator nodes)',()=>{
  assert.equal(MAX_ACTIVE_PIANO_VOICES,24);
});
test('steals oldest sustained-but-unheld voice before actively held notes',()=>{
  const voices=new Map([[60,{}],[64,{}],[67,{}],[71,{}]]);
  assert.equal(selectVoiceToEvict(voices.keys(),[60,67,71]),64);
  assert.equal(selectVoiceToEvict(voices.keys(),[67,71]),60);
});
test('when every voice is held, the oldest sounding pitch is the fallback',()=>{
  assert.equal(selectVoiceToEvict([60,61,62,63],[60,61,62,63]),60);
  assert.equal(selectVoiceToEvict([62,64],[64]),62);
  assert.equal(selectVoiceToEvict([],[]),null);
});
test('releasing a victim does not require deleting a still-held pointer source',()=>{
  const voices=new Map([[60,{}],[64,{}],[67,{}]]);
  const held=[60,64,67];
  const victim=selectVoiceToEvict(voices.keys(),held);
  assert.equal(victim,60);
  voices.delete(victim);
  assert.deepEqual([...voices.keys()],[64,67]);
  assert.ok(held.includes(victim),'The pointer remains logically held; the stolen note simply stops sounding');
});
