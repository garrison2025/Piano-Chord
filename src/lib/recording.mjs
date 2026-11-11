/** Pure, browser-independent event and Standard MIDI File utilities. */
export const MAX_RECORDING_MS = 90000;

export function normalizeEvents(raw, durationMs) {
  const duration = Math.max(0, Math.min(MAX_RECORDING_MS, Math.round(Number(durationMs) || 0)));
  const sorted = (Array.isArray(raw) ? raw : []).map((e, index) => ({
    type: e.type === 'on' ? 'on' : e.type === 'off' ? 'off' : null,
    midi: Number(e.midi),
    t: Math.max(0, Math.min(duration, Math.round(Number(e.t) || 0))),
    index,
  })).filter(e => e.type && Number.isInteger(e.midi) && e.midi >= 21 && e.midi <= 108)
    .sort((a, b) => a.t - b.t || a.index - b.index);
  const down = new Set();
  const events = [];
  for (const e of sorted) {
    if (e.type === 'on') {
      if (down.has(e.midi)) continue;
      down.add(e.midi);
    } else {
      if (!down.has(e.midi)) continue;
      down.delete(e.midi);
    }
    events.push({ type: e.type, midi: e.midi, t: e.t });
  }
  for (const midi of down) events.push({ type: 'off', midi, t: duration });
  events.sort((a,b) => a.t-b.t); // stable: retain on-before-off when both round to same millisecond
  return { duration, events };
}

export function noteIntervals(recording) {
  const open = new Map(), notes = [];
  for (const e of recording.events || []) {
    if (e.type === 'on') open.set(e.midi, e.t);
    else if (open.has(e.midi)) {
      const start = open.get(e.midi);
      notes.push({midi: e.midi, start, end: Math.max(start + 1, e.t)});
      open.delete(e.midi);
    }
  }
  return notes.sort((a,b)=>a.start-b.start || a.midi-b.midi);
}

function varLength(value) {
  let n = Math.max(0, Math.floor(value)), bytes = [n & 0x7f];
  while ((n >>= 7) > 0) bytes.unshift((n & 0x7f) | 0x80);
  return bytes;
}
function u16(n) { return [(n >>> 8) & 255, n & 255]; }
function u32(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]; }

/** Format 0 SMF, 480 PPQN, 120 BPM, a single note track. */
export function encodeMidi(recording) {
  const {duration, events} = normalizeEvents(recording.events, recording.duration);
  const ordered = noteIntervals({events}).flatMap((n,i) => {
    const onTick=Math.round(n.start*.96);
    const offTick=Math.max(onTick+1,Math.round(n.end*.96));
    return [{type:'on',midi:n.midi,tick:onTick,i},{type:'off',midi:n.midi,tick:offTick,i}];
  }).sort((a,b)=>a.tick-b.tick || (a.type===b.type ? a.i-b.i : a.type==='off'?-1:1));
  const track = [0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20];
  let lastTick = 0;
  for (const e of ordered) {
    track.push(...varLength(e.tick-lastTick), e.type==='on'?0x90:0x80, e.midi, e.type==='on'?88:0);
    lastTick=e.tick;
  }
  const finalTick=Math.max(lastTick, Math.round(duration*.96));
  track.push(...varLength(finalTick-lastTick),0xff,0x2f,0x00);
  return new Uint8Array([
    0x4d,0x54,0x68,0x64,...u32(6),...u16(0),...u16(1),...u16(480),
    0x4d,0x54,0x72,0x6b,...u32(track.length),...track
  ]);
}

export function safeFilename(title) {
  const normalized = String(title||'').normalize('NFKD').replace(/[^a-zA-Z0-9-_ ]+/g, '').trim().replace(/[\s_-]+/g,'-').replace(/^-|-$/g,'').slice(0,64);
  return normalized || 'piano-performance';
}
