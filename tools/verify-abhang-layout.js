const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');

const strip = (html) => sanitizeHtml(String(html || ''), { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();

function findMatchingTag(html, openStart) {
  const openEnd = html.indexOf('>', openStart);
  if (openEnd < 0) return -1;
  const tag = /^<([a-z0-9-]+)/i.exec(html.slice(openStart, openEnd + 1))?.[1]?.toLowerCase();
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

function blocks(html, className) {
  const out = [];
  const re = /<([a-z0-9-]+)\b[^>]*class=["']([^"']*)["'][^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    if (!match[2].split(/\s+/).includes(className)) continue;
    const start = match.index;
    const end = findMatchingTag(html, start);
    if (end < 0) continue;
    out.push({ start, end, open: match[0], html: html.slice(start, end) });
    re.lastIndex = end;
  }
  return out;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && entry.name === 'index.html') files.push(full);
  }
  return files;
}

const sampleFile = path.join('Vakibh-media', 'sants', 'eknath', 'abhang-1-to-100', 'index.html');
const sampleHtml = fs.readFileSync(sampleFile, 'utf8');
const sampleArticle = blocks(sampleHtml, 'abhang-content-block')[0];
const sample = {
  articleCount: blocks(sampleHtml, 'abhang-content-block').length,
  badge: strip(/<span\b[^>]*class=["'][^"']*abhang-content-number[^"']*["'][^>]*>([\s\S]*?)<\/span>/i.exec(sampleArticle?.html || '')?.[1]),
  title: strip(/<h3\b[^>]*class=["'][^"']*abhang-content-title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i.exec(sampleArticle?.html || '')?.[1]),
  firstVerseStart: strip(/<div\b[^>]*class=["'][^"']*abhang-readable-verses[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(sampleArticle?.html || '')?.[1]).slice(0, 160),
  hasLeadingStrongInAnyRangeCard: /<div\b[^>]*class=["'][^"']*abhang-readable-verses[^"']*["'][^>]*>\s*<p[^>]*>\s*<(strong|b)\b/i.test(sampleHtml),
};

const orphanPages = [];
for (const file of walk(path.join('Vakibh-media', 'sants'))) {
  const html = fs.readFileSync(file, 'utf8');
  const articles = blocks(html, 'abhang-content-block');
  if (!articles.length) continue;
  const verseBlocks = blocks(html, 'abhang-readable-verses');
  const orphanCount = verseBlocks.filter((v) => !articles.some((a) => a.start < v.start && v.end < a.end)).length;
  if (orphanCount) orphanPages.push({ file, orphanCount });
}

console.log(JSON.stringify({ sample, orphanPageCount: orphanPages.length, orphanSample: orphanPages.slice(0, 5) }, null, 2));
