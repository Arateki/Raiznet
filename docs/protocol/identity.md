# Identity

Every participant in Raiznet — users, servers, and devices — is identified by an Ed25519 keypair. There is no central authority.

## Key hierarchy

```
User seed phrase (BIP-39, 12 words)
  └─ User keypair  (Ed25519)
       └─ DeviceClaim  (signs device pubkeys)
            └─ Device keypair  (Ed25519, born at provisioning)
                  signs every telemetry packet
```

The **User key** is the root of authority. It signs ownership claims over devices and network manifests. It is never used to sign telemetry — that is the device's role.

The **Device key** is born with the hardware at provisioning and lives in the ESP32's flash. If the device is destroyed or lost, the key is gone. There is no recovery path by design — a new device is provisioned as a new identity.

## User key generation

```ts
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { keyPair } from 'hypercore-crypto';

const mnemonic = generateMnemonic(wordlist, 128); // 12 words
const seed = Buffer.from(mnemonicToSeedSync(mnemonic)).subarray(0, 32);
const { publicKey, secretKey } = keyPair(seed);
```

The seed phrase is derived deterministically: the same 12 words always produce the same keypair. This means:
- Recovering the seed phrase recovers all User keys.
- Device symmetric keys can be derived deterministically from the User seed + device pubkey, so recovering the seed also recovers the ability to decrypt all encrypted telemetry fields.

## Server identity

On first boot, the server generates a new BIP-39 seed and writes it to `DATA_DIR/identity.mnemonic` with permissions `0600`. The file is the only persistent secret. Back it up — it is the node's identity, and once networks ship it is what signs `NetworkManifest` events, filters, and catalogs.

The server's public key is logged at startup:

```json
{"pubkey":"641ffb278dc6...","msg":"raiznet server started"}
```

## Device provisioning

At setup:

1. The device generates its keypair from the hardware TRNG (32 random bytes) and stores it in flash (NVS). The private key never leaves the device.
2. The owner identity is generated or imported in the device's captive portal as a BIP-39 mnemonic — see [Device Lifecycle](/protocol/device-lifecycle).
3. **Planned:** the User signs a `DeviceClaim` event published to their public event log, so any reading can be validated against the ownership chain.

::: info Owner key derivation in the reference firmware
The reference firmware currently derives the owner's Ed25519 seed as **SHA-256 of the mnemonic string**, not via the full BIP-39/PBKDF2 derivation used by the server (`@raiznet/crypto`). The same phrase therefore produces different keys in the two paths. A canonical rule will be fixed by ADR before owner-seed import ships in the apps — until then, treat the firmware-generated owner key as device-scoped.
:::

## Ownership transfer

Selling or transferring a device uses a `DeviceTransfer` event with dual signatures (seller + buyer). Both sign the same struct containing the device pubkey, the two user pubkeys, and a timestamp. The network updates its view of `owner_pubkey` after seeing a valid transfer.

## BIP-39 and backup

The seed phrase is the master secret. It should be:

- Written on paper and stored in a safe place.
- Never stored in a cloud service or sent over unencrypted channels.
- Shown to the user only once, at generation time, with a confirmation step.

There is no centralized recovery. This is a fundamental design choice, not a limitation.

## Challenge-response authentication <Badge type="warning" text="planned" />

The local endpoint (`127.0.0.1:LOCAL_PORT`) will require the owner to prove possession of their User private key (not implemented yet — see [Local API](/reference/local-api)):

1. Client calls `GET /v1/auth/challenge` → receives 32 random bytes.
2. Client signs those bytes with their User secret key.
3. Client sends the signature to `POST /v1/auth/verify` → receives a session token (or the server validates per-request).

This will prevent unauthorized access to the owner's private data even if someone gains access to the server's local network. Until it ships, the local endpoint relies on its `127.0.0.1` bind — do not expose it.
