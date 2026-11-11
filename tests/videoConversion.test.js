import test from 'node:test';
import assert from 'node:assert/strict';
import {mp4Args,isSocialMp4,CORE_BASE,MP4_WIDTH,MP4_HEIGHT} from '../src/lib/videoConversion.mjs';
const atom=(name,bytes=[])=>{
  const out=new Uint8Array(8+bytes.length);
  new DataView(out.buffer).setUint32(0,out.length,false);
  out.set([...name].map(c=>c.charCodeAt(0)),4);out.set(bytes,8);return out;
};
const concat=(...parts)=>{
  const out=new Uint8Array(parts.reduce((v,p)=>v+p.length,0));let at=0;
  for(const part of parts){out.set(part,at);at+=part.length;}return out;
};
const ascii=s=>[...s].map(c=>c.charCodeAt(0));
test('MP4 converter requests H.264/AAC and 9:16 faststart',()=>{
  const str=mp4Args().join(' ');
  assert.match(str,/libx264/);assert.match(str,/-c:a aac/);
  assert.match(str,/yuv420p/);assert.match(str,/movflags \+faststart/);
  assert.match(str,/fps=20,scale=540:960/);
  assert.equal(MP4_WIDTH*16,MP4_HEIGHT*9);
});
test('core URL pinned, input/output filenames local only',()=>{
  assert.equal(CORE_BASE,'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm');
  assert.deepEqual(mp4Args().filter(x=>x.endsWith('.mp4')||x.endsWith('.webm')),['take.webm','take.mp4']);
});
test('MP4 validation rejects a misleading VP9/Opus file',()=>{
  const good=concat(atom('ftyp',ascii('isom')),atom('moov',ascii('avc1 xx mp4a')),atom('mdat',[1,2,3]));
  const wrong=concat(atom('ftyp',ascii('isom')),atom('moov',ascii('vp09 xx Opus')),atom('mdat',[1,2,3]));
  assert.equal(isSocialMp4(good),true);
  assert.equal(isSocialMp4(wrong),false);
  assert.equal(isSocialMp4(new Uint8Array([1,2,3])),false);
});
