/** Real FFmpeg WebAssembly browser E2E: synthetic note, no user media uploads. */
import {chromium} from 'playwright';
import {mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';

const url=process.env.PIANO_TEST_URL||'http://127.0.0.1:4321/tools/virtual-piano/';
const mobile=process.env.PIANO_EMULATED_MOBILE==='1';
const stress=process.env.PIANO_STRESS==='1';
const seconds=Math.min(90,Math.max(60,Number(process.env.PIANO_STRESS_SECONDS||60)));
const suffix=mobile?'mobile':stress?'stress':'';
const outputDir=suffix?'test-results/'+suffix:'test-results';
mkdirSync(outputDir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile,acceptDownloads:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response?.status(),200);
  await page.locator('#vp-record').click();
  const key=page.locator('.piano-key[data-midi="60"]');
  await key.scrollIntoViewIfNeeded();
  if(mobile){
    const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
    assert.ok(metrics.scroll<=metrics.view+2,'Mobile horizontal document overflow: '+JSON.stringify(metrics));
    await key.tap();await delay(350);
    await page.locator('.piano-key[data-midi="64"]').tap();await delay(350);
    await page.screenshot({path:outputDir+'/touch-recording.png',fullPage:true});
  }else if(stress){
    await page.locator('#vp-scroll').focus();
    const notes=['a','s','d','f','g','h','j','k'];
    const began=Date.now();let played=0;
    while(Date.now()-began<seconds*1000-200){
      const code=notes[played%notes.length];
      await page.keyboard.down(code);await delay(160);await page.keyboard.up(code);
      played++;
      if(Date.now()-began<seconds*1000-1000)await delay(800);
    }
    if(seconds===60 && Date.now()-began<60000)await delay(60000-(Date.now()-began));
    assert.ok(played>=40,'Stress run captured too few note presses: '+played);
    console.log('STRESS RECORDED',played,'notes in',Date.now()-began,'milliseconds');
  }else{
    const box=await key.boundingBox();assert.ok(box,'C4 key not visible');
    await page.mouse.move(box.x+box.width/2,box.y+box.height-18);
    await page.mouse.down();await delay(450);await page.mouse.up();
  }
  if(!await page.locator('#vp-end-record').isDisabled())await page.locator('#vp-end-record').click();
  assert.equal(await page.locator('#vp-export').isDisabled(),false,'No notes captured');
  // Verify actual visible pre-export poster and that theme selection redraws it.
  const poster=page.locator('#vp-poster');
  await poster.waitFor({state:'visible',timeout:10000});
  const before=await poster.evaluate(canvas=>[...canvas.getContext('2d').getImageData(12,12,1,1).data]);
  await poster.screenshot({path:outputDir+'/video-poster-midnight.png'});
  assert.equal(await page.locator('#vp-show-chords').isChecked(),true);
  await page.locator('#vp-show-chords').uncheck();
  await poster.screenshot({path:outputDir+'/video-poster-plain.png'});
  await page.locator('#vp-show-chords').check();
  await page.locator('#vp-theme').selectOption('aurora');
  const after=await poster.evaluate(canvas=>[...canvas.getContext('2d').getImageData(12,12,1,1).data]);
  assert.notDeepEqual(after,before,'Video theme selection failed to redraw the 9:16 poster');
  await poster.screenshot({path:outputDir+'/video-poster-aurora.png'});
  console.log('Poster preview and Aurora theme redraw OK');

  await page.locator('#vp-export').click();
  await page.locator('#vp-convert-mp4').waitFor({state:'visible',timeout:stress?seconds*1000+60000:30000});
  await page.locator('#vp-convert-mp4').click();
  const deadline=Date.now()+(stress?900000:360000);
  let success=false;
  while(Date.now()<deadline){
    const format=await page.locator('#vp-format').textContent();
    const message=await page.locator('#vp-message').textContent();
    if(format?.includes('Verified H.264/AAC MP4 ready')){success=true;break;}
    if(!await page.locator('#vp-cancel-mp4').isVisible()&&/failed|cancelled|unavailable/i.test(message||'')){
      throw new Error('Encoder failed: '+message);
    }
    await delay(1000);
  }
  assert.ok(success,'WASM MP4 conversion timed out: '+await page.locator('#vp-message').textContent());
  const [mp4Download]=await Promise.all([page.waitForEvent('download',{timeout:20000}),page.locator('#vp-download').click()]);
  await mp4Download.saveAs(outputDir+'/converted.mp4');
  const [webmDownload]=await Promise.all([page.waitForEvent('download',{timeout:20000}),page.locator('#vp-download-webm').click()]);
  await webmDownload.saveAs(outputDir+'/original.webm');
  assert.ok(existsSync(outputDir+'/converted.mp4')&&existsSync(outputDir+'/original.webm'));
  const media=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,codec_type,start_time,width,height,avg_frame_rate:format=duration','-of','json',outputDir+'/converted.mp4'],{encoding:'utf8'}));
  assert.ok(media.streams.some(s=>s.codec_type==='video'&&s.codec_name==='h264'),JSON.stringify(media.streams));
  assert.ok(media.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac'),JSON.stringify(media.streams));
  const duration=Number(media.format.duration);
  assert.ok(duration>(stress?seconds-4:2)&&duration<(stress?seconds+9:20),'Invalid MP4 duration: '+duration);
  const video=media.streams.find(s=>s.codec_type==='video');
  const audio=media.streams.find(s=>s.codec_type==='audio');
  assert.equal(video.width,540);assert.equal(video.height,960);
  const rate=String(video.avg_frame_rate||'0/0').split('/').map(Number);
  const fps=rate[1]?rate[0]/rate[1]:0;
  assert.ok(fps>=23&&fps<=60,'TikTok upload profile requires 23–60 FPS; observed '+fps);
  console.log('Export frame rate',fps,'FPS (TikTok document minimum: 23 FPS)');
  const offset=Math.abs(Number(video.start_time||0)-Number(audio.start_time||0));
  assert.ok(offset<0.25,'Audio/video track start offset '+offset+'s exceeds 250ms');
  if(mobile){
    const canShare=await page.evaluate(()=>typeof navigator.share==='function'&&typeof navigator.canShare==='function');
    if(!canShare){
      await page.locator('#vp-share').click();
      assert.match(await page.locator('#vp-message').innerText(),/not available|download/i);
    }
    console.log('MOBILE EMULATION ONLY: touch capture, 390px layout, share fallback:',!canShare);
  }
  assert.equal(errors.length,0,'Browser errors: '+errors.join(' | '));
  console.log('PASS',suffix||'short','real WASM H264/AAC MP4, duration',media.format.duration,'offsetSeconds',offset);
}catch(error){
  await page.screenshot({path:outputDir+'/failure.png',fullPage:true}).catch(()=>{});
  console.error('Browser errors:',errors.join(' | '));
  console.error('Recorder:',await page.locator('#vp-message').textContent().catch(()=>''));
  throw error;
}finally{await browser.close();}
