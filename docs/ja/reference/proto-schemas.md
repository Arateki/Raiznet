---
description: Raiznetの計画中のProtobufスキーマ（ADR-001）— telemetry.proto、device.proto、user.proto — 名前、フィールド番号、規約のリファレンス。
---

# Protobufスキーマ

::: info 計画中の正規フォーマット
これらのスキーマは **計画中** の正規バイナリエンコーディングを定義します（[ADR-001](/ja/adr/001-protobuf)）。今日の本番ワイヤフォーマットは署名付きrawストリングを伴うJSONです — [テレメトリ](/ja/protocol/telemetry) を参照。コード生成はまだ稼働していません。
:::

すべての `.proto` ファイルは `packages/protocol/proto/` にあります。これらはフィールド名、番号、enum値のリファレンスです — JSONワイヤフォーマットとSQLiteスキーマはこれに従います。

## telemetry.proto

```protobuf
syntax = "proto3";
package raiznet;

message EncryptedBlob {
  bytes cipher = 1;  // ciphertext + 16バイトのAES-GCM認証タグ
  bytes nonce  = 2;  // 12バイトのGCM nonce
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

  // フィールド番号 10–15: 1バイトのProtobufタグ（高頻度データに効率的）
  SensorField ph           = 10;
  SensorField ec           = 11;
  SensorField water_level  = 12;
  SensorField temp_water   = 13;
  SensorField temp_ambient = 14;
  SensorField humidity     = 15;

  // 16–29 は将来のセンサー型のために予約

  bytes signature = 30;  // フィールド1–15の正規エンコーディングに対するEd25519
}

message TelemetryBatch {
  repeated TelemetryBlock blocks = 1;
}
```

### フィールド番号の根拠

Protobufはフィールド番号1–15を1バイト（タグ + ワイヤ型）でエンコードします。16以上の番号は2バイトを要します。センサー読み取り（フィールド10–15）は、高頻度またはバッテリー制約のあるデバイスでパケットサイズを最小化するため、1バイトの範囲にあります。

署名のフィールド30は意図的に1バイトの範囲外です — 大きく（64バイト）固定コストなので、タグサイズは無関係です。

::: warning 今日の署名の範囲
現在のJSONワイヤフォーマットでは、署名はProtobufエンコーディングではなく [パイプ区切りrawストリング](/ja/protocol/telemetry#raw-string) をカバーします。バイナリフォーマットの正規バイトのルールは、codegenが有効化されるときに仕様化されます。
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
  // キー: サーバーpubkey（hex）またはネットワークtopic文字列
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
  uint64        location              = 6;  // H3セルのインデックス（64ビット）
  PublishTo     publish_to            = 7;
  repeated string networks            = 8;  // ネットワークtopic文字列
  repeated string local_servers       = 9;  // ローカル配送用のサーバーアドレス
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
  bytes   id         = 1;  // Ed25519 pubkey（32バイト）
  string  name       = 2;
  Contact contact    = 3;
  uint64  created_at = 4;
}
```

---

## エンコーディング規約

| 型 | エンコーディング |
|---|---|
| `bytes(32)` pubkey | Protobufでは生バイト; JSONではhex文字列 |
| `bytes(6)` MAC | Protobufでは生バイト; JSONでは小文字hex文字列（コロンなし） |
| タイムスタンプ | `uint64` Unixミリ秒 |
| H3セル | `uint64` 生のセルインデックス |
| float のセンサー値 | `float`（32ビットIEEE 754） |
| 暗号化blob | `bytes` ciphertext + 付加された16バイト認証タグ; `bytes` 12バイトnonceは別 |
