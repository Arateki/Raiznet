---
description: ADR 002 — SQLite como caché de lectura derivado del log de eventos firmado, con bases pública y privada separadas e aislamiento a nivel de conexión.
---

# ADR 002 — SQLite como caché de lectura derivado

**Estado:** Aceptado  
**Fecha:** 2026-04

::: info Actualización (2026-06)
El log de eventos firmado aún no está implementado — hoy la ingesta escribe directamente en SQLite (el camino de la "Fase 1" descrito en Trade-offs). El diseño del log también se ha alejado de Hypercore hacia un log de eventos de solo anexado nativo de Raiznet ([ADR-004](/es/adr/004-raiznet-native-replication)); el principio de SQLite-como-índice-derivado permanece sin cambios.
:::

## Contexto

La fuente de verdad pretendida por Raiznet es un log de eventos de solo anexado y criptográficamente firmado. Sin embargo, servir consultas de API rápidas (lecturas por rango de tiempo, agregaciones, filtrado por celda H3) directamente desde tal log es impracticable: está diseñado para anexado secuencial y replicación, no para consultas indexadas de acceso aleatorio.

Se necesita una capa de índice secundario.

## Decisión

**SQLite** (vía `better-sqlite3`) se usa como caché de lectura derivado. No es la fuente de verdad de largo plazo. Cuando exista el log de eventos, una base SQLite corrupta o borrada podrá reconstruirse por completo reproduciendo el log desde el primer evento.

Se mantienen dos bases separadas:

| Base | Alimentada por | Acceso |
|---|---|---|
| `raiznet_public.db` | Ingesta pública (replicación del log de eventos planificada) | Endpoint público |
| `raiznet_private.db` | Solo ingesta local | Solo endpoint local |

## Justificación

- **Rendimiento de consulta**: columnas fijas del tipo `REAL` permiten agregaciones SQL estándar (AVG, MIN, MAX, GROUP BY) con índices. Sin parsing de JSON en tiempo de consulta.
- **Simplicidad de esquema**: sin ORM — SQL directo con resultados tipados vía la API síncrona de `better-sqlite3`.
- **Garantía de reconstrucción** (cuando entre el log de eventos): como SQLite se deriva del log, la evolución del esquema no significa pérdida de datos. Borra el archivo, reproduce, listo.
- **Seguridad por aislamiento**: la instancia Fastify del endpoint público mantiene conexión solo con `raiznet_public.db`. Una consulta en el endpoint público no puede devolver datos privados porque el objeto de conexión de la base simplemente no está disponible para ella — el aislamiento es a nivel de conexión, no a nivel de consulta.
- **API síncrona de `better-sqlite3`**: encaja de forma natural en los handlers de ruta asíncronos de Fastify sin requerir un pool de hilos separado ni indirección de callbacks.

## Trade-offs

- Añadir un nuevo tipo de sensor requiere una migración de esquema (tres columnas nuevas: `_plain`, `_cipher`, `_nonce`). Este es el coste aceptado por consultas agregadas rápidas.
- El diseño de tabla ancha (una fila por lectura, todas las columnas de sensor en la misma fila) usa más espacio en disco que una tabla estrecha clave-valor, pero habilita consultas indexadas por rango sin joins.
- La Fase 1 escribe directamente en SQLite. La Fase 2 añade el pipeline log de eventos → indexador → SQLite. La capa de API siempre lee de SQLite en las dos fases.

## Consecuencias

- `apps/server/src/storage/public-db.ts` y `private-db.ts` son dueños de la creación del esquema (`CREATE TABLE IF NOT EXISTS`).
- Sin framework de migración en la Fase 1 — las tablas se crean en el primer arranque, el esquema es estable.
- Un indexador (Fase 2) será el único escritor de `raiznet_public.db` cuando la replicación del log de eventos esté activa.
- `raiznet_private.db` siempre se escribe directamente por el camino de ingesta local — nunca se replica.
