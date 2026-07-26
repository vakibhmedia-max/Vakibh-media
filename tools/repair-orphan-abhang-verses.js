const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const SANTS_ROOT = path.join(ROOT, 'Vakibh-media', 'sants');

function findMatchingTag(html, openStart) {
  const openEnd = html.indexOf('>', openStart);
  if (openEnd < 0) return -1;
  const tag = /^<([a-z0-9-]+)/i.exec(html.slice(openStart, openEnd + 1))?.[1]?.toLowerCase();
  if (!tag) return -1;
  const re = new RegExp('<\\/?' + tag + '\\b[^>]*>', 'gi');
  re.lastIndex = openStart;
  let depth = 0;
  let match;
  while ((match = re.exec(html))) {
    if (match[0][1] === '/') depth -= 1;
    else if (!/\/>$/.test(match[0])) depth += 1;
    if (depth === 0) return re.lastIndex;
  }
  return -1;
}

function extractClassBlocks(html, className) {
  const blocks = [];
  const tagRe = /<([a-z0-9-]+)\b[^>]*class=["']([^"']*)["'][^>]*>/gi;
  let match;
  while ((match = tagRe.exec(html))) {
    const classes = match[2].split(/\s+/).filter(Boolean);
    if (!classes.includes(className)) continue;
    const start = match.index;
    const end = findMatchingTag(html, start);
    if (end < 0) continue;
    blocks.push({ start, end });
    tagRe.lastIndex = end;
  }
  return blocks;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && entry.name === 'index.html') files.push(full);
  }
  return files;
}

let changedFiles = 0;
let removedBlocks = 0;
for (const file of walk(SANTS_ROOT)) {
  let html = fs.readFileSync(file, 'utf8');
  if (!/abhang-content-list|abhang-content-block/.test(html)) continue;
  const articles = extractClassBlocks(html, 'abhang-content-block');
  if (!articles.length) continue;
  const verses = extractClassBlocks(html, 'abhang-readable-verses');
  const removals = verses.filter(v => !articles.some(a => a.start < v.start && v.end < a.end));
  if (!removals.length) continue;
  for (let i = removals.length - 1; i >= 0; i--) {
    const r = removals[i];
    html = html.slice(0, r.start) + html.slice(r.end);
  }
  fs.writeFileSync(file, html, 'utf8');
  changedFiles += 1;
  removedBlocks += removals.length;
}
console.log(JSON.stringify({ changedFiles, removedBlocks }, null, 2));
