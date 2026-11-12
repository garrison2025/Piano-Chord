import test from 'node:test';
import assert from 'node:assert/strict';
import {COUNT_IN_BEATS,countInPosition,guidePosition} from '../src/lib/practiceTiming.mjs';

test('count-in has exactly four beats and ends at the fourth beat boundary',()=>{
  assert.equal(COUNT_IN_BEATS,4);
  assert.deepEqual([0,749,750,1499,1500,2250,2999].map(ms=>countInPosition(ms,80).remaining),
    [4,4,3,3,2,1,1]);
  assert.equal(countInPosition(2999,80).finished,false);
  assert.deepEqual(countInPosition(3000,80),{remaining:0,beat:null,finished:true,durationMs:3000});
});
test('beat and bar are derived from absolute monotonic elapsed time',()=>{
  assert.deepEqual([0,749,750,2249,2250,2999,3000,8999].map(ms=>{
    const p=guidePosition(ms,80,3);return [p.barIndex,p.beat,p.complete];
  }),[[0,1,false],[0,1,false],[0,2,false],[0,3,false],
      [0,4,false],[0,4,false],[1,1,false],[2,4,false]]);
  assert.equal(guidePosition(9000,80,3).complete,true);
  assert.equal(guidePosition(12000,80,3).barIndex,2);
});
test('works for min/max BPM, four bars and early rounded frames',()=>{
  assert.equal(countInPosition(0,180).remaining,4);
  assert.equal(guidePosition(-5,50,4).beat,1);
  assert.equal(guidePosition(19199,50,4).complete,false);
  assert.equal(guidePosition(19200,50,4).complete,true);
});
test('rejects nonfinite times and invalid tempos/bar counts',()=>{
  assert.throws(()=>countInPosition(NaN,80));
  assert.throws(()=>countInPosition(0,181));
  assert.throws(()=>guidePosition(Infinity,80,3));
  assert.throws(()=>guidePosition(0,80,0));
});
