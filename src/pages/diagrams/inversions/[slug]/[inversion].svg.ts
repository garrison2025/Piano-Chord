import {releaseChords} from '../../../data/chords.js';
import {createChord} from '../../../lib/music.js';
import {keyboardSvg} from '../../../lib/pianoSvg.js';

// Separate, stable image URLs for the educational inversion figures.
// These are images, not extra indexable chord lesson pages.
export function getStaticPaths(){
  return releaseChords.flatMap(entry=>{
    const chord=createChord(entry);
    return chord.inversions.slice(1).map((_,i)=>({
      params:{slug:entry.slug,inversion:String(i+1)},
      props:{entry,inversion:i+1}
    }));
  });
}

export function GET({props}){
  const chord=createChord(props.entry);
  const svg=keyboardSvg(chord,{inversion:props.inversion});
  return new Response(svg,{
    headers:{
      'Content-Type':'image/svg+xml; charset=utf-8',
      'Cache-Control':'public,max-age=86400'
    }
  });
}
