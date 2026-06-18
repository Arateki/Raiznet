import {
  DOCS_BASE,
  type LangCode,
  LANG_TO_LOCALE,
  SUPPORTED_LANGS,
  docsPath,
  langFromLocale,
} from './i18n-routing'

// Locale of a live docs URL path: '/docs/en/guide/x' -> 'en'; '/docs/guide/x' -> 'pt'.
function langFromDocsPath(currentPath: string): LangCode {
  const rest = currentPath.startsWith(DOCS_BASE) ? currentPath.slice(DOCS_BASE.length) : ''
  const first = rest.split('/')[0]
  const known = SUPPORTED_LANGS.find((l) => l === first && l !== 'pt')
  return known ?? 'pt'
}

// Site path (no /docs/ prefix, no lang prefix) of a live docs URL path.
function sitePathFromDocsPath(currentPath: string, lang: LangCode): string {
  let rest = currentPath.startsWith(DOCS_BASE) ? currentPath.slice(DOCS_BASE.length - 1) : currentPath
  if (lang !== 'pt') rest = rest.replace(new RegExp(`^/${lang}(/|$)`), '/')
  rest = rest.replace(/\/$/, '')
  return rest || '/'
}

export function targetDocsUrlForSavedLocale(
  savedLocale: string,
  currentPath: string,
): string | null {
  if (!savedLocale) return null
  // Só aceita locales conhecidos (langFromLocale faz fallback p/ pt em outros).
  if (!Object.values(LANG_TO_LOCALE).includes(savedLocale)) return null
  const savedLang = langFromLocale(savedLocale)
  const currentLang = langFromDocsPath(currentPath)
  if (savedLang === currentLang) return null
  const sitePath = sitePathFromDocsPath(currentPath, currentLang)
  return docsPath(savedLang, sitePath)
}

export function themeFromRaiznet(value: string | null): 'dark' | 'light' | null {
  return value === 'dark' || value === 'light' ? value : null
}
