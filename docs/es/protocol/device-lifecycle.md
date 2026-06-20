---
description: El ciclo de vida de un dispositivo Raiznet — estados, aprovisionamiento por portal cautivo, DeviceClaim y DeviceTransfer, pérdida de hardware y rotación de claves.
---

# Ciclo de vida del dispositivo

Un dispositivo en Raiznet es cualquier ESP32 que ha sido aprovisionado con un par de claves Ed25519 y una política de privacidad. Su identidad es su clave pública — no el MAC, no el nombre.

## Estados

```
[fabricado] → [aprovisionado] → [active] → [inactive] → [lost]
                                    ↑            ↓
                                    └────────────┘
```

| Estado | Significado |
|---|---|
| `active` | El dispositivo está reportando telemetría con normalidad |
| `inactive` | El dispositivo no reporta desde hace un periodo configurado |
| `lost` | El dueño marcó el dispositivo como irrecuperable (hardware destruido o robado) |

## Aprovisionamiento (tal como está implementado)

El firmware de referencia se aprovisiona a sí mismo mediante un **portal cautivo**:

1. En el primer arranque (o tras un reset), el ESP32 crea un punto de acceso Wi-Fi temporal.
2. El dueño se conecta a él; el portal cautivo abre un flujo de **Identity Setup**:
   - El dispositivo genera su propio par de claves Ed25519 a partir del TRNG del hardware y lo almacena en la NVS — la clave privada nunca sale del dispositivo.
   - El portal genera un nuevo mnemónico BIP-39 (12 palabras) para la **identidad del dueño**, en el idioma del dueño (PT, EN, ES), o importa uno existente. El dueño anota la frase.
3. El dueño configura el `publish_to`, la(s) dirección(es) del servidor y las credenciales de Wi-Fi.
4. El ESP32 graba todo en la NVS y reinicia en modo de producción.
5. **Registro perezoso (lazy):** el dispositivo llama a `POST /v1/devices` en el servidor configurado durante el setup, enviando su pubkey, MAC, pubkey del dueño y política de privacidad inicial. Un `409` (ya registrado) cuenta como éxito.

## Aprovisionamiento vía app <Badge type="warning" text="planificado" />

El flujo conducido por la app añade encima: política de privacidad por campo, selección de red, elección de la ubicación H3 en un mapa y envío del Cultivo de la Safra activa al dispositivo.

## DeviceClaim <Badge type="warning" text="diseño" />

Publicado en el log de eventos público del dueño cuando se aprovisiona un dispositivo:

```
device_pubkey: bytes(32)
device_mac: bytes(6)
claimed_at: uint64
signature: bytes(64)   // firmado por la clave de Usuario del dueño
```

Cualquier par puede validar la cadena de propiedad: la telemetría del dispositivo está firmada por la clave del dispositivo; la propiedad de esa clave se declara en el DeviceClaim firmado por la clave de Usuario.

## Transferencia de propiedad (venta) <Badge type="warning" text="diseño" />

1. El vendedor abre "transferir dispositivo" en la app e introduce la pubkey de Usuario del comprador.
2. El vendedor firma un evento `DeviceTransfer`.
3. El comprador recibe la solicitud en su app y firma confirmando la aceptación.
4. El evento final (ambas firmas) se publica en el log de eventos público del comprador.
5. La red reconoce el nuevo `owner_pubkey` y acepta cambios de configuración solo del nuevo dueño.

```
device_pubkey: bytes(32)
from_user_pubkey: bytes(32)
to_user_pubkey: bytes(32)
transferred_at: uint64
signature_from: bytes(64)   // vendedor
signature_to: bytes(64)     // comprador
```

Las lecturas históricas permanecen firmadas por la clave del dispositivo. El antiguo `DeviceClaim` del vendedor sigue en el log como un registro válido del periodo en que él era el dueño.

## Pérdida de hardware (dispositivo quemado)

No hay flujo de revocación. Si el dispositivo se destruye:

1. El dueño lo marca como `lost` en la app (solo estado local).
2. Compra un nuevo ESP32 y lo aprovisiona como un dispositivo totalmente nuevo (nueva pubkey, nuevo MAC).
3. Si quiere continuidad visual en los gráficos, la app puede mostrar el dispositivo antiguo y el nuevo como una serie fusionada, con un marcador visual en el punto de transición.
4. Los datos históricos del dispositivo antiguo permanecen en el servidor del dueño, consultables por separado.

La clave privada del dispositivo se perdió con el hardware — esto es deseable. Clonar un dispositivo requeriría duplicar la clave privada, lo cual es imposible sin acceso físico a la flash.

## Rotación de la clave simétrica

Cada dispositivo tiene una clave simétrica usada para los campos `ENCRYPTED`. La versión de la clave se rastrea en `Device.encryption_key_version` y en cada `TelemetryBlock`.

Flujo de rotación:
1. El dueño inicia la rotación en la app.
2. La app genera una nueva clave simétrica e incrementa la versión.
3. Envía la nueva clave al ESP32 en la próxima conexión.
4. El ESP32 usa la nueva clave para todas las lecturas subsiguientes.
5. Las claves antiguas quedan en el llavero de la app del dueño para descifrar datos históricos.

Los pares que recibieron blobs cifrados anteriormente no pueden descifrarlos con la nueva clave — y viceversa. La rotación limita la exposición si una clave se filtra, a costa de perder el acceso de descifrado para cualquier tercero (ej. un agrónomo) que tuviera una copia de la clave antigua.

## Actualizaciones de Cultivo

El ESP32 almacena el Cultivo activo localmente en la flash. La app envía actualizaciones cuando el dispositivo se conecta al servidor. Si está offline, el dispositivo sigue usando la versión almacenada hasta reconectar.

Flujo de actualización de Cultivo:
1. La red o el dueño publica un Cultivo actualizado en un CropCatalog.
2. El servidor descarga la actualización del catálogo.
3. En la próxima conexión del dispositivo, el servidor envía el Cultivo actualizado al ESP32.
4. El ESP32 graba en la flash y usa los nuevos valores a partir del próximo ciclo de lectura.
