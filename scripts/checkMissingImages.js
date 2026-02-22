const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CARDS_JSON = path.join(ROOT, 'public', 'processed_cards.json');

const DIRS = {
  'q90 (cards/)': path.join(ROOT, 'public', 'cards'),
  'q10 (cards/10/)': path.join(ROOT, 'public', 'cards', '10'),
  'q3  (cards/3/)': path.join(ROOT, 'public', 'cards', '3'),
};

const cards = JSON.parse(fs.readFileSync(CARDS_JSON, 'utf-8'));
console.log(`\nProcessed cards: ${cards.length} entries\n`);

const allMissing = {};
let anyMissing = false;

for (const [label, dir] of Object.entries(DIRS)) {
  if (!fs.existsSync(dir)) {
    console.log(`${label}: DIRECTORY NOT FOUND\n`);
    continue;
  }

  const files = new Set(fs.readdirSync(dir).filter(f => f.endsWith('.webp')));
  const missing = [];

  for (const card of cards) {
    const base = card.slug + '.webp';
    const bs = card.slug + '_b_s.webp';
    if (!files.has(base) && !files.has(bs)) {
      missing.push(card);
    }
  }

  const total = files.size;
  const found = cards.length - missing.length;

  console.log(`${label}`);
  console.log(`  Files on disk: ${total}`);
  console.log(`  Matched: ${found}/${cards.length}`);
  console.log(`  Missing: ${missing.length}`);

  if (missing.length > 0) {
    anyMissing = true;
    allMissing[label] = missing;
    for (const c of missing) {
      console.log(`    - ${c.slug} (${c.name}) [${c.type}]`);
    }
  }
  console.log();
}

// Cross-directory comparison: files in q90 but missing from q10/q3
const q90Files = new Set(
  fs.readdirSync(DIRS['q90 (cards/)'])
    .filter(f => f.endsWith('.webp'))
);

for (const [label, dir] of Object.entries(DIRS)) {
  if (label.includes('q90')) continue;
  if (!fs.existsSync(dir)) continue;

  const files = new Set(fs.readdirSync(dir).filter(f => f.endsWith('.webp')));
  const onlyInQ90 = [...q90Files].filter(f => !files.has(f));

  if (onlyInQ90.length > 0) {
    anyMissing = true;
    console.log(`In q90 but missing from ${label}: ${onlyInQ90.length}`);
    for (const f of onlyInQ90) {
      console.log(`    - ${f}`);
    }
    console.log();
  }
}

if (!anyMissing) {
  console.log('All cards have images in all directories.');
}
