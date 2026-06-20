---
description: El modelo de privacidad por campo de Raiznet — disposiciones plain, encrypted y omit, FieldPolicy por destino, publish_to y seguridad por aislamiento.
---

# Modelo de privacidad

El modelo de privacidad de Raiznet opera a nivel de campo. Cada lectura de sensor (pH, EC, temperatura, etc.) tiene una política de visibilidad independiente que determina qué viaja a dónde.

## Disposición

Una `Disposition` define cómo se trata un campo para un destino dado:

| Valor | Significado |
|---|---|
| `OMIT` | El campo no se envía a este destino. No se almacena. |
| `PLAIN` | El campo viaja en claro. Visible para todos los pares con acceso a ese destino. |
| `ENCRYPTED` | El campo se cifra con la clave simétrica AES-256-GCM del dispositivo antes de la transmisión. El blob viaja normalmente, pero solo quien tiene la clave puede leerlo. |

Los valores `ENCRYPTED` nunca entran en agregaciones ni mapas de la red — los agregadores ignoran los blobs opacos.

## FieldPolicy

Cada campo de sensor tiene una `FieldPolicy`:

```protobuf
message FieldPolicy {
  Disposition default_disposition = 1;
  map<string, Disposition> per_destination = 2;
}
```

`default_disposition` se aplica a cualquier destino no listado explícitamente. `per_destination` mapea una clave de destino a un override:

- **Pubkey del servidor (hex)**: se aplica a ese servidor específico.
- **Topic de la red** (ej. `raiznet:public:arateki:v1`): se aplica a todos los pares de esa red.

La UI presenta tres niveles de granularidad, todos respaldados por el mismo mapa:

| Nivel en la UI | Configuración |
|---|---|
| Igual para todos | `default_disposition` definido, mapa vacío |
| Público vs local | Dos entradas en el mapa agrupando por clase |
| Por destino (avanzado) | Una entrada por pubkey de servidor o topic |

## publish_to

La configuración `publish_to` del dispositivo controla qué categorías de destino están activas:

| Valor | Destinos activos |
|---|---|
| `LOCAL_ONLY` | Solo las entradas de `local_servers` |
| `PUBLIC` | Solo topics de red pública |
| `BOTH` | Todos los destinos — cada uno con su propia FieldPolicy |

## local_servers como diferenciador

La lista `local_servers` en el dispositivo determina si el dato "local" llega a algún servidor:

- **`local_servers` vacío** → los campos privados se quedan en la flash del ESP32. El dueño accede a ellos directamente vía HTTP local, BLE o serial cuando está cerca.
- **`local_servers` poblado** → los campos privados se envían a esos servidores específicos y se almacenan en `raiznet_private.db`. Cada servidor es independiente y no replica datos privados con otros servidores.

Los usuarios que no ejecutan un nodo nunca necesitan configurar `local_servers`. La app lo comunica con claridad: el dato local se queda en el dispositivo hasta que la app se conecta directamente.

## Seguridad por aislamiento

Las dos bases en el servidor imponen el aislamiento a nivel de conexión, no a nivel de consulta:

- `raiznet_public.db` — alimentada por la ingesta pública (replicación entre pares planificada). El endpoint público tiene acceso solo a esta base. Una consulta mal escrita no puede filtrar datos privados porque el objeto de conexión simplemente no está disponible.
- `raiznet_private.db` — alimentada solo por la ingesta local. Solo el endpoint local (`127.0.0.1`) tiene acceso. Nunca sale del nodo.

## Lo que siempre es público

Cuando un dispositivo tiene `publish_to: PUBLIC | BOTH`, los siguientes metadatos son siempre públicos, independientemente de la FieldPolicy:

- `id` (pubkey del dispositivo)
- `mac`
- `owner_pubkey`
- `type` (sensor_mains / sensor_battery / gateway)
- `location` (celda H3 en la resolución elegida por el dueño)
- `hardware` (modelo, versión de firmware)

Estos metadatos son necesarios para que la red sepa que el dispositivo existe y para que las agregaciones funcionen.

## Cambiar la política

Cambiar la `FieldPolicy` afecta solo a las lecturas futuras. Los datos ya publicados (en claro o cifrados) permanecen con quien ya los recibió — no hay mecanismo para "despublicar" lo que los pares han descargado. Esto es consecuencia de datos de solo anexado y replicados.

## Campos cifrados y la app del dueño

La disposición `ENCRYPTED` resuelve un caso de uso específico: el dueño quiere seguir los datos de su propio sensor desde fuera de la LAN (sin necesidad de túnel) sin exponer los valores a la red pública.

Flujo:
1. El dispositivo cifra el campo con su clave simétrica antes de enviarlo al destino público.
2. Cualquier par recibe y almacena el blob cifrado — no puede leerlo.
3. La app del dueño, que guarda la clave simétrica, descifra el blob localmente.

Esto significa que el dueño puede usar cualquier gateway público o nodo par para recuperar sus datos sin confiarle los valores en claro.
