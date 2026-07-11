const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pageFile = path.join(root, 'Vakibh-media', 'sants', 'dnyaneshwar', 'adhyay-12', 'index.html');
const dataFile = path.join(root, 'Vakibh-media', 'Vakibh', 'audio', 'dnyaneshwariJsonContent.ts');
const data = fs.readFileSync(dataFile, 'utf8');
const page = fs.readFileSync(pageFile, 'utf8');

const objectMatch = data.match(/"id"\s*:\s*"adhyay-12"[\s\S]*?"content"\s*:\s*"((?:\\.|[^"\\])*)"/);
if (!objectMatch) throw new Error('adhyay-12 content not found');
const source = JSON.parse(`"${objectMatch[1]}"`);

const noise = [
  /^सार्थ ज्ञानेश्वरी अध्याय/i,
  /^वरील ऑडिओ/i,
  /^हस्तलिखित ग्रंथ$/i,
  /^Romance$/i,
  /^संत माहिती$/i,
  /^शेतमालाची/i,
];

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cleanLine(line) {
  return line
    .replace(/हस्तलिखित ग्रंथ/g, '')
    .replace(/Romance/g, '')
    .replace(/संत माहिती/g, '')
    .replace(/शेतमालाची मोफत जाहिरात करण्या साठी कृषी क्रांती ला अवश्य भेट द्या/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function markerText(line) {
  const markers = [...line.matchAll(/॥[^॥]*॥/g)].map((match) => match[0]);
  return markers.length ? markers[markers.length - 1] : '';
}

function hasMarker(line) {
  return Boolean(markerText(line));
}

function isMeaningLine(line) {
  const marker = markerText(line);
  return marker.includes('-') || marker.includes('–') || marker.includes(',');
}

const lines = source
  .split(/\r?\n/)
  .map(cleanLine)
  .filter(Boolean)
  .filter((line) => !noise.some((pattern) => pattern.test(line)));

const blocks = [];
let verse = [];
let meaning = [];
let readingMeaning = false;

for (const line of lines) {
  if (!readingMeaning) {
    verse.push(line);
    if (hasMarker(line) && !isMeaningLine(line)) readingMeaning = true;
    continue;
  }

  meaning.push(line);
  if (hasMarker(line) && isMeaningLine(line)) {
    blocks.push({ verse, meaning });
    verse = [];
    meaning = [];
    readingMeaning = false;
  }
}

if (verse.length || meaning.length) {
  console.warn(`leftover verse=${verse.length} meaning=${meaning.length}`);
}

const rebuilt = blocks
  .map((block) => `<div class="ovi">${block.verse.map(escapeHtml).join('<br/>')}</div><div class="oviar">${block.meaning.map(escapeHtml).join(' ')}</div>`)
  .join('\n');

const startMarker = '<div class="entry-content clear" itemprop="text">';
const endMarker = '<!-- CONTENT END 1 -->';
const start = page.indexOf(startMarker);
const end = page.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error('page content markers not found');

const before = page.slice(0, start + startMarker.length);
const after = page.slice(end);
const content = `\n\n${rebuilt}\n<p></p>\n<hr/>\n\n<h2 style="text-align: left;"><span style="font-size: 16px;">ref: satsangdhara</span></h2>\n<h2></h2>\n\n`;
fs.writeFileSync(pageFile, before + content + after, 'utf8');
console.log(`restored adhyay-12 pairs=${blocks.length}`);