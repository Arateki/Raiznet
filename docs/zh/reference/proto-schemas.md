---
description: Raiznet 计划中的 Protobuf 模式（ADR-001）—— telemetry.proto、device.proto 与 user.proto —— 名称、字段号与约定的参考。
---

# Protobuf 模式

::: info 计划中的规范格式
这些模式定义 **计划中** 的规范二进制编码（[ADR-001](/zh/adr/001-protobuf)）。今日生产中的线缆格式是带签名 raw 字符串的 JSON —— 参阅 [遥测](/zh/protocol/telemetry)。代码生成尚未启用。
:::

所有 `.proto` 文件位于 `packages/protocol/proto/`。它们是字段名、字段号和枚举值的参考 —— JSON 线缆格式与 SQLite 模式遵循它们。

## telemetry.proto

```protobuf
syntax = "proto3";
package raiznet;

message EncryptedBlob {
  bytes cipher = 1;  // 密文 + 16 字节 AES-GCM 认证标签
  bytes nonce  = 2;  // 12 字节 GCM nonce
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

  // 字段号 10–15：1 字节 Protobuf 标签（对高频数据高效）
  SensorField ph           = 10;
  SensorField ec           = 11;
  SensorField water_level  = 12;
  SensorField temp_water   = 13;
  SensorField temp_ambient = 14;
  SensorField humidity     = 15;

  // 16–29 预留给未来的传感器类型

  bytes signature = 30;  // 对字段 1–15 规范编码的 Ed25519
}

message TelemetryBatch {
  repeated TelemetryBlock blocks = 1;
}
```

### 字段号的理由

Protobuf 将字段号 1–15 编码为单个字节（标签 + 线缆类型）。16 及以上的号需要两个字节。传感器读数（字段 10–15）处于 1 字节范围,以便为高频或电池受限的设备最小化数据包大小。

签名的字段 30 刻意处于 1 字节范围之外 —— 它很大（64 字节）且为固定开销,因此标签大小无关紧要。

::: warning 今日的签名范围
在当前 JSON 线缆格式中,签名覆盖 [以竖线分隔的 raw 字符串](/zh/protocol/telemetry#raw-string),而非 Protobuf 编码。二进制格式的规范字节规则将在启用 codegen 时规范化。
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
  // 键：服务器 pubkey（hex）或网络 topic 字符串
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
  uint64        location              = 6;  // H3 单元索引（64 位）
  PublishTo     publish_to            = 7;
  repeated string networks            = 8;  // 网络 topic 字符串
  repeated string local_servers       = 9;  // 本地投递的服务器地址
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
  bytes   id         = 1;  // Ed25519 pubkey（32 字节）
  string  name       = 2;
  Contact contact    = 3;
  uint64  created_at = 4;
}
```

---

## 编码约定

| 类型 | 编码 |
|---|---|
| `bytes(32)` pubkey | Protobuf 中为原始字节；JSON 中为 hex 字符串 |
| `bytes(6)` MAC | Protobuf 中为原始字节；JSON 中为小写 hex 字符串（无冒号） |
| 时间戳 | `uint64` Unix 毫秒 |
| H3 单元 | `uint64` 原始单元索引 |
| float 传感器值 | `float`（32 位 IEEE 754） |
| 加密 blob | `bytes` 密文 + 附加的 16 字节认证标签；`bytes` 12 字节 nonce 单独 |
