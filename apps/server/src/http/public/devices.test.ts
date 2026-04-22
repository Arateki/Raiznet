import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generateKeyPair } from '@raiznet/crypto'
import { openPublicDb } from '../../storage/public-db.js'
import { registerDeviceRoutes } from './devices.js'
import type Database from 'better-sqlite3'

let app: ReturnType<typeof Fastify>
let publicDb: Database.Database
let dataDir: string
let devicePubkey: Buffer
let ownerPubkey: Buffer

beforeAll(async () => {
  dataDir   = mkdtempSync(join(tmpdir(), 'raiznet-devices-test-'))
  publicDb  = openPublicDb(dataDir)

  const { keyPair: owner }  = generateKeyPair()
  const { keyPair: device } = generateKeyPair()
  ownerPubkey  = owner.publicKey
  devicePubkey = device.publicKey

  publicDb.prepare('INSERT INTO users (pubkey, name, created_at) VALUES (?, ?, ?)').run(ownerPubkey, 'Owner', Date.now())
  publicDb.prepare(`
    INSERT INTO devices (pubkey, mac, owner_pubkey, name, type, publish_to, privacy_policy, hardware, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    devicePubkey,
    Buffer.from('aabbccddee01', 'hex'),
    ownerPubkey,
    'Tower 01',
    0,
    1,
    JSON.stringify({}),
    JSON.stringify({ model: 'ESP32-S3', firmware_version: '0.1.0' }),
    Date.now(),
  )

  app = Fastify({ logger: false })
  await registerDeviceRoutes(app, publicDb)
  await app.ready()
})

afterAll(async () => {
  await app.close()
  publicDb.close()
  rmSync(dataDir, { recursive: true })
})

describe('GET /v1/devices', () => {
  it('returns the list with the registered device', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/devices' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { devices: { id: string; name: string }[] }
    expect(body.devices).toHaveLength(1)
    expect(body.devices[0]?.id).toBe(devicePubkey.toString('hex'))
    expect(body.devices[0]?.name).toBe('Tower 01')
  })
})

describe('GET /v1/devices/:id', () => {
  it('returns the device details', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/devices/${devicePubkey.toString('hex')}` })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { device: { id: string; hardware: { model: string } } }
    expect(body.device.id).toBe(devicePubkey.toString('hex'))
    expect(body.device.hardware.model).toBe('ESP32-S3')
  })

  it('returns 404 for an unknown device', async () => {
    const { keyPair: unknown } = generateKeyPair()
    const res = await app.inject({ method: 'GET', url: `/v1/devices/${unknown.publicKey.toString('hex')}` })
    expect(res.statusCode).toBe(404)
  })
})

describe('GET /v1/devices/:id/telemetry', () => {
  it('returns empty readings for a device with no telemetry', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/devices/${devicePubkey.toString('hex')}/telemetry` })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { readings: unknown[] }
    expect(body.readings).toHaveLength(0)
  })
})

describe('POST /v1/devices', () => {
  it('registers a new device and returns 201 with the device', async () => {
    const { keyPair: newOwner }  = generateKeyPair()
    const { keyPair: newDevice } = generateKeyPair()

    const res = await app.inject({
      method: 'POST',
      url: '/v1/devices',
      payload: {
        id:          newDevice.publicKey.toString('hex'),
        mac:         'aabbccddee02',
        ownerPubkey: newOwner.publicKey.toString('hex'),
        ownerName:   'New Grower',
        name:        'Tower 02 - Basil',
        type:        0,
        publishTo:   1,
        hardware:    { model: 'ESP32-S3', firmware_version: '1.0.0' },
      },
    })

    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body) as { device: { id: string; name: string; hardware: { model: string } } }
    expect(body.device.id).toBe(newDevice.publicKey.toString('hex'))
    expect(body.device.name).toBe('Tower 02 - Basil')
    expect(body.device.hardware.model).toBe('ESP32-S3')
  })

  it('returns 409 if the device is already registered', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/devices',
      payload: {
        id:          devicePubkey.toString('hex'),
        mac:         'aabbccddee01',
        ownerPubkey: ownerPubkey.toString('hex'),
        name:        'Duplicate',
        type:        0,
        publishTo:   1,
      },
    })

    expect(res.statusCode).toBe(409)
    const body = JSON.parse(res.body) as { error: string }
    expect(body.error).toBe('device_already_exists')
  })

  it('returns 400 for a missing required field', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/devices',
      payload: {
        // missing id, mac, ownerPubkey, name
        type: 0,
      },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body) as { error: string }
    expect(body.error).toBe('validation_error')
  })

  it('uses default PLAIN privacy policy when none is provided', async () => {
    const { keyPair: owner }  = generateKeyPair()
    const { keyPair: device } = generateKeyPair()

    await app.inject({
      method: 'POST',
      url: '/v1/devices',
      payload: {
        id:          device.publicKey.toString('hex'),
        mac:         'aabbccddee03',
        ownerPubkey: owner.publicKey.toString('hex'),
        name:        'Tower 03',
        type:        0,
        publishTo:   1,
      },
    })

    const getRes = await app.inject({
      method: 'GET',
      url: `/v1/devices/${device.publicKey.toString('hex')}`,
    })

    expect(getRes.statusCode).toBe(200)
    const body = JSON.parse(getRes.body) as { device: { id: string } }
    expect(body.device.id).toBe(device.publicKey.toString('hex'))
  })
})
