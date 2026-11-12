import test from 'node:test';
import assert from 'node:assert/strict';
import {priorityEarDrills} from '../src/data/lessonPathways.js';
import {releaseChords} from '../src/data/chords.js';
import {createChord} from '../src/lib/music.js';
const entries=new Map(releaseChords.map(e=>[e.slug,e]));
const V13=['b-minor','b-flat-major','d-minor','c-major','e-minor','b-major','g-minor',
  'e-flat-major','e-major','d-major','a-minor','g-major','f-minor','c-7','c-minor','f-major'];
test('16 priority US SEO chord lessons get distinct curated actionable listening exercises',()=>{
 assert.deepEqual(Object.keys(priorityEarDrills).sort(),V13.sort());
 assert.equal(new Set(Object.values(priorityEarDrills).map(x=>x.prompt)).size,16);
 for(const [slug,drill] of Object.entries(priorityEarDrills)){
   assert(entries.has(slug),slug+' source exists');
   assert(entries.has(drill.target),slug+' destination exists');
   assert.notEqual(slug,drill.target);
   assert(drill.prompt.length>85,slug+' needs actionable instruction');
   assert(drill.answer.length>85,slug+' needs explicit musical explanation');
   const a=createChord(entries.get(slug)),b=createChord(entries.get(drill.target));
   const common=new Set(a.pcs.filter(pc=>b.pcs.includes(pc)));
   assert(common.size>=1,slug+' must have a common sounding pitch');
 }
});
test('C7 → F major resolves E–Bflat tritone, not Cmaj7 → F',()=>{
 const c=createChord(entries.get('c-7'));
 const f=createChord(entries.get('f-major'));
 assert.deepEqual(c.notes,['C','E','G','Bb']);
 assert.deepEqual(f.notes,['F','A','C']);
 assert.match(priorityEarDrills['c-7'].answer,/E.*F.*B♭.*A/);
});


import {supplementalEarDrills,lessonEarDrills} from '../src/data/lessonPathways.js';
import {pitchClass} from '../src/lib/music.js';
test('remaining thirteen lessons have editorially distinct, reachable, true two-chord drills',()=>{
  const leftover=[...entries.keys()].filter(slug=>!(slug in priorityEarDrills)).sort();
  assert.deepEqual(Object.keys(supplementalEarDrills).sort(),leftover);
  assert.equal(Object.keys(supplementalEarDrills).length,13);
  assert.equal(Object.keys(lessonEarDrills).length,29);
  const prompts=Object.values(lessonEarDrills).map(x=>x.prompt);
  const answers=Object.values(lessonEarDrills).map(x=>x.answer);
  assert.equal(new Set(prompts).size,29);
  assert.equal(new Set(answers).size,29);
  for(const [slug,drill] of Object.entries(supplementalEarDrills)){
    assert.ok(entries.has(drill.target),slug+' missing comparison target');
    assert.notEqual(slug,drill.target);
    assert.ok(drill.prompt.length>=95,slug+' short listening question');
    assert.ok(drill.answer.length>=105,slug+' short explanation');
    const from=createChord(entries.get(slug)),to=createChord(entries.get(drill.target));
    const shared=from.notes.filter(n=>to.pcs.includes(pitchClass(n)));
    assert.ok(shared.length>=2,slug+' should really have two common tones');
  }
});
test('four seventh-chord supplemental drills have the asserted tonal destinations',()=>{
  const expected={'c-major-7':['C','E','G'],'a-minor-7':['C','E','G'],
    'd-minor-7':['D','F'],'g-7':['G','B']};
  for(const [slug,sharedNotes] of Object.entries(expected)){
    const a=createChord(entries.get(slug)),b=createChord(entries.get(lessonEarDrills[slug].target));
    assert.deepEqual(a.notes.filter(n=>b.pcs.includes(pitchClass(n))),sharedNotes);
  }
});
