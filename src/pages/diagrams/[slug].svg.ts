import { releaseChords } from '../../data/chords.js';
import { createChord } from '../../lib/music.js';
import { keyboardSvg } from '../../lib/pianoSvg.js';
export function getStaticPaths(){return releaseChords.map(entry=>({params:{slug:entry.slug},props:{entry}}));}
export function GET({props}){
  const svg=keyboardSvg(createChord(props.entry));
  return new Response(svg,{headers:{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'public,max-age=86400'}});
}
