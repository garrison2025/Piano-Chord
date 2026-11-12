/** Clock math for the silent four-beat count-in and 4/4 practice guide. */
export const COUNT_IN_BEATS=4;
function beatLength(bpm){
  if(!Number.isInteger(bpm)||bpm<50||bpm>180)throw new RangeError('Practice tempo must be 50–180 BPM');
  return 60000/bpm;
}
/** At t=0 show "4"; at exactly the fourth boundary the count-in is finished. */
export function countInPosition(elapsedMs,bpm){
  if(!Number.isFinite(elapsedMs))throw new TypeError('Invalid elapsed time');
  const ms=Math.max(0,elapsedMs),beatMs=beatLength(bpm);
  const passed=Math.min(COUNT_IN_BEATS,Math.floor(ms/beatMs));
  return {remaining:COUNT_IN_BEATS-passed,beat:passed<COUNT_IN_BEATS?passed+1:null,
    finished:passed===COUNT_IN_BEATS,durationMs:COUNT_IN_BEATS*beatMs};
}
/** Derive bar and beat from monotonic elapsed time, without accumulating timer drift. */
export function guidePosition(elapsedMs,bpm,barCount){
  if(!Number.isFinite(elapsedMs))throw new TypeError('Invalid elapsed time');
  if(!Number.isInteger(barCount)||barCount<1||barCount>8)throw new RangeError('Invalid bar count');
  const beatMs=beatLength(bpm),totalBeats=4*barCount;
  const passed=Math.max(0,Math.floor(Math.max(0,elapsedMs)/beatMs));
  const complete=passed>=totalBeats,beatIndex=Math.min(passed,totalBeats-1);
  return {complete,barIndex:Math.floor(beatIndex/4),beat:beatIndex%4+1,
    passedBeats:Math.min(passed,totalBeats),durationMs:totalBeats*beatMs};
}
