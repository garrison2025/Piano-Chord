import {releaseChords} from '../data/chords.js';
const staticPages=['/','/chords/','/tools/chord-finder/','/tools/inversion-explorer/','/tools/chord-compare/','/tools/virtual-piano/','/tools/chord-library/','/printables/piano-chord-chart/','/guides/how-to-read-piano-chords/','/open-source/'];
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
export function GET({site,url}){
 const origin=(site||url).origin;
 const pages=staticPages.map(path=>`<url><loc>${esc(origin+path)}</loc></url>`).concat(releaseChords.map(e=>`<url><loc>${esc(origin+'/chords/'+e.slug+'/')}</loc><image:image><image:loc>${esc(origin+'/diagrams/'+e.slug+'.svg')}</image:loc></image:image></url>`));
 return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${pages.join('')}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
}
