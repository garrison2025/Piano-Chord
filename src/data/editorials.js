// Original chord-specific editorial lessons: 24 major/minor triads and 5 selected seventh chords.
// These describe concrete ways to hear/use each chord, not generic spun templates.
export const chordLessons={
 'b-minor': {
   character:'B minor feels settled in its own key yet can sound reflective beside D major. Its F♯ is the note that distinguishes the chord from a simple B–D interval.',
   comparison:'Compare Bm with D major (D–F♯–A): D and F♯ remain in both chords, while B moves to A. Listen for how two stable notes let the change feel smooth.',
   exercise:'Play B–D–F♯ slowly, then switch to D–F♯–A without releasing D and F♯. Notice that only one note needs to move.',
   pitfall:'Do not substitute F natural for F♯. B–D–F is a different diminished-triad sound.',
 },
 'b-flat-major': {
   character:'B♭ major is a common home chord in brass and wind repertoire. On piano it pairs two white keys, D and F, with the black-key root B♭.',
   comparison:'Compare it with G minor (G–B♭–D). The B♭ and D can stay in place while F moves to G, making it easy to hear their relationship.',
   exercise:'Find B♭ with your eyes closed, then locate D and F by their interval distances. Switch to G minor by keeping B♭ and D held.',
   pitfall:'Write the root as B♭ in this chord, not A♯. Equal-tempered sound alone does not determine the correct chord spelling.',
 },
 'd-minor': {
   character:'D minor changes the bright F♯ of D major into F natural. That single semitone difference is a useful ear-training contrast.',
   comparison:'Compare D minor with F major (F–A–C). F and A are common tones, while the D can move one step down to C.',
   exercise:'Play D–F–A, then F–A–C. Listen to the shared F and A and the motion of the outer note.',
   pitfall:'Do not confuse D minor with D major; the third here is F natural, not F♯.',
 },
 'c-major': {
   character:'C major is often the first piano chord students encounter because its three notes, C–E–G, are all white keys and form an easy visual landmark.',
   comparison:'Compare C major to A minor (A–C–E). C and E are shared, while G moves up to A; this gives an accessible first harmony exercise.',
   exercise:'Play C–E–G, then keep C and E steady while moving G up to A. Reposition A below C and E to hear A minor in root position; the original G-to-A move alone gives a different voicing. Name each chord tone before you play.',
   pitfall:'C major chord is not the same search task as the chords found inside the C major scale. A chord is three specific notes; a key contains several harmonies.',
 },
 'e-minor': {
   character:'E minor is a compact white-key shape: E, G and B. The minor third, G, creates the characteristic darker quality.',
   comparison:'Try E minor followed by G major (G–B–D). Keeping G and B in place makes the relationship immediately audible.',
   exercise:'Play E–G–B, then G–B–D. Move only E to D, and listen before looking down at the keys.',
   pitfall:'Do not raise G to G♯ unless you want E major. The two chords share their root and fifth but not their third.',
 },
 'b-major': {
   character:'B major is a useful introduction to sharp note spellings. Its written notes are B–D♯–F♯, with both upper chord tones on black keys.',
   comparison:'Compare B major to B minor (B–D–F♯). The only difference is whether the third is D♯ or D natural.',
   exercise:'Hold B and F♯, alternate D and D♯ in the middle, and hear how one semitone changes the overall harmony.',
   pitfall:'Avoid writing E♭ in place of D♯ in this B major chord: they sound alike on the piano but have different scale-degree names.',
 },
 'g-minor': {
   character:'G minor contains G–B♭–D. It uses one black key and two white keys, making it especially easy to compare visually with G major.',
   comparison:'Switch from G minor to B♭ major (B♭–D–F). The B♭ and D remain; the G moves down to F.',
   exercise:'Play the G minor notes individually, then play B♭–D–F. Try changing with the smallest possible hand movement.',
   pitfall:'The third is B♭, not B natural. A natural B makes G major instead.',
 },
 'e-flat-major': {
   character:'E♭ major is spelled E♭–G–B♭. It is often easier to remember by finding G first and locating the two nearby black keys.',
   comparison:'C minor (C–E♭–G) shares E♭ and G with E♭ major. The B♭ of E♭ major can move to C for a smooth change.',
   exercise:'Play E♭–G–B♭, then change to C–E♭–G. Hear the shared E♭ and G while the bass moves.',
   pitfall:'Use E♭ and B♭ in the note names; calling them D♯ and A♯ would hide the stacked-third structure.',
 },
 'e-major': {
   character:'E major has the notes E–G♯–B. Its bright quality comes from the raised third G♯ compared with E minor.',
   comparison:'Play E major and E minor alternately. Both contain E and B; G♯ becomes G to create the minor quality.',
   exercise:'Keep E and B held while slowly moving G♯ to G and back. Name the interval change with each move.',
   pitfall:'An E major chord contains G♯, not G natural. Listen to that half-step difference.',
 },
 'd-major': {
   character:'D major is D–F♯–A, with just one black key. It is a strong partner for B minor because they share two notes.',
   comparison:'Bm (B–D–F♯) and D major share D and F♯. They are useful for practicing how harmony changes with minimal movement.',
   exercise:'Hold D and F♯, play A for D major, then replace A with B for B minor. Listen to the change in the top voice.',
   pitfall:'Do not lower F♯ to F natural: that produces D minor rather than D major.',
 },
 'a-minor': {
   character:'A minor, A–C–E, shares the all-white-key simplicity of C major but has a minor third between A and C.',
   comparison:'A minor and C major share C and E, so you can compare their different bass and upper notes without moving every finger.',
   exercise:'Play A–C–E, then C–E–G, keeping C and E in common. Try reversing the transition without stopping.',
   pitfall:'A minor chord is not A major. Raising C to C♯ produces a different triad.',
 },
 'g-major': {
   character:'G major is spelled G–B–D. It is a practical first chord for noticing how the black-key-free triad sits around the higher C octave.',
   comparison:'Em (E–G–B) shares G and B with G major. The D of G major can move to E for a simple chord change.',
   exercise:'Play G–B–D and E–G–B using as few moving notes as possible, then try the first inversion of each.',
   pitfall:'The middle note B is natural, not B♭. Lowering it by a semitone creates the distinctly different G minor chord.',
 },
 'f-minor': {
   character:'F minor is F–A♭–C. The A♭ gives the chord its minor color while F and C remain stable with F major.',
   comparison:'Compare F minor with F major (F–A–C). Move only A♭ to A and hear the complete shift from minor to major.',
   exercise:'Play F and C together, then add A♭ followed by A natural. Repeat the change while listening for the mood difference.',
   pitfall:'Spelling the middle note G♯ instead of A♭ loses the chord’s third-letter structure in F minor.',
 },
 'c-7': {
   character:'C7 is a dominant seventh chord, not a major seventh. It is built from the C major triad plus B♭, a minor seventh above C.',
   comparison:'Compare C7 with C major (C–E–G). Add and remove B♭ without moving the other three notes to hear the new tension.',
   exercise:'Play C–E–G, then add B♭ slowly. Listen for the stronger desire to move onward to another chord.',
   pitfall:'C7 uses B♭, while Cmaj7 uses B natural. Do not use those names interchangeably.',
 },
 'c-minor': {
   character:'C minor, C–E♭–G, has two white keys and a black-key third. That E♭ changes the sound from the familiar C major triad.',
   comparison:'Compare C minor to E♭ major (E♭–G–B♭). E♭ and G are common tones while C moves down to B♭.',
   exercise:'Hold E♭ and G, switch between adding C and adding B♭. Notice how the same shared notes can support different roots.',
   pitfall:'For C minor, write E♭ as the third, not D♯. The note must be a type of E to spell a third over C.',
 },
 'f-major': {
   character:'F major is F–A–C. It can act as a visual anchor for the white-key triads while helping students find the keyboard’s F note.',
   comparison:'Switch between F major and F minor (F–A♭–C). Only the middle note changes, so the difference is easy to hear.',
   exercise:'Hold F and C while alternating A natural and A♭. Describe the sound of each version before checking its name.',
   pitfall:'Do not confuse A natural and A♭ here; only A natural completes the F major triad.',
 },
 // Nine individually authored major/minor lessons (2026-11-12).
 'd-flat-major': {
   character:"D♭ major (D♭–F–A♭) pairs a white-key third, F, with two black keys. It is a comfortable way to learn that a flat-key chord still has a normal major-third interval of four semitones from its root.",
   comparison:"Compare D♭ major with B♭ minor (B♭–D♭–F). D♭ and F are common tones; the other note changes from A♭ to B♭. Keep the shared notes under the same fingers and listen to how the bass changes the harmonic center.",
   exercise:"Locate D♭ immediately to the left of D, then add F and A♭. Play the notes separately on beats one, two and three; on beat four, play all three together. Next, sustain D♭ and F while changing A♭ to B♭ to hear B♭ minor.",
   pitfall:"D♭ major is not written C♯–F–G♯. Even though those keys sound the same in equal temperament, the chord's written third is F and its fifth is A♭.",
 },
 'g-flat-major': {
   character:"G♭ major (G♭–B♭–D♭) is an all-black-key triad. Its visual symmetry makes the fingering approachable, while its spelling reinforces that a major chord is built with successive letter-name thirds, not arbitrary sharps.",
   comparison:"Compare G♭ major with E♭ minor (E♭–G♭–B♭). G♭ and B♭ stay the same, while D♭ can rise to E♭. This is a direct way to hear the relationship between a major key's tonic and its relative-minor chord.",
   exercise:"Play G♭–B♭–D♭ once together, then arpeggiate upward and back down. Without moving G♭ or B♭, replace D♭ with E♭ and play E♭ minor. Repeat slowly until the switch takes one deliberate finger movement.",
   pitfall:"Do not name the third A♯ merely because it shares B♭'s key. The G♭ major triad is spelled G♭–B♭–D♭, using a G, a B and a D.",
 },
 'a-flat-major': {
   character:"A♭ major consists of A♭–C–E♭. The natural C in the middle is a useful landmark between two black keys; raising that third is not necessary because C is already four semitones above A♭.",
   comparison:"Compare A♭ major with F minor (F–A♭–C). A♭ and C remain in common while the third note moves from E♭ to F. The two chords share enough notes that the shift can feel connected rather than abrupt.",
   exercise:"Start with A♭–C–E♭ in root position. Hold A♭ and C, then remove E♭ and introduce F as the lower note of F minor. Reverse the movement and try it again without looking at either keyboard diagram.",
   pitfall:"A♭ major has C natural, not C♭. Substituting C♭ changes the interval above A♭ from a major third to a minor third, so the result is A♭ minor.",
 },
 'a-major': {
   character:"A major is spelled A–C♯–E. Its single black-key third makes it easy to see and hear the exact semitone that separates A major from the all-white-key A minor triad.",
   comparison:"Alternate A major (A–C♯–E) with A minor (A–C–E). A and E do not move; only the middle note changes. Then compare A major with F♯ minor (F♯–A–C♯), which shares A and C♯ instead.",
   exercise:"Keep A and E held softly, moving C♯ down to C natural and back as a listening drill. Next play F♯–A–C♯ and return to A major while keeping A and C♯ in place. Name which note moved in each change.",
   pitfall:"The note between A and E must be C♯ in A major. C natural makes A minor, while calling C♯ 'D♭' conceals the chord's written third.",
 },
 'c-sharp-minor': {
   character:"C♯ minor (C♯–E–G♯) combines two black-key outer notes with a white-key minor third. It is more commonly written with sharps than as the enharmonic D♭ minor for beginner piano instruction.",
   comparison:"Compare C♯ minor with E major (E–G♯–B). E and G♯ are shared. Replace C♯ with B to hear the relative-major connection, then return to C♯ minor by moving only that one chord tone.",
   exercise:"First find C♯ directly to the right of C; add E and G♯. Play the triad as single notes, then as a block. Leave E and G♯ in place and replace C♯ with B to form E major, returning to C♯ minor without resetting your hand.",
   pitfall:"C♯ minor contains E natural, not E♯. Raising E to E♯ creates C♯ major; relabeling E as F also hides the correct minor-third interval.",
 },
 'e-flat-minor': {
   character:"E♭ minor (E♭–G♭–B♭) uses three black keys. Although those keys may resemble a sharp-based pattern, the E♭–G♭–B♭ note names show the correct root, minor third and perfect fifth.",
   comparison:"Compare E♭ minor with G♭ major (G♭–B♭–D♭). G♭ and B♭ are common tones; E♭ moves down to D♭. The shared notes make this a useful black-key practice pair with very little hand movement.",
   exercise:"Play E♭–G♭–B♭ as a slow ascending arpeggio and descend in reverse. Repeat with all three notes together. Keep G♭ and B♭ held, switch E♭ to D♭ for G♭ major, and switch back for E♭ minor.",
   pitfall:"The minor third of E♭ is G♭, not G natural. G natural would make E♭ major even though the root and fifth remain E♭ and B♭.",
 },
 'f-sharp-minor': {
   character:"F♯ minor has F♯–A–C♯: two black keys surrounding the white-key minor third A. It is the relative-minor triad of A major and an effective way to practise black-white-black key shapes.",
   comparison:"Compare F♯ minor with A major (A–C♯–E). A and C♯ remain common; F♯ can move down to E. Both chords are simple to play close together because two of their three pitch classes overlap.",
   exercise:"Arpeggiate F♯–A–C♯ slowly three times with equal note lengths. Hold A and C♯ for a moment, replace F♯ with E, and play the A major chord. Switch back without lifting the shared pair.",
   pitfall:"F♯ minor uses A natural. A♯ would change it into F♯ major. The sharp sign belongs to the root and fifth here, not to the third.",
 },
 'g-sharp-minor': {
   character:"G♯ minor (G♯–B–D♯) has a white-key third between two black-key chord tones. It connects naturally to B major while retaining the correctly spelled minor third B above G♯.",
   comparison:"Compare G♯ minor with B major (B–D♯–F♯). B and D♯ stay in both chords. Moving G♯ down to F♯ creates B major; reversing that movement returns to the relative-minor harmony.",
   exercise:"Find G♯ immediately above G, then locate B and D♯. Play the notes individually, then together. Hold B and D♯ steady while alternating the remaining note between G♯ for G♯ minor and F♯ for B major.",
   pitfall:"The third of G♯ minor is B natural, not B♯; B♯ would make the major triad. Do not substitute the enharmonic A♭ minor spelling without explaining why it looks different.",
 },
 'b-flat-minor': {
   character:"B♭ minor (B♭–D♭–F) places two black keys below a white-key fifth. The D♭ is the minor third that distinguishes it from B♭ major, which instead contains D natural.",
   comparison:"Compare B♭ minor with D♭ major (D♭–F–A♭). D♭ and F remain unchanged while B♭ moves down to A♭. The same pair of notes can support a minor or a major chord depending on the third tone.",
   exercise:"Play B♭–D♭–F separately, then as a chord. Without moving D♭ and F, change B♭ to A♭ to make D♭ major. Finish by alternating D♭ and D natural over a steady B♭–F to hear the minor/major third difference.",
   pitfall:"B♭ minor uses D♭, not D natural. Writing C♯ instead of D♭ hides the written third from B♭ and makes the notation harder to understand.",
 }, // Four original seventh-chord ear-training lessons.
 'c-major-7': {
   character: "C major seventh (C–E–G–B) builds on the familiar C major triad and adds B natural, a major seventh above C. The half-step between B and the next C makes it feel gently unfinished rather than demanding an immediate resolution.",
   comparison: "Put Cmaj7 beside C7 (C–E–G–B♭). Both keep C, E and G; the only difference is the seventh, B versus B♭. Then compare Cm7 (C–E♭–G–B♭) to hear how changing the third adds a second, independent change.",
   exercise: "Play the three-note C–E–G triad and hold it for two counts. Add B to make Cmaj7, then release only B. Repeat with B♭ to make C7. Next play Dm7–G7–Cmaj7 slowly, four beats per chord; notice B stays in G7 and Cmaj7.",
   pitfall: "The word 'maj7' refers to the seventh interval as well as the major triad. Cmaj7 uses B natural; C7 has B♭. Never substitute C7 when a chart explicitly says Cmaj7.",
 },
 'a-minor-7': {
   character: "A minor seventh (A–C–E–G) consists entirely of white keys. It keeps the minor third C of the A minor triad, then adds G, which is a minor seventh (10 semitones) above A. This combination is common in smooth four-chord harmony.",
   comparison: "Compare Am7 to Cmaj7 (C–E–G–B): C, E and G are shared, while A changes to B. With the shared notes held, the bass and one moving note are enough to hear the difference. Contrast Am7 with A7 (A–C♯–E–G), where C♯ changes the chord's third.",
   exercise: "Start with A–C–E in a comfortable register and add G. Play Am7 in root position, then its first inversion C–E–G–A. For a four-bar loop try Cmaj7–Am7–Dm7–G7, one chord per bar; sustain C, E or G where a neighbor chord shares it.",
   pitfall: "Am7 is not Amaj7 and not A7. Am7 has C natural and G natural; A7 changes C to C♯, while Amaj7 changes both C to C♯ and G to G♯.",
 },
 'd-minor-7': {
   character: "D minor seventh (D–F–A–C) adds C natural above a D minor triad. Its minor third F and minor seventh C matter more to its identity than the fifth A when learning basic jazz-style shell voicings.",
   comparison: "Compare Dm7 (D–F–A–C) with G7 (G–B–D–F). They share D and F. In a C-major ii–V–I progression, you can hear how that F becomes the seventh of G7 while D becomes its fifth, before G7 resolves to Cmaj7.",
   exercise: "Play D–F–A–C one note at a time, then together. Next move to G–B–D–F without changing D and F if your voicing allows. Finish on C–E–G–B. Set a metronome to 72 BPM and hold each chord four beats, listening for B moving to C above the final chord.",
   pitfall: "Dm7 uses F natural and C natural. F♯ would turn the basic triad into D major, while C♯ would create Dm(maj7) instead of Dm7. A bare D7 is a different chord: D–F♯–A–C.",
 },
 'g-7': {
   character: "G7 (G–B–D–F) is the dominant seventh built on G. The B–F interval forms a tritone whose notes commonly resolve by semitone to C and E when the harmony moves to C major. It is different from Gmaj7, which would use F♯.",
   comparison: "Compare G7 with G major (G–B–D) to hear the added F. Then compare G7 with Cmaj7 (C–E–G–B): G and B remain common tones, while F moves to E and D can move to C. This is the clear V7–Imaj7 move in C major.",
   exercise: "Play G–B–D, add F, then stop on Cmaj7 (C–E–G–B) for four beats. Try a reduced G7 shell of B and F; move B up to C and F down to E. Finally practise the full Dm7–G7–Cmaj7 cadence at 60 BPM before speeding up.",
   pitfall: "G7 means G–B–D–F, not G–B–D–F♯. The latter is Gmaj7. Do not interpret the plain '7' symbol as a major seventh.",
 },
};
