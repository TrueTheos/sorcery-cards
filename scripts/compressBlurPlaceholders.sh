#!/bin/bash
# Generates quality-3 blur placeholders from the main card images.
# Usage: ./compressBlurPlaceholders.sh
# Rerun anytime to regenerate (idempotent — overwrites existing files).

INPUT_DIR="../public/cards"
OUTPUT_DIR="../public/cards/3"

mkdir -p "$OUTPUT_DIR"

total=$(find "$INPUT_DIR" -maxdepth 1 -type f -iname "*.webp" | wc -l)
counter=0

find "$INPUT_DIR" -maxdepth 1 -type f -iname "*.webp" | while read -r f; do
  counter=$((counter + 1))
  out="$OUTPUT_DIR/$(basename "$f")"
  echo "[$counter/$total] $f -> $out"
  magick "$f" -resize 64x -quality 3 "$out"
done

echo "Done. $total blur placeholders written to $OUTPUT_DIR"
