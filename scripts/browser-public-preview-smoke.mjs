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
  const response=await page.goto(origin+'/tools/chord-library/',{waitUntil:'domcontentloaded'});
  assert.equal(response?.status(),200,'Public chord library HTTP status');
  assert.equal(await page.locator('.atlas-card').count(),120,'All 120 chord cards exist');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),
    origin+'/tools/chord-library/','Production canonical is self-consistent');

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
}finally{
  await browser.close();
}
