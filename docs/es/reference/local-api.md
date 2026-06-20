---
description: La API local de Raiznet en 127.0.0.1 — las mismas rutas que la API pública pero sobre la base privada, acceso remoto vía túnel y autenticación del dueño planificada.
---

# API local

El endpoint local escucha en `127.0.0.1:LOCAL_PORT` (por defecto `3001`). Corre en el mismo proceso que el endpoint público, pero hace bind solo en loopback — está destinado a la app del dueño, la CLI y las herramientas en la misma máquina (o alcanzado por un túnel como Tailscale o una VPN).

::: danger Aún sin autenticación
El endpoint local actualmente **no tiene autenticación**. El aislamiento depende enteramente del bind en `127.0.0.1`. No hagas port-forward ni proxy inverso de este puerto hacia internet. La autenticación por challenge-response del dueño está planificada — consulta abajo.
:::

## URL base

```
http://127.0.0.1:3001
```

## Rutas

El endpoint local expone las **mismas rutas** que la [API pública](/es/reference/public-api), con una diferencia estructural: a qué base acceden.

| Ruta | Endpoint público | Endpoint local |
|---|---|---|
| `GET /health` | — | idéntica |
| `POST /v1/devices` | escribe `raiznet_public.db` | escribe `raiznet_private.db` |
| `GET /v1/devices`, `GET /v1/devices/:id` | lee `raiznet_public.db` | lee `raiznet_private.db` |
| `GET /v1/devices/:id/telemetry` | lee `raiznet_public.db` | lee `raiznet_private.db` |
| `POST /v1/telemetry` | destino de ingesta `public` | destino de ingesta `local` |

Esta asimetría es deliberada: registrar un dispositivo en el endpoint local lo crea como un **dispositivo local** en la base privada, invisible para el lado público.

### Destino de la ingesta

`POST /v1/telemetry` en el endpoint local almacena las lecturas en `raiznet_private.db` cuando el `publishTo` del dispositivo es `0` (local_only) o `2` (both). Un dispositivo con `publishTo: 1` (solo público) que postee aquí es validado y aceptado, pero no se almacena nada.

Un dispositivo `both` envía **peticiones separadas** a cada endpoint — una al público, una al local — cada una armada según las disposiciones de campo de ese destino.

## Acceso remoto

Para leer datos locales desde fuera de la LAN, usa una red overlay privada (Tailscale, WireGuard) para alcanzar `127.0.0.1:3001` en el servidor — o marca los campos como `encrypted` para la red pública y descífralos en tu app (consulta [Modelo de privacidad](/es/protocol/privacy)).

---

## Planificado: autenticación del dueño

La autenticación por challenge-response con la clave de Usuario del dueño está diseñada pero **aún no implementada**:

1. El cliente llama a `GET /v1/auth/challenge` → recibe 32 bytes aleatorios.
2. El cliente firma el desafío con la clave secreta de Usuario.
3. El cliente envía la firma a `POST /v1/auth/verify` → recibe un token de sesión.

## Planificado: vista combinada

El endpoint local eventualmente fusionará `raiznet_public.db` + `raiznet_private.db` por `(device_pubkey, seq)`, para que el dueño vea una serie continua por dispositivo, con los campos cifrados devueltos como `cipher` + `nonce` para descifrado local. Hoy, cada endpoint devuelve solo su propia base.
