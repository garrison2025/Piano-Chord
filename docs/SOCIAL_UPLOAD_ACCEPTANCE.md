# Piano Chord — remaining physical-device and social upload acceptance

Last updated: 2026-11-12. This is a manual validation checklist; do not mark any case complete without recorded evidence.

## iPhone Safari (actual device)

1. Open https://piano-chord.pages.dev/tools/virtual-piano/ in Safari on an iPhone. Keep the screen awake.
2. Tap **Start recording**, play multiple keys using one/two fingers, then stop after 10–20 seconds.
3. Check replay and MIDI download; export 9:16 video. Record whether Safari produces native MP4 or WebM.
4. Preview with sound; verify true duration, no frozen picture or clipped notes, and test Files/Photos export where supported.
5. If WebM is produced, attempt local MP4 conversion once. Note any ~30MB WASM download, time and memory errors. Falling back to saved WebM is acceptable only when clearly disclosed.
6. Use the system share sheet where offered; confirm successful local file handoff. Do not assume successful TikTok publication from share-sheet closure.

## Android Chrome (actual device)

Repeat the steps above, including a 30–60-second recording, browser background/foreground behavior, MP4 conversion if required, video playback and share to another app. Record model, Android/Chrome versions, free memory and whether the browser keeps the tab alive.

## Platform upload acceptance (user-operated)

For TikTok and X, choose an **original, self-recorded** short performance. Export 24-FPS H.264/AAC MP4, save it and upload it directly in the app/website. Use a private/draft option if available; inspect the platform preview and audio. Confirm accepted container, 9:16 composition, playable audio, frame timing and the actual post/draft state. YouTube Shorts can be checked separately.

Never claim upload success from file encoding tests, navigator.share resolution, or a draft-preview screen alone. The site currently does not require social account connections, upload user media to its servers or post automatically.

## Current evidence and open issues

- PASS: Chromium desktop, real WASM MP4 for short, ~60s and full ~90s takes; 24 FPS, H.264/AAC, 540×960, consistent track start times.
- PASS: Chromium **emulated** 390px mobile touch recording, export and share fallback.
- OPEN: actual iPhone Safari.
- OPEN: actual Android Chrome and constrained-memory devices.
- OPEN: TikTok, X and YouTube Shorts account-side uploads.
- NONBLOCKING: original WebM still has a Matroska warning under ffprobe; use verified MP4 for platform upload.

Evidence: [90-second GitHub Actions run](https://github.com/garrison2025/Piano-Chord/actions/runs/43125583010), artifact `piano-stress-diagnostics`.
