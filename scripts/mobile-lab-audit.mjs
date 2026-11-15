/**
 * Repeatable synthetic MOBILE performance baseline for the public site.
 * This is NOT CrUX/GSC field data or a valid real-user INP measurement.
 * Runs with a mobile viewport, ~1.6Mbps / 150ms RTT and 4x CPU slowdown.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';

const origin=process.env.PERF_ORIGIN||'https://pianochordexplorer.com';
const paths=['/','/chords/b-minor/','/tools/chord-library/','/tools/virtual-piano/'];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const reports=[];
try{
 for(const path of paths){
  const context=await browser.newContext({
   viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,
   locale:'en-US'
  });
  const page=await context.newPage();
  await page.addInitScript(()=>{
   const p=window.__mobileLab={lcpMs:null,cls:0,longTasks:0};
   try{new PerformanceObserver(list=>{
    for(const e of list.getEntries())p.lcpMs=Math.round(e.startTime);
   }).observe({type:'largest-contentful-paint',buffered:true});}catch{}
   try{new PerformanceObserver(list=>{
    for(const e of list.getEntries())if(!e.hadRecentInput)p.cls+=e.value;
   }).observe({type:'layout-shift',buffered:true});}catch{}
   try{new PerformanceObserver(list=>{
    for(const e of list.getEntries())p.longTasks+=e.duration;
   }).observe({type:'longtask',buffered:true});}catch{}
  });
  const cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions',{
   offline:false,latency:150,downloadThroughput:200000,uploadThroughput:94000
  });
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const start=Date.now();
  const response=await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:60000});
  assert.equal(response?.status(),200,path+' must load with HTTP 200');
  await page.waitForTimeout(5000);
  const result=await page.evaluate(()=>{
   const nav=performance.getEntriesByType('navigation')[0];
   const paint=performance.getEntriesByType('paint');
   const resources=performance.getEntriesByType('resource');
   const fcp=paint.find(e=>e.name==='first-contentful-paint');
   const p=window.__mobileLab;
   return {
    title:document.title,
    h1:document.querySelector('h1')?.textContent?.trim(),
    domReadyMs:Math.round(nav?.domContentLoadedEventEnd||0),
    ttfbMs:Math.round(nav?.responseStart||0),
    fcpMs:Math.round(fcp?.startTime||0),
    lcpMs:p.lcpMs,
    cls:Number(p.cls.toFixed(4)),
    longTaskMs:Math.round(p.longTasks),
    resourceCount:resources.length,
    jsResourceCount:resources.filter(r=>/\.js(?:\?|$)/.test(r.name)).length,
    totalEncodedBytes:Math.round(resources.reduce((sum,r)=>sum+(r.encodedBodySize||0),0)),
    horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
    viewportWidth:document.documentElement.clientWidth,
    documentWidth:document.documentElement.scrollWidth,
    overflowCandidates:[...document.querySelectorAll('body *')].filter(el=>{
     if(el.closest('[hidden]'))return false;
     const r=el.getBoundingClientRect();
     return r.width>0&&(r.right>innerWidth+3||r.left< -3);
    }).slice(0,20).map(el=>{
     const r=el.getBoundingClientRect();
     return {tag:el.tagName.toLowerCase(),className:typeof el.className==='string'?el.className.slice(0,90):'',
      right:Math.round(r.right),left:Math.round(r.left),width:Math.round(r.width)};
    }),
    invalidAboveFoldImages:[...document.images].filter(img=>{
     const b=img.getBoundingClientRect();
     return b.top<innerHeight&&b.bottom>0&&img.complete&&img.naturalWidth===0;
    }).length
   };
  });
  assert.ok(result.h1,path+' must have a server-rendered H1');
  if(result.horizontalOverflow)console.warn('MOBILE OVERFLOW '+path+' '+JSON.stringify(result.overflowCandidates));
  if(result.invalidAboveFoldImages)console.warn('BROKEN VISIBLE IMAGES '+path+' '+result.invalidAboveFoldImages);
  const row={path,url:origin+path,network:'synthetic mobile ~1.6 Mbps / 150ms RTT',cpu:'4x slowdown',
    wallDurationMs:Date.now()-start,...result};
  reports.push(row);
  console.log('MOBILE LAB '+JSON.stringify(row));
  await context.close();
 }
 mkdirSync('test-results/performance',{recursive:true});
 writeFileSync('test-results/performance/mobile-lab.json',JSON.stringify({
  disclaimer:'Synthetic mobile measurements only. Not Google CrUX field data; INP not measured.',
  date:new Date().toISOString(),reports
 },null,2)+'\n');
}finally{await browser.close();}
if(process.env.PERF_FAIL_ON_OVERFLOW==='1' &&
   reports.some(report=>report.horizontalOverflow || report.invalidAboveFoldImages>0)){
  console.error('Synthetic mobile viewport or visible-image regression found');
  process.exitCode=1;
}
