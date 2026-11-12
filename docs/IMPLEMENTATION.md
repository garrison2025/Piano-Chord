# V1.3 implementation and acceptance log

## Confirmed planning context
- Source: the user's Piano Chord Explorer feasibility plan V1.3 (2026-11-11), US Semrush Positions data and Pages screenshots.
- Competitor: `pianochord.org`, estimated US organic traffic 115.1K/month, Pages report 734 URLs, 720 estimated organic pages. Competitor metrics **do not** represent predicted traffic for this website.
- Scope: **16 reviewed SEO chord pages + 7 support pages**. Remaining 49 candidate pages are not automatically generated or indexed.
- Pages and Positions evidence must not be added together.

## Release URL inventory
- `/` interactive home
- `/chords/` searchable 16-chord index
- `/chords/{slug}/` 16 reviewed detail pages in `src/data/chords.js`
- `/tools/chord-finder/` pitch-class matching for major, minor, diminished, augmented and seventh formulas
- `/tools/inversion-explorer/` true inversion bass motion
- `/tools/chord-compare/` shared-pitch-class comparison and audio
- `/printables/piano-chord-chart/` print-friendly 16-chord sheet and browser Save as PDF
- `/guides/how-to-read-piano-chords/` original beginner guide
- `/diagrams/{slug}.svg` 16 original stable SVG images
- `/robots.txt` and `/sitemap.xml` per configured production origin

## Music-theory corrections
- `C7` (`C E G Bb`) and `Cmaj7` (`C E G B`) never merged.
- `C# major` spells `C# E# G#` (not `F`).
- `G#maj7` spells `G# B# D# F##`, including double sharp.
- `Bm/D` has D bass; `C7/Bb` has Bb bass.
- Finger numbers deliberately not invented.

## SEO and delivery gates
- Dynamic tool queries remain on static canonical pages; no mass indexation of arbitrary parameters.
- Core SEO content rendered in HTML before JavaScript; image assets use `<img src>` and descriptive alt text.
- Responsive keyboard and audio controls require direct gestures, no autoplay, a stop function, and keyboard-operable buttons.
- Printing uses browser native A4/Letter dialog; no separately implemented PDF renderer is claimed.
- **Before public indexing:** set `PUBLIC_SITE_URL` to the verified final live origin; inspect 23 static canonical URLs, 16 SVGs, robots, sitemap and actual HTTP status.
- **Before claiming deployed:** independently check Cloudflare Pages, HTTPS, browser usability, sound and physical printing.
- Initial site includes no ads, trackers, accounts, database or paid API.

## Release steps
- G1: GitHub Actions install, automated music tests, static Astro build.
- G2: browser functional / mobile / accessibility / print verification.
- G3: deployment, canonical domain and Search Console verification.
- G4: days 30/60/90/180 GSC review; expand only where new content adds unique value.

## 2026-11-12: complete 12 major + 12 minor triad lessons

Added nine specifically authored lesson pages to the original 16: D-flat major, G-flat major, A-flat major, A major, C-sharp minor, E-flat minor, F-sharp minor, G-sharp minor and B-flat minor. Totals: 12 major, 12 minor, plus C7 = **25 detailed chord lessons**; the broader 120-chord interactive catalogue is unchanged. Every lesson renders three inversions, audio, a stable SVG image and chord-specific practice, contrast, character and spelling pitfall paragraphs. Build inventory: 38 canonical HTML pages and 25 SVG chord diagrams. The original 16-chord beginner printable remains 16 by design; it does not silently grow to 25 and break its paper layout. New pages are original coverage additions, **not individually validated using live Semrush traffic data**; traffic impact must be assessed with GSC after indexing. Avoid claims of verified SEO demand or actual rankings.
