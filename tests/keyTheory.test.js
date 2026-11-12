import test from 'node:test';
import assert from 'node:assert/strict';
import {KEY_ROOTS,keyInfo,progression,progressionStep,chordMidis,PROGRESSION_PRESETS} from '../src/lib/keyTheory.mjs';
import {pitchClass,chordNotes} from '../src/lib/music.js';
import {tapTempo} from '../src/scripts/studyAudio.js';

test('24 unique major and natural minor scale selections',()=>{
  for(const mode of ['major','minor']){
    assert.equal(KEY_ROOTS[mode].length,12);
    for(const root of KEY_ROOTS[mode]){
      const key=keyInfo(root,mode);
      assert.equal(key.notes.length,7);
      assert.equal(key.chords.length,7);
      assert.equal(new Set(key.notes.map(pitchClass)).size,7);
      for(const chord of key.chords){
        assert.deepEqual(chord.notes,chordNotes(chord.root,chord.quality));
      }
    }
  }
});
test('C major and A natural minor note spelling and scale-degree chords',()=>{
  const c=keyInfo('C','major'),a=keyInfo('A','minor');
  assert.deepEqual(c.notes,['C','D','E','F','G','A','B']);
  assert.deepEqual(c.chords.map(c=>c.roman),['I','ii','iii','IV','V','vi','vii°']);
  assert.deepEqual(a.notes,['A','B','C','D','E','F','G']);
  assert.deepEqual(a.chords.map(c=>c.roman),['i','ii°','III','iv','v','VI','VII']);
  assert.equal(c.relative,'A minor');
  assert.equal(a.relative,'C major');
});
test('difficult spellings remain theoretically correct',()=>{
  assert.deepEqual(keyInfo('Gb','major').notes,['Gb','Ab','Bb','Cb','Db','Eb','F']);
  assert.deepEqual(keyInfo('C#','minor').notes,['C#','D#','E','F#','G#','A','B']);
  assert.deepEqual(keyInfo('Eb','minor').notes,['Eb','F','Gb','Ab','Bb','Cb','Db']);
});
test('minor harmonic V is intentionally major, unlike natural-minor v',()=>{
  const cadence=progression('A','minor','cadence');
  const natural=progression('A','minor','natural');
  assert.equal(cadence.steps[2].symbol,'E');
  assert.deepEqual(cadence.steps[2].notes,['E','G#','B']);
  assert.equal(cadence.steps[2].roman,'V');
  assert.equal(cadence.steps[2].altered,true);
  assert.equal(natural.steps[2].symbol,'Em');
  assert.deepEqual(natural.steps[2].notes,['E','G','B']);
});
test('presets and editable degrees preserve ascending chord MIDI',()=>{
  for(const mode of ['major','minor'])for(const root of KEY_ROOTS[mode]){
    const key=keyInfo(root,mode);
    for(const item of PROGRESSION_PRESETS[mode]){
      const p=progression(root,mode,item.id);
      assert.equal(p.steps.length,4);
      for(const step of p.steps){
        assert.equal(step.midi.length,3);
        assert.ok(step.midi.every(v=>v>=48&&v<=84));
        assert.deepEqual(step.midi,[...step.midi].sort((a,b)=>a-b));
      }
    }
    assert.equal(progressionStep(key,6).degree,6);
  }
  assert.deepEqual(chordMidis(['C','E','G']),[48,52,55]);
});
test('invalid unsupported modes and progression indices fail',()=>{
  assert.throws(()=>keyInfo('F##','major'));
  assert.throws(()=>keyInfo('C','dorian'));
  assert.throws(()=>progressionStep(keyInfo('C','major'),7));
});
test('tap tempo uses recent measured intervals',()=>{
  assert.equal(tapTempo([500,510,490]),120);
  assert.equal(tapTempo([100,500,4000]),120);
  assert.equal(tapTempo([]),null);
});
