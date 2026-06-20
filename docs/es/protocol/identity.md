---
description: Identidad en Raiznet — pares de claves Ed25519 para usuarios, servidores y dispositivos, jerarquía de claves, derivación BIP-39 y copia de la seed.
---

# Identidad

Todo participante de Raiznet — usuarios, servidores y dispositivos — se identifica por un par de claves Ed25519. No hay autoridad central.

## Jerarquía de claves

```
Seed phrase del Usuario (BIP-39, 12 palabras)
  └─ Par de claves del Usuario  (Ed25519)
       └─ DeviceClaim  (firma pubkeys de dispositivos)
            └─ Par de claves del Dispositivo  (Ed25519, nace en el aprovisionamiento)
                  firma cada paquete de telemetría
```

La **clave de Usuario** es la raíz de autoridad. Firma reclamaciones de propiedad sobre dispositivos y manifiestos de red. Nunca se usa para firmar telemetría — ese es el papel del dispositivo.

La **clave de Dispositivo** nace con el hardware en el aprovisionamiento y vive en la flash del ESP32. Si el dispositivo se destruye o se pierde, la clave desaparece. No hay camino de recuperación por diseño — un nuevo dispositivo se aprovisiona como una nueva identidad.

## Generación de la clave de Usuario

```ts
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { keyPair } from 'hypercore-crypto';

const mnemonic = generateMnemonic(wordlist, 128); // 12 palabras
const seed = Buffer.from(mnemonicToSeedSync(mnemonic)).subarray(0, 32);
const { publicKey, secretKey } = keyPair(seed);
```

La seed phrase se deriva de forma determinista: las mismas 12 palabras siempre producen el mismo par de claves. Esto significa:
- Recuperar la seed phrase recupera todas las claves de Usuario.
- Las claves simétricas de los dispositivos pueden derivarse de forma determinista de la seed del Usuario + la pubkey del dispositivo, así que recuperar la seed también recupera la capacidad de descifrar todos los campos de telemetría cifrados.

## Identidad del servidor

En el primer arranque, el servidor genera una nueva seed BIP-39 y la graba en `DATA_DIR/identity.mnemonic` con permisos `0600`. El archivo es el único secreto persistente. Haz una copia — es la identidad del nodo, y cuando entren las redes es lo que firma eventos `NetworkManifest`, filtros y catálogos.

La clave pública del servidor se registra en el log al iniciar:

```json
{"pubkey":"641ffb278dc6...","msg":"raiznet server started"}
```

## Aprovisionamiento del dispositivo

En el setup:

1. El dispositivo genera su par de claves a partir del TRNG del hardware (32 bytes aleatorios) y lo almacena en la flash (NVS). La clave privada nunca sale del dispositivo.
2. La identidad del dueño se genera o se importa en el portal cautivo del dispositivo como un mnemónico BIP-39 — consulta [Ciclo de vida del dispositivo](/es/protocol/device-lifecycle).
3. **Planificado:** el Usuario firma un evento `DeviceClaim` publicado en su log de eventos público, para que cualquier lectura pueda validarse contra la cadena de propiedad.

::: info Derivación de la clave del dueño en el firmware de referencia
El firmware de referencia hoy deriva la seed Ed25519 del dueño como **SHA-256 de la cadena del mnemónico**, y no mediante la derivación BIP-39/PBKDF2 completa usada por el servidor (`@raiznet/crypto`). La misma frase, por tanto, produce claves diferentes en los dos caminos. Una regla canónica se fijará por ADR antes de que la importación de la seed del dueño entre en las apps — hasta entonces, trata la clave de dueño generada por el firmware como restringida al dispositivo.
:::

## Transferencia de propiedad

Vender o transferir un dispositivo usa un evento `DeviceTransfer` con firmas duales (vendedor + comprador). Ambos firman la misma estructura que contiene la pubkey del dispositivo, las dos pubkeys de usuario y un timestamp. La red actualiza su visión de `owner_pubkey` tras ver una transferencia válida.

## BIP-39 y copia de seguridad

La seed phrase es el secreto maestro. Debe ser:

- Escrita en papel y guardada en un lugar seguro.
- Nunca almacenada en un servicio en la nube ni enviada por canales no cifrados.
- Mostrada al usuario solo una vez, en el momento de la generación, con un paso de confirmación.

No hay recuperación centralizada. Esta es una elección fundamental de diseño, no una limitación.

## Autenticación por challenge-response <Badge type="warning" text="planificado" />

El endpoint local (`127.0.0.1:LOCAL_PORT`) exigirá que el dueño demuestre la posesión de su clave privada de Usuario (aún no implementado — consulta [API local](/es/reference/local-api)):

1. El cliente llama a `GET /v1/auth/challenge` → recibe 32 bytes aleatorios.
2. El cliente firma esos bytes con su clave secreta de Usuario.
3. El cliente envía la firma a `POST /v1/auth/verify` → recibe un token de sesión (o el servidor valida por petición).

Esto impedirá el acceso no autorizado a los datos privados del dueño aunque alguien obtenga acceso a la red local del servidor. Hasta que entre, el endpoint local depende de su bind en `127.0.0.1` — no lo expongas.
