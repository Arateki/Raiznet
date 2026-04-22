import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { generateKeyPair, keyPairFromSeedPhrase } from '@raiznet/crypto'

export type ServerIdentity = {
  publicKey: Buffer
  secretKey: Buffer
  mnemonic: string
}

export function loadOrCreateIdentity(dataDir: string): ServerIdentity {
  mkdirSync(dataDir, { recursive: true })
  const mnemonicPath = join(dataDir, 'identity.mnemonic')

  if (existsSync(mnemonicPath)) {
    const mnemonic = readFileSync(mnemonicPath, 'utf8').trim()
    const keyPair = keyPairFromSeedPhrase(mnemonic)
    return { ...keyPair, mnemonic }
  }

  const { mnemonic, keyPair } = generateKeyPair()
  writeFileSync(mnemonicPath, mnemonic, { encoding: 'utf8', mode: 0o600 })
  return { ...keyPair, mnemonic }
}
