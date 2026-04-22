# ADR 002 — SQLite as derived read cache

**Status:** Accepted  
**Date:** 2026-04

## Context

Raiznet's source of truth is the Hypercore — an append-only, cryptographically signed log. However, serving fast API queries (time-range reads, aggregations, filtering by H3 cell) directly from a Hypercore is impractical: Hypercores are designed for sequential append and replication, not random-access indexed queries.

A secondary index layer is needed.

## Decision

**SQLite** (via `better-sqlite3`) is used as a derived read cache. It is never the source of truth. If the SQLite database is corrupted or deleted, it can be fully rebuilt by replaying the Hypercore from block 0.

Two separate databases are maintained:

| Database | Fed by | Access |
|---|---|---|
| `raiznet_public.db` | Hypercore replication | Public endpoint + local endpoint |
| `raiznet_private.db` | Local ingest only | Local endpoint only |

## Rationale

- **Query performance**: fixed columns with `REAL` type allow standard SQL aggregations (AVG, MIN, MAX, GROUP BY) with indexes. No JSON parsing at query time.
- **Schema simplicity**: no ORM — direct SQL with typed results via `better-sqlite3`'s synchronous API.
- **Rebuild guarantee**: because SQLite is derived from the Hypercore, schema evolution does not mean data loss. Drop the file, replay, done.
- **Security by isolation**: the public endpoint's Fastify instance holds a connection only to `raiznet_public.db`. A query on the public endpoint cannot return private data because the database connection object is simply not available to it — isolation is at the connection level, not the query level.
- **`better-sqlite3` synchronous API**: fits naturally into Fastify's async route handlers without requiring a separate thread pool or callback indirection.

## Trade-offs

- Adding a new sensor type requires a schema migration (three new columns: `_plain`, `_cipher`, `_nonce`). This is the accepted cost for fast aggregated queries.
- The wide-table design (one row per reading, all sensor columns in the same row) uses more disk space than a narrow key-value table, but enables indexed range queries without joins.
- Phase 1 writes directly to SQLite. Phase 2 adds the Hypercore → Indexer → SQLite pipeline. The API layer always reads from SQLite in both phases.

## Consequences

- `apps/server/src/storage/public-db.ts` and `private-db.ts` own schema creation (`CREATE TABLE IF NOT EXISTS`).
- No migration framework in Phase 1 — tables are created on first boot, schema is stable.
- `apps/server/src/storage/indexer.ts` (Phase 2) will be the only writer to `raiznet_public.db` once Hypercore replication is active.
- `raiznet_private.db` is always written directly by the local ingest path — it is never replicated via Hyperswarm.
