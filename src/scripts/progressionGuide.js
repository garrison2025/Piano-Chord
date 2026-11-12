/** Progression guide controls only visual hints. It never synthesizes or records notes. */
import {parsePractice,serializePractice,practiceHintMidis,matchesPracticeNotes} from '../lib/practiceTransfer.mjs';
import {prettyNote,findChordMatches} from '../lib/music.js';
import {parseSeventhTransfer,seventhHintMidis} from '../lib/seventhTransfer.mjs';
import {assessGuidedTake} from '../lib/practiceAssessment.mjs';
export function setupProgressionGuide({keys,scroll}){
  const seventh=parseSeventhTransfer(window.location.search);
  const regular=seventh?null:parsePractice(window.location.search);
  const data=seventh||regular;
  const el=id=>document.getElementById(id),section=el('piano-practice');
  if(!data||!section)return {noteOn(){},stop(){},recordingStart(){},recordingEnd(){}};
  const isSeventh=Boolean(seventh),steps=isSeventh?seventh.steps:regular.steps;
  const cards=el('practice-bars'),status=el('practice-status'),current=el('practice-current'),start=el('practice-start');
  let index=0,active=false,timer=null,matched=new Set(),deadline=0;
  let armed=false,guideRecording=false,guideInvalid=false,lastReportText='';
  const report=el('practice-report'),reportBars=el('practice-report-bars'),
    reportSummary=el('practice-report-summary'),reportCount=el('practice-report-count'),
    reportNotice=el('practice-report-notice'),copyFallback=el('practice-report-text');
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
    const items=result.bars.map(bar=>{
      const li=document.createElement('li');
      li.className='practice-result-card';li.dataset.status=bar.status;
      const heading=document.createElement('small');
      heading.textContent='BAR '+(bar.index+1)+' · '+(
        bar.matched?'MATCHED':bar.status==='not-reached'?'NOT REACHED':'NOT MATCHED');
      const symbol=document.createElement('strong');symbol.textContent=bar.symbol;
      const detail=document.createElement('span');
      detail.textContent=bar.matched?'Detected on beat '+bar.beat+' (+'+(bar.firstMatchMs/1000).toFixed(2)+' s from bar start)':
        bar.status==='not-reached'?'The recording ended before this bar.':'No complete chord held for 45 ms in this bar.';
      li.append(heading,symbol,detail);return li;
    });
    reportBars.replaceChildren(...items);
    lastReportText=reportText(result);
    reportNotice.textContent='Chord coverage counts exact pitch classes held together for at least 45 ms within each bar. It is not a skill or rhythm score.';
    report.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  section.hidden=false;
  el('practice-kicker').textContent=isSeventh?'SEVENTH-CHORD PIANO PRACTICE':'YOUR FOUR-BAR PRACTICE';
  el('practice-title').textContent=isSeventh?'Play the seventh chords. Record your take.':'Follow the chords. Play your own part.';
  el('practice-caption').textContent=isSeventh?'Four-note chord hints are silent. Any inversion or octave counts. Only your own playing is recorded.':'Colored keys are silent hints. Only notes you play are recorded; the guide never adds accompaniment to MIDI or video.';
  el('practice-edit').href=isSeventh?'/guides/seventh-chords-piano/#cadence':'/tools/chord-progressions/?'+serializePractice(data);
  el('practice-edit').textContent=isSeventh?'Back to seventh lesson ↗':'Edit in trainer ↗';
  cards.classList.toggle('is-three',steps.length===3);
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
    const c=keys.get(isSeventh?Math.min(...hint):60);
    if(c)scroll.scrollTo({left:Math.max(0,c.offsetLeft-18),behavior:'instant'});
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
    status.textContent=matched.has(index)?'✓ Correct chord. Repeat or choose another bar.':isSeventh?'Play all four pitch classes. Other octaves and inversions count.':'Play all highlighted notes together. You may use another octave.';
    highlight();
  }
  function stopGuide(quiet=false){
    if(timer!==null)clearTimeout(timer);
    timer=null;active=false;start.textContent='▶ Start timed guide';
    if(!quiet)status.textContent='Timed guide stopped. Continue manually or restart.';
  }
  function nextTimedBar(){
    if(!active)return;
    deadline+=4*60000/data.bpm;
    timer=setTimeout(()=>{
      if(!active)return;
      if(index===steps.length-1){
        stopGuide(true);
        status.textContent=steps.length+'-bar practice complete · '+matched.size+'/'+steps.length+' chords matched. Stop recording to export your take.';
      }else{
        setBar(index+1);
        nextTimedBar();
      }
    },Math.max(0,deadline-performance.now()));
  }
  function begin(){
    stopGuide(true);matched=new Set();index=0;active=true;
    start.textContent='↻ Restart guide';deadline=performance.now();
    setBar(0);nextTimedBar();
  }
  start.addEventListener('click',()=>{markChanged();begin();});
  el('practice-stop').addEventListener('click',()=>{markChanged();stopGuide();});
  el('practice-prev').addEventListener('click',()=>{markChanged();stopGuide(true);setBar(index-1);});
  el('practice-next').addEventListener('click',()=>{markChanged();stopGuide(true);setBar(index+1);});
  el('practice-record').addEventListener('click',()=>{
    const record=el('vp-record');
    if(record.disabled){status.textContent='Finish the current recording or export before starting another.';return;}
    stopGuide(true);
    armed=true;
    record.click();
    if(!guideRecording){armed=false;status.textContent='Recording did not start. Try again.';return;}
    begin();
    status.textContent='Recording guided practice. Hold the target chord during each bar; only your notes enter MIDI and video.';
    document.getElementById('playable-piano').scrollIntoView({behavior:'smooth',block:'center'});
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){markChanged();stopGuide();}});
  window.addEventListener('pagehide',()=>stopGuide(true));
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
  return {
    recordingStart(){
      guideRecording=armed;armed=false;guideInvalid=false;clearReport();
    },
    recordingEnd(take){
      const scored=guideRecording,invalid=guideInvalid;
      guideRecording=false;guideInvalid=false;armed=false;
      stopGuide(true);
      if(!scored)return;
      if(invalid){
        status.textContent='Guide changed during recording, so timed chord coverage was not calculated. MIDI and video exports still work.';
        return;
      }
      try{
        const result=assessGuidedTake(take,steps,data.bpm);
        showReport(result);
        status.textContent='Recording reviewed: '+result.matched+'/'+result.total+' chords matched. See the practice report.';
      }catch{
        status.textContent='Recording saved, but practice assessment was unavailable. MIDI and video exports still work.';
      }
    },
    noteOn(midis){
      if(matched.has(index))return;
      if(!matchesPracticeNotes(midis,steps[index])){
        if(isSeventh&&new Set(midis.map(x=>x%12)).size===4){
          const heard=findChordMatches(midis).filter(x=>x.notes.length===4).map(x=>x.symbol);
          status.textContent=heard.length?'Heard '+heard.join(' / ')+'. Target: '+steps[index].symbol+'.':'Four notes held; target is '+steps[index].symbol+'.';
        }
        return;
      }
      matched.add(index);setBar(index);
      status.textContent='✓ Correct '+steps[index].symbol+' chord. '+matched.size+' of '+steps.length+' bars matched.';
    },
    stop:()=>stopGuide(true)
  };
}
