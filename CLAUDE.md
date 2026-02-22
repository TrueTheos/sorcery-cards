# Sorcery Cards - Image CDN

Image CDN for the Sorcery TCG, used by [spells.bar](https://spells.bar). Hosts card images converted from PNG/JPG to WebP at multiple quality levels. No card metadata lives here — only images.

## Project Structure

```
public/cards/         # WebP images at quality 90 (default)
public/cards/50/      # WebP images at quality 50 (thumbnail)
public/tokens/        # Token PNGs (source)
public/tokens.json    # Generated token name list
public/ManualCardFix/ # Manual card fixes
scripts/
  compressQuality.sh        # Core ImageMagick converter
  compressAdd{Name}.sh      # Per-expansion compression scripts
  compressAddTokens.sh      # Token compression
  makeTokenNames.js         # Generates tokens.json from public/tokens/
find-and-fix-missing-base-root.js  # Validates/creates missing base images
```

## Adding a New Expansion

### 1. Download source images

Download card images from the Google Drive folder for the expansion. They should be organized into variant subdirectories (e.g. `b_f/`, `b_s/`, `bt_f/`, etc.). Place them somewhere accessible like `~/Downloads/{ExpansionName}/`.

### 2. Create compression script

Create `scripts/compressAdd{Name}.sh` following this pattern:

```bash
#!/bin/bash

# Define the base path
BASE_PATH="../../../../Downloads/{ExpansionName}"

# Define the subdirectories
declare -a SUB_DIRS=("b_f/" "b_s/" "bt_f/" "bt_s/" "p_s/")

# Loop through each subdirectory and run the compression scripts
for SUB_DIR in "${SUB_DIRS[@]}"; do
  FULL_PATH="$BASE_PATH/$SUB_DIR"

  # Run the script with different arguments
  ./compressQuality.sh "$FULL_PATH" ../public/cards/50 50
  ./compressQuality.sh "$FULL_PATH" ../public/cards 90
done
```

Adjust `BASE_PATH` to point to the downloaded source folder and `SUB_DIRS` to match whichever variant subdirectories exist for the expansion.

### 3. Run the compression script

```bash
cd scripts
chmod +x compressAdd{Name}.sh
./compressAdd{Name}.sh
```

Requires `magick` (ImageMagick) installed. Each variant subdirectory is processed twice: once at quality 50 into `public/cards/50/`, once at quality 90 into `public/cards/`.

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
| `b_f/` | `_b_f` | Bordered foil |
| `b_s/` | `_b_s` | Bordered standard |
| `bt_f/` | `_bt_f` | Borderless foil |
| `bt_s/` | `_bt_s` | Borderless standard |
| `d_s/` | `_d_s` | Detailed standard |
| `dk_s/` | `_dk_s` | Deck standard |
| `p_f/` | `_p_f` | Promo foil |
| `p_s/` | `_p_s` | Promo standard |
| `pp_s/` | `_pp_s` | Prerelease promo standard |
| `sk_f/` | `_sk_f` | Sketch foil |
| `sk_s/` | `_sk_s` | Sketch standard |

Not every expansion has all variants. Check the source folder and list only the subdirectories that exist.

### Variants by expansion (for reference)

- **Alpha**: `b_f`, `b_s`, `bt_f`, `bt_s`, `d_s`, `p_s`, `pp_s`
- **Beta**: `b_f`, `b_s`, `bt_f`, `dk_s`, `p_f`, `p_s`, `sk_f`, `sk_s`
- **AET**: `b_f`, `b_s`, `bt_f`, `bt_s`, `p_s`, `sk_f`

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
