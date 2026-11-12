/**
 * Deep, deterministic audit of the generated static site.
 * This checks the REAL built HTML and XML, not just Astro templates.
 * It cannot infer GSC indexation, rankings, CWV or Cloudflare response codes.
 */
import fs from 'node:fs';
import path from 'node:path';

const dist=path.resolve('dist');
const origin=(process.env.PUBLIC_SITE_URL||'https://piano-chord.pages.dev').replace(/\/$/,'');
const sitemap=fs.readFileSync(path.join(dist,'sitemap.xml'),'utf8');
const paths=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1].replaceAll('&amp;','&')).pathname);
const indexable=new Set(paths),issues=[],warnings=[],incoming=new Map(paths.map(p=>[p,new Set()]));
const titles=new Map(),descriptions=new Map();
const rows=[];
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
  if(!html.includes('rel="preconnect" href="https://fonts.googleapis.com"')||
     !html.includes('rel="preconnect" href="https://fonts.gstatic.com"'))
    issues.push('Missing Google Fonts resource preconnect on '+p);
  if(!/<html\b[^>]*lang="en"/i.test(html))issues.push('Missing page language on '+p);
  if(/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html))issues.push('Indexable sitemap page incorrectly noindex: '+p);
  if(title?.length>70)warnings.push('Long title '+title.length+' chars on '+p);
  if(description?.length>185)warnings.push('Long description '+description.length+' chars on '+p);
  const imageTags=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
  for(const tag of imageTags)
    if(!/\balt="[^"]+"/i.test(tag))issues.push('Missing descriptive img alt on '+p+': '+tag.slice(0,85));
  let schemaCount=0;
  for(const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)){
    try {
      const value=JSON.parse(match[1]);schemaCount++;
      if(!value['@context']||!value['@type'])issues.push('Incomplete JSON-LD on '+p);
      if(value['@type']==='BreadcrumbList'){
        for(const item of value.itemListElement||[])
          if(!item.item?.startsWith(origin+'/'))issues.push('Broken BreadcrumbList item on '+p);
      }
    }catch(e){issues.push('Malformed JSON-LD on '+p+': '+e.message);}
  }
  if(p==='/'){
    if(!html.includes('"@type":"WebSite"')||!html.includes('"name":"Piano Chord Explorer"'))
      issues.push('Homepage missing WebSite name declaration');
  }
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
const privacy=fs.readFileSync(fileFor('/privacy/'),'utf8');
if(!privacy.includes('name="robots" content="noindex,follow"'))issues.push('Privacy must be noindex');
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
