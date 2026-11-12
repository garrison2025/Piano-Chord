import test from 'node:test';
import assert from 'node:assert/strict';
import {VIDEO_THEMES,makePerformanceLayout,renderPerformanceFrame} from '../src/lib/performanceVideo.mjs';

test('the social video has three selectable user-visible themes',()=>{
  assert.deepEqual(Object.keys(VIDEO_THEMES),['midnight','aurora','sunset']);
});

test('piano geometry distinguishes real white and black key widths and positions',()=>{
  const layout=makePerformanceLayout([{midi:60,start:0,end:300},{midi:61,start:0,end:300},{midi:62,start:0,end:300}]);
  const c=layout.map.get(60),cs=layout.map.get(61),d=layout.map.get(62);
  assert.ok(c && cs && d);
  assert.ok(cs.black);
  assert.ok(cs.w<c.w);
  assert.ok(c.center<cs.center && cs.center<d.center);
  assert.ok(layout.keys.length>=24);
});

test('full 88-key spread stays inside the video keyboard viewport',()=>{
  const layout=makePerformanceLayout([{midi:21,start:0,end:300},{midi:108,start:100,end:400}]);
  assert.equal(layout.keys.length,88);
  assert.equal(layout.keys.filter(k=>!k.black).length,52);
  assert.equal(layout.keys.filter(k=>k.black).length,36);
  assert.ok(layout.keys.every(k=>Number.isFinite(k.center) && k.center>=39 && k.center<=681));
});

test('renders a 9:16 original performance poster without DOM globals',()=>{
  const events=[], gradient={addColorStop(){}};
  const ctx=new Proxy({},{
    get(target,key){
      if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>gradient;
      if(key==='fillText')return (...args)=>{events.push(args);};
      if(['beginPath','rect','roundRect','fill','fillRect','stroke','moveTo','lineTo','clip','save','restore'].includes(key))return ()=>{};
      return target[key];
    },set(target,key,val){target[key]=val;return true;}
  });
  const notes=[{midi:60,start:0,end:410},{midi:64,start:240,end:710}];
  for(const theme of Object.keys(VIDEO_THEMES))renderPerformanceFrame(ctx,.3,notes,'Original session',{durationMs:2000,theme});
  assert.ok(events.some(args=>args[0]==='Original session'));
  assert.ok(events.some(args=>String(args[0]).includes('notes sounding')));
});

test('extreme top C8 always remains visible in the rendered piano',()=>{
  const layout=makePerformanceLayout([{midi:108,start:0,end:500}]);
  assert.ok(layout.map.has(108));
  assert.ok(layout.keys.every(k=>k.midi>=21&&k.midi<=108));
});


test('video overlay visually distinguishes detected playing and target on guided clips',()=>{
  const entries=[],gradient={addColorStop(){}};
  const ctx=new Proxy({},{
    get(target,key){
      if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>gradient;
      if(key==='fillText')return (...args)=>{entries.push(String(args[0]));};
      if(['beginPath','rect','roundRect','fill','fillRect','stroke','moveTo','lineTo','clip','save','restore'].includes(key))return ()=>{};
      return target[key];
    },set(target,key,val){target[key]=val;return true;}
  });
  const notes=[62,65,69,72].map(midi=>({midi,start:0,end:4000}));
  const guide={bpm:80,steps:[
    {symbol:'Dm7',notes:['D','F','A','C']},
    {symbol:'G7',notes:['G','B','D','F']},
    {symbol:'Cmaj7',notes:['C','E','G','B']},
  ]};
  renderPerformanceFrame(ctx,3.2,notes,'Guided piano',{guide,durationMs:9000});
  assert.ok(entries.some(x=>x.includes('TARGET G7')),'Target should identify bar two');
  assert.ok(entries.some(x=>x.includes('Played: Dm7')),'Played chord must not be replaced by target');
  entries.length=0;
  renderPerformanceFrame(ctx,3.2,notes,'Guided piano',{guide,durationMs:9000,showChordLabels:false});
  assert.ok(!entries.some(x=>x.includes('TARGET')||x.includes('Played:')));
});
