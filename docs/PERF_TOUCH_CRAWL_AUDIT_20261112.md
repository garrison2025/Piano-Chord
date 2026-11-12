# Piano Chord Explorer — Performance, Touch & Crawl Readiness

Date: 2026-11-12.
Scope: GitHub main static Astro build and Chromium on a local HTTP server. No claim of Cloudflare production deployment, physical Safari/Android testing, real-user Core Web Vitals or Google indexing.

## Repairs

1. Initial JS: The shared BaseLayout previously requested the generic chord finder/atlas client on the Virtual Piano page, even though Virtual Piano owns its controls. The layout now dynamically imports the shared client only outside that page. Browser tests assert the unused client JS is absent from piano first-load resources.
2. Glide through gaps: A held touch pointer can briefly leave the keybed without permanently losing its contact. Returning to a key triggers its note; lifting, cancellation or loss of capture releases the contact. Scroll mode remains default, with glide opt-in.
3. Background sound safety: In addition to pagehide and window blur, a hidden document releases sounding notes, clears the momentary space sustain and prevents mobile tabs from leaving stuck synth voices.
4. Polyphony: Each synth note uses three oscillators. Unlimited 88-note sustain could accumulate 264 oscillator nodes. The new 24-note simultaneous cap limits this to at most 72 active oscillator nodes. Prefer evicting the oldest unheld/sustained note; if all are held, release the oldest. All 88 individual keys remain playable; the limit is stated in the piano footer. Unsupported Web Audio no longer leaves a pressed key.
5. Crawl checks: The build validator compares 43 actual sitemap HTML locations to exact canonical URLs, checks uniqueness, verifies robots.txt references the same absolute sitemap origin and allows public learning pages, checks noindex on 404 where generated, and retains existing internal-link and image-sitemap validation.

## Initial JavaScript measurement

From the GitHub Actions Chromium test for commit 1d0d0d8b, served by Python HTTP on 127.0.0.1, browser-requested JavaScript filenames were mapped back to their built files in dist:

- 11 initial JavaScript resources, 65 KiB combined uncompressed size (rounded).
- Unused shared chord-atlas client JavaScript was not requested on Virtual Piano.
- Optional FFmpeg core was not fetched before any user video-conversion request.

This is neither a production wire-transfer size nor a Lighthouse/PageSpeed/CWV score. The local Python server did not expose useful encodedBodySize values, so sizes are calculated using on-disk build artifacts. Production Brotli, caching, real network latency, CPU and LCP/INP/CLS remain unmeasured.

## Verification boundaries

- Node unit tests cover deterministic preferential eviction and the 24-voice polyphony limit.
- Headless Chromium E2E exercises key C4/D4 glides, out-of-keyboard re-entry, source release during background visibilitychange, default touch scroll restoration, and two simultaneous emulated mobile touch contacts.
- A further browser regression initiates 35 distinct note contacts and asserts no more than 24 sounding/pressed keys, then releases all contacts and checks no stuck key.
- Existing real FFmpeg WASM video E2E passed after the sound-voice cap was introduced (commit 0abaadca); video expansion remains out of scope.

## Production / search next gates

- Canonical host remains the preview piano-chord.pages.dev until PUBLIC_SITE_URL is configured for a verified custom domain. Once bound, rebuild and independently inspect the live canonical, robots.txt, sitemap.xml and redirects before submitting GSC sitemap.
- The verified 43 static HTML URLs are not evidence of Google indexing, rankings, impressions or clicks. Compare page groups with GSC after deployment and real crawl.
- Physical Android/iOS testing and real-user performance metrics must still be done; Chromium mobile emulation alone does not prove hardware reliability.
