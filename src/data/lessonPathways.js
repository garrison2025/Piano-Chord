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


/**
 * Thirteen additional, individually reviewed drills mapped to each lesson's
 * existing, specific comparison text. Not a claim of separately validated
 * US keyword demand. This completes functional learning coverage of 29 lessons.
 */
export const supplementalEarDrills=Object.freeze({
  'd-flat-major':{
    target:'b-flat-minor',
    prompt:'Listen to D♭–F–A♭, followed by B♭–D♭–F. Find D♭ and F on the keyboard before you begin. Can you leave those two keys down and change just the remaining note?',
    answer:'D♭ and F are the two common tones. Move A♭ up a whole step to B♭, then put B♭ in the bass for B♭ minor in root position. The original D♭ major and its relative-minor chord are different harmonies, not inversions of one chord.',
  },
  'g-flat-major':{
    target:'e-flat-minor',
    prompt:'Start with the three black keys G♭–B♭–D♭ and listen to E♭–G♭–B♭ next. Before touching the destination chord, name the pair of keys that do not need to move.',
    answer:'G♭ and B♭ sound in both chords. D♭ rises a whole step to E♭; placing E♭ below the shared pair gives E♭ minor in root position. This is a relative-major/minor change, not G♭ major with a different bass.',
  },
  'a-flat-major':{
    target:'f-minor',
    prompt:'Hear A♭–C–E♭ followed by F–A♭–C. Focus on the natural C: it belongs to both shapes. Try to switch while keeping A♭ and C under the same fingers.',
    answer:'A♭ and C are shared. E♭ rises a whole step to F, yielding the pitch classes of F minor. To hear F as the root in root position, place the F below A♭ and C rather than assuming the original A♭ must remain the bass.',
  },
  'a-major':{
    target:'a-minor',
    prompt:'Alternate A–C♯–E with A–C–E. Hold the root and fifth as an anchor, then listen specifically to the middle voice. Which change is exactly one semitone?',
    answer:'C♯ falls one semitone to C natural while A and E stay fixed. The root-position triads have the same outer notes but a different third: major A–C♯ versus minor A–C. This is a parallel-major/minor contrast.',
  },
  'c-sharp-minor':{
    target:'e-major',
    prompt:'Play C♯–E–G♯ and then E–G♯–B slowly. Keep your fingertips ready on E and G♯, and decide whether the remaining note must move up or down.',
    answer:'E and G♯ are common tones. C♯ falls a whole step to B, completing E major. If B becomes the lowest note, the sounding chord is still E major but an inversion; place E at the bottom to hear the destination in root position.',
  },
  'e-flat-minor':{
    target:'g-flat-major',
    prompt:'Play E♭–G♭–B♭ and then G♭–B♭–D♭. Both shapes use black keys. Can you identify the two black keys that remain stationary through this change?',
    answer:'G♭ and B♭ are shared; E♭ descends one whole step to D♭. The new chord is G♭ major, whose root-position bass is G♭. Moving only one sounding pitch may leave you in an inversion until you rearrange the notes.',
  },
  'f-sharp-minor':{
    target:'a-major',
    prompt:'Listen to F♯–A–C♯ and then A–C♯–E. Aim to keep the white-key A and black-key C♯ under the same fingers while the third note changes.',
    answer:'A and C♯ remain as common tones. The F♯ moves down a whole step to E, giving A major. Do not mistake this for F♯ major: the minor third A remains natural throughout the first chord.',
  },
  'g-sharp-minor':{
    target:'b-major',
    prompt:'Start on G♯–B–D♯ and move to B–D♯–F♯. Look for the B and D♯ that occur in both chords, then sing the single moving voice.',
    answer:'B and D♯ are common tones. The remaining G♯ descends one whole step to F♯, producing B major. Position B in the bass if you want the second chord to sound in root position.',
  },
  'b-flat-minor':{
    target:'d-flat-major',
    prompt:'Play B♭–D♭–F followed by D♭–F–A♭. Without lifting D♭ and F, locate which remaining black key changes; then repeat with the destination root lowest.',
    answer:'D♭ and F remain in place. B♭ drops a whole step to A♭, so the new set of notes spells D♭ major. To hear D♭ major in root position, use D♭ as the bass rather than keeping B♭ below the chord.',
  },
  'c-major-7':{
    target:'c-7',
    prompt:'First play C–E–G–B, then C–E–G–B♭. Keep the first three voices steady; focus on the top note. Can you hear the difference between the two kinds of seventh?',
    answer:'The root C, third E and fifth G are identical. Only the seventh changes: B natural lowers one semitone to B♭. Cmaj7 contains a major seventh above C; C7 contains a minor seventh and usually functions as a dominant chord.',
  },
  'a-minor-7':{
    target:'c-major-7',
    prompt:'Play the all-white-key Am7 (A–C–E–G) and then Cmaj7 (C–E–G–B). Listen for the three notes that stay, and find the one voice that can move by a step.',
    answer:'C, E and G are common to both four-note chords. Moving A up one whole step to B gives Cmaj7, a different chord with C as the root. It is not enough to move the bass and call the result an inversion of Am7.',
  },
  'd-minor-7':{
    target:'g-7',
    prompt:'Compare Dm7 (D–F–A–C) with G7 (G–B–D–F). Can you keep D and F sounding while replacing the other two notes? Hear how this ii–V motion prepares C major.',
    answer:'D and F are the common tones. A can move down a whole step to G while C falls one semitone to B. The guide is a close-voiced ii7–V7 change: Dm7 is not merely a rotated G7 because their pitch-class sets differ.',
  },
  'g-7':{
    target:'c-major-7',
    prompt:'Play G7 (G–B–D–F), then Cmaj7 (C–E–G–B). Isolate F and B as the tense pair before resolving; keep G and B where possible for a smoother transition.',
    answer:'G and B are shared. Move F down one semitone to E and D down one whole step to C. The G7 tritone B–F can resolve by semitone to C–E in other voicings; this exact G7-to-Cmaj7 change also retains B as a common tone.',
  },
});

export const lessonEarDrills=Object.freeze({
  ...priorityEarDrills,
  ...supplementalEarDrills,
});
