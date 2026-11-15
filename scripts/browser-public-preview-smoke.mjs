/**
 * Public production domain smoke: verify live deployment (not just a local build).
 * Scoped to network-neutral functionality: chord search, page structure, SEO URLs.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const origin='https://pianochordexplorer.com';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  // Cloudflare Pages deployment may complete after this push-triggered test starts.
  // Allow a bounded window for the public origin to switch to the new build.
  const expectedCanonical=origin+'/tools/chord-library/';
  let liveCanonical='';
  for(let attempt=0;attempt<13;attempt++){
    const response=await page.goto(origin+'/tools/chord-library/?deployment-probe='+attempt+'-'+Date.now(),
      {waitUntil:'domcontentloaded'});
    assert.equal(response?.status(),200,'Public chord library HTTP status');
    liveCanonical=await page.locator('link[rel="canonical"]').getAttribute('href');
    if(liveCanonical===expectedCanonical)break;
    console.log('Waiting for Cloudflare production deploy: canonical='+liveCanonical+
      ' (attempt '+(attempt+1)+'/13)');
    if(attempt<12)await page.waitForTimeout(10000);
  }
  assert.equal(liveCanonical,expectedCanonical,'Production canonical is self-consistent');
  assert.equal(await page.locator('.atlas-card').count(),120,'All 120 chord cards exist');

  assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'),
    origin+'/tools/chord-library/','Production Open Graph URL');

  const search=page.locator('#atlas-search');
  for(const [query,expected] of [
    ['F♯m',['G♭m']],['F#m',['G♭m']],['F# minor',['G♭m']],
    ['F#m7',['G♭m7']],['F#m7b5',['G♭m7b5']],
    ['C♯maj7',['D♭maj7']],['Csus4',['Csus4']]
  ]){
    await search.fill(query);
    const visible=(await page.locator('.atlas-card:visible strong').allTextContents()).map(s=>s.trim());
    assert.deepEqual(visible,expected,query+' precise live search');
    console.log('PASS live exact search: '+query+' => '+visible.join(', '));
  }
  await search.fill('sus4');
  assert.equal(await page.locator('.atlas-card:visible').count(),12,'Unqualified sus4 query');
  await search.fill('');
  assert.equal(await page.locator('.atlas-card:visible').count(),120,'Empty query');
  await page.locator('#atlas-type').selectOption('m7b5');
  assert.equal(await page.locator('.atlas-card:visible').count(),12,'Family dropdown');
  await page.locator('#atlas-reset').click();
  assert.equal(await page.locator('.atlas-card:visible').count(),120,'Reset restores all chords');
  console.log('PASS live fuzzy search, family selection, and 120-card reset');

  const sitemap=await page.request.get(origin+'/sitemap.xml');
  assert.equal(sitemap.status(),200,'Public sitemap HTTP');
  const xml=await sitemap.text();
  const locs=[...xml.matchAll(/<url><loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  assert.equal(locs.length,44,'Expected 44 public sitemap page URLs');
  assert.equal(new Set(locs).size,44,'Unique sitemap page URLs');
  assert.ok(locs.every(loc=>loc.startsWith(origin+'/')),'Production sitemap host');
  assert.ok(!xml.includes('piano-chord.pages.dev'),'No preview hostname in sitemap');
  // An image SEO release is complete only when the live public sitemap and SVGs update.
  let liveImageCount=(xml.match(/<image:image>/g)||[]).length;
  if(liveImageCount!==92){
    for(let attempt=0;attempt<12;attempt++){
      await page.waitForTimeout(10000);
      const fresh=await page.request.get(origin+'/sitemap.xml?image-release='+Date.now());
      assert.equal(fresh.status(),200,'Live sitemap availability during deployment');
      liveImageCount=((await fresh.text()).match(/<image:image>/g)||[]).length;
      if(liveImageCount===92)break;
    }
  }
  assert.equal(liveImageCount,92,'Production sitemap must list 92 chord position images');
  for(const [slug,inversion,notes] of [
    ['b-minor',1,'D · F♯ · B'],['c-major-7',3,'B · C · E · G']
  ]){
    const imagePath='/diagrams/inversions/'+slug+'/'+inversion+'.svg';
    const image=await page.request.get(origin+imagePath);
    assert.equal(image.status(),200,imagePath+' live HTTP');
    assert.match(image.headers()['content-type']||'',/image\/svg\+xml/);
    assert.ok((await image.text()).includes('Highlighted piano keys: '+notes),
      imagePath+' live spelled notes');
    const lesson=await page.request.get(origin+'/chords/'+slug+'/');
    assert.equal(lesson.status(),200,slug+' live lesson');
    assert.ok((await lesson.text()).includes('src="'+imagePath+'"'),
      slug+' live HTML must link inversion image via img src');
  }
  console.log('PASS 92 published images, representative SVG routes and HTML image references');
  for(const path of ['/','/chords/b-minor/','/tools/virtual-piano/']){
    const res=await page.request.get(origin+path);
    assert.equal(res.status(),200,path+' HTTP');
    assert.ok(locs.includes(origin+path),path+' in sitemap');
  }
  const robots=await page.request.get(origin+'/robots.txt');
  assert.equal(robots.status(),200,'Public robots.txt HTTP');
  const rules=await robots.text();
  assert.match(rules,/User-agent:\s*\*/);
  assert.ok(rules.includes('Sitemap: '+origin+'/sitemap.xml'));
  console.log('PASS 44 sitemap URLs, tested public pages and robots');

  // SEO/UX rollout: verify current production HTML, not merely a merged commit.
  // The CSS/lesson release doesn't change canonical, so wait for its own marker.
  let liveHomeContent=false;
  for(let attempt=0;attempt<13;attempt++){
    const response=await page.goto(origin+'/?priority-release='+Date.now(),
      {waitUntil:'domcontentloaded'});
    assert.equal(response?.status(),200,'Production homepage status');
    liveHomeContent=await page.locator('#beginner-piano-chords article').count()===5;
    if(liveHomeContent)break;
    if(attempt<12){
      console.log('Waiting for five new priority lesson links on Cloudflare');
      await page.waitForTimeout(10000);
    }
  }
  assert.equal(liveHomeContent,true,'Five priority chord learning links must be publicly deployed');
  for(const slug of ['b-minor','b-flat-major','d-minor','e-minor','g-major']){
    const lesson=await page.request.get(origin+'/chords/'+slug+'/?priority-release='+Date.now());
    assert.equal(lesson.status(),200,slug+' priority lesson status');
    const html=await lesson.text();
    assert.ok(html.includes('data-priority-chord="'+slug+'"'),
      slug+' extended guide must be published on the live host');
    assert.ok(html.includes('id="beginner-guide"'),
      slug+' must include an original guided-learning section');
  }
  const mobileContext=await browser.newContext({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true
  });
  try{
    const mobile=await mobileContext.newPage();
    await mobile.goto(origin+'/?mobile-release='+Date.now(),{waitUntil:'domcontentloaded'});
    const widths=await mobile.evaluate(()=>({
      documentWidth:document.documentElement.scrollWidth,
      viewportWidth:document.documentElement.clientWidth
    }));
    assert.ok(widths.documentWidth<=widths.viewportWidth+2,
      'Published mobile homepage must not scroll horizontally: '+JSON.stringify(widths));
  }finally{
    await mobileContext.close();
  }
  console.log('PASS deployed five priority lessons and 390px no-horizontal-overflow');

  // Wait for the actual GEO/credibility release, not just a canonical that was
  // already correct on the previous version.
  let geoReady=false;
  for(let attempt=0;attempt<13;attempt++){
    const response=await page.goto(origin+'/?geo-release='+Date.now(),
      {waitUntil:'domcontentloaded'});
    assert.equal(response?.status(),200,'GEO production homepage HTTP');
    geoReady=await page.locator('#chord-reference-table table.theory-reference-table').count()===1;
    if(geoReady)break;
    if(attempt<12){
      console.log('Waiting for GEO reference table and schema to deploy');
      await page.waitForTimeout(10000);
    }
  }
  assert.equal(geoReady,true,'GEO source-cited reference table must be published');
  assert.equal(await page.locator('.theory-reference-table tbody tr').count(),5);
  const structured=await page.locator('script[type="application/ld+json"]').allTextContents();
  const entities=structured.map(raw=>JSON.parse(raw));
  for(const type of ['WebSite','Organization','WebPage'])
    assert.ok(entities.some(s=>s['@type']===type),'Production home schema missing '+type);
  assert.ok(entities.find(s=>s['@type']==='Organization')?.sameAs
    ?.includes('https://github.com/garrison2025/Piano-Chord'),
    'Public sameAs must identify the verified source project');
  const homePage=entities.find(s=>s['@type']==='WebPage');
  assert.equal(homePage?.author?.url,origin+'/about/','Published homepage author must resolve');
  assert.equal(homePage?.dateModified,'2026-11-15');
  assert.ok(await page.locator('a[href="/terms/"]').count()>0);
  assert.ok(await page.locator('a[href="/privacy/"]').count()>0);
  assert.ok(await page.locator('a[href="https://open-musictheory.github.io/docs/fundamentals/triads/"]').count()>0);

  const llms=await page.request.get(origin+'/llms.txt');
  assert.equal(llms.status(),200,'Public llms.txt HTTP');
  assert.match(await llms.text(),/^# Piano Chord Explorer/m);
  const terms=await page.request.get(origin+'/terms/');
  assert.equal(terms.status(),200,'Public terms HTTP');
  assert.match(await terms.text(),/name="robots" content="noindex,follow"/);
  for(const checkPath of ['/chords/b-minor/','/guides/how-to-read-piano-chords/']){
    const resp=await page.goto(origin+checkPath+'?geo-release='+Date.now(),
      {waitUntil:'domcontentloaded'});
    assert.equal(resp?.status(),200);
    const entry=(await page.locator('script[type="application/ld+json"]').allTextContents())
      .map(s=>JSON.parse(s)).find(s=>s['@type']==='Article');
    assert.ok(entry,'Published article metadata missing on '+checkPath);
    assert.equal(entry.dateModified,'2026-11-15');
    assert.equal(entry.author?.url,origin+'/about/');
    assert.ok(await page.locator('time[datetime="2026-11-15"]').count()>0);
  }
  await page.goto(origin+'/tools/chord-finder/',{waitUntil:'domcontentloaded'});
  const app=(await page.locator('script[type="application/ld+json"]').allTextContents())
    .map(s=>JSON.parse(s)).find(s=>s['@type']==='WebApplication');
  assert.equal(app?.offers?.price,'0','Tool schema must describe a free app');
  console.log('PASS deployed source-backed table, organization links, articles, free tool schema, llms and Terms');
}finally{
  await browser.close();
}
