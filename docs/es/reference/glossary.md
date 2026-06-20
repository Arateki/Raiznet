---
description: Glosario del protocolo Raiznet — términos como BIP-39, Crop, Disposition, Ed25519, event log, FieldPolicy, H3, raw, Safra, seq, topic y User key.
---

# Glosario

Términos usados a lo largo del protocolo y la documentación de Raiznet. Las entradas marcadas con *(diseño)* describen conceptos especificados pero aún no implementados — consulta la [Hoja de ruta](/es/guide/roadmap).

---

**BIP-39**
Un estándar para generar seed phrases legibles (12 o 24 palabras) que producen claves criptográficas de forma determinista. Raiznet usa frases de 12 palabras para la identidad de Usuario y para la identidad del nodo servidor.

**Crop** (Cultivo)
Un perfil de cultivo: rangos ideales de pH, EC, temperatura y humedad, más el tiempo de cosecha y ajustes climáticos declarativos (`adjustments`). Almacenado en el firmware y usado para la evaluación local de alertas en el ESP32.

**CropCatalog** *(diseño)*
Un catálogo de solo anexado de entradas `Crop` publicado por un nodo servidor. Análogo a un Filtro, pero para conocimiento de cultivo. Cualquier servidor o institución puede publicar uno; los usuarios eligen cuál activar.

**DeviceClaim** *(diseño)*
Un evento firmado por una clave de Usuario que declara la propiedad de un dispositivo en el momento del aprovisionamiento, publicado en el log de eventos público del dueño.

**DeviceTransfer** *(diseño)*
Un evento firmado tanto por el vendedor como por el comprador, transfiriendo la propiedad de un dispositivo. Las firmas duales garantizan que ambas partes consintieron.

**Disposition** (Disposición)
La política de visibilidad de un único campo de sensor para un destino específico: `PLAIN` (en claro), `ENCRYPTED` (AES-256-GCM) u `OMIT` (no enviado). Valores en el cable: `1`, `2`, `0`.

**Ed25519**
Un algoritmo de firma de curva elíptica usado para toda identidad y firma en Raiznet. Rápido, con firmas pequeñas (64 bytes) y claves públicas pequeñas (32 bytes).

**EncryptedBlob**
El payload cifrado de un campo de sensor: un ciphertext con la tag de autenticación AES-GCM de 16 bytes anexada, más un nonce separado de 12 bytes. En el cable JSON aparece como `{ "cipher": "<hex>", "nonce": "<hex>" }`.

**ESP-NOW** *(planificado)*
Un protocolo basado en Wi-Fi de Espressif para la comunicación directa entre dispositivos sin router. Planificado para la malla local de sensores entre dispositivos ESP32.

**Event log** (Log de eventos) *(diseño)*
La futura fuente de verdad de un nodo: una secuencia de solo anexado y encadenada por hash de eventos firmados (registros de dispositivo, bloques de telemetría, eventos de curaduría). SQLite pasa a ser un índice derivado reconstruido reproduciendo el log. La replicación entre nodos opera sobre ese log ([ADR-004](/es/adr/004-raiznet-native-replication)).

**FieldPolicy**
Un objeto de política por campo que contiene un `default_disposition` y un mapa `per_destination` (clave: pubkey de servidor en hex o topic de red). Controla cómo se trata cada campo de sensor para cada destino.

**Filter** (Filtro) *(diseño)*
Un log de solo anexado de eventos de curaduría de MAC (`mac_verified`, `mac_flagged`, `mac_banned`, `mac_unflagged`) publicado por un nodo servidor. Aplicado en tiempo de consulta para controlar qué dispositivos aparecen en las respuestas de la API y las agregaciones — nunca afecta lo que se almacena.

**H3**
El sistema de indexación geoespacial hexagonal jerárquico de Uber. Cada celda H3 es un entero de 64 bits que identifica un área hexagonal en la Tierra. Raiznet almacena las ubicaciones de los dispositivos como celdas H3 en una resolución elegida por el dueño (más gruesa = más privada).

**identity.mnemonic**
El archivo en `DATA_DIR/identity.mnemonic` que contiene la seed phrase BIP-39 de 12 palabras del servidor. Creado en el primer arranque con permisos `0600`. Debe respaldarse — es la identidad del nodo.

**Lazy registration** (Registro perezoso)
El firmware de referencia se registra a sí mismo llamando a `POST /v1/devices` durante el setup. Una respuesta `409 device_already_exists` cuenta como éxito, así que la llamada es repetible con seguridad.

**local_servers**
Una lista de direcciones de servidor configurada en un dispositivo en el aprovisionamiento. Determina a dónde van los datos de dispositivos `local_only` o `both`. Si está vacía, los campos con disposición privada se quedan solo en la flash del ESP32 — ningún servidor local los recibe.

**MCP (Model Context Protocol)** *(planificado)*
Un protocolo abierto para exponer datos y herramientas a los LLM de forma estandarizada. El paquete planificado `@raiznet/mcp` expondrá los datos de Raiznet como herramientas MCP.

**nanopb** *(planificado)*
Una implementación ligera en C de Protocol Buffers para sistemas embebidos. Planificada para el lado ESP32 del formato binario canónico.

**NetworkManifest** *(diseño)*
Un evento firmado por la clave de Usuario del fundador de una red, que declara el nombre, el topic y el Filtro predeterminado de la red. El Filtro del fundador recibe prioridad de UI — esa es la única distinción que tiene un fundador.

**Protobuf (Protocol Buffers)**
El formato de serialización binaria de Google. Los esquemas `.proto` en `packages/protocol/proto/` definen la codificación canónica planificada de Raiznet ([ADR-001](/es/adr/001-protobuf)); el formato de cable actual es JSON.

**publish_to**
Una configuración del dispositivo que controla qué categorías de destino reciben sus datos: `0` local_only (solo `local_servers`), `1` public (solo topics de red), o `2` both.

**raiznet_private.db**
La base SQLite alimentada exclusivamente por la ingesta local. Contiene datos de dispositivos `local_only` y campos con disposición privada. Servida solo por el endpoint local. Nunca sale del nodo.

**raiznet_public.db**
La base SQLite que guarda dispositivos y lecturas publicables públicamente. Servida por el endpoint público; será alimentada por la replicación del log de eventos cuando entren las redes.

**raw**
La cadena ASCII delimitada por pipe que un dispositivo arma y firma para cada bloque de telemetría: `pubkey|seq|timestamp|key_version|campo=valor|…`. La firma Ed25519 cubre los bytes del raw, no el sobre JSON. Consulta [Telemetría](/es/protocol/telemetry#raw-string).

**Relay** *(diseño)*
Un nodo alcanzable que ayuda a dos pares detrás de NAT a establecer una conexión directa — y transporta el tráfico cuando el hole punching falla (común bajo CGNAT simétrico en 4G rural). Cualquier nodo de la comunidad puede actuar como relay; los relays nunca son un gateway privilegiado ([ADR-004](/es/adr/004-raiznet-native-replication)).

**Roaring Bitmap** *(planificado)*
Una estructura de datos de bitset comprimido destinada a representar listas de MAC en Filtros, habilitando operaciones de conjunto rápidas entre muchos filtros.

**Safra**
Un lote de siembra activo: un dispositivo, un Cultivo, una fecha de inicio, una fecha de cosecha opcional y un rendimiento opcional. Vincula los datos de telemetría con resultados agrícolas.

**seq**
Un número de secuencia monotónicamente creciente generado por dispositivo. Asignado en bloques amigables para la flash (el firmware de referencia reserva 100 a la vez en la NVS), usado para deduplicación idempotente — el servidor almacena como máximo una lectura por `(device_pubkey, seq)` y los duplicados cuentan como éxito.

**Sodium**
`sodium-universal` / libsodium — provee las primitivas criptográficas que sustentan `hypercore-crypto` (firma Ed25519, bytes aleatorios), usado por `@raiznet/crypto`.

**TelemetryBlock**
Un conjunto de lecturas de sensor de un dispositivo en un instante en el tiempo, firmado por la clave Ed25519 del dispositivo. Hoy un objeto JSON; un mensaje Protobuf en el formato canónico planificado.

**topic** *(diseño)*
Una cadena usada como clave de descubrimiento de una red pública (ej. `raiznet:public:arateki:v1`). Cualquier servidor que conozca un topic puede unirse a la red correspondiente. Los topics no son secretos — la privacidad de verdad viene de correr en modo `local_only`.

**User key** (Clave de Usuario)
El par de claves Ed25519 derivado de la seed phrase BIP-39 del dueño. La raíz de autoridad sobre todos los dispositivos y redes que el dueño controla. Usada para firmar eventos `DeviceClaim`, `DeviceTransfer`, `NetworkManifest` y Filtros. Nunca usada para firmar telemetría.
