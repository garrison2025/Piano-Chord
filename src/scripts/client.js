import {releaseChords} from '../data/chords.js';
import {createChord,findChordMatches,prettyNote,prettySymbol,midiVoicing} from '../lib/music.js';
import {keyboardSvg} from '../lib/pianoSvg.js';
import {coreChordByKey,coreChordKeyboard,findCoreChordMatches} from '../lib/chordAtlas.mjs';
const bySlug=new Map(releaseChords.map(entry=>[entry.slug,createChord(entry)]));
const el=id=>document.getElementById(id);
const status=message=>{const target=el('app-status');if(target)target.textContent=message;};
const escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let ctx=null,voices=[];
let visualReset=null;
function clearPlaybackVisual(){
  if(visualReset){clearTimeout(visualReset);visualReset=null;}
  document.querySelectorAll('.is-playing').forEach(node=>node.classList.remove('is-playing'));
}
function setPlaybackVisual(button,duration=1500){
  clearPlaybackVisual();
  button.classList.add('is-playing');
  button.closest('.studio-chord, .panel, .inversion-view')?.classList.add('is-playing');
  visualReset=setTimeout(clearPlaybackVisual,duration);
}
function stopAudio(){
  clearPlaybackVisual();
  for(const {osc,gain} of voices){try{gain.gain.cancelScheduledValues(ctx.currentTime);gain.gain.setTargetAtTime(.00001,ctx.currentTime,.025);osc.stop(ctx.currentTime+.18);}catch{}}
  voices=[];
}
async function playMidi(midi, duration=1.5){
  if(!midi.length) return;
  try{
    const AudioCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtor){status('Web Audio is not supported by this browser.');return;}
    if(!ctx)ctx=new AudioCtor();
    if(ctx.state==='suspended')await ctx.resume();
    stopAudio();
    const start=ctx.currentTime+.01;
    const volume=Math.min(.15,.48/midi.length);
    for(const pitch of midi){
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type='triangle';osc.frequency.setValueAtTime(440*Math.pow(2,(pitch-69)/12),start);
      gain.gain.setValueAtTime(.00001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.045);
      gain.gain.setTargetAtTime(.00001,start+duration*.75,.16);
      osc.connect(gain);gain.connect(ctx.destination);
      osc.start(start);osc.stop(start+duration+.5);voices.push({osc,gain});
    }
    status('Playing chord; choose Stop to end it early.');
    return true;
  }catch(err){console.error(err);status('Could not play audio. Check your browser audio permissions.');return false;}
}
function bindAudio(){
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('button[data-play-midi]');
    if(button){const notes=button.dataset.playMidi.split(',').map(Number).filter(Number.isFinite);playMidi(notes).then(ok=>{if(ok)setPlaybackVisual(button);});return;}
    if(event.target.closest?.('[data-stop-audio]')){stopAudio();status('Playback stopped.');}
  });
  window.addEventListener('pagehide',()=>{stopAudio();ctx?.close().catch(()=>{});ctx=null;});
}
function bindStaticInversionPanels(){
  document.querySelectorAll('[data-inversion-panel]').forEach(panel=>{
    panel.querySelectorAll('[data-inversion-button]').forEach(button=>button.addEventListener('click',()=>{
      const selected=button.dataset.inversionButton;
      panel.querySelectorAll('[data-inversion-button]').forEach(b=>{const active=b===button;b.setAttribute('aria-pressed',String(active));b.classList.toggle('btn-primary',active);});
      panel.querySelectorAll('[data-inversion-view]').forEach(view=>{view.hidden=view.dataset.inversionView!==selected;});
      status(`Showing ${button.textContent.trim()}.`);
    }));
  });
}
function bindSearch(){
  const input=el('chord-search');if(!input)return;
  const cards=[...document.querySelectorAll('[data-searchable-chord]')];
  const buttons=[...document.querySelectorAll('[data-quality-filter]')];
  const reset=el('reset-chord-filters'),clear=el('clear-chord-search'),countEl=el('chord-result-count');
  let activeQuality='all';
  const normalize=value=>String(value).toLowerCase().normalize('NFKD').replaceAll('♭','b').replaceAll('♯','#').replace(/[-\s]+/g,' ').trim();
  const render=()=>{
    const query=normalize(input.value);let visible=0;
    for(const card of cards){
      const inCategory=activeQuality==='all'||card.closest('[data-group]')?.dataset.group===activeQuality;
      const match=inCategory&&normalize(card.dataset.searchableChord).includes(query);
      card.hidden=!match;if(match)visible++;
    }
    for(const group of document.querySelectorAll('[data-group]'))group.hidden=![...group.querySelectorAll('[data-searchable-chord]')].some(card=>!card.hidden);
    const empty=el('no-chord-matches');if(empty)empty.hidden=visible>0;
    if(countEl)countEl.textContent=query||activeQuality!=='all'?`Showing ${visible} of ${cards.length} chords`:`Showing all ${cards.length} chords`;
    if(clear)clear.hidden=input.value.length===0;
    buttons.forEach(button=>{const isActive=button.dataset.qualityFilter===activeQuality;button.classList.toggle('is-selected',isActive);button.setAttribute('aria-pressed',String(isActive));});
  };
  const resetAll=()=>{input.value='';activeQuality='all';render();input.focus();};
  input.addEventListener('input',render);
  buttons.forEach(button=>button.addEventListener('click',()=>{activeQuality=button.dataset.qualityFilter;render();}));
  reset?.addEventListener('click',resetAll);
  clear?.addEventListener('click',()=>{input.value='';render();input.focus();});
  input.addEventListener('keydown',event=>{if(event.key==='Escape'&&input.value){input.value='';render();}});
  render();
}
function finder(){
  const picker=el('pitch-picker');if(!picker)return;
  const selected=new Set(),output=el('finder-results');
  function render(){
    for(const button of picker.querySelectorAll('[data-pitch]'))
      button.setAttribute('aria-pressed',String(selected.has(Number(button.dataset.pitch))));
    if(selected.size<3){
      output.textContent=selected.size+' note'+(selected.size===1?'':'s')+
        ' selected. Choose '+(3-selected.size)+' more to find chords.';
      return;
    }
    const matches=findCoreChordMatches([...selected]);
    if(!matches.length){
      output.textContent='No exact match among the ten chord families in our 120-chord library. Try a different set; incomplete or extended chords may not be covered.';
      return;
    }
    output.innerHTML='<p><strong>'+matches.length+' possible chord name'+(matches.length===1?'':'s')+
      '</strong> for these pitch classes. Root and bass depend on musical context:</p><ul>'+
      matches.slice(0,12).map(chord=>{
        const theory='/tools/inversion-explorer/?root='+encodeURIComponent(chord.root)+'&quality='+encodeURIComponent(chord.quality);
        return '<li><strong>'+escapeHtml(chord.symbol)+' — '+escapeHtml(chord.name)+'</strong><br/>'+
          '<small>'+escapeHtml(chord.notes.map(prettyNote).join(' · '))+'</small>'+
          '<div class="button-row"><button class="btn btn-primary" type="button" data-play-midi="'+chord.midi.join(',')+
          '" aria-label="Hear '+escapeHtml(chord.name)+'">▶ Hear</button>'+
          '<a class="btn" href="'+theory+'">Bass &amp; inversions ↗</a></div></li>';
      }).join('')+'</ul>';
  }
  picker.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
    const pc=Number(button.dataset.pitch);
    if(selected.has(pc))selected.delete(pc);
    else if(selected.size<4)selected.add(pc);
    else{status('Choose no more than four pitch classes.');return;}
    render();
  }));
  el('clear-pitches').addEventListener('click',()=>{selected.clear();render();});
  el('example-pitches').addEventListener('click',()=>{selected.clear();[0,4,7].forEach(v=>selected.add(v));render();});
  render();
}
function inversionExplorer(){
  const select=el('inversion-chord');if(!select)return;
  const output=el('inversion-tool');
  const params=new URLSearchParams(window.location.search);
  const initial=params.get('root')+':'+params.get('quality');
  if(coreChordByKey.has(initial))select.value=initial;
  function render(){
    const core=coreChordByKey.get(select.value);if(!core)return;
    const chord=coreChordKeyboard(core),names=['Root position','First inversion','Second inversion','Third inversion'];
    output.innerHTML='<h2>'+escapeHtml(chord.name)+'</h2>'+
      '<p>Spelled notes: <strong>'+escapeHtml(chord.notes.map(prettyNote).join(' · '))+'</strong></p>'+
      '<p class="help-text">'+(chord.notes.length===4?'Four chord tones · four inversions':'Three chord tones · three inversions')+
      '. The slash name puts the lowest note after the slash.</p>'+
      '<div class="inversion-list">'+chord.inversions.map((v,i)=>{
        const slash=i===0?chord.symbol:chord.symbol+'/'+prettyNote(v.bass);
        return '<article class="inversion-card"><h3>'+names[i]+' · '+escapeHtml(slash)+'</h3>'+
          '<p>Notes from the bass: '+escapeHtml(v.notes.map(prettyNote).join(' · '))+'</p>'+
          '<p class="help-text">Lowest written note: <strong>'+escapeHtml(prettyNote(v.bass))+'</strong></p>'+
          '<div class="keyboard-frame">'+keyboardSvg(chord,{inversion:i})+'</div>'+
          '<button class="btn btn-primary" type="button" data-play-midi="'+v.midi.join(',')+'">▶ Hear '+names[i].toLowerCase()+'</button></article>';
      }).join('')+'</div>';
  }
  select.addEventListener('change',render);render();
}
function compare(){
 const a=el('compare-a'),b=el('compare-b');if(!a||!b)return;
 const query=new URLSearchParams(window.location.search);
 const possibleA=query.get('a'),possibleB=query.get('b');
 if(bySlug.has(possibleA))a.value=possibleA;
 if(bySlug.has(possibleB))b.value=possibleB;
 function render(){
   const chordA=bySlug.get(a.value),chordB=bySlug.get(b.value);if(!chordA||!chordB)return;
   for(const [chord,target,letter] of [[chordA,'compare-a-view','A'],[chordB,'compare-b-view','B']]){
     el(target).innerHTML=`<h2>${escapeHtml(chord.name)}</h2><p>${escapeHtml(chord.notes.map(prettyNote).join(' · '))}</p><img class="keyboard-image" width="692" height="195" alt="${escapeHtml(chord.name)} notes on piano" src="/diagrams/${chord.slug}.svg"/><div class="button-row"><button class="btn btn-primary" type="button" data-play-midi="${chord.inversions[0].midi.join(',')}">▶ Play ${letter}</button></div>`;
   }
   const shared=chordA.notes.filter((_,i)=>chordB.pcs.includes(chordA.pcs[i]));
   const onlyA=chordA.notes.filter((_,i)=>!chordB.pcs.includes(chordA.pcs[i]));
   const onlyB=chordB.notes.filter((_,i)=>!chordA.pcs.includes(chordB.pcs[i]));
   el('compare-result').innerHTML=`<h3>What changes from ${escapeHtml(chordA.symbol)} to ${escapeHtml(chordB.symbol)}?</h3><p><strong>Shared sounding notes:</strong> ${shared.length?escapeHtml(shared.map(prettyNote).join(' · ')):'None'}</p><p><strong>Only in first chord:</strong> ${onlyA.length?escapeHtml(onlyA.map(prettyNote).join(' · ')):'None'}</p><p><strong>Only in second chord:</strong> ${onlyB.length?escapeHtml(onlyB.map(prettyNote).join(' · ')):'None'}</p><p class="help-text">Shared notes are compared by sounding pitch class. Their written names may differ in an enharmonic context. Play A, then B, and listen for the moving voices.</p>`;
 }
 a.addEventListener('change',render);b.addEventListener('change',render);render();
}
function setupSpotlight(){
  const spotlight=document.querySelector('[data-spotlight]');if(!spotlight)return;
  const buttons=[...spotlight.querySelectorAll('[data-spotlight-choice]')];
  const views=[...spotlight.querySelectorAll('[data-spotlight-view]')];
  for(const button of buttons){
    button.addEventListener('click',()=>{
      const selected=button.dataset.spotlightChoice;
      stopAudio();
      buttons.forEach(item=>{
        const active=item===button;
        item.classList.toggle('is-active',active);
        item.setAttribute('aria-pressed',String(active));
      });
      views.forEach(view=>{view.hidden=view.dataset.spotlightView!==selected;});
      const heading=views.find(view=>!view.hidden)?.querySelector('h3')?.textContent?.trim();
      if(heading)status(`${heading} selected. Press Play chord to hear it.`);
    });
  }
}
function setupMotion(){
  const targets=[...document.querySelectorAll('.reveal-on-scroll')];
  if(!targets.length||!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  // Do not hide content until observer is ready to reveal it.
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}}
  },{threshold:.06,rootMargin:'0px 0px 25px 0px'});
  targets.forEach(node=>observer.observe(node));
  document.documentElement.classList.add('motion-ready');
}
function setupMobileMenu(){
  const menu=document.querySelector('.mobile-nav');if(!menu)return;
  menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>menu.open=false));
  document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
  menu.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.open=false;menu.querySelector('summary')?.focus();}});
}
function printChart(){el('print-charts')?.addEventListener('click',()=>window.print());}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
function initialize(){bindAudio();bindStaticInversionPanels();bindSearch();finder();inversionExplorer();compare();printChart();setupSpotlight();setupMotion();setupMobileMenu();}
