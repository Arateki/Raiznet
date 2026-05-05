import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { dictionaries } from './i18n/index.js';
import { App } from './main.jsx';
import { HeadTags, SITE_URL, buildHomeSeo, buildSitemapXml } from './lib/seo.jsx';
import {
  DEFAULT_LOCALE,
  HTML_LANG,
  SUPPORTED_LANGS,
  langPath,
  localeFromPathname,
} from './lib/i18n-routing.js';

export const PRERENDER_PATHS = [
  ...SUPPORTED_LANGS.map((lang) => langPath(lang)),
  '/',
];

export function renderPage(path) {
  const locale = localeFromPathname(path) || DEFAULT_LOCALE;
  const copy = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
  const seo = buildHomeSeo(copy, locale, path);
  const html = renderToStaticMarkup(<App initialLocale={locale} initialTheme="light" routePath={path} />);
  const head = renderToStaticMarkup(<HeadTags seo={seo} />).replaceAll('hrefLang=', 'hreflang=');

  return {
    html,
    head,
    htmlLang: HTML_LANG[seo.lang],
  };
}

export function robotsTxt() {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /api',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');
}

export function sitemapXml() {
  const sitemapPaths = ['/', ...SUPPORTED_LANGS.map((lang) => langPath(lang))];
  return buildSitemapXml(sitemapPaths);
}
