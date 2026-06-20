---
description: Las tres capas de Raiznet — sensores ESP32 en el borde, nodos servidores en la malla y clientes de visualización — y qué corre hoy frente a lo que está en diseño.
---

# Arquitectura

Raiznet está organizada en tres capas. Esta página distingue lo que corre **hoy** de lo que está **en diseño** — consulta la [Hoja de ruta](/es/guide/roadmap) para el panorama completo.

## Capa de borde — sensores ESP32

Todos los dispositivos ejecutan el mismo firmware base. El modo se determina por configuración, no por hardware:

| Modo | Energía | Comportamiento |
|---|---|---|
| `sensor_mains` | Toma de corriente | Siempre encendido, mantiene la Wi-Fi activa; futuro relay ESP-NOW para vecinos |
| `sensor_battery` | Batería | Duerme la mayor parte del tiempo, despierta según horario |
| `gateway` | Toma de corriente | Solo relay — hace de puente de dispositivos ESP-NOW hacia la Wi-Fi (planificado) |

Todo dispositivo tiene el mismo modelo de identidad: un par de claves Ed25519 nacido en el aprovisionamiento (TRNG del hardware), guardado en la flash, usado para firmar cada paquete de telemetría. El firmware de referencia también genera la identidad del dueño a partir de un mnemónico BIP-39 en su portal cautivo — consulta [Ciclo de vida del dispositivo](/es/protocol/device-lifecycle).

## Capa de malla — nodos servidores

Cada servidor es un par (peer). No existe un "servidor principal". Lo que un nodo hace **hoy**:

- Recibe telemetría firmada por HTTP (`POST /v1/telemetry`) y valida cada firma
- Aplica la [política de privacidad](/es/protocol/privacy) por campo en la ingesta
- Almacena las lecturas en **dos bases SQLite locales** (pública / privada)
- Expone la API HTTP en dos puertos: uno público, uno local

**En diseño** ([ADR-004](/es/adr/004-raiznet-native-replication)): los nodos pasarán a persistir los datos públicos como un log de eventos firmado y de solo anexado, replicándolo punto a punto con otros nodos de la misma [red](/es/protocol/networks) — primero entre pares configurados por HTTP, luego por un transporte de marcado-por-pubkey con relays operados por la comunidad. La replicación aún no está implementada — hoy, los nodos son independientes.

Un servidor puede correr donde sea que corra Node.js: VPS, Raspberry Pi, Mini PC, Android vía Termux. Una reimplementación del nodo en Rust (`raiznetd`) está en marcha para apuntar a placas ARM muy pequeñas con un binario estático — consulta la [Hoja de ruta](/es/guide/roadmap).

### Endpoints duales en un proceso

Un único proceso de servidor expone dos interfaces HTTP:

| Endpoint | Puerto por defecto | Bind | Rutas de devices acceden a | Auth |
|---|---|---|---|---|
| Público | `:3000` | `0.0.0.0` | `raiznet_public.db` | Ninguna (solo datos públicos) |
| Local | `:3001` | `127.0.0.1` | `raiznet_private.db` | Aún ninguna — **planificado:** challenge-response del dueño |

::: warning
Hasta que entre la autenticación del dueño, la única protección del endpoint local es su bind de loopback. Accede a él remotamente vía Tailscale/VPN — nunca lo expongas directamente.
:::

### Dos bases de datos

| Base | Alimentada por | Contiene | Servida por |
|---|---|---|---|
| `raiznet_public.db` | Ingesta pública (replicación planificada) | Dispositivos y lecturas publicables en redes | Endpoint público |
| `raiznet_private.db` | Solo ingesta local | Dispositivos `local_only` + campos mantenidos fuera del lado público | Solo endpoint local |

**Seguridad por aislamiento:** una consulta en el endpoint público no puede devolver datos privados porque la conexión a la base privada simplemente no está disponible para ella. El aislamiento se impone a nivel de base de datos, no en la capa de API.

## Capa de cliente

| Cliente | Descripción | Estado |
|---|---|---|
| CLI | Herramienta de operación y depuración | En el repositorio |
| Dashboard web | Interfaz de visualización | En el repositorio |
| Gateway público | Un nodo expuesto en internet — solo otro par, sin datos privilegiados | Planificado |
| App de escritorio (Tauri) | Empaqueta un nodo completo + UI, funciona offline | Fase futura |
| App móvil | React Native o Capacitor | Fase futura |
