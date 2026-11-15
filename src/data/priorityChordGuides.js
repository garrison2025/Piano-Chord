/**
 * Individually authored, task-specific beginner guidance for the five
 * Semrush US V1.3 priority triads. No claimed universal fingering or new URLs.
 * Supplement existing chord-specific ear training, rather than duplicating it.
 */
export const priorityChordGuides=Object.freeze({
  'b-minor':{
    heading:'Bm piano chord: find F♯ and hear the bass move',
    intro:'B minor uses B, D and F♯. The black key F♯, between F and G, is the note beginners often miss when they try to play Bm on the piano.',
    question:'Which keys make Bm, Bm/D and Bm/F♯?',
    answer:'Start at B and play B–D–F♯ together. For Bm/D, place D lowest and use D–F♯–B. For Bm/F♯, place F♯ lowest and use F♯–B–D. These are three voicings of the same B minor harmony, not three different chord types.',
    exerciseTitle:'Try a two-chord Bm to D exercise',
    steps:[
      'Play B–D–F♯ in root position and name the black key aloud: F♯.',
      'Keep D and F♯ while moving B to A: the new set D–F♯–A is D major.',
      'Return to Bm and select First inversion above to hear D as the bass.'
    ],
    contrast:'If you play B–D♯–F♯, you have B major, not B minor. The third must be D natural for Bm.',
    compareHref:'/tools/chord-compare/?a=b-minor&b=d-major',
    compareLabel:'Hear Bm and D major side by side',
    nextHref:'/chords/d-major/',
    nextLabel:'Learn the D major chord'
  },
  'b-flat-major':{
    heading:'B♭ (Bb) piano chord: locate the black-key root',
    intro:'The B♭ major chord is B♭–D–F. Find the black key immediately left of B natural, then add white keys D and F. Bb is the plain-text way to write B♭.',
    question:'What do Bb/D and Bb/F mean on piano?',
    answer:'Bb/D uses D–F–B♭ with D as its lowest tone. Bb/F uses F–B♭–D with F as the lowest tone. Both contain the original B♭ major chord tones; the slash only specifies which tone is in the bass.',
    exerciseTitle:'Practise Bb major with G minor',
    steps:[
      'Find B♭ first, then play B♭–D–F with all three notes together.',
      'Keep B♭ and D steady; replace F with G to hear G minor (G–B♭–D).',
      'Switch back to B♭ and try its first inversion with D below the other notes.'
    ],
    contrast:'A♯ is the same piano key in equal temperament, but B♭–D–F is the correct written spelling of this B-flat major triad.',
    compareHref:'/tools/chord-compare/?a=b-flat-major&b=g-minor',
    compareLabel:'Hear Bb major beside G minor',
    nextHref:'/chords/g-minor/',
    nextLabel:'Learn the related G minor chord'
  },
  'd-minor':{
    heading:'Dm piano chord: F natural, slash bass and easy changes',
    intro:'D minor is D–F–A, three white keys. The F natural in the middle is what makes Dm minor; a D major chord instead contains F♯.',
    question:'How do I play Dm/F and Dm/A?',
    answer:'Dm/F puts F in the bass: F–A–D. Dm/A puts A in the bass: A–D–F. These are first and second inversions. On the piano, a slash name tells you the lowest sounding note without changing the three pitch classes.',
    exerciseTitle:'Change from D minor to F major',
    steps:[
      'Play D–F–A, then spell the notes without looking at the diagram.',
      'Hold F and A while changing D to C: now you have F–A–C, an F major chord.',
      'Return to Dm, choose Second inversion and listen for the low A.'
    ],
    contrast:'D–F♯–A is D major. If the middle key is black instead of the white F, you have changed the chord quality.',
    compareHref:'/tools/chord-compare/?a=d-minor&b=f-major',
    compareLabel:'Compare Dm and F major',
    nextHref:'/chords/f-major/',
    nextLabel:'Learn the F major chord'
  },
  'e-minor':{
    heading:'Em piano chord: three white keys and an easy G change',
    intro:'E minor uses E–G–B. These white keys are easy to spot; G natural, not G♯, gives the chord its minor third.',
    question:'Which note goes in the bass for Em/G or Em/B?',
    answer:'Em/G is the first inversion G–B–E. Em/B is the second inversion B–E–G. All three forms use the same E minor notes, with a different lowest note.',
    exerciseTitle:'Keep two notes while moving from Em to G',
    steps:[
      'Play E–G–B together and listen to the minor sound.',
      'Leave G and B in place; replace E with D to produce G–B–D, G major.',
      'Play Em/G, then return to root position and listen to the bass change.'
    ],
    contrast:'Do not confuse E minor with E major: E–G♯–B raises the third by one semitone.',
    compareHref:'/tools/chord-compare/?a=e-minor&b=g-major',
    compareLabel:'Hear the Em to G major change',
    nextHref:'/chords/g-major/',
    nextLabel:'Learn the G major chord'
  },
  'g-major':{
    heading:'G piano chord: G–B–D, inversions and a common mistake',
    intro:'The G major piano chord uses white keys G, B and D. G is the root, B the major third and D the perfect fifth; you do not need G♯ or B♭ to play this chord.',
    question:'How do I play G/B and G/D on piano?',
    answer:'G/B is G major in first inversion, with B–D–G from low to high. G/D is its second inversion, D–G–B. Both sound like G major but change the bass motion when you connect chords.',
    exerciseTitle:'Use the shared notes of G and Em',
    steps:[
      'Play G–B–D and then find the B natural white key again.',
      'Keep G and B while changing D to E, forming the E minor chord E–G–B.',
      'Change back to G and listen to its first inversion with B in the bass.'
    ],
    contrast:'G minor is G–B♭–D. If you replace B natural with B♭, the same root and fifth become a minor chord.',
    compareHref:'/tools/chord-compare/?a=g-major&b=e-minor',
    compareLabel:'Compare G major and E minor',
    nextHref:'/chords/e-minor/',
    nextLabel:'Learn the E minor chord'
  }
});
