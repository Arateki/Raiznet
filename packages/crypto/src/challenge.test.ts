import { describe, it, expect } from 'vitest'
import { generateChallenge, signChallenge, verifyChallenge } from './challenge.js'
import { generateKeyPair } from './keys.js'

describe('challenge-response', () => {
  it('verifies a valid challenge response', () => {
    const { keyPair } = generateKeyPair()
    const challenge = generateChallenge()
    const signature = signChallenge(challenge, keyPair.secretKey)
    expect(verifyChallenge(challenge, signature, keyPair.publicKey)).toBe(true)
  })

  it('rejects a response signed by a different key', () => {
    const a = generateKeyPair()
    const b = generateKeyPair()
    const challenge = generateChallenge()
    const signature = signChallenge(challenge, a.keyPair.secretKey)
    expect(verifyChallenge(challenge, signature, b.keyPair.publicKey)).toBe(false)
  })

  it('rejects a replayed response on a different challenge', () => {
    const { keyPair } = generateKeyPair()
    const c1 = generateChallenge()
    const c2 = generateChallenge()
    const signature = signChallenge(c1, keyPair.secretKey)
    expect(verifyChallenge(c2, signature, keyPair.publicKey)).toBe(false)
  })

  it('generates unique challenges each call', () => {
    expect(generateChallenge().toString('hex')).not.toBe(generateChallenge().toString('hex'))
  })
})
