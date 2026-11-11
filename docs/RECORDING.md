# Piano performance recorder (local-first)

New features: record real note-on/note-off events (up to 90 seconds); replay with the existing synth; export Type 0 MIDI; render a 720x1280 animated piano-roll video with browser-generated audio using canvas.captureStream and MediaRecorder. Browser chooses MP4 (H.264/AAC) when supported, otherwise WebM. Videos are created locally; download and upload manually to TikTok/X, or share through an OS share sheet if the browser supports local files. No account, upload, database, storage or paid API.

Privacy: do not persist recordings, capture microphones, or pre-enable social posting. Export defaults to no promotional watermark or branding. Files vanish when the tab is closed unless saved.

Compatibility: video recording requires Canvas captureStream, WebAudio and MediaRecorder, and MP4 is not universally available. Unsupported browsers retain MIDI export. Keep the tab visible while rendering; capture is realtime, may use significant battery/CPU and memory. Test on Safari/iOS and Android, including orientation, audio/video synchronization and file sharing.

Tests: `node --test tests/recording.test.js`, then GitHub Actions `npm run check` builds Astro and checks routes.
