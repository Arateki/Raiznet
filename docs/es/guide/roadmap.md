---
description: El mapa honesto de Raiznet — qué está implementado hoy, qué está en diseño y qué es futuro, desde la ingesta de telemetría hasta la replicación entre nodos.
---

# Hoja de ruta

Raiznet es pre-1.0. Esta página es el mapa honesto de lo que existe frente a lo que está diseñado — todas las demás páginas de estos docs marcan las funciones en etapa de diseño según corresponda.

## Implementado hoy

- **Ingesta de telemetría firmada** — firma Ed25519 sobre una [cadena raw](/es/protocol/telemetry#raw-string) determinista, verificada contra la clave registrada del dispositivo; ingesta por lotes idempotente.
- **Registro de dispositivos** — `POST /v1/devices` con registro perezoso (lazy) hecho por el firmware.
- **Privacidad por campo** — disposiciones `plain` / `encrypted` / `omit` con overrides por destino, aplicadas en la ingesta ([Modelo de privacidad](/es/protocol/privacy)).
- **Endpoints duales, bases duales** — público (`:3000`, `raiznet_public.db`) y local (`:3001`, `raiznet_private.db`) en un proceso, aislados a nivel de base.
- **Identidad del nodo** — mnemónico BIP-39 en `DATA_DIR/identity.mnemonic`, par de claves Ed25519 derivado de forma determinista.
- **Firmware de referencia** — aprovisionamiento por portal cautivo en el ESP32, identidad del dueño BIP-39, gestión de `seq` consciente del desgaste de la flash, retransmisión hasta confirmación.

## En diseño

Estos están especificados (en esta documentación y en ADRs) pero no implementados. Los detalles pueden cambiar:

- **Nodo en Rust (`raiznetd`)** — reimplementación del nodo con paridad de comportamiento, como un único binario estático, apuntando a placas ARM muy pequeñas sin dependencias de runtime.
- **Log de eventos firmado** — log de solo anexado, encadenado por hash, por nodo, como fuente de verdad, con SQLite reconstruido a partir de él como índice derivado ([ADR-002](/es/adr/002-sqlite-cache)).
- **Replicación nodo a nodo** ([ADR-004](/es/adr/004-raiznet-native-replication)) — sync v1: pull HTTP entre pares configurados (LAN, VPN, IP pública); sync v2: transporte de marcado-por-pubkey construido sobre una base P2P en Rust existente (iroh como candidato principal, validado en enlaces reales de 4G/CGNAT rural antes de adoptarlo), con relays operados por la comunidad — nunca un gateway privilegiado.
- **Redes, filtros y catálogos** — topics, `NetworkManifest`, filtros de MAC componibles, `CropCatalog` ([Redes y filtros](/es/protocol/networks)).
- **Autenticación del endpoint local** — challenge-response del dueño con la clave de Usuario ([API local](/es/reference/local-api)).
- **Vista combinada del dueño** — fusión de las lecturas pública + privada por `(device_pubkey, seq)` en el endpoint local.
- **Codificación canónica en Protobuf** — formato de cable binario a partir de los esquemas en [Esquemas Protobuf](/es/reference/proto-schemas); el JSON permanece por compatibilidad ([ADR-001](/es/adr/001-protobuf)).
- **Endurecimiento de la ingesta** — verificación cruzada estricta entre la cadena raw firmada y los campos de conveniencia del JSON.
- **Malla de dispositivos ESP-NOW** — sensores a batería haciendo relay a través de vecinos alimentados por la red eléctrica.

## Futuro

- **DeviceClaim / DeviceTransfer** — eventos de la cadena de propiedad ([Ciclo de vida del dispositivo](/es/protocol/device-lifecycle)).
- **App de escritorio (Tauri)** empaquetando un nodo completo, y una app móvil.
- **Capa de inteligencia** — servidor MCP sobre el endpoint local, agregaciones regionales, calibración colectiva de cultivos ([Inteligencia colectiva](/es/guide/intelligence)).

## Política de compatibilidad

Los contratos documentados en las páginas [API pública](/es/reference/public-api) y [Telemetría](/es/protocol/telemetry) se tratan como congelados para la generación actual de firmware: los cambios que romperían un dispositivo en campo (códigos de estado, semántica de duplicados, la gramática de la cadena raw) solo se hacen detrás de un versionado explícito.
