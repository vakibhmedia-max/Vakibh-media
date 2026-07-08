const fs = require('fs');
const path = require('path');

function splitCombinedText(text) {
  const clean = text.replace(/<\/?(strong|b)>/gi, '').replace(/<br\s*\/?>/gi, '\n');
  const lines = clean.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length >= 2) return { verse: lines[0], meaning: lines.slice(1).join(' ') };
  const plain = clean.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const markerMatch = plain.match(/॥\s*[०-९0-9]+\s*॥/);
  if (!markerMatch) return null;
  const splitAt = markerMatch.index + markerMatch[0].length;
  return { verse: plain.slice(0, splitAt).trim(), meaning: plain.slice(splitAt).trim() };
}

function convertLegacyParagraph(file, markerNeedle) {
  let html = fs.readFileSync(file, 'utf8');
  const original = html;
  html = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (full, attrs, inner) => {
    const plain = inner.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plain.includes(markerNeedle)) return full;
    const split = splitCombinedText(inner);
    if (!split || !split.verse || !split.meaning) return full;
    return `<div class="ovi">${split.verse}</div><div class="oviar">${split.meaning}</div>`;
  });
  if (html !== original) fs.writeFileSync(file, html, 'utf8');
}

convertLegacyParagraph(path.join('Vakibh-media','sants','dnyaneshwar','adhyay-5','index.html'), '॥ १७ ॥');
convertLegacyParagraph(path.join('Vakibh-media','sants','dnyaneshwar','adhyay-6','index.html'), '॥६-५१॥');