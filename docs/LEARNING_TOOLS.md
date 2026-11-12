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
