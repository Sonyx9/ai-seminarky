// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// SITE_ENV=staging → GitHub Pages pod /ai-seminarky/, noindex, robots Disallow.
// SITE_ENV=production (výchozí při `astro build`) → ostrá doména, indexace povolena.
const env = process.env.SITE_ENV === 'staging' ? 'staging' : 'production';
const site = env === 'staging'
  ? (process.env.STAGING_SITE || 'https://sonyx9.github.io')
  : (process.env.PROD_SITE || 'https://example.cz');
// PREVIEW_BASE = lokální náhled z file:// (jen pro vizuální kontrolu, nikdy do deploye)
const base = process.env.PREVIEW_BASE || (env === 'staging' ? (process.env.STAGING_BASE || '/ai-seminarky') : '/');

export default defineConfig({
  site,
  base,
  outDir: process.env.PREVIEW_BASE ? 'preview-local' : 'dist',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !/\/(dekujeme|404)\/?$/.test(page) })],
  build: { format: 'directory' },
  vite: {
    plugins: [tailwindcss()],
    define: { 'import.meta.env.SITE_ENV': JSON.stringify(env) },
  },
});
