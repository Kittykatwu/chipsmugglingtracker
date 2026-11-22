import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL: the public address once you have a domain (placeholder until then).
// BASE_PATH: only needed for GitHub Pages project sites, e.g. "/ai-chip-tracker".
const site = process.env.SITE_URL || 'https://chipsmugglingtracker.org';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
});
