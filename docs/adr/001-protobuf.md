# ADR 001 — Protobuf as wire format

**Status:** Accepted — implementation deferred  
**Date:** 2026-04

::: info Update (2026-06)
The wire format in production is **JSON** with a [signed raw string](/protocol/telemetry#the-signed-raw-string); the `.proto` schemas exist but code generation is not active. Protobuf remains the target canonical format and will land together with the event log — JSON stays supported for the current firmware generation.
:::

## Context

Raiznet needs a serialization format that works on both ESP32 firmware (C++, memory-constrained) and Node.js servers (TypeScript). The format must be compact, schema-enforced, and maintainable across two very different runtimes.

Candidates evaluated:

| Format | Node.js | ESP32 | Schema | Binary |
|---|---|---|---|---|
| JSON | Native | ArduinoJson | No | No |
| MessagePack | `msgpackr` | `msgpack-c` | No | Yes |
| CBOR | `cbor-x` | `tinycbor` | No | Yes |
| Protobuf | `@bufbuild/protobuf` | `nanopb` | Yes | Yes |

## Decision

**Protobuf (Protocol Buffers v3)** with:
- `@bufbuild/protobuf` + `@bufbuild/protoc-gen-es` on Node.js
- `nanopb` on ESP32

`.proto` schemas live in `packages/protocol/proto/` and are shared between both runtimes. TypeScript code is generated at build time via `protoc-gen-es`.

## Rationale

- **Shared schema**: one `.proto` file is the single source of truth. Changes to the schema are reflected in generated code on both sides — no hand-maintained structs.
- **Binary compactness**: smaller packets than JSON, important for battery-powered ESP32s sending over Wi-Fi.
- **Type safety**: generated TypeScript types are precise and eliminate the need for manual parsing.
- **nanopb maturity**: well-established Protobuf implementation for embedded C, no dynamic memory allocation, works within ESP32 constraints.
- **Field number stability**: Protobuf's forward/backward compatibility guarantees allow schema evolution without breaking existing nodes running older firmware.

## Trade-offs

- Protobuf is not human-readable. Debugging raw packets requires a decoder.
- nanopb requires defining maximum sizes for repeated and string fields at compile time.
- Adding a new sensor type requires updating the `.proto` file, regenerating code, and deploying both server and firmware updates.

## Consequences

- The canonical binary encoding (ESP32 → server, node → event log) will use Protobuf.
- The HTTP API keeps JSON for browser, CLI, and current-firmware compatibility.
- The `packages/protocol` package owns all `.proto` files and (future) generated code. No other package defines its own wire format.
