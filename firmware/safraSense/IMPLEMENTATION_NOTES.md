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
- Large identity HTML inside a `WiFiManagerParameter` made the section vanish.
- Large inline JavaScript in `setCustomHeadElement()` also made the page fragile.

Keep the initial HTML small. The current pattern is:

- Put only a small `<div id="identity-root"></div>` placeholder in
  `headerHtml`.
- Serve the full identity section from `/identity/section?lang=...`.
- Keep the custom head to CSS plus `<script src="/portal.js"></script>`.
- Serve the large portal JavaScript from `/portal.js`.
- Render an empty QR `<canvas>` in the endpoint-rendered identity section.
- Fetch `/identity/current?lang=...` after the page loads.
- Return only JSON with `mnemonic`, `qrSize`, and compact `qrBits`.
- Draw the QR in browser JavaScript.
- Generate the smallest QR version that fits, currently trying versions 6
  through 12 with low error correction and explicit byte-capacity checks before
  calling the QR library.

Do not move the QR matrix, full identity section, or large JavaScript back into
`headerHtml` or `setCustomHeadElement()` unless the whole portal is re-tested on
the ESP.

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

## Recovery word validation and suggestions

Manual identity recovery is intentionally endpoint-driven. Do not load BIP-39
wordlists into the portal HTML or browser JavaScript; keep the wordlists in
firmware and query them from `src/identity/identity.cpp`.

Current behavior:

- `/identity/validate` returns `complete`, `partial`, word count, missing count,
  and up to 6 `suggestions` for the current prefix.
- Validation is case-insensitive; imported mnemonics are normalized to lowercase
  before saving.
- Empty import text is allowed only while advanced Raiznet connectivity is
  disabled. When enabled, the identity block controls whether saving is allowed.
- Compatible but incomplete input is yellow and keeps save disabled until 12
  words are complete.
- A word or prefix outside the selected language wordlist is red and blocks
  save.
- Duplicate mnemonic words are invalid and show a duplicate-word error.
- Validation/autocomplete requests are debounced in the browser. The current
  debounce is 120 ms.
- The browser autocompletes the active word only when the endpoint has exactly
  one suggestion and the current typed prefix is still compatible with the
  prefix that triggered the request. This prevents stale responses from
  replacing a word after the user has erased or changed its beginning.
- Backspace removes the whole current word only when that word is already a
  complete valid word. Invalid or incomplete words delete one character at a
  time so the user can correct typos.
- Suggestion chips are rendered in a fixed-height row above the textarea. The
  browser measures available width and only displays the chips that fit on one
  row, so the layout does not jump or clip a second line.
- Tapping a suggestion chip replaces only the active word and appends a trailing
  space.

Known continuation work:

- Keep suggestion requests debounced; the current validation debounce is in the
  portal JavaScript inside `setupIdentityBackupActions()`.
- Re-test Japanese and Chinese carefully before changing tokenization. The
  current implementation assumes words are separated by spaces, matching the QR
  and displayed mnemonic format used by this portal.

## Advanced Raiznet connectivity section

The initial Wi-Fi page now has a general `Configuração Inicial` title and a
`Configurações avançadas` section with the checkbox `Conectar a servidores
raiznet`.

When the checkbox is unchecked:

- The identity UI and server fields are hidden.
- The hidden server fields are disabled so they are not submitted.
- Identity validation is cleared and ignored.
- Saving Wi-Fi settings uses the simple save confirmation and must not be
  blocked by invalid or incomplete identity text.

When the checkbox is checked:

- The identity section is fetched from `/identity/section?lang=...`.
- `Nome do Sensor` stays outside the advanced section and remains visible even
  when Raiznet connectivity is disabled.
- Server settings are stored in hidden JSON inputs (`ext_servers` and
  `loc_servers`) so the portal can manage multiple entries without adding many
  WiFiManager parameters.
- Inside the advanced body, server settings are shown first under the
  `Servidores` subsection. That subsection contains `Lista de servidores
  externos` and `Lista de servidores locais` areas. The Arateki action is
  disabled while the Arateki server chip is present and is re-enabled only after
  that chip is removed.
- The mnemonic card is shown below under `Identificação`.
- Switching the identity tab from `Recuperar` back to `Criar` clears the pending
  recovery validation state, because the generated words in `Criar` are the
  active identity source.
- Identity validation and the master-key save warning become active.

The DOM manipulation here is intentionally explicit. WiFiManager renders custom
parameters with extra `<br>` elements and applies default padding to `div`
elements. The portal keeps the server UI browser-side, renders chips from the
hidden JSON values, and the CSS resets lateral padding on `.advanced-section`,
`.advanced-body`, `.advanced-subsection`, `.advanced-fields`, and
`.advanced-field`. Without these details, subsection widths can drift and the
advanced section can look narrower than the rest of the form.

Do not move the identity block and server fields back into a large static
`headerHtml` block. Keep the initial HTML small and let the browser assemble the
advanced section after the Wi-Fi page loads.

`/portal.js` must be served with `send_P(...)`, not `send(...)`. The portal
script is large enough that `send(...)` can force a full `String` allocation in
RAM; when that allocation fails, the browser receives no custom script and the
portal falls back to raw WiFiManager behavior: no persistent header, no custom
language handling, no loading overlay, no custom Wi-Fi select, and broken
translations.

Future HTML/JS/CSS work:

- Prefer `PROGMEM` plus `send_P(...)` for large static HTML, JS, or CSS,
  especially inside the captive portal.
- It is fine to keep small dynamic JSON or short status responses using
  `send(...)`.
- Do not convert dynamic pages mechanically. If a page mixes static markup with
  runtime values, split static chunks from dynamic values or leave it alone
  until that page is actively being changed.
- Watch `http_local.cpp` `/config` if that page grows; it currently builds a
  full HTML page in a `String`.
- Watch `/identity/current`, `/identity/reroll`, and `/identity/decode-qr` for
  heap pressure if QR payloads or response bodies grow. Their risk is dynamic
  payload size, not static asset delivery.

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
