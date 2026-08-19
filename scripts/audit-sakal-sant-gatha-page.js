const fs = require('fs');

const generator = fs.readFileSync('scripts/build-sakal-sant-gatha-page.js', 'utf8');
const rangeSource = generator.match(/const expectedRanges = (\{[\s\S]*?\n\});/);
if (!rangeSource) throw new Error('expectedRanges was not found in the generator.');
const expectedRanges = Function(`"use strict"; return (${rangeSource[1]})`)();
const omissionSource = generator.match(/const documentedPrintedOmissions = (\{[^;]+\});/);
const documentedPrintedOmissions = omissionSource ? Function(`"use strict"; return (${omissionSource[1]})`)() : {};
const html = fs.readFileSync('Vakibh-media/puravni-abhang/index.html', 'utf8');
const digits = '०१२३४५६७८९';
const numberValue = (value) => Number([...String(value)].map((character) => digits.indexOf(character)).filter((digit) => digit >= 0).join(''));

let missingTotal = 0;
let duplicateTotal = 0;
let mainCards = 0;
for (const [category, [start, end]] of Object.entries(expectedRanges)) {
  const expression = new RegExp(`data-category="${category}" data-abhang-number="([०-९]+)"`, 'g');
  const numbers = [...html.matchAll(expression)].map((match) => numberValue(match[1])).filter((number) => number >= start && number <= end);
  const counts = new Map();
  for (const number of numbers) counts.set(number, (counts.get(number) || 0) + 1);
  const missing = [];
  const duplicates = [];
  for (let number = start; number <= end; number += 1) {
    if ((documentedPrintedOmissions[category] || []).includes(number)) continue;
    if (!counts.has(number)) missing.push(number);
    if ((counts.get(number) || 0) > 1) duplicates.push(number);
  }
  mainCards += numbers.length;
  missingTotal += missing.length;
  duplicateTotal += duplicates.length;
  if (missing.length || duplicates.length) {
    console.log(`${category}: missing=[${missing.join(',')}] duplicates=[${duplicates.join(',')}]`);
  }
}

const cards = (html.match(/class="puravni-abhang-group"/g) || []).length;
const footers = (html.match(/class="abhang-card-footer puravni-card-actions"/g) || []).length;
const categoryButtons = (html.match(/class="puravni-index-button/g) || []).length;
const shareControls = {
  copy: (html.match(/class="abhang-btn copy-abhang-btn"/g) || []).length,
  whatsapp: (html.match(/class="abhang-btn social-share-btn whatsapp-share-btn"/g) || []).length,
  facebook: (html.match(/class="abhang-btn social-share-btn facebook-share-btn"/g) || []).length,
  instagram: (html.match(/class="abhang-btn social-share-btn instagram-share-btn"/g) || []).length,
  directLink: (html.match(/class="abhang-btn puravni-link-btn"/g) || []).length,
};
const documentedOmissionCount = Object.values(documentedPrintedOmissions).flat().length;
const shortMainCards = [];
const longMainCards = [];
const cardsByNormalizedBody = new Map();
const cardExpression = /<section class="puravni-abhang-group" data-category="([^"]+)" data-abhang-number="([०-९]+)"[\s\S]*?<p>([\s\S]*?)<\/p>/gu;
for (const match of html.matchAll(cardExpression)) {
  const number = numberValue(match[2]);
  if (number < 1 || number > 4420) continue;
  const body = match[3].replace(/&[^;]+;/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const normalizedBody = body.normalize('NFC').replace(/[^ऀ-ॿ]+/gu, '');
  if (normalizedBody.length >= 40) {
    const owners = cardsByNormalizedBody.get(normalizedBody) || [];
    owners.push({ category: match[1], number, length: normalizedBody.length });
    cardsByNormalizedBody.set(normalizedBody, owners);
  }
  if (body.length < 80) shortMainCards.push({ category: match[1], number, length: body.length });
  if (body.length > 1500) longMainCards.push({ category: match[1], number, length: body.length });
}
longMainCards.sort((left, right) => right.length - left.length);
const duplicateBodyGroups = [...cardsByNormalizedBody.values()]
  .filter((owners) => owners.length > 1)
  .sort((left, right) => right[0].length - left[0].length);
const lengthThresholds = Object.fromEntries(
  [1000, 1500, 2000, 3000].map((threshold) => [
    `over${threshold}`,
    longMainCards.filter((card) => card.length > threshold).length,
  ]),
);
console.log(JSON.stringify({
  categoryButtons,
  cards,
  mainCards,
  footers,
  shareControls,
  missingTotal,
  duplicateTotal,
  documentedPrintedOmissions,
  documentedOmissionCount,
  shortMainCards,
  duplicateBodyGroupCount: duplicateBodyGroups.length,
  duplicateBodyCardCount: duplicateBodyGroups.reduce((total, owners) => total + owners.length, 0),
  largestDuplicateBodyGroups: duplicateBodyGroups.slice(0, 25),
  longMainCardCount: longMainCards.length,
  lengthThresholds,
  longestMainCards: longMainCards.slice(0, 50),
}, null, 2));
if (categoryButtons !== 52 || cards !== footers || Object.values(shareControls).some((count) => count !== cards) || missingTotal || duplicateTotal) process.exitCode = 1;
