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


## Real ffmpeg.wasm browser E2E verification — 2026-11-12

- GitHub Actions [Video E2E (real FFmpeg WASM)](https://github.com/garrison2025/Piano-Chord/actions/runs/43122286959) completed **successfully** using actual Chromium and the downloaded FFmpeg WebAssembly core, not mocked encoder code.
- The automated end-to-end flow presses one piano key, records a synthetic performance, exports WebM, converts in the browser using the real WASM engine, downloads both formats, and runs `ffprobe` on the converted MP4.
- An independently inspected run artifact contains a **H.264 video + AAC audio** MP4, **540×960**, container duration **3.855011 seconds**; both MP4 tracks start at 0.000 seconds.
- The original WebM contains VP9 video and Opus audio; its container duration is **3.836 seconds**, with track start times 0.000s (video) and 0.014s (audio). FFprobe emits a nonfatal Matroska unknown-sized-element warning for this WebM; retaining the optional MP4 conversion remains prudent.
- These measurements verify short recordings on headless desktop Chromium. They do **not** prove exact note-animation perceptual sync, 90-second performance under load, iPhone Safari/Android compatibility, or successful TikTok/X uploads. Those items remain separate acceptance gates.
- The checked-in test is `scripts/browser-video-e2e.mjs`; the dedicated workflow `.github/workflows/video-browser-e2e.yml` runs on relevant changes or manually. The generated test videos contain only synthetic notes and no user recordings.


## 60-second stress and emulated-mobile results (2026-11-12)

- Source commit [29086e5](https://github.com/garrison2025/Piano-Chord/commit/29086e5469e951ddaacf73d9eb9d404579c0fddb); real-WASM run [43124171170](https://github.com/garrison2025/Piano-Chord/actions/runs/43124171170) concluded **success**.
- Automated Chromium desktop test played dozens of synthetic notes for approximately 60 seconds, generated VP9/Opus WebM, and converted it using the *actual browser FFmpeg WASM engine* to H.264/AAC MP4.
- Independent `ffprobe` on the saved artifact: WebM **61.660 s** (720x1280; video start 0.000 s, audio start 0.004 s), MP4 **61.621995 s** (540x960; video and audio both start 0.000 s).
- The WebM still produces a nonfatal Matroska 'unknown-sized element' warning despite its valid container duration; MP4 is the preferred upload deliverable.
- The same workflow successfully executed **390px Chromium touch/mobile emulation**, checked page horizontal overflow, recorded tapped keys, downloaded audio-bearing WebM/MP4, and exercised the unavailable-file-sharing fallback. This is *not* a real Android device and cannot establish iOS Safari compatibility.
- Original performance, converted MP4 and mobile screenshot are in the GitHub run's `piano-stress-diagnostics` artifact.
- The independent test's `PIANO_STRESS_SECONDS` variable also supports a 90-second capture. Upload acceptance on TikTok/X and physical-device verification remain open.


## Social upload encoding correction — 2026-11-12

TikTok's [official media transfer guide](https://developers.tiktok.com/docs/en/content-posting-api-media-transfer-guide) specifies **23–60 FPS**. The old 20 FPS MP4 conversion setting did not meet that documented minimum, even though it produced valid H.264/AAC files. The conversion profile is now **24 FPS (matching the source Canvas capture), 540x960, H.264 / yuv420p, AAC 128 kbps**. CRF was improved to 25 for more legible key animations. Automated tests enforce this profile; file upload remains a separate manual acceptance gate. The [X Media Studio guide](https://help.x.com/en/using-x/media-studio-faqs) recommends H.264 video with AAC audio.


## Current verified release gate: 24 FPS, 90-second performance (2026-11-12)

- Implementation: [24 FPS correction](https://github.com/garrison2025/Piano-Chord/commit/06d0038263f38e61623ae0214940365b15e8096c); [real MP4 FPS assertion](https://github.com/garrison2025/Piano-Chord/commit/8cb4dda36d3cd7b6dc1cbb81e56c0b1208d6c89e).
- Real-browser 90-second stress and Chromium mobile-emulation run: [GitHub Actions 43125583010](https://github.com/garrison2025/Piano-Chord/actions/runs/43125583010) — **SUCCESS**. Its `piano-stress-diagnostics` artifact contains both original/converted videos and a 390px mobile interaction screenshot. This supersedes the historical 20 FPS test data in earlier sections.
- Independently inspected 90-second **MP4**: **91.329002 s**, **540×960**, constant **24 FPS**, **H.264 video**, **AAC audio**, both tracks begin at **0.000 s**, file size **2,419,156 bytes**.
- Corresponding **WebM**: **91.344 s**, **720×1280**, **VP9 + Opus**; Matroska reports a nonfatal unknown-sized-element warning even though duration is readable.
- The MP4 encoder **requests** 128 kbps AAC; actual average bitrate can be lower for sparse piano notes/silence. Do not misstate the requested bitrate as a measured file property.
- The 390px **Chromium mobile-emulation** flow and 90-second **desktop Chromium** flow passed; neither is evidence of a successful recording on actual iPhone Safari or Android hardware.
- TikTok developer's [media transfer guide](https://developers.tiktok.com/docs/en/content-posting-api-media-transfer-guide) documents 23–60 FPS and MP4/H.264 compatibility. The verified 24-FPS MP4 now satisfies those documented format parameters. X Media Studio's [media requirements](https://help.x.com/en/using-x/media-studio-faqs) recommend MP4/H.264/AAC, but the guide applies specifically to Media Studio.
- No real upload to TikTok/X/Shorts or real device share-sheet acceptance has been verified. No social-account tokens, uploads, databases or paid transcode server were added.

The latest release is ready for physical-device/user-operated upload acceptance tests, **not** for claiming guaranteed cross-platform social publishing.
