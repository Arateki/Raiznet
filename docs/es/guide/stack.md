---
description: El stack técnico de Raiznet — Node.js, Fastify, SQLite, Ed25519 y VitePress hoy; Protobuf, H3 y Roaring Bitmaps planificados — y el papel de SQLite.
---

# Stack técnico

## Stack actual (implementado)

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | 24 LTS |
| Lenguaje | TypeScript (strict) | 5.x |
| HTTP | Fastify | 5.x |
| Almacenamiento SQL | better-sqlite3 | 11.x |
| Validación | zod | 3.x |
| Cripto (Ed25519) | hypercore-crypto (libsodium) | 3.x |
| Seeds BIP-39 | @scure/bip39 | 1.x |
| Logger | pino | 9.x |
| Monorepo | pnpm workspaces | 9.x |
| Tests | vitest | 3.x |
| Docs | VitePress | 1.x |
| Firmware | PlatformIO + framework Arduino (ESP32) | — |

## Planificado / en evaluación

| Capa | Tecnología | Estado |
|---|---|---|
| Serialización canónica | Protobuf (`@bufbuild/protobuf` en Node, `nanopb` en ESP32) | Los esquemas existen, codegen inactivo — consulta [ADR-001](/es/adr/001-protobuf) |
| Geolocalización | h3-js | Planificado con las funciones de mapa |
| Operaciones de conjunto en filtros | Roaring Bitmaps | Planificado con los filtros |
| App de escritorio | Tauri 2.x | Fase futura |
| Replicación de nodos | Log de eventos firmado + sync entre pares | En diseño — consulta la [Hoja de ruta](/es/guide/roadmap) |

## Estructura del repositorio

```
raiznet/
├── apps/
│   ├── server/          # Nodo Fastify (endpoints público + local)
│   ├── cli/             # Herramienta de operación y depuración
│   ├── website/         # Landing page raiznet.com
│   ├── dashboard/       # Dashboard web
│   └── prototype/       # Canvas de diseño de la UI (React + Vite)
├── packages/
│   ├── protocol/        # Esquemas .proto (formato canónico, planificado)
│   ├── crypto/          # Derivación de claves, firma, AES-256-GCM
│   └── core/            # Abstracciones compartidas
├── firmware/
│   ├── safraSense/      # Firmware ESP32 de referencia (sensor completo)
│   └── esp32-sensor/    # Ejemplo mínimo
└── docs/                # Este sitio
```

El firmware de producción del hardware SafraSense de Arateki vive en un repositorio separado; el firmware de este repositorio es la implementación de referencia abierta del protocolo.

## Decisiones de diseño

**No introducir sin discusión:**
- NestJS — demasiado pesado
- Express — obsoleto frente a Fastify
- ORMs — better-sqlite3 directo
- Redis — no se justifica en esta etapa
- Docker en dev — corre local
- Kafka — innecesario

## El papel de SQLite

Hoy, SQLite es el almacenamiento local primario del nodo: la ingesta valida un bloque y lo escribe directamente en `raiznet_public.db` / `raiznet_private.db`.

El objetivo de diseño es que la fuente de verdad pase a ser un **log de eventos firmado y de solo anexado**, con SQLite como índice derivado que puede borrarse y reconstruirse reproduciendo el log (consulta [ADR-002](/es/adr/002-sqlite-cache)). El esquema de tabla ancha ya está moldeado para eso:

- Consultas agregadas rápidas (columnas `REAL` fijas por sensor)
- Sin ORM — SQL directo con resultados tipados
- Los nuevos tipos de sensor requieren añadir tres columnas (`_plain`, `_cipher`, `_nonce`) por campo
