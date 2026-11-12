/**
 * Independently authored ear-training comparisons for the 16 priority
 * chord-intent SEO pages in Piano Chord feasibility plan V1.3.
 * These are exercises, not evidence of traffic and not new indexable routes.
 */
export const priorityEarDrills=Object.freeze({
  'b-minor':{
    target:'d-major',
    prompt:'Start with B–D–F♯, then listen to D–F♯–A. Before opening the answer, decide which two notes can stay and which voice changes.',
    answer:'D and F♯ are shared. B moves down one whole step to A. The change connects B minor to its relative major without moving the whole hand.',
  },
  'b-flat-major':{
    target:'g-minor',
    prompt:'Listen to B♭–D–F and then G–B♭–D. Try singing the note that moves rather than singing the whole second chord.',
    answer:'B♭ and D remain; F rises a whole step to G. The two chords are a relative-major/minor pair, but their roots are different.',
  },
  'd-minor':{
    target:'f-major',
    prompt:'Play D–F–A followed by F–A–C. Keep one finger ready on F and one on A; identify the note that falls.',
    answer:'F and A are common tones. D descends a whole step to C, giving an economical change to F major.',
  },
  'c-major':{
    target:'a-minor',
    prompt:'Hear C–E–G followed by A–C–E. If C and E stay still, what single note needs to move to complete A minor?',
    answer:'C and E are common tones. G moves up a whole step to A. When A is the lowest note, the harmony is A minor in root position.',
  },
  'e-minor':{
    target:'g-major',
    prompt:'Alternate E–G–B and G–B–D. Listen to the voice that changes while the other two stay under your fingers.',
    answer:'G and B stay in place. E drops a whole step to D. This is an easy relative-minor/major hand shift.',
  },
  'b-major':{
    target:'b-minor',
    prompt:'Keep the outer notes B and F♯, then play B major and B minor back to back. Which note creates the change in quality?',
    answer:'Only the third changes: D♯ in B major falls one semitone to D natural in B minor. The root B and fifth F♯ are unchanged.',
  },
  'g-minor':{
    target:'b-flat-major',
    prompt:'Listen to G–B♭–D and then B♭–D–F. Find the two tones shared by both chords before changing your hand shape.',
    answer:'B♭ and D remain. G lowers a whole step to F, connecting G minor with its relative major, B♭.',
  },
  'e-flat-major':{
    target:'c-minor',
    prompt:'Play E♭–G–B♭ and then C–E♭–G. Try keeping the middle pair of notes under the same fingers.',
    answer:'E♭ and G are shared while B♭ rises a whole step to C. Notice that the new bass can be C even if your hand keeps E♭ and G above it.',
  },
  'e-major':{
    target:'e-minor',
    prompt:'Hold E and B, then alternate E–G♯–B with E–G–B. Which black key turns into a white key?',
    answer:'G♯ falls one semitone to G natural. E and B do not move. The third, not the root or fifth, changes the chord from major to minor.',
  },
  'd-major':{
    target:'b-minor',
    prompt:'Play D–F♯–A and then B–D–F♯. Listen for the one voice that can move upward while the other two stay.',
    answer:'D and F♯ are common tones; A rises one whole step to B. Both chords use the same two stable upper tones.',
  },
  'a-minor':{
    target:'c-major',
    prompt:'Keep C and E sounding, alternate A–C–E with C–E–G, and decide which note moves down. Pause for two beats after each change so you can listen before you answer.',
    answer:'A descends a whole step to G. C and E stay, revealing how a relative-minor change can require just one moving voice.',
  },
  'g-major':{
    target:'e-minor',
    prompt:'Listen to G–B–D and E–G–B. Try to keep the G–B interval physically in place as you make the change.',
    answer:'G and B remain. D rises one whole step to E; the new chord is E minor, not a different inversion of G major.',
  },
  'f-minor':{
    target:'f-major',
    prompt:'Hold F and C. Toggle the middle note between A♭ and A natural while listening for the shift in color.',
    answer:'A♭ rises a semitone to A natural. F and C are unchanged, so this is a parallel minor-to-major change, not a transposition.',
  },
  'c-7':{
    target:'f-major',
    prompt:'Hear C–E–G–B♭, then F–A–C. Listen especially to the dissonance between E and B♭ and how it relaxes when F major arrives.',
    answer:'The tritone E–B♭ in C7 resolves by contrary semitone motion to F–A: E goes up to F and B♭ goes down to A. C can stay as a common tone; G may be released or redistributed.',
  },
  'c-minor':{
    target:'e-flat-major',
    prompt:'Compare C–E♭–G with E♭–G–B♭. Hum the two notes that stay before moving the remaining finger.',
    answer:'E♭ and G are shared; C moves down a whole step to B♭. The two chords are related, but the note in the bass can change.',
  },
  'f-major':{
    target:'f-minor',
    prompt:'Keep F and C held and switch between F–A–C and F–A♭–C. Which voice must move, and by how much?',
    answer:'A natural lowers a semitone to A♭; the root F and fifth C remain. This is a parallel major-to-minor contrast.',
  },
});
