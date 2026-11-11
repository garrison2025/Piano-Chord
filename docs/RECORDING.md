# Piano performance recorder (local-first)

New features: record real note-on/note-off events (up to 90 seconds); replay with the existing synth; export Type 0 MIDI; render a 720x1280 animated piano-roll video with browser-generated audio using canvas.captureStream and MediaRecorder. Browser chooses MP4 (H.264/AAC) when supported, otherwise WebM. Videos are created locally; download and upload manually to TikTok/X, or share through an OS share sheet if the browser supports local files. No account, upload, database, storage or paid API.

Privacy: do not persist recordings, capture microphones, or pre-enable social posting. Export defaults to no promotional watermark or branding. Files vanish when the tab is closed unless saved.

Compatibility: video recording requires Canvas captureStream, WebAudio and MediaRecorder, and MP4 is not universally available. Unsupported browsers retain MIDI export. Keep the tab visible while rendering; capture is realtime, may use significant battery/CPU and memory. Test on Safari/iOS and Android, including orientation, audio/video synchronization and file sharing.

Tests: `node --test tests/recording.test.js`, then GitHub Actions `npm run check` builds Astro and checks routes.

## Codec compatibility and verified limitation

Do **not** label a file as social-ready MP4 merely because the browser accepts bare `video/mp4`. Chromium can output VP9/Opus in an MP4 container. The recorder now requires explicit H.264/AAC MIME support before selecting MP4 and otherwise exports correctly labelled WebM. Some TikTok/X apps will not accept WebM; users can convert locally with a compatible media encoder or try a browser providing H.264/AAC recording. File upload remains manual.

Local Chromium smoke test (2026-11-12): record, replay, Standard MIDI download, 720×1280 WebM export with VP9 video and Opus audio tracks completed. iOS Safari and Android physical-device tests, actual social upload and per-browser MP4 codec verification are outstanding.

## Local MP4 conversion (2026-11-12)
WebM downloads are passed through \`@fix-webm-duration/fix\` to repair omitted Matroska Duration metadata. On browsers that support native H.264/AAC recording, explicit MediaRecorder codecs remain the preferred path. Otherwise a user can opt into local FFmpeg WebAssembly conversion after recording.
- @ffmpeg/ffmpeg 0.12.15 and @ffmpeg/util 0.12.2 are MIT.
- The single-thread @ffmpeg/core 0.12.10 is downloaded on demand from jsDelivr (~30 MB) and is GPL-2.0-or-later, including libx264. Its source/build scripts are at https://github.com/ffmpegwasm/ffmpeg.wasm/tree/v12.15.
- The target is 540×960 H.264/AAC MP4, yuv420p, faststart. Conversion is local, with an explicit cancel operation; no recording is uploaded. GPU/memory limits make mobile support conditional.
- Unit tests validate the MP4 profile and reject VP9/Opus files mislabeled as MP4. An Astro build does not certify real-device codec compatibility; iOS Safari, Android and MP4 uploads still require field tests.

## Local export robustness improvements — 2026-11-12

- After successful MP4 conversion, the user can still download the unchanged source WebM via an independent button.
- Downloading the FFmpeg core and WebAssembly assets now uses an AbortController. Cancel immediately aborts the outstanding HTTP request; temporary object URLs are revoked when conversion ends.
- Audio synthesis begins scheduling after MediaRecorder starts, reducing the capture-origin offset in the timeline.
- Native MediaRecorder MP4 output is checked for actual AVC + AAC sample entries rather than trusting a MIME label alone.
- Validation: native FFmpeg converted a real short VP9/Opus WebM to 540×960 H.264/AAC MP4; a Chromium UI harness with simulated FFmpeg module verified download of source WebM and converted MP4 with no script errors. The browser's real ffmpeg.wasm binary, physical mobile devices, and social platform uploads remain to be validated.


## MP4 track-level verification hardening (2026-11-12)
The H.264/AAC checker now parses real MP4 video/audio track handlers and `stsd` codec entries. It no longer accepts an MP4 just because its metadata contains `avc1` or `mp4a` strings. Unit tests include false-positive metadata cases, malformed boxes, and real media samples were checked locally (H.264/AAC accepted; VP9/Opus rejected). This is structural validation only; decoding and TikTok/X uploadability are separate tests. Full real-browser ffmpeg.wasm encoding and iPhone/Android physical-device validation remain pending.
