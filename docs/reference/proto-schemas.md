# Proto Schemas

::: info Planned canonical format
These schemas define the **planned** canonical binary encoding ([ADR-001](/adr/001-protobuf)). The wire format in production today is JSON with a signed raw string — see [Telemetry](/protocol/telemetry). Code generation is not active yet.
:::

All `.proto` files live in `packages/protocol/proto/`. They are the reference for field names, numbers, and enum values — the JSON wire format and the SQLite schema follow them.

## telemetry.proto

```protobuf
syntax = "proto3";
package raiznet;

message EncryptedBlob {
  bytes cipher = 1;  // ciphertext + 16-byte AES-GCM auth tag
  bytes nonce  = 2;  // 12-byte GCM nonce
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

  // Field numbers 10–15: 1-byte Protobuf tags (efficient for high-frequency data)
  SensorField ph           = 10;
  SensorField ec           = 11;
  SensorField water_level  = 12;
  SensorField temp_water   = 13;
  SensorField temp_ambient = 14;
  SensorField humidity     = 15;

  // 16–29 reserved for future sensor types

  bytes signature = 30;  // Ed25519 over canonical encoding of fields 1–15
}

message TelemetryBatch {
  repeated TelemetryBlock blocks = 1;
}
```

### Field number rationale

Protobuf encodes field numbers 1–15 in a single byte (tag + wire type). Numbers 16 and above require two bytes. Sensor readings (fields 10–15) are in the 1-byte range to minimize packet size for high-frequency or battery-constrained devices.

Field 30 for the signature is intentionally outside the 1-byte range — it is large (64 bytes) and fixed cost, so the tag size is irrelevant.

::: warning Signature scope today
In the current JSON wire format the signature covers the [pipe-delimited raw string](/protocol/telemetry#the-signed-raw-string), not a Protobuf encoding. The canonical-bytes rule for the binary format will be specified when codegen is activated.
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
  // key: server pubkey (hex) or network topic string
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
  uint64        location              = 6;  // H3 cell index (64-bit)
  PublishTo     publish_to            = 7;
  repeated string networks            = 8;  // network topic strings
  repeated string local_servers       = 9;  // server addresses for local delivery
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
  bytes   id         = 1;  // Ed25519 pubkey (32 bytes)
  string  name       = 2;
  Contact contact    = 3;
  uint64  created_at = 4;
}
```

---

## Encoding conventions

| Type | Encoding |
|---|---|
| `bytes(32)` pubkeys | Raw bytes in Protobuf; hex string in JSON |
| `bytes(6)` MAC | Raw bytes in Protobuf; lowercase hex string in JSON (no colons) |
| Timestamps | `uint64` Unix milliseconds |
| H3 cell | `uint64` raw cell index |
| Float sensor values | `float` (32-bit IEEE 754) |
| Encrypted blobs | `bytes` ciphertext + appended 16-byte auth tag; `bytes` 12-byte nonce separate |
