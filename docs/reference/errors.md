---
description: Referência de erros do servidor Raiznet — códigos de status HTTP, formatos de erro de topo, erros de telemetria por bloco e classes de erro tipadas.
---

# Referência de erros

Esta página lista os erros que o servidor retorna **hoje**, com formatos exatos — eles fazem parte do contrato de compatibilidade (o firmware de referência depende de alguns deles).

## Códigos de status HTTP

| Status | Quando |
|---|---|
| `200` | A requisição teve sucesso completo — incluindo lotes de telemetria em que todos os blocos foram aceitos (duplicatas contam como aceitas) |
| `201` | Dispositivo registrado |
| `207` | Lote de telemetria em que pelo menos um bloco falhou — confira `errors[]` |
| `400` | O corpo da requisição falhou na validação de schema |
| `404` | `GET /v1/devices/:id` para um dispositivo desconhecido |
| `409` | `POST /v1/devices` para uma pubkey já registrada |
| `500` | Erro inesperado do servidor |

::: warning Dois comportamentos que integradores costumam errar
- Telemetria de um **dispositivo desconhecido** retorna `207` com um erro por bloco — nunca `404`.
- Um **bloco duplicado** (mesmo `deviceId` + `seq`) retorna `200` e conta como aceito. Duplicatas são sucesso, não erro.
:::

## Formatos de erro de topo

**Falha de validação** (`400`) — `details` contém os issues brutos do Zod:

```json
{
  "error": "validation_error",
  "details": [
    { "code": "too_small", "path": ["name"], "message": "String must contain at least 1 character(s)" }
  ]
}
```

**Dispositivo já existe** (`409`):

```json
{ "error": "device_already_exists" }
```

**Dispositivo não encontrado** (`404`, `GET /v1/devices/:id`):

```json
{ "error": "Device not found" }
```

## Erros de telemetria por bloco (`207`)

Cada bloco que falhou aparece em `errors[]` com seu `seq` original (string) e uma mensagem legível:

```json
{
  "accepted": 0,
  "errors": [
    { "seq": "42", "error": "Invalid signature for device c5785e…a2c66a" }
  ]
}
```

| Modelo da mensagem | Significado |
|---|---|
| `Device not found: <device_id_hex>` | A pubkey do dispositivo não está registrada no banco deste endpoint |
| `Invalid signature for device <device_id_hex>` | A verificação Ed25519 da `signature` sobre os bytes de `raw` falhou contra a pubkey registrada |

## Erros tipados no código do servidor

Erros de domínio são classes tipadas em `apps/server/src/domain/errors.ts`. A camada HTTP os mapeia para entradas por bloco; qualquer outra coisa vira um `500`:

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

A propriedade `code` é interna; o fio carrega a `message`. Um vocabulário estável de códigos legíveis por máquina para todos os erros está no roadmap, mas as strings acima são o contrato atual.
