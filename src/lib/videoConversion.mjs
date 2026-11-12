/** Browser-local WebM -> MP4 encoding profile. No media is uploaded. */
export const CORE_BASE='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
export const MP4_WIDTH=540,MP4_HEIGHT=960,MP4_FPS=24;
export function mp4Args(){
  return ['-hide_banner','-i','take.webm','-map','0:v:0','-map','0:a:0',
    '-vf','fps='+MP4_FPS+',scale='+MP4_WIDTH+':'+MP4_HEIGHT+':flags=fast_bilinear',
    '-c:v','libx264','-preset','ultrafast','-crf','25','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a','128k','-ar','44100','-movflags','+faststart',
    '-threads','1','take.mp4'];
}
/**
 * Check that AVC/H.264 and AAC belong to actual video/audio sample-entry tracks.
 * Looking for codec strings anywhere in moov is unsafe: metadata can contain
 * "avc1" and "mp4a" even when the real streams use VP9 and Opus.
 * Structural validation is necessary but not proof of playback/upload success.
 */
export function isSocialMp4(bytes){
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 40) return false;
  const dv = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const ascii = offset => String.fromCharCode(bytes[offset],bytes[offset+1],bytes[offset+2],bytes[offset+3]);
  const boxes = (start,end) => {
    const result=[];let pos=start;
    while(pos+8<=end){
      let size=dv.getUint32(pos,false),header=8;
      if(size===1){
        if(pos+16>end)return null;
        const large=dv.getBigUint64(pos+8,false);
        if(large>BigInt(Number.MAX_SAFE_INTEGER))return null;
        size=Number(large);header=16;
      }else if(size===0)size=end-pos;
      if(size<header || pos+size>end)return null;
      result.push({type:ascii(pos+4),begin:pos+header,end:pos+size});
      pos+=size;
    }
    return pos===end?result:null;
  };
  const top=boxes(0,bytes.length);
  if(!top || !top.some(b=>b.type==='ftyp') || !top.some(b=>b.type==='mdat'))return false;
  const moov=top.find(b=>b.type==='moov');if(!moov)return false;
  const tracks=boxes(moov.begin,moov.end);if(!tracks)return false;
  let video=false,audio=false;
  for(const trak of tracks.filter(b=>b.type==='trak')){
    const media=(boxes(trak.begin,trak.end)||[]).find(b=>b.type==='mdia');
    if(!media)continue;
    const mediaBoxes=boxes(media.begin,media.end)||[];
    const handler=mediaBoxes.find(b=>b.type==='hdlr'),minf=mediaBoxes.find(b=>b.type==='minf');
    if(!handler || handler.begin+12>handler.end || !minf)continue;
    const kind=ascii(handler.begin+8);
    const stbl=(boxes(minf.begin,minf.end)||[]).find(b=>b.type==='stbl');
    if(!stbl)continue;
    const stsd=(boxes(stbl.begin,stbl.end)||[]).find(b=>b.type==='stsd');
    if(!stsd || stsd.begin+8>stsd.end)continue;
    const count=dv.getUint32(stsd.begin+4,false);
    const entries=boxes(stsd.begin+8,stsd.end);
    if(!entries || count!==entries.length)continue;
    if(kind==='vide' && entries.some(b=>b.type==='avc1'||b.type==='avc3'))video=true;
    if(kind==='soun' && entries.some(b=>b.type==='mp4a'))audio=true;
  }
  return video&&audio;
}
