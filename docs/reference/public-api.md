# Public API

The public endpoint listens on `0.0.0.0:PUBLIC_PORT` (default `3000`). It is accessible to anyone — no authentication required. It queries only `raiznet_public.db` and never returns private data.

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

### `GET /v1/devices`

Returns the list of public devices known to this server.

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| `limit` | number | Max results (default 100, max 1000) |
| `offset` | number | Pagination offset |

**Response `200`**
```json
{
  "devices": [
    {
      "id": "641ffb278dc6...",
      "mac": "aabbccddeeff",
      "owner_pubkey": "a1b2c3...",
      "name": "Tower 01 - Lettuce",
      "type": "sensor_mains",
      "location": 613916942794711039,
      "publish_to": "public",
      "networks": ["raiznet:public:arateki:v1"],
      "hardware": {
        "model": "ESP32-S3",
        "firmware_version": "1.2.0"
      },
      "status": "active",
      "created_at": 1776819068644
    }
  ],
  "total": 42,
  "offset": 0
}
```

---

### `GET /v1/devices/:id`

Returns a single device by its public key (hex).

**Response `200`** — same shape as one item from the list above.

**Response `404`**
```json
{ "error": "device_not_found" }
```

---

### `GET /v1/devices/:id/telemetry`

Returns recent telemetry readings for a device.

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| `limit` | number | Max results (default 500, max 5000) |
| `since` | number | Unix ms — return only readings after this timestamp |
| `until` | number | Unix ms — return only readings before this timestamp |

**Response `200`**
```json
{
  "device_id": "641ffb278dc6...",
  "readings": [
    {
      "seq": 1042,
      "timestamp": 1776819068644,
      "received_at": 1776819069001,
      "ph": 6.2,
      "ec": 1.8,
      "water_level": null,
      "temp_water": 22.5,
      "temp_ambient": 28.1,
      "humidity": 65.0,
      "ph_encrypted": false,
      "ec_encrypted": false
    }
  ]
}
```

Fields with `ENCRYPTED` disposition appear as `null` in the value and `true` in the `_encrypted` flag — the blob is stored but not exposed in plain form to unauthenticated callers. Fields with `OMIT` disposition are absent entirely.

---

## Telemetry ingestion

### `POST /v1/telemetry`

Receives a batch of signed telemetry blocks from an ESP32 or any authorized client.

**Request body** (`application/json`)
```json
{
  "blocks": [
    {
      "device_id": "641ffb278dc6...",
      "seq": 1042,
      "timestamp": 1776819068644,
      "key_version": 1,
      "ph": { "plain": 6.2 },
      "ec": { "plain": 1.8 },
      "temp_ambient": { "plain": 28.1 },
      "humidity": { "plain": 65.0 },
      "signature": "3045022100..."
    }
  ]
}
```

Encrypted fields use `{ "encrypted": { "cipher": "<hex>", "nonce": "<hex>" } }` instead of `{ "plain": <float> }`.

**Response `200`** — all blocks accepted
```json
{ "accepted": 1, "errors": [] }
```

**Response `207`** — partial success
```json
{
  "accepted": 2,
  "errors": [
    { "seq": 1041, "error": "invalid_signature" }
  ]
}
```

**Response `400`** — malformed request body

---

## Error codes

| Code | HTTP status | Meaning |
|---|---|---|
| `device_not_found` | 404 | No device with this pubkey in the public database |
| `invalid_signature` | 400 (in batch: 207) | Ed25519 signature verification failed |
| `invalid_seq` | 400 (in batch: 207) | Sequence number is not monotonically increasing |
| `validation_error` | 400 | Request body failed schema validation |
