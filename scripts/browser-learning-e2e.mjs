/**
 * Native Web Audio + browser UI acceptance of three new learning tools.
 * No user audio, account or external API. Runs against generated static pages.
 */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,statSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
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
  // Regression: the very first note must honor the volume slider, and held
  // Enter/Space must release the ORIGINAL key after moving keyboard focus.
  // An empty second take must keep the previous MIDI and local browser draft.
  const stabilityCtx=await browser.newContext({viewport:{width:1280,height:850}});
  const stability=await stabilityCtx.newPage();
  await stability.addInitScript(()=>{
    const NativeAudio=window.AudioContext||window.webkitAudioContext;
    if(NativeAudio){
      const Monitored=class extends NativeAudio{
        createGain(){
          const gain=super.createGain(),connect=gain.connect.bind(gain);
          gain.connect=(target,...args)=>{
            if(target===this.destination)window.__firstMasterGain=gain.gain.value;
            return connect(target,...args);
          };
          return gain;
        }
      };
      window.AudioContext=Monitored;
      if(window.webkitAudioContext)window.webkitAudioContext=Monitored;
    }
  });
  await stability.goto(origin+'/tools/virtual-piano/',{waitUntil:'domcontentloaded'});
  await stability.locator('#vp-vol').fill('0');
  await stability.locator('.piano-key[data-midi="60"]').focus();
  await stability.keyboard.down('Enter');
  assert.equal(await stability.evaluate(()=>window.__firstMasterGain),0,
    'Muted before the very first note should connect a 0-gain master');
  assert.equal(await stability.locator('.piano-key[data-midi="60"].pressed').count(),1);
  await stability.keyboard.down('ArrowRight');
  await stability.keyboard.up('ArrowRight');
  await stability.keyboard.up('Enter');
  assert.equal(await stability.locator('.piano-key[data-midi="60"].pressed').count(),0,
    'Enter release after focus moves must release the original note');
  await stability.locator('.piano-key[data-midi="62"]').focus();
  await stability.keyboard.down('Space');
  assert.equal(await stability.locator('.piano-key[data-midi="62"].pressed').count(),1);
  await stability.keyboard.down('ArrowRight');
  await stability.keyboard.up('ArrowRight');
  await stability.keyboard.up('Space');
  assert.equal(await stability.locator('.piano-key[data-midi="62"].pressed').count(),0,
    'Space release after focus moves must release the original note');
  await stability.locator('#vp-vol').fill('60');
  await stability.locator('#vp-record').click();
  await stability.locator('.piano-key[data-midi="60"]').focus();
  await stability.keyboard.down('Enter');
  await stability.keyboard.up('Enter');
  await stability.locator('#vp-end-record').click();
  assert.equal(await stability.locator('#vp-midi').isDisabled(),false,
    'A valid take must allow MIDI download');
  await stability.waitForFunction(async()=>{
    return await new Promise(resolve=>{
      const r=indexedDB.open('piano-chord-explorer-local-v1');
      r.onerror=()=>resolve(false);
      r.onsuccess=()=>{
        const db=r.result,tx=db.transaction('drafts','readonly'),q=tx.objectStore('drafts').get('latest');
        q.onsuccess=()=>{resolve(!!q.result?.take?.events?.length);db.close();};
        q.onerror=()=>{resolve(false);db.close();};
      };
    });
  },null,{timeout:10000});
  await stability.locator('#vp-record').click();
  await stability.locator('#vp-end-record').click();
  assert.equal(await stability.locator('#vp-midi').isDisabled(),false,
    'Silent overwrite attempts must preserve the former valid take');
  assert.match(await stability.locator('#vp-message').innerText(),/previous take/i);
  await stability.reload({waitUntil:'domcontentloaded'});
  await stability.waitForFunction(()=>!document.getElementById('vp-midi')?.disabled,null,{timeout:8000});
  assert.match(await stability.locator('#vp-message').innerText(),/Restored the most recent/);
  await stability.locator('#vp-clear-saved').click();
  await stability.locator('#vp-message').getByText(/draft cleared/).waitFor({timeout:8000});
  await stability.reload({waitUntil:'domcontentloaded'});
  await stability.waitForTimeout(650);
  assert.equal(await stability.locator('#vp-midi').isDisabled(),true,
    'Clear saved draft should disable restored MIDI after reload');
  await stabilityCtx.close();
  console.log('PASS first-note mute, focus-changing Enter/Space releases, empty-take preservation and IndexedDB recovery');

  // Static human-facing answers, source context and AI-search eligible markup.
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  for(const question of ['What is a piano chord?','What notes make C major?',
    'How is B minor different from D major?','Is C7 the same as Cmaj7?'])
    assert.equal(await page.getByRole('heading',{name:question}).count(),1);
  await page.goto(origin+'/chords/c-major/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#chord-quick-answer [data-chord-answer]').count(),1);
  assert.match(await page.locator('#chord-quick-answer').innerText(),/C.*E.*G/s);
  await page.goto(origin+'/chords/c-7/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#chord-quick-answer [data-inversion-answer]').count(),1);
  assert.match(await page.locator('#chord-quick-answer').innerText(),/B♭/);
  await page.goto(origin+'/about/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.getByRole('heading',{name:'Source, calculation and review boundaries'}).count(),1);
  console.log('PASS visible GEO answers, musical definitions and transparent source methodology');

  // 16 V1.3 priority plus 13 individually authored supplemental lessons.
  await go('/chords/b-minor/');
  const minorProgression=page.locator('a[href^="/tools/chord-progressions/?root=B&mode=minor&preset=cadence"]');
  assert.equal(await minorProgression.count(),1);
  await minorProgression.click();
  await page.waitForFunction(()=>document.getElementById('prog-root')?.value==='B'&&
    document.getElementById('prog-mode')?.value==='minor'&&document.getElementById('prog-preset')?.value==='cadence',
    null,{timeout:9000});
  assert.equal((await texts('#progression-steps strong'))[0],'Bm');
  await go('/chords/c-sharp-minor/');
  await page.locator('a[href^="/tools/chord-progressions/?root=C%23&mode=minor&preset=cadence"]').click();
  await page.waitForFunction(()=>document.getElementById('prog-root')?.value==='C#',null,{timeout:9000});
  assert.equal((await texts('#progression-steps strong'))[0],'C♯m');
  await go('/chords/a-minor-7/');
  await page.locator('a[href="/guides/seventh-chords-piano/?pattern=turnaround#cadence"]').click();
  await page.waitForFunction(()=>document.getElementById('seventh-pattern')?.value==='turnaround',null,{timeout:9000});
  assert.deepEqual((await texts('#seventh-player-bars strong')).map(s=>s.trim()),['Cmaj7','Am7','Dm7','G7']);
  await go('/chords/c-7/');
  await page.locator('a[href="/guides/seventh-chords-piano/#c7-resolution"]').click();
  assert.equal(await page.locator('#c7-resolution').isVisible(),true);
  assert.equal(await page.locator('#c7-resolution button[data-play-midi]').count(),2);
  assert.match(await page.locator('#c7-resolution').innerText(),/C7.*F major/s);
  console.log('PASS lessons → tonic and seventh progressions, C7-to-F true resolution');
  await go('/chords/b-minor/');
  assert.equal(await page.locator('#ear-training').isVisible(),true);
  assert.equal(await page.locator('.ear-training-chord').count(),2);
  assert.equal(await page.locator('.ear-training-reveal').getAttribute('open'),null);
  await page.locator('.ear-training-reveal summary').click();
  assert.match(await page.locator('.ear-training-reveal').innerText(),/D and F♯ are shared/);
  await page.locator('.ear-training-chord').first().click();
  assert.match(await page.locator('#app-status').innerText(),/Playing chord/);
  await page.locator('.ear-training-chord').last().click();
  await page.locator('#ear-training a[href="/tools/chord-compare/?a=b-minor&b=d-major"]').click();
  await page.waitForFunction(()=>document.getElementById('compare-a')?.value==='b-minor' &&
    document.getElementById('compare-b')?.value==='d-major',null,{timeout:9000});
  assert.match(await page.locator('#compare-result').innerText(),/D · F♯/);
  await page.screenshot({path:'test-results/learning/bm-to-d-compare.png',fullPage:true});
  await go('/chords/c-7/');
  await page.locator('#ear-training .ear-training-reveal summary').click();
  assert.match(await page.locator('#ear-training .ear-training-reveal').innerText(),/tritone E–B♭/);
  await page.locator('#ear-training a[href="/tools/chord-compare/?a=c-7&b=f-major"]').click();
  await page.waitForFunction(()=>document.getElementById('compare-a')?.value==='c-7' &&
    document.getElementById('compare-b')?.value==='f-major',null,{timeout:9000});
  assert.match(await page.locator('#compare-result').innerText(),/Shared sounding notes/);
  await go('/chords/c-major-7/');
  assert.equal(await page.locator('#ear-training .ear-training-chord').count(),2);
  assert.match(await page.locator('#ear-training').innerText(),/Cmaj7.*C7/s);
  await page.locator('#ear-training a[href="/tools/chord-compare/?a=c-major-7&b=c-7"]').click();
  await page.waitForFunction(()=>document.getElementById('compare-a')?.value==='c-major-7' &&
    document.getElementById('compare-b')?.value==='c-7',null,{timeout:9000});
  await go('/chords/d-flat-major/');
  assert.equal(await page.locator('#ear-training .ear-training-chord').count(),2);
  await page.locator('#ear-training .ear-training-reveal summary').click();
  assert.match(await page.locator('#ear-training .ear-training-reveal').innerText(),/D♭ and F/);
  await page.locator('#ear-training a[href="/tools/chord-compare/?a=d-flat-major&b=b-flat-minor"]').click();
  await page.waitForFunction(()=>document.getElementById('compare-a')?.value==='d-flat-major' &&
    document.getElementById('compare-b')?.value==='b-flat-minor',null,{timeout:9000});
  assert.match(await page.locator('#compare-result').innerText(),/D♭.*F/s);
  console.log('PASS full lesson categories: triads, sharp/flat spellings and sevenths');
  const practiceMobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const practicePage=await practiceMobile.newPage();
  await practicePage.goto(origin+'/chords/b-minor/',{waitUntil:'domcontentloaded'});
  assert.equal(await practicePage.locator('#ear-training').isVisible(),true);
  const practiceMetrics=await practicePage.evaluate(()=>({
    scroll:document.documentElement.scrollWidth,
    viewport:document.documentElement.clientWidth
  }));
  assert.ok(practiceMetrics.scroll<=practiceMetrics.viewport+2,'Mobile lesson ear drill overflow: '+JSON.stringify(practiceMetrics));
  await practicePage.screenshot({path:'test-results/learning/mobile-chord-ear-drill.png',fullPage:true});
  await practiceMobile.close();
  console.log('PASS authored ear drills and preselected A/B comparisons across lesson families, 390px mobile layout');

  // SEO-relevant examples must be legible without client execution; then
  // the contextual links must select the right notes in the actual tools.
  await go('/tools/chord-finder/');
  assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'),
    'https://piano-chord.pages.dev/share-card.png');
  assert.equal(await page.locator('meta[name="twitter:card"]').getAttribute('content'),'summary_large_image');
  const previewResponse=await page.request.get(origin+'/share-card.png');
  assert.equal(previewResponse.status(),200,'Local OG image route');
  assert.match(previewResponse.headers()['content-type']||'',/image\/png/);
  const decodedCard=await page.evaluate(async()=>{
    const img=new Image();
    img.src='/share-card.png';
    await img.decode();
    return {width:img.naturalWidth,height:img.naturalHeight};
  });
  assert.deepEqual(decodedCard,{width:1200,height:630},
    'Share preview PNG must decode to the intended raster image');
  assert.equal(await page.getByRole('heading',{name:'C–E–G: C major'}).count(),1);
  assert.equal(await page.getByRole('heading',{name:'C–E–G–B♭: C7'}).count(),1);
  assert.equal(await page.getByRole('heading',{name:'What if your chord is not recognised?'}).count(),1);
  await go('/tools/chord-compare/');
  await page.locator('a[href="/tools/chord-compare/?a=b-minor&b=d-major"]').click();
  await page.waitForFunction(()=>document.getElementById('compare-a')?.value==='b-minor' &&
    document.getElementById('compare-b')?.value==='d-major',null,{timeout:9000});
  assert.equal(await page.getByRole('heading',{name:'Bm → D major: keep two notes still'}).count(),1);
  await go('/tools/metronome/');
  for(const name of ['2/4: two beats per bar','3/4: three beats per bar','4/4: four beats per bar'])
    assert.equal(await page.getByRole('heading',{name}).count(),1);
  assert.equal(await page.locator('link[rel="preconnect"][href="https://fonts.gstatic.com"]').count(),1);
  assert.equal(await page.locator('link[rel="stylesheet"][href^="https://fonts.googleapis.com/css2"]').count(),1);
  console.log('PASS authored finder/compare/metronome examples, contextual links and font resource hints');

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

  // 120-family atlas -> theoretical inversions -> playable examples -> live recognition.
  await go('/tools/chord-library/');
  assert.equal(await page.locator('.atlas-card').count(),120);
  assert.equal(await page.locator('.atlas-card a[href^="/tools/inversion-explorer/?root="]').count(),120);
  await page.locator('#atlas-type').selectOption('m7b5');
  assert.equal(await page.locator('.atlas-card:visible').count(),12);
  await page.locator('#atlas-reset').click();
  await page.locator('.atlas-card a[href="/tools/inversion-explorer/?root=Db&quality=maj7"]').click();
  assert.match(page.url(),/root=Db.*quality=maj7/);
  await page.waitForFunction(()=>document.getElementById('inversion-chord')?.value==='Db:maj7',null,{timeout:10000});
  assert.equal(await page.locator('#inversion-chord').inputValue(),'Db:maj7');
  assert.equal(await page.locator('#inversion-tool .inversion-card').count(),4);
  assert.match(await page.locator('#inversion-tool').innerText(),/D♭ · F · A♭ · C/);
  await page.locator('#inversion-chord').selectOption('C:sus4');
  assert.equal(await page.locator('#inversion-tool .inversion-card').count(),3);
  assert.match(await page.locator('#inversion-tool').innerText(),/Csus4\/F/);
  await page.locator('#inversion-tool .inversion-card').first().locator('button[data-play-midi]').click();
  assert.match(await page.locator('#app-status').innerText(),/Playing chord/);
  await page.screenshot({path:'test-results/learning/120-inversions.png',fullPage:true});
  await go('/tools/chord-finder/');
  for(const pc of [0,4,7])await page.locator('[data-pitch="'+pc+'"]').click();
  await page.locator('#finder-bass').selectOption('4');
  assert.match(await page.locator('#finder-results').innerText(),/C\/E/);
  assert.match(await page.locator('#finder-results').innerText(),/First inversion/);
  const cMajorFirst=page.locator('#finder-results li').filter({hasText:'C Major'}).first();
  assert.equal(await cMajorFirst.locator('button[data-play-midi]').getAttribute('data-play-midi'),'64,67,72',
    'C/E result must audition first inversion, not root position');
  await page.locator('#finder-bass').selectOption('2');
  assert.match(await page.locator('#finder-results').innerText(),/C\/D/);
  assert.match(await page.locator('#finder-results').innerText(),/not an inversion/i);
  assert.equal(await cMajorFirst.locator('button[data-play-midi]').getAttribute('data-play-midi'),'50,60,64,67',
    'C/D result must audition the added D bass below the C major chord');
  await page.locator('#clear-pitches').click();
  assert.equal(await page.locator('#finder-bass').inputValue(),'');
  assert.match(await page.locator('#finder-results').innerText(),/0 notes selected/);
  for(const pc of [0,5,7])await page.locator('[data-pitch="'+pc+'"]').click();
  assert.match(await page.locator('#finder-results').innerText(),/Csus4/);
  await page.locator('#finder-results a[href="/tools/inversion-explorer/?root=C&quality=sus4"]').click();
  assert.match(page.url(),/root=C.*quality=sus4/);
  await page.waitForFunction(()=>document.getElementById('inversion-chord')?.value==='C:sus4',null,{timeout:10000});
  assert.equal(await page.locator('#inversion-chord').inputValue(),'C:sus4');
  await go('/tools/chord-finder/');
  for(const pc of [0,3,6,10])await page.locator('[data-pitch="'+pc+'"]').click();
  assert.match(await page.locator('#finder-results').innerText(),/Cm7b5/);
  assert.ok(await page.locator('#finder-results button[data-play-midi]').count()>=1);
  await page.screenshot({path:'test-results/learning/120-family-finder.png',fullPage:true});
  await go('/tools/virtual-piano/');
  await page.locator('#vp-scroll').focus();
  for(const key of ['a','f','g'])await page.keyboard.down(key);
  assert.match(await page.locator('#vp-chord-name').innerText(),/Csus4/);
  for(const key of ['g','f','a'])await page.keyboard.up(key);
  console.log('PASS 120 atlas inversion links, all-family finder, full inversions and real 88-key sus4');

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

  // Handoff must preserve a manually edited minor cadence, its harmonic V, and tempo.
  await go('/tools/chord-progressions/');
  await page.locator('#prog-mode').selectOption('minor');
  await page.locator('#prog-root').selectOption('A');
  await page.locator('#prog-preset').selectOption('cadence');
  await page.locator('#prog-bpm').fill('120');
  const handoff=await page.locator('#prog-piano-link').getAttribute('href');
  assert.ok(handoff?.includes('practice=1')&&handoff.includes('120'));
  await go(handoff);
  assert.equal(await page.locator('#piano-practice').isVisible(),true);
  assert.deepEqual((await texts('.practice-bar strong')).map(x=>x.trim()),['Am','Dm','E','Am']);
  assert.match(await page.locator('#practice-current').innerText(),/Bar 1 of 4/);
  assert.equal(await page.locator('.piano-key.practice-target').count(),3);
  await page.locator('#vp-scroll').focus();
  await page.keyboard.down('h');await page.keyboard.down('a');await page.keyboard.down('d');
  assert.match(await page.locator('#practice-status').innerText(),/Correct Am chord/);
  await page.keyboard.up('d');await page.keyboard.up('a');await page.keyboard.up('h');
  await page.locator('#practice-bars button:nth-child(3)').click();
  assert.match(await page.locator('#practice-current').innerText(),/E/);
  assert.equal(await page.locator('.piano-key.practice-target').count(),3);
  await page.locator('#practice-record').click();
  assert.equal(await page.locator('#practice-pulse').getAttribute('data-phase'),'countin');
  assert.equal(await page.locator('#vp-end-record').isDisabled(),true,'Count-in must not record yet');
  assert.equal(await page.locator('#vp-practice-hud').isVisible(),true);
  assert.equal(await page.locator('#vp-practice-cancel').isVisible(),true);
  await page.locator('#vp-practice-cancel').click();
  assert.equal(await page.locator('#vp-end-record').isDisabled(),true,'Cancel must not leave a recording');
  assert.equal(await page.locator('#practice-pulse').getAttribute('data-phase'),'idle');
  await page.locator('#practice-record').click();
  await page.waitForFunction(()=>!document.getElementById('vp-end-record')?.disabled,null,{timeout:6000});
  assert.equal(await page.locator('#practice-pulse').getAttribute('data-phase'),'playing');
  assert.equal(await page.locator('#vp-export').isDisabled(),true);
  await page.locator('#vp-scroll').focus();
  await page.keyboard.down('d');await page.keyboard.down('y');await page.keyboard.down('k');
  await delay(150);await page.keyboard.up('k');await page.keyboard.up('y');await page.keyboard.up('d');
  await page.locator('#vp-end-record').click();
  assert.equal(await page.locator('#vp-midi').isDisabled(),false);
  assert.equal(await page.locator('#practice-report').isVisible(),true);
  assert.match(await page.locator('#practice-report-summary').innerText(),/Matched 0 of 4 scheduled bars/);
  // Ensure target key color is actually painted, not merely a JS class.
  const hintColor=await page.locator('.piano-key.practice-target.white').first().evaluate(el=>getComputedStyle(el).backgroundImage);
  const regularColor=await page.locator('.piano-key.white:not(.practice-target)').first().evaluate(el=>getComputedStyle(el).backgroundImage);
  assert.notEqual(hintColor,regularColor,'Target keys are not visibly differentiated');
  await page.screenshot({path:'test-results/learning/piano-guided-practice.png',fullPage:true});
  const mobileGuide=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const mobilePage=await mobileGuide.newPage();
  await mobilePage.goto(origin+handoff,{waitUntil:'domcontentloaded'});
  assert.equal(await mobilePage.locator('#piano-practice').isVisible(),true);
  const guideWidth=await mobilePage.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
  assert.ok(guideWidth.scroll<=guideWidth.view+2,'Mobile piano guide overflow: '+JSON.stringify(guideWidth));
  await mobilePage.screenshot({path:'test-results/learning/piano-guided-practice-mobile.png',fullPage:true});
  await mobileGuide.close();
  await page.locator('#practice-edit').click();
  // Static Astro HTML initially shows the C-major default; query-state restoration
  // runs after the client module loads. Wait for the user-visible restored state.
  await page.waitForFunction(()=>
    document.querySelector('#prog-bpm')?.value==='120' &&
    [...document.querySelectorAll('#progression-steps strong')].map(e=>e.textContent.trim()).join(',')==='Am,Dm,E,Am',
    null,{timeout:10000});
  assert.deepEqual((await texts('#progression-steps strong')).map(x=>x.trim()),['Am','Dm','E','Am']);
  assert.equal(await page.locator('#prog-bpm').inputValue(),'120');
  await page.screenshot({path:'test-results/learning/progression-piano-roundtrip.png',fullPage:true});
  console.log('PASS progression roundtrip, chord hints, actual keyboard matching and practice recording');
  await go('/tools/virtual-piano/?practice=1&root=C&mode=major&bpm=90&steps=0%3Aminor');
  assert.equal(await page.locator('#piano-practice').isVisible(),false);
  assert.equal(await page.locator('.piano-key[data-midi]').count(),88);
  console.log('PASS rejected malformed practice URL without disrupting virtual piano');

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
  // Local static server resource sample, not a real-user Core Web Vitals score.
  await page.waitForLoadState('networkidle');
  const pianoResources=await page.evaluate(()=>{
    const scripts=performance.getEntriesByType('resource').filter(x=>/\.js(?:\?|$)/.test(x.name));
    return {jsCount:scripts.length,
      jsBytes:scripts.reduce((sum,x)=>sum+x.encodedBodySize,0),
      urls:scripts.map(x=>new URL(x.name).pathname)};
  });
  assert.ok(!pianoResources.urls.some(u=>/\/_astro\/client[.-]/.test(u)),
    'Virtual piano must not download the unused chord-atlas client module: '+pianoResources.urls.join(', '));
  assert.ok(!pianoResources.urls.some(u=>/ffmpeg|ffmpeg-core|ffmpeg-worker/.test(u)),
    'Optional video conversion must not download before the user requests conversion');
  // Python's lightweight static HTTP server does not always expose browser
  // resource byte sizes, so read the exact requested built JS files from dist.
  const jsBuiltBytes=pianoResources.urls.filter(u=>u.startsWith('/_astro/')).reduce((n,url)=>{
    const artifact=join('dist',url.slice(1));
    return n+(existsSync(artifact)?statSync(artifact).size:0);
  },0);
  assert.ok(jsBuiltBytes>0,'Initial JavaScript size must be measurable from the real generated assets');
  console.log('Piano initial JS resources: '+pianoResources.jsCount+
    ' files / '+Math.round(jsBuiltBytes/1024)+' KiB built JS (uncompressed; local static server, not Core Web Vitals)');
  assert.equal(await page.locator('.piano-key[data-midi]').count(),88);
  assert.equal(await page.locator('#practice-metronome').count(),1);
  await page.locator('#metro-toggle').click();await delay(200);
  await page.locator('#metro-toggle').click();
  await page.locator('.piano-key[data-midi="60"]').scrollIntoViewIfNeeded();
  await page.locator('.piano-key[data-midi="60"]').click();
  assert.match(await page.locator('#vp-readout').innerText(),/Playing MIDI 60/);
  // Real captured pointer: glide should hit-test the physical target key.
  assert.equal(await page.locator('#vp-touch-scroll').getAttribute('aria-pressed'),'true');
  await page.locator('#vp-touch-glide').click();
  assert.equal(await page.locator('#vp-scroll').getAttribute('data-touch-mode'),'glide');
  const c4=page.locator('.piano-key[data-midi="60"]');
  const d4=page.locator('.piano-key[data-midi="62"]');
  await c4.scrollIntoViewIfNeeded();
  const boxC=await c4.boundingBox(),boxD=await d4.boundingBox();
  assert.ok(boxC&&boxD,'Glide test needs C4/D4 hit boxes');
  await page.mouse.move(boxC.x+boxC.width/2,boxC.y+boxC.height-19);
  await page.mouse.down();
  assert.equal(await c4.evaluate(el=>el.classList.contains('pressed')),true);
  await page.mouse.move(boxD.x+boxD.width/2,boxD.y+boxD.height-19,{steps:4});
  assert.equal(await d4.evaluate(el=>el.classList.contains('pressed')),true);
  assert.equal(await c4.evaluate(el=>el.classList.contains('pressed')),false);
  // Move entirely outside the keybed while the pointer is captured, then back
  // onto a key. A temporary gap must not permanently forget the finger.
  await page.mouse.move(boxC.x+boxC.width/2,boxC.y-35,{steps:2});
  assert.equal(await d4.evaluate(el=>el.classList.contains('pressed')),false);
  await page.mouse.move(boxD.x+boxD.width/2,boxD.y+boxD.height-19,{steps:3});
  assert.equal(await d4.evaluate(el=>el.classList.contains('pressed')),true,
    'Glide must resume when a held finger re-enters the keyboard');
  await page.mouse.up();
  assert.equal(await d4.evaluate(el=>el.classList.contains('pressed')),false);
  await page.locator('#vp-touch-scroll').click();
  assert.equal(await page.locator('#vp-scroll').getAttribute('data-touch-mode'),'scroll');
  // A backgrounded mobile page must not leave a held voice sounding.
  await page.locator('#vp-touch-glide').click();
  await c4.scrollIntoViewIfNeeded();
  const hiddenBox=await c4.boundingBox();
  await page.mouse.move(hiddenBox.x+hiddenBox.width/2,hiddenBox.y+hiddenBox.height-18);
  await page.mouse.down();
  assert.equal(await c4.evaluate(el=>el.classList.contains('pressed')),true);
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.equal(await c4.evaluate(el=>el.classList.contains('pressed')),false);
  await page.mouse.up();
  await page.evaluate(()=>{delete document.hidden;});
  await page.locator('#vp-touch-scroll').click();
  console.log('PASS captured glissando re-entry, background-release safety, scroll restoration');

  // Synthesized sustain has bounded polyphony; additional keys must not
  // multiply oscillator nodes without limit on resource-constrained phones.
  await page.evaluate(()=>{
    for(let i=0;i<35;i++){
      document.querySelector('.piano-key[data-midi="'+(30+i)+'"]').dispatchEvent(
        new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',pointerId:100+i,button:0}));
    }
  });
  assert.equal(await page.locator('.piano-key.pressed').count(),24,
    'Piano must bound simultaneous sounding voices while allowing new notes');
  await page.evaluate(()=>{
    for(let i=0;i<35;i++)
      document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',pointerId:100+i,button:0}));
  });
  assert.equal(await page.locator('.piano-key.pressed').count(),0,
    'Synthetic multi-note session must not leave held keys behind');
  console.log('PASS 24-voice Web Audio polyphony limit and complete source cleanup');

  // Two independent mobile touch contacts: hold E4, drag C4 to D4, release.
  const touchContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const touchPage=await touchContext.newPage();
  await touchPage.goto(origin+'/tools/virtual-piano/',{waitUntil:'domcontentloaded'});
  await touchPage.locator('#vp-touch-glide').click();
  const cMobile=touchPage.locator('.piano-key[data-midi="60"]');
  const eMobile=touchPage.locator('.piano-key[data-midi="64"]');
  const dMobile=touchPage.locator('.piano-key[data-midi="62"]');
  await cMobile.scrollIntoViewIfNeeded();
  const cm=await cMobile.boundingBox(),em=await eMobile.boundingBox(),dm=await dMobile.boundingBox();
  assert.ok(cm&&em&&dm,'Mobile C4/D4/E4 hit boxes');
  const finger=(b,id)=>({x:b.x+b.width/2,y:b.y+b.height-18,id});
  const session=await touchContext.newCDPSession(touchPage);
  try{
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger(cm,11)]});
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger(cm,11),finger(em,12)]});
    assert.equal(await cMobile.evaluate(el=>el.classList.contains('pressed')),true);
    assert.equal(await eMobile.evaluate(el=>el.classList.contains('pressed')),true);
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[finger(dm,11),finger(em,12)]});
    assert.equal(await dMobile.evaluate(el=>el.classList.contains('pressed')),true);
    assert.equal(await eMobile.evaluate(el=>el.classList.contains('pressed')),true);
    assert.equal(await cMobile.evaluate(el=>el.classList.contains('pressed')),false);
    // CDP touchEnd requires an empty touchPoints list. Ending one contact
    // with a non-empty list does NOT model an individual pointer release.
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await dMobile.evaluate(el=>el.classList.contains('pressed')),false);
    assert.equal(await eMobile.evaluate(el=>el.classList.contains('pressed')),false);
    assert.equal(await cMobile.evaluate(el=>el.classList.contains('pressed')),false);
    await touchPage.screenshot({path:'test-results/learning/mobile-two-finger-glide.png',fullPage:true});
  }finally{
    await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]}).catch(()=>{});
    await touchContext.close();
  }
  console.log('PASS Chromium two-touch gesture, independent release and glissando');
  console.log('PASS original 88-key piano and embedded metronome');

  // Validate actual generated lesson routes and diagrams, not only theory formulas.
  const addedLessons=[
    ['d-flat-major','D-flat major'],['g-flat-major','G-flat major'],
    ['a-flat-major','A-flat major'],['a-major','A major'],
    ['c-sharp-minor','C-sharp minor'],['e-flat-minor','E-flat minor'],
    ['f-sharp-minor','F-sharp minor'],['g-sharp-minor','G-sharp minor'],
    ['b-flat-minor','B-flat minor']
  ];
  await go('/chords/');
  assert.equal(await page.locator('[data-searchable-chord]').count(),29);
  await page.locator('[data-quality-filter="seventh"]').click();
  assert.equal(await page.locator('[data-searchable-chord]:visible').count(),5,'Seventh filter must include all five authored seventh lessons');
  await page.locator('[data-quality-filter="all"]').click();
  await page.locator('#chord-search').fill('F#m');
  assert.equal(await page.locator('[data-searchable-chord]:visible').count(),1,'F#m search should find one authored lesson');
  await page.screenshot({path:'test-results/learning/29-chord-search.png',fullPage:true});
  for(const [slug,name] of addedLessons){
    await go('/chords/'+slug+'/');
    assert.match(await page.locator('h1').innerText(),new RegExp(name+' piano chord','i'));
    assert.equal(await page.locator('[data-inversion-button]').count(),3,slug+' inversion count');
    const paragraphs=await page.locator('#practice .prose p').allTextContents();
    assert.ok(paragraphs.some(p=>p.length>90),slug+' needs authored explanation');
    const img='/diagrams/'+slug+'.svg';
    const response=await page.request.get(origin+img);
    assert.equal(response.status(),200,img+' HTTP');
    assert.match(await response.text(),/Highlighted piano keys/);
  }
  const seventhLessons=[
    ['c-major-7','C major seventh',['C','E','G','B'],'major seventh'],
    ['a-minor-7','A minor seventh',['A','C','E','G'],'minor seventh'],
    ['d-minor-7','D minor seventh',['D','F','A','C'],'minor seventh'],
    ['g-7','G dominant seventh',['G','B','D','F'],'minor seventh']
  ];
  for(const [slug,name,notes,seventhName] of seventhLessons){
    await go('/chords/'+slug+'/');
    assert.match(await page.locator('h1').innerText(),new RegExp(name+' piano chord','i'));
    assert.equal(await page.locator('[data-inversion-button]').count(),4,slug+' needs four voicings');
    assert.match(await page.locator('#practice').innerText(),new RegExp('is a '+seventhName,'i'));
    const noteLabels=(await page.locator('#listen .note-row .note-pill').allTextContents()).map(n=>n.trim());
    assert.deepEqual(noteLabels,notes,'Wrong lesson notes for '+slug);
    const svg=await page.request.get(origin+'/diagrams/'+slug+'.svg');
    assert.equal(svg.status(),200,slug+' SVG route');
    assert.match(await svg.text(),/Highlighted piano keys/);
  }
  await go('/chords/c-major-7/');
  await page.locator('[data-inversion-button="3"]').click();
  assert.equal(await page.locator('[data-inversion-view="3"]').isVisible(),true);
  await page.locator('[data-inversion-view="3"] button[data-play-midi]').click();
  await delay(200);
  assert.match(await page.locator('#app-status').innerText(),/Playing chord/);
  await page.screenshot({path:'test-results/learning/cmaj7-third-inversion.png',fullPage:true});
  await go('/guides/seventh-chords-piano/');
  await page.locator('#seventh-player[data-ready="true"]').waitFor({timeout:10000});
  await page.locator('#seventh-pattern').selectOption('ii-v-i');
  assert.deepEqual((await texts('#seventh-player-bars strong')).map(s=>s.trim()),['Dm7','G7','Cmaj7']);
  assert.equal(await page.locator('#seventh-stop').isDisabled(),true);
  await page.locator('#seventh-start').click();
  await page.locator('#seventh-player-bars .is-current').first().waitFor({state:'visible',timeout:5000});
  assert.match(await page.locator('#seventh-player-status').innerText(),/Playing bar 1/);
  assert.equal(await page.locator('#seventh-stop').isDisabled(),false);
  await page.locator('#seventh-stop').click();
  assert.equal(await page.locator('#seventh-stop').isDisabled(),true);
  assert.equal(await page.locator('#seventh-player-bars .is-current').count(),0);
  await page.locator('#seventh-pattern').selectOption('turnaround');
  assert.deepEqual((await texts('#seventh-player-bars strong')).map(s=>s.trim()),['Cmaj7','Am7','Dm7','G7']);
  await page.locator('#seventh-loop').check();
  await page.locator('#seventh-tempo').evaluate(el=>{el.value='130';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.locator('#seventh-tempo-output').innerText(),'130 BPM');
  await page.locator('#seventh-start').click();
  await page.locator('#seventh-player-bars .is-current').first().waitFor({state:'visible',timeout:5000});
  await page.locator('#seventh-stop').click();
  await page.screenshot({path:'test-results/learning/seventh-continuous-practice.png',fullPage:true});
  console.log('PASS real Web Audio continuous ii–V–I, turnaround, stop, loop and tempo');
  assert.equal(await page.locator('#listen .seventh-card').count(),3);
  assert.equal(await page.locator('#cadence .seventh-step').count(),3);
  await page.locator('#listen .seventh-card button[data-play-midi]').first().click();
  await delay(150);
  assert.match(await page.locator('#app-status').innerText(),/Playing chord/);
  await page.screenshot({path:'test-results/learning/seventh-types-guide.png',fullPage:true});
  console.log('PASS four authored seventh lessons, four inversions each, true sound and separate comparison guide');

  // Seventh lesson -> playable 88 keys -> four-note recognition -> local recording.
  await go('/guides/seventh-chords-piano/');
  await page.locator('#seventh-player[data-ready="true"]').waitFor();
  await page.locator('#seventh-pattern').selectOption('ii-v-i');
  await page.locator('#seventh-tempo').evaluate(el=>{el.value='110';el.dispatchEvent(new Event('input',{bubbles:true}));});
  const seventhLink=await page.locator('#seventh-piano-link').getAttribute('href');
  assert.ok(seventhLink?.includes('practice=7')&&seventhLink.includes('ii-v-i')&&seventhLink.includes('110'));
  await go(seventhLink);
  assert.equal(await page.locator('#piano-practice').isVisible(),true);
  assert.deepEqual((await texts('#practice-bars strong')).map(x=>x.trim()),['Dm7','G7','Cmaj7']);
  assert.match(await page.locator('#practice-current').innerText(),/Bar 1 of 3/);
  assert.equal(await page.locator('.piano-key.practice-target').count(),4);
  await page.locator('#vp-scroll').focus();
  for(const note of ['s','f','h','k'])await page.keyboard.down(note);
  assert.match(await page.locator('#vp-chord-name').innerText(),/Dm7/);
  assert.equal(await page.locator('#vp-chord-detect').getAttribute('data-kind'),'seventh');
  assert.match(await page.locator('#practice-status').innerText(),/Correct Dm7 chord/);
  for(const note of ['k','h','f','s'])await page.keyboard.up(note);
  await page.locator('#practice-record').click();
  assert.equal(await page.locator('#vp-end-record').isDisabled(),true,'No recording during the four-beat count-in');
  assert.equal(await page.locator('#vp-practice-stop-take').isVisible(),false);
  await page.waitForFunction(()=>!document.getElementById('vp-end-record')?.disabled,null,{timeout:6500});
  assert.equal(await page.locator('#vp-practice-stop-take').isVisible(),true);
  assert.match(await page.locator('#vp-practice-pulse-caption').innerText(),/BAR 1 \/ 3/);
  await page.locator('#vp-scroll').focus();
  for(const note of ['s','f','h','k'])await page.keyboard.down(note);
  await delay(160);
  for(const note of ['k','h','f','s'])await page.keyboard.up(note);
  await page.locator('#vp-practice-stop-take').click();
  assert.equal(await page.locator('#vp-midi').isDisabled(),false);
  assert.equal(await page.locator('#vp-export').isDisabled(),false);
  assert.equal(await page.locator('#vp-practice-stop-take').isVisible(),false);
  assert.equal(await page.locator('#vp-timeline').isVisible(),true);
  assert.ok(await page.locator('#vp-timeline-cues button').count()>=1,'Dm7 should form a recorded chord timeline segment');
  assert.match(await page.locator('#vp-timeline-cues').innerText(),/Dm7/);
  await page.locator('#vp-timeline-cues button').first().click();
  assert.match(await page.locator('#vp-replay').innerText(),/Stop replay/);
  await page.locator('#vp-replay').click();
  assert.equal(await page.locator('#vp-cover-download').isDisabled(),false);
  const coverDownload=page.waitForEvent('download');
  await page.locator('#vp-cover-download').click();
  assert.match((await coverDownload).suggestedFilename(),/-cover\.png$/);
  assert.equal(await page.locator('#vp-cover-controls').isVisible(),true);
  assert.equal(await page.locator('#practice-report').isVisible(),true);
  assert.match(await page.locator('#practice-report-summary').innerText(),/Matched 1 of 3 scheduled bars \(33% chord coverage\)/);
  const poster=page.locator('#vp-poster');
  await poster.waitFor({state:'visible'});
  const posterPixel=await poster.evaluate(c=>[...c.getContext('2d').getImageData(50,248,1,1).data]);
  await page.locator('#vp-show-chords').uncheck();
  const plainPosterPixel=await poster.evaluate(c=>[...c.getContext('2d').getImageData(50,248,1,1).data]);
  assert.notDeepEqual(plainPosterPixel,posterPixel,'Caption toggle must visibly update video poster');
  await page.locator('#vp-show-chords').check();
  assert.equal(await page.locator('#practice-report-bars [data-status="matched"]').count(),1);
  assert.equal(await page.locator('#practice-report-bars [data-status="not-reached"]').count(),2);
  const practiceDownload=page.waitForEvent('download');
  await page.locator('#practice-save').click();
  assert.equal((await practiceDownload).suggestedFilename(),'piano-chord-practice-report.txt');
  await page.locator('#practice-bars button:nth-child(3)').click();
  assert.match(await page.locator('#practice-current').innerText(),/Cmaj7/);
  assert.equal(await page.locator('.piano-key.practice-target').count(),4);
  await page.screenshot({path:'test-results/learning/seventh-recording-desktop.png',fullPage:true});
  await go('/guides/seventh-chords-piano/');
  await page.locator('#seventh-player[data-ready="true"]').waitFor();
  await page.locator('#seventh-pattern').selectOption('turnaround');
  const turnaroundLink=await page.locator('#seventh-piano-link').getAttribute('href');
  await go(turnaroundLink);
  assert.deepEqual((await texts('#practice-bars strong')).map(x=>x.trim()),['Cmaj7','Am7','Dm7','G7']);
  await go('/tools/virtual-piano/?practice=7&pattern=ii-v-i&bpm=80&bpm=120');
  assert.equal(await page.locator('#piano-practice').isVisible(),false);
  const mobileSeventh=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const mobileSeventhPage=await mobileSeventh.newPage();
  await mobileSeventhPage.goto(origin+seventhLink,{waitUntil:'domcontentloaded'});
  assert.equal(await mobileSeventhPage.locator('#piano-practice').isVisible(),true);
  assert.equal(await mobileSeventhPage.locator('.piano-key.practice-target').count(),4);
  assert.equal(await mobileSeventhPage.locator('#vp-practice-hud').isVisible(),true);
  await mobileSeventhPage.locator('#practice-clicks').uncheck();
  await mobileSeventhPage.locator('#practice-record').click();
  assert.equal(await mobileSeventhPage.locator('#practice-pulse').getAttribute('data-phase'),'countin');
  assert.equal(await mobileSeventhPage.locator('#vp-practice-cancel').isVisible(),true);
  const mobileHud=await mobileSeventhPage.locator('#vp-practice-hud').boundingBox();
  assert.ok(mobileHud&&mobileHud.width>=310,'Mobile HUD must be wide enough for clear practice controls');
  await mobileSeventhPage.locator('#vp-practice-cancel').click();
  assert.equal(await mobileSeventhPage.locator('#vp-end-record').isDisabled(),true);
  const dim=await mobileSeventhPage.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
  assert.ok(dim.scroll<=dim.view+2,'Mobile seventh guide overflow: '+JSON.stringify(dim));
  await mobileSeventhPage.screenshot({path:'test-results/learning/seventh-recording-mobile.png',fullPage:true});
  await mobileSeventh.close();
  console.log('PASS seventh handoff, 3/4 bars, four-note chord detection, recording, mobile');


  await go('/chords/f-sharp-minor/');
  assert.ok(await page.locator('a[href="/chords/a-major/"]').count()>=1,'F-sharp minor should link its relative A major');
  await page.locator('[data-inversion-button="1"]').click();
  assert.equal(await page.locator('[data-inversion-view="1"]').isVisible(),true);
  await page.locator('[data-inversion-view="1"] button[data-play-midi]').click();
  await delay(200);
  assert.match(await page.locator('#app-status').innerText(),/Playing chord/);
  await page.screenshot({path:'test-results/learning/f-sharp-minor-inversion.png',fullPage:true});
  await go('/printables/piano-chord-chart/');
  assert.equal(await page.locator('.print-cell').count(),16,'Original starter printable should not silently grow');
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.printable-downloads').evaluate(el=>getComputedStyle(el).display),'none',
    'Download cards must not appear in the original browser-print starter sheet');
  await page.emulateMedia({media:'screen'});
  for(const file of [
    'piano-chord-24-triads-a4.pdf','piano-chord-24-triads-letter.pdf',
    'piano-chord-36-sevenths-a4.pdf','piano-chord-36-sevenths-letter.pdf'
  ]){
    const response=await page.request.get(origin+'/downloads/'+file);
    assert.equal(response.status(),200,'Printable PDF must be downloadable: '+file);
    assert.match(response.headers()['content-type']||'',/application\/pdf/i);
    const pdfBytes=await response.body();
    assert.equal(pdfBytes.subarray(0,8).toString('ascii'),'%PDF-1.4');
    const pdfText=pdfBytes.toString('latin1');
    assert.equal((pdfText.match(/\/Type\s*\/Page\b/g)||[]).length,1,file+' must be a single-page PDF');
    assert.match(pdfText,/\/MediaBox\s*\[0\s+0\s+[\d.]+\s+[\d.]+\]/);
    assert.equal(await page.locator('a[href="/downloads/'+file+'"][download]').count(),1);
  }
  assert.equal(await page.getByRole('heading',{name:'Major & minor piano chords'}).count(),1);
  assert.equal(await page.getByRole('heading',{name:'Dominant, major & minor sevenths'}).count(),1);
  // Test actual Chromium printing on both supported paper formats.
  await page.emulateMedia({media:'print'});
  const printColumns=await page.locator('.print-chart-grid').evaluate(el=>
    getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);
  assert.equal(printColumns,4,'The print layout must retain four columns');
  for(const format of ['A4','Letter']){
    const pdf=await page.pdf({format,printBackground:true,preferCSSPageSize:false});
    assert.equal(pdf.subarray(0,4).toString(),'%PDF','Chrome must generate PDF: '+format);
    const count=(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
    assert.equal(count,1,format+' should fit all 16 diagrams on one printable page');
    writeFileSync('test-results/learning/16-chords-'+format.toLowerCase()+'.pdf',pdf);
    console.log('PASS '+format+' print: 16 SVG diagrams, four columns, '+count+' PDF page');
  }
  await page.emulateMedia({media:'screen'});
  console.log('PASS nine authored chord pages, SVG routes, inversions, audio and fixed 16-chord printable');

  for(const path of ['/chords/f-sharp-minor/','/chords/b-flat-minor/','/chords/c-major-7/','/guides/seventh-chords-piano/']){
    const mobileLesson=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const mobileLessonPage=await mobileLesson.newPage();
    const response=await mobileLessonPage.goto(origin+path,{waitUntil:'domcontentloaded'});
    assert.equal(response?.status(),200);
    if(path.includes('seventh-chords-piano')){
      const cards=await mobileLessonPage.locator('#listen .seventh-card').evaluateAll(nodes=>nodes.map(n=>({x:n.getBoundingClientRect().x,w:n.getBoundingClientRect().width})));
      assert.equal(cards.length,3);
      assert.ok(cards.every(x=>Math.abs(x.x-cards[0].x)<2),'Mobile seventh cards must stack vertically');
      assert.ok(cards.every(x=>x.w>280),'Mobile seventh cards need readable full width');
      await mobileLessonPage.locator('#seventh-player[data-ready="true"]').waitFor({timeout:10000});
      await mobileLessonPage.locator('#seventh-pattern').selectOption('turnaround');
      await mobileLessonPage.locator('#seventh-player-bars .seventh-play-bar').nth(3).waitFor({state:'visible'});
      const tiles=await mobileLessonPage.locator('#seventh-player-bars .seventh-play-bar').evaluateAll(nodes=>
        nodes.map(el=>({x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,
          width:el.getBoundingClientRect().width,display:getComputedStyle(el).display,
          border:getComputedStyle(el).borderTopStyle})));
      assert.equal(tiles.length,4,'Turnaround must render four dynamic practice cards');
      assert.ok(tiles.every(el=>el.display==='flex'&&el.border==='solid'&&el.width>130),
        'Dynamic cards lost Astro CSS styling: '+JSON.stringify(tiles));
      assert.ok(Math.abs(tiles[0].y-tiles[1].y)<2&&tiles[2].y>tiles[0].y+30,
        'Mobile turnaround must be a two-column grid: '+JSON.stringify(tiles));

    }
    const width=await mobileLessonPage.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
    assert.ok(width.scroll<=width.view+2,'Mobile chord page overflow '+path+': '+JSON.stringify(width));
    await mobileLessonPage.screenshot({path:'test-results/learning/mobile-'+path.split('/')[2]+'.png',fullPage:true});
    await mobileLesson.close();
  }

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
