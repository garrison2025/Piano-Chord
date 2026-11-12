/** Original, local-only piano-roll social video renderer. No recordings leave the device. */
import {performanceOverlayAt} from './performanceOverlay.mjs';
export const VIDEO_THEMES = Object.freeze({
  midnight: Object.freeze({label:'Midnight',top:'#10112b',mid:'#27224f',bottom:'#10182b',accent:'#a99bff',secondary:'#8de2d3',glow:'rgba(170,151,255,.22)'}),
  aurora: Object.freeze({label:'Aurora',top:'#082b32',mid:'#174354',bottom:'#071d2c',accent:'#87ead4',secondary:'#9daaff',glow:'rgba(102,238,215,.2)'}),
  sunset: Object.freeze({label:'Sunset',top:'#332137',mid:'#54364b',bottom:'#181a31',accent:'#ffc18e',secondary:'#c1a2fa',glow:'rgba(255,172,122,.22)'})
});
const BLACK = new Set([1,3,6,8,10]);
const isBlack = midi => BLACK.has(midi%12);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const formatTime=(ms)=>{
  const s=Math.floor(Math.max(0,ms)/1000);
  return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
};
/** The geometry uses physical white-key widths and overlays narrow black keys. */
export function makePerformanceLayout(notes){
  const pitches=(notes||[]).filter(n=>Number.isInteger(n.midi)&&n.midi>=21&&n.midi<=108).map(n=>n.midi);
  const min=pitches.length?Math.min(...pitches):60, max=pitches.length?Math.max(...pitches):72;
  const span=clamp(Math.max(24,max-min+7),24,88);
  let low=clamp(min-3,21,109-span);
  // Only shift the window if doing so cannot hide its highest sounding note.
  if(isBlack(low) && low>21 && max < low+span-1) low--;
  const map=new Map(), keys=[];
  let whites=0;
  for(let midi=low;midi<low+span;midi++){
    const black=isBlack(midi);
    keys.push({midi,black,whiteIndex:whites});
    if(!black)whites++;
  }
  const whiteWidth=640/Math.max(1,whites),blackWidth=whiteWidth*.59;
  for(const key of keys){
    key.w=key.black?blackWidth:whiteWidth;
    key.x=key.black?40+key.whiteIndex*whiteWidth-blackWidth/2:40+key.whiteIndex*whiteWidth;
    key.center=key.x+key.w/2;
    map.set(key.midi,key);
  }
  return {keys,map,low,span,whiteWidth,blackWidth};
}
const layoutCache=new WeakMap();
function layoutFor(notes){
  let result=layoutCache.get(notes);
  if(!result){result=makePerformanceLayout(notes);layoutCache.set(notes,result);}
  return result;
}
function pathRect(ctx,x,y,w,h,r=0){
  ctx.beginPath();
  if(r&&typeof ctx.roundRect==='function')ctx.roundRect(x,y,w,h,r);
  else ctx.rect(x,y,w,h);
}
export function renderPerformanceFrame(ctx, elapsedSeconds, notes, title, options={}){
  const theme=VIDEO_THEMES[options.theme]||VIDEO_THEMES.midnight;
  const layout=layoutFor(notes);
  const t=clamp(Number(elapsedSeconds)||0,0,1000)*1000;
  const duration=Math.max(1,Number(options.durationMs)||Math.max(...notes.map(n=>n.end),1));
  const progress=clamp(t/duration,0,1);
  const W=720,H=1280,rollTop=371,rollBottom=968,keyboardBottom=1108;
  const futureMs=2800;
  const g=ctx.createLinearGradient(0,0,W,H);
  g.addColorStop(0,theme.top);g.addColorStop(.56,theme.mid);g.addColorStop(1,theme.bottom);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // Soft stage light and an animated, intentionally restrained halo.
  const halo=ctx.createRadialGradient(360,610,8,360,610,480);
  halo.addColorStop(0,theme.glow);halo.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=halo;ctx.fillRect(0,185,W,840);
  ctx.fillStyle=theme.accent;pathRect(ctx,40,65,58,5,3);ctx.fill();
  ctx.fillStyle='#d2cce6';ctx.textAlign='left';ctx.font='600 20px system-ui';
  ctx.fillText('PIANO PERFORMANCE',113,79);
  ctx.textAlign='center';ctx.fillStyle='#ffffff';
  const heading=String(title||'My Piano Session').trim().slice(0,60);
  ctx.font=(heading.length>30?'700 39px':'700 51px')+' system-ui';
  ctx.fillText(heading,360,172,635);
  ctx.fillStyle='#c4bfdd';ctx.font='22px system-ui';ctx.fillText('A moment played, a melody shared',360,220);
  // Source-of-truth overlay: the detected chord comes only from held recorded
  // notes. The planned chord is explicitly labelled TARGET, never "played".
  const active=notes.filter(n=>n.start<=t&&n.end>=t);
  const overlay=options.showChordLabels===false?null:performanceOverlayAt(notes,t,options.guide);
  if(overlay&&(overlay.guide||overlay.detected)){
    ctx.fillStyle='rgba(5,8,28,.65)';pathRect(ctx,40,242,640,77,14);ctx.fill();
    ctx.textAlign='left';ctx.font='700 18px system-ui';ctx.fillStyle=theme.secondary;
    if(overlay.guide){
      const g=overlay.guide;
      ctx.fillText((g.completed?'GUIDE FINISHED':'BAR '+g.barIndex+' / '+g.total+' · BEAT '+g.beat)+
        ' · TARGET '+g.target,62,267,596);
    }else ctx.fillText('DETECTED FROM YOUR RECORDED NOTES',62,267,596);
    ctx.font='700 30px system-ui';ctx.fillStyle=overlay.matchedNow?'#bdf7d7':'#ffffff';
    ctx.fillText(overlay.detected?'Played: '+overlay.detected:'No chord detected',62,302,590);
  }else{
    for(let i=0;i<30;i++){
      const h=7+Math.sin(i*.82+t/220)*3 + (active.length?Math.abs(Math.sin(i*.55+t/115))*20:0);
      ctx.fillStyle=i%3===0?theme.secondary:theme.accent;
      pathRect(ctx,186+i*12,291-h/2,7,h,3);ctx.fill();
    }
  }
  ctx.fillStyle='rgba(255,255,255,.07)';pathRect(ctx,27,337,666,800,25);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=2;ctx.stroke();
  // White key lanes alternate; raised-key tracks preserve semitone alignment.
  ctx.fillStyle='rgba(4,7,25,.25)';ctx.fillRect(40,rollTop,640,rollBottom-rollTop);
  for(const key of layout.keys){
    if(key.black){
      ctx.fillStyle='rgba(5,6,22,.23)';
      ctx.fillRect(key.x,rollTop,key.w,rollBottom-rollTop);
    }else{
      ctx.strokeStyle='rgba(228,225,255,.055)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(key.x,rollTop);ctx.lineTo(key.x,rollBottom);ctx.stroke();
    }
  }
  for(let i=1;i<=4;i++){
    const y=rollTop+i*(rollBottom-rollTop)/5;
    ctx.strokeStyle='rgba(255,255,255,.07)';ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(680,y);ctx.stroke();
  }
  // Clip note tails to the piano-roll panel. No script, samples or brand mark is embedded.
  ctx.save();ctx.beginPath();ctx.rect(40,rollTop,640,rollBottom-rollTop);ctx.clip();
  for(const n of notes){
    const key=layout.map.get(n.midi);if(!key)continue;
    const y=rollBottom-(n.start-t)/futureMs*(rollBottom-rollTop);
    const height=Math.max(7,(n.end-n.start)/futureMs*(rollBottom-rollTop));
    if(y<rollTop-height||y-height>rollBottom)continue;
    const lit=t>=n.start&&t<=n.end, width=Math.max(4,key.w*.71);
    const x=key.center-width/2;
    ctx.fillStyle=lit?'#fff1ca':(n.midi%2===0?theme.accent:theme.secondary);
    ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=lit?20:6;
    pathRect(ctx,x,y-height,width,height,Math.min(6,width/3));ctx.fill();
  }
  ctx.restore();ctx.shadowBlur=0;
  // White keys first, then black keys layered in the correct physical positions.
  ctx.fillStyle='#0d1225';ctx.fillRect(40,rollBottom,640,keyboardBottom-rollBottom);
  const activeSet=new Set(active.map(n=>n.midi));
  for(const key of layout.keys.filter(k=>!k.black)){
    ctx.fillStyle=activeSet.has(key.midi)?'#ead5ff':'#f6f4ff';
    pathRect(ctx,key.x+1,rollBottom+3,key.w-2,keyboardBottom-rollBottom-9,4);ctx.fill();
    if(key.midi%12===0 && key.w>14){
      ctx.fillStyle='#746b91';ctx.textAlign='center';ctx.font='600 13px system-ui';
      ctx.fillText('C',key.center,keyboardBottom-21);
    }
  }
  for(const key of layout.keys.filter(k=>k.black)){
    ctx.fillStyle=activeSet.has(key.midi)?theme.accent:'#25243c';
    pathRect(ctx,key.x,rollBottom+3,key.w,82,3);ctx.fill();
  }
  ctx.fillStyle=theme.secondary;ctx.fillRect(40,rollBottom-3,640,3);
  // Timeline and note counter make short clips understandable without sound.
  ctx.textAlign='left';ctx.fillStyle='#d5cee9';ctx.font='600 20px system-ui';
  ctx.fillText(formatTime(t)+' / '+formatTime(duration),40,1176);
  ctx.textAlign='right';ctx.fillText(String(active.length)+' notes sounding',680,1176);
  ctx.fillStyle='rgba(255,255,255,.12)';pathRect(ctx,40,1203,640,7,3);ctx.fill();
  ctx.fillStyle=theme.accent;pathRect(ctx,40,1203,Math.max(2,640*progress),7,3);ctx.fill();
  if(overlay?.guide && overlay.guide.total>1){
    ctx.fillStyle='rgba(255,255,255,.85)';
    for(let i=1;i<overlay.guide.total;i++)ctx.fillRect(40+640*i/overlay.guide.total-1,1202,2,9);
  }
  ctx.textAlign='center';ctx.fillStyle='#aaa5c3';ctx.font='16px system-ui';
  ctx.fillText('Your own piano performance · Made on this device',360,1248);
}
