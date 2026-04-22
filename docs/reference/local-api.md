# Local API

The local endpoint listens on `127.0.0.1:LOCAL_PORT` (default `3001`). It is accessible only from the machine running the server (or via a tunnel such as Tailscale). It requires owner authentication and combines `raiznet_public.db` + `raiznet_private.db` in its responses.

## Base URL

```
http://127.0.0.1:3001
```

## Authentication

The local endpoint uses Ed25519 challenge-response to prove ownership of the server's User key.

### `GET /v1/auth/challenge`

Returns a 32-byte random challenge.

**Response `200`**
```json
{ "challenge": "a3f1...32 bytes hex..." }
```

### `POST /v1/auth/verify`

Signs the challenge and receives a session token.

**Request body**
```json
{
  "challenge": "a3f1...",
  "signature": "3045...",
  "pubkey": "641f..."
}
```

**Response `200`**
```json
{ "token": "eyJ..." }
```

Pass the token in subsequent requests as `Authorization: Bearer <token>`.

**Response `401`** — invalid signature or unknown pubkey.

---

## Devices

The local endpoint exposes the same device routes as the public API, but the responses include data from both databases combined.

### `GET /v1/devices`

Same as public, but also returns devices with `publish_to: local_only`.

### `GET /v1/devices/:id`

Same as public, but returns full device detail including local-only fields.

### `GET /v1/devices/:id/telemetry`

Returns the combined view: public readings from `raiznet_public.db` merged with local readings from `raiznet_private.db`, joined by `(device_pubkey, seq)`.

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
      "water_level": 0.85,
      "temp_water": 22.5,
      "temp_ambient": 28.1,
      "humidity": 65.0,
      "ph_encrypted": false,
      "ec_encrypted": false
    }
  ]
}
```

For `ENCRYPTED` fields, the response includes the raw cipher and nonce so the owner's app can decrypt locally:

```json
{
  "seq": 1043,
  "ph": null,
  "ph_encrypted": true,
  "ph_cipher": "a1b2c3...",
  "ph_nonce": "0102030405060708090a0b0c"
}
```

---

## Server identity

### `GET /v1/identity`

Returns the server's public key and mnemonic status.

**Response `200`**
```json
{
  "pubkey": "641ffb278dc6...",
  "mnemonic_exists": true
}
```

The mnemonic itself is never returned over HTTP. Access it directly from `DATA_DIR/identity.mnemonic`.

---

## Error codes

All public API error codes apply. Additional local-only codes:

| Code | HTTP status | Meaning |
|---|---|---|
| `unauthorized` | 401 | Missing or invalid auth token |
| `challenge_expired` | 401 | Challenge was not used within its validity window |
