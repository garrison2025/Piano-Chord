import { prettyNote, midiVoicing } from './music.js';
const WHITE_PCS=new Set([0,2,4,5,7,9,11]);
const BLACK_AFTER=new Set([0,2,5,7,9]);
const XML_ESCAPE = s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function keyboardSvg(chord,{inversion=0,small=false}={}){
  const voice=midiVoicing(chord.root,chord.quality,inversion);
  const highlight=new Set(voice.midi);
  const whites=[],blacks=[],labels=[];
  const left=20, keyWidth=30.5,keyH=146, blackW=17, blackH=91;
  let k=0;
  for(let midi=60;midi<96;midi++){
    const pc=midi%12;
    if(WHITE_PCS.has(pc)){
      const x=left+k*keyWidth;
      const active=highlight.has(midi);
      whites.push(`<rect x="${x}" y="18" width="${keyWidth-1}" height="${keyH}" rx="5" fill="${active?'#bce5d7':'#fffdf7'}" stroke="#b7c6cb" stroke-width="1.2"/>`);
      if(active)labels.push(`<circle cx="${x+keyWidth/2}" cy="139" r="11" fill="#126f5c"/><text x="${x+keyWidth/2}" y="143.5" font-size="12" font-family="sans-serif" font-weight="700" fill="white" text-anchor="middle">${voice.notes[voice.midi.indexOf(midi)]?.replace(/[^A-G]/g,'')||'●'}</text>`);
      if(pc===0)labels.push(`<text x="${x+keyWidth/2}" y="183" font-size="12" font-family="sans-serif" fill="#72818a" text-anchor="middle">C${Math.floor(midi/12)-1}</text>`);
      k++;
    } else if(BLACK_AFTER.has((pc+11)%12)){
      const x=left+(k*keyWidth)-(blackW/2)-.5;
      const active=highlight.has(midi);
      blacks.push(`<rect x="${x}" y="18" width="${blackW}" height="${blackH}" rx="4" fill="${active?'#126f5c':'#26313f'}" stroke="#182432" stroke-width="1"/>`);
      if(active)labels.push(`<circle cx="${x+blackW/2}" cy="91" r="5" fill="#fff"/>`);
    }
  }
  const noteLabel=voice.notes.map(prettyNote).join(' · ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 692 195" role="img" aria-labelledby="ttl desc"><title id="ttl">${XML_ESCAPE(chord.name)} piano keyboard, ${inversion===0?'root position':`inversion ${inversion}`}</title><desc id="desc">Highlighted piano keys: ${XML_ESCAPE(noteLabel)}.</desc><rect width="692" height="195" rx="14" fill="#ecf3f0"/>${whites.join('')}${blacks.join('')}${labels.join('')}</svg>`;
}
