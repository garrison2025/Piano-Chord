import test from 'node:test';
import assert from 'node:assert/strict';
import {performanceOverlayAt} from '../src/lib/performanceOverlay.mjs';
const guide={bpm:80,steps:[
 {symbol:'Dm7',notes:['D','F','A','C']},
 {symbol:'G7',notes:['G','B','D','F']},
 {symbol:'Cmaj7',notes:['C','E','G','B']},
]};
test('separates the user playing a chord from the target, even when wrong',()=>{
 const notes=[62,65,69,72].map(midi=>({midi,start:0,end:4000}));
 const right=performanceOverlayAt(notes,300,guide);
 assert.equal(right.detected,'Dm7');
 assert.equal(right.guide.target,'Dm7');assert.equal(right.guide.barIndex,1);
 assert.equal(right.guide.beat,1);assert.equal(right.matchedNow,true);
 const wrong=performanceOverlayAt(notes,3250,guide);
 assert.equal(wrong.detected,'Dm7');assert.equal(wrong.guide.target,'G7');
 assert.equal(wrong.guide.barIndex,2);assert.equal(wrong.matchedNow,false);
});
test('uses actual held notes, ignores isolated note and reports true beat',()=>{
 const notes=[{midi:60,start:3000,end:6000},{midi:64,start:3750,end:6000},
 {midi:67,start:3750,end:6000}];
 assert.equal(performanceOverlayAt(notes,3500).detected,null);
 assert.equal(performanceOverlayAt(notes,4000).detected,'C');
 const p=performanceOverlayAt([],3750,guide);
 assert.equal(p.guide.barIndex,2);assert.equal(p.guide.beat,2);assert.equal(p.detected,null);
});
test('guided finished state is explicit; free play never invents a target',()=>{
 const finished=performanceOverlayAt([],9000,guide);
 assert.equal(finished.guide.completed,true);assert.equal(finished.guide.beat,null);
 const free=performanceOverlayAt([],0);
 assert.deepEqual(free,{detected:null,guide:null,matchedNow:false});
});
test('rejects invalid guide metadata without losing detected chord',()=>{
 const notes=[60,64,67].map(midi=>({midi,start:0,end:500}));
 const result=performanceOverlayAt(notes,200,{bpm:1,steps:guide.steps});
 assert.equal(result.guide,null);assert.equal(result.detected,'C');
});
