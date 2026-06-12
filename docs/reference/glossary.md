# Glossary

Terms used throughout the Raiznet protocol and documentation. Entries marked *(design)* describe specified-but-not-yet-implemented concepts — see the [Roadmap](/guide/roadmap).

---

**BIP-39**
A standard for generating human-readable seed phrases (12 or 24 words) that deterministically produce cryptographic keys. Raiznet uses 12-word phrases for the User identity and the server node identity.

**Crop**
A crop profile: ideal pH, EC, temperature, and humidity ranges, plus harvest time and declarative climate adjustments (`adjustments`). Stored in firmware and used for local alert evaluation on the ESP32.

**CropCatalog** *(design)*
An append-only catalog of `Crop` entries published by a server node. Analogous to a Filter but for crop knowledge. Any server or institution can publish one; users choose which to activate.

**DeviceClaim** *(design)*
An event signed by a User key declaring ownership of a device at provisioning time, published in the owner's public event log.

**DeviceTransfer** *(design)*
An event signed by both seller and buyer transferring ownership of a device. Dual signatures guarantee both parties consented.

**Disposition**
The visibility policy for a single sensor field at a specific destination: `PLAIN` (clear), `ENCRYPTED` (AES-256-GCM), or `OMIT` (not sent). Wire values: `1`, `2`, `0`.

**Ed25519**
An elliptic-curve signature algorithm used for all identity and signing in Raiznet. Fast, small signatures (64 bytes), small public keys (32 bytes).

**EncryptedBlob**
The encrypted payload of a sensor field: a ciphertext with the 16-byte AES-GCM auth tag appended, plus a separate 12-byte nonce. On the JSON wire it appears as `{ "cipher": "<hex>", "nonce": "<hex>" }`.

**ESP-NOW** *(planned)*
A Wi-Fi-based protocol from Espressif for direct device-to-device communication without a router. Planned for the local sensor mesh between ESP32 devices.

**Event log** *(design)*
The future source of truth of a node: an append-only, hash-chained sequence of signed events (device registrations, telemetry blocks, curation events). SQLite becomes a derived index rebuilt by replaying the log. Replication between nodes operates on this log ([ADR-004](/adr/004-raiznet-native-replication)).

**FieldPolicy**
A per-field policy object containing a `default_disposition` and a `per_destination` map (key: server pubkey hex or network topic). Controls how each sensor field is handled for each destination.

**Filter** *(design)*
An append-only log of MAC curation events (`mac_verified`, `mac_flagged`, `mac_banned`, `mac_unflagged`) published by a server node. Applied at query time to control which devices appear in API responses and aggregations — never affects what is stored.

**H3**
Uber's hierarchical hexagonal geospatial indexing system. Each H3 cell is a 64-bit integer identifying a hexagonal area on Earth. Raiznet stores device locations as H3 cells at a resolution chosen by the owner (coarser = more private).

**identity.mnemonic**
The file at `DATA_DIR/identity.mnemonic` containing the server's 12-word BIP-39 seed phrase. Created on first boot with permissions `0600`. Must be backed up — it is the node's identity.

**Lazy registration**
The reference firmware registers itself by calling `POST /v1/devices` during setup. A `409 device_already_exists` response counts as success, so the call is safely repeatable.

**local_servers**
A list of server addresses configured on a device at provisioning. Determines where `local_only` or `both` device data is sent. If empty, private-disposition fields stay in the ESP32 flash only — no local server receives them.

**MCP (Model Context Protocol)** *(planned)*
An open protocol for exposing data and tools to LLMs in a standardized way. The planned `@raiznet/mcp` package will expose Raiznet data as MCP tools.

**nanopb** *(planned)*
A lightweight C implementation of Protocol Buffers for embedded systems. Planned for the ESP32 side of the canonical binary format.

**NetworkManifest** *(design)*
An event signed by a network founder's User key declaring the network's name, topic, and default Filter. The founder's Filter receives UI priority — this is the only distinction a founder has.

**Protobuf (Protocol Buffers)**
Google's binary serialization format. The `.proto` schemas in `packages/protocol/proto/` define Raiznet's planned canonical encoding ([ADR-001](/adr/001-protobuf)); the current wire format is JSON.

**publish_to**
A device setting controlling which categories of destinations receive its data: `0` local_only (only `local_servers`), `1` public (only network topics), or `2` both.

**raiznet_private.db**
The SQLite database fed exclusively by local ingest. Contains data from `local_only` devices and fields with private disposition. Served only by the local endpoint. Never leaves the node.

**raiznet_public.db**
The SQLite database holding publicly publishable devices and readings. Served by the public endpoint; will be fed by event-log replication once networks ship.

**raw**
The pipe-delimited ASCII string a device builds and signs for each telemetry block: `pubkey|seq|timestamp|key_version|field=value|…`. The Ed25519 signature covers the raw bytes, not the JSON envelope. See [Telemetry](/protocol/telemetry#the-signed-raw-string).

**Relay** *(design)*
A reachable node that helps two NAT-ed peers establish a direct connection — and carries traffic when hole punching fails (common under symmetric CGNAT on rural 4G). Any community node can act as a relay; relays are never a privileged gateway ([ADR-004](/adr/004-raiznet-native-replication)).

**Roaring Bitmap** *(planned)*
A compressed bitset data structure intended to represent MAC lists in Filters, enabling fast set operations across many filters.

**Safra**
An active planting lot: one device, one Crop, a start date, an optional harvest date, and an optional yield. Links telemetry data to agricultural outcomes.

**seq**
A monotonically increasing sequence number generated per device. Allocated in flash-friendly blocks (the reference firmware reserves 100 at a time in NVS), used for idempotent deduplication — the server stores at most one reading per `(device_pubkey, seq)` and duplicates count as success.

**Sodium**
`sodium-universal` / libsodium — provides the cryptographic primitives underlying `hypercore-crypto` (Ed25519 signing, random bytes), used by `@raiznet/crypto`.

**TelemetryBlock**
One set of sensor readings from one device at one point in time, signed by the device's Ed25519 key. Today a JSON object; a Protobuf message in the planned canonical format.

**topic** *(design)*
A string used as the discovery key for a public network (e.g. `raiznet:public:arateki:v1`). Any server that knows a topic can join the corresponding network. Topics are not secret — real privacy comes from running in `local_only` mode.

**User key**
The Ed25519 keypair derived from the owner's BIP-39 seed phrase. The root of authority over all devices and networks the owner controls. Used to sign `DeviceClaim`, `DeviceTransfer`, `NetworkManifest`, and Filter events. Never used to sign telemetry.
