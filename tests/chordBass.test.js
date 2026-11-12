import test from 'node:test';
import assert from 'node:assert/strict';
import {coreChords} from '../src/lib/coreCatalog.js';
import {describeChordBass} from '../src/lib/chordBass.mjs';
const C=coreChords.find(x=>x.root==='C'&&x.quality==='major');
test('Chord finder identifies root and C/E first and C/G second inversion',()=>{
  assert.equal(describeChordBass(C,'').kind,'unspecified');
  assert.deepEqual([0,4,7].map(pc=>describeChordBass(C,String(pc)).slashName),['C','C/E','C/G']);
  assert.equal(describeChordBass(C,'4').inversion,1);
  assert.deepEqual(describeChordBass(C,'').playMidi,[60,64,67]);
  assert.deepEqual(describeChordBass(C,'4').playMidi,[64,67,72]);
  assert.deepEqual(describeChordBass(C,'7').playMidi,[67,72,76]);
  assert.match(describeChordBass(C,'7').description,/Second inversion/);
});
test('non-chord slash bass does not masquerade as an inversion',()=>{
  const d=describeChordBass(C,'2');
  assert.equal(d.slashName,'C/D');
  assert.equal(d.kind,'external-bass');
  assert.equal(d.inversion,null);
  assert.deepEqual(d.playMidi,[50,60,64,67],'External D bass must sound below the C major chord tones');
  assert.throws(()=>describeChordBass(C,'27'),RangeError);
});
test('four-note dominant seventh identifies and plays its third inversion',()=>{
  const C7=coreChords.find(x=>x.root==='C'&&x.quality==='7');
  const result=describeChordBass(C7,'10');
  assert.equal(result.slashName,'C7/B♭');
  assert.equal(result.inversion,3);
  assert.match(result.description,/Third inversion/);
  assert.deepEqual(result.playMidi,[70,72,76,79]);
});
test('enharmonic root spelling follows chord tones when bass is an inversion',()=>{
  const Bb=coreChords.find(x=>x.root==='Bb'&&x.quality==='major');
  assert.match(describeChordBass(Bb,'10').description,/Root position/);
  assert.equal(describeChordBass(Bb,'2').slashName,'B♭/D');
});
