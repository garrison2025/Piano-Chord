/** Visual practice guide: it never inserts backing chords into a performance. */
import {parsePractice,serializePractice,practiceHintMidis,matchesPracticeNotes} from '../lib/practiceTransfer.mjs';
import {prettyNote,findChordMatches} from '../lib/music.js';
import {parseSeventhTransfer,seventhHintMidis} from '../lib/seventhTransfer.mjs';
import {assessGuidedTake} from '../lib/practiceAssessment.mjs';
import {countInPosition,guidePosition,COUNT_IN_BEATS} from '../lib/practiceTiming.mjs';
import {createStudyAudio} from './studyAudio.js';

export function setupProgressionGuide({keys,scroll}){
  const seventh=parseSeventhTransfer(window.location.search);
  const regular=seventh?null:parsePractice(window.location.search);
  const data=seventh||regular;
  const el=id=>document.getElementById(id),section=el('piano-practice');
  if(!data||!section)return {noteOn(){},stop(){},recordingStart(){},recordingEnd(){}};
  const isSeventh=Boolean(seventh),steps=data.steps,beatMs=60000/data.bpm;
  const cards=el('practice-bars'),status=el('practice-status'),current=el('practice-current');
  const start=el('practice-start'),recordButton=el('practice-record'),
    cancelButton=el('practice-count-cancel'),clickToggle=el('practice-clicks');
  const hud=el('vp-practice-hud'),hudLabel=el('vp-practice-hud-label'),
    hudTitle=el('vp-practice-hud-title'),hudStop=el('vp-practice-stop-take'),
    hudCancel=el('vp-practice-cancel');
  const report=el('practice-report'),reportBars=el('practice-report-bars'),
    reportSummary=el('practice-report-summary'),reportCount=el('practice-report-count'),
    reportNotice=el('practice-report-notice'),copyFallback=el('practice-report-text');

  let index=0,active=false,counting=false,guideRecording=false,guideInvalid=false,armed=false;
  let interval=null,startAt=0,runToken=0,shownBeat=-1,nextSoundBeat=0,audioReady=false;
  let matched=new Set(),lastReportText='';
  const clicks=createStudyAudio();
  const pulseBoxes=[el('practice-pulse'),el('vp-practice-pulse')];
  const pulseNumbers=[el('practice-count-number'),el('vp-practice-count-number')];
  const pulseCaptions=[el('practice-pulse-caption'),el('vp-practice-pulse-caption')];

  section.hidden=false;hud.hidden=false;
  hudLabel.textContent=isSeventh?'SEVENTH-CHORD PRACTICE':'FOUR-BAR PRACTICE';
  el('practice-kicker').textContent=isSeventh?'SEVENTH-CHORD PIANO PRACTICE':'YOUR FOUR-BAR PRACTICE';
  el('practice-title').textContent=isSeventh?'Play the seventh chords. Record your take.':'Follow the chords. Play your own part.';
  el('practice-caption').textContent=isSeventh?'Four-note chord hints are silent. Any inversion or octave counts. Only your own playing is recorded.':'Colored keys are silent hints. Only notes you play are recorded; the guide never adds accompaniment to MIDI or video.';
  el('practice-edit').href=isSeventh?'/guides/seventh-chords-piano/#cadence':'/tools/chord-progressions/?'+serializePractice(data);
  el('practice-edit').textContent=isSeventh?'Back to seventh lesson ↗':'Edit in trainer ↗';
  hudTitle.textContent='Ready · '+steps[0].symbol;
  cards.classList.toggle('is-three',steps.length===3);

  function clearReport(){
    report.hidden=true;reportBars.replaceChildren();lastReportText='';
    copyFallback.hidden=true;copyFallback.value='';reportNotice.textContent='';
  }
  function markChanged(){if(guideRecording)guideInvalid=true;}

  function reportText(result){
    return ['Piano Chord practice: '+(data.label||data.key?.root+' '+data.mode),
      result.matched+' of '+result.total+' bars matched at '+result.bpm+' BPM ('+result.coveragePercent+'% chord coverage)',
      ...result.bars.map(bar=>'Bar '+(bar.index+1)+' '+bar.symbol+': '+
        (bar.matched?'matched (beat '+bar.beat+', +'+(bar.firstMatchMs/1000).toFixed(2)+' s)':
          bar.status==='not-reached'?'not reached':'not matched')),
      result.complete?'Full timed sequence recorded':'Partial take — stopped before the timed sequence ended',
      'Based on held MIDI notes, not a grade of musical expression.'].join('\n');
  }
  function showReport(result){
    report.hidden=false;
    reportCount.textContent=result.matched+' / '+result.total;
    reportSummary.textContent='Matched '+result.matched+' of '+result.total+' scheduled bars ('+
      result.coveragePercent+'% chord coverage). '+(result.complete?
      'Entire timed sequence recorded.':'Partial take: some bars may not have been reached.');
    reportBars.replaceChildren(...result.bars.map(bar=>{
      const item=document.createElement('li');item.className='practice-result-card';item.dataset.status=bar.status;
      const heading=document.createElement('small');
      heading.textContent='BAR '+(bar.index+1)+' · '+(bar.matched?'MATCHED':
        bar.status==='not-reached'?'NOT REACHED':'NOT MATCHED');
      const symbol=document.createElement('strong');symbol.textContent=bar.symbol;
      const detail=document.createElement('span');
      detail.textContent=bar.matched?'Detected on beat '+bar.beat+' (+'+(bar.firstMatchMs/1000).toFixed(2)+' s from bar start)':
        bar.status==='not-reached'?'The recording ended before this bar.':'No complete chord held for 45 ms in this bar.';
      item.append(heading,symbol,detail);return item;
    }));
    lastReportText=reportText(result);
    reportNotice.textContent='Chord coverage checks exact simultaneous pitch classes held for 45 ms or more. It is not a rhythm or skill grade.';
    report.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }

  function showPulse(phase,number,caption,beat){
    for(let i=0;i<pulseBoxes.length;i++){
      const box=pulseBoxes[i];box.dataset.phase=phase;
      if(pulseNumbers[i].textContent!==number)pulseNumbers[i].textContent=number;
      if(pulseCaptions[i].textContent!==caption)pulseCaptions[i].textContent=caption;
      [...box.querySelectorAll('.practice-beat-dot')].forEach((dot,j)=>
        dot.classList.toggle('is-current',beat===j+1));
    }
    hudCancel.hidden=!counting;
    hudStop.hidden=!guideRecording;
    cancelButton.hidden=!counting;
    recordButton.disabled=counting;
    clickToggle.disabled=counting||active;
    hudTitle.textContent=phase==='countin'?'Get ready · '+steps[0].symbol:
      phase==='playing'?'Bar '+(index+1)+' · '+steps[index].symbol:
      phase==='finished'?'Sequence finished · '+steps[index].symbol:
      'Ready · '+steps[index].symbol;
  }
  function clearClock(){
    if(interval!==null)clearInterval(interval);
    interval=null;shownBeat=-1;nextSoundBeat=0;clicks.stop();
  }
  function scheduleClicks(anchor,maxBeats){
    if(!audioReady||!clickToggle.checked)return;
    const now=performance.now(),lookAhead=120;
    while(nextSoundBeat<maxBeats && anchor+nextSoundBeat*beatMs<=now+lookAhead){
      const at=anchor+nextSoundBeat*beatMs;
      if(at>=now-70) {
        try{clicks.tick(clicks.now()+Math.max(0,(at-now)/1000),nextSoundBeat%4===0,.42);}
        catch{audioReady=false;break;}
      }
      nextSoundBeat++;
    }
  }
  async function unlockOptionalClick(token){
    audioReady=false;
    if(!clickToggle.checked)return;
    try{
      await clicks.unlock();
      if(token===runToken)audioReady=true;
    }catch{
      clickToggle.checked=false;audioReady=false;
      if(token===runToken)status.textContent='Audio clicks are unavailable; visual beats will still work.';
    }
  }
  const nodes=steps.map((step,i)=>{
    const card=document.createElement('button');
    card.type='button';card.className='practice-bar';card.dataset.bar=String(i);
    card.setAttribute('aria-label','Bar '+(i+1)+': '+step.symbol);
    const number=document.createElement('small');number.textContent='BAR '+(i+1)+' · '+step.roman;
    const title=document.createElement('strong');title.textContent=step.symbol;
    const detail=document.createElement('span');detail.textContent=step.notes.map(prettyNote).join(' · ');
    card.append(number,title,detail);
    card.addEventListener('click',()=>{markChanged();stopGuide(true);setBar(i);});
    cards.append(card);return card;
  });

  function highlight(){
    const hint=new Set(isSeventh?seventhHintMidis(steps[index]):practiceHintMidis(steps[index]));
    keys.forEach((key,midi)=>key.classList.toggle('practice-target',hint.has(midi)));
    const key=keys.get(isSeventh?Math.min(...hint):60);
    if(key)scroll.scrollTo({left:Math.max(0,key.offsetLeft-18),behavior:'instant'});
  }
  function setBar(value){
    index=Math.max(0,Math.min(steps.length-1,value));
    nodes.forEach((card,i)=>{
      card.classList.toggle('is-current',i===index);
      card.classList.toggle('is-matched',matched.has(i));
      card.setAttribute('aria-current',i===index?'step':'false');
    });
    const chord=steps[index];
    current.textContent='Bar '+(index+1)+' of '+steps.length+' · '+chord.symbol+' · '+chord.notes.map(prettyNote).join(' / ');
    status.textContent=matched.has(index)?'✓ Correct chord. Repeat or choose another bar.':
      isSeventh?'Play all four pitch classes. Other octaves and inversions count.':
        'Play all highlighted notes together. You may use another octave.';
    highlight();
  }

  function cancelCountIn(announce=false){
    if(!counting)return;
    counting=false;runToken++;clearClock();
    start.textContent='▶ Start timed guide';
    showPulse('idle','READY',data.bpm+' BPM · 4/4 · four-beat count-in before recording',null);
    if(announce)status.textContent='Count-in cancelled. No recording was started.';
  }
  function stopGuide(quiet=false){
    if(counting)cancelCountIn(false);
    active=false;runToken++;clearClock();
    start.textContent='▶ Start timed guide';
    showPulse('idle','READY',data.bpm+' BPM · 4/4',null);
    if(!quiet)status.textContent='Timed guide stopped. Continue manually or restart.';
  }
  function guideFrame(){
    if(!active)return;
    const p=guidePosition(performance.now()-startAt,data.bpm,steps.length);
    if(p.complete){
      active=false;clearClock();
      start.textContent='▶ Start timed guide';
      showPulse('finished','DONE',steps.length+' bars · stop recording to review',null);
      status.textContent=steps.length+'-bar practice complete · '+matched.size+'/'+steps.length+
        ' chords matched. Stop recording to review your take.';
      return;
    }
    if(p.barIndex!==index)setBar(p.barIndex);
    scheduleClicks(startAt,steps.length*4);
    if(p.passedBeats!==shownBeat){
      shownBeat=p.passedBeats;
      showPulse('playing',String(p.beat),'BAR '+(p.barIndex+1)+' / '+steps.length+
        ' · '+data.bpm+' BPM',p.beat);
    }
  }
  function begin(){
    stopGuide(true);matched=new Set();index=0;active=true;
    start.textContent='↻ Restart guide';
    startAt=performance.now();setBar(0);
    showPulse('playing','1','BAR 1 / '+steps.length+' · '+data.bpm+' BPM',1);
    guideFrame();interval=setInterval(guideFrame,30);
  }
  async function beginTimedGuide(){
    if(counting)cancelCountIn(false);
    markChanged();stopGuide(true);
    const token=++runToken;
    await unlockOptionalClick(token);
    if(token!==runToken)return;
    begin();
  }
  async function startCountIn(){
    const recorder=el('vp-record');
    if(counting||recorder.disabled){
      status.textContent='Finish or export your current recording first.';
      return;
    }
    stopGuide(true);
    const token=++runToken;
    counting=true;armed=false;
    showPulse('countin','4','COUNT IN · 4 beats before recording',1);
    status.textContent='Get ready. Four beats, then recording begins on the next downbeat.';
    document.getElementById('playable-piano').scrollIntoView({
      behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',
      block:'start'});
    await unlockOptionalClick(token);
    if(!counting||token!==runToken)return;
    const anchor=performance.now();
    function frame(){
      if(!counting||token!==runToken)return;
      scheduleClicks(anchor,COUNT_IN_BEATS);
      const p=countInPosition(performance.now()-anchor,data.bpm);
      if(p.finished){
        counting=false;clearClock();
        armed=true;
        recorder.click();
        if(!guideRecording){
          armed=false;showPulse('idle','READY','Recording could not start',null);
          status.textContent='Recording did not start. Try again.';return;
        }
        begin();
        status.textContent='Recording guided practice. Follow the active chord and four beat lights; only your piano notes enter MIDI and video.';
        return;
      }
      if(p.beat!==shownBeat){
        shownBeat=p.beat;
        showPulse('countin',String(p.remaining),'COUNT IN · starts after beat 4',p.beat);
      }
    }
    frame();interval=setInterval(frame,25);
  }

  start.addEventListener('click',beginTimedGuide);
  el('practice-stop').addEventListener('click',()=>{markChanged();stopGuide();});
  el('practice-prev').addEventListener('click',()=>{markChanged();stopGuide(true);setBar(index-1);});
  el('practice-next').addEventListener('click',()=>{markChanged();stopGuide(true);setBar(index+1);});
  recordButton.addEventListener('click',startCountIn);
  cancelButton.addEventListener('click',()=>cancelCountIn(true));
  hudCancel.addEventListener('click',()=>cancelCountIn(true));
  hudStop.addEventListener('click',()=>{if(!el('vp-end-record').disabled)el('vp-end-record').click();});
  clickToggle.addEventListener('change',()=>{if(!clickToggle.checked)clicks.stop();});
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)return;
    if(counting)cancelCountIn(true);
    if(active){markChanged();stopGuide();}
  });
  window.addEventListener('pagehide',()=>{cancelCountIn();stopGuide(true);});

  el('practice-copy').addEventListener('click',async()=>{
    if(!lastReportText)return;
    try{
      if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(lastReportText);
      reportNotice.textContent='Results copied. Paste them alongside your performance video if you wish.';
    }catch{
      copyFallback.value=lastReportText;copyFallback.hidden=false;copyFallback.focus();copyFallback.select();
      reportNotice.textContent='Clipboard access is unavailable. Select and copy the results in the text field.';
    }
  });
  el('practice-save').addEventListener('click',()=>{
    if(!lastReportText)return;
    const blob=new Blob([lastReportText],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='piano-chord-practice-report.txt';link.hidden=true;
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
    reportNotice.textContent='Practice summary downloaded to your device.';
  });
  setBar(0);
  showPulse('idle','READY',data.bpm+' BPM · 4/4 · four-beat count-in',null);
  return {
    recordingStart(){
      // If the user starts the separate recording studio during count-in,
      // abort the guide so a solo recording can never receive a false timed score.
      if(counting&&!armed)cancelCountIn(true);
      if(active&&!armed)stopGuide(true);
      guideRecording=armed;armed=false;guideInvalid=false;clearReport();
      showPulse(guideRecording?'playing':'idle',guideRecording?'1':'READY',
        guideRecording?'BAR 1 / '+steps.length:'Solo recording',guideRecording?1:null);
      return guideRecording?{bpm:data.bpm,steps:steps.map(s=>({symbol:s.symbol,notes:[...s.notes]}))}:null;
    },
    recordingEnd(take){
      const scored=guideRecording,invalid=guideInvalid;
      guideRecording=false;guideInvalid=false;armed=false;
      stopGuide(true);
      if(!scored)return null;
      if(invalid){
        status.textContent='Guide timing changed during the recording, so chord coverage was not calculated. MIDI and video exports still work.';
        return false;
      }
      try{
        const result=assessGuidedTake(take,steps,data.bpm);
        showReport(result);
        status.textContent='Recording reviewed: '+result.matched+'/'+result.total+' scheduled chords matched. See the practice report.';
        return true;
      }catch{
        status.textContent='Recording saved, but practice assessment was unavailable. MIDI and video export still work.';
        return false;
      }
    },
    noteOn(midis){
      if(counting||matched.has(index))return;
      if(!matchesPracticeNotes(midis,steps[index])){
        if(isSeventh&&new Set(midis.map(x=>x%12)).size===4){
          const heard=findChordMatches(midis).filter(x=>x.notes.length===4).map(x=>x.symbol);
          status.textContent=heard.length?'Heard '+heard.join(' / ')+'. Target: '+steps[index].symbol+'.':
            'Four notes held; target is '+steps[index].symbol+'.';
        }
        return;
      }
      matched.add(index);setBar(index);
      status.textContent='✓ Correct '+steps[index].symbol+' chord. '+matched.size+' of '+steps.length+' bars matched.';
    },
    stop:()=>{cancelCountIn();stopGuide(true);}
  };
}
