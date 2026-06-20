---
description: Cómo Raiznet transforma datos de sensores en conocimiento agrícola — inferencia local con LLM, inteligencia regional, calibración colectiva e investigación.
---

# Inteligencia colectiva

Uno de los propósitos centrales de Raiznet es transformar datos brutos de sensores en conocimiento agrícola accionable — no solo para el agricultor individual, sino para toda la red.

Cada dispositivo que publica en una red pública contribuye a un conjunto de datos compartido y creciente: qué se plantó, dónde, bajo qué condiciones y cuál fue el resultado. Con el tiempo, ese conjunto se convierte en una memoria colectiva de lo que funciona en cada región, para cada cultivo, bajo cada patrón climático.

## La capa de inteligencia (planificada)

La capa de inteligencia es una fase futura construida sobre la infraestructura de datos ya existente. No requiere cambios en el protocolo ni en el modelo de almacenamiento — los datos ya están ahí.

### Inferencia local (preservando la privacidad)

Un agricultor que ejecuta su propio nodo puede apuntar cualquier LLM compatible con MCP — incluyendo modelos locales vía [Ollama](https://ollama.com) — directamente al endpoint local de su servidor. El modelo tiene acceso a:

- Historial completo de telemetría (incluidos los campos privados, descifrados localmente)
- Safra activa: tipo de cultivo, fecha de siembra, cosecha esperada
- Cultivo con rangos ideales ajustados
- Resultados históricos (`yield_kg`, `harvested_at`)

Ejemplos de preguntas que el LLM puede responder solo con datos locales:
- "¿Cómo está mi lechuga comparada con el mes pasado?"
- "Mi pH ha estado subiendo durante 3 días — ¿qué debo ajustar?"
- "Según mis últimas 4 cosechas, ¿cuál es mi rendimiento medio para esta variedad?"
- "Dada la temperatura ambiente actual, ¿debo ajustar mi objetivo de EC?"

Ningún dato sale de la red local. La inferencia es totalmente offline.

### Inteligencia regional (red pública)

Los nodos que participan en una red pública pueden consultar datos agregados de todos los dispositivos en la misma región H3 y tipo de cultivo. Esto habilita:

- **Benchmarking contextual**: "Tu EC está en 2.4 — la mediana para lechuga en tu región es 1.8."
- **Detección de anomalías**: señalar lecturas que se desvían significativamente del patrón regional, distinguiendo la deriva del sensor del estrés real del cultivo.
- **Refinamiento de la predicción de cosecha**: aprender de la diferencia entre el `harvest_time_days` estimado y el real a lo largo de muchas Safras en condiciones similares, mejorando las estimaciones futuras automáticamente.

### Calibración colectiva de Cultivos

Si los agricultores de una región operan consistentemente fuera de los rangos ideales de un Cultivo y aun así obtienen un buen `yield_kg`, los rangos de ese Cultivo probablemente están equivocados para esa región. Esa señal alimenta naturalmente el modelo de `CropCatalog`: curadores regionales (cooperativas, instituciones de investigación) publican catálogos actualizados con rangos calibrados derivados de los resultados observados.

La red genera el conocimiento. Los curadores lo publican. Los agricultores activan el catálogo. Ninguna autoridad central decide.

### Servidor MCP

Un paquete `@raiznet/mcp` planificado expondrá la API de Raiznet como un servidor MCP (Model Context Protocol), haciendo que los datos de Raiznet sean consumibles de forma nativa por cualquier cliente LLM compatible con MCP:

| Herramienta | Descripción |
|---|---|
| `get_devices` | Lista los dispositivos conocidos por este nodo |
| `get_telemetry` | Obtiene lecturas recientes de un dispositivo |
| `get_safra` | Obtiene el lote de siembra activo y los detalles del cultivo |
| `get_regional_stats` | Estadísticas agregadas para una celda H3 y tipo de cultivo |
| `get_crop` | Rangos ideales de un Cultivo, ajustados para las condiciones actuales |

El servidor MCP puede correr en dos modos:
- **Modo local** (sobre el endpoint local): acceso completo incluyendo campos privados, para el asistente LLM personal del dueño.
- **Modo público** (sobre el endpoint público): acceso de solo lectura a los datos públicos, para cualquier participante de la red o investigador.

## Investigación académica y publicación de conocimiento

Raiznet está diseñada para ser una infraestructura de datos de calidad científica. La combinación de datos firmados y a prueba de manipulaciones, geolocalización precisa (H3), resultados estructurados de cultivo (Safra) y un protocolo abierto crea un conjunto de datos con propiedades que importan para el trabajo científico: procedencia, reproducibilidad y accesibilidad sin lock-in de proveedor.

El trabajo futuro planificado incluye:

- **Alianzas de investigación**: poner a disposición conjuntos de datos de Raiznet anonimizados y agregados para universidades, instituciones de investigación agrícola (como Embrapa) y cooperativas, para su publicación en revistas con revisión por pares e informes técnicos.
- **Publicación de contenido en la red**: el modelo de datos `Material` está diseñado para distribuir contenido instructivo y científico — guías de cultivo, resultados de estudios de campo, buenas prácticas regionales — directamente por la red, de autoría firmada por investigadores, accesible offline.
- **Publicación de datasets abiertos**: instantáneas periódicas de los datos de redes públicas puestas a disposición bajo licencias abiertas para la comunidad investigadora más amplia, habilitando trabajos sobre temas como la adaptación climática regional, la optimización hidropónica y la resiliencia de los sistemas alimentarios de pequeña escala.

El objetivo es un ciclo de retroalimentación: los agricultores generan datos, los investigadores los analizan, los hallazgos regresan a la red como Cultivos y Materiales mejorados, los agricultores se benefician. Ningún intermediario captura el valor.

## Por qué esto importa

El conocimiento agrícola históricamente ha estado encerrado en plataformas propietarias, en artículos académicos inaccesibles para los pequeños agricultores, o en la mente de agrónomos individuales. La estructura de Raiznet — protocolo abierto, local-first, soberanía de datos, indexada por H3, con resultados rastreados — crea las condiciones para que ese conocimiento emerja de la propia red, sin dueño, disponible para todos.

Ejecutar un nodo no es solo contribuir a la resiliencia de la red. Es contribuir a una comprensión colectiva creciente de cómo cultivar alimentos mejor.
