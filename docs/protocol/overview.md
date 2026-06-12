# Protocol Overview

Raiznet defines a layered protocol for decentralized crop monitoring. This page describes the communication stack from the ESP32 sensor to the server — as it is implemented today — and where the protocol is heading.

## Layers

```
┌──────────────────────────────────────────┐
│        Application  (HTTP JSON API)      │
├──────────────────────────────────────────┤
│   Wire format  (JSON + signed raw string)│
├──────────────────────────────────────────┤
│        Transport  (HTTP POST)            │
├──────────────────────────────────────────┤
│          Identity  (Ed25519)             │
└──────────────────────────────────────────┘
```

Planned additions: a canonical Protobuf encoding ([ADR-001](/adr/001-protobuf)), ESP-NOW device-to-device mesh, and server-to-server replication of a signed event log ([ADR-004](/adr/004-raiznet-native-replication) — see the [Roadmap](/guide/roadmap)).

## Wire format

The current wire format is **JSON over HTTP**, with one crucial detail: the JSON is a transport envelope, and the **signed message is a separate pipe-delimited ASCII string** called `raw`.

```
<device_pubkey_hex>|<seq>|<timestamp_ms>|<key_version>[|ec=<v>][|ph=<v>][|waterLevel=<v>][|tempAmbient=<v>][|humidity=<v>]
```

The device signs the UTF-8 bytes of this string with its Ed25519 key and ships both the hex-encoded `raw` and the `signature` inside the JSON block. The server verifies the signature against the device's **registered** pubkey. See [Telemetry](/protocol/telemetry) for the full grammar.

Protobuf schemas for a canonical binary encoding already exist in `packages/protocol/proto/` but are not used on the wire yet — see [Proto Schemas](/reference/proto-schemas).

## Transport by hop

| Hop | Protocol | Status |
|---|---|---|
| ESP32 → Server | HTTP POST (`/v1/telemetry`, JSON) | **Implemented** |
| ESP32 → ESP32 (mesh) | ESP-NOW on the Wi-Fi channel | Planned |
| Server → Server | Signed event log replication | In design ([ADR-004](/adr/004-raiznet-native-replication)) |

HTTP was chosen for the ESP32 → Server hop because sensors send infrequently (the reference firmware defaults to one reading per minute; battery devices will sleep far longer). A persistent connection (WebSocket, MQTT) would be held open for nothing and would drain battery. Stateless HTTP POST is the correct model for infrequent, fire-and-forget ingest.

## Packet lifecycle

What happens to a reading today:

```
ESP32 reads sensors
  → builds the raw string and signs it (Ed25519, device key)
  → wraps raw + signature + plain/encrypted fields in a JSON block
  → POST /v1/telemetry (batched, 1..100 blocks)

Server receives the batch, per block:
  → looks up the device in the destination database
  → verifies the signature over the raw bytes
  → resolves each field's disposition (plain / encrypted / omit)
  → inserts into raiznet_public.db or raiznet_private.db
     (INSERT OR IGNORE — duplicates are idempotent)
```

The replication step (appending public blocks to a signed log and syncing it between nodes) is the next protocol phase and is not implemented yet.

## Identifiers

Every entity is identified by its **Ed25519 public key** (32 bytes), serialized as lowercase hex in JSON. There are no auto-incremented integers in the protocol.

| Entity | ID source | Status |
|---|---|---|
| User | Pubkey derived from a BIP-39 seed | Implemented |
| Server | Pubkey generated at first boot (`identity.mnemonic`) | Implemented |
| Device | Pubkey generated at provisioning (hardware TRNG) | Implemented |
| Filter / Catalog | Pubkey of its published log | Design |

## Sequence numbers

Each device maintains a monotonically increasing `seq` counter:

- To protect flash from wear, the reference firmware reserves `seq` in **blocks of 100**: it persists only the start of the next block to NVS. After a reboot the device resumes from the next reserved block — small gaps in `seq` are normal and expected.
- The device keeps recent readings in a RAM ring buffer and **re-sends everything not yet confirmed with an HTTP `200`**. The server deduplicates by `(device_pubkey, seq)`, so retransmission is always safe.
- The server does **not** enforce monotonicity — rejecting older seqs would break recovery after a reconnection.

Readings that age out of the device buffer before syncing are lost from the network — unless the owner pulls them directly from the device via local HTTP, BLE, or serial.
