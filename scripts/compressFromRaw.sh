#!/bin/bash

# Converts flat PNGs from raw/ into WebP at three quality levels.
# Naming: strips expansion prefix, replaces hyphens with underscores.
# e.g. alp-abundance-b-f.png -> abundance_b_f.webp

input_folder="../raw"
mkdir -p ../public/cards/10
mkdir -p ../public/cards/3

total=$(find "$input_folder" -maxdepth 1 -type f -iname "*.png" | wc -l)
counter=0

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
