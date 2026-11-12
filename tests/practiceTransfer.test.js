import test from 'node:test';
import assert from 'node:assert/strict';
import {progression,progressionStep,keyInfo} from '../src/lib/keyTheory.mjs';
import {serializePractice,parsePractice,practiceHintMidis,matchesPracticeNotes} from '../src/lib/practiceTransfer.mjs';
test('C pop four bars, root and BPM survive round trip',()=>{
 const c=progression('C','major','pop');
 const query=serializePractice({root:'C',mode:'major',bpm:105,steps:c.steps});
 const parsed=parsePractice('?'+query);
 assert.equal(parsed.bpm,105);
 assert.deepEqual(parsed.steps.map(s=>s.symbol),['C','G','Am','F']);
 assert.deepEqual(parsed.steps.map(s=>s.roman),['I','V','vi','IV']);
});
test('A minor harmonic dominant is preserved, including the G sharp',()=>{
 const a=progression('A','minor','cadence');
 const parsed=parsePractice(serializePractice({root:'A',mode:'minor',bpm:120,steps:a.steps}));
 assert.deepEqual(parsed.steps.map(s=>s.symbol),['Am','Dm','E','Am']);
 assert.deepEqual(parsed.steps[2].notes,['E','G#','B']);
 assert.deepEqual(practiceHintMidis(parsed.steps[2]),[64,68,71]);
});
test('manual natural-minor v edits also survive',()=>{
 const a=progression('A','minor','cadence');
 a.steps[2]=progressionStep(keyInfo('A','minor'),4,'minor');
 assert.equal(parsePractice(serializePractice({root:'A',mode:'minor',bpm:70,steps:a.steps})).steps[2].symbol,'Em');
});
test('malformed, duplicate, forged, or unsupported parameters are rejected',()=>{
 const q=serializePractice({root:'C',mode:'major',bpm:90,steps:progression('C','major','pop').steps});
 for(const fake of [q+'&root=F',q+'&junk=yes',q.replace('bpm=90','bpm=0'),
 q.replace('root=C','root=F%23%23'),q.replace('0%3Amajor','0%3Aminor'),
 q.replace('4%3Amajor','4%3Adiminished'),q.replace('practice=1','practice=0'),
 q.replace('steps=','steps=0%3Amajor%2C')])assert.equal(parsePractice(fake),null,fake);
 assert.equal(parsePractice(''),null);
 assert.equal(parsePractice('a'.repeat(361)),null);
});
test('note recognition accepts other octaves, but not extra or missing pitches',()=>{
 const c=progression('C','major','pop').steps[0];
 assert.equal(matchesPracticeNotes([48,64,79],c),true);
 assert.equal(matchesPracticeNotes([60,64,67],c),true);
 assert.equal(matchesPracticeNotes([60,64],c),false);
 assert.equal(matchesPracticeNotes([60,64,67,71],c),false);
 assert.equal(matchesPracticeNotes([60,63,67],c),false);
});
