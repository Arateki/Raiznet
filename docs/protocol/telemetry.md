---
description: O contrato de fio da telemetria Raiznet — bloco JSON, a string raw assinada, campos criptografados AES-256-GCM, schema SQLite, lotes e buffering.
---

# Telemetria

Telemetria é o tipo de dado central da Raiznet: o fluxo de leituras de sensores que vai dos dispositivos ESP32 aos servidores. Esta página especifica o contrato de fio **como implementado** — é o que você precisa para construir um dispositivo compatível com a Raiznet.

## O bloco de telemetria

Um bloco é um conjunto de leituras de um dispositivo em um instante no tempo:

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
| `deviceId` | string, 64 hex | Pubkey Ed25519 do dispositivo |
| `seq` | **string** | Contador monotônico por dispositivo (uint64 como string) |
| `timestamp` | **string** | Relógio do dispositivo (best-effort), Unix ms (uint64 como string) |
| `keyVersion` | number | Versão da chave simétrica para campos criptografados (o firmware de referência envia `0`) |
| campos de sensor | object | Opcionais; `ph`, `ec`, `waterLevel`, `tempWater`, `tempAmbient`, `humidity` |
| `signature` | string, 128 hex | Assinatura Ed25519 destacada sobre os bytes de `raw` |
| `raw` | string, hex | Hex dos bytes UTF-8 da string raw assinada (abaixo) |

Cada campo de sensor é plain ou encrypted:

```json
"ph": { "plain": 6.2 }
"ph": { "cipher": "5731612f87cc0d953260cd9674bc34ffe5f3caea", "nonce": "222222222222222222222222" }
```

Campos que o dispositivo não mediu (ou cuja disposição é `omit` para este destino) simplesmente ficam ausentes.

## A string raw assinada

A assinatura Ed25519 **não** cobre o JSON — ela cobre uma string ASCII determinística, delimitada por pipe, que o dispositivo monta antes de serializar:

```
<device_pubkey_hex>|<seq>|<timestamp_ms>|<key_version>[|ec=<v>][|ph=<v>][|waterLevel=<v>][|tempAmbient=<v>][|humidity=<v>]
```

Exemplo (esta string exata verifica contra a assinatura do bloco acima):

```
c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a|1|1700000000000|0|ec=1800|ph=6.20|waterLevel=80|tempAmbient=24.50|humidity=60.00
```

Regras:

- A ordem dos campos é **fixa**: `ec`, `ph`, `waterLevel`, `tempAmbient`, `humidity`. Campos ausentes são pulados inteiramente. (`tempWater` existe no schema mas não é emitido pelo firmware de referência.)
- Os valores são renderizados com **casas decimais fixas**: `ec` 0, `ph` 2, `waterLevel` 0, `tempAmbient` 2, `humidity` 2. Note que `ph=6.20` no raw vira o número `6.2` no JSON — as comparações devem ser numéricas.
- Apenas campos **plain** aparecem na string raw. Campos criptografados trafegam exclusivamente como `cipher`/`nonce` no JSON.
- A assinatura é Ed25519 destacada (RFC 8032, determinística) sobre os bytes UTF-8 da string. No fio, `raw` é a codificação hex desses bytes.
- O servidor verifica contra a pubkey **registrada** do dispositivo, não contra o `deviceId` declarado no payload.

::: warning Mantenha raw e JSON consistentes
Hoje o servidor verifica apenas a assinatura sobre `raw`. Uma verificação cruzada estrita de que os valores `plain` do JSON casam com a string raw faz parte do roadmap de endurecimento — dispositivos em conformidade devem sempre enviar ambos consistentes.
:::

## Campos criptografados (AES-256-GCM)

Para um campo com disposição `encrypted`:

- plaintext = o valor como **float32 big-endian** (4 bytes);
- nonce = 12 bytes aleatórios, novo a cada campo;
- `cipher` = `ciphertext ‖ tag` (tag GCM de 16 bytes anexada);
- key = a chave simétrica de 32 bytes do dispositivo, versionada por `keyVersion`.

O servidor nunca descriptografa — ele armazena `cipher`/`nonce` de forma opaca. A descriptografia acontece no app do dono, que guarda o chaveiro simétrico (`{ versão → chave }`). Valores criptografados nunca entram em agregações da rede.

## Processamento no servidor

Para cada bloco, em ordem:

1. **Busca do dispositivo** no banco de destino (endpoint `public` → `raiznet_public.db`, endpoint `local` → `raiznet_private.db`). Dispositivo desconhecido → erro por bloco `Device not found: <hex>`.
2. **Verificação da assinatura** sobre os bytes de `raw` contra a pubkey registrada. Falha → `Invalid signature for device <hex>`.
3. **Resolução da disposição** por campo a partir da política de privacidade do dispositivo: `per_destination[<server_pubkey_hex>] ?? default_disposition`. Um campo ausente da política resolve para `omit`.
4. **Projeção para colunas**: valor `plain` com disposição `plain` → coluna `_plain`; `cipher`/`nonce` com disposição `encrypted` → colunas `_cipher`/`_nonce`; qualquer divergência entre o que o dispositivo enviou e o que a política permite → armazenado como NULL, silenciosamente.
5. **Inserção** com `INSERT OR IGNORE` chaveada por `(device_pubkey, seq)`, com `received_at` definido pelo relógio do servidor. Se a linha vai para o banco público ou privado depende do endpoint e do `publishTo` do dispositivo — veja [API local](/reference/local-api).

## Schema SQLite

Ambos os bancos usam o mesmo schema de tabela larga. Cada sensor tem três colunas; NULL tanto em `_plain` quanto em `_cipher` significa que o campo estava ausente naquela leitura.

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

Colunas fixas permitem consultas SQL agregadas rápidas sem parsear JSON. Adicionar um novo tipo de sensor exige uma migração de schema (três colunas novas) — o trade-off aceito em prol da performance de consulta.

## Lotes (batching)

`POST /v1/telemetry` aceita de 1 a 100 blocos por requisição. Cada bloco é processado de forma independente:

- todos os blocos OK → `200 { "accepted": N, "errors": [] }`;
- algum bloco falhou → `207` com erros por bloco (a string `seq` original é ecoada de volta);
- corpo malformado (sem `blocks`, vazio, ou > 100) → `400`.

**Duplicatas são sucesso**: um bloco cujo `(deviceId, seq)` já existe é contado como aceito. O dispositivo reenvia tudo que não foi confirmado com `200`, e as inserções idempotentes tornam isso seguro.

## Buffering no dispositivo

O firmware de referência (`firmware/safraSense`):

- lê os sensores a cada **60 s** (`TELEMETRY_INTERVAL_MS`, padrão amigável a debug);
- mantém as últimas **50** leituras num ring buffer de RAM (`TELEMETRY_BUFFER_SIZE`);
- reserva `seq` em blocos de **100** (`TELEMETRY_SEQ_BLOCK_SIZE`), persistindo apenas o início do próximo bloco na NVS — reboots podem deixar pequenas lacunas no `seq` mas nunca duplicam;
- registra a si mesmo via `POST /v1/devices` durante o setup (uma resposta `409` conta como sucesso);
- reenvia as leituras não confirmadas a cada ciclo até o servidor responder `200`.

Mover o buffer para a flash (para sobreviver ao deep sleep e à perda de energia) está no roadmap.

## Planejado: formato binário canônico

Os schemas Protobuf em [Schemas Protobuf](/reference/proto-schemas) definem a codificação canônica planejada para eventos e telemetria. O JSON permanecerá suportado para a geração atual de firmware e para depuração.
