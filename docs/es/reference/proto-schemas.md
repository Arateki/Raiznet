---
description: Los esquemas Protobuf planificados de Raiznet (ADR-001) — telemetry.proto, device.proto y user.proto — referencia de nombres, números de campo y convenciones.
---

# Esquemas Protobuf

::: info Formato canónico planificado
Estos esquemas definen la codificación binaria canónica **planificada** ([ADR-001](/es/adr/001-protobuf)). El formato de cable en producción hoy es JSON con una cadena raw firmada — consulta [Telemetría](/es/protocol/telemetry). La generación de código aún no está activa.
:::

Todos los archivos `.proto` viven en `packages/protocol/proto/`. Son la referencia para los nombres de campo, números y valores de enum — el formato de cable JSON y el esquema SQLite los siguen.

## telemetry.proto

```protobuf
syntax = "proto3";
package raiznet;

message EncryptedBlob {
  bytes cipher = 1;  // ciphertext + tag de autenticación AES-GCM de 16 bytes
  bytes nonce  = 2;  // nonce GCM de 12 bytes
}

message SensorField {
  oneof value {
    float         plain     = 1;
    EncryptedBlob encrypted = 2;
  }
}

message TelemetryBlock {
  bytes  device_id    = 1;
  uint64 seq          = 2;
  uint64 timestamp    = 3;
  uint64 received_at  = 4;
  uint32 key_version  = 5;

  // Números de campo 10–15: tags Protobuf de 1 byte (eficiente para datos de alta frecuencia)
  SensorField ph           = 10;
  SensorField ec           = 11;
  SensorField water_level  = 12;
  SensorField temp_water   = 13;
  SensorField temp_ambient = 14;
  SensorField humidity     = 15;

  // 16–29 reservados para tipos de sensor futuros

  bytes signature = 30;  // Ed25519 sobre la codificación canónica de los campos 1–15
}

message TelemetryBatch {
  repeated TelemetryBlock blocks = 1;
}
```

### Razón de los números de campo

Protobuf codifica los números de campo 1–15 en un único byte (tag + wire type). Los números 16 y superiores requieren dos bytes. Las lecturas de sensor (campos 10–15) están en el rango de 1 byte para minimizar el tamaño del paquete en dispositivos de alta frecuencia o con restricción de batería.

El campo 30 para la firma está intencionalmente fuera del rango de 1 byte — es grande (64 bytes) y de coste fijo, así que el tamaño de la tag es irrelevante.

::: warning Alcance de la firma hoy
En el formato de cable JSON actual, la firma cubre la [cadena raw delimitada por pipe](/es/protocol/telemetry#raw-string), no una codificación Protobuf. La regla de bytes canónicos para el formato binario se especificará cuando se active el codegen.
:::

---

## device.proto

```protobuf
syntax = "proto3";
package raiznet;

enum Disposition {
  OMIT      = 0;
  PLAIN     = 1;
  ENCRYPTED = 2;
}

message FieldPolicy {
  Disposition              default_disposition = 1;
  map<string, Disposition> per_destination     = 2;
  // clave: pubkey del servidor (hex) o cadena del topic de red
}

enum PublishTo {
  LOCAL_ONLY = 0;
  PUBLIC     = 1;
  BOTH       = 2;
}

enum DeviceType {
  SENSOR_MAINS   = 0;
  SENSOR_BATTERY = 1;
  GATEWAY        = 2;
}

enum DeviceStatus {
  ACTIVE   = 0;
  INACTIVE = 1;
  LOST     = 2;
}

message PrivacyPolicy {
  FieldPolicy ph           = 1;
  FieldPolicy ec           = 2;
  FieldPolicy water_level  = 3;
  FieldPolicy temp_water   = 4;
  FieldPolicy temp_ambient = 5;
  FieldPolicy humidity     = 6;
}

message Hardware {
  string model            = 1;
  string firmware_version = 2;
}

message Device {
  bytes         id                    = 1;
  bytes         mac                   = 2;
  bytes         owner_pubkey          = 3;
  string        name                  = 4;
  DeviceType    type                  = 5;
  uint64        location              = 6;  // índice de la celda H3 (64 bits)
  PublishTo     publish_to            = 7;
  repeated string networks            = 8;  // cadenas de topic de red
  repeated string local_servers       = 9;  // direcciones de servidor para entrega local
  uint32        encryption_key_version = 10;
  PrivacyPolicy privacy_policy        = 11;
  Hardware      hardware              = 12;
  DeviceStatus  status                = 13;
  uint64        created_at            = 14;
}
```

---

## user.proto

```protobuf
syntax = "proto3";
package raiznet;

message Contact {
  string phone   = 1;
  string email   = 2;
  string website = 3;
  string bio     = 4;
}

message User {
  bytes   id         = 1;  // pubkey Ed25519 (32 bytes)
  string  name       = 2;
  Contact contact    = 3;
  uint64  created_at = 4;
}
```

---

## Convenciones de codificación

| Tipo | Codificación |
|---|---|
| pubkeys `bytes(32)` | Bytes crudos en Protobuf; cadena hex en JSON |
| MAC `bytes(6)` | Bytes crudos en Protobuf; cadena hex en minúsculas en JSON (sin dos puntos) |
| Timestamps | `uint64` Unix en milisegundos |
| Celda H3 | `uint64` índice crudo de la celda |
| Valores float de sensor | `float` (IEEE 754 de 32 bits) |
| Blobs cifrados | `bytes` ciphertext + tag de autenticación de 16 bytes anexada; `bytes` nonce de 12 bytes separado |
