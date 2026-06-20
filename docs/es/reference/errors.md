---
description: Referencia de errores del servidor Raiznet — códigos de estado HTTP, formatos de error de nivel superior, errores de telemetría por bloque y clases tipadas.
---

# Referencia de errores

Esta página lista los errores que el servidor devuelve **hoy**, con formatos exactos — forman parte del contrato de compatibilidad (el firmware de referencia depende de algunos de ellos).

## Códigos de estado HTTP

| Estado | Cuándo |
|---|---|
| `200` | La petición tuvo éxito completo — incluidos los lotes de telemetría donde todos los bloques fueron aceptados (los duplicados cuentan como aceptados) |
| `201` | Dispositivo registrado |
| `207` | Lote de telemetría donde al menos un bloque falló — revisa `errors[]` |
| `400` | El cuerpo de la petición falló la validación de esquema |
| `404` | `GET /v1/devices/:id` para un dispositivo desconocido |
| `409` | `POST /v1/devices` para una pubkey ya registrada |
| `500` | Error inesperado del servidor |

::: warning Dos comportamientos que los integradores suelen equivocar
- La telemetría de un **dispositivo desconocido** devuelve `207` con un error por bloque — nunca `404`.
- Un **bloque duplicado** (mismo `deviceId` + `seq`) devuelve `200` y cuenta como aceptado. Los duplicados son éxito, no error.
:::

## Formatos de error de nivel superior

**Fallo de validación** (`400`) — `details` contiene los issues brutos de Zod:

```json
{
  "error": "validation_error",
  "details": [
    { "code": "too_small", "path": ["name"], "message": "String must contain at least 1 character(s)" }
  ]
}
```

**El dispositivo ya existe** (`409`):

```json
{ "error": "device_already_exists" }
```

**Dispositivo no encontrado** (`404`, `GET /v1/devices/:id`):

```json
{ "error": "Device not found" }
```

## Errores de telemetría por bloque (`207`)

Cada bloque que falló aparece en `errors[]` con su `seq` original (string) y un mensaje legible:

```json
{
  "accepted": 0,
  "errors": [
    { "seq": "42", "error": "Invalid signature for device c5785e…a2c66a" }
  ]
}
```

| Plantilla del mensaje | Significado |
|---|---|
| `Device not found: <device_id_hex>` | La pubkey del dispositivo no está registrada en la base de este endpoint |
| `Invalid signature for device <device_id_hex>` | La verificación Ed25519 de la `signature` sobre los bytes de `raw` falló contra la pubkey registrada |

## Errores tipados en el código del servidor

Los errores de dominio son clases tipadas en `apps/server/src/domain/errors.ts`. La capa HTTP los mapea a entradas por bloque; cualquier otra cosa se convierte en un `500`:

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

La propiedad `code` es interna; el cable lleva el `message`. Un vocabulario estable de códigos legibles por máquina para todos los errores está en la hoja de ruta, pero las cadenas de arriba son el contrato actual.
