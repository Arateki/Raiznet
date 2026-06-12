# ADR 003 — Per-field privacy model with map-based policy

**Status:** Accepted  
**Date:** 2026-04

## Context

Raiznet devices may have sensors whose readings are sensitive (e.g. crop health data a grower doesn't want competitors to see) while other readings from the same device are intentionally public (e.g. ambient temperature for regional maps).

Two requirements drove the design:
1. Privacy must be configurable at the **field level**, not just per-device.
2. The policy must support **per-destination overrides** without requiring the user to configure two separate logical devices.

## Decision

Each sensor field has a `FieldPolicy`:

```protobuf
message FieldPolicy {
  Disposition              default_disposition = 1;
  map<string, Disposition> per_destination     = 2;
}
```

`default_disposition` applies to any destination not explicitly listed in `per_destination`. The map key is either a server pubkey (hex) or a network topic string.

Three dispositions:

| Disposition | Effect |
|---|---|
| `OMIT` | Field is not sent to this destination |
| `PLAIN` | Field travels in clear |
| `ENCRYPTED` | Field is AES-256-GCM encrypted with the device's symmetric key |

## Rationale

**Single device, multiple policies.** The map approach avoids the need for "two logical devices" as a workaround. One device can be `PLAIN` on the local server, `ENCRYPTED` on the public network, and `OMIT` to a specific third-party server — all from one configuration.

**UI layering.** The map model supports three levels of user-facing granularity, all backed by the same data structure:
- *Same for all*: `default_disposition` set, map empty.
- *Public vs local*: two entries grouping by destination class.
- *Per destination (advanced)*: one entry per server pubkey or topic.

**`ENCRYPTED` for remote owner access.** The `ENCRYPTED` disposition solves a specific case: the owner wants to follow their sensor from outside the LAN without exposing values to the public network. The cipher blob travels through the public network normally; peers store it but cannot read it. The owner's app decrypts locally using the device's symmetric key (derived from the BIP-39 seed).

**Security by isolation, not by query.** The two-database architecture (`raiznet_public.db` / `raiznet_private.db`) enforces isolation at the connection level. The `OMIT` / `PLAIN` / `ENCRYPTED` model is the policy layer; the database separation is the enforcement layer. Both are required.

**Replication is always total.** Filters (MAC curation lists) never affect what is stored — they control what appears in API responses. This keeps the network robust and avoids fragmentation.

## Trade-offs

- The `per_destination` map grows with the number of destinations configured. In practice, most users will use the default (map empty) or at most two entries.
- Changing a policy does not affect already-published data. Peers who have downloaded plain readings retain them — there is no "unpublish" mechanism on an append-only log.
- `ENCRYPTED` fields are opaque to aggregations. Network-level metrics (averages by H3 cell, regional charts) can only use `PLAIN` fields. This is a deliberate privacy guarantee, not a bug.

## Consequences

- `packages/protocol/proto/device.proto` defines `FieldPolicy`, `Disposition`, and `PrivacyPolicy`.
- `apps/server/src/domain/telemetry.ts` resolves the effective disposition per field: `per_destination[serverPubkeyHex] ?? default_disposition` (topic-level overrides land with networks).
- `packages/crypto/src/symmetric.ts` owns AES-256-GCM field encryption and decryption.
- The owner's app is responsible for maintaining the device's symmetric keyring (`{ version → key }`) and decrypting `ENCRYPTED` fields received from any endpoint.
