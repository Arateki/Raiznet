# Error Reference

All HTTP endpoints return errors as JSON with an `error` field containing a snake_case code. Domain errors from batch operations (e.g. `POST /v1/telemetry`) appear inline per-item rather than as top-level HTTP errors.

## Error shape

```json
{ "error": "device_not_found" }
```

Validation errors include a `details` array:

```json
{
  "error": "validation_error",
  "details": [
    { "path": "blocks[0].seq", "message": "Required" }
  ]
}
```

## HTTP status codes

| Status | When |
|---|---|
| `200` | Request fully succeeded |
| `207` | Batch partially succeeded — check per-item errors |
| `400` | Malformed request or domain error |
| `401` | Authentication required or failed (local endpoint only) |
| `404` | Resource not found |
| `500` | Unexpected server error |

## Error codes

### Authentication (local endpoint)

| Code | Meaning |
|---|---|
| `unauthorized` | Missing or invalid Bearer token |
| `challenge_expired` | Challenge was not signed within its validity window |
| `invalid_challenge_signature` | Signature over challenge did not verify against the provided pubkey |
| `unknown_pubkey` | Pubkey not recognized as the server owner |

### Devices

| Code | Meaning |
|---|---|
| `device_not_found` | No device with that pubkey in the queried database |

### Telemetry ingestion

| Code | Meaning |
|---|---|
| `invalid_signature` | Ed25519 signature verification failed for this block |
| `invalid_seq` | `seq` is not greater than the last accepted `seq` for this device |
| `device_not_found` | Device pubkey is not registered on this server |
| `unknown_key_version` | `key_version` does not match any known symmetric key for this device |

### General

| Code | Meaning |
|---|---|
| `validation_error` | Request body failed Zod schema validation |
| `internal_error` | Unexpected server-side error — check server logs |

## Typed errors in server code

Domain errors are defined in `apps/server/src/domain/errors.ts` as typed classes. They are never thrown as raw strings:

```ts
export class InvalidSignatureError extends Error {
  readonly code = 'invalid_signature';
}

export class DeviceNotFoundError extends Error {
  readonly code = 'device_not_found';
  constructor(readonly deviceId: string) { super(); }
}
```

HTTP handlers catch these typed errors and map them to the appropriate status codes. Unrecognized errors fall through to a generic `internal_error` handler.
