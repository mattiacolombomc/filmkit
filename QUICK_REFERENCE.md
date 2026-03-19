# FilmKit quick reference

## Why WebUSB

- Zero install friction, works in any Chromium browser (Chrome, Edge, Brave)
- PTP protocol is simple enough to implement in TypeScript
- If WebUSB proves limiting, the TypeScript PTP code can move to a Tauri/Electron backend with minimal rework

## References

Built on the reverse-engineering work of:
- [pinpox/rawji](https://github.com/pinpox/rawji)
- [petabyt/fudge](https://github.com/nickelsh/fudge)
- [libgphoto2](http://www.gphoto.org/)
- ISO 15740 — PTP specification.

Additional protocol details (preset properties, encoding tables, write behavior) were reverse-engineered via Wireshark USB captures of the official Fujifilm X RAW Studio app.

### Directory overview

```
src/
├── main.ts              UI, event handlers, preset list, drag-and-drop
├── preset-store.ts      Preset data model, slot map, localStorage, dedup
├── profile/
│   ├── d185.ts          Native d185 profile patching (625-byte format)
│   ├── enums.ts         Film sim, WB, grain, effects, DR enums
│   └── preset-translate.ts  Camera preset ↔ UI value translation
├── ptp/
│   ├── session.ts       FujiCamera: connect, loadRaf, reconvert, writePreset
│   ├── transport.ts     WebUSB bulk transfer I/O
│   ├── container.ts     PTP container pack/unpack
│   └── constants.ts     PTP opcodes, Fuji property IDs
└── util/
    └── binary.ts        Pack/unpack helpers, PTP string parsing
```

## PTP Protocol

Communication uses PTP containers over USB bulk transfers:

```
Container (12-byte header + payload):
  [0-3]  uint32 LE: total length
  [4-5]  uint16 LE: type (1=CMD, 2=DATA, 3=RESPONSE)
  [6-7]  uint16 LE: operation code
  [8-11] uint32 LE: transaction ID
  [...]  params (up to 5 × uint32) or data payload
```

### RAW Conversion Workflow

1. `OpenSession` (0x1002)
2. `SendObjectInfo` (0x900C) + `SendObject2` (0x900D) — upload RAF via vendor commands
3. `GetDevicePropValue` (0x1015, prop=0xD185) — read base conversion profile
4. `SetDevicePropValue` (0x1016, prop=0xD185) — send modified profile
5. `SetDevicePropValue` (0x1016, prop=0xD183, value=0) — trigger conversion
6. Poll `GetObjectHandles` (0x1007) until result appears
7. `GetObject` (0x1009) — download JPEG
8. `DeleteObject` (0x100B) — clean up temp object
9. `CloseSession` (0x1003)

### Preset Read/Write

Camera presets (C1–C7) use standard PTP property operations:
- `D18C` — slot selector (write 1–7 to switch active slot)
- `D18D` — preset name (PTP string)
- `D18E`–`D1A5` — 24 preset properties (film sim, tones, WB, effects, etc.)

All read/write uses `GetDevicePropValue`/`SetDevicePropValue`. No vendor operations needed.

## D185 Profile Format

The camera returns a **625-byte native profile** via property 0xD185. This is different from the 632-byte format documented by rawji.

### Native field indices (confirmed on X100VI)

```
[4]  ExposureBias     [8]  FilmSimulation   [9]  GrainEffect
[6]  DynamicRange%    [10] ColorChrome      [11] SmoothSkin
[13] WBShiftR         [14] WBShiftB         [15] WBColorTemp(K)
[16] HighlightTone*10 [17] ShadowTone*10    [18] Color*10
[19] Sharpness*10     [20] NoiseReduction   [25] CCFxBlue
[27] Clarity*10
```

Tone parameters use *10 encoding (e.g., +1.5 → 15). Noise Reduction uses a proprietary non-linear encoding (see source code for lookup tables, pretty bizzare).

## Known Constraints

- **Chromium-only.** WebUSB not supported in Firefox or Safari.
- **HTTPS required.** WebUSB needs a secure context (localhost works for dev).
- **User gesture required.** `navigator.usb.requestDevice()` must be called from a user click.
- **Large transfers.** RAF files are 25–55 MB. Transferred over USB bulk in 512 KB chunks, it is what it is.
