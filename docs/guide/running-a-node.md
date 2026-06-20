---
description: Como instalar, configurar e rodar um nó Raiznet com Node.js — primeira execução, identidade BIP-39, health check e como expor o nó com segurança.
---

# Rodando um nó

## Requisitos

- Node.js 24 LTS
- pnpm 9+

## Instalação

```bash
git clone https://github.com/arateki/raiznet
cd raiznet
pnpm install
pnpm build
```

## Configuração

Copie o arquivo de ambiente de exemplo e ajuste conforme necessário:

```bash
cp apps/server/.env.example apps/server/.env
```

| Variável | Padrão | Descrição |
|---|---|---|
| `PUBLIC_PORT` | `3000` | Porta do endpoint público (bind `0.0.0.0`) |
| `LOCAL_PORT` | `3001` | Porta do endpoint local autenticado (bind `127.0.0.1`) |
| `DATA_DIR` | `./data` | Diretório dos bancos SQLite e da identidade do servidor |
| `LOG_LEVEL` | `info` | Nível de log do Pino (`trace`, `debug`, `info`, `warn`, `error`) |
| `NODE_ENV` | `development` | Ambiente |

## Primeira execução

```bash
cd apps/server
node dist/index.js
```

Na primeira execução, o servidor:
1. Gera um par de chaves Ed25519 a partir de uma nova seed phrase BIP-39
2. Grava a seed em `DATA_DIR/identity.mnemonic` (permissões `0600`)
3. Cria `raiznet_public.db` e `raiznet_private.db` em `DATA_DIR`
4. Começa a escutar nas duas portas
5. Registra no log a chave pública do servidor

```
{"pubkey":"641ffb278dc6...","msg":"raiznet server started"}
```

::: warning Faça backup da sua seed phrase
O arquivo `DATA_DIR/identity.mnemonic` contém a seed phrase de 12 palavras que controla a identidade do seu servidor. Faça backup. Se perdida, a identidade do seu nó (sua pubkey) se vai — e com ela, quando as redes entrarem, a capacidade de assinar NetworkManifests, filtros e catálogos.
:::

## Health check

```bash
curl http://localhost:3000/health
# {"status":"ok","ts":1776819068644}
```

## Expondo o nó

O endpoint público (`:3000`) é seguro de expor — ele serve apenas dados públicos. O endpoint local (`:3001`) **ainda não tem autenticação**: ele faz bind em `127.0.0.1` e deve permanecer inalcançável de fora. Use Tailscale ou uma VPN para acesso remoto. Veja [API local](/reference/local-api).

## Modo de desenvolvimento (watch)

```bash
pnpm --filter @raiznet/server dev
```

Usa `node --watch` para reiniciar a cada mudança de arquivo. Requer um `dist/` já compilado.
