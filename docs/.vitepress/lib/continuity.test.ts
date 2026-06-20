import { describe, expect, it } from 'vitest'
import { targetDocsUrlForSavedLocale, themeFromRaiznet } from './continuity'

describe('targetDocsUrlForSavedLocale', () => {
  it('redirects PT page to EN when EN is saved', () => {
    expect(targetDocsUrlForSavedLocale('en-US', '/docs/guide/introduction')).toBe(
      '/docs/en/guide/introduction',
    )
  })
  it('returns null when already in the saved locale', () => {
    expect(targetDocsUrlForSavedLocale('en-US', '/docs/en/guide/introduction')).toBeNull()
  })
  it('returns null for the default locale on a root page', () => {
    expect(targetDocsUrlForSavedLocale('pt-BR', '/docs/guide/introduction')).toBeNull()
  })
  it('returns null for unknown/empty', () => {
    expect(targetDocsUrlForSavedLocale('', '/docs/')).toBeNull()
    expect(targetDocsUrlForSavedLocale('ko-KR', '/docs/')).toBeNull()
  })
})

describe('themeFromRaiznet', () => {
  it('maps stored values', () => {
    expect(themeFromRaiznet('dark')).toBe('dark')
    expect(themeFromRaiznet('light')).toBe('light')
    expect(themeFromRaiznet(null)).toBeNull()
    expect(themeFromRaiznet('weird')).toBeNull()
  })
})
