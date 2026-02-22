# Sorcery Cards - Image CDN

Image CDN for the Sorcery TCG, used by [spells.bar](https://spells.bar). Hosts card images converted from PNG/JPG to WebP at multiple quality levels. No card metadata lives here — only images and the generated `processed_cards.json` for the frontend.

## Project Structure

```
public/cards/              # WebP images at quality 90 (default)
public/cards/10/           # WebP images at quality 10 (thumbnail)
public/cards/50/           # WebP images at quality 50 (legacy thumbnail)
public/cards_api_response.json  # Raw API response (source of truth for card data)
public/processed_cards.json     # Generated frontend card list [{name, slug, type}]
public/tokens/             # Token PNGs (source)
public/tokens.json         # Generated token name list
public/ManualCardFix/      # Manual card fixes
raw/                       # Staging folder for downloaded PNGs (gitignored)
MISSING_IMAGES.md          # Cards in API with no images yet
scripts/
  compressQuality.sh       # Core ImageMagick converter (subdirectory-based)
  compressFromRaw.sh       # Flat-file converter with renaming (raw/ workflow)
  compressAdd{Name}.sh     # Per-expansion compression scripts (legacy)
  compressAddTokens.sh     # Token compression
  makeTokenNames.js        # Generates tokens.json from public/tokens/
  processApiResponse.js    # Generates processed_cards.json from API response
  cleanupVariants.js       # Removes redundant variant images (keeps base + _b_s only)
find-and-fix-missing-base-root.js  # Validates/creates missing base images
```

## Data Sources

### Card API

- **Endpoint**: `https://api.sorcerytcg.com/api/cards`
- Returns a JSON array of all cards with sets, variants, and metadata
- Rate limited — poll intermittently, diff against previous response
- Card images are NOT included in the API response

### Card Images (Google Drive)

- **Source**: [Google Drive folder](https://drive.google.com/drive/folders/17IrJkRGmIU9fDSTU2JQEU9JlFzb5liLJ?usp=sharing)
- Image filenames follow the variant slug pattern: `{expansion}-{card_name}-{variant}.png`
  - e.g. `got-algae_bloom-b-s.png`
- The slug encodes set, card name, product, and finish
- Download PNGs from the Drive folder for any new/updated expansion

### Support

Report API issues in the [#curiosa-io Discord channel](https://discord.gg/mWFU7WK5rm).

## Adding a New Expansion (Full Workflow)

Follow these steps in order when a new expansion drops:

### 1. Update the API response

```bash
curl -o public/cards_api_response.json https://api.sorcerytcg.com/api/cards
```

### 2. Download card images

Download PNGs from the [Google Drive folder](https://drive.google.com/drive/folders/17IrJkRGmIU9fDSTU2JQEU9JlFzb5liLJ?usp=sharing) and place them in `raw/` at the project root.

Files should follow flat naming: `{expansion}-{card_name}-{variant}.png`

### 3. Compress images

```bash
cd scripts && ./compressFromRaw.sh
```

This strips the expansion prefix, replaces hyphens with underscores, and converts to WebP at quality 90 (`public/cards/`) and quality 10 (`public/cards/10/`).

Example: `got-algae_bloom-b-s.png` → `algae_bloom_b_s.webp`

Requires `magick` (ImageMagick) installed.

### 4. Clean up variant images

```bash
node scripts/cleanupVariants.js          # dry-run first
node scripts/cleanupVariants.js --delete  # actually delete
```

This removes redundant variant images and keeps only:
- `{name}.webp` (base image — created from `_b_s` if missing)
- `{name}_b_s.webp` (bordered standard, kept for legacy)

All other variants (`_b_f`, `_bt_f`, `_d_s`, etc.) are deleted. Prints a summary with file counts and space recovered.

### 5. Generate the frontend card list

```bash
node scripts/processApiResponse.js
```

Reads `public/cards_api_response.json` and writes `public/processed_cards.json`:
- Extracts `name`, `type`, and derives base `slug` from the first variant slug
- Slug derivation: `alp-apprentice_wizard-b-s` → strip expansion prefix → strip variant suffix → `apprentice_wizard`
- Deduplicates by card name, sorts alphabetically
- Output format: `[{name, slug, type}, ...]`

### 6. Check for missing images

```bash
node -e "
const fs = require('fs');
const cards = require('./public/processed_cards.json');
const files = new Set(fs.readdirSync('./public/cards').filter(f => f.endsWith('.webp')));
const missing = cards.filter(c => !files.has(c.slug + '.webp') && !files.has(c.slug + '_b_s.webp'));
if (missing.length) {
  console.log(missing.length + ' cards missing images:');
  missing.forEach(c => console.log('  ' + c.slug + ' (' + c.name + ')'));
} else {
  console.log('All cards have images.');
}
"
```

Update `MISSING_IMAGES.md` if any cards are missing.

### 7. Clean up raw files

```bash
rm raw/*.png
```

## Legacy: Subdirectory Workflow (compressAdd{Name}.sh)

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

Then continue from step 4 above (cleanup variants).

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
