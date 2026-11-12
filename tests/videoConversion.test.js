import test from 'node:test';
import assert from 'node:assert/strict';
import {mp4Args,isSocialMp4,CORE_BASE,MP4_WIDTH,MP4_HEIGHT,MP4_FPS} from '../src/lib/videoConversion.mjs';
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
  assert.match(str,/fps=24,scale=540:960/);
  assert.match(str,/-b:a 128k/);
  assert.ok(MP4_FPS>=23 && MP4_FPS<=60,'TikTok video FPS must be 23–60');
  assert.equal(MP4_WIDTH*16,MP4_HEIGHT*9);
});
test('core URL pinned, input/output filenames local only',()=>{
  assert.equal(CORE_BASE,'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm');
  assert.deepEqual(mp4Args().filter(x=>x.endsWith('.mp4')||x.endsWith('.webm')),['take.webm','take.mp4']);
});
const track=(kind,codec)=>{
  const handler=atom('hdlr',[0,0,0,0,0,0,0,0,...ascii(kind)]);
  const stsd=atom('stsd',concat(new Uint8Array([0,0,0,0,0,0,0,1]),atom(codec,[0,0,0,0])));
  return atom('trak',atom('mdia',concat(handler,atom('minf',atom('stbl',stsd)))));
};
const movie=(video,audio,extras=[])=>concat(
  atom('ftyp',ascii('isom')),
  atom('moov',concat(track('vide',video),track('soun',audio),...extras)),
  atom('mdat',[1,2,3])
);

test('valid MP4 has real AVC video and AAC audio sample entries',()=>{
  assert.equal(isSocialMp4(movie('avc1','mp4a')),true);
  assert.equal(isSocialMp4(movie('avc3','mp4a')),true);
});

test('VP9/Opus is rejected even if metadata contains avc1/mp4a strings',()=>{
  assert.equal(isSocialMp4(movie('vp09','Opus',[atom('udta',ascii('avc1 random mp4a'))])),false);
  assert.equal(isSocialMp4(movie('vp09','mp4a',[atom('udta',ascii('avc1'))])),false);
  assert.equal(isSocialMp4(movie('avc1','Opus',[atom('udta',ascii('mp4a'))])),false);
});

test('rejects truncated, corrupt, or incomplete MP4 boxes',()=>{
  const good=movie('avc1','mp4a');
  assert.equal(isSocialMp4(good.subarray(0,good.length-1)),false);
  assert.equal(isSocialMp4(new Uint8Array([1,2,3])),false);
  const altered=new Uint8Array(good);altered[0]=255;
  assert.equal(isSocialMp4(altered),false);
});
