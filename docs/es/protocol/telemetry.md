---
description: El contrato de cable de la telemetría Raiznet — bloque JSON, la cadena raw firmada, campos cifrados AES-256-GCM, esquema SQLite, lotes y buffering.
---

# Telemetría

La telemetría es el tipo de dato central de Raiznet: el flujo de lecturas de sensores que va de los dispositivos ESP32 a los servidores. Esta página especifica el contrato de cable **tal como está implementado** — es lo que necesitas para construir un dispositivo compatible con Raiznet.

## El bloque de telemetría

Un bloque es un conjunto de lecturas de un dispositivo en un instante en el tiempo:

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

| Campo | Tipo | Notas |
|---|---|---|
| `deviceId` | string, 64 hex | Pubkey Ed25519 del dispositivo |
| `seq` | **string** | Contador monotónico por dispositivo (uint64 como string) |
| `timestamp` | **string** | Reloj del dispositivo (best-effort), Unix ms (uint64 como string) |
| `keyVersion` | number | Versión de la clave simétrica para campos cifrados (el firmware de referencia envía `0`) |
| campos de sensor | object | Opcionales; `ph`, `ec`, `waterLevel`, `tempWater`, `tempAmbient`, `humidity` |
| `signature` | string, 128 hex | Firma Ed25519 desacoplada sobre los bytes de `raw` |
| `raw` | string, hex | Hex de los bytes UTF-8 de la cadena raw firmada (abajo) |

Cada campo de sensor es plain o encrypted:

```json
"ph": { "plain": 6.2 }
"ph": { "cipher": "5731612f87cc0d953260cd9674bc34ffe5f3caea", "nonce": "222222222222222222222222" }
```

Los campos que el dispositivo no midió (o cuya disposición es `omit` para este destino) simplemente quedan ausentes.

## La cadena raw firmada {#raw-string}

La firma Ed25519 **no** cubre el JSON — cubre una cadena ASCII determinista, delimitada por pipe, que el dispositivo arma antes de serializar:

```
<device_pubkey_hex>|<seq>|<timestamp_ms>|<key_version>[|ec=<v>][|ph=<v>][|waterLevel=<v>][|tempAmbient=<v>][|humidity=<v>]
```

Ejemplo (esta cadena exacta verifica contra la firma del bloque de arriba):

```
c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a|1|1700000000000|0|ec=1800|ph=6.20|waterLevel=80|tempAmbient=24.50|humidity=60.00
```

Reglas:

- El orden de los campos es **fijo**: `ec`, `ph`, `waterLevel`, `tempAmbient`, `humidity`. Los campos ausentes se omiten por completo. (`tempWater` existe en el esquema pero no lo emite el firmware de referencia.)
- Los valores se renderizan con **decimales fijos**: `ec` 0, `ph` 2, `waterLevel` 0, `tempAmbient` 2, `humidity` 2. Nota que `ph=6.20` en el raw se convierte en el número `6.2` en el JSON — las comparaciones deben ser numéricas.
- Solo los campos **plain** aparecen en la cadena raw. Los campos cifrados viajan exclusivamente como `cipher`/`nonce` en el JSON.
- La firma es Ed25519 desacoplada (RFC 8032, determinista) sobre los bytes UTF-8 de la cadena. En el cable, `raw` es la codificación hex de esos bytes.
- El servidor verifica contra la pubkey **registrada** del dispositivo, no contra el `deviceId` declarado en el payload.

::: warning Mantén raw y JSON consistentes
Hoy el servidor verifica solo la firma sobre `raw`. Una verificación cruzada estricta de que los valores `plain` del JSON coinciden con la cadena raw forma parte de la hoja de ruta de endurecimiento — los dispositivos conformes deben enviar siempre ambos consistentes.
:::

## Campos cifrados (AES-256-GCM)

Para un campo con disposición `encrypted`:

- plaintext = el valor como **float32 big-endian** (4 bytes);
- nonce = 12 bytes aleatorios, nuevo en cada campo;
- `cipher` = `ciphertext ‖ tag` (tag GCM de 16 bytes anexada);
- key = la clave simétrica de 32 bytes del dispositivo, versionada por `keyVersion`.

El servidor nunca descifra — almacena `cipher`/`nonce` de forma opaca. El descifrado ocurre en la app del dueño, que guarda el llavero simétrico (`{ versión → clave }`). Los valores cifrados nunca entran en agregaciones de la red.

## Procesamiento en el servidor

Para cada bloque, en orden:

1. **Búsqueda del dispositivo** en la base de destino (endpoint `public` → `raiznet_public.db`, endpoint `local` → `raiznet_private.db`). Dispositivo desconocido → error por bloque `Device not found: <hex>`.
2. **Verificación de la firma** sobre los bytes de `raw` contra la pubkey registrada. Fallo → `Invalid signature for device <hex>`.
3. **Resolución de la disposición** por campo a partir de la política de privacidad del dispositivo: `per_destination[<server_pubkey_hex>] ?? default_disposition`. Un campo ausente de la política resuelve a `omit`.
4. **Proyección a columnas**: valor `plain` con disposición `plain` → columna `_plain`; `cipher`/`nonce` con disposición `encrypted` → columnas `_cipher`/`_nonce`; cualquier discrepancia entre lo que el dispositivo envió y lo que la política permite → almacenado como NULL, silenciosamente.
5. **Inserción** con `INSERT OR IGNORE` con clave `(device_pubkey, seq)`, con `received_at` fijado por el reloj del servidor. Si la fila va a la base pública o privada depende del endpoint y del `publishTo` del dispositivo — consulta [API local](/es/reference/local-api).

## Esquema SQLite

Ambas bases usan el mismo esquema de tabla ancha. Cada sensor tiene tres columnas; NULL tanto en `_plain` como en `_cipher` significa que el campo estaba ausente en esa lectura.

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

Las columnas fijas permiten consultas SQL agregadas rápidas sin parsear JSON. Añadir un nuevo tipo de sensor requiere una migración de esquema (tres columnas nuevas) — el trade-off aceptado a favor del rendimiento de consulta.

## Lotes (batching)

`POST /v1/telemetry` acepta de 1 a 100 bloques por petición. Cada bloque se procesa de forma independiente:

- todos los bloques OK → `200 { "accepted": N, "errors": [] }`;
- algún bloque falló → `207` con errores por bloque (la cadena `seq` original se devuelve como eco);
- cuerpo malformado (sin `blocks`, vacío, o > 100) → `400`.

**Los duplicados son éxito**: un bloque cuyo `(deviceId, seq)` ya existe se cuenta como aceptado. El dispositivo reenvía todo lo que no se confirmó con `200`, y las inserciones idempotentes lo hacen seguro.

## Buffering en el dispositivo

El firmware de referencia (`firmware/safraSense`):

- lee los sensores cada **60 s** (`TELEMETRY_INTERVAL_MS`, valor por defecto amigable para depuración);
- mantiene las últimas **50** lecturas en un ring buffer de RAM (`TELEMETRY_BUFFER_SIZE`);
- reserva `seq` en bloques de **100** (`TELEMETRY_SEQ_BLOCK_SIZE`), persistiendo solo el inicio del próximo bloque en la NVS — los reinicios pueden dejar pequeños huecos en el `seq` pero nunca duplican;
- registra a sí mismo vía `POST /v1/devices` durante el setup (una respuesta `409` cuenta como éxito);
- reenvía las lecturas no confirmadas en cada ciclo hasta que el servidor responda `200`.

Mover el buffer a la flash (para sobrevivir al deep sleep y a la pérdida de energía) está en la hoja de ruta.

## Planificado: formato binario canónico

Los esquemas Protobuf en [Esquemas Protobuf](/es/reference/proto-schemas) definen la codificación canónica planificada para eventos y telemetría. El JSON permanecerá soportado para la generación actual de firmware y para depuración.
