# Raiznet — project guide

This document is the source of truth for Raiznet development. Read it in full before proposing structural changes. Keep this file updated when architecture decisions change.

---

## 1. Overview

Raiznet is a decentralized network for crop monitoring and collective agricultural intelligence. It is part of Arateki's SafraSense product. Data comes from ESP32 sensors installed in PVC towers (or equivalent), flows through a mesh of Node.js servers that sync with each other via the Hypercore protocol, and can be read by the members of each network — with or without their own node.

Beyond monitoring, Raiznet is designed as a research-grade data infrastructure: signed, tamper-evident, geolocated, and outcome-tracked. The long-term vision is a feedback loop where growers generate data, LLMs and researchers extract knowledge from it, and that knowledge returns to the network as improved Crops, regional catalogs, and published Materials — owned by no one, available to everyone.

**Non-negotiable principles:**

1. **Local-first.** The network works without internet. An ESP32 and a laptop on a local Wi-Fi are already a valid Raiznet.
2. **Data sovereignty.** The user owns the keys. If Arateki disappears tomorrow, the grower's data stays alive in their node.
3. **No traditional login.** Identity is an Ed25519 keypair generated on the client. There is no central authentication server.
4. **Device ID is always public.** The only information guaranteed as public is the existence of the device in the network it participates in — its pubkey, MAC and basic metadata. Everything else (including each value of each reading) has individual visibility policy, defined by the owner.
5. **Private data is local data.** What is marked as public goes to the Hypercore replicated to the network. What is marked as private **does not enter the swarm** — it stays in local storage of the owner's server, or in the ESP32 itself, and is only visible to whoever has direct physical/logical access (private key in the app, local IP of the ESP, Bluetooth).
6. **Public network or local network.** The public Raiznet is the global (or regional) mesh discovered via Hyperswarm. "Private network" means local network: the server doesn't announce on the swarm, it only serves connections from the local Wi-Fi network. A device can publish to both.
7. **Writes are always signed.** Reading is a consequence of belonging to the network. Writing requires the private key of the emitting device — prevents spam without depending on central permission.
8. **Server is optional.** No one is required to run a node. But whoever runs one strengthens the network.

---

## 2. Three-layer architecture

### Edge layer — ESP32 hardware

All devices use the same base firmware. The difference is configuration:

- **Identity & Sovereignty**: The ESP32 implements BIP-39 (12 words) to generate or import the Owner's Identity. It uses its internal hardware RNG (TRNG) for entropy. The Device Identity (hardware-bound) and Owner Identity (user-bound) are distinct Ed25519 keypairs.
- **Modularity**: The firmware is divided into specialized modules: `identity` (keys/mnemonics), `device` (lifecycle/registry), `telemetry` (buffers/sending), and `i18n` (translations).
- **Internationalization**: Full support for Portuguese (PT), English (EN), and Spanish (ES) in the captive portal and mnemonic generation.
- **Flash & Partitioning**: Uses `min_spiffs.csv` providing 1.9MB for the application, ensuring enough space for 2048-word BIP-39 lists across multiple languages while preserving **OTA (Over-The-Air)** update capabilities.

**Firmware is a separate product repo.** The production firmware for Arateki's SafraSense hardware lives in a dedicated repository outside Raiznet. The `firmware/` folder in this repo is a **reference implementation** — a minimal working ESP32 sensor that demonstrates how to speak the Raiznet protocol (Ed25519 signing, HTTP POST to `/v1/telemetry`, automatic registration). It serves as a starting point for anyone building a Raiznet-compatible device without using Arateki hardware.

### Mesh layer — Node.js servers

Each server is a peer of the network. There is no "main server". A server:

- Stores one or more **Hypercores** (append-only logs).
- Discovers other peers via **Hyperswarm** using SHA-256 topics.
- Replicates data on demand and in the background.
- Indexes readings in **local SQLite** to serve fast queries via API.
- Exposes **Fastify HTTP/WebSocket** for consumers (apps, web, other scripts).

A server can run on: VPS, Raspberry Pi, Mini PC, Android via Termux, desktop as part of a Tauri app.

### Client layer — visualization

- **Optional public gateway** (`app.arateki.com`): a Fastify node exposed on the internet for those who don't want to install anything. It's just another peer; it has no privileged data.
- **Desktop app (Tauri)**: bundles a full node + UI. Runs offline.
- **Mobile app**: future. Could be React Native or Capacitor; full node via Termux or light node via WebRTC.
- **CLI**: for debugging and operations.

---

## 3. Identity and cryptography

Key generation on first use of any client:

- Library: `hypercore-crypto` (or `sodium-universal` directly).
- Algorithm: Ed25519.
- The **public key** is the user's ID and appears everywhere.
- The **private key** is stored encrypted by the OS:
  - Desktop: keychain via Tauri or AES-256-GCM file protected by password.
  - Mobile: native Keystore/Keychain.
  - Server: file on disk with permission 0600, protected by passphrase or environment variable.
- BIP-39 seed phrase **must** be shown to the user on creation, for backup.

ESP32 provisioning: the device receives the user's private key via BLE or Serial in a setup flow. From then on, it signs all telemetry.

---

## 4. Data model

The fields below are the logical schema. The physical schema (Protobuf) will be derived from this in `packages/protocol`.

### User
```
id: bytes(32)              // Ed25519 pubkey, derived from the user's BIP-39 seed
name: string               // human handle
contact: optional {        // anyone can fill in, all fields are optional
  phone: string,
  email: string,
  website: string,
  bio: string
}
created_at: uint64         // unix ms
```

The User's key is the **root of authority** of the owner over their devices. It is derived from a BIP-39 seed phrase of 12 or 24 words that the user must keep in a safe place (paper, safe, password manager). Losing the seed = losing the account. There is no custody nor centralized recovery — it is inherent to the cypherpunk model.

The key is used for:
- Signing `DeviceClaim` when provisioning a new device.
- Signing `DeviceTransfer` in case of device sale.
- Signing curation events in filters that the User maintains.
- Signing the `NetworkManifest` if the User is the founder of a network.

It is never used to sign telemetry — that is the role of the Device's private key, which is born with the hardware and lives there.

### Network  (federated model by topic)

A public network in Raiznet is identified by a **topic** — a known string like `raiznet:public:arateki:v1` or `raiznet:public:coop-verdao:v1`. Any node can join an existing network by connecting to its topic, or create a new network by choosing a new topic. A single node can participate in multiple networks simultaneously.

**Private network = local network.** Server running in `local_only` mode doesn't touch any topic, it only accepts connections on the LAN. Topic doesn't really keep a secret (one member leaking is enough), so real privacy is local.

Server operation modes:
- `public`: connects to one or more topics and replicates data with the peers of each network.
- `local_only`: doesn't touch swarm. Invisible externally.
- `hybrid`: is connected to public topics, but each individual device decides via `publish_to` whether it publishes outward or not.

**Founder and manifest.** Whoever creates a network is the founder: publishes in their own public core a `NetworkManifest` event signed with their User key, containing readable name, description, and optionally the pubkey of the default filter that new members activate upon joining. The manifest can be updated over time (new append-only events overwrite the state). If someone disagrees with the manifest or wants different rules, they create their own network with another topic — it's a light fork.

**Replication is always total.** Every server replicates all device cores it discovers in a network. There is no per-device replication filter. Filters are a query-time lens — they control what appears in API responses, maps, and aggregations, but do not affect what is stored. This keeps the network robust and avoids data fragmentation where only "approved" nodes hold certain data.

The founder's `default_filter_pubkey` is activated by default on new servers joining the network and receives UI priority (shown first in filter lists). This is the only distinction a founder has — there is no technical privilege beyond authoring the manifest.

Arateki maintains the `raiznet:public:arateki:v1` network as the initial official network, with its default filter of verified MACs. New networks can be born from cooperatives, research collectives, institutions, without asking permission.

### Device
```
id: bytes(32)              // device pubkey (not the MAC)
mac: bytes(6)              // physical MAC, identity anchor
owner_pubkey: bytes(32)    // FK to User
name: string               // e.g., "Tower 01 - Lettuce"
type: enum                 // sensor_mains | sensor_battery | gateway
location: h3_cell?         // H3 cell, granularity chosen by the owner
publish_to: enum           // local_only | public | both
networks: string[]         // topics of public networks where it publishes (if public|both)
encryption_key_version: uint16  // current version of the device's symmetric key
privacy_policy: {          // visibility policy per field, with dual dimension
  ph: field_policy,
  ec: field_policy,
  water_level: field_policy,
  temp_water: field_policy,
  temp_ambient: field_policy,
  humidity: field_policy,
  ...
}
hardware: {
  model: string,
  firmware_version: string
}
status: enum               // active | inactive | lost
created_at: uint64
```

Where `field_policy` is:
```
{
  default_disposition: disposition,          // applies to any destination not listed below
  per_destination: map<string, disposition>  // key = server pubkey (hex) or network topic
}
```

The UI presents this with three levels of granularity, all backed by the same map model:
- **Same for all** — `default_disposition` set, map empty. One rule applies everywhere.
- **Public vs local** — two entries in the map grouping by class (all local servers share one rule, all public networks share another).
- **Per destination (advanced)** — one entry per server pubkey or network topic.

This avoids the need for "two logical devices" as a workaround and allows future per-destination rules without breaking the schema.

And `h3_cell` is a 64-bit integer identifying an H3 cell (see section 5).

**About location.** The device has **a single** location, which is the H3 cell of the granularity the owner chose. If the owner wants to be vague ("east zone of Fortaleza"), they choose resolution 7. If they want farm precision, 9. If they want bed precision, 11. There are no two locations, one public and another private — if the owner needs the exact real-world location to operate the sensor, that stays in SafraSense's local software (the owner's app), not in the network.

**Three levels of privacy per field:**

Each field has a `FieldPolicy` with a `default_disposition` (applies to all destinations not explicitly listed) and an optional `per_destination` map for granular control. The three possible dispositions:

- **`plain`**: the value travels in clear. Visible to all peers on that destination and eligible for aggregation into filters, maps, and metrics.
- **`encrypted`**: the value is encrypted with AES-256-GCM using the device's symmetric key and a per-field nonce. The encrypted blob travels normally, but only whoever has the symmetric key can read it. **Encrypted values never enter network metrics** — aggregators ignore opaque blobs.
- **`omit`**: the field is not sent to that destination.

**`local_servers` as the differentiator between ESP32-only and local server:**

The device's `local_servers` list (configured at provisioning) determines where "local" data goes:

- `local_servers` **empty** → the `omit` disposition for local destinations means the value stays only in the ESP32 flash (accessible via BLE/serial/local HTTP). There is no local server to receive it.
- `local_servers` **populated** → local data flows to those servers according to the field's policy. Each server is independent — they do not replicate with each other unless connected to a shared public network topic.

Users without a server never need to configure `local_servers`. The app communicates this clearly: "To send local data to a server, you need a Raiznet node running on your network."

When the device has `publish_to: local_only`, only local destinations (entries in `local_servers`) are used. When it has `publish_to: public`, only public network topics are used. When it has `publish_to: both`, all destinations apply and each can have its own disposition via `per_destination`.

**Structural visibility rules:**

- `id`, `mac`, `owner_pubkey`, `type`, `location` and `hardware` are always public when the device publishes (`publish_to: public | both`). They are metadata necessary for the network to know the device exists and act on aggregations.
- Changing the policy only affects future readings. Already published data (clear or encrypted) remains replicated — there is no way to "unpublish" what peers have already downloaded.
- Rotation of the device's symmetric key increments `encryption_key_version`. New readings use the new key; old readings remain legible with the old keys, kept in a keyring in the owner's app.

**Device symmetric key.** It is generated at provisioning along with the signing private key. It is stored in the ESP32's flash (to encrypt) and in a copy in the owner's app keychain (to decrypt). It is recommended to derive it deterministically from the User's BIP-39 seed combined with the device's pubkey, so that recovering the seed automatically recovers all symmetric keys of all the owner's devices.

### Filter  (composable MAC curation)

Only **server nodes** (not client-only apps) can publish filters. Each filter is a dedicated Hypercore — an append-only list of curation events signed with the User key of the server's maintainer.

Each filter is a sequence of events:
```
type: enum                 // mac_verified | mac_flagged | mac_banned | mac_unflagged
mac: bytes(6)
target_pubkey: bytes(32)?  // optional: restricts to the specific (mac, pubkey) pair
reason: string?
created_at: uint64
signature: bytes(64)       // signed by the filter author's User key
```

The current state of the filter is the projection of events up to the moment. Adding or removing MACs is just publishing a new event — there is never "destructive" editing.

**Filter metadata** (initial event or updatable in the core itself):
```
id: bytes(32)              // pubkey of the filter's core
author_pubkey: bytes(32)   // author's User key
name: string               // "Official Arateki filter"
description: string?
semantic: enum             // allowlist | denylist | mixed
created_at: uint64
```

**Client composition.** The app (or an intermediate server) chooses which filters to apply and how:
- No filter → sees the raw network, including spam.
- One filter (default) → the label of the network's founder. User-friendly choice.
- Union of several → MACs verified by any selected filter are accepted (maximum coverage).
- Intersection → MACs need to be in all filters (maximum rigor, for research).
- Negative filters → hides MACs marked as spam in any of them.

**Default policy when joining a network.** The network's founder can declare in the `NetworkManifest` which filter is automatically activated for new members (typically the filter maintained by the founder themselves). The user can deactivate or add others at any time.

**Discovery.** Every server that joins a network announces in the handshake the filters and catalogs it maintains. These metadata propagate through the network — any server, in a short time, knows all the filters and catalogs available in that network. The app asks the connected server "which filters exist?" and receives the full list, with emphasis on the `default_filter_pubkey` declared in the `NetworkManifest` (typically the founder's filter).

**Resistance to capture.** If Arateki one day changes policy or goes offline, other filters already published by other institutions (cooperatives, researchers) continue to work. Users simply change the default filter in the app — there is no migration, nothing needs to be redone. This is data sovereignty taken to the level of curation.

**Efficient implementation.** Large filters (hundreds of thousands of MACs) are stored in memory as **Roaring Bitmaps** indexed by MAC. Union and intersection between filters become bitwise operations in milliseconds, even with many active filters.

### DeviceClaim and DeviceTransfer  (User key authority)

Events signed by the User key that establish or transfer authority over a device. Both are published in the User's public core:

```
type DeviceClaim {
  device_pubkey: bytes(32)
  device_mac: bytes(6)
  claimed_at: uint64
  signature: bytes(64)     // signed by the owner's User key
}

type DeviceTransfer {
  device_pubkey: bytes(32)
  from_user_pubkey: bytes(32)
  to_user_pubkey: bytes(32)
  transferred_at: uint64
  signature_from: bytes(64) // signed by seller
  signature_to: bytes(64)   // signed by buyer, confirming acceptance
}
```

Use flows:

- **Provisioning**: when setting up a new device, the User signs a `DeviceClaim` declaring ownership. From then on, any reading from that device can be validated against the ownership chain.
- **Sale**: the owner signs `DeviceTransfer` ceding possession to the buyer. The buyer signs confirming. The network updates the device's `owner_pubkey`.
- **Burned hardware**: there is no special flow. The owner buys another, provisions as a new device, and the app replicates the local history they have to the new device as they wish. The private key of the burned device was lost along — and this is desirable, otherwise cloning would be possible.

### Telemetry  (ingestion, storage and query)

Each device generates a stream of telemetry readings that the server receives, validates, and processes according to the device's privacy policy.

**Sequence Number (SEQ) and Persistence:**
To prevent replay attacks and ensure order, each reading has a monotonic `seq`. To protect the ESP32's flash memory from wear, the device uses a **block reservation strategy**:
- It reserves a block of 100 sequences (configurable via `TELEMETRY_SEQ_BLOCK_SIZE`) and saves the *next* block's start to NVS.
- If the device reboots, it resumes from the start of the next reserved block, potentially leaving a small gap in the sequence but never duplicating a `seq`.
- **Lazy Registration**: The device performs a `POST /v1/devices` automatically during setup or if a telemetry send fails with HTTP 404 (indicating the server does not recognize the device).

**Packet sent by ESP32.** At each reading, the firmware assembles one packet per active destination, applying the policy:

- To the local server (if `publish_to: local_only | both`): assembles a packet looking at the `in_local_network` column of the policy. For each field: if `plain`, includes clear value; if `encrypted`, encrypts with the device's symmetric key; if `omit`, doesn't include.
- To public networks (if `publish_to: public | both`): assembles a packet looking at `in_public_networks`, with the same logic. This packet can have different composition than the one sent to the local server.

Block structure (identical for both destinations; only field composition changes):
```
device_id: bytes(32)
seq: uint64                // monotonic sequential by device
timestamp: uint64          // best-effort by the device
received_at: uint64        // when the server received
key_version: uint16        // version of the symmetric key used for any encrypted field in this block
readings: {                // composition according to policy
  ph?: float | { cipher: bytes, nonce: bytes },
  ec?: float | { cipher: bytes, nonce: bytes },
  water_level?: float | { cipher: bytes, nonce: bytes },
  temp_water?: float | { cipher: bytes, nonce: bytes },
  temp_ambient?: float | { cipher: bytes, nonce: bytes },
  humidity?: float | { cipher: bytes, nonce: bytes },
  ...
}
signature: bytes(64)       // Ed25519 signature of the packet by the device
```

Omitted fields don't appear in the `readings` object. Clear fields are `float`. Encrypted fields are `{ cipher, nonce }` — the original float value, encrypted with AES-256-GCM using the versioned symmetric key.

**SQLite schema (wide table, high performance):**

For each database (`raiznet.db` and `raiznet_private.db`), the `telemetry` table uses fixed columns with `_plain` and `_cipher` pairs per sensor. NULL in both indicates field absent in that reading.
```
CREATE TABLE telemetry (
  device_pubkey BLOB NOT NULL,
  seq INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  received_at INTEGER NOT NULL,
  key_version INTEGER,
  ph_plain REAL,        ph_cipher BLOB,        ph_nonce BLOB,
  ec_plain REAL,        ec_cipher BLOB,        ec_nonce BLOB,
  water_level_plain REAL, water_level_cipher BLOB, water_level_nonce BLOB,
  temp_water_plain REAL, temp_water_cipher BLOB, temp_water_nonce BLOB,
  temp_ambient_plain REAL, temp_ambient_cipher BLOB, temp_ambient_nonce BLOB,
  humidity_plain REAL, humidity_cipher BLOB, humidity_nonce BLOB,
  PRIMARY KEY (device_pubkey, seq)
);
CREATE INDEX idx_telemetry_time ON telemetry (device_pubkey, timestamp);
```

New sensor types require migration (addition of three columns). This is the trade-off chosen in favor of fast aggregated queries. For large aggregations (averages by H3, counts by period), fixed columns with `REAL` allow indexes and direct SQL queries, without parsing.

**Separate databases:**

- **`raiznet_public.db`** — fed exclusively by the Hypercore. Contains only data that has been replicated (or is replicable) via Hyperswarm: users, devices, and telemetry from devices with `publish_to: public | both`. Replicated by the swarm when the server is in `public` or `hybrid` mode. Serves the public endpoint and the local endpoint.
- **`raiznet_private.db`** — fed by local ingest only. Full schema (users, devices, telemetry). Stores: (1) all data from `local_only` devices; (2) fields with `in_local_network: plain | encrypted` that are `omit` in `in_public_networks` for `both` devices. Never exposed externally. Serves only the authenticated local endpoint.

This separation ensures *security by isolation*: local-only sensor data never appears in `raiznet_public.db` — the isolation is enforced at the database level, not the API layer. A poorly written query on the public endpoint cannot return data from `raiznet_private.db` because the database connection is not available to it.

**Buffer on ESP32.** Currently, the reference implementation keeps the last N readings in a circular buffer in **RAM** (defined by `TELEMETRY_BUFFER_SIZE`). The architectural goal is to eventually migrate this to a circular binary buffer in **flash** to survive deep sleep and power loss.

**Operational Parameters (Debug):**
In the current development phase, the telemetry interval is set to **30 seconds** (defined in `config.h`) to facilitate real-time testing and debugging.

**Reading by the owner.** The authenticated app consults the local endpoint and receives the UNION of `raiznet.db` + `raiznet_private.db` by `(device_pubkey, seq)`. For each field: if `_plain`, direct value; if `_cipher`, the app decrypts with the symmetric key (resolved by `key_version`); if both NULL, field absent in the reading. Field gaps in the graph are expected when the policy omitted them — they function as visual audit of the policy itself.

**Reading by third parties.** They consult the public endpoint and receive only `raiznet.db`, respecting the active compound filter. `plain` fields are visible; `cipher` fields arrive as blobs that the third party cannot decrypt; `omit` fields simply are not in the database.

**ESP32 ↔ server consistency.** The `seq` is generated monotonically by the ESP32 and traverses the entire pipeline. On connection, the server reports the last `seq` seen and the ESP32 retransmits what is in the buffer above that. Readings that left the buffer before syncing (case of prolonged poor connectivity) are lost — unless the owner dumps directly from the ESP32 via BLE or serial before. Among public peers, consistency is automatic since it's the same replicated Hypercore.

### Crop (with climate adjustments)

A Crop represents the profile of a species or variety: ideal ranges, harvest time, and rules for how those values adjust according to observed conditions.

**Base values** are the global reference:
```
id: string                 // "builtin:alface-crespa:v2" or custom hash
name: string
ideal_ph: { min, max }
ideal_ec: { min, max }
ideal_temp: { min, max }
ideal_humidity: { min, max }?
harvest_time_days: uint32
notes_cid: bytes?
```

**Adjustments** are declarative rules that modify base values according to context. A Crop can have zero or more:
```
adjustments: [
  {
    when: string           // boolean expression (e.g., "temp_ambient > 28")
    apply: {
      ideal_ph?: { min: float, max: float }  // deltas to sum
      ideal_ec?: { min: float, max: float }
      ideal_temp?: { min: float, max: float }
      harvest_time_days?: int
    }
  }
]
```

**Variables available in `when` expressions:**
- `temp_ambient`, `humidity` — current device measurements
- `month` (1-12) — month of the year
- `h3_cell`, `h3_res5`, `h3_res7`, `h3_res9` — H3 cell of the device at the indicated resolutions
- `latitude`, `longitude` — derived from the H3 cell (center)
- `altitude` — if the device reports

**Supported operators** (intentionally minimum set):
- Comparison: `>`, `<`, `>=`, `<=`, `==`, `!=`
- Membership: `in [value1, value2]` (for lists of H3 cells, for example)
- Booleans: `&&`, `||`, `!`

**Evaluation by the ESP32.** The firmware receives at provisioning (and in later updates via server) the full definition of the current Crop of the Safra, including adjustments. At the moment of evaluating each reading:

1. Starts from the base values.
2. For each adjustment, evaluates `when` against the current context. If true, sums the deltas in `apply` to the accumulator.
3. Decides whether the current reading is within or outside the adjusted values. If outside, fires alert.

This keeps the calculation local, works offline, and avoids the server having to re-send "adjusted targets" whenever the climate changes.

**Crop origins:**

- **Builtin**: embedded in the `@raiznet/protocol` package as JSON, versioned as `builtin:<slug>:v<N>`. Offline fallback and public knowledge base.
- **Third-party catalogs**: Hypercores published by server nodes (analogous to filters), following the same discovery pattern. An Embrapa Nordeste can publish a `CropCatalog` with adjustments specific for semiarid climate.
- **Personal override**: the owner can edit any metric in their own app; these edits stay local (private SQLite) and apply only to the owner's Safras.

**Resolution in the owner's app:**

```
effective_value = personal_override
               ?? cultura_from_active_catalog
               ?? builtin_cultura
```

If two active catalogs define the same cultura, the user defines priority order in settings.

**Safras** reference `cultura_id` (builtin string or custom hash). The cultura bound at the time of planting is "frozen" in the Safra — subsequent updates in the catalog don't affect Safras in progress, unless the owner chooses "update to the newest version".

### CropCatalog (published by server nodes)

Append-only Hypercore of events:
```
type: enum                 // cultura_added | cultura_updated | cultura_removed
cultura: Crop           // complete object with adjustments
created_at: uint64
signature: bytes(64)       // signed by the maintainer's User key
```

Catalog metadata (initial event):
```
id: bytes(32)              // pubkey of the catalog's core
author_pubkey: bytes(32)
name: string               // "Embrapa Nordeste Catalog"
description: string?
regions: h3_cell[]?        // regions where the catalog is relevant (optional)
created_at: uint64
```

Discovery: identical to filters — catalogs are announced in the handshake between servers and propagated by peers. Apps see the list and choose which to activate.

### Safra  (active physical planting lot)
```
id: bytes(32)
device_id: bytes(32)       // FK Device
cultura_id: string | bytes // FK Crop (builtin string or custom hash)
planted_at: uint64
plant_count: uint32
active: bool
harvested_at: uint64?
yield_kg: float?
notes: string?
```

### Material  (instructional content — stored in Hyperdrive)
```
id: bytes(32)
author_pubkey: bytes(32)
title: string
content_path: string       // path in Hyperdrive
tags: string[]
related_culturas: bytes[]
created_at: uint64
```

**Modeling rules:**

- IDs are always `bytes(32)` (hash or pubkey) — never auto-incremental integers.
- Timestamps are `uint64` in Unix milliseconds.
- Hypercore stores events in **Protobuf** format with `valueEncoding: 'binary'` — schemas in `.proto` files under `packages/protocol/proto/`, compiled via `@bufbuild/protoc-gen-es`.
- SQLite is **derived cache**. If corrupted, delete and rebuild from the core.

---

## 5. Protocols and transport

### Between ESP32 and ESP32 (local mesh)
- Protocol: **ESP-NOW** on the same channel as the configured Wi-Fi.
- Payload: **Protobuf** with `nanopb` — schemas shared from `packages/protocol/proto/`.
- Each packet is **signed** by the device's private key.

### Between ESP32 and server
- **HTTP POST with Protobuf binary** (`Content-Type: application/x-protobuf`) from day one.
- WebSocket is not used here: devices send infrequently (battery devices every ~30 min, mains-powered at low frequency) and the server never needs to push back — HTTP POST stateless fits perfectly.
- Endpoint: `POST /v1/telemetry` receives a batch of signed readings serialized as Protobuf.
- The server validates signature, inserts into the device's Hypercore, updates the SQLite index.

### Between servers (federated mesh)
- Discovery: **Hyperswarm** on topics. Each public network is a distinct topic (`raiznet:public:arateki:v1`, `raiznet:public:coop-verdao:v1`, etc).
- Arateki maintains the initial official network. Other entities can create new networks without asking permission.
- Only servers configured as `public` or `hybrid` enter topics. `local_only` servers stay out of all.
- A server can participate in N topics simultaneously. When connecting to a topic, it discovers the peers of that network and exchanges information about devices it hosts with `publish_to: public | both` and that list that network in `Device.networks`.
- Replication: native Hypercore/Corestore. Only the public cores of authorized devices are replicated.
- Multi-writer (public custom Crops catalog): **Autobase** per network, with writers authorized by the founder.

### Server in local-only mode
- Does not open connection to Hyperswarm. Not discovered by external nodes.
- Listens only on the local Wi-Fi interface (`0.0.0.0` or LAN IP).
- Indexes local telemetry normally. Serves the API to the owner's app.
- Useful for installations where the grower doesn't want any external exposure.

### Geolocation (H3)
- Library: [`h3-js`](https://github.com/uber/h3-js) (Apache 2.0) for Node, lightweight versions available for ESP32.
- Each device has a single `location` stored as an H3 cell in a 64-bit integer.
- The owner chooses the **resolution** they want to expose:
  - res 5 (~252 km²): state / region
  - res 7 (~5 km²): city / neighborhood
  - res 9 (~0.1 km²): farm
  - res 11 (~2,500 m²): specific bed
- The app presents a map where the owner visually selects the granularity. Larger (coarser) resolutions preserve more privacy; smaller (finer) allow more precise maps.
- Text names ("Fortaleza-CE", "West zone") are derived via **reverse geocoding** with Nominatim (OpenStreetMap) on the client — never stored in the Hypercore. The source of truth is the H3 cell.
- If the owner needs the exact real-world location (to operate the sensor physically), this information is in SafraSense's local software, out of scope of the network.

### Dual endpoints on the same server
A single `raiznet-server` process exposes **two simultaneous HTTP interfaces** in the same binary, each with its own access policy:

- **Public endpoint** (e.g., `:3000`): queries exclusively `raiznet_public.db`. Only serves data from devices with `publish_to: public | both`. Replicates via Hyperswarm when server is in `public` or `hybrid` mode.
- **Local endpoint** (e.g., `:3001`, bind on `127.0.0.1` or LAN IP): queries both databases and combines by `(device_pubkey, seq)`. Requires authentication with the owner's User key (challenge-response). Never exposed to Hyperswarm. Accessible remotely via tunnel (Tailscale, VPN).

Both share the same corestore and the same identity, but are strictly separated in terms of data access. This allows the owner to run a single instance, instead of two processes.

### Core topology and databases
- **Per device**: **1 public Hypercore** for telemetry. Write-only by the owner. Contains only the fields marked as `public` in the device policy.
- **Public database** (`raiznet_public.db`): fed by the replicated Hypercores. Read cache of the public endpoint.
- **Private database** (`raiznet_private.db`): fed exclusively by the owner's local server, via telemetry ingestion before the public/private separation. Never exposed externally. Also stores personal Crop overrides.
- **ESP32 buffer**: local flash with last N complete readings, accessible via local HTTP, BLE or serial — alternative channel to the server.
- **Per server**: 1 Hyperbee indexing `device_pubkey → metadata` known, reconstructible from events.
- **Network catalogs**: Hypercores published by servers (MAC filters, `CropCatalog`, Materials Hyperdrive). Discovered in the network handshake.
- **Builtin**: embedded in the `@raiznet/protocol` package as JSON. Updates with software releases.

---

## 6. Frozen tech stack

| Layer | Technology | Target version |
|---|---|---|
| Runtime | Node.js | 24 LTS |
| Language | TypeScript | 5.x |
| HTTP | Fastify | 5.x |
| P2P core | hypercore | 11.x |
| P2P swarm | hyperswarm | 4.x |
| P2P index | hyperbee | 2.x |
| P2P multi-writer | autobase | 7.x |
| P2P filesystem | hyperdrive | 11.x |
| Core manager | corestore | 7.x |
| Crypto | hypercore-crypto + sodium-universal | latest |
| Serialization (Node.js) | @bufbuild/protobuf + @bufbuild/protoc-gen-es | latest |
| Serialization (ESP32) | nanopb | latest |
| SQL index | better-sqlite3 | latest |
| Validation | zod | 3.x |
| Logger | pino | 9.x |
| Monorepo | pnpm workspaces | 9.x |
| Tests | vitest | latest |
| Desktop | Tauri | 2.x (future phase) |
| Geolocation | h3-js | latest |
| BIP-39 seeds | @scure/bip39 | latest |
| Set operations for filters | roaring | latest |
| Firmware | PlatformIO + Arduino framework | — |

**Do not introduce without discussion:** NestJS (too heavy), Express (obsolete vs Fastify), ORMs (better-sqlite3 directly), Redis (doesn't justify at this stage), Kafka (not necessary), Docker in dev (runs local).

---

## 7. Repository structure

pnpm monorepo:

```
raiznet/
├── CLAUDE.md                      # this file
├── README.md                      # public quickstart
├── package.json                   # root
├── pnpm-workspace.yaml
├── tsconfig.base.json
│
├── apps/
│   ├── prototype/                 # UI prototype — React + Vite design canvas
│   │   ├── main.jsx               # entrypoint; mounts DesignCanvas with all sections
│   │   ├── design-canvas.jsx      # DesignCanvas / DCSection / DCArtboard framework
│   │   ├── tweaks-panel.jsx       # live tweak controls (theme, color, typography)
│   │   ├── ios-frame.jsx          # iOS device frame wrapper
│   │   ├── glyphs.jsx             # SVG icon / glyph components (GRoot, GSprout, etc.)
│   │   ├── tokens.css             # design tokens (colors, typography, spacing)
│   │   ├── screens-esp.jsx        # ESP32 captive portal + local dashboard screens
│   │   ├── screens-server-1.jsx   # Server onboarding + dashboard (A/B variants)
│   │   ├── screens-server-2.jsx   # Server map H3 (A/B) + device detail + provisioning
│   │   └── screens-server-3.jsx   # Crops, Filters, Materials, Settings, Mobile views
│   │
│   ├── server/                    # full Fastify node
│   │   ├── src/
│   │   │   ├── index.ts           # entrypoint
│   │   │   ├── config.ts          # env + zod
│   │   │   ├── identity.ts        # key generation/loading
│   │   │   ├── storage/
│   │   │   │   ├── corestore.ts   # wrapper
│   │   │   │   ├── public-db.ts   # raiznet_public.db
│   │   │   │   ├── private-db.ts  # raiznet_private.db
│   │   │   │   └── indexer.ts     # core → public-db
│   │   │   ├── swarm/
│   │   │   │   └── swarm.ts       # hyperswarm
│   │   │   ├── http/
│   │   │   │   ├── public/        # public endpoint (no auth)
│   │   │   │   │   ├── telemetry.ts
│   │   │   │   │   └── devices.ts
│   │   │   │   ├── local/         # local endpoint (requires owner auth)
│   │   │   │   │   ├── telemetry.ts
│   │   │   │   │   └── devices.ts
│   │   │   │   └── health.ts
│   │   │   └── domain/            # pure logic
│   │   └── package.json
│   │
│   ├── cli/                       # ops and debug tool
│   └── app/                       # Tauri (future)
│
├── packages/
│   ├── protocol/                  # .proto schemas + generated TS + Zod validators
│   │   ├── src/
│   │   │   ├── telemetry.ts
│   │   │   ├── device.ts
│   │   │   ├── cultura.ts
│   │   │   ├── adjustments.ts     # parser and evaluator of the when DSL
│   │   │   ├── builtins/
│   │   │   │   └── culturas.json  # builtin catalog
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── crypto/                    # key/signature utilities
│   └── core/                      # abstractions over hypercore/autobase
│
├── firmware/                      # reference implementation (production firmware lives in SafraSense repo)
│   └── esp32-sample/              # minimal working sensor — demonstrates protocol, signing and HTTP POST
│       ├── platformio.ini
│       └── src/
│           ├── main.cpp
│           └── adjustments.cpp    # evaluator ported from TS to C++
│
└── docs/
    ├── architecture.md
    ├── protocol.md
    └── adr/                       # Architecture Decision Records
```

---

## 8. Code conventions

- **Strict TypeScript**: `strict: true`, `noUncheckedIndexedAccess: true`.
- **No `any` and no `unknown`** in production code. Use precise types everywhere. At external boundaries (HTTP body, network packets, files), parse with Zod and work with the inferred typed result — the type is known after the parse, so `unknown` is never needed as an intermediate type.
- **Edge validation**: every external input (HTTP body, file, network packet) goes through `zod`.
- **Errors**: typed error classes in `domain/errors.ts`. Never throw strings.
- **Logs**: structured `pino` in JSON. Never `console.log`.
- **Async**: `async/await`, never chained `.then()` in application code.
- **Files**: kebab-case. Exports: named, no default.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`).
- **Tests**: colocated (`foo.ts` + `foo.test.ts`). Minimum: unit tests of domain and integration of telemetry flow.

---

## 9. Key flows

### First user use
1. Opens the app (or runs the server).
2. System generates Ed25519 pair from a newly created BIP-39 seed.
3. Shows the seed phrase and requires the user to confirm they wrote it down.
4. User defines name and profile type.
5. Chooses server mode: `public`, `local_only` or `hybrid`. Default: `hybrid`.
6. Chooses which networks to join. Default: Arateki's official network.
7. For each joined network, the app automatically activates the default filter declared in that network's manifest.
8. First identity event is recorded in the user's public core.

### Creating a new network
1. User chooses "create network" in the app.
2. Defines readable name, unique topic (e.g., `raiznet:public:coop-verdao:v1`), description and entry policy.
3. If desired, creates an own filter right there and declares it as the network's default.
4. App publishes `NetworkManifest` signed with the User key.
5. Server starts announcing on the topic. Other users can discover and join.

### Device provisioning
1. User opens "add sensor" screen in the app (or accesses the ESP32 captive portal directly).
2. ESP32 in setup mode creates a temporary Wi-Fi network.
3. User connects to the network, and the captive portal opens an **Identity Setup** section:
   - ESP32 generates a new BIP-39 mnemonic (12 words) using hardware entropy.
   - User chooses language (PT, EN, ES).
   - User notes down the mnemonic (master key).
   - Alternatively, user can import an existing mnemonic.
4. User defines the `publish_to` of the device, server addresses, and Wi-Fi credentials.
5. ESP32 writes all identities and configs to NVS, reboots in production mode.
6. Upon first connection (or on 404 error), the device performs a **Lazy Registration** (`POST /v1/devices`) sending its pubkey, MAC, owner pubkey, and initial privacy policy.
7. User signs `DeviceClaim` with their key (app-side) to establish formal network ownership.

### Device sale (ownership transfer)
1. Seller opens "transfer device" in the app, enters the buyer's User pubkey.
2. Seller signs `DeviceTransfer` with their key.
3. Buyer, in their app, receives the request and signs confirming.
4. Final event (with two signatures) is published in the buyer's public core.
5. The network recognizes the device's new `owner_pubkey` and starts accepting configuration changes from the new owner.
6. Historical readings remain signed by the device key; old `DeviceClaim` by the seller remains valid as a record of when they were the owner.

### Telemetry ingestion
1. ESP32 reads sensors, assembles complete packet with all values and metadata (ambient temperature, humidity, current H3 if changed).
2. Signs the packet and sends to the server via Wi-Fi (`POST /v1/telemetry`) or ESP-NOW.
3. Server validates signature, checks `seq` (detects gaps).
4. Applies the device's privacy policy:
   - Fields with `in_public_networks: plain | encrypted` (devices `publish_to: public | both`) → go to the **public Hypercore**, indexed in `raiznet_public.db`.
   - Fields with `in_local_network: plain | encrypted` from `local_only` devices, or fields that are `omit` in public but present locally for `both` devices → indexed in `raiznet_private.db`.
   - Fields `omit` in a destination → not sent to that destination. If `omit` in `in_local_network` and `local_servers` is empty, stays only in ESP32 flash.
5. Both databases share the same `(device_pubkey, seq)` for correlation by the owner at the local endpoint.
6. Hyperswarm propagates the public block to peers of each network in which the device publishes.

### Local evaluation on ESP32 (alerts and estimates)

All evaluation happens in the firmware, offline, using what is stored in the flash. **Alerts are never sent as events to the network** — they stay in the local domain, consumable by the owner via physical indicators or via the app.

1. At provisioning, the app sends to the ESP32: active Safra's cultura (base values + adjustments), owner's personal override if any, and Safra's `planted_at`.
2. At each reading, the firmware evaluates the ideal values adjusted to the current climate:
   - Starts from the cultura's base values.
   - For each `adjustment`, evaluates the `when` expression against the current context (`temp_ambient`, `humidity`, `month`, `h3_*`).
   - If `when` is true, sums the deltas in `apply`.
   - Applies personal override last (highest priority).
   - Compares the reading with the resulting range.
3. If outside the range, the firmware triggers **physical** signalers (appropriate color LED, optional buzzer) and marks an internal flag that the app reads when it connects. The alert does not go to the network; it waits to be consumed by the owner.
4. The harvest-time estimate is also calculated locally: the firmware starts from the cultura's `harvest_time_days` (already adjusted by climate per `adjustments`), subtracts elapsed days since `planted_at`, and exposes the value as one of the readings accessible via local HTTP, BLE or serial. The app shows "harvest estimated in X days" based on this calculation from the device itself.
5. Crop catalog updates are pulled by the ESP32 when it connects to the server; if offline, it keeps using the stored version.

Since alerts are strictly local:
- The natural consumer is the owner's app via the local endpoint of the server (or direct connection to the ESP32).
- If the owner wants push notification outside the LAN, the responsibility is of their app, fed by the local server — which can, in turn, be accessed via tunnel (Tailscale) or by the `encrypted` field in replicated telemetry, which the app decrypts.
- The network never becomes aware of specific alerts from a device. This preserves privacy (the network doesn't know if your pH is out of range) and eliminates a class of noise events in the protocol.

### Discovery in a network
1. New server joins a topic.
2. Receives from peers the list of known devices (pubkeys, MACs, basic metadata, H3 cells).
3. Also receives the list of filters and catalogs available in the network.
4. Loads active filters (default from `NetworkManifest` + those chosen by the user).
5. Replicates cores only of devices that pass through the compound filter.
6. Server starts responding to public API queries with data from `raiznet_public.db`.

### Compound filter application
1. Client (app or server) keeps in cache the Hypercores of the active filters.
2. Each filter is projected into a Roaring Bitmap of MACs by the semantic (verified/banned/flagged).
3. At query time, the bitmaps are combined (union / intersection / difference) according to the user's choice.
4. Devices whose MAC does not meet the compound filter become invisible in aggregations and maps.

### Reading by the owner (public + private data)
1. Owner opens the app authenticated with their User key (challenge signature).
2. App connects to the **local endpoint** of the owner's server (`127.0.0.1` or LAN IP, different port from the public endpoint).
3. Queries `/v1/devices/:id/telemetry` — the server combines `raiznet_public.db` + `raiznet_private.db` by `seq`, returning the complete view.
4. If the app is outside the LAN and there is no remote access to the server, the owner can connect directly to the ESP32 via:
   - Local HTTP (if on the same network).
   - Bluetooth (when physically close).
   - Serial (when connected by cable).

### Reading by third parties (public data only)
1. Third party opens the API of the **public endpoint** of an accessible node.
2. Queries `/v1/devices/:id/telemetry` — the server queries only `raiznet_public.db` and returns only if the device passes through the active compound filter on the client.
3. Values marked as private simply are not in the queried database. There is no metadata leak.

### Synchronization after offline
1. Node reappears, reconnects to topics of networks it participates in.
2. Compares `length` of known cores with peers.
3. Downloads only missing blocks.
4. Indexer processes in background.

### Burned hardware
1. Owner notices that the ESP32 doesn't respond (loss of hardware + device private key).
2. Buys another ESP32, provisions as a new device in the app (new pubkey, new MAC).
3. If they want visual continuity on the graph, the app does *merge* in the UI: shows readings from the old device followed by the new one as a continuous series, with visual marker indicating the change.
4. The historical data of the old device on the owner's server remains intact, separately queryable.

---

## 10. Open questions

### Decided
- ~~Revocation of access to private core~~ → Private data never enters the replicated core; if a reading was public and became private, the already propagated public one remains propagated (only future readings stop being published).
- ~~Leaving a network~~ → Means stopping publishing new data. What has already been published remains (append-only log).
- ~~Cross-network aggregations deanonymizing~~ → Not applicable. Aggregations use only data that the owner explicitly made public.
- ~~Invitation and secret of private network~~ → Private network = local network (`local_only` server), not distributed network with secret topic.
- ~~MAC verification / moderation~~ → Model of **composable filters** published by server nodes, client combines whichever they want. Arateki publishes the default filter, but has no monopoly.
- ~~Pubkey rotation for the same MAC~~ → Does not exist. Burned hardware = new device. Sale = `DeviceTransfer` signed by seller and accepted by buyer.
- ~~Geographic granularity~~ → Uber's H3 cells, resolution chosen by the owner at the time of provisioning. Single location.
- ~~Multiple public networks~~ → Federated model by topic. Anyone creates and maintains a network by publishing a signed `NetworkManifest`.
- ~~Discovery of filters and catalogs~~ → Automatic. Servers announce at the network handshake; apps list all available ones with emphasis on the `NetworkManifest` default.
- ~~Crop climate adjustments~~ → Declarative system of `adjustments` (when/apply) evaluated locally on the ESP32. Regional catalogs published by servers (analogous to filters) allow specialized curation.
- ~~Governance of Autobase of public Crops~~ → Eliminated. Crops follow the same model as filters: any server publishes a `CropCatalog`; the user chooses which to activate.
- ~~Paid public gateway~~ → Removed from proposal. Protocol and self-hosting free; incentives to run node are exclusive capabilities (publish filters/catalogs, found networks) and contribution badges.
- ~~Three privacy levels per field (plain, encrypted, omit) with two dimensions (in_local_network, in_public_networks)~~ → Adopted. `encrypted` values are encrypted with AES-256-GCM by the device's symmetric key, never enter network metrics, and exist for the owner to follow their own sensor from anywhere on the internet without needing a tunnel.
- ~~Separate databases on the server~~ → `raiznet.db` (replicated via swarm, serves public and local) + `raiznet_private.db` (only fields that were `omit` in public networks, only serves the authenticated local endpoint). Schema in fixed columns (`_plain`, `_cipher`, `_nonce`) for performance.
- ~~Where alerts live~~ → Local. Firmware marks flag, signals physically (LED/buzzer), exposes via local server endpoint or direct connection. Does not go to the network.
- ~~Harvest estimate~~ → Calculated in firmware from adjusted `harvest_time_days` + `planted_at`. Exposed as one of the accessible device readings.
- ~~Owner access to data outside the LAN~~ → Two complementary paths: Tailscale/VPN to reach the local endpoint; or mark fields as `encrypted` in the public network and decrypt in the app.

### Open
- [ ] Rate limiting on HTTP endpoints (especially the public one) to prevent flood.
- [ ] Exact format of the ESP-NOW packet (bytes) — define in `packages/protocol`.
- [ ] Retention strategy: the Hypercore grows indefinitely. Policy for compacting old data (sparse sync, removal of old blocks in non-archival peers)?
- [ ] Criterion for which cores a public gateway replicates: all in the topic, only those with N followers, configurable by operator?
- [ ] UX for seed phrase backup on mobile.
- [ ] MAC ownership verification at provisioning: avoid users declaring MACs that aren't theirs. Possible approach: challenge-response at setup between app and ESP32.
- ~~Interaction between filters and replication~~ → Replicate all, filter at query time. Filters are a query-time lens only — they never affect what is stored. Keeps the network robust and avoids data fragmentation.
- [ ] DSL of `adjustments`: choose between a restricted set of operators with own parser (safe, but feature-limited) or a validated subset of JS (more flexible, more risk). Start restricted.
- [ ] Crop versioning with personal override: if the owner manually adjusted `ideal_ph` and then the builtin is updated to different values, warn the owner? Overwrite? Ask?
- [ ] Device symmetric key rotation protocol: recommended frequency, flow in the app, compartmentalization if the current key leaks.
- [ ] Sharing symmetric key with third parties (agronomist, cooperative): how the app exposes this action in a safe and reversible way, since "revoking" later requires rotation with loss of access to the history for the previous holder.
- [ ] Safra visibility policy: owner should be able to mark an active Safra as public (anyone sees what is planted, since when, expected harvest) or private. Affects the `safras` table schema, a visibility field per Safra, and whether `GET /v1/devices/:id` includes active Safra data in the public response.
- [ ] Post-quantum migration path: Ed25519 is vulnerable to Shor's algorithm on a sufficiently powerful quantum computer. AES-256-GCM is safe (Grover's reduces it to ~128-bit, still secure). When NIST post-quantum standards (ML-DSA / Dilithium for signatures) have mature ESP32 support, plan a migration of the signing layer. Not urgent — practical threat is estimated 10-20+ years away.

---

## 11. Intelligence layer (future phase)

The intelligence layer is planned for a later phase and requires no protocol changes — the data infrastructure already supports it.

**Local inference**: a `@raiznet/mcp` package will expose the local endpoint as an MCP server, making Raiznet data natively consumable by any MCP-compatible LLM (Claude, Ollama, etc.). The owner's LLM assistant can query full telemetry, active Safra, Crop ranges, and historical outcomes — entirely offline, no data leaving the local network.

**Regional intelligence**: aggregated queries across devices in the same H3 cell and crop type enable contextual benchmarking, anomaly detection, and harvest prediction refinement from collective outcomes.

**Collective Crop calibration**: if growers in a region consistently operate outside a Crop's ideal ranges and still achieve good `yield_kg`, that signal drives catalog updates. Regional curators (cooperatives, research institutions) publish updated `CropCatalog` entries derived from observed outcomes.

**Academic publishing and research**: Raiznet data is designed to be research-grade (signed, geolocated, outcome-tracked). Planned work includes partnerships with universities and institutions (e.g. Embrapa), open dataset releases under open licenses, and peer-reviewed publications. Scientific content returns to the network as `Material` entries distributed via Hyperdrive, signed by authors, accessible offline.

**When working on this phase:**
- The MCP server lives in `packages/mcp/` (does not exist yet — create the ADR first).
- Regional aggregation queries belong in `apps/server/src/http/public/` as new routes, not a separate service.
- Anonymization of grower identity in public research exports must be explicit and documented in an ADR before implementation.

---

**GitHub description and public-facing copy (TODO — do before first public release):**

Update the following to reflect both monitoring and collective intelligence:
- GitHub repository description (Settings → About)
- `README.md` tagline
- `docs/index.md` hero text
- Any app store or product listing copy

Suggested direction: *"Decentralized crop monitoring network. Local-first, data sovereign, LLM-ready. Turns field sensor data into collective agricultural knowledge."*

---

## 12. For Claude Code (you, reading this)

When I ask you to implement something:

1. **Follow the scope of the current phase.** Don't add features from later phases without asking.
2. **Validate against the schemas in `packages/protocol`**. If you change the schema, update the docs.
3. **Preserve the SQLite invariant**: it is only populated by Hypercore events.
4. **Never introduce mutable global state**. Use dependency injection.
5. **Each HTTP endpoint must have**: zod schema for body, zod schema for response, integration test.
6. **Flag when you notice inconsistency between code and CLAUDE.md** — updating this file is part of the task.
7. **Use `pnpm` never `npm install`** in the commands you suggest.
8. **Prefer small files**. If a file goes past ~300 lines, it's time to split.

Maintainer contact and product decisions live in `docs/adr/`. Large changes require a new ADR before the PR.
