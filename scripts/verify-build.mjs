// Validate the generated static artifact without introducing a test framework dependency.
import fs from 'node:fs';
import path from 'node:path';
import { releaseChords } from '../src/data/chords.js';
import {lessonEarDrills} from '../src/data/lessonPathways.js';
import {chordSearchDescriptions} from '../src/data/chordSeo.js';
const dist = path.resolve('dist');
const publishedPages = [
  '/', '/chords/', '/tools/chord-finder/', '/tools/inversion-explorer/',
  '/tools/chord-compare/', '/tools/virtual-piano/', '/tools/chord-library/', '/tools/scales-and-keys/', '/tools/chord-progressions/', '/tools/metronome/', '/printables/piano-chord-chart/',
  '/guides/how-to-read-piano-chords/', '/guides/seventh-chords-piano/', '/open-source/', 
  ...releaseChords.map(chord=>`/chords/${chord.slug}/`),
];
const errors=[];
const getFile=(url)=>path.join(dist,url==='/'?'index.html':url.endsWith('/')?url.slice(1)+'index.html':url.slice(1));
const read=(p)=>fs.readFileSync(p,'utf8');
const sitemap=read(path.join(dist,'sitemap.xml'));
const absoluteSite=(process.env.PUBLIC_SITE_URL || 'https://piano-chord.pages.dev').replace(/\/$/,'');
const canonicalURLs=new Set();
if(publishedPages.length!==43)errors.push(`Unexpected SEO page inventory: ${publishedPages.length}`);
for(const url of publishedPages){
 const target=getFile(url);
 if(!fs.existsSync(target)){errors.push(`Missing HTML: ${url}`);continue;}
 const html=read(target);
 const title=html.match(/<title>([^<]*)<\/title>/)?.[1];
 const desc=html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1];
 const canonical=html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/)?.[1];
 if(!title || !desc || !html.includes('<h1'))errors.push(`Missing SEO title/description/H1: ${url}`);
 if(!canonical || canonical!==absoluteSite+url)errors.push(`Wrong canonical: ${url} -> ${canonical}`);
 if(canonicalURLs.has(canonical))errors.push(`Duplicate canonical: ${canonical}`);canonicalURLs.add(canonical);
 for(const hit of html.matchAll(/(?:href|src)="(\/[^\"]+)"/g)){
  const resource=hit[1].split('?')[0].split('#')[0];
  const file=getFile(resource);
  if(!fs.existsSync(file) && !fs.existsSync(path.join(dist,resource.slice(1))))errors.push(`Broken internal asset/link on ${url}: ${resource}`);
 }
}
// All 29 authored pages have chord-specific interactive drills.
// Test actual generated HTML and real A/B targets, not just source data.
for(const entry of releaseChords){
 const html=read(getFile('/chords/'+entry.slug+'/')).replaceAll('&amp;','&');
 const drill=lessonEarDrills[entry.slug];
 const meta=html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1];
 const expected=chordSearchDescriptions[entry.slug];
 if(!expected||meta!==expected)errors.push('Missing or inconsistent authored meta description: '+entry.slug);
 if(drill){
   const pair='/tools/chord-compare/?a='+encodeURIComponent(entry.slug)+'&b='+encodeURIComponent(drill.target);
   if(!html.includes('id="ear-training"'))errors.push('Missing individual ear-training section: '+entry.slug);
   if(!html.includes('class="ear-training-reveal"'))errors.push('Missing accessible answer reveal: '+entry.slug);
   if(!html.includes('href="'+pair+'"'))errors.push('Missing actual preselected compare link: '+entry.slug);
   if(!html.includes('href="/chords/'+drill.target+'/'))errors.push('Broken ear-training partner link: '+entry.slug);
   if((html.match(/class="ear-training-chord"/g)||[]).length!==2)errors.push('Pair needs two playable chords: '+entry.slug);
 }else errors.push('Missing specifically authored drill for '+entry.slug);
}
for(const {slug} of releaseChords){
 const svgPath=path.join(dist,'diagrams',slug+'.svg');
 if(!fs.existsSync(svgPath)){errors.push(`Missing SVG diagram: ${slug}`);continue;}
 const svg=read(svgPath);
 if(!svg.includes('<svg') || !svg.includes('<title') || !svg.includes('<desc'))errors.push(`Invalid SVG content: ${slug}`);
 if(!sitemap.includes(`/diagrams/${slug}.svg`))errors.push(`SVG omitted from image sitemap: ${slug}`);
}
if((sitemap.match(/<url>/g)||[]).length!==publishedPages.length)errors.push(`Sitemap has ${(sitemap.match(/<url>/g)||[]).length} HTML URLs but ${publishedPages.length} pages are published`);
if((sitemap.match(/<image:image>/g)||[]).length!==releaseChords.length)errors.push('Sitemap image count must match chord lesson count');
const pianoHtml=read(path.join(dist,'tools/virtual-piano/index.html'));
if((pianoHtml.match(/data-midi="[0-9]+"/g)||[]).length!==88)errors.push('Virtual piano must contain 88 key buttons');
const atlasHtml=read(path.join(dist,'tools/chord-library/index.html'));
if((atlasHtml.match(/class="atlas-card"/g)||[]).length!==120)errors.push('Chord atlas must contain 120 core chord cards');
if((atlasHtml.match(/href="\/tools\/inversion-explorer\/\?root=/g)||[]).length!==120)errors.push('Every atlas card needs a true inversion explorer link');
const inversionHtml=read(path.join(dist,'tools/inversion-explorer/index.html'));
if((inversionHtml.match(/<option value="[A-G][b]?:[^"]+"/g)||[]).length!==120)errors.push('Inversion explorer must publish 120 selectable chord options');
for(const [page,selectors] of [
 ['/tools/scales-and-keys/',['id="scale-mode"','id="scale-root"','id="scale-chords"']],
 ['/tools/chord-progressions/',['id="prog-mode"','id="prog-start"','id="progression-steps"']],
 ['/tools/metronome/',['id="practice-metronome"','id="metro-toggle"']],
 ['/tools/virtual-piano/',['id="practice-metronome"']]
]){
 const source=read(getFile(page));
 for(const marker of selectors)if(!source.includes(marker))errors.push('Missing functional learning control on '+page+': '+marker);
}
if(!fs.existsSync(path.join(dist,'robots.txt')))errors.push('Missing robots.txt');
if(!fs.existsSync(path.join(dist,'favicon.svg')))errors.push('Missing favicon');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log(`Generated artifact verified: ${publishedPages.length} HTML URLs, ${releaseChords.length} authored SVG diagrams, ${releaseChords.length} unique chord meta descriptions and interactive two-chord drills, canonical/metadata, sitemap, image sitemap, internal links and robots.`);
