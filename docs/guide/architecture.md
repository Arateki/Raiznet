# Architecture

Raiznet is organized in three layers.

## Edge layer — ESP32 sensors

All devices run the same base firmware. The mode is determined by configuration, not hardware:

| Mode | Power | Behavior |
|---|---|---|
| `sensor_mains` | Wall power | Always on, keeps Wi-Fi active, acts as ESP-NOW relay for neighbors |
| `sensor_battery` | Battery | Sleeps most of the time, wakes on schedule (~30 min), tries Wi-Fi first then ESP-NOW |
| `gateway` | Wall power | Relay only — no sensors of its own, bridges ESP-NOW devices to Wi-Fi |

Every device has the same identity model: an Ed25519 keypair born at provisioning, stored in flash, used to sign every telemetry packet.

## Mesh layer — Node.js servers

Each server is a peer. There is no "main server". A server:

- Stores one or more **Hypercores** (append-only, signed, replicated logs)
- Discovers peers via **Hyperswarm** using SHA-256 topics
- Replicates data on demand and in the background
- Indexes readings in **local SQLite** for fast API queries
- Exposes **Fastify HTTP** on two ports: one public, one local-authenticated

A server can run anywhere Node.js runs: VPS, Raspberry Pi, Mini PC, Android via Termux, or bundled inside a Tauri desktop app.

### Dual endpoints on one process

A single `raiznet-server` process exposes two simultaneous HTTP interfaces:

| Endpoint | Default port | Access | Queries |
|---|---|---|---|
| Public | `:3000` | Anyone | `raiznet_public.db` only |
| Local | `:3001` | Owner (challenge-response auth) | Both databases combined |

This allows the owner to run a single process instead of two, while maintaining strict data isolation at the database level.

### Two databases

| Database | Fed by | Contains | Exposed to |
|---|---|---|---|
| `raiznet_public.db` | Hypercore replication | Publicly replicated data | Public + local endpoints |
| `raiznet_private.db` | Local ingest only | `local_only` devices + private fields | Local endpoint only |

**Security by isolation:** a query on the public endpoint cannot return private data because the database connection is simply not available to it. Isolation is enforced at the database level, not the API layer.

## Client layer

| Client | Description |
|---|---|
| Public gateway | A Fastify node exposed on the internet (e.g. `app.arateki.com`). Just another peer — no privileged data. |
| Desktop app (Tauri) | Bundles a full node + UI. Works offline. Future phase. |
| Mobile app | Future phase. React Native or Capacitor. |
| CLI | Operations and debugging tool. |
