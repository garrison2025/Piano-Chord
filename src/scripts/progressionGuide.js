/** Progression guide controls only visual hints. It never synthesizes or records notes. */
import {parsePractice,serializePractice,practiceHintMidis,matchesPracticeNotes} from '../lib/practiceTransfer.mjs';
import {prettyNote,findChordMatches} from '../lib/music.js';
import {parseSeventhTransfer,seventhHintMidis} from '../lib/seventhTransfer.mjs';
export function setupProgressionGuide({keys,scroll}){
  const seventh=parseSeventhTransfer(window.location.search);
  const regular=seventh?null:parsePractice(window.location.search);
  const data=seventh||regular;
  const el=id=>document.getElementById(id),section=el('piano-practice');
  if(!data||!section)return {noteOn(){},stop(){}};
  const isSeventh=Boolean(seventh),steps=isSeventh?seventh.steps:regular.steps;
  const cards=el('practice-bars'),status=el('practice-status'),current=el('practice-current'),start=el('practice-start');
  let index=0,active=false,timer=null,matched=new Set(),deadline=0;
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
    card.addEventListener('click',()=>{stopGuide(true);setBar(i);});
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
  start.addEventListener('click',begin);
  el('practice-stop').addEventListener('click',()=>stopGuide());
  el('practice-prev').addEventListener('click',()=>{stopGuide(true);setBar(index-1);});
  el('practice-next').addEventListener('click',()=>{stopGuide(true);setBar(index+1);});
  el('practice-record').addEventListener('click',()=>{
    const record=el('vp-record');
    if(record.disabled){status.textContent='Finish the current recording or export before starting another.';return;}
    record.click();begin();
    status.textContent='Recording your own notes. The silent guide is not part of the audio or MIDI.';
    document.getElementById('playable-piano').scrollIntoView({behavior:'smooth',block:'center'});
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)stopGuide();});
  window.addEventListener('pagehide',()=>stopGuide(true));
  setBar(0);
  return {
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
