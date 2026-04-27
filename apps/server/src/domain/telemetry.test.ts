import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generateKeyPair, sign } from '@raiznet/crypto'
import { openPublicDb } from '../storage/public-db.js'
import { openPrivateDb } from '../storage/private-db.js'
import { ingestBlock } from './telemetry.js'
import { InvalidSignatureError, DeviceNotFoundError } from './errors.js'
import type Database from 'better-sqlite3'

const PLAIN     = 1
const OMIT      = 0

function buildRaw(deviceId: Buffer, seq: bigint, timestamp: bigint): Buffer {
  return Buffer.concat([deviceId, Buffer.from(seq.toString()), Buffer.from(timestamp.toString())])
}

function makePolicy(disposition: number) {
  const p = { default_disposition: disposition, per_destination: {} }
  return { ph: p, ec: p, water_level: p, temp_water: p, temp_ambient: p, humidity: p }
}

function insertDevice(
  db: Database.Database,
  pubkey: Buffer,
  ownerPubkey: Buffer,
  publishTo: number,
  policy: object,
) {
  db.prepare(`
    INSERT OR IGNORE INTO users (pubkey, name, created_at) VALUES (?, ?, ?)
  `).run(ownerPubkey, 'owner', Date.now())

  db.prepare(`
    INSERT INTO devices (pubkey, mac, owner_pubkey, name, type, publish_to, privacy_policy, hardware, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    pubkey,
    Buffer.from('aabbccddee01', 'hex'),
    ownerPubkey,
    'sensor',
    0,
    publishTo,
    JSON.stringify(policy),
    JSON.stringify({}),
    Date.now(),
  )
}

function countRows(db: Database.Database, devicePubkey: Buffer): number {
  const row = db.prepare('SELECT COUNT(*) as n FROM telemetry WHERE device_pubkey = ?').get(devicePubkey) as { n: number }
  return row.n
}

let publicDb: Database.Database
let privateDb: Database.Database
let dataDir: string
const serverPubkeyHex = 'aabbcc'

beforeEach(() => {
  dataDir   = mkdtempSync(join(tmpdir(), 'raiznet-domain-test-'))
  publicDb  = openPublicDb(dataDir)
  privateDb = openPrivateDb(dataDir)
})

function cleanup() {
  publicDb.close()
  privateDb.close()
  rmSync(dataDir, { recursive: true })
}

describe('ingestBlock — publish_to routing', () => {
  it('publish_to=public writes only to publicDb', () => {
    const { keyPair: owner } = generateKeyPair()
    const { keyPair: device } = generateKeyPair()
    insertDevice(publicDb, device.publicKey, owner.publicKey, 1, makePolicy(PLAIN))

    const seq = 1n; const ts = BigInt(Date.now())
    const raw = buildRaw(device.publicKey, seq, ts)
    ingestBlock(
      { deviceId: device.publicKey, seq, timestamp: ts, keyVersion: 0,
        ph: { case: 'plain', value: 6.5 }, ec: { case: 'absent' },
        waterLevel: { case: 'absent' }, tempWater: { case: 'absent' },
        tempAmbient: { case: 'absent' }, humidity: { case: 'absent' },
        signature: sign(raw, device.secretKey), raw },
      serverPubkeyHex, publicDb, privateDb,
    )

    expect(countRows(publicDb, device.publicKey)).toBe(1)
    expect(countRows(privateDb, device.publicKey)).toBe(0)
    cleanup()
  })

  it('publish_to=local_only writes only to privateDb for local ingest', () => {
    const { keyPair: owner } = generateKeyPair()
    const { keyPair: device } = generateKeyPair()
    insertDevice(privateDb, device.publicKey, owner.publicKey, 0, makePolicy(PLAIN))

    const seq = 1n; const ts = BigInt(Date.now())
    const raw = buildRaw(device.publicKey, seq, ts)
    ingestBlock(
      { deviceId: device.publicKey, seq, timestamp: ts, keyVersion: 0,
        ph: { case: 'plain', value: 5.9 }, ec: { case: 'absent' },
        waterLevel: { case: 'absent' }, tempWater: { case: 'absent' },
        tempAmbient: { case: 'absent' }, humidity: { case: 'absent' },
        signature: sign(raw, device.secretKey), raw },
      serverPubkeyHex, publicDb, privateDb, 'local',
    )

    expect(countRows(publicDb, device.publicKey)).toBe(0)
    expect(countRows(privateDb, device.publicKey)).toBe(1)
    cleanup()
  })

  it('publish_to=both writes to publicDb for public ingest', () => {
    const { keyPair: owner } = generateKeyPair()
    const { keyPair: device } = generateKeyPair()
    insertDevice(publicDb, device.publicKey, owner.publicKey, 2, makePolicy(PLAIN))

    const seq = 1n; const ts = BigInt(Date.now())
    const raw = buildRaw(device.publicKey, seq, ts)
    ingestBlock(
      { deviceId: device.publicKey, seq, timestamp: ts, keyVersion: 0,
        ph: { case: 'plain', value: 7.0 }, ec: { case: 'absent' },
        waterLevel: { case: 'absent' }, tempWater: { case: 'absent' },
        tempAmbient: { case: 'absent' }, humidity: { case: 'absent' },
        signature: sign(raw, device.secretKey), raw },
      serverPubkeyHex, publicDb, privateDb,
    )

    expect(countRows(publicDb, device.publicKey)).toBe(1)
    expect(countRows(privateDb, device.publicKey)).toBe(0)
    cleanup()
  })

  it('publish_to=both writes to privateDb for local ingest', () => {
    const { keyPair: owner } = generateKeyPair()
    const { keyPair: device } = generateKeyPair()
    insertDevice(privateDb, device.publicKey, owner.publicKey, 2, makePolicy(PLAIN))

    const seq = 1n; const ts = BigInt(Date.now())
    const raw = buildRaw(device.publicKey, seq, ts)
    ingestBlock(
      { deviceId: device.publicKey, seq, timestamp: ts, keyVersion: 0,
        ph: { case: 'plain', value: 7.0 }, ec: { case: 'absent' },
        waterLevel: { case: 'absent' }, tempWater: { case: 'absent' },
        tempAmbient: { case: 'absent' }, humidity: { case: 'absent' },
        signature: sign(raw, device.secretKey), raw },
      serverPubkeyHex, publicDb, privateDb, 'local',
    )

    expect(countRows(publicDb, device.publicKey)).toBe(0)
    expect(countRows(privateDb, device.publicKey)).toBe(1)
    cleanup()
  })

  it('omit disposition stores NULL for that field', () => {
    const { keyPair: owner } = generateKeyPair()
    const { keyPair: device } = generateKeyPair()
    insertDevice(publicDb, device.publicKey, owner.publicKey, 1, makePolicy(OMIT))

    const seq = 1n; const ts = BigInt(Date.now())
    const raw = buildRaw(device.publicKey, seq, ts)
    ingestBlock(
      { deviceId: device.publicKey, seq, timestamp: ts, keyVersion: 0,
        ph: { case: 'plain', value: 6.5 }, ec: { case: 'absent' },
        waterLevel: { case: 'absent' }, tempWater: { case: 'absent' },
        tempAmbient: { case: 'absent' }, humidity: { case: 'absent' },
        signature: sign(raw, device.secretKey), raw },
      serverPubkeyHex, publicDb, privateDb,
    )

    const row = publicDb
      .prepare('SELECT ph_plain FROM telemetry WHERE device_pubkey = ?')
      .get(device.publicKey) as { ph_plain: number | null }
    expect(row.ph_plain).toBeNull()
    cleanup()
  })
})

describe('ingestBlock — error cases', () => {
  it('throws DeviceNotFoundError for unknown device', () => {
    const { keyPair: device } = generateKeyPair()
    const seq = 1n; const ts = BigInt(Date.now())
    const raw = buildRaw(device.publicKey, seq, ts)

    expect(() => ingestBlock(
      { deviceId: device.publicKey, seq, timestamp: ts, keyVersion: 0,
        ph: { case: 'absent' }, ec: { case: 'absent' },
        waterLevel: { case: 'absent' }, tempWater: { case: 'absent' },
        tempAmbient: { case: 'absent' }, humidity: { case: 'absent' },
        signature: sign(raw, device.secretKey), raw },
      serverPubkeyHex, publicDb, privateDb,
    )).toThrow(DeviceNotFoundError)
    cleanup()
  })

  it('throws InvalidSignatureError for bad signature', () => {
    const { keyPair: owner } = generateKeyPair()
    const { keyPair: device } = generateKeyPair()
    insertDevice(publicDb, device.publicKey, owner.publicKey, 1, makePolicy(PLAIN))

    const seq = 1n; const ts = BigInt(Date.now())
    const raw = buildRaw(device.publicKey, seq, ts)

    expect(() => ingestBlock(
      { deviceId: device.publicKey, seq, timestamp: ts, keyVersion: 0,
        ph: { case: 'absent' }, ec: { case: 'absent' },
        waterLevel: { case: 'absent' }, tempWater: { case: 'absent' },
        tempAmbient: { case: 'absent' }, humidity: { case: 'absent' },
        signature: Buffer.alloc(64, 0xff), raw },
      serverPubkeyHex, publicDb, privateDb,
    )).toThrow(InvalidSignatureError)
    cleanup()
  })
})
