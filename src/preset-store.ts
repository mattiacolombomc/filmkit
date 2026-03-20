/**
 * Preset store — manages presets (by ID) and camera slot assignments.
 *
 * Key design: presets and slots are separate concepts.
 * - A Preset has a unique ID, a display name, and UI values.
 * - Names can be duplicated (e.g. camera "Classic Chrome" and local "Classic Chrome").
 * - Slots reference presets by ID, not name.
 * - Camera data is frozen on scan. Edits create working copies keyed by ID.
 */

import type { PresetData, RawProp } from './ptp/session.ts'
import { createSnapshot, type PresetUIValues, type PresetSnapshot } from './profile/preset-translate.ts'

// ==========================================================================
// Types
// ==========================================================================

export interface Preset {
  readonly id: string
  readonly name: string
  readonly values: Readonly<PresetUIValues>
  readonly origin: 'camera' | 'local' | 'raf'
}

/** Working copy of a preset that has been edited. Mutable. */
export interface WorkingPreset {
  name: string
  values: PresetUIValues
}

export interface PresetStore {
  /** All known presets keyed by ID. */
  readonly presets: ReadonlyMap<string, Preset>

  /** Frozen snapshots from camera scan, keyed by ID. */
  readonly cameraSnapshots: ReadonlyMap<string, PresetSnapshot>

  /** Slot assignments. Index = slot position (0-based). Value = preset ID or null. */
  slotMap: (string | null)[]

  /** Number of camera slots (from scan). */
  readonly slotCount: number

  /** Slot assignments at scan time. For dirty detection. */
  readonly originalSlotMap: readonly (string | null)[]

  /** Current RAF preset ID, if one is loaded. At most one at a time. */
  rafPresetId: string | null

  /** Raw property bytes from camera scan, keyed by preset ID. For round-tripping unknown fields. */
  readonly rawSettings: ReadonlyMap<string, RawProp[]>
}

// ==========================================================================
// ID generation
// ==========================================================================

let nextId = 0

function genId(prefix: string): string {
  return `${prefix}${nextId++}`
}

// ==========================================================================
// localStorage
// ==========================================================================

const STORAGE_KEY = 'filmkit:presets'

interface LocalStorage {
  version: 1
  presets: Array<{ name: string; values: PresetUIValues }>
}

function loadLocalPresets(): Array<{ name: string; values: PresetUIValues }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data: LocalStorage = JSON.parse(raw)
    if (data.version !== 1) return []
    return data.presets
  } catch {
    return []
  }
}

/**
 * Persist local presets to localStorage.
 * Merges working copy edits so local preset changes survive page refresh.
 */
export function saveLocalPresets(store: PresetStore, workingCopies?: ReadonlyMap<string, WorkingPreset>): void {
  const localPresets = [...store.presets.values()]
    .filter(p => p.origin === 'local')
    .map(p => {
      const wc = workingCopies?.get(p.id)
      return { name: wc?.name ?? p.name, values: { ...(wc?.values ?? p.values) } }
    })

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 1,
    presets: localPresets,
  } satisfies LocalStorage))
}

// ==========================================================================
// Store creation
// ==========================================================================

/** Create a store from camera scan results, merging in local presets. */
export function createStoreFromScan(data: PresetData[]): PresetStore {
  const presets = new Map<string, Preset>()
  const cameraSnapshots = new Map<string, PresetSnapshot>()
  const rawSettings = new Map<string, RawProp[]>()
  const slotMap: (string | null)[] = []

  for (const pd of data) {
    const id = genId('c')
    const snap = createSnapshot(pd.name, pd.settings)
    presets.set(id, {
      id,
      name: pd.name,
      values: snap.values,
      origin: 'camera',
    })
    cameraSnapshots.set(id, Object.freeze({ name: pd.name, values: snap.values }))
    rawSettings.set(id, pd.settings)
    slotMap[pd.slot - 1] = id
  }

  // Merge local presets
  const local = loadLocalPresets()
  for (const lp of local) {
    const id = genId('l')
    presets.set(id, {
      id,
      name: lp.name,
      values: Object.freeze(lp.values),
      origin: 'local',
    })
  }

  const slotCount = data.length
  while (slotMap.length < slotCount) slotMap.push(null)

  return {
    presets,
    cameraSnapshots,
    rawSettings,
    slotMap,
    slotCount,
    originalSlotMap: Object.freeze([...slotMap]),
    rafPresetId: null,
  }
}

/** Create an empty store (no camera connected). */
export function createEmptyStore(): PresetStore {
  const local = loadLocalPresets()
  const presets = new Map<string, Preset>()
  for (const lp of local) {
    const id = genId('l')
    presets.set(id, {
      id,
      name: lp.name,
      values: Object.freeze(lp.values),
      origin: 'local',
    })
  }
  return {
    presets,
    cameraSnapshots: new Map(),
    rawSettings: new Map(),
    slotMap: [],
    slotCount: 0,
    originalSlotMap: Object.freeze([]),
    rafPresetId: null,
  }
}

// ==========================================================================
// Queries
// ==========================================================================

/** Get IDs of presets not assigned to any slot. */
export function getUnslottedIds(store: PresetStore): string[] {
  const slotted = new Set(store.slotMap.filter(Boolean))
  return [...store.presets.keys()].filter(id => !slotted.has(id))
}

/** Check if any slot assignment has changed from original. */
export function isSlotsDirty(store: PresetStore): boolean {
  return store.slotMap.some((id, i) => id !== store.originalSlotMap[i])
}

/** Check if anything needs saving to camera (slot changes or value edits on slotted presets). */
export function isAnythingDirty(store: PresetStore, workingCopies: ReadonlyMap<string, WorkingPreset>): boolean {
  if (isSlotsDirty(store)) return true
  for (const id of store.slotMap) {
    if (id && workingCopies.has(id)) return true
  }
  return false
}

/** Get 0-based slot indices that need writing to camera. */
export function getDirtySlots(store: PresetStore, workingCopies: ReadonlyMap<string, WorkingPreset>): number[] {
  const dirty: number[] = []
  for (let i = 0; i < store.slotCount; i++) {
    const id = store.slotMap[i]
    const slotChanged = id !== store.originalSlotMap[i]
    const valuesEdited = id !== null && workingCopies.has(id)
    if (slotChanged || valuesEdited) dirty.push(i)
  }
  return dirty
}

/** Compare two PresetUIValues. Returns true if they differ. */
export function valuesChanged(a: Readonly<PresetUIValues>, b: Readonly<PresetUIValues>): boolean {
  return (
    a.filmSimulation !== b.filmSimulation ||
    a.dynamicRange !== b.dynamicRange ||
    a.grainEffect !== b.grainEffect ||
    a.smoothSkin !== b.smoothSkin ||
    a.colorChrome !== b.colorChrome ||
    a.colorChromeFxBlue !== b.colorChromeFxBlue ||
    a.whiteBalance !== b.whiteBalance ||
    a.wbShiftR !== b.wbShiftR ||
    a.wbShiftB !== b.wbShiftB ||
    a.highlightTone !== b.highlightTone ||
    a.shadowTone !== b.shadowTone ||
    a.color !== b.color ||
    a.sharpness !== b.sharpness ||
    a.noiseReduction !== b.noiseReduction ||
    a.clarity !== b.clarity ||
    a.wbColorTemp !== b.wbColorTemp ||
    a.exposure !== b.exposure ||
    a.dRangePriority !== b.dRangePriority ||
    a.monoWC !== b.monoWC ||
    a.monoMG !== b.monoMG
  )
}

// ==========================================================================
// Content hashing — for deduplication
// ==========================================================================

/** Deterministic content key from name + values. Same content → same key. */
function contentKey(name: string, values: Readonly<PresetUIValues>): string {
  // Sorted keys for determinism (though the interface is fixed, be safe)
  return name + '\0' + JSON.stringify(values, Object.keys(values).sort())
}

/** Get the set of local preset names. */
export function getLocalNames(store: PresetStore): Set<string> {
  const names = new Set<string>()
  for (const p of store.presets.values()) {
    if (p.origin === 'local') names.add(p.name)
  }
  return names
}

/** Check if a local preset with identical name + values already exists. */
export function hasLocalDuplicate(store: PresetStore, name: string, values: Readonly<PresetUIValues>): boolean {
  const key = contentKey(name, values)
  for (const p of store.presets.values()) {
    if (p.origin === 'local' && contentKey(p.name, p.values) === key) return true
  }
  return false
}

// ==========================================================================
// Mutations
// ==========================================================================

/** Swap the presets in two slot positions. */
export function swapSlots(store: PresetStore, a: number, b: number): void {
  const tmp = store.slotMap[a]
  store.slotMap[a] = store.slotMap[b]
  store.slotMap[b] = tmp
}

/**
 * Copy a preset into the local section. Returns the new preset's ID,
 * or null if an identical local preset already exists (dedup).
 */
export function copyToLocal(store: PresetStore, sourceId: string): string | null {
  const source = store.presets.get(sourceId)
  if (!source) return null

  // Dedup: skip if an identical local preset already exists
  if (hasLocalDuplicate(store, source.name, source.values)) return null

  const id = genId('l')
  ;(store.presets as Map<string, Preset>).set(id, {
    id,
    name: source.name,
    values: source.values,
    origin: 'local',
  })
  return id
}

/**
 * Copy a preset into a camera slot. Returns the new preset's ID.
 * The displaced preset (if any) is saved to local if no duplicate exists,
 * otherwise it's quietly removed from the store.
 */
export function copyToSlot(store: PresetStore, sourceId: string, slotIndex: number): string | null {
  const source = store.presets.get(sourceId)
  if (!source) return null

  // Save displaced preset to local (with dedup)
  const displacedId = store.slotMap[slotIndex]
  if (displacedId) {
    const displaced = store.presets.get(displacedId)
    if (displaced) {
      if (!hasLocalDuplicate(store, displaced.name, displaced.values)) {
        // Copy displaced to local
        const localId = genId('l')
        ;(store.presets as Map<string, Preset>).set(localId, {
          id: localId,
          name: displaced.name,
          values: displaced.values,
          origin: 'local',
        })
      }
      // Remove the displaced camera preset from the store
      ;(store.presets as Map<string, Preset>).delete(displacedId)
    }
  }

  const id = genId('c')
  ;(store.presets as Map<string, Preset>).set(id, {
    id,
    name: source.name,
    values: source.values,
    origin: 'camera',
  })
  store.slotMap[slotIndex] = id
  return id
}

/** Add a local preset to the store. Returns its ID. */
export function addLocalPreset(store: PresetStore, name: string, values: PresetUIValues): string {
  const id = genId('l')
  ;(store.presets as Map<string, Preset>).set(id, {
    id,
    name,
    values: Object.freeze({ ...values }),
    origin: 'local',
  })
  return id
}

/** Remove a preset from the store. Works for local and raf presets. */
export function removePreset(store: PresetStore, id: string): boolean {
  const preset = store.presets.get(id)
  if (!preset || preset.origin === 'camera') return false

  const slotIdx = store.slotMap.indexOf(id)
  if (slotIdx >= 0) store.slotMap[slotIdx] = null

  if (store.rafPresetId === id) store.rafPresetId = null

  ;(store.presets as Map<string, Preset>).delete(id)
  return true
}

// ==========================================================================
// RAF preset
// ==========================================================================

/**
 * Find the first preset (any origin) whose values match the given values.
 * Uses partial matching: fields where the search values are 0/default (sentinel)
 * are skipped, since the camera's base profile doesn't populate all fields.
 * Returns the preset ID, or null if no match.
 */
export function findMatchByValues(store: PresetStore, values: Readonly<PresetUIValues>): string | null {
  // Fields to compare — skip sentinel/default fields
  const checks: Array<[keyof PresetUIValues, boolean]> = [
    ['filmSimulation', values.filmSimulation !== 0],
    ['dynamicRange', values.dynamicRange !== 0],
    ['grainEffect', values.grainEffect !== 0],
    ['smoothSkin', true],  // 0 = Off is meaningful
    ['colorChrome', true],
    ['colorChromeFxBlue', true],
    ['whiteBalance', values.whiteBalance !== 0],  // 0 = sentinel in camera profile
    ['wbShiftR', true],
    ['wbShiftB', true],
    ['highlightTone', true],
    ['shadowTone', true],
    ['color', values.color !== 0],  // often sentinel in camera profile
    ['sharpness', true],
    ['noiseReduction', values.noiseReduction !== 0],  // sentinel in camera profile
    ['clarity', true],
  ]

  const activeChecks = checks.filter(([, active]) => active)

  for (const p of store.presets.values()) {
    if (p.origin === 'raf') continue
    const match = activeChecks.every(([key]) => values[key] === p.values[key])
    if (match) return p.id
  }
  return null
}

/**
 * Set the RAF preset from a loaded file's profile.
 * Removes any previous RAF preset, checks for matching existing presets.
 * Returns { id, matched } — id is either the matched existing preset or the new RAF preset.
 */
export function setRafPreset(
  store: PresetStore,
  name: string,
  values: PresetUIValues,
): { id: string; matched: boolean } {
  // Remove previous RAF preset
  if (store.rafPresetId) {
    ;(store.presets as Map<string, Preset>).delete(store.rafPresetId)
    store.rafPresetId = null
  }

  // Check if an existing preset matches
  const matchId = findMatchByValues(store, values)
  if (matchId) {
    return { id: matchId, matched: true }
  }

  // Create ephemeral RAF preset
  const id = genId('r')
  ;(store.presets as Map<string, Preset>).set(id, {
    id,
    name,
    values: Object.freeze({ ...values }),
    origin: 'raf',
  })
  store.rafPresetId = id
  return { id, matched: false }
}
