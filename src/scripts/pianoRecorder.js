import {MAX_RECORDING_MS, normalizeEvents, noteIntervals, encodeMidi, safeFilename, chooseVideoFormat} from '../lib/recording.mjs';
import { CORE_BASE, MP4_WIDTH, MP4_HEIGHT, mp4Args, isSocialMp4 } from '../lib/videoConversion.mjs';
import { renderPerformanceFrame } from '../lib/performanceVideo.mjs';

/** Browser-only recording studio; no upload, cookie, account or third-party API. */
export function setupPianoRecorder({on,off,stop,onCaptureStart,onCaptureEnd}) {
  const el = id => document.getElementById(id);
  const root = el('vp-recording-studio');
  if (!root) return {noteOn(){},noteOff(){}};
  const controls = Object.fromEntries(['record','end-record','replay','midi','export','share','download','cancel-export','convert-mp4','cancel-mp4','mp4-info','download-webm','theme','show-chords','poster','title','message','clock','preview','progress','format'].map(k => [k,el('vp-'+k)]));
  let capturing=false, captured=[],startedAt=0,timer=null,timeout=null,take=null,videoGuide=null;
  let playing=false,playFrame=0,playStart=0,playIndex=0;
  let exporting=false,shouldCancel=false,previewUrl=null,videoFile=null,originalWebmFile=null;
  let converting=false,cancelMp4=false,ffmpegWorker=null,coreAbortController=null;

  function status(message) { controls.message.textContent=message; }
  function clock(ms) { const sec=Math.max(0,Math.floor(ms/1000));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`; }
  function updateUI(){
    const hasNotes=Boolean(take && noteIntervals(take).length);
    controls.record.disabled=capturing||exporting||converting;
    controls['end-record'].disabled=!capturing;
    controls.replay.disabled=!hasNotes||capturing||exporting||converting;
    controls.midi.disabled=!hasNotes||capturing||exporting||converting;
    controls.export.disabled=!hasNotes||capturing||exporting||converting;
    controls.share.disabled=!videoFile||capturing||exporting||converting;
    controls.download.disabled=!videoFile||capturing||exporting||converting;
    controls['cancel-export'].hidden=!exporting;
    controls['convert-mp4'].hidden=!videoFile||!videoFile.type.startsWith('video/webm');
    controls['convert-mp4'].disabled=!videoFile||capturing||exporting||converting;
    controls['cancel-mp4'].hidden=!converting;
    controls['download-webm'].hidden=!originalWebmFile||videoFile===originalWebmFile;
    controls['download-webm'].disabled=!originalWebmFile||capturing||exporting||converting;
    controls.record.classList.toggle('is-recording',capturing);
    controls.replay.textContent=playing?'■ Stop replay':'▶ Replay';
    controls.export.textContent=exporting?'Rendering video…':'🎬 Create 9:16 video';
    controls['convert-mp4'].textContent=converting?'Converting to MP4…':'Convert to MP4 on this device';
  }
  function resetVideo(){if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;videoFile=null;originalWebmFile=null;controls.preview.removeAttribute('src');controls.preview.hidden=true;controls.format.textContent='';controls['mp4-info'].textContent='';}
  function stopReplay(){
    if(!playing)return;
    playing=false;cancelAnimationFrame(playFrame);
    stop();updateUI();
  }
  function startRecord(){
    if(exporting||converting)return;
    stopReplay();stop();resetVideo();controls.poster.hidden=true;
    captured=[];take=null;videoGuide=null;capturing=true;startedAt=performance.now();
    controls.clock.textContent='00:00';
    status('Recording locally. Play the piano; stop when finished (90-second maximum).');
    timer=setInterval(()=>{controls.clock.textContent=clock(Math.min(MAX_RECORDING_MS,performance.now()-startedAt));},120);
    timeout=setTimeout(endRecord,MAX_RECORDING_MS);
    updateUI();
    try{videoGuide=onCaptureStart?.()||null;}catch{videoGuide=null; /* Solo recording remains available. */ }
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
    updatePoster();updateUI();
    try{
      if(onCaptureEnd?.(take)===false){videoGuide=null;updatePoster();}
    }catch{
      videoGuide=null;updatePoster();
      status('Recording saved; practice assessment unavailable. MIDI and video export still work.');
    }
  }
  function noteOn(midi){if(capturing)captured.push({type:'on',midi,t:performance.now()-startedAt});}
  function noteOff(midi){if(capturing)captured.push({type:'off',midi,t:performance.now()-startedAt});}
  function replay(){
    if(capturing||exporting||converting||!take)return;
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
    return chooseVideoFormat(type=>MediaRecorder.isTypeSupported(type));
  }
  function drawFrame(context,elapsed,notes,title){
    renderPerformanceFrame(context,elapsed,notes,title,{
      theme:controls.theme.value,durationMs:take?.duration||0,
      showChordLabels:controls['show-chords'].checked,guide:videoGuide
    });
  }
  function updatePoster(){
    if(!take || !noteIntervals(take).length){controls.poster.hidden=true;return;}
    const notes=noteIntervals(take),context=controls.poster.getContext('2d',{alpha:false});
    if(!context)return;
    const title=(controls.title.value||'My Piano Session').trim();
    drawFrame(context,(notes[0].start+100)/1000,notes,title);
    controls.poster.hidden=false;
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
    if(!take || capturing || exporting || converting)return;
    const chosen=formatChoice();
    if(!chosen){status('This browser cannot record canvas video. MIDI download still works; try current Chrome, Edge or Safari for video.');return;}
    const AudioCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtor){status('This browser cannot render audio. MIDI export is still available.');return;}
    const notes=noteIntervals(take);if(!notes.length)return;
    exporting=true;shouldCancel=false;stopReplay();resetVideo();updateUI();controls.progress.value=0;
    status('Rendering locally in real time. Keep this tab visible.');
    let audioCtx=null,stream=null,recorder=null,animation=0,metadataWarning=false;
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
      const canvasStream=canvas.captureStream(24);
      stream=new MediaStream([...canvasStream.getVideoTracks(),...destination.stream.getAudioTracks()]);
      const recorderOptions={mimeType:chosen.mimeType,videoBitsPerSecond:2400000,audioBitsPerSecond:128000};
      recorder=new MediaRecorder(stream,recorderOptions);
      const pieces=[];let recorderError=null;
      const settled=new Promise(resolve=>{
        recorder.ondataavailable=e=>{if(e.data?.size)pieces.push(e.data);};
        recorder.onerror=e=>{recorderError=e.error||new Error('Video recorder failed');};
        recorder.onstop=resolve;
      });
      recorder.start(250);
      const recordingStartedAt=performance.now();
      // Schedule sound after MediaRecorder starts so visuals and audio share an origin.
      scheduleAudio(audioCtx,gain,notes,audioCtx.currentTime+lead);
      const begins=recordingStartedAt+lead*1000;
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
      const actualMime=(recorder.mimeType||chosen.mimeType).toLowerCase();
      const extension=actualMime.startsWith('video/mp4')?'mp4':'webm';
      let blob=new Blob(pieces,{type:actualMime});
      if(!blob.size)throw new Error('No video data returned');
      if(extension==='webm'){
        try{
          // MediaRecorder frequently omits the Matroska Duration element.
          // Repairing it makes downloads seekable without any media upload.
          const {fixWebmDuration}=await import('@fix-webm-duration/fix');
          const fixed=await fixWebmDuration(blob,Math.max(1,Math.round(performance.now()-recordingStartedAt)),{logger:false});
          blob=new Blob([fixed],{type:actualMime});
        }catch(error){console.warn('WebM duration metadata repair failed',error);metadataWarning=true;}
      }
      if(extension==='mp4'){
        // A declared MP4 MIME type alone does not prove H.264/AAC.
        if(!isSocialMp4(new Uint8Array(await blob.arrayBuffer())))
          throw new Error('Browser did not create a verified H.264/AAC MP4; try another browser');
      }
      videoFile=new File([blob],safeFilename(title)+'.'+extension,{type:blob.type});
      originalWebmFile=extension==='webm'?videoFile:null;
      previewUrl=URL.createObjectURL(videoFile);controls.preview.src=previewUrl;controls.preview.hidden=false;
      controls.format.textContent=extension==='mp4' && chosen.socialCompatible?'H.264/AAC MP4 requested; verify playback before posting.':metadataWarning?'WebM created, but duration metadata repair failed. Consider MP4 conversion.':'Seekable WebM ready. For TikTok / X, select Convert to MP4 for a more compatible format.';
      controls['mp4-info'].textContent=extension==='webm'?'Optional MP4 conversion downloads an open-source engine (~30 MB) on first use. Conversion stays on this device; it may be slow or run out of memory on phones.':'';
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

  async function convertMp4(){
    if(converting||exporting||capturing||!videoFile||!videoFile.type.startsWith('video/webm'))return;
    const sourceFile=videoFile;
    converting=true;cancelMp4=false;controls.progress.value=0;updateUI();
    status('Preparing local MP4 converter. The engine downloads about 30 MB on first use; your video is not uploaded.');
    let ffmpeg=null;
    const temporaryUrls=[];
    const requestController=new AbortController();
    coreAbortController=requestController;
    const downloadCore=async(filename,mime)=>{
      const response=await fetch(`${CORE_BASE}/${filename}`,{signal:requestController.signal});
      if(!response.ok)throw new Error(`Encoder download failed (HTTP ${response.status})`);
      const downloaded=await response.blob();
      if(cancelMp4)throw new Error('Cancelled');
      const url=URL.createObjectURL(new Blob([downloaded],{type:mime}));
      temporaryUrls.push(url);
      return url;
    };
    try{
      // Lazy-load the worker wrapper and a pinned single-thread encoder core.
      const [{FFmpeg},{fetchFile}]=await Promise.all([import('@ffmpeg/ffmpeg'),import('@ffmpeg/util')]);
      if(cancelMp4)return;
      ffmpeg=new FFmpeg();ffmpegWorker=ffmpeg;
      ffmpeg.on('progress',({progress})=>{
        if(Number.isFinite(progress)&&converting)controls.progress.value=Math.max(1,Math.min(99,Math.round(progress*100)));
      });
      status('Downloading encoder (part 1 of 2)…');
      const coreURL=await downloadCore('ffmpeg-core.js','text/javascript');
      if(cancelMp4)return;
      status('Downloading WebAssembly encoder (~30 MB). You may cancel now.');
      const wasmURL=await downloadCore('ffmpeg-core.wasm','application/wasm');
      if(cancelMp4)return;
      await ffmpeg.load({coreURL,wasmURL});
      if(cancelMp4)return;
      status('Encoding H.264 video and AAC audio locally. Keep the tab open; this can be intensive on mobile.');
      await ffmpeg.writeFile('take.webm',await fetchFile(sourceFile));
      if(cancelMp4)return;
      const exitCode=await ffmpeg.exec(mp4Args());
      if(cancelMp4)return;
      if(exitCode!==0)throw new Error('The encoder did not complete successfully');
      const mp4=await ffmpeg.readFile('take.mp4');
      if(!isSocialMp4(mp4))throw new Error('MP4 video or audio codec validation failed');
      const converted=new File([mp4],safeFilename(controls.title.value)+'.mp4',{type:'video/mp4'});
      if(previewUrl)URL.revokeObjectURL(previewUrl);
      videoFile=converted;previewUrl=URL.createObjectURL(converted);
      controls.preview.src=previewUrl;controls.preview.hidden=false;
      controls.format.textContent='Verified H.264/AAC MP4 ready ('+MP4_WIDTH+' × '+MP4_HEIGHT+'). Download or share and check playback in the destination app.';
      controls['mp4-info'].textContent='Converted on this device; no recording was uploaded.';
      controls.progress.value=100;
      status('MP4 ready ('+(mp4.length/1048576).toFixed(1)+' MB).');
    }catch(error){
      status(cancelMp4?'Conversion cancelled. Original WebM is still available.':'MP4 conversion failed: '+error.message+'. Original WebM is still available.');
    }finally{
      requestController.abort();
      temporaryUrls.forEach(url=>URL.revokeObjectURL(url));
      try{ffmpeg?.terminate();}catch{}
      ffmpegWorker=null;coreAbortController=null;converting=false;cancelMp4=false;updateUI();
    }
  }
  function cancelMp4Conversion(){
    if(!converting)return;
    cancelMp4=true;status('Stopping conversion; your WebM is unchanged.');
    coreAbortController?.abort();
    try{ffmpegWorker?.terminate();}catch{}
  }
  function downloadVideo(){if(!videoFile)return;downloadBlob(videoFile,videoFile.name);status('Video downloaded. Upload it manually in TikTok, X or Shorts.');}
  function downloadOriginalWebm(){
    if(!originalWebmFile)return;
    downloadBlob(originalWebmFile,originalWebmFile.name);
    status('Original WebM downloaded; converted MP4 is also available.');
  }
  async function shareVideo(){
    if(!videoFile)return;
    if(typeof navigator.share!=='function'||typeof navigator.canShare!=='function'||!navigator.canShare({files:[videoFile]})){
      status('File sharing is not available in this browser. Download your video, then upload it in TikTok or X.');return;
    }
    try{await navigator.share({files:[videoFile],title:(controls.title.value||'My Piano Session').slice(0,60)});status('System share sheet closed. Check the destination app for posting status.');}
    catch(error){if(error.name!=='AbortError')status('System share was unavailable; please download and upload manually.');}
  }
  controls.theme.addEventListener('change',()=>{updatePoster();status('Video style updated. Export again to apply it to the file.');});
  controls['show-chords'].addEventListener('change',()=>{
    updatePoster();status('Chord captions updated in the preview. Export again to apply this choice to your video.');
  });
  controls.title.addEventListener('input',updatePoster);
  controls.record.addEventListener('click',startRecord);
  controls['end-record'].addEventListener('click',endRecord);
  controls.replay.addEventListener('click',replay);
  controls.midi.addEventListener('click',midi);
  controls.export.addEventListener('click',exportVideo);
  controls['convert-mp4'].addEventListener('click',convertMp4);
  controls['cancel-mp4'].addEventListener('click',cancelMp4Conversion);
  controls['download-webm'].addEventListener('click',downloadOriginalWebm);
  controls['cancel-export'].addEventListener('click',()=>{shouldCancel=true;});
  controls.share.addEventListener('click',shareVideo);
  controls.download.addEventListener('click',downloadVideo);
  window.addEventListener('pagehide',()=>{clearTimeout(timeout);clearInterval(timer);cancelAnimationFrame(playFrame);shouldCancel=true;cancelMp4Conversion();resetVideo();});
  window.addEventListener('blur',()=>{if(playing){stopReplay();status('Replay paused when window lost focus.');}});
  const initialFormat=formatChoice();
  if(!initialFormat)controls.format.textContent='Video export is unavailable in this browser; MIDI export remains available.';
  else if(initialFormat.extension==='webm')controls.format.textContent='This browser exports WebM. TikTok/X may require H.264/AAC MP4; local conversion may be needed.';
  updateUI();
  return {noteOn,noteOff};
}
