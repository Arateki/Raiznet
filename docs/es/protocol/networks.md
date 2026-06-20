---
description: La capa federada de redes de Raiznet (en diseño) — topics, NetworkManifest, replicación total, modos de servidor y filtros de MAC componibles.
---

# Redes

::: warning Especificación de diseño
Esta página especifica la capa federada de red — topics, manifiestos, filtros y replicación total. **Aún no está implementada**: hoy los nodos son independientes y la replicación está en diseño ([ADR-004](/es/adr/004-raiznet-native-replication)). Consulta la [Hoja de ruta](/es/guide/roadmap).
:::

Una red Raiznet se identifica por un **topic** — una cadena legible por humanos usada como clave de descubrimiento de pares. Cualquiera puede crear una red eligiendo un topic nuevo. Cualquiera puede unirse a una red existente conectándose a su topic.

## Topics

Una cadena de topic no tiene formato impuesto, pero la convención es:

```
raiznet:public:<org>:<versión>
```

Ejemplos:
- `raiznet:public:arateki:v1` — la red oficial de Arateki
- `raiznet:public:coop-verdao:v1` — la red de una cooperativa
- `raiznet:public:embrapa-nordeste:v1` — la red de una institución de investigación

Los topics **no son secretos**. Conocer un topic es suficiente para unirse a la red. Privacidad de verdad significa correr en modo `local_only`, no depender de la oscuridad del topic.

## NetworkManifest

Quien crea una red es el fundador. Publica un evento `NetworkManifest` en su log de eventos público, firmado con su clave de Usuario:

```
name: string
topic: string
description: string?
default_filter_pubkey: bytes(32)?
created_at: uint64
signature: bytes(64)
```

El manifiesto puede actualizarse con el tiempo (nuevos eventos de solo anexado sobrescriben el estado proyectado). Si los usuarios discrepan del manifiesto o quieren reglas diferentes, crean su propia red con un topic diferente — un fork ligero que no requiere permiso.

El fundador no tiene privilegio técnico más allá de haber escrito el manifiesto. Su `default_filter_pubkey` se activa por defecto en los nuevos servidores que se unen a la red y aparece primero en las listas de filtros — solo prioridad de UI.

## Replicación

**La replicación siempre es total.** Todo servidor replica todos los logs de dispositivo que descubre en una red. Los filtros nunca afectan lo que se almacena — son una lente en tiempo de consulta que controla lo que aparece en las respuestas de la API, los mapas y las agregaciones. Esto mantiene la red robusta: los datos quedan ampliamente distribuidos y no hay fragmentación donde solo ciertos nodos guardan ciertos datos.

## Modos de servidor

| Modo | Descubrimiento en el swarm | Visible externamente |
|---|---|---|
| `public` | Anuncia en todos los topics configurados | Sí |
| `local_only` | No se conecta al swarm en absoluto | No |
| `hybrid` | Anuncia en los topics; cada dispositivo controla `publish_to` individualmente | Parcialmente |

Un servidor `local_only` es invisible para la malla global. Solo sirve a los dispositivos de la red Wi-Fi local y a la app del dueño.

## Filtros

Los filtros son listas componibles de curaduría de MAC publicadas por nodos servidores. Cada filtro es un log de solo anexado de eventos de curaduría:

```
type: mac_verified | mac_flagged | mac_banned | mac_unflagged
mac: bytes(6)
reason: string?
created_at: uint64
signature: bytes(64)  // firmado por la clave de Usuario del autor del filtro
```

El estado actual de un filtro es la proyección de todos los eventos hasta el presente. La adición y la eliminación son siempre de solo anexado — no hay edición destructiva.

Los clientes combinan múltiples filtros usando operaciones de conjunto respaldadas por **Roaring Bitmaps**:

| Combinación | Efecto |
|---|---|
| Unión | Los MAC verificados por cualquier filtro seleccionado se aceptan — cobertura máxima |
| Intersección | Los MAC deben aparecer en todos los filtros — rigor máximo |
| Diferencia | Excluye los MAC señalados en filtros negativos |

El filtro de Arateki sirve como predeterminado para `raiznet:public:arateki:v1` porque Arateki es la fundadora de la red. Cualquier otro fundador de red tiene la misma relación con su propio filtro. Nadie tiene monopolio — cualquier servidor puede publicar un filtro y cualquier cliente puede elegir en cuáles confiar.

## Unirse a una red

1. El servidor se conecta al topic vía la capa de descubrimiento de pares.
2. Los pares intercambian listas de dispositivos conocidos (pubkeys, MACs, celdas H3).
3. Los pares también intercambian los filtros y catálogos disponibles.
4. El servidor activa el `default_filter_pubkey` del `NetworkManifest` (si está definido).
5. El servidor replica todos los logs de dispositivo que ve en la red.
6. Los filtros se aplican en tiempo de consulta — determinan lo que la API devuelve, no lo que se almacena.

## Múltiples redes

Un único servidor puede participar en múltiples redes simultáneamente. Para cada topic al que se une, descubre un conjunto separado de pares y replica los logs de los dispositivos que listan ese topic en `Device.networks`.

Un dispositivo puede publicar en múltiples redes listando varios topics en su campo `networks`.

## Crear una red para una cooperativa

1. Elige un topic único: `raiznet:public:mi-coop:v1`.
2. Publica un `NetworkManifest` con un nombre legible y una descripción.
3. Opcionalmente, crea un filtro listando los MAC verificados de los dispositivos de la cooperativa.
4. Define `default_filter_pubkey` en el manifiesto apuntando a ese filtro.
5. Comparte la cadena del topic con los miembros — ellos configuran sus servidores para conectarse a él.

Los miembros ven por defecto solo lo que pasa por su filtro activo. Técnicamente, cualquiera puede conectarse al topic, pero los dispositivos no filtrados no aparecerán en las agregaciones ni mapas de los miembros que usan el filtro predeterminado.
