/**
 * Encode/decode presets for URL sharing.
 *
 * Format: `1.<base64url_name>.<base64url_values>`
 *   - `1` = version
 *   - name = UTF-8 encoded, base64url
 *   - values = 24-byte fixed-layout binary, base64url
 *
 * v1 binary layout (24 bytes):
 *   [0]  filmSimulation     u8
 *   [1]  dynamicRange       u8
 *   [2]  grainEffect hi     u8  (size)
 *   [3]  grainEffect lo     u8  (strength)
 *   [4]  smoothSkin         u8
 *   [5]  colorChrome        u8
 *   [6]  colorChromeFxBlue  u8
 *   [7]  whiteBalance hi    u8
 *   [8]  whiteBalance lo    u8
 *   [9]  wbShiftR+128       u8  (signed → unsigned)
 *   [10] wbShiftB+128       u8
 *   [11] wbColorTemp hi     u8
 *   [12] wbColorTemp lo     u8
 *   [13] highlightTone      u8  (value×2 + 4, maps -2..+4 → 0..12)
 *   [14] shadowTone         u8  (same mapping)
 *   [15] color+128          u8
 *   [16] sharpness+128      u8
 *   [17] noiseReduction+128 u8
 *   [18] clarity+128        u8
 *   [19] exposure           u8  (value×10 + 30, maps -3..+3 → 0..60)
 *   [20] dRangePriority     u8
 *   [21] monoWC+128         u8
 *   [22] monoMG+128         u8
 *   [23] reserved           u8  (0, for future use)
 */

import type { PresetUIValues } from './profile/preset-translate.ts'

const V1_SIZE = 24

// ── Base64url helpers ──────────────────────────────────────

function toBase64url(bytes: Uint8Array): string {
  const bin = String.fromCharCode(...bytes)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64url(s: string): Uint8Array {
  // Restore standard base64
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - s.length % 4) % 4)
  const bin = atob(padded)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function strToBase64url(s: string): string {
  return toBase64url(new TextEncoder().encode(s))
}

function base64urlToStr(s: string): string {
  return new TextDecoder().decode(fromBase64url(s))
}

// ── v1 encode/decode ───────────────────────────────────────

function encodeV1(values: Readonly<PresetUIValues>): Uint8Array {
  const b = new Uint8Array(V1_SIZE)
  b[0] = values.filmSimulation
  b[1] = values.dynamicRange
  b[2] = (values.grainEffect >> 8) & 0xFF  // size (hi byte)
  b[3] = values.grainEffect & 0xFF          // strength (lo byte)
  b[4] = values.smoothSkin
  b[5] = values.colorChrome
  b[6] = values.colorChromeFxBlue
  b[7] = (values.whiteBalance >> 8) & 0xFF
  b[8] = values.whiteBalance & 0xFF
  b[9] = (values.wbShiftR + 128) & 0xFF
  b[10] = (values.wbShiftB + 128) & 0xFF
  b[11] = (values.wbColorTemp >> 8) & 0xFF
  b[12] = values.wbColorTemp & 0xFF
  b[13] = Math.round(values.highlightTone * 2 + 4)
  b[14] = Math.round(values.shadowTone * 2 + 4)
  b[15] = (values.color + 128) & 0xFF
  b[16] = (values.sharpness + 128) & 0xFF
  b[17] = (values.noiseReduction + 128) & 0xFF
  b[18] = (values.clarity + 128) & 0xFF
  b[19] = Math.round(values.exposure * 10 + 30)
  b[20] = values.dRangePriority
  b[21] = (values.monoWC + 128) & 0xFF
  b[22] = (values.monoMG + 128) & 0xFF
  b[23] = 0 // reserved
  return b
}

function decodeV1(b: Uint8Array): PresetUIValues {
  return {
    filmSimulation: b[0],
    dynamicRange: b[1],
    grainEffect: (b[2] << 8) | b[3],
    smoothSkin: b[4],
    colorChrome: b[5],
    colorChromeFxBlue: b[6],
    whiteBalance: (b[7] << 8) | b[8],
    wbShiftR: b[9] - 128,
    wbShiftB: b[10] - 128,
    wbColorTemp: (b[11] << 8) | b[12],
    highlightTone: (b[13] - 4) / 2,
    shadowTone: (b[14] - 4) / 2,
    color: b[15] - 128,
    sharpness: b[16] - 128,
    noiseReduction: b[17] - 128,
    clarity: b[18] - 128,
    exposure: (b[19] - 30) / 10,
    dRangePriority: b[20],
    monoWC: b[21] - 128,
    monoMG: b[22] - 128,
  }
}

// ── Public API ─────────────────────────────────────────────

/** Encode a preset name + values into a URL hash fragment value. */
export function encodePresetUrl(name: string, values: Readonly<PresetUIValues>): string {
  const nameB64 = strToBase64url(name)
  const valuesB64 = toBase64url(encodeV1(values))
  return `1.${nameB64}.${valuesB64}`
}

/** Decode a URL hash fragment value into a preset name + values. Returns null on invalid input. */
export function decodePresetUrl(encoded: string): { name: string, values: PresetUIValues } | null {
  const parts = encoded.split('.')
  if (parts.length < 3) return null

  const version = parts[0]
  if (version !== '1') return null

  try {
    const name = base64urlToStr(parts[1])
    const bytes = fromBase64url(parts[2])
    if (bytes.length < V1_SIZE) return null
    const values = decodeV1(bytes)
    return { name, values }
  } catch {
    return null
  }
}
