# Device Lifecycle

A device in Raiznet is any ESP32 that has been provisioned with an Ed25519 keypair and a privacy policy. Its identity is its public key — not its MAC, not its name.

## States

```
[manufactured] → [provisioned] → [active] → [inactive] → [lost]
                                     ↑            ↓
                                     └────────────┘
```

| State | Meaning |
|---|---|
| `active` | Device is reporting telemetry normally |
| `inactive` | Device has not reported for a configured period |
| `lost` | Owner marked the device as unrecoverable (hardware destroyed or stolen) |

## Provisioning

1. Owner opens "add sensor" in the app.
2. Defines `publish_to`: `local_only`, `public`, or `both`.
3. If `public` or `both`, selects which networks the device publishes to.
4. Defines the privacy policy per sensor field.
5. Selects location on a map — app converts to an H3 cell at the chosen resolution.
6. ESP32 enters setup mode (temporary Wi-Fi AP or BLE advertisement).
7. App connects and sends to the device:
   - Device Ed25519 keypair (or the device generates it and sends only the public key back).
   - Privacy policy and `publish_to`.
   - List of networks and local server addresses.
   - Current Crop for the active Safra (base values + adjustments).
8. ESP32 writes everything to flash, reboots in production mode.
9. Owner signs a `DeviceClaim` with their User key and publishes it to their public Hypercore.
10. The owner's server registers the device and begins indexing readings.

## DeviceClaim

Published in the owner's public Hypercore when a device is provisioned:

```
device_pubkey: bytes(32)
device_mac: bytes(6)
claimed_at: uint64
signature: bytes(64)   // signed by owner's User key
```

Any peer can validate the ownership chain: device telemetry is signed by the device key; ownership of that key is declared in the DeviceClaim signed by the User key.

## Ownership transfer (sale)

1. Seller opens "transfer device" in the app, enters the buyer's User pubkey.
2. Seller signs a `DeviceTransfer` event.
3. Buyer receives the request in their app and signs confirming acceptance.
4. The final event (both signatures) is published in the buyer's public Hypercore.
5. The network recognizes the new `owner_pubkey` and accepts configuration changes only from the new owner.

```
device_pubkey: bytes(32)
from_user_pubkey: bytes(32)
to_user_pubkey: bytes(32)
transferred_at: uint64
signature_from: bytes(64)   // seller
signature_to: bytes(64)     // buyer
```

Historical readings remain signed by the device key. The old `DeviceClaim` by the seller stays in the log as a valid record of the period they were the owner.

## Hardware loss (burned device)

There is no revocation flow. If the device is destroyed:

1. Owner marks it as `lost` in the app (local state only).
2. Buys a new ESP32, provisions it as a brand new device (new pubkey, new MAC).
3. If visual continuity in graphs is desired, the app can display the old and new device as a merged series with a visual marker at the transition point.
4. Historical data from the old device remains on the owner's server, queryable separately.

The device's private key was lost with the hardware — this is desirable. Cloning a device would require duplicating the private key, which is impossible without physical access to the flash.

## Symmetric key rotation

Each device has a symmetric key used for `ENCRYPTED` fields. The key version is tracked in `Device.encryption_key_version` and in every `TelemetryBlock`.

Rotation flow:
1. Owner initiates rotation in the app.
2. App generates a new symmetric key, increments the version.
3. Sends the new key to the ESP32 at the next connection.
4. ESP32 uses the new key for all subsequent readings.
5. Old keys are kept in the owner's app keyring for decrypting historical data.

Peers who previously received encrypted blobs cannot decrypt them with the new key — and vice versa. Rotation limits exposure if a key leaks, at the cost of losing decryption access for any third party (e.g. an agronomist) who held a copy of the old key.

## Crop updates

The ESP32 stores the active Crop locally in flash. The app sends updates when the device connects to the server. If offline, the device continues using the stored version until it reconnects.

Crop update flow:
1. Network or owner publishes an updated Crop in a CropCatalog.
2. Server downloads the update from the catalog's Hypercore.
3. At next device connection, server pushes the updated Crop to the ESP32.
4. ESP32 writes to flash and uses the new values from the next reading cycle.
