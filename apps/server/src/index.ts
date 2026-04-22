import Fastify from 'fastify'
import { loadConfig } from './config.js'
import { loadOrCreateIdentity } from './identity.js'
import { openPublicDb } from './storage/public-db.js'
import { openPrivateDb } from './storage/private-db.js'
import { registerHealthRoutes } from './http/health.js'
import { registerTelemetryRoutes } from './http/public/telemetry.js'
import { registerDeviceRoutes } from './http/public/devices.js'

const config = loadConfig()

const identity = loadOrCreateIdentity(config.DATA_DIR)
const serverPubkeyHex = identity.publicKey.toString('hex')

const publicDb = openPublicDb(config.DATA_DIR)
const privateDb = openPrivateDb(config.DATA_DIR)

const publicApp = Fastify({ logger: { level: config.LOG_LEVEL } })
const localApp  = Fastify({ logger: { level: config.LOG_LEVEL } })

await registerHealthRoutes(publicApp)
await registerHealthRoutes(localApp)
await registerTelemetryRoutes(publicApp, publicDb, privateDb, serverPubkeyHex)
await registerDeviceRoutes(publicApp, publicDb)

await publicApp.listen({ port: config.PUBLIC_PORT, host: '0.0.0.0' })
await localApp.listen({ port: config.LOCAL_PORT, host: '127.0.0.1' })

publicApp.log.info({ pubkey: serverPubkeyHex }, 'raiznet server started')
