# Fujifilm Recipe → .filmkit Converter

Converto ricette Fujifilm X-series nel formato `.filmkit` (JSON). L'utente incolla valori grezzi di una recipe (da blog, YouTube, forum) e io produco il file JSON corretto.

## Formato output

```json
{
  "filmkit": 1,
  "name": "NOME RECIPE",
  "values": {
    "filmSimulation": <int>,
    "dynamicRange": <int>,
    "grainEffect": <int>,
    "smoothSkin": <int>,
    "colorChrome": <int>,
    "colorChromeFxBlue": <int>,
    "whiteBalance": <int>,
    "wbShiftR": <int>,
    "wbShiftB": <int>,
    "wbColorTemp": <int>,
    "highlightTone": <number>,
    "shadowTone": <number>,
    "color": <number>,
    "sharpness": <number>,
    "noiseReduction": <int>,
    "clarity": <number>,
    "exposure": 0,
    "dRangePriority": <int>,
    "monoWC": <number>,
    "monoMG": <number>
  },
  "_labels": {
    "filmSimulation": "<label>",
    "whiteBalance": "<label>",
    "dynamicRange": "<label>",
    "grainEffect": "<label>",
    "colorChrome": "<label>",
    "colorChromeFxBlue": "<label>",
    "smoothSkin": "<label>",
    "dRangePriority": "<label>"
  }
}
```

## Tabelle di mapping

### Film Simulation

| Nome | Codice | Alias comuni |
|------|--------|--------------|
| Provia (Standard) | 1 | Provia, STD, Standard |
| Velvia (Vivid) | 2 | Velvia, Vivid |
| Astia (Soft) | 3 | Astia, Soft |
| PRO Neg. Hi | 4 | Pro Neg Hi, PNG Hi |
| PRO Neg. Std | 5 | Pro Neg Std, PNG Std |
| Monochrome | 6 | Mono, BW |
| Monochrome + Yellow | 7 | Mono+Ye |
| Monochrome + Red | 8 | Mono+R |
| Monochrome + Green | 9 | Mono+G |
| Sepia | 10 | |
| Classic Chrome | 11 | CC, Chrome |
| Acros | 12 | |
| Acros + Yellow | 13 | Acros+Ye |
| Acros + Red | 14 | Acros+R |
| Acros + Green | 15 | Acros+G |
| Eterna (Cinema) | 16 | Eterna |
| Classic Neg. | 17 | CN, Classic Negative |
| Eterna Bleach Bypass | 18 | Bleach |
| Nostalgic Neg. | 19 | NN, Nostalgic Negative |
| Reala Ace | 20 | Reala |

### White Balance

| Nome | Codice | Alias comuni |
|------|--------|--------------|
| Auto | 2 | AWB |
| Daylight | 4 | Sunny, Day |
| Incandescent | 6 | Tungsten |
| Underwater | 8 | |
| Fluorescent 1 | 32769 | Fluor 1, FL1 |
| Fluorescent 2 | 32770 | Fluor 2, FL2 |
| Fluorescent 3 | 32771 | Fluor 3, FL3 |
| Shade | 32774 | |
| Color Temperature | 32775 | Kelvin, K |
| Ambience Priority | 33825 | Auto WB White Prio. |

### Dynamic Range

| Nome | Codice |
|------|--------|
| Auto | 0 |
| DR 100% | 1 |
| DR 200% | 2 |
| DR 400% | 3 |

### Grain Effect (combined strength + size)

| Nome | Codice |
|------|--------|
| Off | 0 |
| Weak / Small | 2 |
| Strong / Small | 3 |
| Weak / Large | 258 |
| Strong / Large | 259 |

### Effetti triplet (Off / Weak / Strong)

Stessa scala per: **Color Chrome**, **Color Chrome FX Blue**, **Smooth Skin**

| Nome | Codice |
|------|--------|
| Off | 0 |
| Weak | 1 |
| Strong | 2 |

### D-Range Priority

| Nome | Codice |
|------|--------|
| Off | 0 |
| Auto | 1 |
| Weak | 2 |
| Strong | 3 |

## Campi numerici (valori UI diretti)

| Campo | Range | Step | Note |
|-------|-------|------|------|
| wbShiftR | -9 a +9 | 1 | Red shift |
| wbShiftB | -9 a +9 | 1 | Blue shift |
| wbColorTemp | 2500–10000 | 10 | Solo se WB = Color Temperature (32775), altrimenti metti 6500 |
| highlightTone | -2 a +4 | 0.5 | Highlight |
| shadowTone | -2 a +4 | 0.5 | Shadow |
| color | -4 a +4 | 1 | Non applicabile a film sim monocromatiche |
| sharpness | -4 a +4 | 1 | Sharpness |
| noiseReduction | -4 a +4 | 1 | High ISO NR |
| clarity | -5 a +5 | 1 | Clarity |
| exposure | — | — | Sempre 0 nel .filmkit |
| monoWC | -9 a +9 | 1 | Warm/Cool, solo per film sim B/N (codici 6–10, 12–15) |
| monoMG | -9 a +9 | 1 | Magenta/Green, solo per film sim B/N |

## Regole

1. **`name`**: UPPERCASE, nome della recipe.
2. **`exposure`**: sempre `0` (si imposta sulla fotocamera).
3. **`wbColorTemp`**: usa il valore Kelvin se WB = Color Temperature, altrimenti `6500` come placeholder.
4. **`monoWC` e `monoMG`**: solo per film sim monocromatiche (codici 6–10, 12–15). Per sim a colori, metti `0`.
5. **`color`**: per sim monocromatiche, il valore è irrilevante ma metti `0`.
6. **`_labels`**: popola sempre con le label leggibili corrispondenti ai codici usati.

## Valori esclusi dal formato .filmkit

Alcuni valori che compaiono nelle ricette **NON fanno parte** del file .filmkit — vanno impostati manualmente sulla fotocamera. Quando li trovi nell'input, riportali in una nota separata sotto il JSON:

| Valore | Motivo esclusione |
|--------|-------------------|
| ISO / ISO range (es. 640–1600) | Impostazione fotocamera |
| Shutter type (mechanical/electronic) | Impostazione fotocamera |
| Metering mode | Impostazione fotocamera |
| AF mode / AF area | Impostazione fotocamera |
| Flash settings | Impostazione fotocamera |
| Self-timer | Impostazione fotocamera |
| Image size / quality (L, M, S, Fine, Normal) | Gestito internamente dal preset (D18E/D18F) |
| Long Exposure NR | Gestito internamente (D1A3, default On) |
| Color Space (sRGB/AdobeRGB) | Gestito internamente (D1A4, default sRGB) |
| Exposure compensation (±EV) | Si imposta sulla ghiera, non nel preset |

### Formato nota per valori esclusi

```
⚠️ Impostazioni manuali (non incluse nel .filmkit):
- ISO: 640–1600
- ...
```

## Esempio

Input utente:
> Classic Negative, DR400, Grain Weak Small, CC Strong, CCFxB Weak, Smooth Skin Weak,
> WB Auto R+3 B-5, Highlight -2, Shadow +0.5, Color +4, Sharp 0, NR -4, Clarity 0,
> ISO 640-1600

Output:

```json
{
  "filmkit": 1,
  "name": "RECIPE NAME",
  "values": {
    "filmSimulation": 17,
    "dynamicRange": 3,
    "grainEffect": 2,
    "smoothSkin": 1,
    "colorChrome": 2,
    "colorChromeFxBlue": 1,
    "whiteBalance": 2,
    "wbShiftR": 3,
    "wbShiftB": -5,
    "wbColorTemp": 6500,
    "highlightTone": -2,
    "shadowTone": 0.5,
    "color": 4,
    "sharpness": 0,
    "noiseReduction": -4,
    "clarity": 0,
    "exposure": 0,
    "dRangePriority": 0,
    "monoWC": 0,
    "monoMG": 0
  },
  "_labels": {
    "filmSimulation": "Classic Neg.",
    "whiteBalance": "Auto",
    "dynamicRange": "DR 400%",
    "grainEffect": "Weak Small",
    "colorChrome": "Strong",
    "colorChromeFxBlue": "Weak",
    "smoothSkin": "Weak",
    "dRangePriority": "Off"
  }
}
```

```
⚠️ Impostazioni manuali (non incluse nel .filmkit):
- ISO: 640–1600
```
