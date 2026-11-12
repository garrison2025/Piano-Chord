/** Small browser-native synthesizer. Nothing is recorded, stored or sent to a server. */
export function createStudyAudio(){
  let context=null;
  const oscillators=new Set();
  async function unlock(){
    const Constructor=window.AudioContext||window.webkitAudioContext;
    if(!Constructor)throw new Error('Web Audio unavailable in this browser');
    if(!context)context=new Constructor();
    if(context.state==='suspended')await context.resume();
    return context;
  }
  function playFrequency(frequency,when,duration=.45,volume=.11,type='triangle'){
    if(!context)throw new Error('Audio must be unlocked first');
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    const safeDuration=Math.max(.03,duration);
    const start=Math.max(context.currentTime,when);
    oscillator.type=type;oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.linearRampToValueAtTime(Math.max(.0001,volume),start+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,start+safeDuration);
    oscillator.connect(gain);gain.connect(context.destination);
    oscillator.start(start);oscillator.stop(start+safeDuration+.03);
    oscillators.add(oscillator);
    oscillator.onended=()=>{oscillators.delete(oscillator);try{oscillator.disconnect();gain.disconnect();}catch{}};
  }
  function note(midi,when,duration=.45,volume=.11){
    playFrequency(440*Math.pow(2,(midi-69)/12),when,duration,volume);
  }
  function chord(midis,when,duration=1.5){
    const vol=Math.min(.14,.31/Math.max(1,midis.length));
    midis.forEach(midi=>note(midi,when,duration,vol));
  }
  function tick(when,accent=false,volume=.8){
    playFrequency(accent?1250:850,when,.065,(accent?.14:.09)*volume,'sine');
  }
  function stop(){
    for(const oscillator of oscillators){try{oscillator.stop();}catch{}}
    oscillators.clear();
  }
  return {unlock,note,chord,tick,stop,now:()=>context?.currentTime||0};
}
export function tapTempo(intervals){
  const values=intervals.filter(v=>Number.isFinite(v)&&v>=250&&v<=2000).sort((a,b)=>a-b);
  if(!values.length)return null;
  const median=values[Math.floor(values.length/2)];
  return Math.min(200,Math.max(40,Math.round(60000/median)));
}
