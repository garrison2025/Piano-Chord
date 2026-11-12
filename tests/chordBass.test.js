import test from 'node:test';
import assert from 'node:assert/strict';
import {coreChords} from '../src/lib/coreCatalog.js';
import {describeChordBass} from '../src/lib/chordBass.mjs';
const C=coreChords.find(x=>x.root==='C'&&x.quality==='major');
test('Chord finder identifies root and C/E first and C/G second inversion',()=>{
  assert.equal(describeChordBass(C,'').kind,'unspecified');
  assert.deepEqual([0,4,7].map(pc=>describeChordBass(C,String(pc)).slashName),['C','C/E','C/G']);
  assert.equal(describeChordBass(C,'4').inversion,1);
  assert.match(describeChordBass(C,'7').description,/Second inversion/);
});
test('non-chord slash bass does not masquerade as an inversion',()=>{
  const d=describeChordBass(C,'2');
  assert.equal(d.slashName,'C/D');
  assert.equal(d.kind,'external-bass');
  assert.equal(d.inversion,null);
  assert.throws(()=>describeChordBass(C,'27'),RangeError);
});
test('enharmonic root spelling follows chord tones when bass is an inversion',()=>{
  const Bb=coreChords.find(x=>x.root==='Bb'&&x.quality==='major');
  assert.match(describeChordBass(Bb,'10').description,/Root position/);
  assert.equal(describeChordBass(Bb,'2').slashName,'B♭/D');
});
