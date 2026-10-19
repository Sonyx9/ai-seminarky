import type { APIRoute } from 'astro';
// Staging: zákaz indexace (GitHub Pages neumí hlavičky). Produkce: povolit + sitemap.
export const GET: APIRoute = ({ site }) => {
  const staging = import.meta.env.SITE_ENV === 'staging';
  const body = staging
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /dekujeme/\n\nSitemap: ${new URL('sitemap-index.xml', site).href}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
