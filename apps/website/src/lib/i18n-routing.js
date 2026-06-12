export const SUPPORTED_LANGS = ['pt', 'en', 'es', 'ja', 'zh'];
export const DEFAULT_LANG = 'pt';

export const LANG_TO_LOCALE = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

export const HTML_LANG = {
  pt: 'pt-BR',
  en: 'en',
  es: 'es',
  ja: 'ja',
  zh: 'zh-CN',
};

export const LOCALE_TO_LANG = Object.fromEntries(
  Object.entries(LANG_TO_LOCALE).map(([lang, locale]) => [locale, lang]),
);

export const DEFAULT_LOCALE = LANG_TO_LOCALE[DEFAULT_LANG];

const LANG_PATTERN = SUPPORTED_LANGS.join('|');
const LANG_RE = new RegExp(`^/(${LANG_PATTERN})(/|$)`);

export function isSupportedLang(lang) {
  return SUPPORTED_LANGS.includes(lang);
}

export function langFromLocale(locale) {
  return LOCALE_TO_LANG[locale] || DEFAULT_LANG;
}

export function localeFromLang(lang) {
  return LANG_TO_LOCALE[isSupportedLang(lang) ? lang : DEFAULT_LANG];
}

export function langFromPathname(pathname = '/') {
  const match = pathname.match(LANG_RE);
  return match ? match[1] : null;
}

export function localeFromPathname(pathname = '/') {
  const lang = langFromPathname(pathname);
  return lang ? localeFromLang(lang) : null;
}

export function stripLangFromPath(pathname = '/') {
  const match = pathname.match(LANG_RE);
  if (!match) return pathname || '/';

  const consumed = match[0].length - (match[2] === '/' ? 1 : 0);
  const remainder = pathname.slice(consumed);
  if (!remainder) return '/';
  return remainder.startsWith('/') ? remainder : `/${remainder}`;
}

export function langPath(lang, path = '/') {
  const normalizedLang = isSupportedLang(lang) ? lang : DEFAULT_LANG;
  const cleaned = path.startsWith('/') ? path : `/${path}`;
  // O idioma padrão (PT) vive na RAIZ, sem prefixo: a home PT é `/` e uma
  // futura página PT é `/about`. Idiomas alternativos usam prefixo (/en, ...).
  // Isso concentra os sinais de SEO do idioma principal na raiz do domínio.
  if (normalizedLang === DEFAULT_LANG) return cleaned;
  if (cleaned === '/') return `/${normalizedLang}`;
  return `/${normalizedLang}${cleaned}`;
}

export function localizedPathForLocale(locale, pathname = '/') {
  return langPath(langFromLocale(locale), stripLangFromPath(pathname));
}

export function preferredLocaleFromNavigator(languages = []) {
  for (const language of languages) {
    const normalized = String(language || '').toLowerCase();
    const exact = Object.values(LANG_TO_LOCALE).find((locale) => locale.toLowerCase() === normalized);
    if (exact) return exact;

    const base = normalized.split('-')[0];
    if (isSupportedLang(base)) return localeFromLang(base);
  }

  return DEFAULT_LOCALE;
}
