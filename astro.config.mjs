import { defineConfig } from 'astro/config';

// Configure PUBLIC_SITE_URL in Cloudflare Pages before production indexing.
// The fallback is a proposed preview hostname and is NOT proof of deployment.
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://piano-chord.pages.dev',
  output: 'static',
  trailingSlash: 'always',
});
