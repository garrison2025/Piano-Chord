/**
 * Deterministic oldest-voice eviction for the browser's synthesized piano.
 * Prefer releasing a sustained note whose key is no longer held, then the
 * earliest started active note if all voices are physically held.
 * Never steals a pitch that is not currently playing.
 */
export const MAX_ACTIVE_PIANO_VOICES=24;

export function selectVoiceToEvict(voiceMidis,heldMidis){
  const sounding=[...voiceMidis];
  if(!sounding.length)return null;
  const held=new Set(heldMidis);
  return sounding.find(midi=>!held.has(midi))??sounding[0];
}
