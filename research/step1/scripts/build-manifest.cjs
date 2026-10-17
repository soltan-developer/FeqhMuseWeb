const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const excluded = new Set(['MANIFEST.json']);
const files = [];

function walk(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) walk(full);
    else {
      const relative = path.relative(root, full).replace(/\\/g, '/');
      if (!excluded.has(relative)) files.push(relative);
    }
  }
}

walk(root);
files.sort();
const manifest = {
  schema: 'feqh-muse-step1-manifest-v1',
  generated_at: '2026-10-17',
  repository_base_commit: '95ec62a5db37d3599d2e2461ffa19e05adab5444',
  files: files.map((file) => {
    const bytes = fs.readFileSync(path.join(root, file));
    return {
      path: file,
      bytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex')
    };
  })
};

fs.writeFileSync(path.join(root, 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`wrote MANIFEST.json with ${manifest.files.length} entries`);
