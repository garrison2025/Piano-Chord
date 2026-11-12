import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEvents} from '../src/lib/recording.mjs';
import {assessGuidedTake,MIN_CHORD_HOLD_MS} from '../src/lib/practiceAssessment.mjs';
import {parseSeventhTransfer} from '../src/lib/seventhTransfer.mjs';
import {parsePractice} from '../src/lib/practiceTransfer.mjs';

const seventh=()=>parseSeventhTransfer('practice=7&pattern=ii-v-i&bpm=80').steps;
const take=(groups,duration)=>normalizeEvents(groups.flatMap(({notes,start,end})=>
  notes.flatMap(midi=>[{type:'on',midi,t:start},{type:'off',midi,t:end}])),duration);

test('perfect three-bar seventh take has transparent 100% chord coverage',()=>{
  const r=assessGuidedTake(take([
    {notes:[62,65,69,72],start:70,end:460},
    {notes:[55,59,62,65],start:3080,end:3420},
    {notes:[60,64,67,71],start:6050,end:6370},
  ],9000),seventh(),80);
  assert.equal(r.matched,3);assert.equal(r.total,3);assert.equal(r.coveragePercent,100);
  assert.equal(r.complete,true);
  assert.deepEqual(r.bars.map(b=>b.beat),[1,1,1]);
  assert.deepEqual(r.bars.map(b=>b.status),['matched','matched','matched']);
});
test('partial recording never claims a full score and distinguishes unplayed bars',()=>{
  const r=assessGuidedTake(take([{notes:[50,65,69,84],start:70,end:330}],1000),seventh(),80);
  assert.equal(r.matched,1);assert.equal(r.coveragePercent,33);assert.equal(r.complete,false);
  assert.equal(r.bars[0].status,'matched');
  assert.equal(r.bars[1].status,'not-reached');assert.equal(r.bars[2].status,'not-reached');
});
test('missing note, wrong seventh and extra simultaneous pitch do not count',()=>{
  const r=assessGuidedTake(take([
    {notes:[62,65,69],start:80,end:300},
    {notes:[55,59,62,65,68],start:3090,end:3470},
    {notes:[60,64,67,70],start:6110,end:6400},
  ],9000),seventh(),80);
  assert.equal(r.matched,0);assert.equal(r.coveragePercent,0);
});
test('three successive notes without simultaneous overlap do not form a chord',()=>{
  const r=assessGuidedTake(take([
    {notes:[62],start:60,end:150},{notes:[65],start:160,end:250},
    {notes:[69],start:260,end:350},{notes:[72],start:360,end:450},
  ],1000),seventh(),80);
  assert.equal(r.bars[0].matched,false);
});
test('accidental brief 20ms overlap does not count; 45ms qualifies',()=>{
  const short=assessGuidedTake(take([{notes:[62,65,69,72],start:100,end:119}],3000),seventh(),80);
  const full=assessGuidedTake(take([{notes:[62,65,69,72],start:100,end:100+MIN_CHORD_HOLD_MS}],3000),seventh(),80);
  assert.equal(short.bars[0].matched,false);assert.equal(full.bars[0].matched,true);
});
test('late correct chord reports its actual bar beat, not a subjective rhythm grade',()=>{
  const r=assessGuidedTake(take([{notes:[62,65,69,72],start:1950,end:2300}],3000),seventh(),80);
  assert.equal(r.bars[0].beat,3);assert.equal(r.bars[0].firstMatchMs,1950);
});
test('existing four-bar triad practice is assessed by the same module',()=>{
  const triad=parsePractice('practice=1&root=C&mode=major&bpm=120&steps=0%3Amajor%2C4%3Amajor%2C5%3Aminor%2C3%3Amajor');
  assert.ok(triad);
  const r=assessGuidedTake(take([{notes:[60,64,67],start:60,end:270}],600),triad.steps,120);
  assert.equal(r.matched,1);assert.equal(r.total,4);assert.equal(r.coveragePercent,25);
});
test('invalid tempo, missing steps or malformed take fail closed',()=>{
  assert.throws(()=>assessGuidedTake(null,seventh(),80));
  assert.throws(()=>assessGuidedTake({duration:1,events:[]},[],80));
  assert.throws(()=>assessGuidedTake({duration:1,events:[]},seventh(),0));
});
