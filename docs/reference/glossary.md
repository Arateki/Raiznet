# Glossary

Terms used throughout the Raiznet protocol and documentation.

---

**Autobase**
A multi-writer extension to Hypercore. Allows multiple peers to append to a shared log. Used in Raiznet for collaborative data structures (Phase 2+).

**BIP-39**
A standard for generating human-readable seed phrases (12 or 24 words) that deterministically produce cryptographic keys. Raiznet uses 12-word phrases to derive the User's Ed25519 keypair and device symmetric keys.

**Corestore**
A storage manager for multiple Hypercores on a single node. Each server has one Corestore managing all device cores it hosts or replicates.

**Crop**
A crop profile: ideal pH, EC, temperature, and humidity ranges, plus harvest time and declarative climate adjustments (`adjustments`). Stored in firmware and used for local alert evaluation on the ESP32.

**CropCatalog**
An append-only Hypercore published by a server node containing `Crop` entries. Analogous to a Filter but for crop knowledge. Discovered automatically via the network handshake. Any server or institution can publish one.

**DeviceClaim**
An event signed by a User key declaring ownership of a device at provisioning time. Published in the owner's public Hypercore.

**DeviceTransfer**
An event signed by both seller and buyer transferring ownership of a device. Dual-signature guarantees both parties consented.

**Disposition**
The visibility policy for a single sensor field at a specific destination: `PLAIN` (clear), `ENCRYPTED` (AES-256-GCM), or `OMIT` (not sent).

**Ed25519**
An elliptic-curve signature algorithm used for all identity and signing in Raiznet. Fast, small signatures (64 bytes), small public keys (32 bytes).

**EncryptedBlob**
A Protobuf message containing a ciphertext (including AES-GCM auth tag) and a 12-byte nonce. Produced when a field's Disposition is `ENCRYPTED`.

**ESP-NOW**
A Wi-Fi-based protocol from Espressif for direct device-to-device communication without a router. Used in Raiznet for the local sensor mesh between ESP32 devices.

**FieldPolicy**
A Protobuf message containing a `default_disposition` and a `per_destination` map. Controls how each sensor field is handled for each destination (server pubkey or network topic).

**Filter**
An append-only Hypercore of MAC curation events (`mac_verified`, `mac_flagged`, `mac_banned`, `mac_unflagged`) published by a server node. Applied at query time to control which devices appear in API responses and aggregations.

**H3**
Uber's hierarchical hexagonal geospatial indexing system. Each H3 cell is a 64-bit integer identifying a hexagonal area on Earth. Raiznet stores device locations as H3 cells at a resolution chosen by the owner (coarser = more private).

**Hypercore**
An append-only, cryptographically signed log. Each entry is signed by the core's keypair. Cores are identified by their public key and can be replicated across peers. The foundational primitive of the Holepunch / Hypercore Protocol stack.

**Hyperbee**
A B-tree index built on top of a Hypercore. Used in Raiznet to index device metadata (`device_pubkey → metadata`) for efficient lookups.

**Hyperdrive**
A distributed filesystem built on Hypercores. Used in Raiznet to store and distribute `Material` entries (instructional content, research publications).

**Hyperswarm**
A distributed hash table (DHT) and connection broker for peer discovery. Peers join a swarm by topic (a SHA-256 hash). Raiznet uses Hyperswarm to connect servers participating in the same public network.

**identity.mnemonic**
The file at `DATA_DIR/identity.mnemonic` containing the server's 12-word BIP-39 seed phrase. Created on first boot with permissions `0600`. Must be backed up — losing it means losing the ability to sign NetworkManifests, Filters, and CropCatalogs.

**local_servers**
A list of server addresses configured on a device at provisioning. Determines where `local_only` or `both` device data is sent. If empty, private-disposition fields stay in the ESP32 flash only — no local server receives them.

**MCP (Model Context Protocol)**
An open protocol for exposing data and tools to LLMs in a standardized way. The planned `@raiznet/mcp` package will expose Raiznet data as MCP tools, making it natively consumable by any compatible LLM client.

**nanopb**
A lightweight C implementation of Protocol Buffers designed for embedded systems. Used on ESP32 to serialize and deserialize Protobuf messages without dynamic memory allocation.

**NetworkManifest**
An event signed by a network founder's User key declaring the network's name, topic, and default Filter. Published in the founder's public Hypercore. The founder's Filter receives UI priority (shown first, activated by default for new members) — this is the only distinction a founder has.

**Protobuf (Protocol Buffers)**
Google's binary serialization format. Raiznet uses `.proto` schemas shared between Node.js (`@bufbuild/protobuf`) and ESP32 firmware (`nanopb`) for byte-level compatibility.

**publish_to**
A device setting controlling which categories of destinations receive its data: `LOCAL_ONLY` (only `local_servers`), `PUBLIC` (only network topics), or `BOTH`.

**raiznet_private.db**
The SQLite database fed exclusively by local ingest. Contains data from `local_only` devices and fields with private disposition. Served only by the authenticated local endpoint. Never enters Hyperswarm.

**raiznet_public.db**
The SQLite database fed by Hypercore replication. Contains only data that has traveled (or can travel) via Hyperswarm. Served by both the public and local endpoints.

**Roaring Bitmap**
A compressed bitset data structure used to represent MAC lists in Filters. Enables fast set operations (union, intersection, difference) across multiple Filters even with hundreds of thousands of MACs.

**Safra**
An active planting lot: one device, one Crop, a start date, an optional harvest date, and an optional yield. Links telemetry data to agricultural outcomes.

**seq**
A monotonically increasing sequence number generated by the ESP32 per device. Used to detect gaps and drive retransmission on reconnection.

**Sodium**
`sodium-universal` — a Node.js wrapper around libsodium. Provides the cryptographic primitives underlying `hypercore-crypto` (Ed25519 signing, random bytes, key derivation).

**TelemetryBlock**
A Protobuf message containing one set of sensor readings from one device at one point in time, signed by the device's Ed25519 key.

**TelemetryBatch**
A Protobuf message containing one or more `TelemetryBlock` entries, sent in a single HTTP POST to `/v1/telemetry`.

**topic**
A string used as the Hyperswarm discovery key for a public network (e.g. `raiznet:public:arateki:v1`). Any server that knows a topic can join the corresponding network. Topics are not secret — real privacy comes from running in `local_only` mode.

**User key**
The Ed25519 keypair derived from the owner's BIP-39 seed phrase. The root of authority over all devices and networks the owner controls. Used to sign `DeviceClaim`, `DeviceTransfer`, `NetworkManifest`, and Filter events. Never used to sign telemetry.
