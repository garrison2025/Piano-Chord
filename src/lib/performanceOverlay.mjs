/** Read-only annotations for original piano performance videos.
 * Both the observed chord and a supplied guided target are derived locally.
 */
import {describeHeldChord} from './chordDetection.mjs';
import {matchesPracticeNotes} from './practiceTransfer.mjs';
export function performanceOverlayAt(notes, elapsedMs, guide=null){
  const t=Number.isFinite(elapsedMs)?Math.max(0,elapsedMs):0;
  const sounding=(Array.isArray(notes)?notes:[])
    .filter(note=>Number.isInteger(note.midi)&&note.midi>=21&&note.midi<=108
      &&Number.isFinite(note.start)&&Number.isFinite(note.end)
      &&note.start<=t&&note.end>t).map(note=>note.midi);
  const chord=describeHeldChord(sounding);
  const detected=(chord.kind==='triad'||chord.kind==='seventh')?chord.title:null;
  const validGuide=guide&&Number.isInteger(guide.bpm)&&guide.bpm>=50&&guide.bpm<=180
    &&Array.isArray(guide.steps)&&guide.steps.length>=1&&guide.steps.length<=8
    &&guide.steps.every(s=>typeof s.symbol==='string'&&s.symbol.length<=25
      &&Array.isArray(s.notes)&&[3,4].includes(s.notes.length));
  if(!validGuide)return {detected,guide:null,matchedNow:false};
  const beatMs=60000/guide.bpm,barMs=beatMs*4;
  const total=guide.steps.length,completed=t>=total*barMs;
  const index=Math.min(total-1,Math.floor(t/barMs)),step=guide.steps[index];
  return {detected,matchedNow:!completed&&matchesPracticeNotes(sounding,step),
    guide:{barIndex:index+1,total,bpm:guide.bpm,
      beat:completed?null:(Math.floor((t-index*barMs)/beatMs)+1),
      target:step.symbol,completed}};
}
