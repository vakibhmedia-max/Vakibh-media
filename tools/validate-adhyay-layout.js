const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'Vakibh-media', 'sants', 'dnyaneshwar');
const marker = /॥\s*(?:[०-९0-9]+\s*[-–]\s*)?[०-९0-9]+\s*॥/;

function stripTags(value) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function chapterNumber(name) {
  return Number(name.replace('adhyay-', ''));
}

function contentOnly(html) {
  const start = html.indexOf('<div class="entry-content');
  if (start < 0) return html;
  const end = html.indexOf('<!-- CONTENT END', start);
  return end > start ? html.slice(start, end) : html.slice(start);
}

const dirs = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^adhyay-\d+$/.test(entry.name))
  .sort((a, b) => chapterNumber(a.name) - chapterNumber(b.name));

let failed = false;

for (const dir of dirs) {
  const file = path.join(root, dir.name, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const content = contentOnly(html);
  const tokenMatches = [...content.matchAll(/<div\s+class="(ovi|oviar)"[^>]*>/g)];
  const tokens = tokenMatches.map((match) => match[1]);
  const ovi = tokens.filter((token) => token === 'ovi').length;
  const oviar = tokens.filter((token) => token === 'oviar').length;

  const orderProblems = [];
  for (let i = 0; i < tokens.length; i += 2) {
    if (tokens[i] !== 'ovi' || tokens[i + 1] !== 'oviar') {
      orderProblems.push({ index: i, token: tokens[i] || 'missing', next: tokens[i + 1] || 'missing' });
      break;
    }
  }

  const legacyParagraphs = [...content.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)].filter((match) => {
    const attrs = match[1];
    const inner = match[2];
    if (/class\s*=\s*["'][^"']*\b(hdr|end|ref)\b/i.test(attrs)) return false;
    return /<br\s*\/?>/i.test(inner) && marker.test(stripTags(inner));
  });

  const unquoted = (content.match(/<div\s+class=(?:ovi|oviar)>/g) || []).length;
  const status = ovi === oviar && orderProblems.length === 0 && legacyParagraphs.length === 0 && unquoted === 0 ? 'ok' : 'CHECK';
  if (status !== 'ok') failed = true;

  console.log(
    `${dir.name}: ${status} ovi=${ovi} oviar=${oviar} order=${orderProblems.length} legacy=${legacyParagraphs.length} unquoted=${unquoted}`,
  );

  if (orderProblems.length) {
    const bad = orderProblems[0];
    const match = tokenMatches[bad.index];
    const pos = match ? match.index : content.length;
    console.log(content.slice(Math.max(0, pos - 180), Math.min(content.length, pos + 500)).replace(/\s+/g, ' '));
  }
}

process.exit(failed ? 1 : 0);
