/** Continuous scheduled Web Audio playback of selected seventh-chord sequences. */
import {SEVENTH_PATTERNS,seventhPattern,planSeventhPractice} from '../lib/seventhPractice.mjs';
import {createStudyAudio} from './studyAudio.js';
import {prettyNote} from '../lib/music.js';
import {serializeSeventhTransfer} from '../lib/seventhTransfer.mjs';

export function setupSeventhPractice(){
  const by=id=>document.getElementById(id),region=by('seventh-player');
  if(!region)return;
  const selection=by('seventh-pattern'),slider=by('seventh-tempo'),tempo=by('seventh-tempo-output');
  const click=by('seventh-click'),loop=by('seventh-loop'),start=by('seventh-start'),stop=by('seventh-stop');
  const bars=by('seventh-player-bars'),status=by('seventh-player-status'),pianoLink=by('seventh-piano-link');
  const audio=createStudyAudio();
  const timers=new Set();
  let running=false,session=0,current=null;
  selection.replaceChildren(...SEVENTH_PATTERNS.map(item=>new Option(item.label,item.id)));
  selection.value='ii-v-i';
  function clearTimers(){for(const t of timers)clearTimeout(t);timers.clear();}
  function later(fn,ms){
    const id=setTimeout(()=>{timers.delete(id);fn();},Math.max(0,ms));
    timers.add(id);
  }
  function updatePianoLink(){pianoLink.href='/tools/virtual-piano/?'+serializeSeventhTransfer({patternId:selection.value,bpm:Number(slider.value)});}
  function render(){
    const info=seventhPattern(selection.value);
    bars.replaceChildren(...info.bars.map((bar,i)=>{
      const card=document.createElement('div');card.className='seventh-play-bar';card.dataset.bar=String(i);
      card.setAttribute('role','listitem');card.setAttribute('aria-current','false');
      const number=document.createElement('small');number.textContent='BAR '+(i+1);
      const symbol=document.createElement('strong');symbol.textContent=prettyNote(bar.symbol);
      const notes=document.createElement('span');notes.textContent=bar.notes.map(prettyNote).join(' · ');
      card.append(number,symbol,notes);return card;
    }));
    current=info;
    updatePianoLink();
  }
  function clearHighlights(){
    for(const card of bars.children){card.classList.remove('is-current');card.setAttribute('aria-current','false');}
  }
  function halt(quiet=false){
    running=false;session++;clearTimers();audio.stop();clearHighlights();
    stop.disabled=true;start.textContent='▶ Play progression';
    if(!quiet)status.textContent='Playback stopped. Change the pattern or tempo, then play again.';
  }
  function showBar(i,number){
    clearHighlights();
    const card=bars.children[i];
    if(card){card.classList.add('is-current');card.setAttribute('aria-current','step');}
    const chord=current?.bars[i];
    if(chord)status.textContent='Playing bar '+(i+1)+' / '+current.bars.length+' · '+prettyNote(chord.symbol)+' · pass '+number+'.';
  }
  function schedule(startAt,nonce,pass=1){
    if(!running||nonce!==session)return;
    const plan=planSeventhPractice(selection.value,slider.value,startAt,{click:click.checked});
    for(const chord of plan.bars){
      audio.chord(chord.midi,chord.at,chord.holdSeconds);
      later(()=>{if(running&&nonce===session)showBar(chord.index,pass);},(chord.at-audio.now())*1000);
    }
    for(const tick of plan.ticks)audio.tick(tick.at,tick.accent,.44);
    // Queue the next cycle slightly before the current one finishes. WebAudio
    // retains the exact AudioContext timestamp across repeated cycles.
    later(()=>{
      if(!running||nonce!==session)return;
      if(loop.checked)schedule(plan.endSeconds,nonce,pass+1);
      else later(()=>{if(nonce!==session)return;halt(true);status.textContent='Completed '+plan.bars.length+' bars. Press Play to repeat.';},
        Math.max(0,(plan.endSeconds-audio.now())*1000));
    },Math.max(0,(plan.endSeconds-audio.now())*1000-190));
  }
  async function begin(){
    halt(true);
    const nonce=session;
    status.textContent='Preparing local piano audio…';
    try{await audio.unlock();}
    catch(err){if(nonce===session)status.textContent=err?.message||'Audio not available';return;}
    if(nonce!==session)return;
    running=true;stop.disabled=false;start.textContent='↻ Restart progression';
    schedule(audio.now()+.12,nonce);
  }
  selection.addEventListener('change',()=>{halt(true);render();status.textContent='Selected '+current.label+'.';});
  slider.addEventListener('input',()=>{tempo.textContent=slider.value+' BPM';updatePianoLink();if(running)halt(false);});
  start.addEventListener('click',begin);
  stop.addEventListener('click',()=>halt());
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&running){halt(true);status.textContent='Paused when this tab became hidden. Press Play to restart.';}
  });
  window.addEventListener('pagehide',()=>halt(true));
  render();
  tempo.textContent=slider.value+' BPM';
  region.dataset.ready='true';
}
