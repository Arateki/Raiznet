// Gera o corpus de compatibilidade a partir do código TypeScript real.
// Executar da raiz do repo:  node test-fixtures/generate.mjs
import { keyPairFromSeedPhrase } from '../packages/crypto/dist/keys.js'
import { sign } from '../packages/crypto/dist/signing.js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
// Derivação (b) da seção 7.1 (SHA-256 do mnemonic) — valor fixo, conferido contra o firmware.
const OWNER_PUBKEY = '93a5f261984931e0df5c7434b16d468efb1953098d3cad4fa1506b9e052e7fc7'

const kp = keyPairFromSeedPhrase(MNEMONIC)
const devicePubkey = kp.publicKey.toString('hex')

const rawStr = `${devicePubkey}|1|1700000000000|0|ec=1800|ph=6.20|waterLevel=80|tempAmbient=24.50|humidity=60.00`
const raw = Buffer.from(rawStr, 'utf8')
const sig = sign(raw, kp.secretKey)

function write(rel, obj) {
  const p = join(root, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n')
}

write('identity/vectors.json', {
  mnemonic: MNEMONIC,
  server_derivation: { seed32: kp.secretKey.subarray(0, 32).toString('hex'), pubkey: devicePubkey },
  firmware_owner_derivation: { algorithm: 'sha256(mnemonic_utf8) -> ed25519 seed', pubkey: OWNER_PUBKEY },
  aes_gcm: {
    key: '11'.repeat(32), nonce: '22'.repeat(12),
    value: 6.2, plaintext_float32be: '40c66666',
    cipher_plus_tag: '5731612f87cc0d953260cd9674bc34ffe5f3caea',
  },
})

write('devices/register-ok.json', {
  id: devicePubkey, mac: 'aabbccddeeff', ownerPubkey: OWNER_PUBKEY,
  name: 'Fixture Tower', type: 0, publishTo: 2,
  hardware: { model: 'Safrasense Aqua ESP32 v1', firmware_version: '0.2.0' },
  privacyPolicy: Object.fromEntries(
    ['ph', 'ec', 'water_level', 'temp_water', 'temp_ambient', 'humidity']
      .map((f) => [f, { default_disposition: 1, per_destination: {} }])),
})

const block = {
  deviceId: devicePubkey, seq: '1', timestamp: '1700000000000', keyVersion: 0,
  ec: { plain: 1800 }, ph: { plain: 6.2 }, waterLevel: { plain: 80 },
  tempAmbient: { plain: 24.5 }, humidity: { plain: 60 },
  signature: sig.toString('hex'), raw: raw.toString('hex'),
}
write('telemetry/post-ok.json', { blocks: [block] })
write('telemetry/post-bad-signature.json', {
  blocks: [{ ...block, signature: '00'.repeat(64) }],
})

write('expected-http/register-ok.json', { status: 201, body_contains: { device: { id: devicePubkey, mac: 'aabbccddeeff' } } })
write('expected-http/register-duplicate.json', { status: 409, body: { error: 'device_already_exists' } })
write('expected-http/telemetry-ok.json', { status: 200, body: { accepted: 1, errors: [] } })
write('expected-http/telemetry-duplicate.json', { status: 200, body: { accepted: 1, errors: [] } })
write('expected-http/telemetry-unknown-device.json', {
  status: 207,
  body: { accepted: 0, errors: [{ seq: '1', error: `Device not found: ${devicePubkey}` }] },
})
write('expected-http/telemetry-bad-signature.json', {
  status: 207,
  body: { accepted: 0, errors: [{ seq: '1', error: `Invalid signature for device ${devicePubkey}` }] },
})

write('expected-sqlite/telemetry-ok.json', {
  table: 'telemetry',
  rows: [{
    device_pubkey_hex: devicePubkey, seq: 1, timestamp: 1700000000000, key_version: 0,
    ph_plain: 6.2, ec_plain: 1800, water_level_plain: 80,
    temp_water_plain: null, temp_ambient_plain: 24.5, humidity_plain: 60,
    all_cipher_columns_null: true,
  }],
})

console.log('fixtures geradas em', root)
