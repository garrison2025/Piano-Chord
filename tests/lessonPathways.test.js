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
