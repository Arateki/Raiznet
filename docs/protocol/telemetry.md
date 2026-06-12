# Telemetry

Telemetry is the core data type in Raiznet: the stream of sensor readings flowing from ESP32 devices to servers. This page specifies the wire contract **as implemented** — it is what you need to build a Raiznet-compatible device.

## The telemetry block

One block is one set of readings from one device at one point in time:

```json
{
  "deviceId": "c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a",
  "seq": "1",
  "timestamp": "1700000000000",
  "keyVersion": 0,
  "ec": { "plain": 1800 },
  "ph": { "plain": 6.2 },
  "waterLevel": { "plain": 80 },
  "tempAmbient": { "plain": 24.5 },
  "humidity": { "plain": 60 },
  "signature": "2199c52836b4e4a314c1a051ca1f799624e9553ff6ae768d23d0f8287f68cc8c3405dc01f105a297769ff2a9fedc045ff0afefec3f47951cae2e87f059c71c08",
  "raw": "633537383565..."
}
```

| Field | Type | Notes |
|---|---|---|
| `deviceId` | string, 64 hex | Device Ed25519 pubkey |
| `seq` | **string** | Monotonic counter per device (uint64 as string) |
| `timestamp` | **string** | Best-effort device clock, Unix ms (uint64 as string) |
| `keyVersion` | number | Symmetric key version for encrypted fields (reference firmware sends `0`) |
| sensor fields | object | Optional; `ph`, `ec`, `waterLevel`, `tempWater`, `tempAmbient`, `humidity` |
| `signature` | string, 128 hex | Ed25519 detached signature over the bytes of `raw` |
| `raw` | string, hex | Hex of the UTF-8 bytes of the signed raw string (below) |

Each sensor field is either plain or encrypted:

```json
"ph": { "plain": 6.2 }
"ph": { "cipher": "5731612f87cc0d953260cd9674bc34ffe5f3caea", "nonce": "222222222222222222222222" }
```

Fields the device did not measure (or whose disposition is `omit` for this destination) are simply absent.

## The signed raw string

The Ed25519 signature does **not** cover the JSON — it covers a deterministic, pipe-delimited ASCII string the device builds before serializing:

```
<device_pubkey_hex>|<seq>|<timestamp_ms>|<key_version>[|ec=<v>][|ph=<v>][|waterLevel=<v>][|tempAmbient=<v>][|humidity=<v>]
```

Example (this exact string verifies against the signature in the block above):

```
c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a|1|1700000000000|0|ec=1800|ph=6.20|waterLevel=80|tempAmbient=24.50|humidity=60.00
```

Rules:

- Field order is **fixed**: `ec`, `ph`, `waterLevel`, `tempAmbient`, `humidity`. Absent fields are skipped entirely. (`tempWater` exists in the schema but is not emitted by the reference firmware.)
- Values are rendered with **fixed decimal places**: `ec` 0, `ph` 2, `waterLevel` 0, `tempAmbient` 2, `humidity` 2. Note `ph=6.20` in the raw becomes the number `6.2` in JSON — comparisons must be numeric.
- Only **plain** fields appear in the raw string. Encrypted fields travel solely as `cipher`/`nonce` in the JSON.
- The signature is Ed25519 detached (RFC 8032, deterministic) over the UTF-8 bytes of the string. On the wire, `raw` is the hex encoding of those bytes.
- The server verifies against the **registered** device pubkey, not the `deviceId` claimed in the payload.

::: warning Keep raw and JSON consistent
Today the server verifies only the signature over `raw`. A strict cross-check that the JSON `plain` values match the raw string is part of the hardening roadmap — compliant devices must always send both consistent.
:::

## Encrypted fields (AES-256-GCM)

For a field with `encrypted` disposition:

- plaintext = the value as **float32 big-endian** (4 bytes);
- nonce = 12 random bytes, fresh per field;
- `cipher` = `ciphertext ‖ tag` (16-byte GCM tag appended);
- key = the device's 32-byte symmetric key, versioned by `keyVersion`.

The server never decrypts — it stores `cipher`/`nonce` opaquely. Decryption happens in the owner's app, which holds the symmetric keyring (`{ version → key }`). Encrypted values never enter network aggregations.

## Server-side processing

For each block, in order:

1. **Device lookup** in the destination database (`public` endpoint → `raiznet_public.db`, `local` endpoint → `raiznet_private.db`). Unknown device → per-block error `Device not found: <hex>`.
2. **Signature verification** over the `raw` bytes against the registered pubkey. Failure → `Invalid signature for device <hex>`.
3. **Disposition resolution** per field from the device's privacy policy: `per_destination[<server_pubkey_hex>] ?? default_disposition`. A field missing from the policy resolves to `omit`.
4. **Projection to columns**: `plain` value with `plain` disposition → `_plain` column; `cipher`/`nonce` with `encrypted` disposition → `_cipher`/`_nonce` columns; any mismatch between what the device sent and what the policy allows → stored as NULL, silently.
5. **Insert** with `INSERT OR IGNORE` keyed by `(device_pubkey, seq)`, with `received_at` set to the server clock. Whether the row goes to the public or private database depends on the endpoint and the device's `publishTo` — see [Local API](/reference/local-api).

## SQLite schema

Both databases use the same wide-table schema. Each sensor has three columns; NULL in both `_plain` and `_cipher` means the field was absent in that reading.

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

Fixed columns allow fast aggregated SQL queries without JSON parsing. Adding a new sensor type requires a schema migration (three new columns) — the accepted trade-off for query performance.

## Batching

`POST /v1/telemetry` accepts 1 to 100 blocks per request. Each block is processed independently:

- all blocks OK → `200 { "accepted": N, "errors": [] }`;
- any block failed → `207` with per-block errors (the original `seq` string is echoed back);
- malformed body (no `blocks`, empty, or > 100) → `400`.

**Duplicates are success**: a block whose `(deviceId, seq)` already exists is counted as accepted. The device re-sends everything not confirmed with `200`, and idempotent inserts make that safe.

## Device-side buffering

The reference firmware (`firmware/safraSense`):

- reads sensors every **60 s** (`TELEMETRY_INTERVAL_MS`, debug-friendly default);
- keeps the last **50** readings in a RAM ring buffer (`TELEMETRY_BUFFER_SIZE`);
- reserves `seq` in blocks of **100** (`TELEMETRY_SEQ_BLOCK_SIZE`), persisting only the next block start to NVS — reboots may leave small `seq` gaps but never duplicate;
- registers itself via `POST /v1/devices` during setup (a `409` response counts as success);
- re-sends unconfirmed readings on every cycle until the server answers `200`.

Moving the buffer to flash (to survive deep sleep and power loss) is on the roadmap.

## Planned: canonical binary format

The Protobuf schemas in [Proto Schemas](/reference/proto-schemas) define the planned canonical encoding for events and telemetry. JSON will remain supported for the current firmware generation and debugging.
