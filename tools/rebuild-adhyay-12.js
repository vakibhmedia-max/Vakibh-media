const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'Vakibh-media', 'sants', 'dnyaneshwar', 'adhyay-12', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const startMarker = '<div class="entry-content clear" itemprop="text">';
const endMarker = '<!-- CONTENT END 1 -->';
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error('Chapter 12 content markers not found');

const before = html.slice(0, start + startMarker.length);
const content = html.slice(start + startMarker.length, end);
const after = html.slice(end);

function stripTags(value) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function markerText(line) {
  const devanagari = [...line.matchAll(/॥[^॥]*॥/g)].map((m) => m[0]);
  const mojibake = [...line.matchAll(/à¥¥(?:(?!à¥¥).)*à¥¥/g)].map((m) => m[0]);
  const markers = [...devanagari, ...mojibake];
  return markers.length ? markers[markers.length - 1] : '';
}

function isChapterMarker(line) {
  const marker = markerText(line);
  return marker.includes('-') || marker.includes('–') || marker.includes(',');
}

function hasMarker(line) {
  return Boolean(markerText(line));
}

const rawLines = stripTags(content)
  .split('\n')
  .map((line) => line.replace(/\s+/g, ' ').trim())
  .filter(Boolean)
  .filter((line) => !/^ref:/i.test(line) && !/^satsangdhara$/i.test(line));

const blocks = [];
let verse = [];
let meaning = [];
let readingMeaning = false;

for (const line of rawLines) {
  if (!readingMeaning) {
    verse.push(line);
    if (hasMarker(line) && !isChapterMarker(line)) readingMeaning = true;
    continue;
  }

  meaning.push(line);
  if (hasMarker(line) && isChapterMarker(line)) {
    blocks.push({ verse, meaning });
    verse = [];
    meaning = [];
    readingMeaning = false;
  }
}

if (verse.length || meaning.length) {
  blocks.push({ verse, meaning });
}

const rebuilt = blocks
  .filter((block) => block.verse.length && block.meaning.length)
  .map((block) => `<div class="ovi">${block.verse.map(escapeHtml).join('<br/>')}</div><div class="oviar">${block.meaning.map(escapeHtml).join(' ')}</div>`)
  .join('\n');

const finalContent = `\n\n${rebuilt}\n<p></p>\n<hr/>\n\n<h2 style="text-align: left;"><span style="font-size: 16px;">ref: satsangdhara</span></h2>\n<h2></h2>\n\n`;
fs.writeFileSync(file, before + finalContent + after, 'utf8');
console.log(`rebuilt adhyay-12 pairs=${blocks.filter((block) => block.verse.length && block.meaning.length).length}`);