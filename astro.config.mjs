import { defineConfig } from 'astro/config';

// The owner has confirmed that the production domain is purchased and bound.
// Pin this origin for all production and preview builds: indexing, sitemap,
// structured data, Open Graph and canonical must not drift with environment vars.
export default defineConfig({
  site: 'https://pianochordexplorer.com',
  output: 'static',
  trailingSlash: 'always',
});
