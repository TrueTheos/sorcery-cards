const fs = require('fs');
const path = require('path');

// All known variant suffixes (underscore format), sorted longest-first
const UNDERSCORE_SUFFIXES = [
  '_op_rf', '_scg_f',
  '_ai_f', '_bt_f', '_bt_s', '_dk_s', '_op_f', '_op_s',
  '_pd_s', '_pp_s', '_sk_f', '_sk_s', '_tc_f', '_wk_f', '_wk_s',
  '_b_f', '_b_s', '_d_f', '_d_s', '_f_r', '_k_s', '_p_f', '_p_s', '_s_r'
];

// Legacy hyphen suffixes (from older processing)
const HYPHEN_SUFFIXES = ['-pp', '-bt', '-d', '-f', '-p'];

// Combined, sorted longest-first
const ALL_SUFFIXES = [...UNDERSCORE_SUFFIXES, ...HYPHEN_SUFFIXES]
  .sort((a, b) => b.length - a.length);

function getBaseName(filename) {
  const name = filename.replace(/\.webp$/, '');
  for (const suffix of ALL_SUFFIXES) {
    if (name.endsWith(suffix)) {
      return name.substring(0, name.length - suffix.length);
    }
  }
  return name;
}

function processDirectory(dir, shouldDelete) {
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.webp') && fs.statSync(path.join(dir, f)).isFile());

  // Group by base name
  const groups = {};
  for (const file of files) {
    const base = getBaseName(file);
    if (!groups[base]) groups[base] = [];
    groups[base].push(file);
  }

  let kept = 0;
  let created = 0;
  let deleted = 0;
  let bytesRecovered = 0;

  for (const [base, variants] of Object.entries(groups)) {
    const baseFile = `${base}.webp`;
    const bsFile = `${base}_b_s.webp`;
    const hasBase = variants.includes(baseFile);
    const hasBs = variants.includes(bsFile);

    // If no base file exists, create one
    if (!hasBase && variants.length > 0) {
      let source = null;
      if (hasBs) {
        source = bsFile;
      } else {
        // Prefer _b_f, then any available
        const bfFile = `${base}_b_f.webp`;
        source = variants.includes(bfFile) ? bfFile : variants[0];
      }
      if (source) {
        const sourcePath = path.join(dir, source);
        const targetPath = path.join(dir, baseFile);
        if (shouldDelete) {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`  Created: ${baseFile} (from ${source})`);
        } else {
          console.log(`  Would create: ${baseFile} (from ${source})`);
        }
        created++;
      }
    }

    // Decide what to keep vs delete
    for (const file of variants) {
      if (file === baseFile || file === bsFile) {
        kept++;
        continue;
      }

      // Delete this variant
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      bytesRecovered += stat.size;
      deleted++;

      if (shouldDelete) {
        fs.unlinkSync(filePath);
      }
    }
  }

  return { kept, created, deleted, bytesRecovered };
}

// Parse args
const args = process.argv.slice(2);
const shouldDelete = args.includes('--delete');

if (args.includes('--help')) {
  console.log('Usage:');
  console.log('  node scripts/cleanupVariants.js           # Dry-run (preview)');
  console.log('  node scripts/cleanupVariants.js --delete   # Actually delete files');
  process.exit(0);
}

console.log(shouldDelete ? 'DELETING variant files...\n' : 'DRY RUN (use --delete to actually remove files)\n');

const dirs = [
  path.join(__dirname, '../public/cards'),
  path.join(__dirname, '../public/cards/10')
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    console.log(`Skipping ${dir} (does not exist)`);
    continue;
  }

  const relDir = path.relative(path.join(__dirname, '..'), dir);
  console.log(`Processing ${relDir}/`);
  const stats = processDirectory(dir, shouldDelete);

  const mb = (stats.bytesRecovered / 1024 / 1024).toFixed(1);
  console.log(`  Kept: ${stats.kept}, Created: ${stats.created}, ${shouldDelete ? 'Deleted' : 'Would delete'}: ${stats.deleted}, Space ${shouldDelete ? 'recovered' : 'to recover'}: ${mb} MB\n`);
}
