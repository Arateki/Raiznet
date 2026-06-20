# Error Reference

This page lists the errors the server returns **today**, with exact shapes — they are part of the compatibility contract (the reference firmware depends on some of them).

## HTTP status codes

| Status | When |
|---|---|
| `200` | Request fully succeeded — including telemetry batches where every block was accepted (duplicates count as accepted) |
| `201` | Device registered |
| `207` | Telemetry batch where at least one block failed — check `errors[]` |
| `400` | Request body failed schema validation |
| `404` | `GET /v1/devices/:id` for an unknown device |
| `409` | `POST /v1/devices` for an already-registered pubkey |
| `500` | Unexpected server error |

::: warning Two behaviors integrators often get wrong
- Telemetry for an **unknown device** returns `207` with a per-block error — never `404`.
- A **duplicate block** (same `deviceId` + `seq`) returns `200` and counts as accepted. Duplicates are success, not an error.
:::

## Top-level error shapes

**Validation failure** (`400`) — `details` contains the raw Zod issues:

```json
{
  "error": "validation_error",
  "details": [
    { "code": "too_small", "path": ["name"], "message": "String must contain at least 1 character(s)" }
  ]
}
```

**Device already exists** (`409`):

```json
{ "error": "device_already_exists" }
```

**Device not found** (`404`, `GET /v1/devices/:id`):

```json
{ "error": "Device not found" }
```

## Per-block telemetry errors (`207`)

Each failed block appears in `errors[]` with its original `seq` (string) and a human-readable message:

```json
{
  "accepted": 0,
  "errors": [
    { "seq": "42", "error": "Invalid signature for device c5785e…a2c66a" }
  ]
}
```

| Message template | Meaning |
|---|---|
| `Device not found: <device_id_hex>` | Device pubkey is not registered in this endpoint's database |
| `Invalid signature for device <device_id_hex>` | Ed25519 verification of `signature` over the `raw` bytes failed against the registered pubkey |

## Typed errors in server code

Domain errors are typed classes in `apps/server/src/domain/errors.ts`. The HTTP layer maps them to per-block entries; anything else becomes a `500`:

```ts
export class InvalidSignatureError extends Error {
  readonly code = 'INVALID_SIGNATURE'
  constructor(deviceId: string) {
    super(`Invalid signature for device ${deviceId}`)
  }
}

export class DeviceNotFoundError extends Error {
  readonly code = 'DEVICE_NOT_FOUND'
  constructor(deviceId: string) {
    super(`Device not found: ${deviceId}`)
  }
}
```

The `code` property is internal; the wire carries the `message`. A stable machine-readable code vocabulary for all errors is on the roadmap, but the strings above are the current contract.
