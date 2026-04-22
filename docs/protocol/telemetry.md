# Telemetry

Telemetry is the core data type in Raiznet. It is the stream of sensor readings that flows from ESP32 devices to servers and, optionally, into the peer-to-peer mesh.

## Packet structure

A `TelemetryBlock` contains one set of readings from one device at one point in time:

```protobuf
message TelemetryBlock {
  bytes  device_id    = 1;  // 32-byte Ed25519 pubkey
  uint64 seq          = 2;  // monotonic counter, per device
  uint64 timestamp    = 3;  // best-effort device clock (unix ms)
  uint64 received_at  = 4;  // server wall clock (unix ms)
  uint32 key_version  = 5;  // symmetric key version for encrypted fields

  SensorField ph           = 10;
  SensorField ec           = 11;
  SensorField water_level  = 12;
  SensorField temp_water   = 13;
  SensorField temp_ambient = 14;
  SensorField humidity     = 15;

  bytes signature = 30;  // Ed25519 signature over fields 1–15
}
```

Field numbers 1–15 use 1-byte Protobuf tags (efficient). Fields 16–29 are reserved for future sensor types. The signature at field 30 covers the canonical serialization of fields 1–15.

## SensorField: plain or encrypted

Each sensor reading is a `oneof` — either a plain float or an AES-256-GCM encrypted blob:

```protobuf
message SensorField {
  oneof value {
    float          plain     = 1;
    EncryptedBlob  encrypted = 2;
  }
}

message EncryptedBlob {
  bytes cipher = 1;  // ciphertext + 16-byte auth tag
  bytes nonce  = 2;  // 12-byte GCM nonce
}
```

The device decides at packet assembly time which variant to use, based on the field's `Disposition` in the device policy.

## Device symmetric key

Each device has a symmetric key (AES-256-GCM, 32 bytes) used to encrypt `encrypted` fields. It is:

- Stored in the ESP32's flash alongside the signing keypair.
- Stored in the owner's app keychain (to decrypt received readings).
- Recommended to be derived deterministically: `HKDF(user_seed, device_pubkey)` so that recovering the BIP-39 seed phrase recovers all symmetric keys.

`key_version` in the block allows key rotation without losing access to historical data. The app maintains a keyring: `{ version → key }`.

## Ingestion flow

The destination of each field depends on the device's `publish_to` setting and whether the owner runs a local server (`local_servers` list).

```
ESP32 reads sensors
  │
  ├─ public fields (PLAIN or ENCRYPTED, publish_to: public|both)
  │     └─ POST /v1/telemetry → Server
  │           ├─ validate Ed25519 signature
  │           ├─ check seq monotonicity
  │           ├─ insert into raiznet_public.db
  │           └─ (Phase 2) append to Hypercore → Hyperswarm peers
  │
  └─ private fields (PLAIN or ENCRYPTED, publish_to: local_only|both)
        │
        ├─ local_servers populated → POST /v1/telemetry to local server(s)
        │       └─ insert into raiznet_private.db
        │          (never leaves the local network, never enters Hyperswarm)
        │
        └─ local_servers empty → stays in ESP32 flash only
               (accessible via local HTTP / BLE / serial when app is nearby)
```

Users who do not run a local server can still access their private readings by connecting the app directly to the device. The trade-off is lower availability: data is only reachable when the device is on the same network or within BLE range.

## SQLite schema

Both databases use the same wide-table schema for `telemetry`. Each sensor has three columns: `_plain`, `_cipher`, `_nonce`. NULL in both plain and cipher means the field was absent in that reading (policy was `OMIT` for that destination).

```sql
CREATE TABLE telemetry (
  device_pubkey    BLOB    NOT NULL,
  seq              INTEGER NOT NULL,
  timestamp        INTEGER NOT NULL,
  received_at      INTEGER NOT NULL,
  key_version      INTEGER,

  ph_plain         REAL,   ph_cipher         BLOB,   ph_nonce         BLOB,
  ec_plain         REAL,   ec_cipher         BLOB,   ec_nonce         BLOB,
  water_level_plain REAL,  water_level_cipher BLOB,  water_level_nonce BLOB,
  temp_water_plain REAL,   temp_water_cipher  BLOB,  temp_water_nonce  BLOB,
  temp_ambient_plain REAL, temp_ambient_cipher BLOB, temp_ambient_nonce BLOB,
  humidity_plain   REAL,   humidity_cipher    BLOB,  humidity_nonce    BLOB,

  PRIMARY KEY (device_pubkey, seq)
);
CREATE INDEX idx_telemetry_time ON telemetry (device_pubkey, timestamp);
```

Fixed columns allow fast aggregated SQL queries without JSON parsing. Adding a new sensor type requires adding three columns (a schema migration), but this is the accepted trade-off for query performance.

## Batching

Multiple blocks can be sent in a single request using `TelemetryBatch`:

```protobuf
message TelemetryBatch {
  repeated TelemetryBlock blocks = 1;
}
```

The server processes each block independently. A partial batch returns HTTP 207 with per-block status.

## Sequence gap handling

If a device was offline and its circular buffer overflowed before it could sync, those readings are lost from the network. The owner can recover them by connecting directly to the device via:

- **Local HTTP** (same Wi-Fi network)
- **BLE** (when physically close)
- **Serial** (USB cable)

The ESP32 keeps the last N readings in flash regardless of network connectivity.
