/**
 * Deep, deterministic audit of the generated static site.
 * This checks the REAL built HTML and XML, not just Astro templates.
 * It cannot infer GSC indexation, rankings, CWV or Cloudflare response codes.
 */
import fs from 'node:fs';
import path from 'node:path';
import {releaseChords} from '../src/data/chords.js';
import {createChord} from '../src/lib/music.js';
import {chordQuickAnswer} from '../src/lib/chordQuickAnswer.mjs';
import {priorityChordGuides} from '../src/data/priorityChordGuides.js';
import {SITE_EMAIL,SITE_SOURCE,CONTENT_UPDATE_DATE,THEORY_REFERENCE} from '../src/data/siteIdentity.js';

const dist=path.resolve('dist');
const origin='https://pianochordexplorer.com';
const sitemap=fs.readFileSync(path.join(dist,'sitemap.xml'),'utf8');
const paths=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1].replaceAll('&amp;','&')).pathname);
const indexable=new Set(paths),issues=[],warnings=[],incoming=new Map(paths.map(p=>[p,new Set()]));
const titles=new Map(),descriptions=new Map();
const rows=[];
const chordByPath=new Map(releaseChords.map(e=>['/chords/'+e.slug+'/',e]));
const expectedImageUrls=releaseChords.flatMap(entry=>{
 const chord=createChord(entry);
 return [
   origin+'/diagrams/'+entry.slug+'.svg',
   ...chord.inversions.slice(1).map((_,i)=>
     origin+'/diagrams/inversions/'+entry.slug+'/'+(i+1)+'.svg')
 ];
});
const imageUrls=[...sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(x=>x[1]);
if(imageUrls.length!==expectedImageUrls.length||
   new Set(imageUrls).size!==imageUrls.length||
   expectedImageUrls.some(x=>!imageUrls.includes(x)))
 issues.push('Image sitemap must include exactly '+expectedImageUrls.length+' distinct chord voicing SVGs');
for(const imageUrl of expectedImageUrls){
 const relative=imageUrl.slice(origin.length);
 const filename=path.join(dist,relative.slice(1));
 if(!fs.existsSync(filename))issues.push('Missing image sitemap asset '+imageUrl);
}
function decode(s){return String(s??'').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'");}
function fileFor(p){return path.join(dist,p==='/'?'index.html':p.slice(1)+'index.html');}
function attr(html,pat){return decode(html.match(pat)?.[1]);}
function addUnique(map,value,p,label){
  if(!value){issues.push('Missing '+label+': '+p);return;}
  if(map.has(value))issues.push('Duplicate '+label+': '+p+' and '+map.get(value));
  else map.set(value,p);
}
if(paths.length!==44||indexable.size!==44)issues.push('Expected 44 unique public indexable pages, got '+paths.length);
if(sitemap.includes('<loc>'+origin+'/privacy/</loc>'))issues.push('Privacy must not be included in sitemap');
if(sitemap.includes('<loc>'+origin+'/terms/</loc>'))issues.push('Noindex Terms must not be in the sitemap');
if(sitemap.includes('<loc>'+origin+'/404/</loc>'))issues.push('404 must not be included in sitemap');
for(const p of paths){
  const filename=fileFor(p);
  if(!fs.existsSync(filename)){issues.push('Missing page '+p);continue;}
  const html=fs.readFileSync(filename,'utf8');
  const title=attr(html,/<title>([\s\S]*?)<\/title>/i);
  const description=attr(html,/<meta\s+name="description"\s+content="([^"]*)"/i);
  const canonical=attr(html,/<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const ogUrl=attr(html,/<meta\s+property="og:url"\s+content="([^"]*)"/i);
  const ogImage=attr(html,/<meta\s+property="og:image"\s+content="([^"]*)"/i);
  const twitterImage=attr(html,/<meta\s+name="twitter:image"\s+content="([^"]*)"/i);
  const expected=origin+p;
  const headings=(html.match(/<h1\b[^>]*>/gi)||[]).length;
  addUnique(titles,title,p,'title');
  addUnique(descriptions,description,p,'description');
  if(canonical!==expected)issues.push('Canonical mismatch on '+p+': '+canonical);
  if(ogUrl!==canonical)issues.push('Open Graph URL mismatch on '+p);
  if(ogImage!==origin+'/share-card.png'||twitterImage!==ogImage)
    issues.push('Social share image must use canonical host and match on '+p);
  if(!html.includes('name="twitter:card" content="summary_large_image"'))
    issues.push('Twitter/X must use large image card on '+p);
  if(headings!==1)issues.push('Must have exactly one H1 on '+p+': '+headings);
  if(!html.includes('href="/terms/"')||!html.includes('href="/privacy/"'))
    issues.push('Every indexable page must link both policy pages: '+p);
  if(!html.includes('href="mailto:'+SITE_EMAIL+'"'))
    issues.push('Missing owner-confirmed contact address in footer: '+p);
  if(p.startsWith('/chords/')&&p!=='/chords/'){
    if(!html.includes('id="chord-quick-answer"')||
       !html.includes('data-chord-answer')||!html.includes('data-inversion-answer'))
      issues.push('Missing human-readable GEO notes and inversions on '+p);
    if(!html.includes('How does ')||!html.includes('compare with a related chord?'))
      issues.push('Missing original chord relationship explanation on '+p);
  }
  if(!html.includes('rel="preconnect" href="https://fonts.googleapis.com"')||
     !html.includes('rel="preconnect" href="https://fonts.gstatic.com"'))
    issues.push('Missing Google Fonts resource preconnect on '+p);
  if(!/<html\b[^>]*lang="en"/i.test(html))issues.push('Missing page language on '+p);
  if(/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html))issues.push('Indexable sitemap page incorrectly noindex: '+p);
  if(/<meta\s+name="robots"\s+content="[^"]*nosnippet/i.test(html))issues.push('AI-search eligible page prohibits snippets: '+p);
  if(title?.length>70)warnings.push('Long title '+title.length+' chars on '+p);
  if(description?.length>185)warnings.push('Long description '+description.length+' chars on '+p);
  const imageTags=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
  for(const tag of imageTags)
    if(!/\balt="[^"]+"/i.test(tag))issues.push('Missing descriptive img alt on '+p+': '+tag.slice(0,85));
  let schemaCount=0,structured=[];
  for(const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)){
    try {
      const value=JSON.parse(match[1]);schemaCount++;structured.push(value);
      if(!value['@context']||!value['@type'])issues.push('Incomplete JSON-LD on '+p);
      if(value['@type']==='BreadcrumbList'){
        for(const item of value.itemListElement||[])
          if(!item.item?.startsWith(origin+'/'))issues.push('Broken BreadcrumbList item on '+p);
      }
    }catch(e){issues.push('Malformed JSON-LD on '+p+': '+e.message);}
  }
  // Schema must describe actually visible content; counts alone are not evidence.
  const schemaType=t=>structured.find(o=>o?.['@type']===t);
  if(p==='/'){
    const website=schemaType('WebSite');
    const publisher=schemaType('Organization');
    const webpage=schemaType('WebPage');
    if(!website||!publisher||!webpage)
      issues.push('Homepage missing WebSite, Organization or WebPage entity schema');
    if(publisher?.email!==SITE_EMAIL||!publisher.sameAs?.includes(SITE_SOURCE))
      issues.push('Publisher contact and sameAs must match verified project sources');
    if(website?.publisher?.['@id']!==publisher?.['@id'])
      issues.push('Website publisher identity must resolve to the homepage Organization');
    if(webpage?.author?.name!=='Piano Chord Explorer'||
       webpage.author?.url!==origin+'/about/'||
       webpage.author?.['@id']!==publisher?.['@id'])
      issues.push('Homepage author must match its visible, verified publisher profile');
    if(webpage?.dateModified!==CONTENT_UPDATE_DATE||
       !html.includes('datetime="'+CONTENT_UPDATE_DATE+'"'))
      issues.push('Homepage update date must match visible editorial metadata');
    if(!html.includes('<table class="theory-reference-table"')||
       !html.includes('<thead>')||!html.includes('<tbody>')||
       !html.includes('<th scope="row">')||!html.includes('<ol>'))
      issues.push('Homepage must include semantic chord formula table and steps');
    if(!html.includes('href="'+THEORY_REFERENCE.url+'"'))
      issues.push('Homepage must cite the independently published theory reference');
    if(!html.includes('class="theory-reference-quote"')||
       !html.includes('cite="'+THEORY_REFERENCE.url+'"')||
       !html.includes('A three-note chord whose pitch classes can be arranged as thirds is called a triad.')||
       !html.includes('A triad is not just any three keys pressed together.'))
      issues.push('Homepage must expose an accurate, attributed definition with its educational explanation');
  }
  if(p.startsWith('/tools/')){
    const tool=schemaType('WebApplication');
    if(!tool||tool.url!==origin+p||tool.offers?.price!=='0'||
       tool.isAccessibleForFree!==true)
      issues.push('Tool page requires valid, factual free WebApplication schema: '+p);
  }
  if((p.startsWith('/chords/')&&p!=='/chords/')||p.startsWith('/guides/')){
    const article=schemaType('Article');
    if(!article||article.mainEntityOfPage!==origin+p||
       article.author?.url!==origin+'/about/'||
       article.dateModified!==CONTENT_UPDATE_DATE||
       article.citation?.[0]?.url!==THEORY_REFERENCE.url)
      issues.push('Educational Article schema must match author, date and source: '+p);
    if(!html.includes('href="'+THEORY_REFERENCE.url+'"')||
       !html.includes('datetime="'+CONTENT_UPDATE_DATE+'"')||
       !html.includes('href="/about/"'))
      issues.push('Educational Article schema has no matching visible attribution: '+p);
    if(article&&'datePublished' in article)
      issues.push('Do not infer original publication dates from metadata update: '+p);
  }
  if(p.startsWith('/chords/')&&p!=='/chords/'){
    if(!html.includes('id="chord-quick-answer"')||
       !html.includes('data-chord-answer')||
       !html.includes('data-inversion-answer'))
      issues.push('Missing self-contained visible note and inversion answers: '+p);
    if(!html.includes('"@type":"WebPage"')||
       !html.includes('"@type":"DefinedTerm"'))
      issues.push('Chord page missing music term subject JSON-LD: '+p);
  }
  const priority=chordByPath.get(p)?priorityChordGuides[chordByPath.get(p).slug]:null;
  if(priority){
    const slug=chordByPath.get(p).slug;
    if(!html.includes('id="beginner-guide"')||
       !html.includes('data-priority-chord="'+slug+'"'))
      issues.push('Priority lesson lacks its human-readable guide: '+p);
    if(!html.includes(priority.heading)||!html.includes(priority.question)||
       !priority.steps.every(step=>html.includes(step)))
      issues.push('Priority lesson is missing its individual exercises: '+p);
    if(!html.replaceAll('&amp;','&').includes('href="'+priority.compareHref+'"'))
      issues.push('Priority lesson has no correct pairwise chord compare: '+p);
    if(!html.includes('href="'+priority.nextHref+'"'))
      issues.push('Priority lesson has no next authored chord: '+p);
  }
  const chordEntry=chordByPath.get(p);
  if(chordEntry){
    const activeChord=createChord(chordEntry);
    for(let i=1;i<activeChord.inversions.length;i++){
      const diagram='/diagrams/inversions/'+chordEntry.slug+'/'+i+'.svg';
      if(!html.includes('src="'+diagram+'"'))
        issues.push('Missing indexable standalone inversion <img> '+p+' #'+i);
      if(!html.includes('href="'+diagram+'"'))
        issues.push('Missing accessible inversion diagram download '+p+' #'+i);
    }
    const answer=chordQuickAnswer(createChord(chordEntry));
    const subject=structured.find(o=>o?.['@type']==='WebPage' && o.mainEntity?.['@type']==='DefinedTerm');
    if(!subject || subject.url!==origin+p ||
      subject.mainEntity.name!==chordEntry.name ||
      subject.mainEntity.termCode!==chordEntry.symbol ||
      subject.mainEntity.description!==answer.definition)
      issues.push('GEO DefinedTerm JSON-LD differs from the music-theory notes: '+p);
    if(!html.includes(answer.definition)||!html.includes(answer.inversionAnswer))
      issues.push('GEO visible note/inversion answers disagree with the theory engine: '+p);
  }
  if(p==='/'){
    for(const slug of Object.keys(priorityChordGuides))
      if(!html.includes('href="/chords/'+slug+'/'))
        issues.push('Homepage should link to researched priority lesson: '+slug);
    if(!html.includes('id="beginner-piano-chords"'))
      issues.push('Homepage lacks visible high-demand beginner chord pathways');
    if(!html.includes('"@type":"WebSite"')||!html.includes('"name":"Piano Chord Explorer"'))
      issues.push('Homepage missing WebSite name declaration');
    for(const answer of ['id="piano-chord-definition"','What notes make C major?','How is B minor different from D major?','Is C7 the same as Cmaj7?'])
      if(!html.includes(answer))issues.push('Missing transparent question-led homepage content: '+answer);
  }
  if(p==='/about/'&&!html.includes('Source, calculation and review boundaries'))
    issues.push('Missing source and editorial review transparency on About');
  for(const match of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)){
    const raw=decode(match[1]);
    if(!raw||raw.startsWith('javascript:')){issues.push('Invalid link on '+p);continue;}
    if(raw.startsWith('mailto:')||raw.startsWith('tel:'))continue;
    let link;
    try{link=new URL(raw,origin+p);}catch{issues.push('Malformed href '+raw+' on '+p);continue;}
    if(link.origin!==origin)continue;
    const to=link.pathname;
    if(indexable.has(to)&&p!==to)incoming.get(to).add(p);
    const candidate=to.endsWith('/')?fileFor(to):path.join(dist,to.slice(1));
    if(!fs.existsSync(candidate)&&!fs.existsSync(path.join(dist,to.slice(1),'index.html')))
      issues.push('Broken same-origin link '+raw+' on '+p);
  }
  rows.push({path:p,title,titleLength:title?.length,descriptionLength:description?.length,h1Count:headings,
    imageCount:imageTags.length,structuredDataBlocks:schemaCount,internalInlinks:0});
}
for(const row of rows)row.internalInlinks=incoming.get(row.path)?.size??0;
const orphans=rows.filter(r=>r.path!=='/'&&r.internalInlinks===0).map(r=>r.path);
if(orphans.length)issues.push('Orphan indexable pages: '+orphans.join(', '));
const robots=fs.readFileSync(path.join(dist,'robots.txt'),'utf8');
if(!/User-agent:\s*\*\s*\nAllow:\s*\//.test(robots)||/Disallow:\s*\//i.test(robots))
  issues.push('Public robots rules block or fail to allow broad search crawlers');
const privacy=fs.readFileSync(fileFor('/privacy/'),'utf8');
if(!privacy.includes('name="robots" content="noindex,follow"'))issues.push('Privacy must be noindex');
const termsFile=fileFor('/terms/');
if(!fs.existsSync(termsFile))issues.push('Terms page missing');
else if(!fs.readFileSync(termsFile,'utf8').includes('name="robots" content="noindex,follow"'))
 issues.push('Terms must be noindex to avoid thin legal pages in indexable sitemap');
const llmsFile=path.join(dist,'llms.txt');
if(!fs.existsSync(llmsFile))issues.push('Optional site guide llms.txt missing');
else{
  const guide=fs.readFileSync(llmsFile,'utf8');
  if(!guide.startsWith('# Piano Chord Explorer')||!guide.includes(SITE_EMAIL)||
     !guide.includes(origin+'/chords/')||!guide.includes(origin+'/terms/'))
   issues.push('llms.txt must describe the actual brand, contact and live navigation');
  if(guide.includes('piano-chord.pages.dev'))
   issues.push('llms.txt must not advertise the retired preview URL');
}
const notFound=fs.readFileSync(path.join(dist,'404.html'),'utf8');
if(!notFound.includes('name="robots" content="noindex,follow"'))issues.push('404 must be noindex');
const pngPath=path.join(dist,'share-card.png');
if(!fs.existsSync(pngPath))issues.push('Missing local social preview PNG');
else{
  const png=fs.readFileSync(pngPath);
  if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||
     png.readUInt32BE(16)!==1200||png.readUInt32BE(20)!==630)
    issues.push('Social preview must be a real 1200×630 PNG');
}
const summary={origin,indexablePages:paths.length,uniqueTitles:titles.size,
  uniqueDescriptions:descriptions.size,totalHTMLImages:rows.reduce((s,r)=>s+r.imageCount,0),
  orphanCount:orphans.length,googleFontsExternal:true,ogImageConfigured:true,
  warnings,issues,rows};
fs.mkdirSync('test-results/seo',{recursive:true});
fs.writeFileSync('test-results/seo/seo-audit.json',JSON.stringify(summary,null,2)+'\n');
console.log('SEO audit: '+paths.length+' indexable HTML; '+titles.size+' unique titles; '+
  descriptions.size+' unique descriptions; '+summary.totalHTMLImages+
  ' HTML images; '+orphans.length+' orphans; '+warnings.length+' warnings; '+issues.length+' errors');
if(warnings.length)console.log('Warnings:\n'+warnings.join('\n'));
if(issues.length){console.error('SEO audit errors:\n'+issues.join('\n'));process.exitCode=1;}
