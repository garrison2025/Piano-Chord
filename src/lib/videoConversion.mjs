/** Browser-local WebM -> MP4 encoding profile. No media is uploaded. */
export const CORE_BASE='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
export const MP4_WIDTH=540,MP4_HEIGHT=960;
export function mp4Args(){
  return ['-hide_banner','-i','take.webm','-map','0:v:0','-map','0:a:0',
    '-vf','fps=20,scale='+MP4_WIDTH+':'+MP4_HEIGHT+':flags=fast_bilinear',
    '-c:v','libx264','-preset','ultrafast','-crf','28','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a','96k','-ar','44100','-movflags','+faststart',
    '-threads','1','take.mp4'];
}
/** Require a valid MP4 container with AVC video and AAC audio sample descriptors. */
export function isSocialMp4(bytes){
  if(!(bytes instanceof Uint8Array)||bytes.length<40)return false;
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const dec=new TextDecoder('latin1');
  let pos=0,ftyp=false,moov=false,mdat=false,avc=false,aac=false;
  while(pos+8<=bytes.length){
    let size=v.getUint32(pos,false);
    const tag=dec.decode(bytes.subarray(pos+4,pos+8));
    let header=8;
    if(size===1){
      if(pos+16>bytes.length)return false;
      const large=v.getBigUint64(pos+8,false);
      if(large>BigInt(Number.MAX_SAFE_INTEGER))return false;
      size=Number(large);header=16;
    }else if(size===0)size=bytes.length-pos;
    if(!Number.isFinite(size)||size<header||pos+size>bytes.length)return false;
    if(tag==='ftyp')ftyp=true;
    if(tag==='mdat')mdat=true;
    if(tag==='moov'){
      moov=true;
      const box=dec.decode(bytes.subarray(pos+header,pos+size));
      avc=box.includes('avc1');aac=box.includes('mp4a');
    }
    pos+=size;
  }
  return pos===bytes.length&&ftyp&&moov&&mdat&&avc&&aac;
}
