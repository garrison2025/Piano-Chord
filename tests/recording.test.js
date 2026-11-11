import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEvents, noteIntervals, encodeMidi, safeFilename, MAX_RECORDING_MS } from '../src/lib/recording.mjs';

test('deduplicates repeated note-on, drops orphan note-off and closes held notes', () => {
  const take=normalizeEvents([
    {type:'off',midi:60,t:0},{type:'on',midi:60,t:50},{type:'on',midi:60,t:70},
    {type:'on',midi:64,t:100},{type:'off',midi:60,t:230}
  ],500);
  assert.deepEqual(take.events,[
    {type:'on',midi:60,t:50},{type:'on',midi:64,t:100},
    {type:'off',midi:60,t:230},{type:'off',midi:64,t:500}
  ]);
});
test('preserves independent polyphonic note intervals', () => {
  const take=normalizeEvents([
    {type:'on',midi:60,t:1},{type:'on',midi:64,t:5},
    {type:'off',midi:60,t:301},{type:'off',midi:64,t:305}
  ],310);
  assert.deepEqual(noteIntervals(take),[
    {midi:60,start:1,end:301},{midi:64,start:5,end:305}
  ]);
});
test('invalid events are rejected and duration is limited to 90 seconds', () => {
  const r=normalizeEvents([
    {type:'on',midi:20,t:2},{type:'on',midi:109,t:3},{type:'on',midi:60.4,t:5},
    {type:'on',midi:60,t:MAX_RECORDING_MS+100}
  ],MAX_RECORDING_MS+5000);
  assert.equal(r.duration, MAX_RECORDING_MS);
  assert.deepEqual(r.events,[{type:'on',midi:60,t:MAX_RECORDING_MS},{type:'off',midi:60,t:MAX_RECORDING_MS}]);
});
test('SMF header, track length and end track marker are valid', () => {
  const r=normalizeEvents([{type:'on',midi:60,t:0},{type:'off',midi:60,t:250}],500);
  const bytes=encodeMidi(r);
  assert.equal(Buffer.from(bytes.slice(0,4)).toString(),'MThd');
  assert.equal(Buffer.from(bytes.slice(14,18)).toString(),'MTrk');
  const size=(bytes[18]<<24)|(bytes[19]<<16)|(bytes[20]<<8)|bytes[21];
  assert.equal(size,bytes.length-22);
  assert.deepEqual([...bytes.slice(-3)],[0xff,0x2f,0x00]);
  assert.ok([...bytes].includes(0x90));assert.ok([...bytes].includes(0x80));
});
test('safe download filenames', () => {
  assert.equal(safeFilename(' My #1 Song! '),'My-1-Song');
  assert.equal(safeFilename('🎹'),'piano-performance');
});
