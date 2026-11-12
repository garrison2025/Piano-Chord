#!/usr/bin/env node
/** Build four one-page, vector-only chord-chart PDFs. No runtime PDF service. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {coreChords} from '../src/lib/coreCatalog.js';
import {pitchClass} from '../src/lib/music.js';

const ROOT=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PAPER={
  a4:{width:595.28,height:841.89,label:'A4'},
  letter:{width:612,height:792,label:'US Letter'}
};
const ROOTS=[...new Set(coreChords.map(chord=>chord.root))];
const ascii=value=>String(value).replaceAll('♭','b').replaceAll('♯','#')
  .replaceAll('–','-').replace(/[^\x20-\x7e]/g,'');
const escapePdf=value=>ascii(value).replaceAll('\\','\\\\').replaceAll('(','\\(').replaceAll(')','\\)');
const num=value=>Number(value.toFixed(2)).toString();

function text(commands,value,x,y,size=7,bold=false){
  commands.push('BT /'+(bold?'F2':'F1')+' '+num(size)+' Tf '+num(x)+' '+num(y)+' Td ('+escapePdf(value)+') Tj ET');
}
function rect(commands,x,y,w,h,fill=1,stroke=.25){
  commands.push(num(fill)+' g '+num(stroke)+' G 0.55 w '+num(x)+' '+num(y)+' '+num(w)+' '+num(h)+' re B');
}
function circle(commands,x,y,r,fill){
  const k=r*.55228475;
  commands.push(num(fill)+' g '+num(x+r)+' '+num(y)+' m '+
    num(x+r)+' '+num(y+k)+' '+num(x+k)+' '+num(y+r)+' '+num(x)+' '+num(y+r)+' c '+
    num(x-k)+' '+num(y+r)+' '+num(x-r)+' '+num(y+k)+' '+num(x-r)+' '+num(y)+' c '+
    num(x-r)+' '+num(y-k)+' '+num(x-k)+' '+num(y-r)+' '+num(x)+' '+num(y-r)+' c '+
    num(x+k)+' '+num(y-r)+' '+num(x+r)+' '+num(y-k)+' '+num(x+r)+' '+num(y)+' c f');
}
function keyboard(commands,chord,x,y,width,height){
  const active=new Set(chord.notes.map(pitchClass));
  const white=[0,2,4,5,7,9,11],black=[1,3,6,8,10],boundaries=[1,2,4,5,6];
  const whiteW=width/7,blackW=whiteW*.58;
  for(let i=0;i<7;i++){
    const px=x+i*whiteW;
    rect(commands,px,y,whiteW,height,active.has(white[i])?.82:1,.22);
  }
  for(let i=0;i<5;i++){
    const px=x+boundaries[i]*whiteW-blackW/2;
    rect(commands,px,y+height*.43,blackW,height*.57,active.has(black[i])?.08:.22,.12);
  }
  for(let i=0;i<7;i++)if(active.has(white[i]))
    circle(commands,x+(i+.5)*whiteW,y+4,2,.04);
  for(let i=0;i<5;i++)if(active.has(black[i]))
    circle(commands,x+boundaries[i]*whiteW,y+height*.43+3.5,1.8,1);
}
function pageCommands(chords,title,subtitle,paper){
  const {width,height}=paper,margin=27,gap=5,columns=4,rows=Math.ceil(chords.length/columns);
  const cardW=(width-margin*2-gap*(columns-1))/columns;
  const gridTop=height-72,gridBottom=35;
  const cardH=(gridTop-gridBottom-gap*(rows-1))/rows;
  const commands=['1 J 1 j'];
  text(commands,title,margin,height-34,15,true);
  text(commands,subtitle,margin,height-49,7.2,false);
  text(commands,paper.label+' | 100% scale recommended',width-margin-140,height-49,6.4,false);
  commands.push('.4 G .7 w '+num(margin)+' '+num(height-59)+' m '+num(width-margin)+' '+num(height-59)+' l S');
  chords.forEach((chord,index)=>{
    const col=index%columns,row=Math.floor(index/columns);
    const x=margin+col*(cardW+gap),y=gridTop-(row+1)*cardH-row*gap;
    rect(commands,x,y,cardW,cardH,1,.76);
    const compact=cardH<82;
    text(commands,chord.symbol+' - '+chord.name,x+6,y+cardH-14,compact?7.1:8.1,true);
    text(commands,'Notes: '+chord.notes.join(' - '),x+6,y+cardH-25,compact?6:6.6,false);
    keyboard(commands,chord,x+7,y+7,cardW-14,compact?15:18);
  });
  text(commands,'Piano Chord Explorer | Filled keys mark chord tones | 12-note octave reference',
    margin,17,6.2,false);
  text(commands,'Page 1 / 1',width-margin-45,17,6.2,false);
  return commands.join('\n')+'\n';
}
function pdfBuffer(content,paper){
  const stream=Buffer.from(content,'ascii');
  const objects=[
    Buffer.from('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n','ascii'),
    Buffer.from('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n','ascii'),
    Buffer.from('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+num(paper.width)+' '+num(paper.height)+'] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n','ascii'),
    Buffer.from('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n','ascii'),
    Buffer.from('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n','ascii'),
    Buffer.concat([Buffer.from('6 0 obj\n<< /Length '+stream.length+' >>\nstream\n','ascii'),stream,Buffer.from('\nendstream\nendobj\n','ascii')])
  ];
  const chunks=[Buffer.from('%PDF-1.4\n%PianoChordExplorer\n','ascii')],offsets=[0];
  let position=chunks[0].length;
  for(const object of objects){offsets.push(position);chunks.push(object);position+=object.length;}
  const xref=position;
  let table='xref\n0 7\n0000000000 65535 f \n';
  for(let i=1;i<offsets.length;i++)table+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  table+='trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
  chunks.push(Buffer.from(table,'ascii'));
  return Buffer.concat(chunks);
}
function getPrintableSets(){
  const byKey=new Map(coreChords.map(chord=>[chord.root+':'+chord.quality,chord]));
  const triads=['major','minor'].flatMap(quality=>ROOTS.map(root=>byKey.get(root+':'+quality)));
  const sevenths=['7','maj7','m7'].flatMap(quality=>ROOTS.map(root=>byKey.get(root+':'+quality)));
  if(triads.length!==24||triads.some(x=>!x)||sevenths.length!==36||sevenths.some(x=>!x))
    throw new Error('Expected 24 major/minor triads and 36 common seventh chords');
  return {triads,sevenths};
}
export function generatePrintablePdfs(outDir=path.join(ROOT,'public','downloads')){
  const {triads,sevenths}=getPrintableSets();
  fs.mkdirSync(outDir,{recursive:true});
  const files=[];
  for(const [kind,chords,title,subtitle] of [
    ['24-triads',triads,'24 Piano Chords - Major & Minor Triads','All 12 major and 12 minor triads | Note names and one-octave keyboard maps'],
    ['36-sevenths',sevenths,'36 Piano Seventh Chords','12 each: dominant 7th, major 7th and minor 7th | Note names and keyboard maps']
  ]){
    for(const format of ['a4','letter']){
      const paper=PAPER[format],name='piano-chord-'+kind+'-'+format+'.pdf';
      const buffer=pdfBuffer(pageCommands(chords,title,subtitle,paper),paper);
      fs.writeFileSync(path.join(outDir,name),buffer);
      files.push({name,bytes:buffer.length,format,count:chords.length});
    }
  }
  return files;
}
export {getPrintableSets,pdfBuffer,pageCommands};
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  for(const file of generatePrintablePdfs())console.log('Generated '+file.name+' ('+file.count+' chords, '+file.bytes+' bytes)');
}
