import type { FastifyInstance } from 'fastify'
import type Database from 'better-sqlite3'
import { z } from 'zod'

type DeviceRow = {
  pubkey: Buffer
  mac: Buffer
  owner_pubkey: Buffer
  name: string
  type: number
  location: number | null
  status: number
  hardware: string
  created_at: number
}

type TelemetryRow = {
  seq: number
  timestamp: number
  received_at: number
  ph_plain: number | null;           ph_cipher: Buffer | null
  ec_plain: number | null;           ec_cipher: Buffer | null
  water_level_plain: number | null;  water_level_cipher: Buffer | null
  temp_water_plain: number | null;   temp_water_cipher: Buffer | null
  temp_ambient_plain: number | null; temp_ambient_cipher: Buffer | null
  humidity_plain: number | null;     humidity_cipher: Buffer | null
}

function formatField(plain: number | null, cipher: Buffer | null) {
  if (plain !== null) return { value: plain }
  if (cipher !== null) return { encrypted: cipher.toString('hex') }
  return null
}

function formatDevice(r: DeviceRow) {
  return {
    id:          r.pubkey.toString('hex'),
    mac:         r.mac.toString('hex'),
    ownerPubkey: r.owner_pubkey.toString('hex'),
    name:        r.name,
    type:        r.type,
    location:    r.location,
    status:      r.status,
    hardware:    JSON.parse(r.hardware) as Record<string, string>,
    createdAt:   r.created_at,
  }
}

const FieldPolicySchema = z.object({
  default_disposition: z.number().int().min(0).max(2),
  per_destination:     z.record(z.number().int().min(0).max(2)).default({}),
})

const RegisterDeviceBody = z.object({
  id:            z.string().length(64),
  mac:           z.string().length(12),
  ownerPubkey:   z.string().length(64),
  ownerName:     z.string().optional(),
  name:          z.string().min(1),
  type:          z.number().int().min(0).max(2).default(0),
  publishTo:     z.number().int().min(0).max(2).default(1),
  location:      z.number().optional(),
  networks:      z.array(z.string()).default([]),
  localServers:  z.array(z.string()).default([]),
  privacyPolicy: z.object({
    ph:          FieldPolicySchema.optional(),
    ec:          FieldPolicySchema.optional(),
    water_level: FieldPolicySchema.optional(),
    temp_water:  FieldPolicySchema.optional(),
    temp_ambient:FieldPolicySchema.optional(),
    humidity:    FieldPolicySchema.optional(),
  }).optional(),
  hardware: z.object({
    model:            z.string(),
    firmware_version: z.string(),
  }).optional(),
})

const DEFAULT_PRIVACY_POLICY = {
  ph:          { default_disposition: 1, per_destination: {} },
  ec:          { default_disposition: 1, per_destination: {} },
  water_level: { default_disposition: 1, per_destination: {} },
  temp_water:  { default_disposition: 1, per_destination: {} },
  temp_ambient:{ default_disposition: 1, per_destination: {} },
  humidity:    { default_disposition: 1, per_destination: {} },
}

export async function registerDeviceRoutes(
  app: FastifyInstance,
  publicDb: Database.Database,
): Promise<void> {
  app.post('/v1/devices', async (request, reply) => {
    const result = RegisterDeviceBody.safeParse(request.body)
    if (!result.success) {
      return reply.code(400).send({ error: 'validation_error', details: result.error.issues })
    }

    const b = result.data
    const devicePubkey = Buffer.from(b.id, 'hex')
    const ownerPubkey  = Buffer.from(b.ownerPubkey, 'hex')
    const mac          = Buffer.from(b.mac, 'hex')

    const existing = publicDb
      .prepare('SELECT pubkey FROM devices WHERE pubkey = ?')
      .get(devicePubkey)
    if (existing) {
      return reply.code(409).send({ error: 'device_already_exists' })
    }

    // upsert owner — allows registering a device without a prior user creation step
    publicDb.prepare(`
      INSERT INTO users (pubkey, name, created_at)
      VALUES (?, ?, ?)
      ON CONFLICT (pubkey) DO NOTHING
    `).run(ownerPubkey, b.ownerName ?? b.ownerPubkey.slice(0, 12), Date.now())

    const now = Date.now()
    publicDb.prepare(`
      INSERT INTO devices
        (pubkey, mac, owner_pubkey, name, type, publish_to, location,
         networks, local_servers, privacy_policy, hardware, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      devicePubkey,
      mac,
      ownerPubkey,
      b.name,
      b.type,
      b.publishTo,
      b.location ?? null,
      JSON.stringify(b.networks),
      JSON.stringify(b.localServers),
      JSON.stringify(b.privacyPolicy ?? DEFAULT_PRIVACY_POLICY),
      JSON.stringify(b.hardware ?? {}),
      now,
    )

    const row = publicDb
      .prepare('SELECT pubkey, mac, owner_pubkey, name, type, location, status, hardware, created_at FROM devices WHERE pubkey = ?')
      .get(devicePubkey) as DeviceRow

    return reply.code(201).send({ device: formatDevice(row) })
  })

  app.get('/v1/devices', async (_request, reply) => {
    const rows = publicDb
      .prepare(`
        SELECT pubkey, mac, owner_pubkey, name, type, location, status, hardware, created_at
        FROM devices
      `)
      .all() as DeviceRow[]

    return reply.send({ devices: rows.map(formatDevice) })
  })

  app.get<{ Params: { id: string } }>('/v1/devices/:id', async (request, reply) => {
    const pubkey = Buffer.from(request.params.id, 'hex')
    const row = publicDb
      .prepare(`
        SELECT pubkey, mac, owner_pubkey, name, type, location, status, hardware, created_at
        FROM devices WHERE pubkey = ?
      `)
      .get(pubkey) as DeviceRow | undefined

    if (!row) return reply.code(404).send({ error: 'Device not found' })
    return reply.send({ device: formatDevice(row) })
  })

  app.get<{ Params: { id: string } }>('/v1/devices/:id/telemetry', async (request, reply) => {
    const pubkey = Buffer.from(request.params.id, 'hex')

    const rows = publicDb
      .prepare(`
        SELECT seq, timestamp, received_at,
          ph_plain, ph_cipher,
          ec_plain, ec_cipher,
          water_level_plain, water_level_cipher,
          temp_water_plain, temp_water_cipher,
          temp_ambient_plain, temp_ambient_cipher,
          humidity_plain, humidity_cipher
        FROM telemetry
        WHERE device_pubkey = ?
        ORDER BY timestamp DESC
        LIMIT 500
      `)
      .all(pubkey) as TelemetryRow[]

    return reply.send({
      readings: rows.map((r) => ({
        seq:         r.seq,
        timestamp:   r.timestamp,
        receivedAt:  r.received_at,
        ph:          formatField(r.ph_plain, r.ph_cipher),
        ec:          formatField(r.ec_plain, r.ec_cipher),
        waterLevel:  formatField(r.water_level_plain, r.water_level_cipher),
        tempWater:   formatField(r.temp_water_plain, r.temp_water_cipher),
        tempAmbient: formatField(r.temp_ambient_plain, r.temp_ambient_cipher),
        humidity:    formatField(r.humidity_plain, r.humidity_cipher),
      })),
    })
  })
}
