import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'Vakibh-media');
const extensions = new Set(['.html', '.htm', '.json', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.php', '.md', '.txt', '.css', '.sql']);
const ignoredDirectories = new Set(['.git', 'node_modules', 'vendor', 'uploads', 'reports']);
const changed = [];
const blocked = [];

function cleanFile(file) {
  const original = fs.readFileSync(file, 'utf8');
  // U+200B is not required for Marathi shaping (ZWJ/ZWNJ are preserved).
  // NFC changes only canonically-equivalent Unicode sequences.
  const cleaned = original.replaceAll('\u200B', '').normalize('NFC');
  if (cleaned === original) return;
  try {
    fs.chmodSync(file, 0o666);
  } catch {
    // The subsequent write reports the exact path if permissions still block it.
  }
  const relative = path.relative(root, file).replaceAll('\\', '/');
  try {
    fs.writeFileSync(file, cleaned, 'utf8');
    changed.push(relative);
  } catch (error) {
    blocked.push({ file: relative, code: error.code || 'WRITE_FAILED' });
  }
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.isDirectory()) continue;
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (extensions.has(path.extname(entry.name).toLowerCase())) cleanFile(fullPath);
  }
}

walk(root);
console.log(JSON.stringify({ changedFiles: changed.length, files: changed, blockedFiles: blocked.length, blocked }, null, 2));
