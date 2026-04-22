import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39'
import { wordlist as english } from '@scure/bip39/wordlists/english'
import * as hyperCoreCrypto from 'hypercore-crypto'

export type KeyPair = {
  publicKey: Buffer
  secretKey: Buffer
}

export function generateSeedPhrase(strength: 128 | 256 = 128): string {
  return generateMnemonic(english, strength)
}

export function keyPairFromSeedPhrase(mnemonic: string): KeyPair {
  const seed = Buffer.from(mnemonicToSeedSync(mnemonic)).subarray(0, 32)
  return hyperCoreCrypto.keyPair(seed)
}

export function generateKeyPair(): { mnemonic: string; keyPair: KeyPair } {
  const mnemonic = generateSeedPhrase()
  const keyPair = keyPairFromSeedPhrase(mnemonic)
  return { mnemonic, keyPair }
}
