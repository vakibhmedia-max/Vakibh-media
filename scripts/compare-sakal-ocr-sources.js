const fs = require('fs');

const archiveLines = fs.readFileSync('database/sakal-gatha-internet-archive-ocr.txt', 'utf8').split(/\r?\n/).slice(0, 30000);
const html = fs.readFileSync('Vakibh-media/puravni-abhang/index.html', 'utf8');
const digits = '०१२३४५६७८९';
const toNumber = (value) => Number([...String(value)].map((character) => digits.indexOf(character)).filter((digit) => digit >= 0).join(''));
const decode = (value) => String(value)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/<[^>]+>/g, '').trim();
const normalize = (value) => String(value).normalize('NFC').replace(/[^\p{Script=Devanagari}]+/gu, '');
const grams = (value) => {
  const normalized = normalize(value);
  const result = new Set();
  for (let index = 0; index + 2 < normalized.length; index += 1) result.add(normalized.slice(index, index + 3));
  return result;
};
const similarity = (left, right) => {
  const a = grams(left);
  const b = grams(right);
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const item of a) if (b.has(item)) common += 1;
  return (2 * common) / (a.size + b.size);
};
const quality = (value) => {
  const compact = String(value).replace(/\s/g, '');
  const devanagari = (compact.match(/[\p{Script=Devanagari}]/gu) || []).length;
  const garbage = (compact.match(/[<>$&_=+*\[\]{}]/g) || []).length;
  return compact.length ? devanagari / compact.length - garbage / compact.length * 3 : 0;
};

const archiveMarkers = [];
for (let index = 0; index < archiveLines.length; index += 1) {
  const match = archiveLines[index].match(/^\s*[^०-९\n]{0,12}([०-९]{2,5})[,.)]?\s+(.+)/u);
  if (!match) continue;
  const number = toNumber(match[1]);
  if (number < 1 || number > 4420) continue;
  archiveMarkers.push({ number, line: index, bodyStart: match[2] });
}
const archiveCards = new Map();
for (let index = 0; index < archiveMarkers.length; index += 1) {
  const marker = archiveMarkers[index];
  const next = archiveMarkers.slice(index + 1).find((candidate) => candidate.line - marker.line <= 35
    && candidate.number > marker.number && candidate.number - marker.number <= 12);
  const endLine = next ? next.line : Math.min(archiveLines.length, marker.line + 20);
  const body = [marker.bodyStart, ...archiveLines.slice(marker.line + 1, endLine)].join('\n').trim();
  if (body.length < 20 || body.length > 5000) continue;
  const previous = archiveMarkers[index - 1]?.number;
  const following = next?.number;
  const sequenceScore = (previous < marker.number ? marker.number - previous : 10000)
    + (following > marker.number ? following - marker.number : 10000);
  const items = archiveCards.get(marker.number) || [];
  items.push({ body, sequenceScore });
  archiveCards.set(marker.number, items);
}

const renderedCards = new Map();
const expression = /<section class="puravni-abhang-group" data-category="([^"]+)" data-abhang-number="([०-९]+)"[\s\S]*?<p>([\s\S]*?)<\/p>/gu;
for (const match of html.matchAll(expression)) {
  const number = toNumber(match[2]);
  if (number >= 1 && number <= 4420) renderedCards.set(number, { category: match[1], body: decode(match[3]) });
}

const candidates = [];
for (const [number, rendered] of renderedCards) {
  const alternatives = archiveCards.get(number);
  if (!alternatives) continue;
  const ranked = alternatives.map((archive) => ({ ...archive, score: similarity(rendered.body, archive.body) }))
    .sort((left, right) => right.score - left.score || left.sequenceScore - right.sequenceScore);
  const archive = ranked[0];
  const score = archive.score;
  const qualityGain = quality(archive.body) - quality(rendered.body);
  if (score < 0.72 || qualityGain > 0.04) candidates.push({ number, category: rendered.category, score, qualityGain, currentLength: rendered.body.length, archiveLength: archive.body.length });
}
candidates.sort((left, right) => right.qualityGain - left.qualityGain || left.score - right.score);
console.log(JSON.stringify({ rendered: renderedCards.size, archive: archiveCards.size, comparable: [...renderedCards.keys()].filter((number) => archiveCards.has(number)).length, review: candidates.length, top: candidates.slice(0, 100) }, null, 2));
