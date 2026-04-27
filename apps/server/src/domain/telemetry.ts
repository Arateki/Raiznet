import type Database from 'better-sqlite3'
import { verify } from '@raiznet/crypto'
import { InvalidSignatureError, DeviceNotFoundError } from './errors.js'

type SensorField =
  | { case: 'plain'; value: number }
  | { case: 'encrypted'; cipher: Buffer; nonce: Buffer }
  | { case: 'absent' }

type TelemetryBlock = {
  deviceId: Buffer
  seq: bigint
  timestamp: bigint
  keyVersion: number
  ph: SensorField
  ec: SensorField
  waterLevel: SensorField
  tempWater: SensorField
  tempAmbient: SensorField
  humidity: SensorField
  signature: Buffer
  raw: Buffer
}

export type IngestDestination = 'public' | 'local'

type DeviceRow = {
  pubkey: Buffer
  publish_to: number
  privacy_policy: string
}

// Disposition values — must match Disposition enum in device.proto
const DISPOSITION_OMIT      = 0
const DISPOSITION_PLAIN     = 1
const DISPOSITION_ENCRYPTED = 2

type FieldPolicy = {
  default_disposition: number
  per_destination: Record<string, number>
}

type PrivacyPolicy = {
  ph?: FieldPolicy
  ec?: FieldPolicy
  water_level?: FieldPolicy
  temp_water?: FieldPolicy
  temp_ambient?: FieldPolicy
  humidity?: FieldPolicy
}

function resolveDisposition(policy: FieldPolicy | undefined, serverPubkeyHex: string): number {
  if (!policy) return DISPOSITION_OMIT
  return policy.per_destination[serverPubkeyHex] ?? policy.default_disposition
}

function fieldToColumns(
  field: SensorField,
  disposition: number,
): { plain: number | null; cipher: Buffer | null; nonce: Buffer | null } {
  if (disposition === DISPOSITION_OMIT) return { plain: null, cipher: null, nonce: null }
  if (field.case === 'plain' && disposition === DISPOSITION_PLAIN) {
    return { plain: field.value, cipher: null, nonce: null }
  }
  if (field.case === 'encrypted' && disposition === DISPOSITION_ENCRYPTED) {
    return { plain: null, cipher: field.cipher, nonce: field.nonce }
  }
  return { plain: null, cipher: null, nonce: null }
}

export function ingestBlock(
  block: TelemetryBlock,
  serverPubkeyHex: string,
  publicDb: Database.Database,
  privateDb: Database.Database,
  destination: IngestDestination = 'public',
): void {
  const deviceIdHex = block.deviceId.toString('hex')

  const targetDb = destination === 'public' ? publicDb : privateDb
  const row = targetDb
    .prepare('SELECT pubkey, publish_to, privacy_policy FROM devices WHERE pubkey = ?')
    .get(block.deviceId) as DeviceRow | undefined
  if (!row) throw new DeviceNotFoundError(deviceIdHex)

  if (!verify(block.raw, block.signature, row.pubkey)) {
    throw new InvalidSignatureError(deviceIdHex)
  }

  const policy = JSON.parse(row.privacy_policy) as PrivacyPolicy
  const publishTo: number = row.publish_to

  const fields = {
    ph:          fieldToColumns(block.ph,          resolveDisposition(policy.ph,          serverPubkeyHex)),
    ec:          fieldToColumns(block.ec,          resolveDisposition(policy.ec,          serverPubkeyHex)),
    water_level: fieldToColumns(block.waterLevel,  resolveDisposition(policy.water_level, serverPubkeyHex)),
    temp_water:  fieldToColumns(block.tempWater,   resolveDisposition(policy.temp_water,  serverPubkeyHex)),
    temp_ambient:fieldToColumns(block.tempAmbient, resolveDisposition(policy.temp_ambient,serverPubkeyHex)),
    humidity:    fieldToColumns(block.humidity,    resolveDisposition(policy.humidity,    serverPubkeyHex)),
  }

  const receivedAt = BigInt(Date.now())

  const insert = (db: Database.Database) => db.prepare(`
    INSERT OR IGNORE INTO telemetry (
      device_pubkey, seq, timestamp, received_at, key_version,
      ph_plain, ph_cipher, ph_nonce,
      ec_plain, ec_cipher, ec_nonce,
      water_level_plain, water_level_cipher, water_level_nonce,
      temp_water_plain, temp_water_cipher, temp_water_nonce,
      temp_ambient_plain, temp_ambient_cipher, temp_ambient_nonce,
      humidity_plain, humidity_cipher, humidity_nonce
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )
  `).run(
    block.deviceId, block.seq, block.timestamp, receivedAt, block.keyVersion,
    fields.ph.plain,          fields.ph.cipher,           fields.ph.nonce,
    fields.ec.plain,          fields.ec.cipher,           fields.ec.nonce,
    fields.water_level.plain, fields.water_level.cipher,  fields.water_level.nonce,
    fields.temp_water.plain,  fields.temp_water.cipher,   fields.temp_water.nonce,
    fields.temp_ambient.plain,fields.temp_ambient.cipher, fields.temp_ambient.nonce,
    fields.humidity.plain,    fields.humidity.cipher,     fields.humidity.nonce,
  )

  // publish_to: 0 = local_only, 1 = public, 2 = both.
  // The request destination determines the storage target. A "both" device
  // sends separate HTTP requests to public and local destinations.
  if (destination === 'public') {
    if (publishTo === 1 || publishTo === 2) insert(publicDb)
    return
  }

  if (publishTo === 0 || publishTo === 2) insert(privateDb)
}
