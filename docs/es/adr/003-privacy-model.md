---
description: ADR 003 — modelo de privacidad por campo con FieldPolicy basada en mapa (default_disposition + per_destination) y disposiciones OMIT, PLAIN y ENCRYPTED.
---

# ADR 003 — Modelo de privacidad por campo con política basada en mapa

**Estado:** Aceptado  
**Fecha:** 2026-04

## Contexto

Los dispositivos Raiznet pueden tener sensores cuyas lecturas son sensibles (ej. datos de salud del cultivo que un agricultor no quiere que vean los competidores) mientras que otras lecturas del mismo dispositivo son intencionalmente públicas (ej. temperatura ambiente para mapas regionales).

Dos requisitos guiaron el diseño:
1. La privacidad debe ser configurable a **nivel de campo**, no solo por dispositivo.
2. La política debe soportar **overrides por destino** sin requerir que el usuario configure dos dispositivos lógicos separados.

## Decisión

Cada campo de sensor tiene una `FieldPolicy`:

```protobuf
message FieldPolicy {
  Disposition              default_disposition = 1;
  map<string, Disposition> per_destination     = 2;
}
```

`default_disposition` se aplica a cualquier destino no listado explícitamente en `per_destination`. La clave del mapa es una pubkey de servidor (hex) o una cadena de topic de red.

Tres disposiciones:

| Disposición | Efecto |
|---|---|
| `OMIT` | El campo no se envía a este destino |
| `PLAIN` | El campo viaja en claro |
| `ENCRYPTED` | El campo se cifra con AES-256-GCM con la clave simétrica del dispositivo |

## Justificación

**Un dispositivo, múltiples políticas.** El enfoque de mapa evita la necesidad de "dos dispositivos lógicos" como solución alternativa. Un dispositivo puede ser `PLAIN` en el servidor local, `ENCRYPTED` en la red pública y `OMIT` para un servidor de terceros específico — todo desde una configuración.

**Capas de UI.** El modelo de mapa soporta tres niveles de granularidad de cara al usuario, todos respaldados por la misma estructura de datos:
- *Igual para todos*: `default_disposition` definido, mapa vacío.
- *Público vs local*: dos entradas agrupando por clase de destino.
- *Por destino (avanzado)*: una entrada por pubkey de servidor o topic.

**`ENCRYPTED` para acceso remoto del dueño.** La disposición `ENCRYPTED` resuelve un caso específico: el dueño quiere seguir su sensor desde fuera de la LAN sin exponer los valores a la red pública. El blob cifrado viaja por la red pública con normalidad; los pares lo almacenan pero no pueden leerlo. La app del dueño descifra localmente usando la clave simétrica del dispositivo (derivada de la seed BIP-39).

**Seguridad por aislamiento, no por consulta.** La arquitectura de dos bases (`raiznet_public.db` / `raiznet_private.db`) impone el aislamiento a nivel de conexión. El modelo `OMIT` / `PLAIN` / `ENCRYPTED` es la capa de política; la separación de las bases es la capa de imposición. Ambas son necesarias.

**La replicación siempre es total.** Los filtros (listas de curaduría de MAC) nunca afectan lo que se almacena — controlan lo que aparece en las respuestas de la API. Esto mantiene la red robusta y evita la fragmentación.

## Trade-offs

- El mapa `per_destination` crece con el número de destinos configurados. En la práctica, la mayoría de los usuarios usará el valor por defecto (mapa vacío) o como mucho dos entradas.
- Cambiar una política no afecta los datos ya publicados. Los pares que descargaron lecturas en claro las conservan — no hay mecanismo de "despublicar" en un log de solo anexado.
- Los campos `ENCRYPTED` son opacos para las agregaciones. Las métricas a nivel de red (promedios por celda H3, gráficos regionales) solo pueden usar campos `PLAIN`. Esto es una garantía de privacidad deliberada, no un bug.

## Consecuencias

- `packages/protocol/proto/device.proto` define `FieldPolicy`, `Disposition` y `PrivacyPolicy`.
- `apps/server/src/domain/telemetry.ts` resuelve la disposición efectiva por campo: `per_destination[serverPubkeyHex] ?? default_disposition` (los overrides a nivel de topic entran con las redes).
- `packages/crypto/src/symmetric.ts` es dueño del cifrado y descifrado de campos con AES-256-GCM.
- La app del dueño es responsable de mantener el llavero simétrico del dispositivo (`{ versión → clave }`) y descifrar los campos `ENCRYPTED` recibidos de cualquier endpoint.
