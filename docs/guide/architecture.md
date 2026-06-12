# Architecture

Raiznet is organized in three layers. This page distinguishes what runs **today** from what is **in design** — see the [Roadmap](/guide/roadmap) for the full picture.

## Edge layer — ESP32 sensors

All devices run the same base firmware. The mode is determined by configuration, not hardware:

| Mode | Power | Behavior |
|---|---|---|
| `sensor_mains` | Wall power | Always on, keeps Wi-Fi active; future ESP-NOW relay for neighbors |
| `sensor_battery` | Battery | Sleeps most of the time, wakes on schedule |
| `gateway` | Wall power | Relay only — bridges ESP-NOW devices to Wi-Fi (planned) |

Every device has the same identity model: an Ed25519 keypair born at provisioning (hardware TRNG), stored in flash, used to sign every telemetry packet. The reference firmware also generates the owner identity from a BIP-39 mnemonic in its captive portal — see [Device Lifecycle](/protocol/device-lifecycle).

## Mesh layer — server nodes

Each server is a peer. There is no "main server". What a node does **today**:

- Receives signed telemetry over HTTP (`POST /v1/telemetry`) and validates every signature
- Applies the per-field [privacy policy](/protocol/privacy) at ingestion
- Stores readings in **two local SQLite databases** (public / private)
- Exposes the HTTP API on two ports: one public, one local

**In design** ([ADR-004](/adr/004-raiznet-native-replication)): nodes will persist public data as a signed append-only event log and replicate it peer-to-peer with other nodes in the same [network](/protocol/networks) — first between configured peers over HTTP, then via a dial-by-pubkey transport with community-runnable relays. Replication is not implemented yet — today, nodes are independent.

A server can run anywhere Node.js runs: VPS, Raspberry Pi, Mini PC, Android via Termux. A Rust reimplementation of the node (`raiznetd`) is underway to target very small ARM boards with a static binary — see the [Roadmap](/guide/roadmap).

### Dual endpoints on one process

A single server process exposes two HTTP interfaces:

| Endpoint | Default port | Bind | Devices routes hit | Auth |
|---|---|---|---|---|
| Public | `:3000` | `0.0.0.0` | `raiznet_public.db` | None (public data only) |
| Local | `:3001` | `127.0.0.1` | `raiznet_private.db` | None yet — **planned:** owner challenge-response |

::: warning
Until owner authentication ships, the local endpoint's only protection is its loopback bind. Reach it remotely via Tailscale/VPN — never expose it directly.
:::

### Two databases

| Database | Fed by | Contains | Served by |
|---|---|---|---|
| `raiznet_public.db` | Public ingest (replication planned) | Devices and readings publishable to networks | Public endpoint |
| `raiznet_private.db` | Local ingest only | `local_only` devices + fields kept off the public side | Local endpoint only |

**Security by isolation:** a query on the public endpoint cannot return private data because the private database connection is simply not available to it. Isolation is enforced at the database level, not the API layer.

## Client layer

| Client | Description | Status |
|---|---|---|
| CLI | Operations and debugging tool | In repo |
| Web dashboard | Visualization UI | In repo |
| Public gateway | A node exposed on the internet — just another peer, no privileged data | Planned |
| Desktop app (Tauri) | Bundles a full node + UI, works offline | Future phase |
| Mobile app | React Native or Capacitor | Future phase |
