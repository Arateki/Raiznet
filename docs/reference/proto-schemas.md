---
description: Os schemas Protobuf planejados da Raiznet (ADR-001) — telemetry.proto, device.proto e user.proto — referência de nomes, números de campo e convenções.
---

# Schemas Protobuf

::: info Formato canônico planejado
Estes schemas definem a codificação binária canônica **planejada** ([ADR-001](/adr/001-protobuf)). O formato de fio em produção hoje é JSON com uma string raw assinada — veja [Telemetria](/protocol/telemetry). A geração de código ainda não está ativa.
:::

Todos os arquivos `.proto` vivem em `packages/protocol/proto/`. Eles são a referência para nomes de campo, números e valores de enum — o formato de fio JSON e o schema SQLite os seguem.

## telemetry.proto

```protobuf
syntax = "proto3";
package raiznet;

message EncryptedBlob {
  bytes cipher = 1;  // ciphertext + tag de autenticação AES-GCM de 16 bytes
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

  // Números de campo 10–15: tags Protobuf de 1 byte (eficiente para dados de alta frequência)
  SensorField ph           = 10;
  SensorField ec           = 11;
  SensorField water_level  = 12;
  SensorField temp_water   = 13;
  SensorField temp_ambient = 14;
  SensorField humidity     = 15;

  // 16–29 reservados para tipos de sensor futuros

  bytes signature = 30;  // Ed25519 sobre a codificação canônica dos campos 1–15
}

message TelemetryBatch {
  repeated TelemetryBlock blocks = 1;
}
```

### Razão dos números de campo

O Protobuf codifica os números de campo 1–15 em um único byte (tag + wire type). Números 16 e acima exigem dois bytes. As leituras de sensor (campos 10–15) estão na faixa de 1 byte para minimizar o tamanho do pacote em dispositivos de alta frequência ou com restrição de bateria.

O campo 30 para a assinatura está intencionalmente fora da faixa de 1 byte — ele é grande (64 bytes) e de custo fixo, então o tamanho da tag é irrelevante.

::: warning Escopo da assinatura hoje
No formato de fio JSON atual, a assinatura cobre a [string raw delimitada por pipe](/protocol/telemetry#a-string-raw-assinada), não uma codificação Protobuf. A regra de bytes canônicos para o formato binário será especificada quando o codegen for ativado.
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
  // chave: pubkey do servidor (hex) ou string do topic de rede
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
  uint64        location              = 6;  // índice da célula H3 (64 bits)
  PublishTo     publish_to            = 7;
  repeated string networks            = 8;  // strings de topic de rede
  repeated string local_servers       = 9;  // endereços de servidor para entrega local
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

## Convenções de codificação

| Tipo | Codificação |
|---|---|
| pubkeys `bytes(32)` | Bytes crus no Protobuf; string hex no JSON |
| MAC `bytes(6)` | Bytes crus no Protobuf; string hex minúscula no JSON (sem dois-pontos) |
| Timestamps | `uint64` Unix em milissegundos |
| Célula H3 | `uint64` índice cru da célula |
| Valores float de sensor | `float` (IEEE 754 de 32 bits) |
| Blobs criptografados | `bytes` ciphertext + tag de autenticação de 16 bytes anexada; `bytes` nonce de 12 bytes separado |
