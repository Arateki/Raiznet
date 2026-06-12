# Local API

The local endpoint listens on `127.0.0.1:LOCAL_PORT` (default `3001`). It runs in the same process as the public endpoint but is bound to loopback only — it is meant for the owner's app, CLI, and tooling on the same machine (or reached through a tunnel such as Tailscale or a VPN).

::: danger No authentication yet
The local endpoint currently has **no authentication**. Isolation relies entirely on the `127.0.0.1` bind. Do not port-forward or reverse-proxy this port to the internet. Owner challenge-response authentication is planned — see below.
:::

## Base URL

```
http://127.0.0.1:3001
```

## Routes

The local endpoint exposes the **same routes** as the [Public API](/reference/public-api) with one structural difference: which database they touch.

| Route | Public endpoint | Local endpoint |
|---|---|---|
| `GET /health` | — | identical |
| `POST /v1/devices` | writes `raiznet_public.db` | writes `raiznet_private.db` |
| `GET /v1/devices`, `GET /v1/devices/:id` | reads `raiznet_public.db` | reads `raiznet_private.db` |
| `GET /v1/devices/:id/telemetry` | reads `raiznet_public.db` | reads `raiznet_private.db` |
| `POST /v1/telemetry` | ingest destination `public` | ingest destination `local` |

This asymmetry is deliberate: registering a device on the local endpoint creates it as a **local device** in the private database, invisible to the public side.

### Ingestion destination

`POST /v1/telemetry` on the local endpoint stores readings in `raiznet_private.db` when the device's `publishTo` is `0` (local_only) or `2` (both). A device with `publishTo: 1` (public-only) posting here is validated and accepted, but nothing is stored.

A `both` device sends **separate requests** to each endpoint — one to the public endpoint, one to the local endpoint — each assembled according to the field dispositions for that destination.

## Remote access

To read local data from outside the LAN, use a private overlay network (Tailscale, WireGuard) to reach `127.0.0.1:3001` on the server — or mark fields as `encrypted` for the public network and decrypt them in your app (see [Privacy Model](/protocol/privacy)).

---

## Planned: owner authentication

Challenge-response authentication with the owner's User key is designed but **not implemented yet**:

1. Client calls `GET /v1/auth/challenge` → receives 32 random bytes.
2. Client signs the challenge with the User secret key.
3. Client sends the signature to `POST /v1/auth/verify` → receives a session token.

## Planned: combined view

The local endpoint will eventually merge `raiznet_public.db` + `raiznet_private.db` by `(device_pubkey, seq)` so the owner sees one continuous series per device, with encrypted fields returned as `cipher` + `nonce` for local decryption. Today each endpoint returns only its own database.
