/** Real FFmpeg WebAssembly browser E2E: synthetic note, no user media uploads. */
import {chromium} from 'playwright';
import {mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';

const url=process.env.PIANO_TEST_URL||'http://127.0.0.1:4321/tools/virtual-piano/';
mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response?.status(),200);
  await page.locator('#vp-record').click();
  const key=page.locator('.piano-key[data-midi="60"]');
  await key.scrollIntoViewIfNeeded();
  const box=await key.boundingBox();assert.ok(box,'C4 key not visible');
  await page.mouse.move(box.x+box.width/2,box.y+box.height-18);
  await page.mouse.down();await delay(450);await page.mouse.up();
  await page.locator('#vp-end-record').click();
  assert.equal(await page.locator('#vp-export').isDisabled(),false,'No notes captured');
  await page.locator('#vp-export').click();
  await page.locator('#vp-convert-mp4').waitFor({state:'visible',timeout:30000});
  await page.locator('#vp-convert-mp4').click();
  const deadline=Date.now()+360000;
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
  await mp4Download.saveAs('test-results/converted.mp4');
  const [webmDownload]=await Promise.all([page.waitForEvent('download',{timeout:20000}),page.locator('#vp-download-webm').click()]);
  await webmDownload.saveAs('test-results/original.webm');
  assert.ok(existsSync('test-results/converted.mp4')&&existsSync('test-results/original.webm'));
  const media=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,codec_type:format=duration','-of','json','test-results/converted.mp4'],{encoding:'utf8'}));
  assert.ok(media.streams.some(s=>s.codec_type==='video'&&s.codec_name==='h264'),JSON.stringify(media.streams));
  assert.ok(media.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac'),JSON.stringify(media.streams));
  assert.ok(Number(media.format.duration)>2&&Number(media.format.duration)<20,'Invalid MP4 duration');
  assert.equal(errors.length,0,'Browser errors: '+errors.join(' | '));
  console.log('PASS: real WebAssembly conversion to H264/AAC MP4, duration',media.format.duration);
}catch(error){
  await page.screenshot({path:'test-results/failure.png',fullPage:true}).catch(()=>{});
  console.error('Browser errors:',errors.join(' | '));
  console.error('Recorder:',await page.locator('#vp-message').textContent().catch(()=>''));
  throw error;
}finally{await browser.close();}
