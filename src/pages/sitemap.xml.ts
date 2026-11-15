import {releaseChords} from '../data/chords.js';
import {createChord} from '../lib/music.js';

const staticPages=['/','/chords/','/tools/chord-finder/','/tools/inversion-explorer/','/tools/chord-compare/','/tools/virtual-piano/','/tools/chord-library/','/tools/scales-and-keys/','/tools/chord-progressions/','/tools/metronome/','/printables/piano-chord-chart/','/guides/how-to-read-piano-chords/','/guides/seventh-chords-piano/','/open-source/','/about/'];
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const imageTag=url=>`<image:image><image:loc>${esc(url)}</image:loc></image:image>`;

export function GET({site,url}){
  const origin=(site||url).origin;
  const staticEntries=staticPages.map(path=>`<url><loc>${esc(origin+path)}</loc></url>`);
  const lessons=releaseChords.map(entry=>{
    const chord=createChord(entry);
    const page=origin+'/chords/'+entry.slug+'/';
    const imageURLs=[
      origin+'/diagrams/'+entry.slug+'.svg',
      ...chord.inversions.slice(1).map((_,i)=>
        origin+'/diagrams/inversions/'+entry.slug+'/'+(i+1)+'.svg')
    ];
    return `<url><loc>${esc(page)}</loc>${imageURLs.map(imageTag).join('')}</url>`;
  });
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${[...staticEntries,...lessons].join('')}</urlset>`,
    {headers:{'Content-Type':'application/xml; charset=utf-8'}}
  );
}
