---
description: Cómo instalar, configurar y ejecutar un nodo Raiznet con Node.js — primera ejecución, identidad BIP-39, health check y cómo exponer el nodo con seguridad.
---

# Ejecutar un nodo

## Requisitos

- Node.js 24 LTS
- pnpm 9+

## Instalación

```bash
git clone https://github.com/arateki/raiznet
cd raiznet
pnpm install
pnpm build
```

## Configuración

Copia el archivo de entorno de ejemplo y ajústalo según necesites:

```bash
cp apps/server/.env.example apps/server/.env
```

| Variable | Por defecto | Descripción |
|---|---|---|
| `PUBLIC_PORT` | `3000` | Puerto del endpoint público (bind `0.0.0.0`) |
| `LOCAL_PORT` | `3001` | Puerto del endpoint local autenticado (bind `127.0.0.1`) |
| `DATA_DIR` | `./data` | Directorio de las bases SQLite y de la identidad del servidor |
| `LOG_LEVEL` | `info` | Nivel de log de Pino (`trace`, `debug`, `info`, `warn`, `error`) |
| `NODE_ENV` | `development` | Entorno |

## Primera ejecución

```bash
cd apps/server
node dist/index.js
```

En la primera ejecución, el servidor:
1. Genera un par de claves Ed25519 a partir de una nueva seed phrase BIP-39
2. Graba la seed en `DATA_DIR/identity.mnemonic` (permisos `0600`)
3. Crea `raiznet_public.db` y `raiznet_private.db` en `DATA_DIR`
4. Empieza a escuchar en los dos puertos
5. Registra en el log la clave pública del servidor

```
{"pubkey":"641ffb278dc6...","msg":"raiznet server started"}
```

::: warning Haz copia de seguridad de tu seed phrase
El archivo `DATA_DIR/identity.mnemonic` contiene la seed phrase de 12 palabras que controla la identidad de tu servidor. Haz una copia. Si se pierde, la identidad de tu nodo (su pubkey) desaparece — y con ella, cuando entren las redes, la capacidad de firmar NetworkManifests, filtros y catálogos.
:::

## Health check

```bash
curl http://localhost:3000/health
# {"status":"ok","ts":1776819068644}
```

## Exponer el nodo

El endpoint público (`:3000`) es seguro de exponer — solo sirve datos públicos. El endpoint local (`:3001`) **aún no tiene autenticación**: hace bind en `127.0.0.1` y debe permanecer inalcanzable desde fuera. Usa Tailscale o una VPN para el acceso remoto. Consulta [API local](/es/reference/local-api).

## Modo de desarrollo (watch)

```bash
pnpm --filter @raiznet/server dev
```

Usa `node --watch` para reiniciar en cada cambio de archivo. Requiere un `dist/` ya compilado.
