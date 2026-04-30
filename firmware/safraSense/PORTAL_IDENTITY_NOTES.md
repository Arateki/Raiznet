# SafraSense Portal Identity Notes

This file records implementation details that are easy to break when changing
the captive portal identity screen.

## Captive portal HTML size

The WiFiManager captive portal is sensitive to large inline HTML. The identity
section disappeared more than once when the mnemonic QR code was embedded
directly in the page:

- Inline SVG QR code made the page too large.
- Inline QR bit strings in `data-*` attributes also made the page fragile.

Keep the initial HTML small. The current pattern is:

- Render an empty QR `<canvas>` in `src/wifi_setup/wifi_setup.cpp`.
- Fetch `/identity/current?lang=...` after the page loads.
- Return only JSON with `mnemonic`, `qrSize`, and compact `qrBits`.
- Draw the QR in browser JavaScript.

Do not move the QR matrix back into `headerHtml` unless the whole portal size is
re-tested on the ESP.

## Seed generation timing

The mnemonic draft must not be generated before the Wi-Fi captive portal is
active. ESP32 random quality depends on hardware entropy availability, and the
RF subsystem being active is the condition we rely on here.

Current flow:

- `setupWifi()` loads identity state but clears the portal draft mnemonic.
- `/identity/current` generates the first draft seed only when the portal page
  requests it.
- `/identity/reroll` generates a new draft seed on demand.
- The draft is persisted only when the user saves the Wi-Fi configuration.

Keep `generateOwnerIdentity()` out of early setup paths unless a new entropy
source is explicitly enabled and documented.

## Persistence boundary

`generateOwnerIdentity()` and `importOwnerIdentity()` should not write to NVS by
themselves. They only mutate the in-memory `DeviceIdentity`.

Persist identity with `saveIdentity(id)` only after the user confirms and saves
the initial configuration. This is what makes reset/configuration startup create
a fresh draft while still saving the final chosen identity.

## Language-specific wordlists

The identity screen needs to follow the selected portal language, including the
BIP-39 wordlist. The browser stores the selected language and calls
`/identity/current?lang=...`; the firmware regenerates the draft if the language
changes.

Be careful when changing this: regenerating on language change also changes the
underlying entropy and words, not just their display labels.

## Save modal and button behavior

Only the real Wi-Fi save submit should open the save confirmation modal. Identity
buttons such as copy, save QR, and reroll are `type="button"` and must not be
treated as submit actions.

The button press effect is a brief scale-down transform. Avoid reintroducing
active color changes on the identity screen unless the whole button style is
reviewed across the portal.

## QR save behavior on mobile

Android can download the generated QR image from the button action. iOS Safari
usually opens the generated image in a new tab; the user can then long-press and
save it. This is expected browser behavior for the current no-backend-download
approach.

## BIP-39 scope

The current mnemonic generation uses:

- `esp_fill_random(..., 16)` for 128 bits of entropy.
- SHA-256 of that entropy for the BIP-39 checksum.
- 12 indices of 11 bits into the selected 2048-word list.

One important limitation remains: `owner_private_key` is currently derived as
`SHA256(mnemonic)`. That is not the full BIP-39 mnemonic-to-seed derivation,
which would use PBKDF2-HMAC-SHA512. Do not describe the owner key derivation as
fully BIP-39 compliant until that is changed.

## Build/upload notes

PlatformIO is available at:

```sh
/home/yan/.platformio/penv/bin/pio
```

Build from this folder:

```sh
/home/yan/.platformio/penv/bin/pio run
```

Upload from this folder and let PlatformIO detect the port:

```sh
/home/yan/.platformio/penv/bin/pio run -t upload
```

