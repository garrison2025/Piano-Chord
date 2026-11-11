// This list is the V1.3 release gate: exactly 16 reviewed SEO chord detail pages.
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
].map(([slug, root, quality, symbol, name, keyword])=>({ slug,root,quality,symbol,name,keyword }));

export const navigation = [
  {href:'/chords/',label:'Chord Library'},
  {href:'/tools/chord-finder/',label:'Chord Finder'},
  {href:'/tools/inversion-explorer/',label:'Inversions'},
  {href:'/tools/chord-compare/',label:'Compare'},
  {href:'/printables/piano-chord-chart/',label:'Printables'},
];
