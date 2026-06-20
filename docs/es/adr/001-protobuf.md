---
description: ADR 001 — Protobuf como formato de cable canónico de Raiznet, compartido entre Node.js y ESP32; aceptado, con implementación aplazada (hoy el cable es JSON).
---

# ADR 001 — Protobuf como formato de cable

**Estado:** Aceptado — implementación aplazada  
**Fecha:** 2026-04

::: info Actualización (2026-06)
El formato de cable en producción es **JSON** con una [cadena raw firmada](/es/protocol/telemetry#raw-string); los esquemas `.proto` existen pero la generación de código no está activa. Protobuf sigue siendo el formato canónico objetivo y entrará junto con el log de eventos — el JSON permanece soportado para la generación actual de firmware.
:::

## Contexto

Raiznet necesita un formato de serialización que funcione tanto en el firmware ESP32 (C++, con restricción de memoria) como en los servidores Node.js (TypeScript). El formato debe ser compacto, con esquema impuesto y mantenible en dos runtimes muy diferentes.

Candidatos evaluados:

| Formato | Node.js | ESP32 | Esquema | Binario |
|---|---|---|---|---|
| JSON | Nativo | ArduinoJson | No | No |
| MessagePack | `msgpackr` | `msgpack-c` | No | Sí |
| CBOR | `cbor-x` | `tinycbor` | No | Sí |
| Protobuf | `@bufbuild/protobuf` | `nanopb` | Sí | Sí |

## Decisión

**Protobuf (Protocol Buffers v3)** con:
- `@bufbuild/protobuf` + `@bufbuild/protoc-gen-es` en Node.js
- `nanopb` en ESP32

Los esquemas `.proto` viven en `packages/protocol/proto/` y se comparten entre los dos runtimes. El código TypeScript se genera en tiempo de build vía `protoc-gen-es`.

## Justificación

- **Esquema compartido**: un archivo `.proto` es la única fuente de verdad. Los cambios en el esquema se reflejan en el código generado de ambos lados — sin structs mantenidas a mano.
- **Compactación binaria**: paquetes más pequeños que JSON, importante para ESP32s a batería que envían por Wi-Fi.
- **Seguridad de tipos**: los tipos TypeScript generados son precisos y eliminan la necesidad de parsing manual.
- **Madurez de nanopb**: implementación Protobuf bien establecida para C embebido, sin asignación dinámica de memoria, funcionando dentro de las restricciones del ESP32.
- **Estabilidad de los números de campo**: las garantías de compatibilidad hacia adelante/atrás de Protobuf permiten la evolución del esquema sin romper nodos existentes que corren firmware más antiguo.

## Trade-offs

- Protobuf no es legible por humanos. Depurar paquetes crudos requiere un decodificador.
- nanopb requiere definir tamaños máximos para campos repetidos y de string en tiempo de compilación.
- Añadir un nuevo tipo de sensor requiere actualizar el archivo `.proto`, regenerar el código y desplegar actualizaciones tanto del servidor como del firmware.

## Consecuencias

- La codificación binaria canónica (ESP32 → servidor, nodo → log de eventos) usará Protobuf.
- La API HTTP mantiene JSON para compatibilidad con navegador, CLI y firmware actual.
- El paquete `packages/protocol` es dueño de todos los archivos `.proto` y del (futuro) código generado. Ningún otro paquete define su propio formato de cable.
