import {MAX_RECORDING_MS, normalizeEvents, noteIntervals, encodeMidi, safeFilename} from '../lib/recording.mjs';

/** Browser-only recording studio; no upload, cookie, account or third-party API. */
export function setupPianoRecorder({on,off,stop}) {
  const el = id => document.getElementById(id);
  const root = el('vp-recording-studio');
  if (!root) return {noteOn(){},noteOff(){}};
  const controls = Object.fromEntries(['record','end-record','replay','midi','export','share','download','cancel-export','title','message','clock','preview','progress','format'].map(k => [k,el('vp-'+k)]));
  let capturing=false, captured=[],startedAt=0,timer=null,timeout=null,take=null;
  let playing=false,playFrame=0,playStart=0,playIndex=0;
  let exporting=false,shouldCancel=false,previewUrl=null,videoFile=null;

  function status(message) { controls.message.textContent=message; }
  function clock(ms) { const sec=Math.max(0,Math.floor(ms/1000));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`; }
  function updateUI(){
    const hasNotes=Boolean(take && noteIntervals(take).length);
    controls.record.disabled=capturing||exporting;
    controls['end-record'].disabled=!capturing;
    controls.replay.disabled=!hasNotes||capturing||exporting;
    controls.midi.disabled=!hasNotes||capturing||exporting;
    controls.export.disabled=!hasNotes||capturing||exporting;
    controls.share.disabled=!videoFile||capturing||exporting;
    controls.download.disabled=!videoFile||capturing||exporting;
    controls['cancel-export'].hidden=!exporting;
    controls.record.classList.toggle('is-recording',capturing);
    controls.replay.textContent=playing?'■ Stop replay':'▶ Replay';
    controls.export.textContent=exporting?'Rendering video…':'🎬 Create 9:16 video';
  }
  function resetVideo(){if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;videoFile=null;controls.preview.removeAttribute('src');controls.preview.hidden=true;controls.format.textContent='';}
  function stopReplay(){
    if(!playing)return;
    playing=false;cancelAnimationFrame(playFrame);
    stop();updateUI();
  }
  function startRecord(){
    if(exporting)return;
    stopReplay();stop();resetVideo();
    captured=[];take=null;capturing=true;startedAt=performance.now();
    controls.clock.textContent='00:00';
    status('Recording locally. Play the piano; stop when finished (90-second maximum).');
    timer=setInterval(()=>{controls.clock.textContent=clock(Math.min(MAX_RECORDING_MS,performance.now()-startedAt));},120);
    timeout=setTimeout(endRecord,MAX_RECORDING_MS);
    updateUI();
  }
  function endRecord(){
    if(!capturing)return;
    stop(); // close sustained/held voices while capture hook is still active
    capturing=false;
    clearInterval(timer);clearTimeout(timeout);timer=timeout=null;
    const duration=Math.min(MAX_RECORDING_MS,Math.max(1,Math.round(performance.now()-startedAt)));
    take=normalizeEvents(captured,duration);
    controls.clock.textContent=clock(take.duration);
    const count=noteIntervals(take).length;
    status(count?`Saved ${count} notes locally (${clock(take.duration)}). Replay, export MIDI or create a video.`:'No notes captured. Press Record and play a few piano keys.');
    updateUI();
  }
  function noteOn(midi){if(capturing)captured.push({type:'on',midi,t:performance.now()-startedAt});}
  function noteOff(midi){if(capturing)captured.push({type:'off',midi,t:performance.now()-startedAt});}
  function replay(){
    if(capturing||exporting||!take)return;
    if(playing){stopReplay();status('Replay stopped.');return;}
    stop();playing=true;playIndex=0;playStart=performance.now();updateUI();
    const frame=()=>{
      if(!playing)return;
      const elapsed=performance.now()-playStart;
      while(playIndex<take.events.length && take.events[playIndex].t<=elapsed){
        const e=take.events[playIndex++];
        if(e.type==='on')on(e.midi); else off(e.midi);
      }
      controls.clock.textContent=clock(Math.min(take.duration,elapsed));
      if(elapsed>=take.duration+350){stopReplay();controls.clock.textContent=clock(take.duration);status('Replay complete.');return;}
      playFrame=requestAnimationFrame(frame);
    };
    status('Playing your recorded notes locally.');playFrame=requestAnimationFrame(frame);
  }
  function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  function midi(){if(!take)return;try{downloadBlob(new Blob([encodeMidi(take)],{type:'audio/midi'}),safeFilename(controls.title.value)+'.mid');status('MIDI downloaded.');}catch{status('Could not create the MIDI file.');}}

  function formatChoice(){
    if(typeof MediaRecorder==='undefined' || typeof HTMLCanvasElement.prototype.captureStream!=='function')return null;
    for(const m of ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']){
      if(MediaRecorder.isTypeSupported(m))return m;
    }
    return null;
  }
  function drawFrame(ctx,elapsed,notes,title){
    const w=720,h=1280;
    const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#15132d');g.addColorStop(.53,'#302451');g.addColorStop(1,'#11172b');
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    // Ambient glow, intentionally original graphic assets and no forced watermark.
    const glow=ctx.createRadialGradient(360,580,15,360,580,470);glow.addColorStop(0,'rgba(143,122,255,.16)');glow.addColorStop(1,'rgba(143,122,255,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,130,w,1000);
    ctx.textAlign='center';ctx.fillStyle='#d9ccff';ctx.font='600 21px system-ui';ctx.fillText('MY PIANO PERFORMANCE',360,112);
    ctx.fillStyle='#ffffff';ctx.font='700 46px system-ui';
    const label=title.slice(0,48);ctx.fillText(label,360,181,640);
    ctx.fillStyle='#bcb4df';ctx.font='23px system-ui';ctx.fillText('A little moment at the piano',360,227);
    const minNote=notes.length?Math.min(...notes.map(n=>n.midi)):60;
    const maxNote=notes.length?Math.max(...notes.map(n=>n.midi)):72;
    const range=Math.max(24,Math.min(88,maxNote-minNote+7));
    const low=Math.max(21,Math.min(109-range,minNote-3));
    const keyW=640/range, x0=40, pianoTop=958, rollTop=302, keyH=148;
    ctx.fillStyle='rgba(255,255,255,.035)';ctx.fillRect(x0,rollTop,640,pianoTop-rollTop);
    ctx.strokeStyle='rgba(220,215,255,.1)';ctx.lineWidth=1;
    for(let i=0;i<=range;i++){const x=x0+i*keyW;ctx.beginPath();ctx.moveTo(x,rollTop);ctx.lineTo(x,pianoTop+keyH);ctx.stroke();}
    const elapsedMs=elapsed*1000;
    const soon=2600;
    ctx.save();ctx.beginPath();ctx.rect(x0,rollTop,640,pianoTop-rollTop);ctx.clip();
    for(const n of notes){
      const x=x0+(n.midi-low)*keyW+1;if(x<x0||x>x0+640)continue;
      const y=pianoTop-(n.start-elapsedMs)/soon*(pianoTop-rollTop);
      const len=Math.max(7,(n.end-n.start)/soon*(pianoTop-rollTop));
      if(y<-len||y-len>pianoTop)continue;
      const lit=elapsedMs>=n.start && elapsedMs<=n.end;
      ctx.fillStyle=lit?'#f7ba8c':(['#8e87ff','#87dbd5','#dba6f4'][n.midi%3]);
      ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=lit?19:7;
      ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y-len,Math.max(3,keyW-2),len,Math.min(6,keyW/3));else ctx.rect(x,y-len,Math.max(3,keyW-2),len);ctx.fill();
    }
    ctx.restore();ctx.shadowBlur=0;
    ctx.fillStyle='#151427';ctx.fillRect(x0,pianoTop,640,keyH);
    for(let i=0;i<range;i++){
      const midi=low+i, black=[1,3,6,8,10].includes(midi%12), active=notes.some(n=>n.midi===midi&&elapsedMs>=n.start&&elapsedMs<=n.end);
      const x=x0+i*keyW;
      ctx.fillStyle=active?'#bca8ff':black?'#2b2746':'#f3f0fc';
      ctx.fillRect(x+1,pianoTop+2,keyW-2,black?92:141);
    }
    ctx.strokeStyle='#b5a8f8';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0,pianoTop);ctx.lineTo(x0+640,pianoTop);ctx.stroke();
    ctx.fillStyle='#e2ddf5';ctx.font='600 23px system-ui';ctx.textAlign='center';
    const sec=Math.max(0,Math.floor(elapsed));ctx.fillText(`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`,360,1154);
    ctx.fillStyle='#948daf';ctx.font='18px system-ui';ctx.fillText('Original performance · Recorded in your browser',360,1201);
  }
  function scheduleAudio(ctx,destination,notes,lead){
    for(const n of notes){
      const start=lead+n.start/1000,end=lead+Math.max(n.end,n.start+40)/1000;
      const f=440*Math.pow(2,(n.midi-69)/12);
      const g=ctx.createGain();g.gain.setValueAtTime(.0001,start);
      g.gain.exponentialRampToValueAtTime(.14,start+.015);
      const decay=Math.min(end-.005,start+.38);
      if(decay>start+.018)g.gain.exponentialRampToValueAtTime(.05,decay);
      g.gain.setValueAtTime(.05,end);g.gain.exponentialRampToValueAtTime(.0001,end+.25);
      g.connect(destination);
      for(const [multiple,volume] of [[1,1],[2,.18],[3,.05]]){
        const o=ctx.createOscillator(),a=ctx.createGain();o.type=multiple===1?'triangle':'sine';o.frequency.value=f*multiple;a.gain.value=volume;o.connect(a);a.connect(g);o.start(start);o.stop(end+.32);
      }
    }
  }
  async function exportVideo(){
    if(!take || capturing || exporting)return;
    const chosen=formatChoice();
    if(!chosen){status('This browser cannot record canvas video. MIDI download still works; try current Chrome, Edge or Safari for video.');return;}
    const AudioCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtor){status('This browser cannot render audio. MIDI export is still available.');return;}
    const notes=noteIntervals(take);if(!notes.length)return;
    exporting=true;shouldCancel=false;stopReplay();resetVideo();updateUI();controls.progress.value=0;
    status('Rendering locally in real time. Keep this tab visible.');
    let audioCtx=null,stream=null,recorder=null,animation=0;
    const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1280;
    try{
      const context=canvas.getContext('2d',{alpha:false});if(!context)throw new Error('Canvas unavailable');
      const title=(controls.title.value||'My Piano Session').trim().slice(0,60);
      drawFrame(context,0,notes,title);
      audioCtx=new AudioCtor();await audioCtx.resume();
      const destination=audioCtx.createMediaStreamDestination();
      const lead=.42;
      // Normalize to 0.14 peak per voice; sum may clip for very dense chords, so use a shared master limiter.
      const gain=audioCtx.createGain();gain.gain.value=.65;gain.connect(destination);
      scheduleAudio(audioCtx,gain,notes,audioCtx.currentTime+lead);
      const canvasStream=canvas.captureStream(24);
      stream=new MediaStream([...canvasStream.getVideoTracks(),...destination.stream.getAudioTracks()]);
      const recorderOptions={mimeType:chosen,videoBitsPerSecond:2400000,audioBitsPerSecond:128000};
      recorder=new MediaRecorder(stream,recorderOptions);
      const pieces=[];let recorderError=null;
      const settled=new Promise(resolve=>{
        recorder.ondataavailable=e=>{if(e.data?.size)pieces.push(e.data);};
        recorder.onerror=e=>{recorderError=e.error||new Error('Video recorder failed');};
        recorder.onstop=resolve;
      });
      recorder.start(250);
      const begins=performance.now()+lead*1000;
      const total=Math.max(3400,take.duration+900);
      await new Promise((resolve,reject)=>{
        const frame=()=>{
          if(shouldCancel){reject(new Error('Cancelled'));return;}
          if(document.hidden){reject(new Error('Keep the tab visible while exporting video.'));return;}
          const elapsed=Math.max(0,performance.now()-begins);
          drawFrame(context,elapsed/1000,notes,title);
          controls.progress.value=Math.min(100,Math.round(elapsed/total*100));
          if(elapsed>=total){resolve();return;}
          animation=requestAnimationFrame(frame);
        };
        frame();
      });
      if(recorder.state!=='inactive')recorder.stop();
      await settled;
      if(recorderError)throw recorderError;
      const extension=chosen.startsWith('video/mp4')?'mp4':'webm';
      const blob=new Blob(pieces,{type:recorder.mimeType||chosen});
      if(!blob.size)throw new Error('No video data returned');
      videoFile=new File([blob],safeFilename(title)+'.'+extension,{type:blob.type});
      previewUrl=URL.createObjectURL(videoFile);controls.preview.src=previewUrl;controls.preview.hidden=false;
      controls.format.textContent=extension==='mp4'?'MP4 ready — download or share.':'WebM ready — some social apps require MP4; upload only if the app accepts WebM.';
      controls.progress.value=100;
      status(`Video created locally (${(blob.size/1048576).toFixed(1)} MB). Nothing was uploaded.`);
    }catch(error){status(error.message==='Cancelled'?'Video rendering cancelled.':`Video export failed: ${error.message}. MIDI download is still available.`);}
    finally{
      cancelAnimationFrame(animation);
      if(recorder&&recorder.state!=='inactive'){try{recorder.stop();}catch{}}
      stream?.getTracks().forEach(track=>track.stop());
      try{await audioCtx?.close();}catch{}
      exporting=false;shouldCancel=false;updateUI();
    }
  }
  function downloadVideo(){if(!videoFile)return;downloadBlob(videoFile,videoFile.name);status('Video downloaded. Upload it manually in TikTok, X or Shorts.');}
  async function shareVideo(){
    if(!videoFile)return;
    if(typeof navigator.share!=='function'||typeof navigator.canShare!=='function'||!navigator.canShare({files:[videoFile]})){
      status('File sharing is not available in this browser. Download your video, then upload it in TikTok or X.');return;
    }
    try{await navigator.share({files:[videoFile],title:(controls.title.value||'My Piano Session').slice(0,60)});status('System share sheet closed. Check the destination app for posting status.');}
    catch(error){if(error.name!=='AbortError')status('System share was unavailable; please download and upload manually.');}
  }
  controls.record.addEventListener('click',startRecord);
  controls['end-record'].addEventListener('click',endRecord);
  controls.replay.addEventListener('click',replay);
  controls.midi.addEventListener('click',midi);
  controls.export.addEventListener('click',exportVideo);
  controls['cancel-export'].addEventListener('click',()=>{shouldCancel=true;});
  controls.share.addEventListener('click',shareVideo);
  controls.download.addEventListener('click',downloadVideo);
  window.addEventListener('pagehide',()=>{clearTimeout(timeout);clearInterval(timer);cancelAnimationFrame(playFrame);shouldCancel=true;resetVideo();});
  window.addEventListener('blur',()=>{if(playing){stopReplay();status('Replay paused when window lost focus.');}});
  if(!formatChoice())controls.format.textContent='Video recording is not supported by this browser; MIDI export remains available.';
  updateUI();
  return {noteOn,noteOff};
}
