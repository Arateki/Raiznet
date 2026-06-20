---
description: La API pública de Raiznet — health, registro de dispositivos, listado, consulta de telemetría e ingesta firmada, con formatos de petición y respuesta.
---

# API pública

El endpoint público escucha en `0.0.0.0:PUBLIC_PORT` (por defecto `3000`). Es accesible para cualquiera — sin autenticación. Sus rutas de dispositivo consultan solo `raiznet_public.db` y nunca devuelven datos privados.

Esta página documenta la API **tal como está implementada hoy**. El formato de cable es JSON; una codificación canónica en Protobuf está planificada (consulta la [Hoja de ruta](/es/guide/roadmap)).

## URL base

```
http://<host>:3000
```

---

## Health

### `GET /health`

Devuelve el estado del servidor y el timestamp actual.

**Respuesta `200`**
```json
{
  "status": "ok",
  "ts": 1776819068644
}
```

---

## Dispositivos

### `POST /v1/devices`

Registra un dispositivo. El firmware de referencia llama a esto automáticamente durante el setup ("registro perezoso").

**Cuerpo de la petición** (`application/json`)
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

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | string (64 hex) | sí | Pubkey Ed25519 del dispositivo |
| `mac` | string (12 hex) | sí | Minúsculas, sin dos puntos |
| `ownerPubkey` | string (64 hex) | sí | Pubkey de Usuario del dueño |
| `ownerName` | string | no | Usado para hacer upsert del dueño en `users` |
| `name` | string (mín. 1) | sí | Nombre legible del dispositivo |
| `type` | int `0..2` | no (por defecto `0`) | `0` sensor_mains · `1` sensor_battery · `2` gateway |
| `publishTo` | int `0..2` | no (por defecto `1`) | `0` local_only · `1` public · `2` both |
| `location` | int | no | Índice de la celda H3 (64 bits) |
| `networks` | string[] | no (por defecto `[]`) | Topics de red |
| `localServers` | string[] | no (por defecto `[]`) | Direcciones de servidores locales |
| `privacyPolicy` | object | no | `FieldPolicy` por campo; los campos omitidos asumen `plain` |
| `hardware` | object | no | `{ model, firmware_version }` |

**Respuesta `201`**
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

**Respuesta `409`** — pubkey ya registrada. El firmware de referencia trata esto como éxito.
```json
{ "error": "device_already_exists" }
```

**Respuesta `400`** — el cuerpo falló la validación de esquema.
```json
{ "error": "validation_error", "details": [ /* issues de zod */ ] }
```

Efecto colateral: el dueño recibe upsert en `users` con `name = ownerName ?? ownerPubkey.slice(0, 12)`.

---

### `GET /v1/devices`

Devuelve todos los dispositivos de la base pública. Aún sin paginación.

**Respuesta `200`**
```json
{ "devices": [ /* mismo formato que la respuesta de registro */ ] }
```

---

### `GET /v1/devices/:id`

Devuelve un único dispositivo por su pubkey (hex).

**Respuesta `200`** — `{ "device": { ... } }`

**Respuesta `404`**
```json
{ "error": "Device not found" }
```

---

### `GET /v1/devices/:id/telemetry`

Devuelve las lecturas más recientes, ordenadas por `timestamp DESC`, con `LIMIT 500` fijo. Aún sin parámetros de query.

**Respuesta `200`**
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

Cada campo de sensor es uno de:

| Formato | Significado |
|---|---|
| `{ "value": <number> }` | Almacenado en claro |
| `{ "encrypted": "<hex>" }` | Almacenado cifrado — ciphertext+tag, **el nonce no se expone aquí** |
| `null` | Ausente en esta lectura (omitido por política o no medido) |

---

## Ingesta de telemetría

### `POST /v1/telemetry`

Recibe un lote de 1 a 100 bloques de telemetría firmados.

**Cuerpo de la petición** (`application/json`)
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
      "raw": "<hex de los bytes UTF-8 de la cadena raw firmada>"
    }
  ]
}
```

::: warning seq y timestamp son strings
`seq` y `timestamp` se serializan como **strings** (seguras para uint64), no como números. `keyVersion` es un número.
:::

Los campos de sensor son opcionales. Cada uno es `{ "plain": <number> }` o `{ "cipher": "<hex>", "nonce": "<hex>" }`. La firma es Ed25519 (desacoplada) sobre los bytes de la cadena `raw` — consulta [Telemetría](/es/protocol/telemetry) sobre cómo se construye el `raw`. El servidor la verifica contra la pubkey **registrada** del dispositivo, no la que está en el payload.

**Respuesta `200`** — todos los bloques aceptados
```json
{ "accepted": 1, "errors": [] }
```

**Respuesta `207`** — al menos un bloque falló
```json
{
  "accepted": 0,
  "errors": [
    { "seq": "1", "error": "Device not found: c5785e1865…a2c66a" }
  ]
}
```

Mensajes de error por bloque (cadenas exactas):

| Mensaje | Causa |
|---|---|
| `Device not found: <device_id_hex>` | El dispositivo no está registrado en la base de este endpoint |
| `Invalid signature for device <device_id_hex>` | La verificación Ed25519 sobre el `raw` falló |

**Respuesta `400`** — cuerpo sin `blocks`, vacío, o con más de 100 ítems.

### Semántica de ingesta

- **Los duplicados son éxito.** Reenviar un `(deviceId, seq)` ya almacenado devuelve `200` con él contado en `accepted` — las inserciones usan `INSERT OR IGNORE`. Se espera que los clientes reenvíen todo lo que no se confirmó con un `200`.
- **El dispositivo desconocido devuelve `207`, nunca `404`.** Registra el dispositivo primero vía `POST /v1/devices`.
- **Sin verificación de monotonicidad.** Los valores de `seq` antiguos que nunca se confirmaron pueden reenviarse tras una reconexión; la deduplicación es por la clave primaria `(device_pubkey, seq)`.
- Un dispositivo con `publishTo: 0` (local_only) que postee en el endpoint público es validado y contado como aceptado, pero **no se almacena nada** en la base pública.
