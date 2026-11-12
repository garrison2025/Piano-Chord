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
