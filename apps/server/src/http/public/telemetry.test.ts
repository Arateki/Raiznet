import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generateKeyPair, sign } from '@raiznet/crypto'
import { openPublicDb } from '../../storage/public-db.js'
import { openPrivateDb } from '../../storage/private-db.js'
import { registerTelemetryRoutes } from './telemetry.js'
import { registerDeviceRoutes } from './devices.js'
import type Database from 'better-sqlite3'

// Canonical bytes for Phase 1: deterministic encoding of the fields to sign.
// This will be replaced by Protobuf serialization in Phase 2.
function buildRawBytes(block: {
  deviceId: Buffer
  seq: bigint
  timestamp: bigint
  keyVersion: number
  phPlain?: number
}): Buffer {
  const parts: Buffer[] = [
    block.deviceId,
    Buffer.from(block.seq.toString()),
    Buffer.from(block.timestamp.toString()),
    Buffer.from(String(block.keyVersion)),
    block.phPlain !== undefined ? Buffer.from(String(block.phPlain)) : Buffer.alloc(0),
  ]
  return Buffer.concat(parts)
}

let app: ReturnType<typeof Fastify>
let publicDb: Database.Database
let privateDb: Database.Database
let dataDir: string
let serverPubkeyHex: string
let devicePubkey: Buffer
let deviceSecretKey: Buffer

beforeAll(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'raiznet-test-'))
  publicDb  = openPublicDb(dataDir)
  privateDb = openPrivateDb(dataDir)

  const { keyPair: serverKeyPair } = generateKeyPair()
  serverPubkeyHex = serverKeyPair.publicKey.toString('hex')

  const { keyPair: deviceKeyPair } = generateKeyPair()
  devicePubkey   = deviceKeyPair.publicKey
  deviceSecretKey = deviceKeyPair.secretKey

  const { keyPair: ownerKeyPair } = generateKeyPair()

  // insert owner
  publicDb.prepare(`
    INSERT INTO users (pubkey, name, created_at) VALUES (?, ?, ?)
  `).run(ownerKeyPair.publicKey, 'Test Owner', Date.now())

  // insert device with publish_to=1 (public), all fields plain by default
  const privacyPolicy = {
    ph:          { default_disposition: 1, per_destination: {} },
    ec:          { default_disposition: 1, per_destination: {} },
    water_level: { default_disposition: 1, per_destination: {} },
    temp_water:  { default_disposition: 1, per_destination: {} },
    temp_ambient:{ default_disposition: 1, per_destination: {} },
    humidity:    { default_disposition: 1, per_destination: {} },
  }

  publicDb.prepare(`
    INSERT INTO devices (pubkey, mac, owner_pubkey, name, type, publish_to, privacy_policy, hardware, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    devicePubkey,
    Buffer.from('aabbccddee01', 'hex'),
    ownerKeyPair.publicKey,
    'Test Sensor',
    0,
    1,
    JSON.stringify(privacyPolicy),
    JSON.stringify({ model: 'ESP32-S3', firmware_version: '0.1.0' }),
    Date.now(),
  )

  app = Fastify()
  await registerTelemetryRoutes(app, publicDb, privateDb, serverPubkeyHex)
  await registerDeviceRoutes(app, publicDb)
  await app.ready()
})

afterAll(async () => {
  await app.close()
  publicDb.close()
  privateDb.close()
  rmSync(dataDir, { recursive: true })
})

describe('POST /v1/telemetry', () => {
  it('accepts a valid signed block and stores the reading', async () => {
    const seq       = 1n
    const timestamp = BigInt(Date.now())
    const phPlain   = 6.5

    const raw = buildRawBytes({ deviceId: devicePubkey, seq, timestamp, keyVersion: 0, phPlain })
    const signature = sign(raw, deviceSecretKey)

    const response = await app.inject({
      method: 'POST',
      url: '/v1/telemetry',
      payload: {
        blocks: [{
          deviceId:   devicePubkey.toString('hex'),
          seq:        seq.toString(),
          timestamp:  timestamp.toString(),
          keyVersion: 0,
          ph:         { plain: phPlain },
          signature:  signature.toString('hex'),
          raw:        raw.toString('hex'),
        }],
      },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body) as { accepted: number; errors: unknown[] }
    expect(body.accepted).toBe(1)
    expect(body.errors).toHaveLength(0)
  })

  it('rejects a block with invalid signature', async () => {
    const seq       = 2n
    const timestamp = BigInt(Date.now())
    const raw       = buildRawBytes({ deviceId: devicePubkey, seq, timestamp, keyVersion: 0 })
    const badSig    = Buffer.alloc(64, 0xff)

    const response = await app.inject({
      method: 'POST',
      url: '/v1/telemetry',
      payload: {
        blocks: [{
          deviceId:   devicePubkey.toString('hex'),
          seq:        seq.toString(),
          timestamp:  timestamp.toString(),
          keyVersion: 0,
          signature:  badSig.toString('hex'),
          raw:        raw.toString('hex'),
        }],
      },
    })

    expect(response.statusCode).toBe(207)
    const body = JSON.parse(response.body) as { accepted: number; errors: { error: string }[] }
    expect(body.accepted).toBe(0)
    expect(body.errors[0]?.error).toContain('Invalid signature')
  })

  it('rejects a block for an unknown device', async () => {
    const { keyPair: unknown } = generateKeyPair()
    const seq       = 1n
    const timestamp = BigInt(Date.now())
    const raw       = buildRawBytes({ deviceId: unknown.publicKey, seq, timestamp, keyVersion: 0 })
    const signature = sign(raw, unknown.secretKey)

    const response = await app.inject({
      method: 'POST',
      url: '/v1/telemetry',
      payload: {
        blocks: [{
          deviceId:   unknown.publicKey.toString('hex'),
          seq:        seq.toString(),
          timestamp:  timestamp.toString(),
          keyVersion: 0,
          signature:  signature.toString('hex'),
          raw:        raw.toString('hex'),
        }],
      },
    })

    expect(response.statusCode).toBe(207)
    const body = JSON.parse(response.body) as { accepted: number; errors: { error: string }[] }
    expect(body.accepted).toBe(0)
    expect(body.errors[0]?.error).toContain('not found')
  })
})

describe('GET /v1/devices/:id/telemetry', () => {
  it('returns the stored reading with the correct ph value', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/v1/devices/${devicePubkey.toString('hex')}/telemetry`,
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body) as { readings: { ph: { value: number } }[] }
    expect(body.readings.length).toBeGreaterThan(0)
    expect(body.readings[0]?.ph?.value).toBeCloseTo(6.5, 1)
  })
})
