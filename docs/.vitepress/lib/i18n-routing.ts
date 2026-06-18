// Espelha apps/website/src/lib/i18n-routing.js, adaptado ao base '/docs/' do
// VitePress. PT é o idioma padrão e vive na raiz de /docs/ (sem prefixo).
export const SUPPORTED_LANGS = ['pt', 'en', 'es', 'ja', 'zh'] as const
export type LangCode = (typeof SUPPORTED_LANGS)[number]
export const DEFAULT_LANG: LangCode = 'pt'
export const DOCS_BASE = '/docs/'

export const LANG_TO_LOCALE: Record<LangCode, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  ja: 'ja-JP',
  zh: 'zh-CN',
}

// HTML lang attribute / hreflang code (note: ja uses 'ja', not 'ja-JP').
export const HTML_LANG: Record<LangCode, string> = {
  pt: 'pt-BR',
  en: 'en',
  es: 'es',
  ja: 'ja',
  zh: 'zh-CN',
}

const LOCALE_TO_LANG: Record<string, LangCode> = Object.fromEntries(
  Object.entries(LANG_TO_LOCALE).map(([lang, locale]) => [locale, lang as LangCode]),
) as Record<string, LangCode>

export function isSupportedLang(lang: string): lang is LangCode {
  return (SUPPORTED_LANGS as readonly string[]).includes(lang)
}

export function langFromLocale(locale: string): LangCode {
  return LOCALE_TO_LANG[locale] ?? DEFAULT_LANG
}

export function localeFromLang(lang: LangCode): string {
  return LANG_TO_LOCALE[lang]
}

// Locale of a VitePress source path: 'en/guide/x.md' -> 'en', 'guide/x.md' -> 'pt'.
export function localeFromRelativePath(relativePath: string): LangCode {
  const first = relativePath.split('/')[0]
  if (first && isSupportedLang(first) && first !== DEFAULT_LANG) return first
  return DEFAULT_LANG
}

// Locale-agnostic site path (e.g. '/guide/x' or '/') -> docs URL path.
export function docsPath(lang: LangCode, sitePath: string): string {
  const clean = sitePath.startsWith('/') ? sitePath : `/${sitePath}`
  if (lang === DEFAULT_LANG) {
    return clean === '/' ? DOCS_BASE : `${DOCS_BASE.slice(0, -1)}${clean}`
  }
  if (clean === '/') return `${DOCS_BASE}${lang}/`
  return `${DOCS_BASE}${lang}${clean}`
}

// Strip a VitePress relativePath down to a locale-agnostic site path with no
// extension: 'en/guide/x.md' -> '/guide/x', 'index.md' -> '/', 'en/index.md' -> '/'.
function sitePathFromRelative(relativePath: string): string {
  const lang = localeFromRelativePath(relativePath)
  let p = relativePath.replace(/\.md$/, '')
  if (lang !== DEFAULT_LANG) p = p.slice(lang.length + 1) // drop 'en/' etc
  p = p.replace(/(^|\/)index$/, '') // index -> ''
  if (!p) return '/'
  return p.startsWith('/') ? p : `/${p}`
}

export function equivalentDocsPaths(relativePath: string): Record<LangCode, string> {
  const sitePath = sitePathFromRelative(relativePath)
  const out = {} as Record<LangCode, string>
  for (const lang of SUPPORTED_LANGS) out[lang] = docsPath(lang, sitePath)
  return out
}

export function preferredLocaleFromNavigator(languages: readonly string[] = []): string {
  for (const language of languages) {
    const normalized = String(language || '').toLowerCase()
    const exact = Object.values(LANG_TO_LOCALE).find((l) => l.toLowerCase() === normalized)
    if (exact) return exact
    const base = normalized.split('-')[0]
    if (base && isSupportedLang(base)) return localeFromLang(base)
  }
  return LANG_TO_LOCALE[DEFAULT_LANG]
}
