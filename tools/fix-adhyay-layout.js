const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'Vakibh-media', 'sants', 'dnyaneshwar');
const utf8 = 'utf8';
const marker = /॥\s*(?:[०-९0-9]+\s*[-–]\s*)?[०-९0-9]+\s*॥/;

function stripTags(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function splitLines(inner) {
  return inner
    .replace(/<\/?(strong|b)>/gi, '')
    .split(/<br\s*\/?>/i)
    .map((line) => line.trim())
    .filter((line) => stripTags(line));
}

function wrapOvi(lines) {
  return `<div class="ovi">${lines.join('<br/>')}</div>`;
}

function wrapMeaning(lines) {
  return `<div class="oviar">${lines.join('<br/>')}</div>`;
}

function convertParagraph(inner, attrs = '') {
  const text = stripTags(inner);
  if (!marker.test(text) || !/<br\s*\/?>/i.test(inner)) return null;

  const lines = splitLines(inner);
  if (!lines.length) return null;

  const pairs = [];
  let verse = [];
  let meaning = [];
  let readingMeaning = false;

  for (const line of lines) {
    if (!readingMeaning) {
      verse.push(line);
      if (marker.test(stripTags(line))) readingMeaning = true;
      continue;
    }

    meaning.push(line);
    if (marker.test(stripTags(line))) {
      pairs.push({ verse, meaning });
      verse = [];
      meaning = [];
      readingMeaning = false;
    }
  }

  if (!pairs.length) return null;

  const output = [];
  for (const pair of pairs) {
    output.push(wrapOvi(pair.verse));
    output.push(wrapMeaning(pair.meaning));
  }

  const tail = [...verse, ...meaning].filter((line) => stripTags(line));
  if (tail.length) output.push(`<p${attrs}>${tail.join('<br/>')}</p>`);
  return output.join('');
}

function convertSeparatedParagraphs(html) {
  let changed = false;
  const converted = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (full, attrs, inner) => {
    const text = stripTags(inner);
    if (!text || !marker.test(text)) return full;
    if (/class\s*=\s*["'][^"']*\b(hdr|end|ref)\b/i.test(attrs)) return full;
    const convertedInner = convertParagraph(inner, attrs);
    if (!convertedInner) return full;
    changed = true;
    return convertedInner;
  });
  return { html: converted, changed };
}

function convertStrongPlusMeaning(html) {
  let changed = false;
  const pairRe = /<p([^>]*)>\s*<strong>([\s\S]*?)<\/strong>\s*<br\s*\/?>\s*<\/p>\s*<p([^>]*)>([\s\S]*?)<\/p>/gi;
  const converted = html.replace(pairRe, (full, oviAttrs, oviInner, meaningAttrs, meaningInner) => {
    const oviText = stripTags(oviInner);
    const meaningText = stripTags(meaningInner);
    if (!marker.test(oviText) || !marker.test(meaningText)) return full;
    if (/class\s*=\s*["'][^"']*\b(hdr|end|ref)\b/i.test(oviAttrs + meaningAttrs)) return full;
    changed = true;
    return `${wrapOvi(splitLines(oviInner))}${wrapMeaning(splitLines(meaningInner))}`;
  });
  return { html: converted, changed };
}

function convertStrongParagraphPairs(html) {
  let changed = false;
  const pairRe = /<p([^>]*)>(?=[\s\S]*?<strong>)([\s\S]*?॥\s*(?:[०-९0-9]+\s*[-–]\s*)?[०-९0-9]+\s*॥[\s\S]*?)<\/p>\s*<p([^>]*)>([\s\S]*?॥\s*(?:[०-९0-9]+\s*[-–]\s*)?[०-९0-9]+\s*॥[\s\S]*?)<\/p>/gi;
  const converted = html.replace(pairRe, (full, oviAttrs, oviInner, meaningAttrs, meaningInner) => {
    if (!/<strong>/i.test(oviInner)) return full;
    if (/class\s*=\s*["'][^"']*\b(hdr|end|ref)\b/i.test(oviAttrs + meaningAttrs)) return full;
    if (!marker.test(stripTags(oviInner)) || !marker.test(stripTags(meaningInner))) return full;
    changed = true;
    return `${wrapOvi(splitLines(oviInner))}${wrapMeaning(splitLines(meaningInner))}`;
  });
  return { html: converted, changed };
}

function flattenLegacyOviarWrappers(html) {
  return html
    .replace(/<div class="oviar">\s*<div class="oviar">/gi, '<div class="oviar"><div class="meaning-inner">')
    .replace(/<div class="oviar"\s+style="text-align:\s*center;?">\s*(?=<div class="ovi">)/gi, '<div class="legacy-adhyay-content">')
    .replace(/<div class="oviar"\s+style="text-align:\s*center;?">/gi, '<div class="legacy-adhyay-content">');
}

function repairVerseClasses(html) {
  const contentStart = html.indexOf('<div class="entry-content');
  if (contentStart < 0) return html;
  const contentEnd = html.indexOf('<!-- CONTENT END', contentStart);
  const end = contentEnd > contentStart ? contentEnd : html.length;
  const content = html.slice(contentStart, end);
  const matches = [...content.matchAll(/<div\s+class="(ovi|oviar)"[^>]*>/g)];
  const replacements = [];

  for (let i = 0; i < matches.length; i += 2) {
    const first = matches[i];
    const second = matches[i + 1];
    if (!first || !second) continue;
    if (first[1] === 'oviar' && second[1] === 'oviar') {
      const firstBody = content.slice(first.index + first[0].length, second.index);
      if (/#ff6600/i.test(firstBody) || /color:\s*orange/i.test(firstBody)) replacements.push(contentStart + first.index);
    }
  }

  let output = html;
  for (const index of replacements.reverse()) {
    output = `${output.slice(0, index)}<div class="ovi"${output.slice(index + '<div class="oviar"'.length)}`;
  }
  return output;
}

function chapterNumber(name) {
  return Number(name.replace('adhyay-', ''));
}

const dirs = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^adhyay-\d+$/.test(entry.name))
  .sort((a, b) => chapterNumber(a.name) - chapterNumber(b.name));

for (const dir of dirs) {
  const file = path.join(root, dir.name, 'index.html');
  let html = fs.readFileSync(file, utf8);
  const original = html;

  for (let i = 0; i < 4; i++) {
    const strongPairPass = convertStrongParagraphPairs(html);
    html = strongPairPass.html;
    const strongPass = convertStrongPlusMeaning(html);
    html = strongPass.html;
    const paragraphPass = convertSeparatedParagraphs(html);
    html = paragraphPass.html;
    if (!strongPairPass.changed && !strongPass.changed && !paragraphPass.changed) break;
  }

  html = flattenLegacyOviarWrappers(html);
  html = repairVerseClasses(html);
  html = html.replace(/<div class=(ovi|oviar)>/g, '<div class="$1">');

  if (html !== original) {
    fs.writeFileSync(file, html, utf8);
    console.log(`updated ${dir.name}`);
  }
}