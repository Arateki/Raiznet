# ADR 002 — SQLite as derived read cache

**Status:** Accepted  
**Date:** 2026-04

::: info Update (2026-06)
The signed event log is not implemented yet — today ingest writes directly to SQLite (the "Phase 1" path described under Trade-offs). The log design has also moved away from Hypercore toward a Raiznet-native append-only event log ([ADR-004](/adr/004-raiznet-native-replication)); the SQLite-as-derived-index principle is unchanged.
:::

## Context

Raiznet's intended source of truth is an append-only, cryptographically signed event log. However, serving fast API queries (time-range reads, aggregations, filtering by H3 cell) directly from such a log is impractical: it is designed for sequential append and replication, not random-access indexed queries.

A secondary index layer is needed.

## Decision

**SQLite** (via `better-sqlite3`) is used as a derived read cache. It is not meant to be the long-term source of truth. Once the event log exists, a corrupted or deleted SQLite database can be fully rebuilt by replaying the log from the first event.

Two separate databases are maintained:

| Database | Fed by | Access |
|---|---|---|
| `raiznet_public.db` | Public ingest (event-log replication planned) | Public endpoint |
| `raiznet_private.db` | Local ingest only | Local endpoint only |

## Rationale

- **Query performance**: fixed columns with `REAL` type allow standard SQL aggregations (AVG, MIN, MAX, GROUP BY) with indexes. No JSON parsing at query time.
- **Schema simplicity**: no ORM — direct SQL with typed results via `better-sqlite3`'s synchronous API.
- **Rebuild guarantee** (once the event log ships): because SQLite is derived from the log, schema evolution does not mean data loss. Drop the file, replay, done.
- **Security by isolation**: the public endpoint's Fastify instance holds a connection only to `raiznet_public.db`. A query on the public endpoint cannot return private data because the database connection object is simply not available to it — isolation is at the connection level, not the query level.
- **`better-sqlite3` synchronous API**: fits naturally into Fastify's async route handlers without requiring a separate thread pool or callback indirection.

## Trade-offs

- Adding a new sensor type requires a schema migration (three new columns: `_plain`, `_cipher`, `_nonce`). This is the accepted cost for fast aggregated queries.
- The wide-table design (one row per reading, all sensor columns in the same row) uses more disk space than a narrow key-value table, but enables indexed range queries without joins.
- Phase 1 writes directly to SQLite. Phase 2 adds the event log → indexer → SQLite pipeline. The API layer always reads from SQLite in both phases.

## Consequences

- `apps/server/src/storage/public-db.ts` and `private-db.ts` own schema creation (`CREATE TABLE IF NOT EXISTS`).
- No migration framework in Phase 1 — tables are created on first boot, schema is stable.
- An indexer (Phase 2) will be the only writer to `raiznet_public.db` once event-log replication is active.
- `raiznet_private.db` is always written directly by the local ingest path — it is never replicated.
