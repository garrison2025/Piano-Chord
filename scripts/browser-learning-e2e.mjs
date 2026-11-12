/**
 * Native Web Audio + browser UI acceptance of three new learning tools.
 * No user audio, account or external API. Runs against generated static pages.
 */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';

mkdirSync('test-results/learning',{recursive:true});
const origin=process.env.LEARNING_TEST_ORIGIN||'http://127.0.0.1:4321';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const desktop=await browser.newContext({viewport:{width:1280,height:850}});
const page=await desktop.newPage();
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
try{
  const go=async path=>{
    const res=await page.goto(origin+path,{waitUntil:'domcontentloaded'});
    assert.equal(res?.status(),200,path+' HTTP');
  };
  const texts=async selector=>page.locator(selector).allTextContents();
  await go('/tools/scales-and-keys/');
  assert.deepEqual((await texts('#scale-degree-row strong')).map(s=>s.trim()),['C','D','E','F','G','A','B']);
  await page.locator('#scale-root').selectOption('Gb');
  assert.deepEqual((await texts('#scale-degree-row strong')).map(s=>s.trim()),['G♭','A♭','B♭','C♭','D♭','E♭','F']);
  assert.equal(await page.locator('#scale-keyboard button.scale-piano-key').count(),25);
  await page.locator('#scale-mode').selectOption('minor');
  await page.locator('#scale-root').selectOption('A');
  assert.deepEqual((await texts('#scale-degree-row strong')).map(s=>s.trim()),['A','B','C','D','E','F','G']);
  await page.locator('#scale-play').click();
  assert.match(await page.locator('#scale-status').innerText(),/Playing A natural minor/);
  await page.locator('#scale-chords button[data-degree="0"]').click();
  assert.match(await page.locator('#scale-status').innerText(),/Playing Am/);
  await page.screenshot({path:'test-results/learning/scales-desktop.png',fullPage:true});
  console.log('PASS scales, key spelling, keyboard and sound controls');

  await go('/tools/chord-progressions/');
  assert.deepEqual((await texts('#progression-steps strong')).map(s=>s.trim()),['C','G','Am','F']);
  await page.locator('#prog-mode').selectOption('minor');
  await page.locator('#prog-root').selectOption('A');
  await page.locator('#prog-preset').selectOption('cadence');
  assert.deepEqual((await texts('#progression-steps strong')).map(s=>s.trim()),['Am','Dm','E','Am']);
  assert.match(await page.locator('#progression-steps article:nth-child(3) p').innerText(),/G♯/);
  await page.locator('#progression-steps select[data-step="2"]').selectOption('4:minor');
  assert.deepEqual((await texts('#progression-steps strong')).map(s=>s.trim()),['Am','Dm','Em','Am']);
  await page.locator('#prog-bpm').fill('120');
  await page.locator('#prog-start').click();await delay(300);
  assert.ok(await page.locator('#progression-steps .is-current').count()>=1,'No currently playing bar');
  await page.locator('#prog-stop').click();
  assert.equal(await page.locator('#progression-steps .is-current').count(),0);
  await page.locator('#progression-steps [data-preview="1"]').click();
  await page.screenshot({path:'test-results/learning/progressions-desktop.png',fullPage:true});
  console.log('PASS major/minor progressions, harmonic V, edit, play/stop');

  await go('/tools/metronome/');
  await page.locator('#metro-toggle').click();await delay(300);
  assert.match(await page.locator('#metro-toggle').innerText(),/Stop metronome/);
  await page.locator('#metro-meter').selectOption('3');
  assert.equal(await page.locator('#metro-leds .metro-led').count(),3);
  await page.locator('#metro-tap').click();await delay(510);await page.locator('#metro-tap').click();
  const tapped=Number(await page.locator('#metro-bpm').inputValue());
  assert.ok(tapped>=105&&tapped<=135,'Tap tempo outside expected range: '+tapped);
  await page.locator('#metro-toggle').click();await delay(300);
  await page.locator('#metro-toggle').click();
  await page.screenshot({path:'test-results/learning/metronome-desktop.png',fullPage:true});
  console.log('PASS metronome start/stop, 3/4 measure and tap tempo');

  await go('/tools/virtual-piano/');
  assert.equal(await page.locator('.piano-key[data-midi]').count(),88);
  assert.equal(await page.locator('#practice-metronome').count(),1);
  await page.locator('#metro-toggle').click();await delay(200);
  await page.locator('#metro-toggle').click();
  await page.locator('.piano-key[data-midi="60"]').scrollIntoViewIfNeeded();
  await page.locator('.piano-key[data-midi="60"]').click();
  assert.match(await page.locator('#vp-readout').innerText(),/Playing MIDI 60/);
  console.log('PASS original 88-key piano and embedded metronome');

  for(const path of ['/tools/scales-and-keys/','/tools/chord-progressions/','/tools/metronome/']){
    const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const p=await mobile.newPage();p.on('pageerror',e=>errors.push('mobile '+path+': '+e.message));
    const res=await p.goto(origin+path,{waitUntil:'domcontentloaded'});
    assert.equal(res?.status(),200);
    const dims=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
    if(dims.scroll>dims.view+2){
      const offenders=await p.evaluate(()=>[...document.querySelectorAll('body *')].map(e=>{
        const r=e.getBoundingClientRect();return {tag:e.tagName,cls:String(e.className||'').slice(0,90),id:e.id,left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)};
      }).filter(e=>e.right>document.documentElement.clientWidth+3&&e.width>5).slice(0,18));
      console.error('Mobile overflow elements for '+path,JSON.stringify(offenders));
    }
    assert.ok(dims.scroll<=dims.view+2,'Mobile horizontal overflow on '+path+': '+JSON.stringify(dims));
    await p.screenshot({path:'test-results/learning/mobile-'+path.split('/')[2]+'.png',fullPage:true});
    await mobile.close();
  }
  assert.deepEqual(errors,[],'Browser JS errors');
  console.log('PASS all learning routes: desktop + 390px mobile, 0 browser errors');
}catch(e){
  await page.screenshot({path:'test-results/learning/failure.png',fullPage:true}).catch(()=>{});
  console.error(errors.join('\n'));
  throw e;
}finally{
  await desktop.close();await browser.close();
}
