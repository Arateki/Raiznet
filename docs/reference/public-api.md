# Public API

The public endpoint listens on `0.0.0.0:PUBLIC_PORT` (default `3000`). It is accessible to anyone — no authentication required. Its device routes query only `raiznet_public.db` and never return private data.

This page documents the API **as implemented today**. The wire format is JSON; a canonical Protobuf encoding is planned (see [Roadmap](/guide/roadmap)).

## Base URL

```
http://<host>:3000
```

---

## Health

### `GET /health`

Returns server status and current timestamp.

**Response `200`**
```json
{
  "status": "ok",
  "ts": 1776819068644
}
```

---

## Devices

### `POST /v1/devices`

Registers a device. The reference firmware calls this automatically during setup ("lazy registration").

**Request body** (`application/json`)
```json
{
  "id": "c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a",
  "mac": "aabbccddeeff",
  "ownerPubkey": "93a5f261984931e0df5c7434b16d468efb1953098d3cad4fa1506b9e052e7fc7",
  "ownerName": "Yan",
  "name": "Tower 01 - Lettuce",
  "type": 0,
  "publishTo": 2,
  "location": 613916942794711039,
  "networks": [],
  "localServers": [],
  "privacyPolicy": {
    "ph": { "default_disposition": 1, "per_destination": {} },
    "ec": { "default_disposition": 1, "per_destination": {} }
  },
  "hardware": { "model": "Safrasense Aqua ESP32 v1", "firmware_version": "0.2.0" }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (64 hex) | yes | Device Ed25519 pubkey |
| `mac` | string (12 hex) | yes | Lowercase, no colons |
| `ownerPubkey` | string (64 hex) | yes | Owner's User pubkey |
| `ownerName` | string | no | Used to upsert the owner in `users` |
| `name` | string (min 1) | yes | Human-readable device name |
| `type` | int `0..2` | no (default `0`) | `0` sensor_mains · `1` sensor_battery · `2` gateway |
| `publishTo` | int `0..2` | no (default `1`) | `0` local_only · `1` public · `2` both |
| `location` | int | no | H3 cell index (64-bit) |
| `networks` | string[] | no (default `[]`) | Network topics |
| `localServers` | string[] | no (default `[]`) | Local server addresses |
| `privacyPolicy` | object | no | Per-field `FieldPolicy`; omitted fields default to `plain` |
| `hardware` | object | no | `{ model, firmware_version }` |

**Response `201`**
```json
{
  "device": {
    "id": "c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a",
    "mac": "aabbccddeeff",
    "ownerPubkey": "93a5f261984931e0df5c7434b16d468efb1953098d3cad4fa1506b9e052e7fc7",
    "name": "Tower 01 - Lettuce",
    "type": 0,
    "location": 613916942794711039,
    "status": 0,
    "hardware": { "model": "Safrasense Aqua ESP32 v1", "firmware_version": "0.2.0" },
    "createdAt": 1776819068644
  }
}
```

**Response `409`** — pubkey already registered. The reference firmware treats this as success.
```json
{ "error": "device_already_exists" }
```

**Response `400`** — body failed schema validation.
```json
{ "error": "validation_error", "details": [ /* zod issues */ ] }
```

Side effect: the owner is upserted into `users` with `name = ownerName ?? ownerPubkey.slice(0, 12)`.

---

### `GET /v1/devices`

Returns all devices in the public database. No pagination yet.

**Response `200`**
```json
{ "devices": [ /* same shape as the register response */ ] }
```

---

### `GET /v1/devices/:id`

Returns a single device by its pubkey (hex).

**Response `200`** — `{ "device": { ... } }`

**Response `404`**
```json
{ "error": "Device not found" }
```

---

### `GET /v1/devices/:id/telemetry`

Returns the most recent readings, ordered by `timestamp DESC`, fixed `LIMIT 500`. No query parameters yet.

**Response `200`**
```json
{
  "readings": [
    {
      "seq": 1,
      "timestamp": 1700000000000,
      "receivedAt": 1700000000123,
      "ph": { "value": 6.2 },
      "ec": { "encrypted": "5731612f87cc0d953260cd9674bc34ffe5f3caea" },
      "waterLevel": { "value": 80 },
      "tempWater": null,
      "tempAmbient": { "value": 24.5 },
      "humidity": { "value": 60 }
    }
  ]
}
```

Each sensor field is one of:

| Shape | Meaning |
|---|---|
| `{ "value": <number> }` | Stored in plain |
| `{ "encrypted": "<hex>" }` | Stored encrypted — ciphertext+tag, **nonce is not exposed here** |
| `null` | Absent in this reading (omitted by policy or not measured) |

---

## Telemetry ingestion

### `POST /v1/telemetry`

Receives a batch of 1 to 100 signed telemetry blocks.

**Request body** (`application/json`)
```json
{
  "blocks": [
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
      "raw": "<hex of the UTF-8 bytes of the signed raw string>"
    }
  ]
}
```

::: warning seq and timestamp are strings
`seq` and `timestamp` are serialized as **strings** (uint64-safe), not numbers. `keyVersion` is a number.
:::

Sensor fields are optional. Each one is either `{ "plain": <number> }` or `{ "cipher": "<hex>", "nonce": "<hex>" }`. The signature is Ed25519 (detached) over the bytes of the `raw` string — see [Telemetry](/protocol/telemetry) for how `raw` is built. The server verifies it against the **registered** device pubkey, not the one in the payload.

**Response `200`** — every block accepted
```json
{ "accepted": 1, "errors": [] }
```

**Response `207`** — at least one block failed
```json
{
  "accepted": 0,
  "errors": [
    { "seq": "1", "error": "Device not found: c5785e1865…a2c66a" }
  ]
}
```

Per-block error messages (exact strings):

| Message | Cause |
|---|---|
| `Device not found: <device_id_hex>` | Device is not registered in this endpoint's database |
| `Invalid signature for device <device_id_hex>` | Ed25519 verification over `raw` failed |

**Response `400`** — body without `blocks`, empty, or with more than 100 items.

### Ingestion semantics

- **Duplicates are success.** Re-sending an already-stored `(deviceId, seq)` returns `200` with it counted in `accepted` — inserts use `INSERT OR IGNORE`. Clients are expected to re-send anything not confirmed with a `200`.
- **Unknown device returns `207`, never `404`.** Register the device first via `POST /v1/devices`.
- **No monotonicity check.** Old `seq` values that were never confirmed can be re-sent after a reconnection; deduplication is by primary key `(device_pubkey, seq)`.
- A device with `publishTo: 0` (local_only) posting to the public endpoint is validated and counted as accepted, but **nothing is stored** in the public database.
