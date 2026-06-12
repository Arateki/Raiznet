# Running a Node

## Requirements

- Node.js 24 LTS
- pnpm 9+

## Installation

```bash
git clone https://github.com/arateki/raiznet
cd raiznet
pnpm install
pnpm build
```

## Configuration

Copy the example environment file and adjust as needed:

```bash
cp apps/server/.env.example apps/server/.env
```

| Variable | Default | Description |
|---|---|---|
| `PUBLIC_PORT` | `3000` | Port for the public endpoint (bind `0.0.0.0`) |
| `LOCAL_PORT` | `3001` | Port for the local authenticated endpoint (bind `127.0.0.1`) |
| `DATA_DIR` | `./data` | Directory for SQLite databases and server identity |
| `LOG_LEVEL` | `info` | Pino log level (`trace`, `debug`, `info`, `warn`, `error`) |
| `NODE_ENV` | `development` | Environment |

## First run

```bash
cd apps/server
node dist/index.js
```

On first run, the server:
1. Generates an Ed25519 keypair from a new BIP-39 seed phrase
2. Writes the seed to `DATA_DIR/identity.mnemonic` (permissions `0600`)
3. Creates `raiznet_public.db` and `raiznet_private.db` in `DATA_DIR`
4. Starts listening on both ports
5. Logs the server's public key

```
{"pubkey":"641ffb278dc6...","msg":"raiznet server started"}
```

::: warning Back up your seed phrase
The file `DATA_DIR/identity.mnemonic` contains the 12-word seed phrase that controls your server's identity. Back it up. If lost, your node's identity (its pubkey) is gone — and with it, once networks ship, the ability to sign NetworkManifests, filters, and catalogs.
:::

## Health check

```bash
curl http://localhost:3000/health
# {"status":"ok","ts":1776819068644}
```

## Exposing the node

The public endpoint (`:3000`) is safe to expose — it serves public data only. The local endpoint (`:3001`) has **no authentication yet**: it binds to `127.0.0.1` and must stay unreachable from outside. Use Tailscale or a VPN for remote access. See [Local API](/reference/local-api).

## Development mode (watch)

```bash
pnpm --filter @raiznet/server dev
```

Uses `node --watch` to restart on file changes. Requires a built `dist/` first.
