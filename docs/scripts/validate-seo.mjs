#!/usr/bin/env node
// Validação do HTML do VitePress (roda no build, falha se o SEO regredir).
// PT vive na raiz de /docs/; en/es/ja/zh têm prefixo; /docs/pt não existe.
import { readFile } from 'node:fs/promises'

const distDir = new URL('../.vitepress/dist/', import.meta.url)
const siteUrl = (process.env.VITE_PUBLIC_SITE_URL || 'https://raiznet.com').replace(/\/+$/, '')

// Amostra de rotas por locale (uma raiz + uma página interna por idioma ativo).
const routes = [
  { file: 'index.html', canonical: `${siteUrl}/docs/` },
  { file: 'guide/introduction.html', canonical: `${siteUrl}/docs/guide/introduction` },
  { file: 'en/index.html', canonical: `${siteUrl}/docs/en/` },
  { file: 'en/guide/introduction.html', canonical: `${siteUrl}/docs/en/guide/introduction` },
  { file: 'es/index.html', canonical: `${siteUrl}/docs/es/` },
  { file: 'es/guide/introduction.html', canonical: `${siteUrl}/docs/es/guide/introduction` },
  { file: 'ja/index.html', canonical: `${siteUrl}/docs/ja/` },
  { file: 'ja/guide/introduction.html', canonical: `${siteUrl}/docs/ja/guide/introduction` },
  { file: 'zh/index.html', canonical: `${siteUrl}/docs/zh/` },
  { file: 'zh/guide/introduction.html', canonical: `${siteUrl}/docs/zh/guide/introduction` },
]
const requiredHreflangs = ['pt-BR', 'en', 'es', 'ja', 'zh-CN', 'x-default'] // todos os 5 ativos

const count = (s, re) => (s.match(re) || []).length
const errors = []

for (const route of routes) {
  let html = ''
  try {
    html = await readFile(new URL(route.file, distDir), 'utf8')
  } catch {
    errors.push(`missing built HTML for ${route.file}`)
    continue
  }
  if (count(html, /<title\b/g) !== 1) errors.push(`${route.file}: expected one <title>`)
  if (count(html, /name="description"/g) < 1) errors.push(`${route.file}: missing description`)
  if (count(html, /rel="canonical"/g) !== 1) errors.push(`${route.file}: expected one canonical`)
  if (!html.includes(`rel="canonical" href="${route.canonical}"`)) {
    errors.push(`${route.file}: canonical must be ${route.canonical}`)
  }
  for (const hl of requiredHreflangs) {
    if (!html.includes(`hreflang="${hl}"`)) errors.push(`${route.file}: missing hreflang ${hl}`)
  }
  // x-default e pt-BR apontam para a raiz (sem prefixo de idioma).
  if (!html.includes(`hreflang="x-default" href="${siteUrl}/docs/`)) {
    errors.push(`${route.file}: x-default must point under ${siteUrl}/docs/`)
  }
  if (html.includes(`${siteUrl}/docs/pt/`)) errors.push(`${route.file}: must not contain /docs/pt/ URLs`)
  if (!html.includes('property="og:image" content="' + siteUrl + '/docs/og-image.png"')) {
    errors.push(`${route.file}: og:image must be the PNG`)
  }
  if (!html.includes('name="twitter:card"')) errors.push(`${route.file}: missing twitter:card`)
  if (!html.includes('application/ld+json')) errors.push(`${route.file}: missing JSON-LD`)
}

// Sitemap não deve conter o prefixo do idioma padrão.
try {
  const sitemap = await readFile(new URL('sitemap.xml', distDir), 'utf8')
  if (sitemap.includes('/docs/pt/')) errors.push('sitemap.xml: must not contain /docs/pt/')
} catch {
  errors.push('sitemap.xml missing')
}

if (errors.length) {
  console.error('SEO validation failed:\n' + errors.map((e) => `  - ${e}`).join('\n'))
  process.exit(1)
}
console.log('SEO validation passed.')
