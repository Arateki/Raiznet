#!/usr/bin/env node
// Validação do HTML prerenderizado (roda no build, falha o CI se o SEO regredir).
// Estratégia de idiomas: PT (padrão) vive na RAIZ; /en, /es, /ja, /zh têm
// prefixo; /pt não é URL canônica (redireciona/normaliza para /).
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const distDir = new URL('../dist/', import.meta.url);
const routes = ['/', '/en', '/es', '/ja', '/zh'];
const hreflangs = ['pt-BR', 'en', 'es', 'ja', 'zh-CN', 'x-default'];
const siteUrl = (process.env.VITE_PUBLIC_SITE_URL || 'https://raiznet.com').replace(/\/+$/, '');

const routeFile = (routePath) => {
  if (routePath === '/') return new URL('index.html', distDir);
  return new URL(`${routePath.replace(/^\/+/, '')}/index.html`, distDir);
};

const canonicalFor = (routePath) => (routePath === '/' ? `${siteUrl}/` : `${siteUrl}${routePath}`);

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
  if (!html.includes(`rel="canonical" href="${canonicalFor(routePath)}"`)) {
    errors.push(`${routePath}: canonical must be ${canonicalFor(routePath)}`);
  }
  if (!html.includes('property="og:title"')) errors.push(`${routePath}: missing Open Graph title`);
  if (!html.includes('property="og:image:width"')) errors.push(`${routePath}: missing og:image dimensions`);
  if (!html.includes('/og-image.png')) errors.push(`${routePath}: og:image must be the PNG (social networks do not render SVG)`);
  if (!html.includes('name="twitter:card"')) errors.push(`${routePath}: missing Twitter card`);
  if (!html.includes('type="application/ld+json"')) errors.push(`${routePath}: missing JSON-LD`);
  if (!html.includes('Raiznet')) errors.push(`${routePath}: missing useful body text`);

  for (const hreflang of hreflangs) {
    if (!html.includes(`hreflang="${hreflang}"`)) errors.push(`${routePath}: missing hreflang ${hreflang}`);
  }
  // PT padrão: tanto pt-BR quanto x-default apontam para a raiz do domínio.
  if (!html.includes(`hreflang="pt-BR" href="${siteUrl}/"`)) {
    errors.push(`${routePath}: hreflang pt-BR must point to the site root`);
  }
  if (!html.includes(`hreflang="x-default" href="${siteUrl}/"`)) {
    errors.push(`${routePath}: x-default must point to the site root (PT default)`);
  }
}

for (const filename of ['robots.txt', 'sitemap.xml', 'og-image.png', 'og-image.svg', 'manifest.webmanifest', 'favicon.svg']) {
  try {
    await access(join(distDir.pathname, filename));
  } catch {
    errors.push(`missing ${filename}`);
  }
}

const robots = await readFile(new URL('robots.txt', distDir), 'utf8').catch(() => '');
if (!robots.includes('Allow: /')) errors.push('robots.txt does not allow public pages');
if (robots.includes('Disallow: /en') || robots.includes('Disallow: /es')) errors.push('robots.txt blocks language routes');
if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) errors.push(`robots.txt sitemap must use ${siteUrl}`);

const sitemap = await readFile(new URL('sitemap.xml', distDir), 'utf8').catch(() => '');
for (const routePath of routes) {
  if (!sitemap.includes(`<loc>${canonicalFor(routePath)}</loc>`)) {
    errors.push(`sitemap.xml missing ${routePath}`);
  }
}
if (sitemap.includes(`${siteUrl}/pt`)) errors.push('sitemap.xml must not list /pt (PT canonical is the root)');

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`SEO validation passed for ${routes.length} routes (canonical host: ${siteUrl}).`);
