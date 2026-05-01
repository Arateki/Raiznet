# SafraSense Implementation Notes

This file records implementation details, fragile constraints, and debugging
patterns that are easy to miss when changing SafraSense firmware behavior. Keep
new notes here when a feature has non-obvious memory, timing, browser, protocol,
or hardware constraints that future agents should not rediscover from scratch.

When adding a note, prefer concrete symptoms, causes, safe patterns, and exact
files or commands over broad advice.

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
- Generate the smallest QR version that fits, currently trying versions 6
  through 12 with low error correction and explicit byte-capacity checks before
  calling the QR library.

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

## QR recovery import

The recovery tab keeps QR decoding out of the initial HTML. The browser loads the
chosen image, draws it to a temporary canvas, resizes it to at most 240 px on the
longest side, thresholds it to a 1-bit bitmap, Base64-encodes the packed bitmap,
and posts it to `/identity/decode-qr?w=...&h=...`.

The firmware decodes the Base64 body, expands the packed bitmap into the
vendored `quirc` decoder buffer through `src/identity/qr_decode.cpp`, and then
runs QR detection. Keep the 240 px limit unless RAM usage is re-tested on the
ESP32. The `WebServer` plain body path stores request data as a `String`, so do
not send raw binary bitmap bytes directly; `0x00` bytes can truncate the body.

Firmware logs are controlled by `src/logging/logging.h` and are disabled by
default. Set `SAFRASENSE_LOG_LEVEL` at build time to enable them: `1` for errors,
`2` for warnings, `3` for info, and `4` for debug details such as payload size,
heap, and decoder state. Log tags are module names such as `qr`. Do not log
mnemonic words or QR payload contents.

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
