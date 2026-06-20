---
description: ADR 004 — replicación nativa de Raiznet en lugar de Hypercore — log de eventos firmado propio y conectividad en capas (sync v1 HTTP, sync v2 iroh).
---

# ADR 004 — Replicación nativa de Raiznet en lugar de Hypercore

**Estado:** Aceptado  
**Fecha:** 2026-06

## Contexto

El diseño original de Raiznet adoptaba el stack Holepunch como base de replicación: Hypercore (logs firmados de solo anexado), Hyperswarm (descubrimiento por DHT y hole punching), Autobase (multiescritor), Hyperdrive (distribución de contenido). Tres hechos cambiaron el panorama:

1. **Nunca se integró.** El nodo de la Fase 1 es HTTP + SQLite; no existe código Hypercore en el proyecto.
2. **El nodo está migrando a Rust**, apuntando a hardware ARM pequeño (binario estático, presupuesto de ~250 MB de RAM). No hay implementación Rust mantenida y protocol-complete de Hypercore 10/11, y no hay implementación Rust utilizable del DHT de Hyperswarm. Rastrear un protocolo móvil, definido en JS, desde un segundo lenguaje consumiría el proyecto sin beneficio de producto.
3. **Ningún nodo Raiznet necesita interoperar con el ecosistema JS de Hypercore.** La red está hecha de nodos Raiznet; la compatibilidad con pares Holepunch no tiene caso de uso.

Lo que Raiznet de hecho exige son tres propiedades, no un stack específico: (a) datos firmados, de solo anexado y verificables; (b) descubrimiento de pares; (c) conectividad a través de NAT/CGNAT **sin un gateway central obligatorio**.

## Decisión

**Parte 1 — Datos: log de eventos firmado nativo de Raiznet.**
La fuente de verdad pasa a ser un log de eventos de solo anexado por autor, encadenado por hash, con cada evento firmado (Ed25519). SQLite permanece como índice derivado ([ADR-002](/es/adr/002-sqlite-cache)); la codificación binaria canónica permanece Protobuf cuando entre ([ADR-001](/es/adr/001-protobuf)). Hypercore no se usa, porta ni emula.

**Parte 2 — Conectividad: en capas, construida sobre una base Rust existente.**

- **Sync v1 — pares configurados.** Pull HTTP(S) entre pares conocidos (resumen de `heads` + búsqueda por rangos de `(author, seq)`). Cubre LAN, VPN/Tailscale y nodos de IP pública con cero dependencias nuevas. Entra primero.
- **Sync v2 — transporte de marcado-por-pubkey.** Construido sobre una base P2P existente en vez de escrito desde cero. **Candidato principal: [iroh](https://github.com/n0-computer/iroh)** — IDs de nodo Ed25519 (coincidiendo con el modelo de identidad de Raiznet), conexiones QUIC, hole punching integrado con **relays auto-alojables** y gossip por topic. **Candidato de respaldo: rust-libp2p** (Kademlia, mDNS, GossipSub, AutoNAT/DCUtR/Relay v2). La adopción está condicionada a un **spike de campo**: dos nodos estableciendo conectividad sobre enlaces reales de 4G/CGNAT rural, midiendo las tasas de conexión directa vs relay.

## Justificación

- **Ser dueño del formato de datos, heredar la red.** El log de eventos es donde viven la soberanía y las garantías de calidad científica de Raiznet — debe ser nuestro, y es lo bastante pequeño para especificar y probar con un corpus de fixtures. La travesía de NAT, la migración de conexión y la coordinación de relays son lo opuesto: complejidad máxima, diferenciación cero, y ya resueltas por proyectos Rust mantenidos.
- **Los relays no son gateways.** El hole punching nunca es 100% — bajo CGNAT simétrico (común en 4G rural), todo sistema (Hyperswarm incluido) recae en relays. En este diseño, cualquier nodo alcanzable de la comunidad puede actuar como relay; el tráfico no depende de infraestructura operada por Arateki. El principio de "sin gateway obligatorio" se preserva — el mismo papel que los nodos DHT desempeñan en Hyperswarm.
- **El local-first no se ve afectado.** Un nodo `local_only` nunca toca el descubrimiento ni los relays; un ESP32 más un portátil en la LAN sigue siendo una Raiznet válida.

## Trade-offs

- Perdemos el DHT global listo de Hyperswarm; el descubrimiento empieza más simple (pares configurados, mDNS, luego el descubrimiento del transporte v2).
- Sin interoperabilidad con pares JS de Hypercore (sin caso de uso conocido).
- iroh es pre-1.0 y su API aún se mueve; el riesgo está contenido tras la frontera del crate `raiznet-sync`, con rust-libp2p como respaldo. El compromiso final con el v2 solo ocurre tras el spike de campo de CGNAT.

## Consecuencias

- `CLAUDE.md`, `README.md` y estos docs ya no describen el stack Holepunch como base; los términos conceptuales que sobreviven (topics, filtros, catálogos, replicación total, semántica de solo anexado) son independientes del transporte y permanecen sin cambios.
- El plan de migración Rust implementa esto en fases: log de eventos (Fase 7), sync v1 + v2 (Fase 8), codificación canónica Protobuf (Fase 9) — cada una con su propio plan detallado antes de la ejecución.
- La distribución de contenido `Material` (antes Hyperdrive) se especificará más adelante, sobre las mismas primitivas de log de eventos + transferencia.
