# ADR 004 — Raiznet-native replication instead of Hypercore

**Status:** Accepted  
**Date:** 2026-06

## Context

The original Raiznet design adopted the Holepunch stack as its replication foundation: Hypercore (append-only signed logs), Hyperswarm (DHT discovery and hole punching), Autobase (multi-writer), Hyperdrive (content distribution). Three facts changed the picture:

1. **It was never integrated.** The Phase 1 node is HTTP + SQLite; no Hypercore code exists in the project.
2. **The node is moving to Rust**, targeting small ARM hardware (static binary, ~250 MB RAM budget). There is no maintained, protocol-complete Rust implementation of Hypercore 10/11, and no usable Rust implementation of the Hyperswarm DHT at all. Tracking a moving, JS-defined protocol from a second language would consume the project for no product benefit.
3. **No Raiznet node needs to interoperate with the JS Hypercore ecosystem.** The network is made of Raiznet nodes; compatibility with Holepunch peers has no use case.

What Raiznet actually requires is three properties, not a specific stack: (a) signed, append-only, verifiable data; (b) peer discovery; (c) connectivity through NAT/CGNAT **without a mandatory central gateway**.

## Decision

**Part 1 — Data: Raiznet-native signed event log.**
The source of truth becomes an append-only event log per author, hash-chained, with every event signed (Ed25519). SQLite remains the derived index ([ADR-002](/adr/002-sqlite-cache)); the canonical binary encoding remains Protobuf when it lands ([ADR-001](/adr/001-protobuf)). Hypercore is not used, ported, or emulated.

**Part 2 — Connectivity: layered, built on an existing Rust foundation.**

- **Sync v1 — configured peers.** HTTP(S) pull between known peers (`heads` summary + fetch by `(author, seq)` ranges). Covers LAN, VPN/Tailscale, and public-IP nodes with zero new dependencies. This ships first.
- **Sync v2 — dial-by-pubkey transport.** Built on an existing P2P foundation rather than written from scratch. **Primary candidate: [iroh](https://github.com/n0-computer/iroh)** — Ed25519 node IDs (matching Raiznet's identity model), QUIC connections, built-in hole punching with **self-hostable relays**, and topic-based gossip. **Fallback candidate: rust-libp2p** (Kademlia, mDNS, GossipSub, AutoNAT/DCUtR/Relay v2). Adoption is gated by a **field spike**: two nodes establishing connectivity over real rural 4G/CGNAT links, measuring direct-connection vs relay rates.

## Rationale

- **Own the data format, inherit the networking.** The event log is where Raiznet's sovereignty and research-grade guarantees live — it must be ours, and it is small enough to specify and test with a fixture corpus. NAT traversal, connection migration, and relay coordination are the opposite: maximal complexity, zero differentiation, and already solved by maintained Rust projects.
- **Relays are not gateways.** Hole punching is never 100% — under symmetric CGNAT (common on rural 4G), every system (Hyperswarm included) falls back to relays. In this design any reachable community node can act as a relay; traffic does not depend on Arateki-operated infrastructure. The "no mandatory gateway" principle is preserved — the same role DHT nodes play in Hyperswarm.
- **Local-first is unaffected.** A `local_only` node never touches discovery or relays; an ESP32 plus a laptop on LAN remains a valid Raiznet.

## Trade-offs

- We lose Hyperswarm's ready-made global DHT; discovery starts simpler (configured peers, mDNS, then the v2 transport's discovery).
- No interoperability with JS Hypercore peers (no known use case).
- iroh is pre-1.0 and its API still moves; the risk is contained behind the `raiznet-sync` crate boundary, with rust-libp2p as the fallback. The final v2 commitment happens only after the CGNAT field spike.

## Consequences

- `CLAUDE.md`, `README.md`, and these docs no longer describe the Holepunch stack as the foundation; conceptual terms that survive (topics, filters, catalogs, total replication, append-only semantics) are transport-independent and unchanged.
- The Rust migration plan implements this in phases: event log (Phase 7), sync v1 + v2 (Phase 8), Protobuf canonical encoding (Phase 9) — each with its own detailed plan before execution.
- `Material` content distribution (formerly Hyperdrive) will be specified later on top of the same event-log + transfer primitives.
