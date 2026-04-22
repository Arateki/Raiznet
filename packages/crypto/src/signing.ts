import * as hyperCoreCrypto from 'hypercore-crypto'

export function sign(message: Buffer, secretKey: Buffer): Buffer {
  return hyperCoreCrypto.sign(message, secretKey)
}

export function verify(message: Buffer, signature: Buffer, publicKey: Buffer): boolean {
  return hyperCoreCrypto.verify(message, signature, publicKey)
}
