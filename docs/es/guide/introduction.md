---
description: Raiznet es una red descentralizada de monitoreo de cultivos e inteligencia agrícola colectiva, local-first y soberana, basada en datos firmados.
---

# Introducción

Raiznet es una red descentralizada para el monitoreo de cultivos y la inteligencia agrícola colectiva. Forma parte del producto **SafraSense**, de Arateki. Los datos fluyen desde sensores ESP32 instalados en torres de cultivo hacia una malla de nodos servidores, y pueden ser leídos por cualquier miembro de la red — con o sin nodo propio. Los nodos están diseñados para sincronizarse entre sí punto a punto; consulta la [Hoja de ruta](/es/guide/roadmap) sobre lo que está implementado hoy frente a lo que está en diseño.

Más allá del monitoreo, Raiznet está diseñada como una infraestructura de datos de calidad científica. Cada lectura está firmada, es a prueba de manipulaciones, geolocalizada y vinculada al resultado de una cosecha. Con el tiempo, esto crea un conjunto de datos colectivo que los LLM y los investigadores pueden transformar en conocimiento accionable: mejores parámetros de cultivo, calibraciones regionales y publicaciones científicas — sin dueño, disponibles para todos. Consulta [Inteligencia colectiva](/es/guide/intelligence) para la visión completa.

## Principios innegociables

1. **Local-first.** La red funciona sin internet. Un ESP32 y un portátil en la misma Wi-Fi ya forman una Raiznet válida.
2. **Soberanía de datos.** El usuario es dueño de las claves. Si Arateki desaparece mañana, los datos del agricultor siguen vivos en su nodo.
3. **Sin login tradicional.** La identidad es un par de claves Ed25519 generado en el cliente. No hay servidor de autenticación central.
4. **El ID del dispositivo siempre es público.** La única información garantizada como pública es la existencia de un dispositivo en la red — su pubkey, MAC y metadatos básicos. Todo lo demás tiene una política de visibilidad individual definida por el dueño.
5. **Dato privado es dato local.** Lo marcado como público queda elegible para replicación por la red. Lo marcado como privado permanece en el almacenamiento local — nunca sale de la infraestructura del dueño.
6. **Red pública o red local.** La Raiznet pública es la malla global de nodos públicos. Una "red privada" es una red local: el servidor no se anuncia, solo acepta conexiones de la LAN.
7. **Las escrituras siempre van firmadas.** Leer es consecuencia de pertenecer a la red. Escribir exige la clave privada del dispositivo emisor — evita el spam sin depender de un permiso central.
8. **El servidor es opcional.** Nadie está obligado a ejecutar un nodo. Pero quien lo hace fortalece la red.

## Lo que Raiznet no es

- Un servicio en la nube. No hay servidor operado por Raiznet en el que debas confiar.
- Una blockchain. No hay consenso global, ni minería, ni tokens.
- Una plataforma IoT tradicional. No hay lock-in de proveedor, ni clave de API obligatoria, ni límites de uso.

## Parte de SafraSense

Raiznet es la **capa abierta de protocolo y red** de SafraSense. El firmware de producción del hardware de Arateki vive en un repositorio separado. Este repositorio contiene:

- La especificación del protocolo y el formato de cable (este sitio)
- La implementación del servidor en Node.js
- El firmware ESP32 de referencia (`firmware/`)
- La CLI para operación y depuración
