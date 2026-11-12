import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generatePrintablePdfs,getPrintableSets} from '../scripts/generate-printable-pdfs.mjs';

test('printable PDF inventory is exactly 24 triads and 36 common sevenths',()=>{
  const {triads,sevenths}=getPrintableSets();
  assert.equal(triads.length,24);
  assert.equal(triads.filter(x=>x.quality==='major').length,12);
  assert.equal(triads.filter(x=>x.quality==='minor').length,12);
  assert.equal(sevenths.length,36);
  assert.equal(sevenths.filter(x=>x.quality==='7').length,12);
  assert.equal(sevenths.filter(x=>x.quality==='maj7').length,12);
  assert.equal(sevenths.filter(x=>x.quality==='m7').length,12);
});
test('A4 and US Letter charts are one-page valid vector PDFs',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'piano-chord-pdf-'));
  try{
    const files=generatePrintablePdfs(dir);
    assert.equal(files.length,4);
    for(const file of files){
      const data=fs.readFileSync(path.join(dir,file.name));
      assert.equal(data.subarray(0,8).toString('ascii'),'%PDF-1.4');
      const source=data.toString('latin1');
      assert.match(source,/\/Type\s*\/Page\b/);
      assert.match(source,/\/MediaBox\s*\[0\s+0\s+[\d.]+\s+[\d.]+\]/);
      assert.match(source,/BT \/F2/);
      assert.ok(data.length>3000,file.name+' should contain vector artwork, not an empty shell');
    }
    const a4=fs.readFileSync(path.join(dir,'piano-chord-24-triads-a4.pdf'),'latin1');
    const letter=fs.readFileSync(path.join(dir,'piano-chord-24-triads-letter.pdf'),'latin1');
    assert.match(a4,/\/MediaBox \[0 0 595\.28 841\.89\]/);
    assert.match(letter,/\/MediaBox \[0 0 612 792\]/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
