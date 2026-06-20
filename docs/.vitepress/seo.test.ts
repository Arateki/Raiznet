import { describe, expect, it } from 'vitest'
import { SITE_URL, buildSeoHead } from './seo'

const flat = (tags: ReturnType<typeof buildSeoHead>) => JSON.stringify(tags)

describe('buildSeoHead', () => {
  const head = buildSeoHead({
    relativePath: 'guide/introduction.md',
    title: 'Introduction',
    description: 'Intro to Raiznet.',
  })

  it('uses the canonical host', () => {
    expect(SITE_URL).toBe('https://raiznet.com')
  })

  it('emits exactly one canonical pointing at the PT (root) docs path', () => {
    const canon = head.filter((t) => t[0] === 'link' && t[1].rel === 'canonical')
    expect(canon).toHaveLength(1)
    expect(canon[0][1].href).toBe('https://raiznet.com/docs/guide/introduction')
  })

  it('emits hreflang for all langs + x-default to root', () => {
    const alts = head.filter((t) => t[0] === 'link' && t[1].rel === 'alternate')
    const langs = alts.map((t) => t[1].hreflang)
    expect(langs).toEqual(
      expect.arrayContaining(['pt-BR', 'en', 'es', 'ja', 'zh-CN', 'x-default']),
    )
    const xdef = alts.find((t) => t[1].hreflang === 'x-default')
    expect(xdef?.[1].href).toBe('https://raiznet.com/docs/guide/introduction')
    const en = alts.find((t) => t[1].hreflang === 'en')
    expect(en?.[1].href).toBe('https://raiznet.com/docs/en/guide/introduction')
  })

  it('emits og + twitter + json-ld', () => {
    expect(flat(head)).toContain('og:title')
    expect(flat(head)).toContain('og:image')
    expect(flat(head)).toContain('summary_large_image')
    expect(flat(head)).toContain('application/ld+json')
  })

  it('og:image is the PNG with dimensions', () => {
    const img = head.find((t) => t[1].property === 'og:image')
    expect(img?.[1].content).toBe('https://raiznet.com/docs/og-image.png')
    expect(head.some((t) => t[1].property === 'og:image:width')).toBe(true)
  })
})
