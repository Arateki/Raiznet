import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LANG,
  docsPath,
  equivalentDocsPaths,
  langFromLocale,
  localeFromRelativePath,
  preferredLocaleFromNavigator,
} from './i18n-routing'

describe('localeFromRelativePath', () => {
  it('root files are the default language', () => {
    expect(localeFromRelativePath('guide/introduction.md')).toBe('pt')
    expect(localeFromRelativePath('index.md')).toBe('pt')
  })
  it('prefixed files map to their locale', () => {
    expect(localeFromRelativePath('en/guide/introduction.md')).toBe('en')
    expect(localeFromRelativePath('zh/index.md')).toBe('zh')
  })
})

describe('docsPath', () => {
  it('default language has no lang prefix', () => {
    expect(docsPath('pt', '/guide/introduction')).toBe('/docs/guide/introduction')
    expect(docsPath('pt', '/')).toBe('/docs/')
  })
  it('alternate languages are prefixed under /docs/', () => {
    expect(docsPath('en', '/guide/introduction')).toBe('/docs/en/guide/introduction')
    expect(docsPath('en', '/')).toBe('/docs/en/')
  })
})

describe('equivalentDocsPaths', () => {
  it('maps every language for a default-locale page', () => {
    const map = equivalentDocsPaths('guide/introduction.md')
    expect(map.pt).toBe('/docs/guide/introduction')
    expect(map.en).toBe('/docs/en/guide/introduction')
  })
  it('maps every language for a prefixed page', () => {
    const map = equivalentDocsPaths('en/guide/introduction.md')
    expect(map.pt).toBe('/docs/guide/introduction')
    expect(map.en).toBe('/docs/en/guide/introduction')
  })
})

describe('preferredLocaleFromNavigator', () => {
  it('matches base language', () => {
    expect(preferredLocaleFromNavigator(['es-AR', 'en'])).toBe('es-ES')
  })
  it('falls back to default locale', () => {
    expect(preferredLocaleFromNavigator(['ko'])).toBe(LANG_DEFAULT_LOCALE)
  })
})

const LANG_DEFAULT_LOCALE = 'pt-BR'

it('default lang is pt', () => {
  expect(DEFAULT_LANG).toBe('pt')
  expect(langFromLocale('en-US')).toBe('en')
})
