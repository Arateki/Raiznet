---
description: La pila de comunicación de Raiznet del sensor ESP32 al servidor — formato de cable JSON con raw firmado, transporte por salto y ciclo de vida del paquete.
---

# Visión general del protocolo

Raiznet define un protocolo en capas para el monitoreo de cultivos descentralizado. Esta página describe la pila de comunicación del sensor ESP32 hasta el servidor — tal como está implementada hoy — y hacia dónde va el protocolo.

## Capas

```
┌──────────────────────────────────────────┐
│        Aplicación  (API HTTP JSON)       │
├──────────────────────────────────────────┤
│  Formato de cable  (JSON + raw firmado)  │
├──────────────────────────────────────────┤
│        Transporte  (HTTP POST)           │
├──────────────────────────────────────────┤
│          Identidad  (Ed25519)            │
└──────────────────────────────────────────┘
```

Adiciones planificadas: una codificación canónica en Protobuf ([ADR-001](/es/adr/001-protobuf)), malla dispositivo-a-dispositivo vía ESP-NOW y replicación servidor-a-servidor de un log de eventos firmado ([ADR-004](/es/adr/004-raiznet-native-replication) — consulta la [Hoja de ruta](/es/guide/roadmap)).

## Formato de cable

El formato de cable actual es **JSON sobre HTTP**, con un detalle crucial: el JSON es un sobre de transporte, y el **mensaje firmado es una cadena ASCII separada, delimitada por pipe**, llamada `raw`.

```
<device_pubkey_hex>|<seq>|<timestamp_ms>|<key_version>[|ec=<v>][|ph=<v>][|waterLevel=<v>][|tempAmbient=<v>][|humidity=<v>]
```

El dispositivo firma los bytes UTF-8 de esa cadena con su clave Ed25519 y envía tanto el `raw` codificado en hex como la `signature` dentro del bloque JSON. El servidor verifica la firma contra la pubkey **registrada** del dispositivo. Consulta [Telemetría](/es/protocol/telemetry) para la gramática completa.

Los esquemas Protobuf para una codificación binaria canónica ya existen en `packages/protocol/proto/` pero aún no se usan en el cable — consulta [Esquemas Protobuf](/es/reference/proto-schemas).

## Transporte por salto

| Salto | Protocolo | Estado |
|---|---|---|
| ESP32 → Servidor | HTTP POST (`/v1/telemetry`, JSON) | **Implementado** |
| ESP32 → ESP32 (malla) | ESP-NOW en el canal de la Wi-Fi | Planificado |
| Servidor → Servidor | Replicación de log de eventos firmado | En diseño ([ADR-004](/es/adr/004-raiznet-native-replication)) |

Se eligió HTTP para el salto ESP32 → Servidor porque los sensores envían con poca frecuencia (el firmware de referencia usa por defecto una lectura por minuto; los dispositivos a batería dormirán mucho más). Una conexión persistente (WebSocket, MQTT) quedaría abierta en vano y agotaría la batería. El HTTP POST sin estado es el modelo correcto para una ingesta infrecuente del tipo fire-and-forget.

## Ciclo de vida del paquete

Lo que le ocurre a una lectura hoy:

```
ESP32 lee los sensores
  → arma la cadena raw y la firma (Ed25519, clave del dispositivo)
  → envuelve raw + signature + campos plain/encrypted en un bloque JSON
  → POST /v1/telemetry (por lotes, 1..100 bloques)

El servidor recibe el lote, por bloque:
  → busca el dispositivo en la base de destino
  → verifica la firma sobre los bytes del raw
  → resuelve la disposición de cada campo (plain / encrypted / omit)
  → inserta en raiznet_public.db o raiznet_private.db
     (INSERT OR IGNORE — los duplicados son idempotentes)
```

El paso de replicación (anexar bloques públicos a un log firmado y sincronizarlo entre nodos) es la próxima fase del protocolo y aún no está implementado.

## Identificadores

Cada entidad se identifica por su **clave pública Ed25519** (32 bytes), serializada como hex en minúsculas en el JSON. No hay enteros autoincrementales en el protocolo.

| Entidad | Origen del ID | Estado |
|---|---|---|
| Usuario | Pubkey derivada de una seed BIP-39 | Implementado |
| Servidor | Pubkey generada en el primer arranque (`identity.mnemonic`) | Implementado |
| Dispositivo | Pubkey generada en el aprovisionamiento (TRNG del hardware) | Implementado |
| Filtro / Catálogo | Pubkey de su log publicado | Diseño |

## Números de secuencia

Cada dispositivo mantiene un contador `seq` monotónicamente creciente:

- Para proteger la flash del desgaste, el firmware de referencia reserva `seq` en **bloques de 100**: persiste en la NVS solo el inicio del próximo bloque. Tras un reinicio, el dispositivo retoma desde el próximo bloque reservado — pequeños huecos en el `seq` son normales y esperados.
- El dispositivo mantiene las lecturas recientes en un ring buffer de RAM y **reenvía todo lo que aún no ha sido confirmado con un HTTP `200`**. El servidor deduplica por `(device_pubkey, seq)`, así que la retransmisión siempre es segura.
- El servidor **no** impone monotonicidad — rechazar seqs antiguos rompería la recuperación tras una reconexión.

Las lecturas que salen del buffer del dispositivo antes de sincronizar se pierden de la red — a menos que el dueño las extraiga directamente del dispositivo vía HTTP local, BLE o serial.
