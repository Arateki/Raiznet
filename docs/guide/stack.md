# Tech Stack

## Current stack (implemented)

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 24 LTS |
| Language | TypeScript (strict) | 5.x |
| HTTP | Fastify | 5.x |
| SQL storage | better-sqlite3 | 11.x |
| Validation | zod | 3.x |
| Crypto (Ed25519) | hypercore-crypto (libsodium) | 3.x |
| BIP-39 seeds | @scure/bip39 | 1.x |
| Logger | pino | 9.x |
| Monorepo | pnpm workspaces | 9.x |
| Tests | vitest | 3.x |
| Docs | VitePress | 1.x |
| Firmware | PlatformIO + Arduino framework (ESP32) | — |

## Planned / under evaluation

| Layer | Technology | Status |
|---|---|---|
| Canonical serialization | Protobuf (`@bufbuild/protobuf` on Node, `nanopb` on ESP32) | Schemas exist, codegen not active — see [ADR-001](/adr/001-protobuf) |
| Geolocation | h3-js | Planned with the map features |
| Filter set operations | Roaring Bitmaps | Planned with filters |
| Desktop app | Tauri 2.x | Future phase |
| Node replication | Signed event log + peer sync | In design — see [Roadmap](/guide/roadmap) |

## Repository structure

```
raiznet/
├── apps/
│   ├── server/          # Fastify node (public + local endpoints)
│   ├── cli/             # Operations and debug tool
│   ├── website/         # raiznet.com landing page
│   ├── dashboard/       # Web dashboard
│   └── prototype/       # UI design canvas (React + Vite)
├── packages/
│   ├── protocol/        # .proto schemas (canonical format, planned)
│   ├── crypto/          # Key derivation, signing, AES-256-GCM
│   └── core/            # Shared abstractions
├── firmware/
│   ├── safraSense/      # Reference ESP32 firmware (full sensor)
│   └── esp32-sensor/    # Minimal sample
└── docs/                # This site
```

The production firmware for Arateki's SafraSense hardware lives in a separate repository; the firmware in this repo is the open reference implementation of the protocol.

## Design decisions

**Do not introduce without discussion:**
- NestJS — too heavy
- Express — obsolete vs Fastify
- ORMs — better-sqlite3 directly
- Redis — not justified at this stage
- Docker in dev — runs local
- Kafka — not necessary

## SQLite role

Today, SQLite is the node's primary local storage: ingest validates a block and writes it directly to `raiznet_public.db` / `raiznet_private.db`.

The design goal is for the source of truth to become a **signed append-only event log**, with SQLite as a derived index that can be deleted and rebuilt by replaying the log (see [ADR-002](/adr/002-sqlite-cache)). The wide-table schema is already shaped for that:

- Fast aggregated queries (fixed `REAL` columns per sensor)
- No ORM — direct SQL with typed results
- New sensor types require adding three columns (`_plain`, `_cipher`, `_nonce`) per field
