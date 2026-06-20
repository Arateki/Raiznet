---
description: O stack técnico da Raiznet — Node.js, Fastify, SQLite, Ed25519 e VitePress hoje; Protobuf, H3 e Roaring Bitmaps planejados — e o papel do SQLite.
---

# Stack

## Stack atual (implementado)

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | Node.js | 24 LTS |
| Linguagem | TypeScript (strict) | 5.x |
| HTTP | Fastify | 5.x |
| Armazenamento SQL | better-sqlite3 | 11.x |
| Validação | zod | 3.x |
| Cripto (Ed25519) | hypercore-crypto (libsodium) | 3.x |
| Seeds BIP-39 | @scure/bip39 | 1.x |
| Logger | pino | 9.x |
| Monorepo | pnpm workspaces | 9.x |
| Testes | vitest | 3.x |
| Docs | VitePress | 1.x |
| Firmware | PlatformIO + framework Arduino (ESP32) | — |

## Planejado / em avaliação

| Camada | Tecnologia | Status |
|---|---|---|
| Serialização canônica | Protobuf (`@bufbuild/protobuf` no Node, `nanopb` no ESP32) | Schemas existem, codegen inativo — veja [ADR-001](/adr/001-protobuf) |
| Geolocalização | h3-js | Planejado com os recursos de mapa |
| Operações de conjunto em filtros | Roaring Bitmaps | Planejado com os filtros |
| App desktop | Tauri 2.x | Fase futura |
| Replicação de nós | Log de eventos assinado + sync entre peers | Em design — veja [Roadmap](/guide/roadmap) |

## Estrutura do repositório

```
raiznet/
├── apps/
│   ├── server/          # Nó Fastify (endpoints público + local)
│   ├── cli/             # Ferramenta de operação e depuração
│   ├── website/         # Landing page raiznet.com
│   ├── dashboard/       # Dashboard web
│   └── prototype/       # Canvas de design da UI (React + Vite)
├── packages/
│   ├── protocol/        # Schemas .proto (formato canônico, planejado)
│   ├── crypto/          # Derivação de chaves, assinatura, AES-256-GCM
│   └── core/            # Abstrações compartilhadas
├── firmware/
│   ├── safraSense/      # Firmware ESP32 de referência (sensor completo)
│   └── esp32-sensor/    # Exemplo mínimo
└── docs/                # Este site
```

O firmware de produção do hardware SafraSense da Arateki vive em um repositório separado; o firmware neste repositório é a implementação de referência aberta do protocolo.

## Decisões de design

**Não introduzir sem discussão:**
- NestJS — pesado demais
- Express — obsoleto frente ao Fastify
- ORMs — better-sqlite3 direto
- Redis — não se justifica neste estágio
- Docker em dev — roda local
- Kafka — desnecessário

## O papel do SQLite

Hoje, o SQLite é o armazenamento local primário do nó: a ingestão valida um bloco e o escreve diretamente em `raiznet_public.db` / `raiznet_private.db`.

O objetivo de design é que a fonte da verdade passe a ser um **log de eventos assinado e somente-anexação**, com o SQLite como índice derivado que pode ser apagado e reconstruído reproduzindo o log (veja [ADR-002](/adr/002-sqlite-cache)). O schema de tabela larga já está moldado para isso:

- Consultas agregadas rápidas (colunas `REAL` fixas por sensor)
- Sem ORM — SQL direto com resultados tipados
- Novos tipos de sensor exigem adicionar três colunas (`_plain`, `_cipher`, `_nonce`) por campo
