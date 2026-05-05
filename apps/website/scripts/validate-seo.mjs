#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const distDir = new URL('../dist/', import.meta.url);
const routes = ['/', '/pt', '/en', '/es', '/ja', '/zh'];
const hreflangs = ['pt-BR', 'en', 'es', 'ja', 'zh-CN', 'x-default'];
const siteUrl = (process.env.VITE_PUBLIC_SITE_URL || 'https://raiznet.arateki.com').replace(/\/+$/, '');

const routeFile = (routePath) => {
  if (routePath === '/') return new URL('index.html', distDir);
  return new URL(`${routePath.replace(/^\/+/, '')}/index.html`, distDir);
};

const count = (source, pattern) => (source.match(pattern) || []).length;
const errors = [];

for (const routePath of routes) {
  const file = routeFile(routePath);
  let html = '';

  try {
    html = await readFile(file, 'utf8');
  } catch {
    errors.push(`missing prerendered HTML for ${routePath}`);
    continue;
  }

  if (count(html, /<title\b/g) !== 1) errors.push(`${routePath}: expected exactly one title`);
  if (count(html, /name="description"/g) !== 1) errors.push(`${routePath}: expected exactly one description`);
  if (count(html, /rel="canonical"/g) !== 1) errors.push(`${routePath}: expected exactly one canonical`);
  if (!html.includes('property="og:title"')) errors.push(`${routePath}: missing Open Graph title`);
  if (!html.includes('name="twitter:card"')) errors.push(`${routePath}: missing Twitter card`);
  if (!html.includes('type="application/ld+json"')) errors.push(`${routePath}: missing JSON-LD`);
  if (!html.includes('Raiznet')) errors.push(`${routePath}: missing useful body text`);

  for (const hreflang of hreflangs) {
    if (!html.includes(`hreflang="${hreflang}"`)) errors.push(`${routePath}: missing hreflang ${hreflang}`);
  }
}

for (const filename of ['robots.txt', 'sitemap.xml', 'og-image.svg', 'manifest.webmanifest', 'favicon.svg']) {
  try {
    await access(join(distDir.pathname, filename));
  } catch {
    errors.push(`missing ${filename}`);
  }
}

const robots = await readFile(new URL('robots.txt', distDir), 'utf8').catch(() => '');
if (!robots.includes('Allow: /')) errors.push('robots.txt does not allow public pages');
if (robots.includes('Disallow: /pt') || robots.includes('Disallow: /en')) errors.push('robots.txt blocks language routes');

const sitemap = await readFile(new URL('sitemap.xml', distDir), 'utf8').catch(() => '');
for (const routePath of routes) {
  if (!sitemap.includes(routePath === '/' ? `<loc>${siteUrl}/</loc>` : `${siteUrl}${routePath}`)) {
    errors.push(`sitemap.xml missing ${routePath}`);
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`SEO validation passed for ${routes.length} routes.`);
