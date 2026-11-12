// 24 major/minor roots with appropriate spellings, plus the original C7 lesson.
export const releaseChords = [
  ['b-minor','B','minor','Bm','B minor','Bm chord piano'],
  ['b-flat-major','Bb','major','Bb','B-flat major','bb piano chord'],
  ['d-minor','D','minor','Dm','D minor','d minor chord piano'],
  ['c-major','C','major','C','C major','c major chord piano'],
  ['e-minor','E','minor','Em','E minor','em on piano chords'],
  ['b-major','B','major','B','B major','b chord piano'],
  ['g-minor','G','minor','Gm','G minor','gm piano chord'],
  ['e-flat-major','Eb','major','Eb','E-flat major','chord e flat piano'],
  ['e-major','E','major','E','E major','e chord piano'],
  ['d-major','D','major','D','D major','d on piano chord'],
  ['a-minor','A','minor','Am','A minor','am piano chord'],
  ['g-major','G','major','G','G major','g chord piano'],
  ['f-minor','F','minor','Fm','F minor','f minor chord piano'],
  ['c-7','C','dominant7','C7','C dominant seventh','c7 chord'],
  ['c-minor','C','minor','Cm','C minor','cm chord piano'],
  ['f-major','F','major','F','F major','f major chord in piano'],
  // Full chromatic major/minor lesson coverage added as individually authored pages.
  ["d-flat-major","Db","major","Db","D-flat major","db major chord piano"],
  ["g-flat-major","Gb","major","Gb","G-flat major","gb major chord piano"],
  ["a-flat-major","Ab","major","Ab","A-flat major","ab major chord piano"],
  ["a-major","A","major","A","A major","a major chord piano"],
  ["c-sharp-minor","C#","minor","C#m","C-sharp minor","c sharp minor chord piano"],
  ["e-flat-minor","Eb","minor","Ebm","E-flat minor","eb minor piano chord"],
  ["f-sharp-minor","F#","minor","F#m","F-sharp minor","f sharp minor piano chord"],
  ["g-sharp-minor","G#","minor","G#m","G-sharp minor","g sharp minor piano chord"],
  ["b-flat-minor","Bb","minor","Bbm","B-flat minor","bb minor piano chord"]
].map(([slug, root, quality, symbol, name, keyword])=>({ slug,root,quality,symbol,name,keyword }));

// Stable original printable selection: do not silently expand A4/Letter print layouts.
export const starterPrintableChords = releaseChords.slice(0,16);

export const navigation = [
  {href:'/chords/',label:'Chord Lessons'},
  {href:'/tools/virtual-piano/',label:'Virtual Piano'},
  {href:'/tools/chord-library/',label:'120 Chords'},
  {href:'/tools/scales-and-keys/',label:'Scales & Keys'},
  {href:'/tools/chord-progressions/',label:'Progressions'},
  {href:'/tools/metronome/',label:'Metronome'},
];
