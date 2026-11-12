import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEvents} from '../src/lib/recording.mjs';
import {buildChordTimeline,soundingNotesAt,suggestCoverTime} from '../src/lib/recordingTimeline.mjs';
function take(groups,duration){
  return normalizeEvents(groups.flatMap(({midis,start,end})=>
    midis.flatMap(midi=>[{type:'on',midi,t:start},{type:'off',midi,t:end}])),duration);
}
test('detects actual Dm7 then G7 segments with note-relative times',()=>{
  const t=take([
    {midis:[62,65,69,72],start:100,end:700},
    {midis:[55,59,62,65],start:1100,end:1700}
  ],2100);
  const segments=buildChordTimeline(t);
  assert.deepEqual(segments.map(x=>[x.start,x.end,x.symbol,x.kind]),[
    [100,700,'Dm7','seventh'],[1100,1700,'G7','seventh']
  ]);
  assert.deepEqual(soundingNotesAt(t,1200),[55,59,62,65]);
  assert.deepEqual(soundingNotesAt(t,900),[]);
  assert.deepEqual(soundingNotesAt(t,1700),[]);
});
test('timeline distinguishes stable root, first inversion, and dominant seventh third inversion',()=>{
  const t=take([
    {midis:[60,64,67],start:100,end:400},
    {midis:[64,67,72],start:500,end:900},
    {midis:[58,60,64,67],start:1000,end:1400}
  ],1550);
  assert.deepEqual(buildChordTimeline(t).map(c=>[c.symbol,c.start,c.end]),[
    ['C',100,400],['C/E',500,900],['C7/B♭',1000,1400]
  ]);
});
test('octave doubled notes do not make two chord labels; two sessions stay separate',()=>{
  const t=take([
    {midis:[60,64,67,72],start:100,end:500},
    {midis:[60,64,67],start:680,end:1080}
  ],1100);
  const runs=buildChordTimeline(t);
  assert.deepEqual(runs.map(x=>[x.start,x.end,x.symbol]),[
    [100,500,'C'],[680,1080,'C']
  ]);
});
test('ignores short transient note combinations and fragmented arpeggios',()=>{
  const t=take([
    {midis:[60,64,67],start:0,end:49},
    {midis:[62],start:120,end:210},
    {midis:[65],start:211,end:300},
    {midis:[69],start:301,end:400}
  ],500);
  assert.deepEqual(buildChordTimeline(t),[]);
  assert.equal(suggestCoverTime(t),24.5);
});
test('first meaningful chord is the default poster frame, not target song metadata',()=>{
  const t=take([
    {midis:[60],start:30,end:300},
    {midis:[62,65,69,72],start:850,end:1450}
  ],1600);
  assert.equal(suggestCoverTime(t),1110);
});
test('empty, malformed and out-of-range times stay safe',()=>{
  assert.deepEqual(buildChordTimeline({events:[],duration:1000}),[]);
  assert.deepEqual(soundingNotesAt(null,150),[]);
  const t=take([{midis:[60,64,67],start:100,end:300}],500);
  assert.deepEqual(soundingNotesAt(t,Infinity),[]);
  assert.deepEqual(soundingNotesAt(t,99999),[]);
});
