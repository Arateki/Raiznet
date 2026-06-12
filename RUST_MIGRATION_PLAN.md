# Plano de migração do nó Raiznet para Rust (`raiznetd`)

> **Para agentes executores:** use a skill `superpowers:executing-plans` (ou
> `superpowers:subagent-driven-development`) para implementar este plano
> tarefa a tarefa. Os passos usam checkboxes (`- [ ]`) para acompanhamento.
> Leia a seção 0 (regras) e a seção 7 (contratos congelados) **antes** de
> escrever qualquer linha de Rust.

**Goal:** criar um daemon Rust (`raiznetd`) que substitui o servidor Node.js
atual com paridade de comportamento observável, rodando em hardware ARM64
pequeno (Snapdragon 410 / OpenStick, ~250 MB de RAM livre) sem nenhum runtime
adicional.

**Arquitetura:** workspace Cargo dentro do monorepo existente. O servidor
TypeScript (`apps/server`) vira referência de comportamento e é congelado.
A paridade é provada por um corpus de fixtures compartilhado (Fase 0). Depois
da paridade (Fases 0–5), o sistema evolui para event log próprio e replicação
Raiznet-native, sem Hypercore/Holepunch.

**Tech stack:** Rust (edition 2024), tokio, axum, rusqlite (bundled),
ed25519-dalek, aes-gcm, bip39, serde/serde_json, tracing, thiserror.

Este documento é um guia interno. Ele não faz parte da documentação pública do
protocolo. O objetivo **não** é manter compatibilidade com Holepunch,
Hypercore, Hyperswarm ou outros nós desse ecossistema — é preservar os
conceitos que importam para o Raiznet e reimplementá-los como protocolo
próprio, leve e adequado para hardware pequeno.

---

## 0. Regras para o agente executor

Estas regras existem porque agentes com menos contexto tendem a "consertar" o
que não entendem. Não faça isso.

1. **Nunca edite `firmware/` nem `apps/server/`.** O firmware é o cliente real
   em produção; o servidor TS é o oráculo de comportamento. A única exceção é
   criar arquivos novos em `test-fixtures/` (Fase 0).
2. **O código manda, não o CLAUDE.md.** Onde o CLAUDE.md diverge da
   implementação (lista na seção 7.7), o contrato a replicar é o do código.
3. **Paridade antes de melhoria.** Qualquer mudança de comportamento observável
   (status HTTP, shape de JSON, linhas no SQLite) só é permitida nas tarefas
   explicitamente marcadas como "endurecimento" (Fase 5) — e mesmo essas ficam
   atrás de flag de configuração.
4. **TDD com os vetores da seção 7.** Escreva o teste com o vetor embutido,
   veja-o falhar, implemente, veja-o passar, commite. Os vetores foram gerados
   pelo código TypeScript real em 2026-06-09 — se um teste com vetor falhar, o
   erro está na sua implementação, não no vetor.
5. **Ao final de cada fase:** `cargo test --workspace` verde, `cargo clippy
   --workspace -- -D warnings` limpo, e os testes de corpus (Fase 0) passando.
6. **Commits pequenos, Conventional Commits** (`feat:`, `fix:`, `refactor:`),
   um commit por passo de tarefa quando indicado.
7. **Não adicione dependências fora da tabela da seção 6** sem registrar a
   decisão neste arquivo (editar a tabela + uma linha de justificativa).
8. **Na dúvida sobre um comportamento, abra o arquivo TS citado.** Cada
   contrato na seção 7 referencia o arquivo-fonte exato.

### Armadilhas conhecidas (leia duas vezes)

| Armadilha | Detalhe |
|---|---|
| Secret key de 64 bytes | `hypercore-crypto`/libsodium usa secret key de 64 bytes = `seed(32) ‖ pubkey(32)`. `ed25519-dalek` usa só a seed de 32 bytes. Ao comparar com o vetor `secret64`, os primeiros 32 bytes são a seed. |
| `seq`/`timestamp` são strings no JSON | O firmware serializa uint64 como string (`"seq":"1"`). Parse com `str::parse::<u64>()`. Não aceite silenciosamente números maiores que `i64::MAX` (SQLite INTEGER é i64). |
| Hex sempre minúsculo | Todas as chaves, MACs, assinaturas e blobs trafegam em hex minúsculo sem prefixo. Use `hex::encode` (já é minúsculo). |
| Floats: f64, nunca f32 | Valores `plain` do JSON vão direto para coluna `REAL` como f64. **Exceção:** o plaintext de campos cifrados é float32 big-endian por definição (`symmetric.ts`). |
| Duplicata é sucesso | `INSERT OR IGNORE` em `(device_pubkey, seq)`: reenvio do mesmo bloco retorna 200 com `accepted: 1`. Não é erro. O firmware depende disso (reenvia tudo que não confirmou com 200). |
| 207 ≠ 404 | Telemetria de device desconhecido retorna **207** com erro no body, nunca 404. O firmware só re-registra ao receber 404 — contra este servidor isso nunca ocorre; o registro lazy acontece via `syncDeviceRegistry()` antes do envio. Mantenha 207. |
| Endpoint local usa o banco privado | `POST/GET /v1/devices` no endpoint local lê/escreve `raiznet_private.db`; no público, `raiznet_public.db`. É assimétrico de propósito (`apps/server/src/index.ts:29-30`). |
| A assinatura cobre só o `raw` | Os valores `plain` do JSON **não** são cobertos pela assinatura no servidor TS (ver 7.7). A paridade replica isso; o cross-check é tarefa de endurecimento na Fase 5. |
| `ph=6.20` vs `6.2` | No `raw` os números têm casas decimais fixas (`6.20`); no JSON viram número (`6.2`). Comparações raw↔JSON devem ser numéricas, nunca textuais. |
| Rotas axum 0.8 | Parâmetros de path usam `{id}`, não `:id` (`/v1/devices/{id}`). Sintaxe `:id` causa panic no axum ≥ 0.8. |
| `keyVersion` é sempre 0 hoje | O firmware envia `"keyVersion": 0` fixo e `|0` no raw. Aceite outros valores, mas o corpus usa 0. |
| `tempWater` existe no schema, firmware nunca envia | Colunas `temp_water_*` ficam NULL em todos os fixtures. Não remova o campo. |
| Device `local_only` no endpoint público | Lookup acha o device, assinatura valida, mas nenhuma linha é inserida — e ainda assim conta como `accepted`. Comportamento do TS (`domain/telemetry.ts:135-140`). |

---

## 1. Contexto e escopo

O alvo de hardware é o OpenStick (Snapdragon 410 / MSM8916, 4× Cortex-A53,
**aarch64**, ~250 MB de RAM livre, ~1.5 GB de armazenamento) e qualquer Linux
ARM64/x86_64 comum. O binário deve rodar sem Node.js, pnpm, Docker ou
toolchain Rust no dispositivo.

O primeiro marco ("paridade", Fases 0–5) recria o que já existe no servidor
atual:

- API HTTP pública e local (dois listeners no mesmo processo).
- Registro de dispositivos (`POST /v1/devices`).
- Ingestão de telemetria assinada (`POST /v1/telemetry`).
- Identidade Ed25519 do nó (compatível com o arquivo `identity.mnemonic`
  existente — um nó migrado de TS para Rust mantém a mesma pubkey).
- SQLite público e privado com schema idêntico.
- Modelo de privacidade por campo (omit/plain/encrypted).
- Compatibilidade total com o firmware ESP32 atual, **sem mudar o firmware**.

Depois da paridade, o sistema evolui para replicação entre nós usando um
protocolo Raiznet-native (Fases 7–9).

## 2. Estado atual verificado (2026-06-09)

Inventário conferido no código — não confie em descrições antigas:

| Componente | Estado | Fonte |
|---|---|---|
| Servidor TS | HTTP + SQLite funcionais; **sem** Hypercore/Hyperswarm (diretório `swarm/` vazio); **sem** auth no endpoint local (mesmas rotas públicas) | `apps/server/src/index.ts` |
| Wire format | **JSON**, não Protobuf. Os `.proto` existem mas nunca foram compilados | `packages/protocol/proto/` |
| Assinatura | Ed25519 detached sobre string ASCII pipe-delimited (`raw`) | `firmware/safraSense/src/telemetry/telemetry.cpp:61-76` |
| Identidade do nó | BIP-39 EN → PBKDF2 → primeiros 32 bytes → seed Ed25519; mnemonic salvo em `data/identity.mnemonic` (0600) | `packages/crypto/src/keys.ts`, `apps/server/src/identity.ts` |
| Identidade owner (firmware) | SHA-256 da string do mnemonic → seed Ed25519 (**não** é BIP-39 padrão) | `firmware/safraSense/src/identity/identity.cpp:221-243` |
| Identidade device (firmware) | 32 bytes aleatórios do TRNG, salvos em NVS | `firmware/safraSense/src/identity/identity.cpp:36-40` |
| Telemetria | Intervalo 60 s (`TELEMETRY_INTERVAL_MS`), buffer RAM de 50, blocos de seq de 100 | `firmware/safraSense/include/config.h:28-30` |
| Testes existentes | `telemetry.test.ts`, `devices.test.ts` colocados — bons modelos para o corpus | `apps/server/src/**/*.test.ts` |
| Workspace Rust | Não existe ainda (sem `Cargo.toml` na raiz) | — |

## 3. Princípios

1. O firmware não muda no primeiro marco. Nenhuma exceção.
2. O servidor TypeScript atual é referência de comportamento, não base
   permanente. Ele fica congelado até o corpus passar em Rust.
3. O SQLite continua sendo cache/índice local; a fonte de verdade futura é um
   log de eventos assinado (Fase 7).
4. A camada P2P é própria do Raiznet (Fase 8). Nada de portar Hypercore.
5. O nó pequeno é um perfil oficial (`small-node`), não uma gambiarra.
6. O binário roda sem Node.js, pnpm, Docker ou toolchain Rust no dispositivo.
7. Toda decisão de protocolo é testável com corpus fixo de blocos, assinaturas
   e respostas esperadas.

## 4. Conceitos a preservar, sem Holepunch

| Conceito original | Implementação Raiznet em Rust |
|---|---|
| Hypercore append-only log | Log de eventos Raiznet com hash chain (Fase 7); Merkle tree só se houver necessidade real de provas parciais |
| Cores assinados | Eventos assinados com Ed25519 |
| Replicação P2P | Protocolo próprio de sync entre nós (Fase 8, ADR-004): v1 = HTTP pull entre peers configurados; v2 = dial-by-pubkey sobre **iroh** (fallback rust-libp2p), gated por spike 4G/CGNAT |
| Hyperswarm discovery | Em camadas: peers configurados + mDNS local (v1) → discovery do transporte v2 (iroh) |
| Hyperbee index | SQLite como índice derivado |
| Autobase multi-writer | Regras próprias de merge por tipo de evento |
| Hyperdrive content publishing | Catálogo Raiznet de materiais/conteúdos, fase posterior |

Não portar Holepunch por padrão. Só implementar equivalentes quando houver
necessidade clara do Raiznet.

## 5. Estrutura do workspace

Adicionar um workspace Rust dentro do repositório, sem substituir nada de uma
vez. Os crates `raiznet-events` e `raiznet-sync` **não** são criados na Fase 1
— cada um nasce na sua fase, para evitar crates vazios:

```text
raiznet/
├── Cargo.toml                   # workspace (Fase 1)
├── apps/
│   ├── server/                  # TS atual — congelado, referência
│   └── raiznetd/                # binário Rust do nó (Fase 1)
│       └── src/
│           ├── main.rs
│           ├── config.rs        # env vars RAIZNET_* (Fase 4/6)
│           ├── identity.rs      # carga/criação de identity.mnemonic (Fase 2)
│           ├── http/
│           │   ├── mod.rs       # build_router(state, destination)
│           │   ├── health.rs
│           │   ├── devices.rs
│           │   └── telemetry.rs
│           └── domain/
│               ├── mod.rs
│               ├── errors.rs
│               └── telemetry.rs # ingest_block (Fase 5)
├── crates/
│   ├── raiznet-crypto/          # chaves, assinaturas, AES-GCM (Fase 2)
│   ├── raiznet-store/           # SQLite, schema, inserts, queries (Fase 3)
│   ├── raiznet-events/          # log de eventos, hash chain (criado na Fase 7)
│   └── raiznet-sync/            # replicação entre nós (criado na Fase 8)
└── test-fixtures/               # corpus de compatibilidade (Fase 0)
```

O binário principal chama-se `raiznetd`.

## 6. Stack Rust

Versões são mínimos; patch/minor mais novos são aceitáveis se os testes
passarem. **Não** adicione nada fora desta tabela sem registrar aqui.

| Área | Crate | Versão | Observação |
|---|---|---|---|
| Runtime async | `tokio` | 1.x | features `rt-multi-thread`, `macros`, `signal` |
| HTTP server | `axum` | 0.8 | path params com `{id}` |
| JSON | `serde`, `serde_json` | 1.x | `derive` |
| SQLite | `rusqlite` | 0.32+ | **feature `bundled`** — compila SQLite junto, zero dependência de sistema, essencial para cross-compile musl |
| Ed25519 | `ed25519-dalek` | 2.x | `SigningKey::from_bytes(seed32)` |
| AES-GCM | `aes-gcm` | 0.10 | tag posfixado por padrão (igual ao TS) |
| Hash | `sha2` | 0.10 | derivação owner do firmware |
| BIP-39 | `bip39` | 2.x | feature `rand` (necessária para `Mnemonic::generate`); `to_seed_normalized("")` |
| Hex | `hex` | 0.4 | encode é minúsculo |
| Logs | `tracing`, `tracing-subscriber` | 0.1 / 0.3 | saída JSON estruturada |
| Erros | `thiserror` | 2.x | `anyhow` apenas no binário |
| Protobuf | `prost`, `prost-build` | — | só na Fase 9 |
| P2P (Fase 8 v2) | `iroh` (candidato primário) / `rust-libp2p` (fallback) | — | só após o spike 4G/CGNAT (ADR-004); confinado a `raiznet-sync` |

Proibido: OpenSSL (usar `rustls` se TLS for necessário um dia), ORMs, qualquer
crate que exija glibc específica. Para o OpenStick, a primeira versão roda
HTTP em porta alta; TLS/proxy é problema de outro ambiente.

---

## 7. Contratos congelados (apêndice normativo)

Tudo nesta seção foi extraído do código real em 2026-06-09 e validado
executando o código TypeScript. É o contrato que o Rust deve cumprir.

### 7.1 Identidade e derivação de chaves

Existem **três** derivações distintas em produção. O Rust implementa as três:

**(a) Identidade do nó/servidor** — `packages/crypto/src/keys.ts:14-17`:

```
mnemonic BIP-39 (EN, 12 palavras)
  → seed PBKDF2-HMAC-SHA512(mnemonic, "mnemonic" + passphrase vazia, 2048 iterações) = 64 bytes
  → primeiros 32 bytes
  → seed Ed25519 (crypto_sign_seed_keypair)
```

O mnemonic vive em `<data_dir>/identity.mnemonic`, texto puro, uma linha,
modo 0600 (`apps/server/src/identity.ts`). O `raiznetd` lê e grava **o mesmo
arquivo no mesmo formato** — migrar de TS para Rust preserva a identidade.

**(b) Identidade do owner no firmware** — `identity.cpp:221-231`:

```
mnemonic (qualquer idioma, string normalizada com espaços simples)
  → SHA-256 da string UTF-8
  → seed Ed25519
```

⚠️ **Não é BIP-39 padrão.** A mesma frase produz chaves diferentes em (a) e
(b). Essa é a "decisão importante" pendente: antes de aceitar import de seed
de owner no app/servidor, escolher uma regra canônica e documentar em ADR.
Para a paridade, basta implementar as duas e ter teste para cada (vetores
abaixo).

**(c) Identidade do device no firmware** — `identity.cpp:36-40`: 32 bytes
aleatórios do TRNG, nunca derivados de mnemonic. O servidor só conhece a
pubkey; não há nada a derivar.

**Vetores (gerados pelo código TS real):**

```
mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"

(a) seed32  = 5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc1
(a) pubkey  = c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a
(a) secret64 (formato sodium, seed‖pubkey) =
    5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc1c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a

(b) seed32  = c557eec878dfd852ba3f88087c4f350f09c55537ab5e549c3cd14320ec3cef38
(b) pubkey  = 93a5f261984931e0df5c7434b16d468efb1953098d3cad4fa1506b9e052e7fc7
```

### 7.2 Assinatura Ed25519 e o formato do `raw`

A mensagem assinada é uma **string ASCII pipe-delimited** montada pelo
firmware (`telemetry.cpp:61-76` `buildRaw`), na ordem exata:

```
<device_pubkey_hex>|<seq>|<timestamp_ms>|<key_version>[|ec=<v0>][|ph=<v2>][|waterLevel=<v0>][|tempAmbient=<v2>][|humidity=<v2>]
```

- `<vN>` = valor com N casas decimais fixas (`ec=1800`, `ph=6.20`,
  `humidity=60.00`). Campos ausentes na leitura simplesmente não aparecem.
- A ordem dos campos é fixa: `ec`, `ph`, `waterLevel`, `tempAmbient`,
  `humidity`. `tempWater` não é enviado pelo firmware atual.
- No JSON, `raw` viaja **hex-encoded** (hex dos bytes UTF-8 da string).
- A assinatura é Ed25519 detached (RFC 8032, determinística) sobre os bytes
  do `raw`. O servidor verifica contra a pubkey registrada do device
  (`domain/telemetry.ts:86-88`).

**Vetor (assinatura determinística — deve bater byte a byte):**

```
chave: derivação (a) do vetor da seção 7.1
raw (string) =
c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a|1|1700000000000|0|ec=1800|ph=6.20|waterLevel=80|tempAmbient=24.50|humidity=60.00

signature =
2199c52836b4e4a314c1a051ca1f799624e9553ff6ae768d23d0f8287f68cc8c3405dc01f105a297769ff2a9fedc045ff0afefec3f47951cae2e87f059c71c08
```

Em Rust: `ed25519-dalek` com `verify_strict` (rejeita pontos de ordem baixa;
assinaturas honestas do firmware e do sodium passam — o vetor acima prova).
Se algum fixture real falhar com `verify_strict` e passar com `verify`,
registre a decisão aqui e use `verify`.

### 7.3 Campos cifrados (AES-256-GCM)

Formato de `packages/crypto/src/symmetric.ts`:

- plaintext = valor como **float32 big-endian** (4 bytes);
- nonce = 12 bytes aleatórios por campo;
- `cipher` no wire = `ciphertext ‖ tag` (tag de 16 bytes posfixado — é o
  default do crate `aes-gcm`);
- chave = 32 bytes (chave simétrica do device).

**Vetor:**

```
key       = 1111111111111111111111111111111111111111111111111111111111111111
nonce     = 222222222222222222222222
valor     = 6.2  →  plaintext float32 BE = 40c66666
cipher‖tag = 5731612f87cc0d953260cd9674bc34ffe5f3caea
```

O servidor **nunca decifra** — só armazena `cipher`/`nonce` nas colunas
`_cipher`/`_nonce`. Decifrar é papel do app do owner.

### 7.4 API HTTP — contratos exatos

Fontes: `apps/server/src/http/health.ts`, `http/public/devices.ts`,
`http/public/telemetry.ts`, `index.ts`.

Dois listeners no mesmo processo:

| Endpoint | Bind | Porta default | Banco das rotas de devices | Destino da ingestão |
|---|---|---|---|---|
| público | `0.0.0.0` | 3000 | `raiznet_public.db` | `public` |
| local | `127.0.0.1` | 3001 | `raiznet_private.db` | `local` |

O TS infere o destino pelo `localPort` do socket; em Rust, construa dois
routers com o destino explícito (mesmo comportamento observável, código mais
simples).

**`GET /health`** → `200 {"status":"ok","ts":<unix_ms>}`

**`POST /v1/devices`** (body JSON):

```json
{
  "id": "<64 hex>",            // device pubkey — obrigatório
  "mac": "<12 hex>",           // minúsculo, sem dois-pontos — obrigatório
  "ownerPubkey": "<64 hex>",   // obrigatório
  "ownerName": "opcional",
  "name": "Torre 01",          // obrigatório, min 1 char
  "type": 0,                   // 0..2, default 0
  "publishTo": 2,              // 0..2, default 1
  "location": 123,             // opcional, inteiro (célula H3)
  "networks": [],              // default []
  "localServers": [],          // default []
  "privacyPolicy": {           // opcional; default: tudo plain (disposition 1)
    "ph": { "default_disposition": 1, "per_destination": {} },
    "ec": { "default_disposition": 1, "per_destination": {} },
    "water_level": { "default_disposition": 1, "per_destination": {} },
    "temp_water": { "default_disposition": 1, "per_destination": {} },
    "temp_ambient": { "default_disposition": 1, "per_destination": {} },
    "humidity": { "default_disposition": 1, "per_destination": {} }
  },
  "hardware": { "model": "Safrasense Aqua ESP32 v1", "firmware_version": "0.2.0" }
}
```

Respostas:
- `201 {"device":{...}}` — shape do device na resposta:
  `{id, mac, ownerPubkey, name, type, location, status, hardware, createdAt}`
  (hex nas chaves/MAC; `hardware` é objeto; `createdAt` em unix ms).
- `409 {"error":"device_already_exists"}` se a pubkey já existe.
  **O firmware trata 409 como sucesso** (`device.cpp:53`).
- `400 {"error":"validation_error","details":[...]}` — o corpus valida só o
  status e a chave `error`; o shape de `details` pode divergir do zod.

Efeito colateral: upsert do owner em `users` com
`name = ownerName ?? ownerPubkey[0..12]` (`devices.ts:111-115`).

**`GET /v1/devices`** → `200 {"devices":[...]}` (mesmo shape de device).

**`GET /v1/devices/{id}`** → `200 {"device":{...}}` ou
`404 {"error":"Device not found"}`.

**`GET /v1/devices/{id}/telemetry`** → `200 {"readings":[...]}`, ordenado por
`timestamp DESC`, `LIMIT 500`. Cada reading:

```json
{
  "seq": 1, "timestamp": 1700000000000, "receivedAt": 1700000000123,
  "ph": {"value": 6.2},                 // campo plain
  "ec": {"encrypted": "<hex>"},         // campo cifrado (cipher hex, sem nonce!)
  "waterLevel": null,                   // campo ausente
  "tempWater": null, "tempAmbient": {"value": 24.5}, "humidity": {"value": 60}
}
```

**`POST /v1/telemetry`** (body JSON, batch de 1 a 100 blocos):

```json
{
  "blocks": [{
    "deviceId": "<64 hex>",
    "seq": "1",                  // string!
    "timestamp": "1700000000000",// string!
    "keyVersion": 0,
    "ec":          { "plain": 1800 },
    "ph":          { "plain": 6.2 },
    "waterLevel":  { "plain": 80 },
    "tempAmbient": { "plain": 24.5 },
    "humidity":    { "plain": 60 },
    "signature": "<128 hex>",
    "raw": "<hex dos bytes UTF-8 da string raw>"
  }]
}
```

Campos de sensor podem alternativamente ser
`{"cipher":"<hex>","nonce":"<hex>"}` ou estar ausentes. Resposta:

- `200 {"accepted":N,"errors":[]}` quando todos os blocos passaram (inclui
  duplicatas e blocos de devices `local_only` no endpoint público — ver 7.6);
- `207 {"accepted":N,"errors":[{"seq":"<seq original>","error":"<msg>"}]}`
  quando algum bloco falhou. Mensagens exatas (o corpus compara):
  - `Device not found: <device_id_hex>`
  - `Invalid signature for device <device_id_hex>`
- `400` para body sem `blocks`, vazio ou com mais de 100 itens.

**O firmware só considera 200 como confirmação** (`telemetry.cpp:111`) e
reenvia tudo o mais — a idempotência via `INSERT OR IGNORE` é obrigatória.

### 7.5 Schema SQLite e enums

DDL idêntico nos dois bancos (`storage/public-db.ts` e `private-db.ts`);
pragmas: `journal_mode = WAL`, `foreign_keys = ON`:

```sql
CREATE TABLE IF NOT EXISTS users (
  pubkey     BLOB NOT NULL PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  website    TEXT,
  bio        TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  pubkey                  BLOB    NOT NULL PRIMARY KEY,
  mac                     BLOB    NOT NULL,
  owner_pubkey            BLOB    NOT NULL REFERENCES users(pubkey),
  name                    TEXT    NOT NULL,
  type                    INTEGER NOT NULL,
  location                INTEGER,
  publish_to              INTEGER NOT NULL DEFAULT 0,
  networks                TEXT    NOT NULL DEFAULT '[]',
  local_servers           TEXT    NOT NULL DEFAULT '[]',
  encryption_key_version  INTEGER NOT NULL DEFAULT 0,
  privacy_policy          TEXT    NOT NULL DEFAULT '{}',
  hardware                TEXT    NOT NULL DEFAULT '{}',
  status                  INTEGER NOT NULL DEFAULT 0,
  created_at              INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telemetry (
  device_pubkey           BLOB    NOT NULL REFERENCES devices(pubkey),
  seq                     INTEGER NOT NULL,
  timestamp               INTEGER NOT NULL,
  received_at             INTEGER NOT NULL,
  key_version             INTEGER,
  ph_plain                REAL,    ph_cipher           BLOB,    ph_nonce           BLOB,
  ec_plain                REAL,    ec_cipher           BLOB,    ec_nonce           BLOB,
  water_level_plain       REAL,    water_level_cipher  BLOB,    water_level_nonce  BLOB,
  temp_water_plain        REAL,    temp_water_cipher   BLOB,    temp_water_nonce   BLOB,
  temp_ambient_plain      REAL,    temp_ambient_cipher BLOB,    temp_ambient_nonce BLOB,
  humidity_plain          REAL,    humidity_cipher     BLOB,    humidity_nonce     BLOB,
  PRIMARY KEY (device_pubkey, seq)
);

CREATE INDEX IF NOT EXISTS idx_telemetry_time
  ON telemetry (device_pubkey, timestamp);
```

Enums (valores numéricos no banco e no wire):

```
publish_to:  0 = local_only   1 = public      2 = both
disposition: 0 = omit         1 = plain       2 = encrypted
type:        0 = sensor_mains 1 = sensor_battery 2 = gateway
status:      0 = active (default)
```

### 7.6 Regras de domínio da ingestão (paridade com `domain/telemetry.ts`)

Ordem exata por bloco:

1. **Lookup** do device no banco do destino (`public` → publicDb, `local` →
   privateDb). Não achou → `DeviceNotFound` (vai para `errors[]`).
2. **Verificação de assinatura** sobre os bytes do `raw` decodificado de hex,
   contra a pubkey **registrada** (coluna `pubkey`), não a do payload.
   Falhou → `InvalidSignature`.
3. **Resolução de disposição** por campo:
   `per_destination[server_pubkey_hex] ?? default_disposition`; política de
   campo ausente no JSON da coluna `privacy_policy` → `omit` (0).
4. **Projeção campo → colunas** (`fieldToColumns`):
   - disposição `omit` → tudo NULL;
   - campo `plain` no wire **e** disposição `plain` → `_plain` preenchido;
   - campo `encrypted` no wire **e** disposição `encrypted` → `_cipher`/`_nonce`;
   - qualquer outra combinação (mismatch wire×política) → tudo NULL,
     **silenciosamente** — não é erro.
5. **`received_at` = now unix ms** do servidor.
6. **Insert** com `INSERT OR IGNORE`:
   - destino `public`: insere no publicDb se `publish_to ∈ {1, 2}`; senão não
     insere nada (e ainda conta como aceito);
   - destino `local`: insere no privateDb se `publish_to ∈ {0, 2}`.

### 7.7 Inconsistências conhecidas e decisões

| # | Fato | Decisão para a migração |
|---|---|---|
| 1 | CLAUDE.md diz "Protobuf desde o dia um"; a implementação real é JSON | JSON é o contrato da paridade. Protobuf é a Fase 9. |
| 2 | CLAUDE.md descreve política `in_local_network`/`in_public_networks`; o código usa `default_disposition`/`per_destination` (modelo mais novo, igual ao `device.proto`) | O código manda. |
| 3 | CLAUDE.md diz intervalo de telemetria 30 s; `config.h:28` define 60 s | Irrelevante para o servidor; registrado para corrigir o CLAUDE.md depois. |
| 4 | Derivação de owner no firmware (SHA-256 da string) ≠ BIP-39 padrão do servidor | Implementar ambas (7.1). Unificação exige ADR + mudança de firmware — fora deste plano. |
| 5 | **A assinatura cobre só o `raw`; os valores `plain` do JSON não são verificados contra o `raw`.** Um par (raw, signature) válido capturado pode ser reenviado com valores JSON adulterados e o servidor TS aceita. | Paridade replica o comportamento. A Fase 5 adiciona cross-check raw↔JSON atrás de `RAIZNET_STRICT_RAW` (default ligado). O firmware sempre envia consistente, então não quebra nada. |
| 6 | Não há validação de monotonicidade de `seq` — só dedupe via PK | **Manter assim.** O firmware reenvia seqs antigos não confirmados após reconexão; rejeitar `seq < max(seq)` quebraria a recuperação. |
| 7 | Telemetria de device desconhecido → 207, não 404; o handler de 404 do firmware nunca dispara contra este servidor | Manter 207. |
| 8 | `Buffer.from(hexInválido, 'hex')` no TS trunca silenciosamente; em Rust o decode falha | Divergência aceita: hex malformado vira erro por bloco `Invalid payload: <campo>` (o firmware nunca envia hex malformado; corpus não cobre). |
| 9 | Body de erro 400 do Fastify (schema validation) tem shape próprio | Corpus valida apenas o status 400. |

---

## Fase 0 — Corpus de compatibilidade

Congela o comportamento atual em fixtures que tanto o TS quanto o Rust
conseguem validar. Sem esta fase, a migração vira reimplementação subjetiva.

**Files:**
- Create: `test-fixtures/generate.mjs`
- Create (gerados): `test-fixtures/identity/vectors.json`,
  `test-fixtures/devices/*.json`, `test-fixtures/telemetry/*.json`,
  `test-fixtures/expected-http/*.json`, `test-fixtures/expected-sqlite/*.json`

- [ ] **Passo 0.1: garantir o build do pacote crypto**

```bash
pnpm -C packages/crypto build
```

Esperado: `packages/crypto/dist/*.js` existentes, sem erro de compilação.

- [ ] **Passo 0.2: criar o gerador de fixtures**

Criar `test-fixtures/generate.mjs` com o conteúdo abaixo. Ele importa o código
TS **real** (via `dist/`), portanto os fixtures são, por construção, o
comportamento atual:

```js
// Gera o corpus de compatibilidade a partir do código TypeScript real.
// Executar da raiz do repo:  node test-fixtures/generate.mjs
import { keyPairFromSeedPhrase } from '../packages/crypto/dist/keys.js'
import { sign } from '../packages/crypto/dist/signing.js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
// Derivação (b) da seção 7.1 (SHA-256 do mnemonic) — valor fixo, conferido contra o firmware.
const OWNER_PUBKEY = '93a5f261984931e0df5c7434b16d468efb1953098d3cad4fa1506b9e052e7fc7'

const kp = keyPairFromSeedPhrase(MNEMONIC)
const devicePubkey = kp.publicKey.toString('hex')

const rawStr = `${devicePubkey}|1|1700000000000|0|ec=1800|ph=6.20|waterLevel=80|tempAmbient=24.50|humidity=60.00`
const raw = Buffer.from(rawStr, 'utf8')
const sig = sign(raw, kp.secretKey)

function write(rel, obj) {
  const p = join(root, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n')
}

write('identity/vectors.json', {
  mnemonic: MNEMONIC,
  server_derivation: { seed32: kp.secretKey.subarray(0, 32).toString('hex'), pubkey: devicePubkey },
  firmware_owner_derivation: { algorithm: 'sha256(mnemonic_utf8) -> ed25519 seed', pubkey: OWNER_PUBKEY },
  aes_gcm: {
    key: '11'.repeat(32), nonce: '22'.repeat(12),
    value: 6.2, plaintext_float32be: '40c66666',
    cipher_plus_tag: '5731612f87cc0d953260cd9674bc34ffe5f3caea',
  },
})

write('devices/register-ok.json', {
  id: devicePubkey, mac: 'aabbccddeeff', ownerPubkey: OWNER_PUBKEY,
  name: 'Fixture Tower', type: 0, publishTo: 2,
  hardware: { model: 'Safrasense Aqua ESP32 v1', firmware_version: '0.2.0' },
  privacyPolicy: Object.fromEntries(
    ['ph', 'ec', 'water_level', 'temp_water', 'temp_ambient', 'humidity']
      .map((f) => [f, { default_disposition: 1, per_destination: {} }])),
})

const block = {
  deviceId: devicePubkey, seq: '1', timestamp: '1700000000000', keyVersion: 0,
  ec: { plain: 1800 }, ph: { plain: 6.2 }, waterLevel: { plain: 80 },
  tempAmbient: { plain: 24.5 }, humidity: { plain: 60 },
  signature: sig.toString('hex'), raw: raw.toString('hex'),
}
write('telemetry/post-ok.json', { blocks: [block] })
write('telemetry/post-bad-signature.json', {
  blocks: [{ ...block, signature: '00'.repeat(64) }],
})

write('expected-http/register-ok.json', { status: 201, body_contains: { device: { id: devicePubkey, mac: 'aabbccddeeff' } } })
write('expected-http/register-duplicate.json', { status: 409, body: { error: 'device_already_exists' } })
write('expected-http/telemetry-ok.json', { status: 200, body: { accepted: 1, errors: [] } })
write('expected-http/telemetry-duplicate.json', { status: 200, body: { accepted: 1, errors: [] } })
write('expected-http/telemetry-unknown-device.json', {
  status: 207,
  body: { accepted: 0, errors: [{ seq: '1', error: `Device not found: ${devicePubkey}` }] },
})
write('expected-http/telemetry-bad-signature.json', {
  status: 207,
  body: { accepted: 0, errors: [{ seq: '1', error: `Invalid signature for device ${devicePubkey}` }] },
})

write('expected-sqlite/telemetry-ok.json', {
  table: 'telemetry',
  rows: [{
    device_pubkey_hex: devicePubkey, seq: 1, timestamp: 1700000000000, key_version: 0,
    ph_plain: 6.2, ec_plain: 1800, water_level_plain: 80,
    temp_water_plain: null, temp_ambient_plain: 24.5, humidity_plain: 60,
    all_cipher_columns_null: true,
  }],
})

console.log('fixtures geradas em', root)
```

- [ ] **Passo 0.3: gerar e conferir**

```bash
node test-fixtures/generate.mjs
cat test-fixtures/identity/vectors.json
```

Esperado: `pubkey` do server_derivation =
`c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a`.

- [ ] **Passo 0.4: validar o corpus contra o servidor TS rodando**

```bash
pnpm -C apps/server dev &   # ou o comando de start equivalente
sleep 2
curl -s -X POST http://127.0.0.1:3000/v1/devices  -H 'Content-Type: application/json' -d @test-fixtures/devices/register-ok.json | head -c 300; echo
curl -s -X POST http://127.0.0.1:3000/v1/telemetry -H 'Content-Type: application/json' -d @test-fixtures/telemetry/post-ok.json
```

Esperado: primeira chamada retorna `{"device":{"id":"c5785e..."}}` (201);
segunda retorna `{"accepted":1,"errors":[]}` (200). Repetir a segunda chamada:
mesma resposta (duplicata é sucesso). Encerrar o servidor TS depois.

- [ ] **Passo 0.5: commit**

```bash
git add test-fixtures/
git commit -m "test: add cross-implementation compatibility corpus for Rust migration"
```

**Critério de fase concluída:** fixtures commitados; os quatro casos HTTP
(ok, duplicata, device desconhecido, assinatura inválida) validados contra o
TS manualmente.

---

## Fase 1 — Workspace Rust

**Files:**
- Create: `Cargo.toml` (raiz)
- Create: `apps/raiznetd/Cargo.toml`, `apps/raiznetd/src/main.rs`
- Modify: `.gitignore` (adicionar `target/`)

- [ ] **Passo 1.1: `Cargo.toml` da raiz**

```toml
[workspace]
resolver = "2"
members = ["apps/raiznetd", "crates/raiznet-crypto", "crates/raiznet-store"]

[workspace.package]
edition = "2024"
rust-version = "1.85"

[workspace.dependencies]
tokio = { version = "1", features = ["rt-multi-thread", "macros", "signal"] }
axum = "0.8"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.32", features = ["bundled"] }
ed25519-dalek = "2"
aes-gcm = "0.10"
sha2 = "0.10"
bip39 = { version = "2", features = ["rand"] }
hex = "0.4"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
thiserror = "2"
anyhow = "1"

[profile.release]
opt-level = "s"
lto = true
codegen-units = 1
panic = "abort"
strip = true
```

Os crates `raiznet-crypto` e `raiznet-store` ainda não existem; crie-os já
neste passo como esqueletos vazios (`cargo new --lib crates/raiznet-crypto`,
`cargo new --lib crates/raiznet-store`, apagando o conteúdo de exemplo e
usando `edition.workspace = true`).

- [ ] **Passo 1.2: binário mínimo com `/health`**

`apps/raiznetd/Cargo.toml`:

```toml
[package]
name = "raiznetd"
version = "0.1.0"
edition.workspace = true

[dependencies]
tokio.workspace = true
axum.workspace = true
serde_json.workspace = true
tracing.workspace = true
tracing-subscriber.workspace = true
anyhow.workspace = true
```

`apps/raiznetd/src/main.rs`:

```rust
use axum::{Json, Router, routing::get};
use std::time::{SystemTime, UNIX_EPOCH};

pub fn now_ms() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).expect("clock before epoch").as_millis() as u64
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "ts": now_ms() }))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().json().init();
    let app = Router::new().route("/health", get(health));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    tracing::info!("raiznetd started on :3000");
    axum::serve(listener, app).await?;
    Ok(())
}
```

- [ ] **Passo 1.3: validar**

```bash
cargo build --release -p raiznetd
cargo run -p raiznetd &
sleep 1
curl -s http://127.0.0.1:3000/health
kill %1
```

Esperado: `{"status":"ok","ts":<número>}`.

- [ ] **Passo 1.4: commit**

```bash
git add Cargo.toml Cargo.lock apps/raiznetd crates .gitignore
git commit -m "feat: bootstrap Rust workspace with raiznetd health endpoint"
```

---

## Fase 2 — Crypto e identidade

**Files:**
- Create: `crates/raiznet-crypto/src/lib.rs`
- Create: `crates/raiznet-crypto/src/identity.rs`
- Create: `crates/raiznet-crypto/src/signing.rs`
- Create: `crates/raiznet-crypto/src/symmetric.rs`
- Create: `apps/raiznetd/src/identity.rs`

`crates/raiznet-crypto/Cargo.toml` (dependências): `ed25519-dalek`, `bip39`,
`sha2`, `aes-gcm`, `hex` (dev), `thiserror` — todas via `workspace = true`.

- [ ] **Passo 2.1: testes de derivação com os vetores de 7.1 (devem falhar)**

`crates/raiznet-crypto/src/identity.rs`:

```rust
use bip39::Mnemonic;
use ed25519_dalek::SigningKey;
use sha2::{Digest, Sha256};

#[derive(Debug, thiserror::Error)]
pub enum CryptoError {
    #[error("invalid mnemonic: {0}")]
    InvalidMnemonic(#[from] bip39::Error),
    #[error("aead failure")]
    Aead,
}

/// Derivação (a) da seção 7.1 — idêntica a packages/crypto/src/keys.ts:
/// BIP-39 → seed PBKDF2 de 64 bytes (passphrase vazia) → primeiros 32 bytes → seed Ed25519.
pub fn node_keypair_from_mnemonic(mnemonic: &str) -> Result<SigningKey, CryptoError> {
    let m = Mnemonic::parse_normalized(mnemonic)?;
    let seed64 = m.to_seed_normalized("");
    let seed32: [u8; 32] = seed64[..32].try_into().expect("seed64 has 64 bytes");
    Ok(SigningKey::from_bytes(&seed32))
}

/// Derivação (b) da seção 7.1 — firmware identity.cpp generateOwnerIdentity:
/// SHA-256 da string UTF-8 do mnemonic → seed Ed25519. NÃO é BIP-39 padrão.
pub fn firmware_owner_keypair(mnemonic: &str) -> SigningKey {
    let seed: [u8; 32] = Sha256::digest(mnemonic.as_bytes()).into();
    SigningKey::from_bytes(&seed)
}

#[cfg(test)]
mod tests {
    use super::*;
    const MNEMONIC: &str = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

    #[test]
    fn node_derivation_matches_typescript_vector() {
        let key = node_keypair_from_mnemonic(MNEMONIC).unwrap();
        assert_eq!(
            hex::encode(key.verifying_key().to_bytes()),
            "c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a"
        );
        assert_eq!(
            hex::encode(key.to_bytes()),
            "5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc1"
        );
    }

    #[test]
    fn firmware_owner_derivation_matches_firmware_vector() {
        let key = firmware_owner_keypair(MNEMONIC);
        assert_eq!(
            hex::encode(key.verifying_key().to_bytes()),
            "93a5f261984931e0df5c7434b16d468efb1953098d3cad4fa1506b9e052e7fc7"
        );
    }
}
```

Rodar: `cargo test -p raiznet-crypto` → deve **falhar a compilação** até o
módulo estar registrado em `lib.rs`; registre (`pub mod identity;` etc.),
rode de novo e veja os dois testes passarem.

- [ ] **Passo 2.2: assinatura/verificação com o vetor de 7.2**

`crates/raiznet-crypto/src/signing.rs`:

```rust
use ed25519_dalek::{Signature, Signer, SigningKey, VerifyingKey};

pub fn sign(message: &[u8], key: &SigningKey) -> [u8; 64] {
    key.sign(message).to_bytes()
}

/// verify_strict rejeita pontos de ordem baixa; assinaturas honestas do
/// firmware (rweather/Crypto) e do sodium passam — provado pelo vetor 7.2.
pub fn verify(message: &[u8], signature: &[u8; 64], pubkey: &[u8; 32]) -> bool {
    let Ok(vk) = VerifyingKey::from_bytes(pubkey) else { return false };
    vk.verify_strict(message, &Signature::from_bytes(signature)).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::identity::node_keypair_from_mnemonic;

    const MNEMONIC: &str = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    const EXPECTED_SIG: &str = "2199c52836b4e4a314c1a051ca1f799624e9553ff6ae768d23d0f8287f68cc8c3405dc01f105a297769ff2a9fedc045ff0afefec3f47951cae2e87f059c71c08";

    #[test]
    fn signature_is_byte_identical_to_typescript() {
        let key = node_keypair_from_mnemonic(MNEMONIC).unwrap();
        let pubkey_hex = hex::encode(key.verifying_key().to_bytes());
        let raw = format!(
            "{pubkey_hex}|1|1700000000000|0|ec=1800|ph=6.20|waterLevel=80|tempAmbient=24.50|humidity=60.00"
        );
        let sig = sign(raw.as_bytes(), &key);
        assert_eq!(hex::encode(sig), EXPECTED_SIG);
        assert!(verify(raw.as_bytes(), &sig, &key.verifying_key().to_bytes()));
        assert!(!verify(raw.as_bytes(), &[0u8; 64], &key.verifying_key().to_bytes()));
    }
}
```

Rodar: `cargo test -p raiznet-crypto` → 3 testes passando. Ed25519 é
determinístico: se `signature_is_byte_identical_to_typescript` falhar, a
derivação ou a assinatura estão erradas — **não** ajuste o vetor.

- [ ] **Passo 2.3: AES-256-GCM com o vetor de 7.3**

`crates/raiznet-crypto/src/symmetric.rs`:

```rust
use aes_gcm::aead::{Aead, AeadCore, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Nonce};
use crate::identity::CryptoError;

pub struct EncryptedField {
    pub cipher: Vec<u8>, // ciphertext ‖ tag(16) — formato do symmetric.ts
    pub nonce: [u8; 12],
}

pub fn encrypt_field(value: f32, key: &[u8; 32]) -> Result<EncryptedField, CryptoError> {
    let aead = Aes256Gcm::new(key.into());
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let cipher = aead.encrypt(&nonce, value.to_be_bytes().as_slice()).map_err(|_| CryptoError::Aead)?;
    Ok(EncryptedField { cipher, nonce: nonce.into() })
}

pub fn decrypt_field(cipher_and_tag: &[u8], nonce: &[u8; 12], key: &[u8; 32]) -> Result<f32, CryptoError> {
    let aead = Aes256Gcm::new(key.into());
    let plain = aead.decrypt(Nonce::from_slice(nonce), cipher_and_tag).map_err(|_| CryptoError::Aead)?;
    let bytes: [u8; 4] = plain.as_slice().try_into().map_err(|_| CryptoError::Aead)?;
    Ok(f32::from_be_bytes(bytes))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decrypts_typescript_vector() {
        let key = [0x11u8; 32];
        let nonce = [0x22u8; 12];
        let cipher = hex::decode("5731612f87cc0d953260cd9674bc34ffe5f3caea").unwrap();
        let value = decrypt_field(&cipher, &nonce, &key).unwrap();
        assert!((value - 6.2).abs() < 1e-6);
    }

    #[test]
    fn roundtrip() {
        let key = [0x07u8; 32];
        let f = encrypt_field(3.75, &key).unwrap();
        assert_eq!(decrypt_field(&f.cipher, &f.nonce, &key).unwrap(), 3.75);
    }
}
```

- [ ] **Passo 2.4: identidade do nó em disco (compatível com o TS)**

`apps/raiznetd/src/identity.rs` — lê/cria `<data_dir>/identity.mnemonic`
exatamente como `apps/server/src/identity.ts` (texto puro, uma linha, trim,
modo 0600 via `std::os::unix::fs::PermissionsExt`). Geração de mnemonic novo:
`bip39::Mnemonic::generate(12)` (inglês). Teste: criar em tempdir, recarregar,
mesma pubkey; conferir permissões 0o600.

- [ ] **Passo 2.5: validação cruzada com o TS e commit**

```bash
cargo test -p raiznet-crypto
cargo clippy -p raiznet-crypto -- -D warnings
git add crates/raiznet-crypto apps/raiznetd/src/identity.rs
git commit -m "feat: raiznet-crypto with cross-validated key derivation, signing and AES-GCM"
```

**Critérios de fase:** assinatura Rust = assinatura TS byte a byte (vetor);
Rust decifra blob cifrado pelo TS; identidade gravada pelo TS carrega no Rust
com a mesma pubkey.

---

## Fase 3 — Store (SQLite)

**Files:**
- Create: `crates/raiznet-store/src/lib.rs`
- Create: `crates/raiznet-store/src/schema.rs`
- Create: `crates/raiznet-store/src/devices.rs`
- Create: `crates/raiznet-store/src/telemetry.rs`

`crates/raiznet-store/Cargo.toml`: `rusqlite`, `serde`, `serde_json`,
`thiserror`, `hex` (dev) via workspace.

- [ ] **Passo 3.1: schema e abertura**

`schema.rs` exporta `pub const SCHEMA: &str` com o DDL **verbatim** da seção
7.5 (copiar dali, não digitar de memória). `lib.rs`:

```rust
pub mod schema;
pub mod devices;
pub mod telemetry;

use rusqlite::Connection;
use std::path::Path;

#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error("sqlite: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("json: {0}")]
    Json(#[from] serde_json::Error),
}

/// Abre raiznet_public.db ou raiznet_private.db com os pragmas do servidor TS.
/// synchronous=NORMAL é adição segura para WAL (não muda dados observáveis).
pub fn open_db(path: &Path) -> Result<Connection, StoreError> {
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).ok();
    }
    let conn = Connection::open(path)?;
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    conn.pragma_update(None, "synchronous", "NORMAL")?;
    conn.execute_batch(schema::SCHEMA)?;
    Ok(conn)
}
```

Concorrência: `rusqlite::Connection` não é `Sync`. Padrão obrigatório do
projeto: cada banco vive em um `Arc<std::sync::Mutex<Connection>>`; handlers
seguram o lock pelo menor tempo possível (operações são sub-milissegundo).
Sem pool, sem `tokio::sync::Mutex`, sem spawn_blocking — YAGNI no perfil
pequeno; revisitar apenas se aparecer contenção medida.

- [ ] **Passo 3.2: tipos e operações de devices**

`devices.rs` — structs e funções completas:

```rust
use rusqlite::{Connection, OptionalExtension, params};
use crate::StoreError;

pub struct DeviceRow {
    pub pubkey: Vec<u8>,
    pub mac: Vec<u8>,
    pub owner_pubkey: Vec<u8>,
    pub name: String,
    pub device_type: i64,
    pub location: Option<i64>,
    pub status: i64,
    pub hardware: String,   // JSON cru, parse no handler
    pub created_at: i64,
}

pub struct DevicePolicyRow {
    pub pubkey: Vec<u8>,
    pub publish_to: i64,
    pub privacy_policy: String, // JSON cru
}

pub struct NewDevice<'a> {
    pub pubkey: &'a [u8],
    pub mac: &'a [u8],
    pub owner_pubkey: &'a [u8],
    pub owner_name: &'a str,
    pub name: &'a str,
    pub device_type: i64,
    pub publish_to: i64,
    pub location: Option<i64>,
    pub networks_json: &'a str,
    pub local_servers_json: &'a str,
    pub privacy_policy_json: &'a str,
    pub hardware_json: &'a str,
    pub created_at: i64,
}

pub fn device_exists(conn: &Connection, pubkey: &[u8]) -> Result<bool, StoreError> {
    let found: Option<i64> = conn
        .query_row("SELECT 1 FROM devices WHERE pubkey = ?1", params![pubkey], |r| r.get(0))
        .optional()?;
    Ok(found.is_some())
}

pub fn insert_device(conn: &Connection, d: &NewDevice) -> Result<(), StoreError> {
    // upsert do owner, igual a devices.ts:111-115
    conn.execute(
        "INSERT INTO users (pubkey, name, created_at) VALUES (?1, ?2, ?3)
         ON CONFLICT (pubkey) DO NOTHING",
        params![d.owner_pubkey, d.owner_name, d.created_at],
    )?;
    conn.execute(
        "INSERT INTO devices
           (pubkey, mac, owner_pubkey, name, type, publish_to, location,
            networks, local_servers, privacy_policy, hardware, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            d.pubkey, d.mac, d.owner_pubkey, d.name, d.device_type, d.publish_to,
            d.location, d.networks_json, d.local_servers_json,
            d.privacy_policy_json, d.hardware_json, d.created_at
        ],
    )?;
    Ok(())
}

const DEVICE_COLS: &str =
    "pubkey, mac, owner_pubkey, name, type, location, status, hardware, created_at";

fn row_to_device(r: &rusqlite::Row) -> rusqlite::Result<DeviceRow> {
    Ok(DeviceRow {
        pubkey: r.get(0)?, mac: r.get(1)?, owner_pubkey: r.get(2)?, name: r.get(3)?,
        device_type: r.get(4)?, location: r.get(5)?, status: r.get(6)?,
        hardware: r.get(7)?, created_at: r.get(8)?,
    })
}

pub fn get_device(conn: &Connection, pubkey: &[u8]) -> Result<Option<DeviceRow>, StoreError> {
    Ok(conn
        .query_row(
            &format!("SELECT {DEVICE_COLS} FROM devices WHERE pubkey = ?1"),
            params![pubkey], row_to_device,
        )
        .optional()?)
}

pub fn list_devices(conn: &Connection) -> Result<Vec<DeviceRow>, StoreError> {
    let mut stmt = conn.prepare(&format!("SELECT {DEVICE_COLS} FROM devices"))?;
    let rows = stmt.query_map([], row_to_device)?.collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

pub fn get_device_policy(conn: &Connection, pubkey: &[u8]) -> Result<Option<DevicePolicyRow>, StoreError> {
    Ok(conn
        .query_row(
            "SELECT pubkey, publish_to, privacy_policy FROM devices WHERE pubkey = ?1",
            params![pubkey],
            |r| Ok(DevicePolicyRow { pubkey: r.get(0)?, publish_to: r.get(1)?, privacy_policy: r.get(2)? }),
        )
        .optional()?)
}
```

- [ ] **Passo 3.3: operações de telemetria**

`telemetry.rs`:

```rust
use rusqlite::{Connection, params};
use crate::StoreError;

#[derive(Default, Clone)]
pub struct SensorColumns {
    pub plain: Option<f64>,
    pub cipher: Option<Vec<u8>>,
    pub nonce: Option<Vec<u8>>,
}

pub struct TelemetryInsert<'a> {
    pub device_pubkey: &'a [u8],
    pub seq: i64,
    pub timestamp: i64,
    pub received_at: i64,
    pub key_version: i64,
    pub ph: SensorColumns,
    pub ec: SensorColumns,
    pub water_level: SensorColumns,
    pub temp_water: SensorColumns,
    pub temp_ambient: SensorColumns,
    pub humidity: SensorColumns,
}

pub fn insert_telemetry(conn: &Connection, t: &TelemetryInsert) -> Result<(), StoreError> {
    conn.execute(
        "INSERT OR IGNORE INTO telemetry (
           device_pubkey, seq, timestamp, received_at, key_version,
           ph_plain, ph_cipher, ph_nonce,
           ec_plain, ec_cipher, ec_nonce,
           water_level_plain, water_level_cipher, water_level_nonce,
           temp_water_plain, temp_water_cipher, temp_water_nonce,
           temp_ambient_plain, temp_ambient_cipher, temp_ambient_nonce,
           humidity_plain, humidity_cipher, humidity_nonce
         ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23)",
        params![
            t.device_pubkey, t.seq, t.timestamp, t.received_at, t.key_version,
            t.ph.plain, t.ph.cipher, t.ph.nonce,
            t.ec.plain, t.ec.cipher, t.ec.nonce,
            t.water_level.plain, t.water_level.cipher, t.water_level.nonce,
            t.temp_water.plain, t.temp_water.cipher, t.temp_water.nonce,
            t.temp_ambient.plain, t.temp_ambient.cipher, t.temp_ambient.nonce,
            t.humidity.plain, t.humidity.cipher, t.humidity.nonce
        ],
    )?;
    Ok(())
}

pub struct TelemetryRow {
    pub seq: i64,
    pub timestamp: i64,
    pub received_at: i64,
    pub ph: SensorColumns,
    pub ec: SensorColumns,
    pub water_level: SensorColumns,
    pub temp_water: SensorColumns,
    pub temp_ambient: SensorColumns,
    pub humidity: SensorColumns,
}

/// Paridade com devices.ts:169-186: ORDER BY timestamp DESC LIMIT 500.
/// O endpoint público não retorna nonces — só seleciona _plain e _cipher.
pub fn query_telemetry(conn: &Connection, device_pubkey: &[u8]) -> Result<Vec<TelemetryRow>, StoreError> {
    let mut stmt = conn.prepare(
        "SELECT seq, timestamp, received_at,
                ph_plain, ph_cipher, ec_plain, ec_cipher,
                water_level_plain, water_level_cipher,
                temp_water_plain, temp_water_cipher,
                temp_ambient_plain, temp_ambient_cipher,
                humidity_plain, humidity_cipher
         FROM telemetry WHERE device_pubkey = ?1
         ORDER BY timestamp DESC LIMIT 500",
    )?;
    let col = |plain: Option<f64>, cipher: Option<Vec<u8>>| SensorColumns { plain, cipher, nonce: None };
    let rows = stmt
        .query_map(params![device_pubkey], |r| {
            Ok(TelemetryRow {
                seq: r.get(0)?, timestamp: r.get(1)?, received_at: r.get(2)?,
                ph: col(r.get(3)?, r.get(4)?), ec: col(r.get(5)?, r.get(6)?),
                water_level: col(r.get(7)?, r.get(8)?), temp_water: col(r.get(9)?, r.get(10)?),
                temp_ambient: col(r.get(11)?, r.get(12)?), humidity: col(r.get(13)?, r.get(14)?),
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}
```

- [ ] **Passo 3.4: testes de store**

Testes em cada módulo usando `Connection::open_in_memory()` + `execute_batch(SCHEMA)`:
1. inserir device + telemetria, ler de volta os mesmos valores (f64 exato);
2. inserir a mesma `(device_pubkey, seq)` duas vezes → 1 linha, sem erro;
3. telemetria de device inexistente → erro de FK (provando `foreign_keys = ON`);
4. `query_telemetry` ordena por `timestamp DESC` e limita a 500.

```bash
cargo test -p raiznet-store
git add crates/raiznet-store
git commit -m "feat: raiznet-store with TS-parity schema and operations"
```

**Critérios de fase:** schema byte-compatível com a seção 7.5; dedupe
idempotente; FK ativa.

---

## Fase 4 — API HTTP

**Files:**
- Create: `apps/raiznetd/src/http/mod.rs`, `http/health.rs`,
  `http/devices.rs`, `http/telemetry.rs`
- Create: `apps/raiznetd/src/config.rs`
- Create: `apps/raiznetd/src/domain/mod.rs`, `domain/errors.rs`
- Modify: `apps/raiznetd/src/main.rs`
- Test: `apps/raiznetd/tests/corpus.rs`

- [ ] **Passo 4.1: estado e destino**

`http/health.rs` (o handler sai do `main.rs` da Fase 1 para cá):

```rust
use axum::Json;

pub async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "ts": crate::now_ms() }))
}
```

`http/mod.rs`:

```rust
use rusqlite::Connection;
use std::sync::{Arc, Mutex};

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Destination {
    Public,
    Local,
}

#[derive(Clone)]
pub struct AppState {
    pub public_db: Arc<Mutex<Connection>>,
    pub private_db: Arc<Mutex<Connection>>,
    pub server_pubkey_hex: String,
    pub destination: Destination,
}

impl AppState {
    /// Banco usado pelas rotas de devices deste router — paridade com
    /// index.ts:29-30 (público → publicDb, local → privateDb).
    pub fn devices_db(&self) -> &Arc<Mutex<Connection>> {
        match self.destination {
            Destination::Public => &self.public_db,
            Destination::Local => &self.private_db,
        }
    }
}

pub fn build_router(state: AppState) -> axum::Router {
    use axum::routing::{get, post};
    use crate::http::{devices, health, telemetry};
    axum::Router::new()
        .route("/health", get(health::health))
        .route("/v1/devices", post(devices::register).get(devices::list))
        .route("/v1/devices/{id}", get(devices::get_one))
        .route("/v1/devices/{id}/telemetry", get(devices::telemetry_history))
        .route("/v1/telemetry", post(telemetry::ingest))
        .with_state(state)
}
```

- [ ] **Passo 4.2: erros de domínio com mensagens idênticas ao TS**

`domain/errors.rs` — as strings de `Display` **são contrato** (comparadas pelo
corpus contra `errors[].error`):

```rust
#[derive(Debug, thiserror::Error)]
pub enum DomainError {
    #[error("Device not found: {0}")]
    DeviceNotFound(String),
    #[error("Invalid signature for device {0}")]
    InvalidSignature(String),
    #[error("Invalid payload: {0}")]
    InvalidPayload(String),
    #[error("Raw/JSON mismatch for device {0}")]
    RawMismatch(String),
    #[error("storage failure")]
    Store(#[from] raiznet_store::StoreError),
}
```

- [ ] **Passo 4.3: rotas de devices**

`http/devices.rs` — tipos serde e handlers. Validações replicam o zod de
`devices.ts:49-77`; em caso de falha, `400 {"error":"validation_error",
"details":[<strings descritivas>]}`:

```rust
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde::Deserialize;
use serde_json::{Value, json};
use super::{AppState};

#[derive(Deserialize)]
pub struct FieldPolicyIn {
    pub default_disposition: u8,
    #[serde(default)]
    pub per_destination: std::collections::HashMap<String, u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterBody {
    pub id: String,
    pub mac: String,
    pub owner_pubkey: String,
    pub owner_name: Option<String>,
    pub name: String,
    #[serde(default)]
    pub r#type: i64,
    #[serde(default = "default_publish_to")]
    pub publish_to: i64,
    pub location: Option<i64>,
    #[serde(default)]
    pub networks: Vec<String>,
    #[serde(default)]
    pub local_servers: Vec<String>,
    pub privacy_policy: Option<std::collections::HashMap<String, FieldPolicyIn>>,
    pub hardware: Option<Value>,
}

fn default_publish_to() -> i64 { 1 }

fn default_privacy_policy() -> Value {
    let field = json!({ "default_disposition": 1, "per_destination": {} });
    json!({
        "ph": field, "ec": field, "water_level": field,
        "temp_water": field, "temp_ambient": field, "humidity": field
    })
}

fn format_device(d: &raiznet_store::devices::DeviceRow) -> Value {
    json!({
        "id": hex::encode(&d.pubkey),
        "mac": hex::encode(&d.mac),
        "ownerPubkey": hex::encode(&d.owner_pubkey),
        "name": d.name,
        "type": d.device_type,
        "location": d.location,
        "status": d.status,
        "hardware": serde_json::from_str::<Value>(&d.hardware).unwrap_or_else(|_| json!({})),
        "createdAt": d.created_at,
    })
}

fn validation_error(details: Vec<String>) -> (StatusCode, Json<Value>) {
    (StatusCode::BAD_REQUEST, Json(json!({ "error": "validation_error", "details": details })))
}

pub async fn register(
    State(state): State<AppState>,
    Json(body): Json<RegisterBody>,
) -> (StatusCode, Json<Value>) {
    let mut details = Vec::new();
    let pubkey = hex::decode(&body.id).unwrap_or_default();
    let mac = hex::decode(&body.mac).unwrap_or_default();
    let owner = hex::decode(&body.owner_pubkey).unwrap_or_default();
    if body.id.len() != 64 || pubkey.len() != 32 { details.push("id must be 64 hex chars".into()); }
    if body.mac.len() != 12 || mac.len() != 6 { details.push("mac must be 12 hex chars".into()); }
    if body.owner_pubkey.len() != 64 || owner.len() != 32 { details.push("ownerPubkey must be 64 hex chars".into()); }
    if body.name.is_empty() { details.push("name must not be empty".into()); }
    if !(0..=2).contains(&body.r#type) { details.push("type must be 0..2".into()); }
    if !(0..=2).contains(&body.publish_to) { details.push("publishTo must be 0..2".into()); }
    if let Some(pp) = &body.privacy_policy {
        if pp.values().any(|f| f.default_disposition > 2 || f.per_destination.values().any(|d| *d > 2)) {
            details.push("disposition must be 0..2".into());
        }
    }
    if !details.is_empty() { return validation_error(details); }

    let policy_json = body
        .privacy_policy
        .as_ref()
        .map(|pp| serde_json::to_value(
            pp.iter().map(|(k, f)| (k.clone(), json!({
                "default_disposition": f.default_disposition,
                "per_destination": f.per_destination,
            }))).collect::<serde_json::Map<_, _>>()
        ).expect("serializable"))
        .unwrap_or_else(default_privacy_policy);

    let db = state.devices_db().lock().expect("db mutex");
    match raiznet_store::devices::device_exists(&db, &pubkey) {
        Ok(true) => return (StatusCode::CONFLICT, Json(json!({ "error": "device_already_exists" }))),
        Ok(false) => {}
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "internal" }))),
    }

    let now = crate::now_ms() as i64;
    let owner_name = body.owner_name.clone().unwrap_or_else(|| body.owner_pubkey[..12].to_string());
    let new_device = raiznet_store::devices::NewDevice {
        pubkey: &pubkey, mac: &mac, owner_pubkey: &owner,
        owner_name: &owner_name, name: &body.name,
        device_type: body.r#type, publish_to: body.publish_to, location: body.location,
        networks_json: &serde_json::to_string(&body.networks).expect("serializable"),
        local_servers_json: &serde_json::to_string(&body.local_servers).expect("serializable"),
        privacy_policy_json: &policy_json.to_string(),
        hardware_json: &body.hardware.clone().unwrap_or_else(|| json!({})).to_string(),
        created_at: now,
    };
    if raiznet_store::devices::insert_device(&db, &new_device).is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "internal" })));
    }
    let row = raiznet_store::devices::get_device(&db, &pubkey).ok().flatten().expect("just inserted");
    (StatusCode::CREATED, Json(json!({ "device": format_device(&row) })))
}

pub async fn list(State(state): State<AppState>) -> (StatusCode, Json<Value>) {
    let db = state.devices_db().lock().expect("db mutex");
    match raiznet_store::devices::list_devices(&db) {
        Ok(rows) => (StatusCode::OK, Json(json!({ "devices": rows.iter().map(format_device).collect::<Vec<_>>() }))),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "internal" }))),
    }
}

pub async fn get_one(State(state): State<AppState>, Path(id): Path<String>) -> (StatusCode, Json<Value>) {
    let pubkey = hex::decode(&id).unwrap_or_default();
    let db = state.devices_db().lock().expect("db mutex");
    match raiznet_store::devices::get_device(&db, &pubkey) {
        Ok(Some(row)) => (StatusCode::OK, Json(json!({ "device": format_device(&row) }))),
        Ok(None) => (StatusCode::NOT_FOUND, Json(json!({ "error": "Device not found" }))),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "internal" }))),
    }
}

fn format_field(c: &raiznet_store::telemetry::SensorColumns) -> Value {
    match (&c.plain, &c.cipher) {
        (Some(v), _) => json!({ "value": v }),
        (None, Some(b)) => json!({ "encrypted": hex::encode(b) }),
        (None, None) => Value::Null,
    }
}

pub async fn telemetry_history(State(state): State<AppState>, Path(id): Path<String>) -> (StatusCode, Json<Value>) {
    let pubkey = hex::decode(&id).unwrap_or_default();
    let db = state.devices_db().lock().expect("db mutex");
    match raiznet_store::telemetry::query_telemetry(&db, &pubkey) {
        Ok(rows) => {
            let readings: Vec<Value> = rows.iter().map(|r| json!({
                "seq": r.seq, "timestamp": r.timestamp, "receivedAt": r.received_at,
                "ph": format_field(&r.ph), "ec": format_field(&r.ec),
                "waterLevel": format_field(&r.water_level), "tempWater": format_field(&r.temp_water),
                "tempAmbient": format_field(&r.temp_ambient), "humidity": format_field(&r.humidity),
            })).collect();
            (StatusCode::OK, Json(json!({ "readings": readings })))
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "internal" }))),
    }
}
```

- [ ] **Passo 4.4: rota de telemetria (handler fino; o domínio fica na Fase 5)**

`http/telemetry.rs`:

```rust
use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use serde::Deserialize;
use serde_json::{Value, json};
use super::AppState;
use crate::domain::telemetry::{SensorField, TelemetryBlock, ingest_block};
use crate::domain::errors::DomainError;

#[derive(Deserialize)]
pub struct SensorFieldInput {
    pub plain: Option<f64>,
    pub cipher: Option<String>,
    pub nonce: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockInput {
    pub device_id: String,
    pub seq: String,
    pub timestamp: String,
    pub key_version: i64,
    pub ph: Option<SensorFieldInput>,
    pub ec: Option<SensorFieldInput>,
    pub water_level: Option<SensorFieldInput>,
    pub temp_water: Option<SensorFieldInput>,
    pub temp_ambient: Option<SensorFieldInput>,
    pub humidity: Option<SensorFieldInput>,
    pub signature: String,
    pub raw: String,
}

#[derive(Deserialize)]
pub struct TelemetryBody {
    pub blocks: Vec<BlockInput>,
}

/// Paridade com http/public/telemetry.ts:37-48.
fn parse_field(f: &Option<SensorFieldInput>) -> SensorField {
    match f {
        None => SensorField::Absent,
        Some(f) => {
            if let Some(v) = f.plain {
                return SensorField::Plain(v);
            }
            if let (Some(c), Some(n)) = (&f.cipher, &f.nonce) {
                if let (Ok(cipher), Ok(nonce)) = (hex::decode(c), hex::decode(n)) {
                    return SensorField::Encrypted { cipher, nonce };
                }
            }
            SensorField::Absent
        }
    }
}

fn parse_block(b: &BlockInput) -> Result<TelemetryBlock, DomainError> {
    let device_id: [u8; 32] = hex::decode(&b.device_id)
        .ok().and_then(|v| v.try_into().ok())
        .ok_or_else(|| DomainError::InvalidPayload("deviceId".into()))?;
    let signature: [u8; 64] = hex::decode(&b.signature)
        .ok().and_then(|v| v.try_into().ok())
        .ok_or_else(|| DomainError::InvalidPayload("signature".into()))?;
    let raw = hex::decode(&b.raw).map_err(|_| DomainError::InvalidPayload("raw".into()))?;
    let seq: i64 = b.seq.parse().map_err(|_| DomainError::InvalidPayload("seq".into()))?;
    let timestamp: i64 = b.timestamp.parse().map_err(|_| DomainError::InvalidPayload("timestamp".into()))?;
    Ok(TelemetryBlock {
        device_id, seq, timestamp, key_version: b.key_version,
        ph: parse_field(&b.ph), ec: parse_field(&b.ec),
        water_level: parse_field(&b.water_level), temp_water: parse_field(&b.temp_water),
        temp_ambient: parse_field(&b.temp_ambient), humidity: parse_field(&b.humidity),
        signature, raw,
    })
}

pub async fn ingest(
    State(state): State<AppState>,
    Json(body): Json<TelemetryBody>,
) -> (StatusCode, Json<Value>) {
    if body.blocks.is_empty() || body.blocks.len() > 100 {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "blocks must have 1..100 items" })));
    }
    let mut errors: Vec<Value> = Vec::new();
    for b in &body.blocks {
        let result = parse_block(b).and_then(|block| ingest_block(&block, &state));
        match result {
            Ok(()) => {}
            Err(DomainError::Store(e)) => {
                tracing::error!(error = %e, "telemetry storage failure");
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "internal" })));
            }
            Err(e) => errors.push(json!({ "seq": b.seq, "error": e.to_string() })),
        }
    }
    let accepted = body.blocks.len() - errors.len();
    let status = if errors.is_empty() { StatusCode::OK } else { StatusCode::MULTI_STATUS };
    (status, Json(json!({ "accepted": accepted, "errors": errors })))
}
```

- [ ] **Passo 4.5: config e main com dois listeners**

`config.rs` — env vars com defaults (paridade de portas com o TS):

```rust
pub struct Config {
    pub public_port: u16,   // RAIZNET_PUBLIC_PORT, default 3000
    pub local_port: u16,    // RAIZNET_LOCAL_PORT,  default 3001
    pub data_dir: std::path::PathBuf, // RAIZNET_DATA_DIR, default ./data
    pub log_level: String,  // RAIZNET_LOG_LEVEL,   default "info"
}

impl Config {
    pub fn from_env() -> Self {
        fn var<T: std::str::FromStr>(name: &str, default: T) -> T {
            std::env::var(name).ok().and_then(|v| v.parse().ok()).unwrap_or(default)
        }
        Config {
            public_port: var("RAIZNET_PUBLIC_PORT", 3000),
            local_port: var("RAIZNET_LOCAL_PORT", 3001),
            data_dir: std::env::var("RAIZNET_DATA_DIR").unwrap_or_else(|_| "./data".into()).into(),
            log_level: std::env::var("RAIZNET_LOG_LEVEL").unwrap_or_else(|_| "info".into()),
        }
    }
}
```

`main.rs` final da fase: carrega config, identidade (Fase 2), abre os dois
bancos (`raiznet_public.db`, `raiznet_private.db`), monta dois `AppState`
(mesmos `Arc<Mutex<Connection>>`, `destination` diferente) e serve:

```rust
let public_router = http::build_router(AppState { destination: Destination::Public, ..base.clone() });
let local_router  = http::build_router(AppState { destination: Destination::Local,  ..base });

let public_listener = tokio::net::TcpListener::bind(("0.0.0.0", config.public_port)).await?;
let local_listener  = tokio::net::TcpListener::bind(("127.0.0.1", config.local_port)).await?;
tokio::try_join!(
    axum::serve(public_listener, public_router).into_future(),
    axum::serve(local_listener, local_router).into_future(),
)?;
```

- [ ] **Passo 4.6: teste de integração com o corpus**

`apps/raiznetd/tests/corpus.rs`: sobe o router em memória (bancos
`open_in_memory`), lê os arquivos de `test-fixtures/` (path relativo
`../../test-fixtures`) e valida, nesta ordem:

1. `POST /v1/devices` com `devices/register-ok.json` → status e body de
   `expected-http/register-ok.json`;
2. repetir → `expected-http/register-duplicate.json`;
3. `POST /v1/telemetry` com `telemetry/post-ok.json` → `telemetry-ok.json`;
4. repetir → `telemetry-duplicate.json` (200, accepted 1);
5. linha no banco confere com `expected-sqlite/telemetry-ok.json`;
6. `telemetry/post-bad-signature.json` → `telemetry-bad-signature.json`;
7. telemetria **antes** de registrar (banco limpo) →
   `telemetry-unknown-device.json`;
8. `GET /v1/devices/{id}/telemetry` retorna o reading com
   `{"ph":{"value":6.2},...}` e `tempWater: null`.

Use `tower::ServiceExt::oneshot` (adicionar `tower` como dev-dependency —
registrado aqui como exceção permitida à tabela da seção 6).

- [ ] **Passo 4.7: validação ponta a ponta com o firmware e commit**

```bash
cargo test --workspace
cargo run -p raiznetd &
# apontar um ESP32 real (ou replay via curl dos fixtures) para :3000 e
# observar registro + telemetria entrando
git add apps/raiznetd
git commit -m "feat: raiznetd HTTP API with TS behavioural parity"
```

**Critérios de fase:** os 8 casos do corpus passam; um ESP32 real registra e
envia telemetria para o `raiznetd` sem nenhuma mudança no firmware.

---

## Fase 5 — Regras de domínio (paridade + endurecimento)

**Files:**
- Create: `apps/raiznetd/src/domain/telemetry.rs`
- Test: colocado no mesmo arquivo + corpus da Fase 4

- [ ] **Passo 5.1: porta de `ingestBlock` (paridade exata — seção 7.6)**

```rust
use crate::domain::errors::DomainError;
use crate::http::{AppState, Destination};
use raiznet_store::telemetry::{SensorColumns, TelemetryInsert, insert_telemetry};
use serde::Deserialize;
use std::collections::HashMap;

pub enum SensorField {
    Plain(f64),
    Encrypted { cipher: Vec<u8>, nonce: Vec<u8> },
    Absent,
}

pub struct TelemetryBlock {
    pub device_id: [u8; 32],
    pub seq: i64,
    pub timestamp: i64,
    pub key_version: i64,
    pub ph: SensorField,
    pub ec: SensorField,
    pub water_level: SensorField,
    pub temp_water: SensorField,
    pub temp_ambient: SensorField,
    pub humidity: SensorField,
    pub signature: [u8; 64],
    pub raw: Vec<u8>,
}

const DISPOSITION_OMIT: u8 = 0;
const DISPOSITION_PLAIN: u8 = 1;
const DISPOSITION_ENCRYPTED: u8 = 2;

#[derive(Deserialize, Default)]
struct FieldPolicy {
    default_disposition: u8,
    #[serde(default)]
    per_destination: HashMap<String, u8>,
}

fn resolve_disposition(policy: Option<&FieldPolicy>, server_pubkey_hex: &str) -> u8 {
    match policy {
        None => DISPOSITION_OMIT,
        Some(p) => *p.per_destination.get(server_pubkey_hex).unwrap_or(&p.default_disposition),
    }
}

/// Paridade com domain/telemetry.ts fieldToColumns: mismatch wire×política
/// resulta em colunas NULL, silenciosamente.
fn field_to_columns(field: &SensorField, disposition: u8) -> SensorColumns {
    match (field, disposition) {
        (SensorField::Plain(v), DISPOSITION_PLAIN) => SensorColumns { plain: Some(*v), cipher: None, nonce: None },
        (SensorField::Encrypted { cipher, nonce }, DISPOSITION_ENCRYPTED) => {
            SensorColumns { plain: None, cipher: Some(cipher.clone()), nonce: Some(nonce.clone()) }
        }
        _ => SensorColumns::default(),
    }
}

pub fn ingest_block(block: &TelemetryBlock, state: &AppState) -> Result<(), DomainError> {
    let device_id_hex = hex::encode(block.device_id);

    let policy_row = {
        let db = state.devices_db().lock().expect("db mutex");
        raiznet_store::devices::get_device_policy(&db, &block.device_id)?
            .ok_or_else(|| DomainError::DeviceNotFound(device_id_hex.clone()))?
    };

    let registered_pubkey: [u8; 32] = policy_row.pubkey.as_slice().try_into()
        .map_err(|_| DomainError::InvalidPayload("stored pubkey".into()))?;
    if !raiznet_crypto::signing::verify(&block.raw, &block.signature, &registered_pubkey) {
        return Err(DomainError::InvalidSignature(device_id_hex));
    }

    let policy: HashMap<String, FieldPolicy> =
        serde_json::from_str(&policy_row.privacy_policy).unwrap_or_default();
    let d = |name: &str| resolve_disposition(policy.get(name), &state.server_pubkey_hex);

    let insert = TelemetryInsert {
        device_pubkey: &block.device_id,
        seq: block.seq,
        timestamp: block.timestamp,
        received_at: crate::now_ms() as i64,
        key_version: block.key_version,
        ph: field_to_columns(&block.ph, d("ph")),
        ec: field_to_columns(&block.ec, d("ec")),
        water_level: field_to_columns(&block.water_level, d("water_level")),
        temp_water: field_to_columns(&block.temp_water, d("temp_water")),
        temp_ambient: field_to_columns(&block.temp_ambient, d("temp_ambient")),
        humidity: field_to_columns(&block.humidity, d("humidity")),
    };

    // Paridade com telemetry.ts:132-140: o destino escolhe o banco; um device
    // "both" envia requests separados para cada endpoint.
    match state.destination {
        Destination::Public if policy_row.publish_to == 1 || policy_row.publish_to == 2 => {
            let db = state.public_db.lock().expect("db mutex");
            insert_telemetry(&db, &insert)?;
        }
        Destination::Local if policy_row.publish_to == 0 || policy_row.publish_to == 2 => {
            let db = state.private_db.lock().expect("db mutex");
            insert_telemetry(&db, &insert)?;
        }
        _ => {} // publish_to incompatível com o destino: aceito sem inserir (paridade)
    }
    Ok(())
}
```

Testes unitários colocados: dispositivo `local_only` no destino público não
insere nada e não erra; política com `per_destination` para a pubkey do
servidor sobrepõe o default; campo `plain` com disposição `encrypted` vira
NULL.

- [ ] **Passo 5.2 (endurecimento): cross-check raw↔JSON**

Motivação: item 5 da seção 7.7 — hoje um par `(raw, signature)` válido pode
ser reenviado com valores JSON adulterados. Implementar
`verify_raw_consistency(block) -> Result<(), DomainError>`:

1. Parse do `raw` como UTF-8:
   `pubkey|seq|timestamp|key_version[|chave=valor]...`.
2. Exigir: `pubkey == hex(device_id)`, `seq`, `timestamp` e `key_version`
   iguais aos do bloco.
3. Mapear chaves do raw → campos do bloco: `ec→ec`, `ph→ph`,
   `waterLevel→water_level`, `tempAmbient→temp_ambient`,
   `humidity→humidity`, `tempWater→temp_water`.
4. Para cada `chave=valor` no raw: o campo correspondente do bloco deve ser
   `Plain(v)` com `|v - valor_parseado| < 1e-6` (comparação **numérica**;
   lembre `6.20` vs `6.2`).
5. Nenhum campo `Plain` no bloco pode estar ausente do raw (campos
   `Encrypted` ficam fora do raw por design — não exigir).
6. Falha → `DomainError::RawMismatch(device_id_hex)`.

Chamar no início de `ingest_block`, **atrás de flag**: env
`RAIZNET_STRICT_RAW` (default `1`; `0` desliga). Adicionar ao corpus um caso
novo: bloco com `ph.plain` adulterado → 207 com
`Raw/JSON mismatch for device <hex>`. Registrar no fixture que esse caso é
extensão do Rust (o TS aceita).

- [ ] **Passo 5.3: commit**

```bash
cargo test --workspace
git add apps/raiznetd
git commit -m "feat: telemetry domain rules with raw/JSON consistency hardening"
```

**Critérios de fase:** assinatura inválida nunca insere; duplicata não
corrompe estado; campo privado (`omit` público) não aparece no banco público;
campo cifrado armazenado sem o servidor conhecer o valor; bloco adulterado
rejeitado com strict mode ligado.

---

## Fase 6 — Perfil `small-node`

Configuração para dispositivos pequenos. Tudo via env vars (sem arquivo de
config por enquanto — YAGNI):

```text
RAIZNET_PROFILE=small-node        # ativa os defaults abaixo
RAIZNET_PUBLIC_PORT=3000
RAIZNET_LOCAL_PORT=3001
RAIZNET_DATA_DIR=/var/lib/raiznet
RAIZNET_MAX_HTTP_BODY_BYTES=262144   # axum DefaultBodyLimit
RAIZNET_MAX_BATCH_BLOCKS=64          # sobrepõe o teto de 100 da API
RAIZNET_SQLITE_CACHE_MB=8            # PRAGMA cache_size negativo (KB)
RAIZNET_RETENTION_DAYS=30            # job periódico de DELETE + checkpoint
RAIZNET_LOG_LEVEL=info
RAIZNET_STRICT_RAW=1
```

### Tarefas

- [ ] Aplicar `DefaultBodyLimit::max(n)` no router.
- [ ] `PRAGMA cache_size = -8192` (8 MB) e `PRAGMA wal_autocheckpoint = 512`
      ao abrir os bancos quando o perfil é `small-node`.
- [ ] Task tokio periódica (1×/hora): `DELETE FROM telemetry WHERE timestamp <
      (now_ms - retention_days*86400000)` em lotes de 5 000 linhas +
      `PRAGMA wal_checkpoint(TRUNCATE)` ao final. Retenção **não** se aplica a
      `users`/`devices`.
- [ ] Logs em JSON para stdout (journald rotaciona; não escrever arquivo de
      log próprio).
- [ ] Paginação opcional em `GET /v1/devices/{id}/telemetry` via
      `?limit=&before=` (default mantém `LIMIT 500` — extensão compatível,
      não muda o default).

### Regras do perfil pequeno

Sem dashboard embutido. Sem Docker. Sem Node.js. Sem build local. Batches
pequenos. Retenção obrigatória. Rebuild de índice em lotes.

### Critérios de validação

- RSS idle < 50 MB; RSS sob ingestão contínua < 100 MB
  (`ps -o pid,rss,cmd -C raiznetd`).
- Banco não cresce sem limite com retenção ativa (rodar ingestão sintética de
  24 h acelerada e medir `du`).
- O processo reinicia (kill -9 + systemd restart) sem perder identidade nem
  corromper os bancos (WAL recovery).

---

## Fase 7 — Event log Raiznet-native

> ⚠️ **Esta fase e as seguintes exigem um plano detalhado próprio antes da
> execução** (novo documento via skill de planejamento + ADR em `docs/adr/`).
> O esboço abaixo fixa o modelo e os critérios, não os passos.

Depois que a API atual estiver estável em Rust, introduzir a fonte de verdade
futura. Criar `crates/raiznet-events`.

### Modelo mínimo de evento

```
event_id      bytes(32)   // hash do envelope canônico
event_type    string      // "device_registered" | "telemetry_block" | ...
author_pubkey bytes(32)
seq           uint64      // monotônico por autor
timestamp     uint64
payload       bytes       // serialização canônica (Fase 9 define Protobuf)
prev_hash     bytes(32)   // hash do evento anterior do mesmo autor (hash chain)
payload_hash  bytes(32)
signature     bytes(64)   // Ed25519 do autor sobre o envelope canônico
```

Armazenamento inicial: tabela SQLite `events` (append-only por convenção) —
arquivos segmentados ou Merkle tree só quando houver necessidade real de
provas parciais.

### Tarefas (alto nível)

1. Definir envelope canônico (bytes assinados) com fixtures binários.
2. Gravar evento **antes** de atualizar o índice SQLite (write-ahead lógico).
3. Replay do log reconstrói `raiznet_public.db` do zero, em lotes.
4. Migrar a ingestão para: validar → gravar evento → indexar.

### Critérios de validação

- Apagar o SQLite derivado e reconstruir do log produz bancos idênticos
  (diff de dump SQL).
- Evento adulterado (1 byte) é detectado pela cadeia de hashes.
- Replay de 1 M de eventos roda dentro do perfil de memória do small-node.

## Fase 8 — Replicação própria

Sync Raiznet sem Hypercore. Criar `crates/raiznet-sync`. **Plano detalhado
próprio antes de executar.** Modelo decidido em
`docs/adr/004-raiznet-native-replication.md`: duas partes, nesta ordem.

### Sync v1 — peers configurados (HTTP outbound simples)

1. Nó A conhece nó B por URL configurada (`RAIZNET_PEERS=https://...`).
2. A pede resumo de heads (`GET /v1/sync/heads`: `{author_pubkey → last_seq}`).
3. A baixa eventos faltantes em lotes (`GET /v1/sync/events?author=&from_seq=&limit=`).
4. A valida assinatura, hash chain e regras de domínio de cada evento.
5. A aplica ao log local e reindexa.

Cobre LAN, VPN/Tailscale e nós com IP público — a maior parte do uso real —
sem hole punching e sem dependências novas. mDNS para descoberta local entra
aqui se for barato.

### Sync v2 — transporte dial-by-pubkey (fundação pronta, não from scratch)

- Candidato primário: **iroh** (node IDs Ed25519 — casa com a identidade
  Raiznet —, QUIC, hole punching com relays self-hostable, gossip por topic).
- Fallback: **rust-libp2p** (Kademlia, GossipSub, AutoNAT/DCUtR/Relay v2).
- **Gate obrigatório antes do compromisso**: spike de campo com dois nós em
  links 4G/CGNAT reais, medindo taxa de conexão direta vs via relay. Sem o
  spike, não se adota o transporte.
- Relays são nós da comunidade (qualquer nó alcançável pode ser um) — nunca
  um gateway privilegiado. Isolar o transporte atrás da API de
  `raiznet-sync` para que uma eventual troca iroh↔libp2p não vaze para o
  resto do sistema.

### Evolução posterior (cada item = ADR próprio)

Gossip de peers → compactação por snapshots → políticas de redes/filtros →
camada de conteúdo (Materials).

### Critérios de validação

- Dois nós Rust sincronizam dados públicos.
- Um nó atrasado alcança o estado atual; sync interrompido no meio retoma.
- Evento inválido recebido de peer é rejeitado e logado, sem envenenar o log
  local.

## Fase 9 — Protobuf canônico

Quando a API JSON estiver estável e o event log existir. Reusar os `.proto`
de `packages/protocol/proto/` (`device.proto`, `telemetry.proto`,
`user.proto`) onde fizer sentido; gerar Rust com `prost-build`.

Pontos fixos:
- JSON permanece como compatibilidade para o firmware atual e debug.
- Os **bytes canônicos assinados** são definidos aqui (campos em ordem de
  número de campo, sem campos default — documentar a regra exata no plano da
  fase). A assinatura nunca pode depender de ordenação acidental de JSON.
- Fixtures binários no corpus.

### Critérios de validação

- O mesmo evento produz bytes canônicos reproduzíveis em qualquer nó.
- Firmware antigo (JSON) continua funcionando.

## Fase 10 — Build e deploy no alvo ARM64

O Snapdragon 410 (MSM8916) é **aarch64** com pouca RAM — nunca compilar no
dispositivo.

- [ ] **Passo 10.1: build estático cross-compilado**

Alvo `aarch64-unknown-linux-musl` (binário estático: zero dependência de
glibc do sistema — o OpenStick pode rodar Debian antigo). A feature `bundled`
do rusqlite compila o SQLite em C junto; usar `cargo-zigbuild` que resolve o
cross-toolchain C automaticamente:

```bash
rustup target add aarch64-unknown-linux-musl
cargo install cargo-zigbuild   # requer zig instalado
cargo zigbuild --release --target aarch64-unknown-linux-musl -p raiznetd
file target/aarch64-unknown-linux-musl/release/raiznetd
```

Esperado: `ELF 64-bit LSB executable, ARM aarch64, statically linked`.
Alternativa se zig não estiver disponível: `cross build` (usa Docker na
máquina de build — aceitável; Docker proibido só no dispositivo).

- [ ] **Passo 10.2: instalar no dispositivo**

```bash
scp target/aarch64-unknown-linux-musl/release/raiznetd root@openstick:/usr/local/bin/raiznetd
ssh root@openstick 'useradd -r -s /usr/sbin/nologin raiznet 2>/dev/null; mkdir -p /var/lib/raiznet && chown raiznet:raiznet /var/lib/raiznet'
```

- [ ] **Passo 10.3: serviço systemd**

`/etc/systemd/system/raiznetd.service`:

```ini
[Unit]
Description=Raiznet node
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/raiznetd
Environment=RAIZNET_PROFILE=small-node
Environment=RAIZNET_DATA_DIR=/var/lib/raiznet
Restart=always
RestartSec=5
User=raiznet
Group=raiznet
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/lib/raiznet
MemoryMax=150M

[Install]
WantedBy=multi-user.target
```

- [ ] **Passo 10.4: validação no dispositivo**

```bash
systemctl enable --now raiznetd
curl -s http://127.0.0.1:3000/health          # {"status":"ok","ts":...}
ps -o pid,rss,cmd -C raiznetd                 # RSS < 50000 (KB) idle
du -sh /var/lib/raiznet
journalctl -u raiznetd --no-pager -n 50
```

E o teste que importa: um ESP32 na mesma rede registra e envia telemetria
para o OpenStick.

---

## Ordem recomendada de implementação

1. Fixtures de compatibilidade (Fase 0).
2. Workspace Rust (Fase 1).
3. Crypto com vetores cruzados (Fase 2).
4. SQLite (Fase 3).
5. HTTP com corpus (Fase 4).
6. Domínio + endurecimento (Fase 5). ← **marco de paridade: firmware real no Rust**
7. Perfil `small-node` (Fase 6).
8. Deploy no OpenStick (Fase 10 pode vir aqui — não depende das fases 7–9).
9. Event log (Fase 7, com plano próprio).
10. Sync simples outbound (Fase 8, com plano próprio).
11. Protobuf canônico (Fase 9, com plano próprio).
12. Remoção gradual do servidor TypeScript.

## O que não fazer agora

- Não portar Hypercore inteiro.
- Não implementar DHT antes de ter sync simples funcionando.
- Não colocar dashboard web dentro do binário pequeno.
- Não exigir Docker no dispositivo.
- Não trocar firmware e servidor ao mesmo tempo.
- Não criar ORM.
- Não permitir crescimento infinito do SQLite.
- Não depender de OpenSSL.
- Não "consertar" comportamentos do TS fora das tarefas de endurecimento.

## Definição de sucesso

A migração é bem-sucedida quando:

1. O firmware atual registra e envia telemetria para o Rust **sem nenhuma
   mudança no firmware** (provado com hardware real, não só fixtures).
2. O Rust valida assinaturas e aplica privacidade exatamente como o corpus
   descreve (8+ casos passando).
3. O SQLite resultante é equivalente ao do servidor TypeScript para os
   fixtures (mesmas linhas, mesmos valores).
4. O binário roda no OpenStick sem runtime adicional, estático.
5. RSS idle < 50 MB, sob ingestão < 100 MB.
6. O banco tem retenção/compactação ativas.
7. (Pós-paridade) Dois nós Rust sincronizam dados públicos por protocolo
   Raiznet próprio.

Nesse ponto, o servidor TypeScript deixa de ser necessário para o caminho
principal do Raiznet.
