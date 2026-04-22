import type { FastifyInstance } from 'fastify'
import type Database from 'better-sqlite3'
import { ingestBlock } from '../../domain/telemetry.js'
import { InvalidSignatureError, DeviceNotFoundError } from '../../domain/errors.js'

type SensorFieldInput = {
  plain?: number
  cipher?: string
  nonce?: string
}

type BlockInput = {
  deviceId: string
  seq: string
  timestamp: string
  keyVersion: number
  ph?: SensorFieldInput
  ec?: SensorFieldInput
  waterLevel?: SensorFieldInput
  tempWater?: SensorFieldInput
  tempAmbient?: SensorFieldInput
  humidity?: SensorFieldInput
  signature: string
  raw: string
}

type SensorField =
  | { case: 'plain'; value: number }
  | { case: 'encrypted'; cipher: Buffer; nonce: Buffer }
  | { case: 'absent' }

function parseField(f?: SensorFieldInput): SensorField {
  if (!f) return { case: 'absent' }
  if (f.plain !== undefined) return { case: 'plain', value: f.plain }
  if (f.cipher && f.nonce) {
    return {
      case: 'encrypted',
      cipher: Buffer.from(f.cipher, 'hex'),
      nonce: Buffer.from(f.nonce, 'hex'),
    }
  }
  return { case: 'absent' }
}

export async function registerTelemetryRoutes(
  app: FastifyInstance,
  publicDb: Database.Database,
  privateDb: Database.Database,
  serverPubkeyHex: string,
): Promise<void> {
  app.post<{ Body: { blocks: BlockInput[] } }>('/v1/telemetry', {
    schema: {
      body: {
        type: 'object',
        required: ['blocks'],
        properties: {
          blocks: { type: 'array', minItems: 1, maxItems: 100 },
        },
      },
    },
  }, async (request, reply) => {
    const { blocks } = request.body
    const errors: { seq: string; error: string }[] = []

    for (const b of blocks) {
      try {
        ingestBlock(
          {
            deviceId:    Buffer.from(b.deviceId, 'hex'),
            seq:         BigInt(b.seq),
            timestamp:   BigInt(b.timestamp),
            keyVersion:  b.keyVersion,
            ph:          parseField(b.ph),
            ec:          parseField(b.ec),
            waterLevel:  parseField(b.waterLevel),
            tempWater:   parseField(b.tempWater),
            tempAmbient: parseField(b.tempAmbient),
            humidity:    parseField(b.humidity),
            signature:   Buffer.from(b.signature, 'hex'),
            raw:         Buffer.from(b.raw, 'hex'),
          },
          serverPubkeyHex,
          publicDb,
          privateDb,
        )
      } catch (err) {
        if (err instanceof DeviceNotFoundError || err instanceof InvalidSignatureError) {
          errors.push({ seq: b.seq, error: err.message })
        } else {
          throw err
        }
      }
    }

    return reply.code(errors.length === 0 ? 200 : 207).send({
      accepted: blocks.length - errors.length,
      errors,
    })
  })
}
