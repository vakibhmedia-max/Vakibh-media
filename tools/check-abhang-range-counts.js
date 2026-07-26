const fs = require('fs');
const path = require('path');
function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && entry.name === 'index.html') files.push(full);
  }
  return files;
}
const bad = [];
for (const file of walk(path.join('Vakibh-media', 'sants'))) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('abhang-content-list')) continue;
  const match = path.basename(path.dirname(file)).match(/abhang-(\d+)-to-(\d+)/);
  if (!match) continue;
  const count = (html.match(/<article\b[^>]*abhang-content-block/g) || []).length;
  const expected = Number(match[2]) - Number(match[1]) + 1;
  if (count !== expected) bad.push({ file, count, expected });
}
console.log(JSON.stringify({ badCount: bad.length, badSample: bad.slice(0, 20) }, null, 2));
