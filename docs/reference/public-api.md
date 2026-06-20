---
description: A API pública da Raiznet — health, registro de dispositivos, listagem, consulta de telemetria e ingestão assinada, com formatos de requisição e resposta.
---

# API pública

O endpoint público escuta em `0.0.0.0:PUBLIC_PORT` (padrão `3000`). É acessível a qualquer um — sem autenticação. Suas rotas de dispositivo consultam apenas `raiznet_public.db` e nunca retornam dados privados.

Esta página documenta a API **como implementada hoje**. O formato de fio é JSON; uma codificação canônica em Protobuf está planejada (veja [Roadmap](/guide/roadmap)).

## URL base

```
http://<host>:3000
```

---

## Health

### `GET /health`

Retorna o status do servidor e o timestamp atual.

**Resposta `200`**
```json
{
  "status": "ok",
  "ts": 1776819068644
}
```

---

## Dispositivos

### `POST /v1/devices`

Registra um dispositivo. O firmware de referência chama isto automaticamente durante o setup ("registro preguiçoso").

**Corpo da requisição** (`application/json`)
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

| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `id` | string (64 hex) | sim | Pubkey Ed25519 do dispositivo |
| `mac` | string (12 hex) | sim | Minúsculo, sem dois-pontos |
| `ownerPubkey` | string (64 hex) | sim | Pubkey de Usuário do dono |
| `ownerName` | string | não | Usado para fazer upsert do dono em `users` |
| `name` | string (mín. 1) | sim | Nome legível do dispositivo |
| `type` | int `0..2` | não (padrão `0`) | `0` sensor_mains · `1` sensor_battery · `2` gateway |
| `publishTo` | int `0..2` | não (padrão `1`) | `0` local_only · `1` public · `2` both |
| `location` | int | não | Índice da célula H3 (64 bits) |
| `networks` | string[] | não (padrão `[]`) | Topics de rede |
| `localServers` | string[] | não (padrão `[]`) | Endereços de servidores locais |
| `privacyPolicy` | object | não | `FieldPolicy` por campo; campos omitidos assumem `plain` |
| `hardware` | object | não | `{ model, firmware_version }` |

**Resposta `201`**
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

**Resposta `409`** — pubkey já registrada. O firmware de referência trata isto como sucesso.
```json
{ "error": "device_already_exists" }
```

**Resposta `400`** — o corpo falhou na validação de schema.
```json
{ "error": "validation_error", "details": [ /* issues do zod */ ] }
```

Efeito colateral: o dono recebe upsert em `users` com `name = ownerName ?? ownerPubkey.slice(0, 12)`.

---

### `GET /v1/devices`

Retorna todos os dispositivos do banco público. Ainda sem paginação.

**Resposta `200`**
```json
{ "devices": [ /* mesmo formato da resposta de registro */ ] }
```

---

### `GET /v1/devices/:id`

Retorna um único dispositivo pela sua pubkey (hex).

**Resposta `200`** — `{ "device": { ... } }`

**Resposta `404`**
```json
{ "error": "Device not found" }
```

---

### `GET /v1/devices/:id/telemetry`

Retorna as leituras mais recentes, ordenadas por `timestamp DESC`, com `LIMIT 500` fixo. Ainda sem parâmetros de query.

**Resposta `200`**
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

Cada campo de sensor é um de:

| Formato | Significado |
|---|---|
| `{ "value": <number> }` | Armazenado em claro |
| `{ "encrypted": "<hex>" }` | Armazenado criptografado — ciphertext+tag, **o nonce não é exposto aqui** |
| `null` | Ausente nesta leitura (omitido por política ou não medido) |

---

## Ingestão de telemetria

### `POST /v1/telemetry`

Recebe um lote de 1 a 100 blocos de telemetria assinados.

**Corpo da requisição** (`application/json`)
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
      "raw": "<hex dos bytes UTF-8 da string raw assinada>"
    }
  ]
}
```

::: warning seq e timestamp são strings
`seq` e `timestamp` são serializados como **strings** (seguras para uint64), não como números. `keyVersion` é um número.
:::

Os campos de sensor são opcionais. Cada um é `{ "plain": <number> }` ou `{ "cipher": "<hex>", "nonce": "<hex>" }`. A assinatura é Ed25519 (destacada) sobre os bytes da string `raw` — veja [Telemetria](/protocol/telemetry) sobre como o `raw` é construído. O servidor a verifica contra a pubkey **registrada** do dispositivo, não a que está no payload.

**Resposta `200`** — todos os blocos aceitos
```json
{ "accepted": 1, "errors": [] }
```

**Resposta `207`** — pelo menos um bloco falhou
```json
{
  "accepted": 0,
  "errors": [
    { "seq": "1", "error": "Device not found: c5785e1865…a2c66a" }
  ]
}
```

Mensagens de erro por bloco (strings exatas):

| Mensagem | Causa |
|---|---|
| `Device not found: <device_id_hex>` | O dispositivo não está registrado no banco deste endpoint |
| `Invalid signature for device <device_id_hex>` | A verificação Ed25519 sobre o `raw` falhou |

**Resposta `400`** — corpo sem `blocks`, vazio, ou com mais de 100 itens.

### Semântica de ingestão

- **Duplicatas são sucesso.** Reenviar um `(deviceId, seq)` já armazenado retorna `200` com ele contado em `accepted` — as inserções usam `INSERT OR IGNORE`. Espera-se que os clientes reenviem tudo que não foi confirmado com um `200`.
- **Dispositivo desconhecido retorna `207`, nunca `404`.** Registre o dispositivo primeiro via `POST /v1/devices`.
- **Sem verificação de monotonicidade.** Valores de `seq` antigos que nunca foram confirmados podem ser reenviados após uma reconexão; a deduplicação é pela chave primária `(device_pubkey, seq)`.
- Um dispositivo com `publishTo: 0` (local_only) que poste no endpoint público é validado e contado como aceito, mas **nada é armazenado** no banco público.
