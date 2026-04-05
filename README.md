# Fuji Recipes Editor

Custom settings (C1–C7) per la mia **Fujifilm X100VI**, gestiti tramite [FilmKit](https://github.com/eggricesoy/filmkit).

## Setup attuale (aprile 2025)

| Slot | Nome | Film Sim | DR | Grain | CC | CCFxB | Skin | WB | R | B | H | S | Color | Sharp | NR | Clarity | Note |
|------|------|----------|----|-------|----|-------|------|----|---|---|---|---|-------|-------|----|---------|------|
| **C1** | Reggie's Superia | Classic Neg. | Auto | Strong/Large | Strong | Strong | Off | Auto | +1 | -3 | -2 | -1 | +1 | -2 | -4 | 0 | |
| **C2** | Last Summer Roll | Classic Neg. | DR400 | Weak/Small | Strong | Weak | Weak | Auto | +3 | -5 | -2 | +0.5 | +4 | 0 | -4 | 0 | ISO 640–1600 |
| **C3** | Reggie's Portra | Classic Chrome | Auto | Weak/Small | Strong | Weak | Off | Auto | +2 | -4 | -1 | -1 | +2 | -2 | -4 | 0 | |
| **C4** | Portra 400 | Classic Chrome | DR400 | Strong/Small | Strong | Off | Off | 5200K | +1 | -6 | 0 | -2 | +2 | -2 | -4 | -2 | |
| **C5** | Reggie's BW | Acros + Red | Auto | Strong/Small | Off | Off | Off | Auto | 0 | 0 | +2 | +2 | +4 | -1 | -4 | 0 | |
| **C6** | Kodachrome 64 | Classic Chrome | DR200 | Weak/Small | Strong | Weak | Off | Daylight | +2 | -5 | 0 | 0 | +2 | +1 | -4 | +3 | |
| **C7** | CineStill 800T | Eterna | DR100 | Strong/Large | Strong | Weak | Off | Fluor. 3 | -6 | -4 | 0 | +2 | +4 | -3 | -4 | -5 | |

### Impostazioni globali

- Shutter Type: Mechanical + Electronic
- Exposure Compensation: 0
- ISO: Auto (C2: 640–1600)
- Display: Histogram ON

## Setup precedente

| Slot | Nome | Film Sim | DR | Grain | CC | CCFxB | WB | R | B | H | S | Color | Sharp | NR | Clarity |
|------|------|----------|----|-------|----|-------|----|---|---|---|---|-------|-------|----|---------|
| C1 | Portra 160 | Classic Chrome | Auto | Weak/Small | Weak | Weak | Daylight | +4 | -5 | -2 | -1 | 0 | -1 | -4 | -2 |
| C2 | Bright Kodak | Classic Chrome | DR400 | Strong/Large | Off | Off | Daylight | +3 | -7 | -2 | -2 | +4 | -2 | -4 | -3 |
| C3 | Classic Cuban | Classic Chrome | Auto | Strong/Large | Weak | Weak | Auto | +1 | -5 | +1 | +1 | +4 | 0 | -4 | +3 |
| C4 | Portra 400 | Classic Chrome | DR400 | Strong/Small | Strong | Off | 5200K | +1 | -6 | 0 | -2 | +2 | -2 | -4 | -2 |
| C5 | Reggie's BW | Acros + Red | Auto | Strong/Small | Off | Off | Auto | 0 | 0 | +2 | +2 | +4 | -1 | -4 | 0 |
| C6 | Ultramax 400 | Classic Chrome | Auto | Strong/Large | Weak | Weak | Auto | +1 | -5 | +1 | +1 | +4 | 0 | -4 | +3 |
| C7 | CineStill 800T | Eterna | DR100 | Strong/Large | Strong | Weak | Fluor. 3 | -6 | -4 | 0 | +2 | +4 | -3 | -4 | -5 |

### Modifiche rispetto al vecchio setup

- **C1**: Portra 160 → **Reggie's Superia** (Classic Neg., toni più morbidi, CC/CCFxB Strong)
- **C2**: Bright Kodak → **Last Summer Roll** (Classic Neg., grana ridotta, colori saturi, ISO limitato)
- **C3**: Classic Cuban → **Reggie's Portra** (era caricata con film sim sbagliata — ora CC corretto con toni rivisti)
- **C6**: Ultramax 400 → **Kodachrome 64** (DR200, Clarity +3, Sharp +1 — più definito e contrastato)
- C4, C5, C7: **invariati**

## Struttura file

```
recipes/
├── REGGIES SUPERIA.filmkit    # C1 — nuova
├── LAST SUMMER ROLL.filmkit   # C2 — nuova
├── REGGIES PORTRA.filmkit     # C3 — nuova
├── KODACHROME 64.filmkit      # C6 — nuova
└── imported/                  # Vecchie recipe esportate dalla fotocamera
    ├── PORTRA160.filmkit
    ├── BRIGHTKODAK.filmkit
    ├── CLASSIC CUBAN.filmkit
    ├── PORTRA400.filmkit
    ├── REGGIES BW.filmkit
    ├── ULTRAMAX 400.filmkit
    └── CINESTILL 800T.filmkit
```

I file `.filmkit` sono JSON importabili direttamente in [FilmKit](https://filmkit.eggrice.soy).

## Tool

Questo repo contiene una copia di [FilmKit](https://github.com/eggricesoy/filmkit) — browser-based preset manager e RAW converter per fotocamere Fujifilm X-series via WebUSB.

```bash
npm install
npm run dev
```

Richiede un browser Chromium (Chrome, Edge, Brave) per WebUSB.
