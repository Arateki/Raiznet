declare module 'hypercore-crypto' {
  export function keyPair(seed?: Buffer): { publicKey: Buffer; secretKey: Buffer }
  export function sign(message: Buffer, secretKey: Buffer): Buffer
  export function verify(message: Buffer, signature: Buffer, publicKey: Buffer): boolean
  export function validateKeyPair(keyPair: { publicKey: Buffer; secretKey: Buffer }): boolean
  export function randomBytes(n: number): Buffer
  export function hash(buffers: Buffer[], index?: number): Buffer
}