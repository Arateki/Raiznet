import { describe, it, expect } from 'vitest'
import { sign, verify } from './signing.js'
import { generateKeyPair } from './keys.js'

describe('sign / verify', () => {
  it('verifies a valid signature', () => {
    const { keyPair } = generateKeyPair()
    const message = Buffer.from('hello raiznet')
    const signature = sign(message, keyPair.secretKey)
    expect(verify(message, signature, keyPair.publicKey)).toBe(true)
  })

  it('rejects a tampered message', () => {
    const { keyPair } = generateKeyPair()
    const message = Buffer.from('hello raiznet')
    const signature = sign(message, keyPair.secretKey)
    const tampered = Buffer.from('hello RAIZNET')
    expect(verify(tampered, signature, keyPair.publicKey)).toBe(false)
  })

  it('rejects a signature from a different key', () => {
    const a = generateKeyPair()
    const b = generateKeyPair()
    const message = Buffer.from('hello raiznet')
    const signature = sign(message, a.keyPair.secretKey)
    expect(verify(message, signature, b.keyPair.publicKey)).toBe(false)
  })

  it('rejects a zeroed signature', () => {
    const { keyPair } = generateKeyPair()
    const message = Buffer.from('hello raiznet')
    const badSig = Buffer.alloc(64, 0)
    expect(verify(message, badSig, keyPair.publicKey)).toBe(false)
  })
})
