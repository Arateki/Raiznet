import { randomBytes } from 'node:crypto'
import { sign, verify } from './signing.js'

export function generateChallenge(): Buffer {
  return randomBytes(32)
}

export function signChallenge(challenge: Buffer, secretKey: Buffer): Buffer {
  return sign(challenge, secretKey)
}

export function verifyChallenge(
  challenge: Buffer,
  signature: Buffer,
  publicKey: Buffer,
): boolean {
  return verify(challenge, signature, publicKey)
}
