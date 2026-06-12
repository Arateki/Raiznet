# Roadmap

Raiznet is pre-1.0. This page is the honest map of what exists versus what is designed — every other page in these docs marks design-stage features accordingly.

## Implemented today

- **Signed telemetry ingestion** — Ed25519 signature over a deterministic [raw string](/protocol/telemetry#the-signed-raw-string), verified against the registered device key; idempotent batched ingest.
- **Device registry** — `POST /v1/devices` with lazy registration from the firmware.
- **Per-field privacy** — `plain` / `encrypted` / `omit` dispositions with per-destination overrides, enforced at ingestion ([Privacy Model](/protocol/privacy)).
- **Dual endpoints, dual databases** — public (`:3000`, `raiznet_public.db`) and local (`:3001`, `raiznet_private.db`) in one process, isolated at the database level.
- **Node identity** — BIP-39 mnemonic at `DATA_DIR/identity.mnemonic`, Ed25519 keypair derived deterministically.
- **Reference firmware** — ESP32 captive-portal provisioning, BIP-39 owner identity, flash-wear-aware `seq` management, retransmission until confirmation.

## In design

These are specified (in this documentation and in ADRs) but not implemented. Details may change:

- **Rust node (`raiznetd`)** — behaviour-parity reimplementation of the node as a static single binary, targeting very small ARM boards with no runtime dependencies.
- **Signed event log** — append-only, hash-chained log per node as the source of truth, with SQLite rebuilt from it as a derived index ([ADR-002](/adr/002-sqlite-cache)).
- **Node-to-node replication** ([ADR-004](/adr/004-raiznet-native-replication)) — sync v1: HTTP pull between configured peers (LAN, VPN, public IP); sync v2: dial-by-pubkey transport built on an existing Rust P2P foundation (iroh as primary candidate, validated on real rural 4G/CGNAT links before adoption), with community-runnable relays — never a privileged gateway.
- **Networks, filters and catalogs** — topics, `NetworkManifest`, composable MAC filters, `CropCatalog` ([Networks & Filters](/protocol/networks)).
- **Local endpoint authentication** — owner challenge-response with the User key ([Local API](/reference/local-api)).
- **Combined owner view** — merging public + private readings by `(device_pubkey, seq)` on the local endpoint.
- **Canonical Protobuf encoding** — binary wire format from the schemas in [Proto Schemas](/reference/proto-schemas); JSON stays for compatibility ([ADR-001](/adr/001-protobuf)).
- **Ingestion hardening** — strict cross-check between the signed raw string and the JSON convenience fields.
- **ESP-NOW device mesh** — battery sensors relaying through mains-powered neighbors.

## Future

- **DeviceClaim / DeviceTransfer** — ownership chain events ([Device Lifecycle](/protocol/device-lifecycle)).
- **Desktop app (Tauri)** bundling a full node, and a mobile app.
- **Intelligence layer** — MCP server over the local endpoint, regional aggregations, collective crop calibration ([Collective Intelligence](/guide/intelligence)).

## Compatibility policy

The contracts documented in the [Public API](/reference/public-api) and [Telemetry](/protocol/telemetry) pages are treated as frozen for the current firmware generation: changes that would break a device in the field (status codes, duplicate semantics, the raw string grammar) are made only behind explicit versioning.
