import { describe, it, expect } from 'vitest'
import { generateSeedPhrase, keyPairFromSeedPhrase, generateKeyPair } from './keys.js'

describe('generateSeedPhrase', () => {
  it('generates a 12-word mnemonic by default', () => {
    const phrase = generateSeedPhrase()
    expect(phrase.split(' ')).toHaveLength(12)
  })

  it('generates a 24-word mnemonic when strength is 256', () => {
    const phrase = generateSeedPhrase(256)
    expect(phrase.split(' ')).toHaveLength(24)
  })

  it('generates unique phrases each call', () => {
    expect(generateSeedPhrase()).not.toBe(generateSeedPhrase())
  })
})

describe('keyPairFromSeedPhrase', () => {
  it('derives a 32-byte public key and 64-byte secret key', () => {
    const { publicKey, secretKey } = keyPairFromSeedPhrase(generateSeedPhrase())
    expect(publicKey).toHaveLength(32)
    expect(secretKey).toHaveLength(64)
  })

  it('is deterministic — same phrase produces same keys', () => {
    const phrase = generateSeedPhrase()
    const a = keyPairFromSeedPhrase(phrase)
    const b = keyPairFromSeedPhrase(phrase)
    expect(a.publicKey.toString('hex')).toBe(b.publicKey.toString('hex'))
    expect(a.secretKey.toString('hex')).toBe(b.secretKey.toString('hex'))
  })

  it('different phrases produce different keys', () => {
    const a = keyPairFromSeedPhrase(generateSeedPhrase())
    const b = keyPairFromSeedPhrase(generateSeedPhrase())
    expect(a.publicKey.toString('hex')).not.toBe(b.publicKey.toString('hex'))
  })
})

describe('generateKeyPair', () => {
  it('returns a mnemonic and a keypair derived from it', () => {
    const { mnemonic, keyPair } = generateKeyPair()
    const derived = keyPairFromSeedPhrase(mnemonic)
    expect(keyPair.publicKey.toString('hex')).toBe(derived.publicKey.toString('hex'))
  })
})
