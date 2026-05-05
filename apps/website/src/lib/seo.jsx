import React from 'react';
import { createPortal } from 'react-dom';
import {
  DEFAULT_LANG,
  HTML_LANG,
  SUPPORTED_LANGS,
  langFromLocale,
  langPath,
  stripLangFromPath,
} from './i18n-routing.js';

const envSiteUrl = (() => {
  if (import.meta.env?.VITE_PUBLIC_SITE_URL) return import.meta.env.VITE_PUBLIC_SITE_URL;
  if (typeof process !== 'undefined' && process.env?.VITE_PUBLIC_SITE_URL) return process.env.VITE_PUBLIC_SITE_URL;
  return 'https://raiznet.arateki.com';
})();

export const SITE_URL = envSiteUrl.replace(/\/+$/, '');
export const SITE_NAME = 'Raiznet';
export const DEFAULT_OG_IMAGE = '/og-image.svg';

let preparedHead = false;

export function absoluteUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function canonical(path) {
  return absoluteUrl(path);
}

export function alternateLinks(path) {
  const stripped = stripLangFromPath(path);
  const xDefaultPath = stripped === '/' ? '/' : langPath(DEFAULT_LANG, stripped);

  return [
    ...SUPPORTED_LANGS.map((lang) => ({
      hrefLang: HTML_LANG[lang],
      href: absoluteUrl(langPath(lang, stripped)),
    })),
    {
      hrefLang: 'x-default',
      href: absoluteUrl(xDefaultPath),
    },
  ];
}

export function buildHomeSeo(copy, locale, path = '/') {
  const lang = langFromLocale(locale);
  const canonicalPath = path === '/' ? '/' : langPath(lang, stripLangFromPath(path));

  return {
    title: copy.seo.title,
    description: copy.seo.description,
    path: canonicalPath,
    lang,
    noindex: false,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Arateki',
        url: 'https://arateki.com',
        brand: {
          '@type': 'Brand',
          name: SITE_NAME,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        description: copy.seo.description,
        inLanguage: HTML_LANG[lang],
        publisher: {
          '@type': 'Organization',
          name: 'Arateki',
          url: 'https://arateki.com',
        },
      },
    ],
  };
}

export function HeadTags({ seo }) {
  const robots = seo.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
  const ogImage = absoluteUrl(seo.ogImage || DEFAULT_OG_IMAGE);
  const ogLocale = HTML_LANG[seo.lang].replace('-', '_');

  return (
    <>
      <title data-rz-seo="true">{seo.title}</title>
      <meta data-rz-seo="true" name="description" content={seo.description} />
      <meta data-rz-seo="true" name="robots" content={robots} />
      <link data-rz-seo="true" rel="canonical" href={canonical(seo.path)} />
      {alternateLinks(seo.path).map((link) => (
        <link data-rz-seo="true" key={link.hrefLang} rel="alternate" hrefLang={link.hrefLang} href={link.href} />
      ))}
      <meta data-rz-seo="true" property="og:title" content={seo.title} />
      <meta data-rz-seo="true" property="og:description" content={seo.description} />
      <meta data-rz-seo="true" property="og:url" content={canonical(seo.path)} />
      <meta data-rz-seo="true" property="og:type" content={seo.ogType || 'website'} />
      <meta data-rz-seo="true" property="og:site_name" content={SITE_NAME} />
      <meta data-rz-seo="true" property="og:locale" content={ogLocale} />
      <meta data-rz-seo="true" property="og:image" content={ogImage} />
      <meta data-rz-seo="true" name="twitter:card" content="summary_large_image" />
      <meta data-rz-seo="true" name="twitter:title" content={seo.title} />
      <meta data-rz-seo="true" name="twitter:description" content={seo.description} />
      <meta data-rz-seo="true" name="twitter:image" content={ogImage} />
      {(seo.jsonLd || []).map((data, index) => (
        <script
          data-rz-seo="true"
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll('<', '\\u003c') }}
        />
      ))}
    </>
  );
}

export function Seo({ seo }) {
  if (typeof document === 'undefined') return null;

  if (!preparedHead) {
    document.head.querySelectorAll('[data-rz-seo="true"]').forEach((node) => node.remove());
    preparedHead = true;
  }

  return createPortal(<HeadTags seo={seo} />, document.head);
}

export function buildSitemapXml(paths) {
  const urls = paths.map((path) => {
    const links = alternateLinks(path)
      .map((link) => `    <xhtml:link rel="alternate" hreflang="${link.hrefLang}" href="${link.href}" />`)
      .join('\n');

    return [
      '  <url>',
      `    <loc>${canonical(path)}</loc>`,
      links,
      '  </url>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
