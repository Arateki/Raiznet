import { describe, it, expect } from 'vitest'
import { encryptField, decryptField } from './symmetric.js'
import { randomBytes } from 'node:crypto'

describe('encryptField / decryptField', () => {
  it('round-trips a float value', () => {
    const key = randomBytes(32)
    const original = 6.78
    const encrypted = encryptField(original, key)
    const decrypted = decryptField(encrypted, key)
    expect(decrypted).toBeCloseTo(original, 2)
  })

  it('produces different ciphertexts for the same value (random nonce)', () => {
    const key = randomBytes(32)
    const a = encryptField(7.1, key)
    const b = encryptField(7.1, key)
    expect(a.cipher.toString('hex')).not.toBe(b.cipher.toString('hex'))
    expect(a.nonce.toString('hex')).not.toBe(b.nonce.toString('hex'))
  })

  it('throws when decrypting with the wrong key', () => {
    const key  = randomBytes(32)
    const bad  = randomBytes(32)
    const enc  = encryptField(5.5, key)
    expect(() => decryptField(enc, bad)).toThrow()
  })

  it('round-trips edge values (0, negative, large)', () => {
    const key = randomBytes(32)
    for (const v of [0, -1.5, 9999.99]) {
      expect(decryptField(encryptField(v, key), key)).toBeCloseTo(v, 2)
    }
  })
})
