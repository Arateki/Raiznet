import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const NONCE_BYTES = 12
const TAG_BYTES = 16

export type EncryptedField = {
  cipher: Buffer
  nonce: Buffer
}

export function encryptField(value: number, key: Buffer): EncryptedField {
  const nonce = randomBytes(NONCE_BYTES)
  const plaintext = Buffer.allocUnsafe(4)
  plaintext.writeFloatBE(value, 0)

  const cipher = createCipheriv(ALGORITHM, key, nonce)
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    cipher: Buffer.concat([encrypted, tag]),
    nonce,
  }
}

export function decryptField(field: EncryptedField, key: Buffer): number {
  const ciphertext = field.cipher.subarray(0, field.cipher.length - TAG_BYTES)
  const tag = field.cipher.subarray(field.cipher.length - TAG_BYTES)

  const decipher = createDecipheriv(ALGORITHM, key, field.nonce)
  decipher.setAuthTag(tag)

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.readFloatBE(0)
}
