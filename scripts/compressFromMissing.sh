#!/bin/bash

# Converts flat PNGs from raw/missing/ into WebP at three quality levels (90, 10, 3).
# Naming: strips expansion prefix, replaces hyphens with underscores.
# e.g. got-algae_bloom-b-s.png -> algae_bloom_b_s.webp
#
# Quality 3 images are resized to 64px wide (blur placeholders / LQIP).

input_folder="../raw/missing"
mkdir -p ../public/cards/10 ../public/cards/3

total=$(find "$input_folder" -maxdepth 1 -type f -iname "*.png" | wc -l)
counter=0

if [ "$total" -eq 0 ]; then
  echo "No PNGs found in raw/missing/"
  exit 0
fi

find "$input_folder" -maxdepth 1 -type f -iname "*.png" | while read -r f; do
  counter=$((counter + 1))
  base=$(basename "$f" .png)
  # Strip expansion prefix (everything up to first hyphen)
  stripped="${base#*-}"
  # Replace hyphens with underscores
  renamed="${stripped//-/_}"

  echo "[$counter/$total] $base -> $renamed.webp"
  magick "$f" -quality 90 "../public/cards/${renamed}.webp"
  magick "$f" -quality 10 "../public/cards/10/${renamed}.webp"
  magick "$f" -resize 64x -quality 3 "../public/cards/3/${renamed}.webp"
done

echo "Done. $total images processed to quality 90, 10, and 3."
