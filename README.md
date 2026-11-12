# Piano Chord Explorer

A static, accessible piano chord learning site built with Astro. This is the implementation of the V1.3 SEO-first feasibility plan: 29 individually authored chord detail pages (12 major, 12 minor and five selected sevenths), alongside practical learning tools. No database, account, audio API or paid AI service required.

## Run

```bash
npm install
npm run test
npm run dev
npm run build
```

Cloudflare Pages: connect `garrison2025/Piano-Chord`; build command `npm run build`; output directory `dist`; Node 22 or later. Set `PUBLIC_SITE_URL` to the *actual* canonical HTTPS origin before publishing or submitting the sitemap. The fallback `https://piano-chord.pages.dev` is an unverified proposed project hostname, not an assertion that deployment exists.

## What's included

- 29 statically prerendered chord detail pages, a browseable chord index and a practical learning guide.
- Browser-first chord finder, inversion explorer and chord comparison (no remote processing).
- Original keyboard diagrams as stable indexable SVG images; accessible note lists and print-friendly reference chart.
- Browser Web Audio polyphonic sine/triangle synth, activated only by explicit user interaction, with Stop control.
- Semantic HTML, unique canonical URLs, sitemap, robots, breadcrumbs, meta description, mobile and print layouts.
- Deterministic spelled-note logic that preserves `C#–E#–G#`, `G#–B#–D#–F##`, seventh chord differences, and bass motion of inversions.

## Evidence and roadmap

Research used user-provided Semrush US exports (1,600 positions, 1,142 normalized keywords) and the V1.3 Pages report. Competitor traffic is **not** this site's forecast. See `docs/IMPLEMENTATION.md` for exact phase scope and release gates. Additional 49 SEO candidates are *not* automatically published.

## Release gates

1. `npm run check` green in GitHub Actions.
2. Verify actual mobile and desktop pages, audio controls, and A4/Letter paper print.
3. Verify deployed canonical origin, 43 intentional HTML URLs, 29 SVG images, robots and sitemap over HTTP 200.
4. Submit sitemap to Search Console after the final domain is configured; inspect real indexing and image impressions before expansion.

No ads or analytics are loaded without explicit deployment configuration. Music notation examples are original and contain no third-party sheet music or recordings.
