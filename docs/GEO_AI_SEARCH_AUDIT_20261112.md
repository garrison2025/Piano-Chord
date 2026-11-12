# Piano Chord Explorer — GEO / AI Search Optimization Acceptance

Date: 2026-11-12. Scope: live https://piano-chord.pages.dev/, GitHub main built Astro pages, 29 note-accurate published lessons, and standard search crawler controls. This is **not** evidence that a third-party AI has cited the site or that Google indexed any page.

## Strategy and authoritative boundaries

- Google Search Central, "AI features and your website" and 2026 "Optimizing for generative AI": ordinary crawlability, search indexing, relevant original human-readable answers, helpful content and verifiable on-page structure remain the foundations of appearance in AI Overviews and AI Mode. No special GEO markup is required. Google explicitly says it ignores llms.txt and does not treat artificial "chunking" or manufactured mentions as ranking improvements.
  - https://developers.google.com/search/docs/appearance/ai-features
  - https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Bing Webmaster Guidelines emphasize crawlability, verifiable factual content, useful original pages and coherent metadata for Bing/Copilot grounding and citations.
  - https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a
- OpenAI publisher guidance: sites can be eligible for ChatGPT search when they permit OAI-SearchBot and hosting/CDN firewalls allow the bot's published IPs. A wildcard Allow in robots.txt currently permits public pages, but does not prove Cloudflare WAF allows all bot traffic.
  - https://help.openai.com/en/articles/9237897-chatgpt-search
  - https://help.openai.com/en/articles/12627856-publishers-and-developers-faq

## Implemented

1. **29 chord answers**. Human-readable, crawlable, server-generated chord-note answers, exact pitch spellings and root/first/second/third inversion descriptions, computed from the site's tested chord formula engine, not dynamically invented by a user-facing model. For example, B minor is B–D–F♯; C7 is C–E–G–B♭, unlike Cmaj7's B natural. Dedicated content remains accessible without executing client JavaScript.
2. **Accurate question-led homepage content**. A coherent definition of a piano chord and three distinctly useful original answers about C major notes, B minor to D major shared-tone motion, and C7 versus Cmaj7, each linked to the most relevant full lesson or interactive comparison. This does not create new indexable URLs.
3. **Reliable schema descriptions**. Each chord lesson includes WebPage JSON-LD with a DefinedTerm subject derived from actual notes and visible text; inherited BreadcrumbList continues to describe the real navigational trail, not fake rankings, reviews or credentials. Structured data is an ordinary descriptive aid, not a claimed AI-result feature.
4. **Source transparency**. About explains the actual interval and diatonic-spelling algorithms and original SVG diagrams, how automated theory tests work, and what still requires human musical interpretation. Independently accessible Open Music Theory reference is linked for further reading, clearly without endorsement claims.
5. **Theory accuracy**. The C major to A minor hand-motion exercise now distinguishes the voicing produced by moving G to A from A minor root position with A in the bass. A unit test guards against the previous erroneous "A minor inversion" claim.
6. **No artificial GEO shortcuts**. No fabricated musician author biography, no fake cited statistics, no automatic generated "references", no unsupported FAQ rich-result schema and no extra thin SEO pages or special crawler-only content. This maintains 44 canonical public HTML URLs (29 individual chord lessons), a separate noindex privacy page, and 29 original chord SVG diagrams.

## Verified

- GitHub CI success on 59342ee2: 44 unique titles/descriptions, 44 canonical indexable HTML pages, 0 orphan indexable pages, JSON-LD syntactically valid, local images and links present, robots and sitemap consistent. Correct theory and quick-answer tests also run in Node.
- Chromium learning browser E2E success on 59342ee2: homepage human-readable questions, C major/C7 visible chord answers, original lesson navigation and About methodology, with all existing tool/recording/mobile checks intact.
- Public Cloudflare site independently retrieved current homepage question text, B minor and C major quick-answer and inversion blocks, About source/methodology and wildcard-allowed robots.txt. Live canonical host remains piano-chord.pages.dev, not a verified final custom domain.
- The previously deployed 120-chord interactive atlas and the 29 separately authored lessons are distinct. Keeping that boundary prevents unsubstantiated mass SEO page expansion.

## What remains outside this source-code fix

| Priority | Verification task | Explicit limitation |
|---|---|---|
| P0 | Final domain, PUBLIC_SITE_URL, Cloudflare redirects | Preview pages.dev canonical is not an authoritative custom-domain migration |
| P0 | Google GSC indexing and new generative-AI metrics where available | Static HTML being crawlable does not prove indexed status or AI Overviews/AI Mode citation |
| P0 | Verify OAI-SearchBot/Bingbot/Googlebot access in live CDN/firewall logs | Robots Allow / is necessary but does not prove firewall access; published bot IPs should not be blocked |
| P1 | Measure actual ChatGPT/Copilot search citation and traffic referral | No guaranteed placement; referrals can be tagged/attributed in analytics but require actual measurements |
| P1 | Crawl all canonical pages in a truly independent live browser after binding the domain | CI cannot prove all production routes remain healthy indefinitely |
| P2 | Teacher/musician editorial review of full 29 lessons | Tests verify note and chord logic but are not professional music pedagogy accreditation |

No database, server, paid API, AI-inference endpoint or subscription was added for these changes. All work remains compatible with static Cloudflare Pages hosting.

## Post-launch measurement

Check the 16 V1.3 Semrush-prioritized pages first (Bm, B♭, Dm, C, Em, B, Gm, E♭, E, D, Am, G, Fm, C7, Cm, F). Compare actual Google Web impressions, clicks, CTR and indexed canonical with AI-feature visibility if the relevant Search Console reporting is available; also inspect referrals from AI search separately. Do not extrapolate competitor estimates to the new site's traffic.
