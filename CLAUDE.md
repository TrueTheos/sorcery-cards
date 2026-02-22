# Sorcery Cards - Image CDN

Image CDN for the Sorcery TCG, used by [spells.bar](https://spells.bar). Hosts card images converted from PNG/JPG to WebP at multiple quality levels. No card metadata lives here — only images.

## Project Structure

```
public/cards/         # WebP images at quality 90 (default)
public/cards/10/      # WebP images at quality 10 (thumbnail)
public/cards/50/      # WebP images at quality 50 (legacy thumbnail)
public/tokens/        # Token PNGs (source)
public/tokens.json    # Generated token name list
public/ManualCardFix/ # Manual card fixes
raw/                  # Staging folder for downloaded PNGs (gitignored)
scripts/
  compressQuality.sh        # Core ImageMagick converter (subdirectory-based)
  compressFromRaw.sh        # Flat-file converter with renaming (raw/ workflow)
  compressAdd{Name}.sh      # Per-expansion compression scripts (legacy)
  compressAddTokens.sh      # Token compression
  makeTokenNames.js         # Generates tokens.json from public/tokens/
find-and-fix-missing-base-root.js  # Validates/creates missing base images
```

## Adding a New Expansion

### Preferred: Flat-file workflow (compressFromRaw.sh)

For bulk downloads where PNGs are in a flat directory with naming `{expansion}-{card_name}-{variant}.png`:

1. Place PNGs in `raw/` at the project root
2. Run the converter:
   ```bash
   cd scripts
   ./compressFromRaw.sh
   ```
3. The script strips the expansion prefix, replaces hyphens with underscores, and converts to WebP at quality 90 (`public/cards/`) and quality 10 (`public/cards/10/`).

Example: `alp-abundance-b-f.png` → `abundance_b_f.webp`

### Legacy: Subdirectory workflow (compressAdd{Name}.sh)

For downloads organized into variant subdirectories (e.g. `b_f/`, `b_s/`):

1. Download images to `~/Downloads/{ExpansionName}/`
2. Create `scripts/compressAdd{Name}.sh`:

```bash
#!/bin/bash

BASE_PATH="../../../../Downloads/{ExpansionName}"
declare -a SUB_DIRS=("b_f/" "b_s/" "bt_f/" "bt_s/" "p_s/")

for SUB_DIR in "${SUB_DIRS[@]}"; do
  FULL_PATH="$BASE_PATH/$SUB_DIR"
  ./compressQuality.sh "$FULL_PATH" ../public/cards/50 50
  ./compressQuality.sh "$FULL_PATH" ../public/cards 90
done
```

3. Run it:
   ```bash
   cd scripts && chmod +x compressAdd{Name}.sh && ./compressAdd{Name}.sh
   ```

Requires `magick` (ImageMagick) installed.

### 4. Fix missing base images

```bash
node find-and-fix-missing-base-root.js --create
```

This scans `public/cards/` for cards that have variant suffixes (`_b_f`, `_b_s`) but are missing a base file (no suffix). It copies `_b_s` (preferred) or `_b_f` to create the base file in `public/cards/`.

Run without `--create` first to preview what would be fixed.

## Variant Suffix Reference

Source subdirectory names map to filename suffixes:

| Subdirectory | Suffix | Meaning |
|---|---|---|
| `ai_f/` | `_ai_f` | AI foil |
| `b_f/` | `_b_f` | Bordered foil |
| `b_s/` | `_b_s` | Bordered standard |
| `bt_f/` | `_bt_f` | Borderless foil |
| `bt_s/` | `_bt_s` | Borderless standard |
| `d_f/` | `_d_f` | Detailed foil |
| `d_s/` | `_d_s` | Detailed standard |
| `dk_s/` | `_dk_s` | Deck standard |
| `f_r/` | `_f_r` | Foil rare |
| `k_s/` | `_k_s` | Kick standard |
| `op_f/` | `_op_f` | One-print foil |
| `op_rf/` | `_op_rf` | One-print rainbow foil |
| `op_s/` | `_op_s` | One-print standard |
| `p_f/` | `_p_f` | Promo foil |
| `p_s/` | `_p_s` | Promo standard |
| `pd_s/` | `_pd_s` | Prerelease deck standard |
| `pp_s/` | `_pp_s` | Prerelease promo standard |
| `s_r/` | `_s_r` | Standard rare |
| `scg_f/` | `_scg_f` | SCG foil |
| `sk_f/` | `_sk_f` | Sketch foil |
| `sk_s/` | `_sk_s` | Sketch standard |
| `tc_f/` | `_tc_f` | Textless chase foil |
| `wk_f/` | `_wk_f` | Weekend foil |
| `wk_s/` | `_wk_s` | Weekend standard |

Not every expansion has all variants. Check the source folder and list only the subdirectories that exist.

### Variants by expansion (for reference)

- **Alpha (alp)**: `b_f`, `b_s`, `bt_f`, `bt_s`, `d_s`, `p_s`, `pp_s`
- **Beta (bet)**: `b_f`, `b_s`, `bt_f`, `dk_s`, `p_f`, `p_s`, `sk_f`, `sk_s`
- **Arthurian Legends (art)**: `b_f`, `b_s`, `bt_f`, `bt_s`, `p_s`, `sk_f`
- **Dragonlord (dra)**: `b_f`, `b_s`
- **Gothic (got)**: `ai_f`, `b_f`, `b_s`, `bt_f`, `bt_s`, `d_f`, `d_s`, `dk_s`, `f_r`, `k_s`, `op_f`, `op_rf`, `op_s`, `p_s`, `pd_s`, `pp_s`, `s_r`, `scg_f`, `sk_f`, `sk_s`, `tc_f`, `wk_f`, `wk_s`
- **Promo (pro)**: `op_f`, `op_rf`, `op_s`

## Adding Tokens

1. Add token PNGs to `public/tokens/`
2. Generate the name list:
   ```bash
   cd scripts
   node makeTokenNames.js
   ```
   This writes `public/tokens.json` with the names of all PNGs in `public/tokens/`.
3. Compress tokens:
   ```bash
   cd scripts
   ./compressAddTokens.sh
   ```
   This converts tokens to WebP at quality levels 5, 20, 50, and 90.

## Core Script: compressQuality.sh

Usage: `./compressQuality.sh <input_folder> <output_folder> <quality>`

- Finds all `.jpg`, `.jpeg`, `.png` files in the input folder
- Converts each to `.webp` at the specified quality (0-100) using `magick`
- Places output in the specified folder, creating it if needed
