import {
  DEFAULT_LANG,
  HTML_LANG,
  LANG_TO_LOCALE,
  SUPPORTED_LANGS,
  equivalentDocsPaths,
  localeFromRelativePath,
} from './lib/i18n-routing'

export const SITE_URL = (
  process.env.VITE_PUBLIC_SITE_URL ?? 'https://raiznet.com'
).replace(/\/+$/, '')

const SITE_NAME = 'Raiznet Docs'
const OG_IMAGE = `${SITE_URL}/docs/og-image.png`

export type HeadTag =
  | [string, Record<string, string>]
  | [string, Record<string, string>, string]

const abs = (path: string) => `${SITE_URL}${path}`

// og:locale style locale (underscored).
const ogLocale = (locale: string) => locale.replace('-', '_')

export function buildSeoHead(args: {
  relativePath: string
  title: string
  description: string
}): HeadTag[] {
  const { relativePath, title, description } = args
  const lang = localeFromRelativePath(relativePath)
  const paths = equivalentDocsPaths(relativePath)
  const canonical = abs(paths[lang])
  const locale = LANG_TO_LOCALE[lang]

  const tags: HeadTag[] = [
    ['link', { rel: 'canonical', href: canonical }],
    // hreflang: auto-referente e bidirecional para todos os idiomas.
    ...SUPPORTED_LANGS.map(
      (l): HeadTag => [
        'link',
        { rel: 'alternate', hreflang: HTML_LANG[l], href: abs(paths[l]) },
      ],
    ),
    // x-default = idioma padrão (PT, raiz).
    ['link', { rel: 'alternate', hreflang: 'x-default', href: abs(paths[DEFAULT_LANG]) }],
    // Open Graph.
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: SITE_NAME }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: canonical }],
    ['meta', { property: 'og:locale', content: ogLocale(locale) }],
    ['meta', { property: 'og:image', content: OG_IMAGE }],
    ['meta', { property: 'og:image:type', content: 'image/png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: SITE_NAME }],
    // Twitter.
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: title }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: OG_IMAGE }],
    // JSON-LD WebSite.
    [
      'script',
      { type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: canonical,
        inLanguage: locale,
      }).replaceAll('<', '\\u003c'),
    ],
  ]
  return tags
}
