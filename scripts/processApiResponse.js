const fs = require('fs');
const path = require('path');

// Known variant suffixes in API slug format (hyphens), sorted longest-first
const VARIANT_SUFFIXES = [
  '-op-rf', '-scg-f',
  '-ai-f', '-bt-f', '-bt-s', '-dk-s', '-op-f', '-op-s',
  '-pd-s', '-pp-s', '-sk-f', '-sk-s', '-tc-f', '-wk-f', '-wk-s',
  '-b-f', '-b-s', '-d-f', '-d-s', '-f-r', '-k-s', '-p-f', '-p-s', '-s-r'
];

function deriveBaseSlug(variantSlug) {
  // Strip expansion prefix (everything up to and including first hyphen)
  const firstHyphen = variantSlug.indexOf('-');
  if (firstHyphen === -1) return variantSlug;
  let slug = variantSlug.substring(firstHyphen + 1);

  // Strip variant suffix
  for (const suffix of VARIANT_SUFFIXES) {
    if (slug.endsWith(suffix)) {
      slug = slug.substring(0, slug.length - suffix.length);
      break;
    }
  }

  return slug;
}

// Read API response
const apiPath = path.join(__dirname, '../public/cards_api_response.json');
const cards = JSON.parse(fs.readFileSync(apiPath, 'utf-8'));

const seen = new Map();
const slugs = new Map();

for (const card of cards) {
  const name = card.name;
  if (seen.has(name)) continue;

  const type = (card.guardian?.type || 'unknown').toLowerCase();

  // Get slug from first variant of first set
  let slug = null;
  for (const set of card.sets || []) {
    for (const variant of set.variants || []) {
      if (variant.slug) {
        slug = deriveBaseSlug(variant.slug);
        break;
      }
    }
    if (slug) break;
  }

  if (!slug) {
    console.warn(`Warning: No slug found for "${name}"`);
    continue;
  }

  if (slugs.has(slug)) {
    console.warn(`Warning: Duplicate slug "${slug}" for "${name}" (already used by "${slugs.get(slug)}")`);
  }

  slugs.set(slug, name);
  seen.set(name, { name, slug, type });
}

const result = Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));

const outputPath = path.join(__dirname, '../public/processed_cards.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n');

console.log(`Wrote ${result.length} cards to ${outputPath}`);
