# Piano Chord Explorer — interactive learning tools (2026-11-12)

This release expands the earlier 16 individually authored chord lessons, 120-chord atlas and 88-key virtual piano. All new features run in the browser, without a database, microphone permissions, paid APIs or account connection.

## Scales & Keys
- One interactive indexable tool at \`/tools/scales-and-keys/\` with 12 major and 12 natural-minor keys (24 selections).
- Correct diatonic pitch spelling for keys including G-flat major and C-sharp minor; audio preview of an ascending scale, clickable piano keys and seven diatonic triads.
- Natural minor is *not* silently replaced with harmonic/melodic minor. Individual thin SEO pages for each selector state are not generated.

## Chord Progression Trainer
- \`/tools/chord-progressions/\` provides eight four-bar presets: four major and four minor, optional click tracks, custom degree choices, tempo 50–180 BPM, optional loop, clipboard export.
- Special harmonic minor V major is explicitly labelled and produces an altered third. Natural minor v stays minor.
- Timed audio is scheduled using Web Audio's own clock. The UI is only a presentation layer, so timer delays do not shift audio start times.

## Metronome
- \`/tools/metronome/\` and a synchronized standalone component within \`/tools/virtual-piano/\`.
- Adjustable 40–200 BPM (quarter-note beats), 2/4, 3/4 and 4/4, Tap Tempo and accented first beat. Web Audio click events are scheduled ahead of time.
- Stops on tab hide/page unload; its clicks are not included in Virtual Piano's note-based recording (this distinction is disclosed in the UI).

## Acceptance
- Unit: \`tests/keyTheory.test.js\`. Build/link/Sitemap: \`scripts/verify-build.mjs\`. Browser: \`scripts/browser-learning-e2e.mjs\` / GitHub Actions \`Learning Tools Browser E2E\`.
- Browser suite tests chromatic spellings, key switches, natural vs harmonic dominant, editable 4-bar cards, audio start/stop, metronome Tap Tempo, 88-key coexistence and simulated 390px mobile layout.
- Physical iOS/Android device and user listening tests remain independent checks.

## Verified acceptance — 2026-11-12

- Static build and existing music/SEO tests: [CI success](https://github.com/garrison2025/Piano-Chord/actions/runs/43131371354), including checks for 29 indexable HTML routes and 16 original keyboard SVGs.
- Real headless Chromium desktop and 390px emulated mobile: [Learning Tools Browser E2E success](https://github.com/garrison2025/Piano-Chord/actions/runs/43131371508). Tests switched from C major to G-flat major and A natural minor, clicked a sounded scale/triad, changed progression from C pop to A minor harmonic cadence, edited V into v, played/stopped four bars, tested Tap Tempo and 3/4 metronome, checked full virtual piano's embedded metronome and absence of viewport overflow.
- The first browser run exposed an actual 390px horizontal overflow in the Scales keyboard; fixed by constraining min-width on the card/grid and allowing only the keyboard itself to scroll. The second browser run passed.
- The Chromium artifact `piano-learning-browser-screenshots` includes desktop screenshots and 390px screenshots for all three new routes. These are real rendered captures of the generated site, not mockups.
- [Original video WASM export regression](https://github.com/garrison2025/Piano-Chord/actions/runs/43130905741) passed after embedding the metronome and adding the new routes.
- Live Cloudflare HTML and canonical metadata were fetched for all three new tool pages and the existing Virtual Piano; each responds and displays the expected new content.
- Unverified: physical iPhone Safari / Android Chrome audio latency and metronome multitasking, true piano key feel on touch devices, and user-level pedagogical review. The metronome clicks are intentionally not included in the piano recorder's note-event exports.

## Editable progression → Virtual Piano practice handoff

- Progression Trainer serializes the four **edited** chord degrees/qualities, key and tempo into validated query parameters; no account, database or extra indexable URL is created.
- Virtual Piano highlights a target C4-octave voicing, provides a four-bar silent visual guide (manual/timed), exact pitch-class chord matching with octave freedom, and a Record & Follow button that invokes the existing recording studio.
- The guide produces **no audio of its own**, and only real keyboard notes are recorded. Replayed takes do not mark a practice target as correctly played. Edited sequences can be returned to the trainer with BPM preserved.
- Local unit test `tests/practiceTransfer.test.js` checks C pop, harmonic-minor V, edits, URL rejection and octave-invariant recognition. Learning browser E2E covers roundtrip navigation.

## Seventh chord continuous practice player (2026-11-12)

The seventh-chord comparison guide now has a browser-only Web Audio continuous player for Dm7–G7–Cmaj7 and Cmaj7–Am7–Dm7–G7. Chord attacks are scheduled against a single AudioContext timeline (four quarter-note beats per bar), with optional beat click/accent, 50–180 BPM, restart, stop and loop, and real-time highlighted bar. New deterministic `src/lib/seventhPractice.mjs` plus `tests/seventhPractice.test.js` validate exact chord spellings, bar timing and allowed tempos. Unlike the silent visual guide in Virtual Piano, this tool synthesizes the backing chords; it does not record or transmit the user's keyboard input. Opening another page or hiding the tab stops playback. The published chord lesson/SVG count is unchanged.

### 2026-11-12 dynamic card styling regression

Actual Chromium screenshots exposed unstyled bars: cards inserted by JavaScript lacked Astro's compile-time scoped CSS attribute. The guide now uses `:global(#seventh-player-bars …)` selectors scoped under the unique player ID. A hydration-ready marker and a 390px Playwright computed-style/geometry test verify that dynamically generated cards have a visible border, flex content and a true two-column mobile layout.


## Seventh-chord practice → 88-key piano → recording (2026-11-12)

- Entry: \`/guides/seventh-chords-piano/\`; the CTA beside the seventh-chord playback controls carries the selected **pattern and BPM** to \`/tools/virtual-piano/?practice=7&pattern=ii-v-i&bpm=80\`. The URL is validated against just two authored patterns and integer 50–180 BPM. Duplicates, extra keys and malformed values are rejected without affecting normal piano play.
- The guide shows **three** steps for ii–V–I or **four** for the turnaround. Every step uses the true four-note seventh voicing (for example Dm7 = D–F–A–C). Silent key highlights are only guidance; recognition checks all **four distinct pitch classes**, accepting octave changes and inversions, but rejecting missing/extra pitch classes. The legacy 4-bar triad handoff remains compatible.
- Live chord feedback now names played triads and seventh chords independently from the exercise. Automatic chord symbols preserve the quality suffix: \`C7\`, \`Cmaj7\`, \`Am7\`, \`Dm7\` (previously auto-generated \`maj7\` / \`m7\` symbols could be mislabeled).
- Pressing **Record & follow guide** starts the existing local note-event recorder and timed guide. Only notes played by the user enter the MIDI/audio/video take; hints and the separate metronome remain silent to the recording. Stop recording before replay, MIDI download or browser-rendered 9:16 video share. Native codec compatibility depends on the device; WebM fallback and optional local MP4 conversion are unchanged.
- Unit coverage: \`tests/seventhTransfer.test.js\`, \`tests/chordDetection.test.js\`; Chromium integration: \`scripts/browser-learning-e2e.mjs\` checks selected BPM, three/four step counts, key hints, live Dm7 feedback, recording/MIDI controls, duplicate-query rejection and 390px mobile overflow.
- No additional server, database, paid audio service, direct TikTok/X posting API, user account or background upload is introduced. Native iOS/Android browser recording compatibility and real social-platform ingestion remain separate device acceptance gates.


## Recorded practice assessment (2026-11-12)

- When the user selects **Record & follow guide**, the normal local MIDI note recorder runs alongside the silent timed bar guide. A new deterministic analysis examines only those recorded note events, not microphone audio, video pixels, metronome clicks or demo chord audio.
- \`src/lib/practiceAssessment.mjs\` checks each scheduled bar independently. A chord counts when all target pitch classes are simultaneously held (allowing octave changes, inversions, octave doubling) with no extra pitch class for at least **45 continuous milliseconds**. It returns matched, missed, or not reached if the recording ends before that bar, plus the first detected beat and offset.
- The displayed number is **chord coverage** (matched bars / all scheduled bars), never an AI judgement of musical ability, technique, expressive timing or audition quality. Incomplete takes are explicitly labeled partial. If the user manually changes/stops/restarts the guide during recording or hides the tab, the timing-based report is suppressed rather than scoring a mismatched sequence.
- The result is shown under the piano guide after the take finishes. **Copy results** copies plain text for an optional social caption; if the clipboard permission fails, a selectable textarea appears. **Save practice summary** downloads a UTF-8 text file. Both happen only on user action. No extra service, user account, database, remote recording storage, or social OAuth is added.
- Tests cover perfect/partial/incorrect notes, different octaves, insufficient chord overlap, late beat detection and four-bar triad compatibility. The Chromium integration suite exercises actual guided recording, 1-of-3/0-of-4 coverage displays, a real local text download and mobile layout.


## Four-beat recording count-in and responsive practice transport (2026-11-12)

- Starting **Record & follow guide** now gives an exact **four quarter-note count-in at the selected BPM**. No performance recording starts during the count-in. The same event loop starts the existing local recorder and the first 4/4 practice bar on the downbeat after count-in. An early stop/cancel leaves the recorder idle. A manually started independent studio recording during count-in cancels the pending guide instead of inventing an aligned score.
- Live beat position and bar position use monotonic \`performance.now()\` with math in \`src/lib/practiceTiming.mjs\`; they do not drift by summing \`setInterval\` callbacks. Both the top guide and the sticky keyboard-area HUD show **current count / active beat dots / bar and chord**, while a mobile-friendly **Stop & review** control calls the real recorder stop button.
- Optional, user-controllable **Soft beat clicks** synthesize a lightweight Web Audio tick with a scheduled ~120 ms lookahead, accented first beat. These clicks are a separate practice aid and are never inserted into MIDI or note-generated performance video. If Web Audio is unavailable the visual guide remains usable. The independent standalone metronome is unchanged.
- On manual bar changes, guide restart/stop, background-tab transitions and aborted countdowns, timers and future click scheduling are cancelled. A changed live guide invalidates the timed note-based coverage report instead of presenting misleading results.
- Unit tests verify count-in boundaries at 50–180 BPM, bar/beat transitions and invalid clock arguments. Real Chromium tests check count-in starts without recording, cancel is safe, recorder starts on the downbeat, sticky HUD works on 390px mobile, and old 3/4-bar score and MIDI export remain functional. On physical phones, browser audio unlock/latency and OS-specific scrolling still require separate manual tests.


## Mobile multi-touch glide & video overlay (2026-11-12)

- Virtual Piano defaults to Scroll keys so horizontal gestures still navigate all 88 keys. Users can explicitly select Glide to play. In that mode, CSS disables native panning over the keys; the initial key holds pointer capture while DOM coordinate hit-testing tracks the actual touch location during moves. Each pointerId has its own note source, so two fingers can play and slide independently. Pointer release, cancellation, capture loss, window blur and switching modes release outstanding notes; Sustain remains independent.
- The studio has an on-by-default optional chord and target overlay toggle. The original 720×1280 renderer labels Played chords exclusively from recorded note overlaps, and TARGET exclusively from the guide progression and BPM; it never claims that a target chord was actually played or professionally grades performance. Guideless recordings only show locally detected chords. No server or microphone is involved. Preview canvas, local WebM export and H.264/AAC conversion use the same renderer.
- Guide metadata attaches only to recordings started by Record & follow guide. Manual changing/stopping/restarting the practice guide invalidates the timed report and suppresses the guided video target metadata. Ordinary solo recordings remain unchanged.
- Unit tests cover no chord, real Dm7 vs target G7, guide bar/beat progress, invalid metadata and caption visibility toggles. Browser tests exercise captured pointer gestures and Chromium emulated two-touch contacts, return-to-scroll mode and note release. Physical iOS and Android finger latency and actual social uploads remain separate, unverified checks.
