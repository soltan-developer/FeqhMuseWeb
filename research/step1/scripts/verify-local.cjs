const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { DatabaseSync } = require('node:sqlite');

const [booksRoot, datasetPath] = process.argv.slice(2);
if (!booksRoot || !datasetPath) {
  console.error('usage: node verify-local.cjs <books-root> <SOURCE_DATA_SNAPSHOT.json>');
  process.exit(2);
}

const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8').replace(/^\uFEFF/, ''));
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const candidates = new Map();

for (const book of dataset.books) {
  const hits = [];
  const walk = (folder) => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === `${book.id}.zstd`) hits.push(full);
    }
  };
  walk(booksRoot);
  if (hits.length !== 1) throw new Error(`expected one source for ${book.id}, found ${hits.length}`);
  candidates.set(book.id, hits[0]);
}

const results = [];
for (const book of dataset.books) {
  const compressed = fs.readFileSync(candidates.get(book.id));
  const payload = zlib.zstdDecompressSync(compressed, { maxOutputLength: 64 * 1024 * 1024 });
  if (sha256(payload) !== book.sha256) throw new Error(`payload hash mismatch for ${book.id}`);

  const temp = path.join(process.cwd(), `.step1-${book.id}-${process.pid}.sqlite`);
  fs.writeFileSync(temp, payload);
  try {
    const db = new DatabaseSync(temp, { readOnly: true });
    db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF');
    for (const source of dataset.sources.filter((s) => s.book === book.id)) {
      const row = db.prepare('SELECT page_number, properties FROM page_contents WHERE id = ?').get(source.record);
      if (!row) throw new Error(`missing record ${source.id}`);
      const raw = typeof row.properties === 'string' ? row.properties : Buffer.from(row.properties).toString('utf8');
      const content = JSON.parse(raw).Content || '';
      const actual = Array.from(content).slice(source.span.start, source.span.end).join('');
      results.push({
        id: source.id,
        page_matches: row.page_number === source.page,
        span_matches: actual === source.quote,
        quote_hash_matches: sha256(source.quote) === source.hash,
        before_matches: content.slice(Math.max(0, content.indexOf(source.quote) - source.before.length), content.indexOf(source.quote)) === source.before,
        after_matches: content.slice(content.indexOf(source.quote) + source.quote.length, content.indexOf(source.quote) + source.quote.length + source.after.length) === source.after
      });
    }
    db.close();
  } finally {
    fs.rmSync(temp, { force: true });
  }
}

console.log(JSON.stringify({
  checked: results.length,
  passed: results.every((r) => Object.entries(r).filter(([k]) => k !== 'id').every(([, v]) => v === true)),
  results
}, null, 2));
