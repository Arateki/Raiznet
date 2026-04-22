# Tech Stack

## Frozen stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 24 LTS |
| Language | TypeScript | 5.x |
| HTTP | Fastify | 5.x |
| P2P core | hypercore | 11.x |
| P2P swarm | hyperswarm | 4.x |
| P2P index | hyperbee | 2.x |
| P2P multi-writer | autobase | 7.x |
| P2P filesystem | hyperdrive | 11.x |
| Core manager | corestore | 7.x |
| Crypto | hypercore-crypto + sodium-universal | latest |
| Serialization (Node.js) | @bufbuild/protobuf + @bufbuild/protoc-gen-es | latest |
| Serialization (ESP32) | nanopb | latest |
| SQL index | better-sqlite3 | latest |
| Validation | zod | 3.x |
| Logger | pino | 9.x |
| Monorepo | pnpm workspaces | 9.x |
| Tests | vitest | latest |
| Desktop | Tauri | 2.x (future) |
| Geolocation | h3-js | latest |
| BIP-39 seeds | @scure/bip39 | latest |
| Set operations (filters) | roaring | latest |
| Firmware | PlatformIO + Arduino framework | — |

## Repository structure

```
raiznet/
├── apps/
│   ├── server/          # Full Fastify node
│   └── cli/             # Operations and debug tool
├── packages/
│   ├── protocol/        # .proto schemas + generated TS + Zod validators
│   ├── crypto/          # Key generation, signing, AES-256-GCM, challenge-response
│   └── core/            # Abstractions over hypercore/autobase (future)
├── firmware/
│   └── esp32-sample/    # Reference implementation (production firmware is in SafraSense repo)
└── docs/                # This site
```

## Design decisions

**Do not introduce without discussion:**
- NestJS — too heavy
- Express — obsolete vs Fastify
- ORMs — better-sqlite3 directly
- Redis — not justified at this stage
- Docker in dev — runs local
- Kafka — not necessary

## SQLite as derived cache

SQLite is never the source of truth. It is a **read cache** derived from Hypercore events. If corrupted, delete and rebuild from the core.

This means:
- The schema can evolve without data loss (rebuild from core)
- Fast aggregated queries (fixed columns with `REAL` for sensor data)
- No ORM needed — direct SQL with typed results
- New sensor types require adding three columns (`_plain`, `_cipher`, `_nonce`) per field
