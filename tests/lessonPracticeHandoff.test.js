import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseChords} from '../src/data/chords.js';
import {createChord} from '../src/lib/music.js';
import {lessonPracticeHandoff} from '../src/lib/lessonPracticeHandoff.mjs';
import {progression,PROGRESSION_PRESETS} from '../src/lib/keyTheory.mjs';
import {seventhPattern} from '../src/lib/seventhPractice.mjs';

test('all 29 authored chord lessons have a musically true progression handoff',()=>{
  assert.equal(releaseChords.length,29);
  for(const entry of releaseChords){
    const handoff=lessonPracticeHandoff(entry);
    assert.match(handoff.href,/^\//);
    assert.ok(handoff.label.includes(entry.symbol),entry.slug+' has clear label');
    assert.ok(!handoff.href.includes('/chords/'),entry.slug+' should not bounce back to another lesson');
    if(entry.quality==='major'||entry.quality==='minor'){
      assert.equal(handoff.kind,'triad',entry.slug);
      assert.ok(PROGRESSION_PRESETS[handoff.mode].some(x=>x.id===handoff.preset));
      const seq=progression(handoff.root,handoff.mode,handoff.preset);
      assert.deepEqual(seq.steps[0].notes,createChord(entry).notes,entry.slug+' not included in bar 1');
      const u=new URL(handoff.href,'https://example.com');
      assert.equal(u.searchParams.get('root'),entry.root);
      assert.equal(u.searchParams.get('preset'),handoff.preset);
      assert.equal(u.hash,'#progression-builder');
    }else{
      assert.ok(handoff.kind==='seventh'||handoff.kind==='resolution');
      if(handoff.kind==='seventh'){
        const u=new URL(handoff.href,'https://example.com');
        assert.equal(u.hash,'#cadence');
        assert.ok(seventhPattern(handoff.pattern).bars.some(x=>x.slug===entry.slug),
          entry.slug+' must be a four-note chord in the destination pattern');
      }else{
        assert.equal(entry.slug,'c-7');
        assert.match(handoff.href,/#c7-resolution$/);
      }
    }
  }
});
test('notable tricky spellings and seventh pathways are preserved',()=>{
  const get=slug=>lessonPracticeHandoff(releaseChords.find(x=>x.slug===slug));
  assert.match(get('c-sharp-minor').href,/root=C%23/);
  assert.match(get('d-flat-major').href,/root=Db/);
  assert.match(get('a-minor-7').href,/pattern=turnaround/);
  assert.match(get('c-major-7').href,/pattern=ii-v-i/);
  assert.throws(()=>lessonPracticeHandoff({slug:'unknown',root:'H',quality:'major'}));
});
