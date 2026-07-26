const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');

const ROOT = process.cwd();
const SANTS_ROOT = path.join(ROOT, 'Vakibh-media', 'sants');
const MR_DIGITS = ['०','१','२','३','४','५','६','७','८','९'];

const fromMr = (value) => String(value || '').replace(/[०-९]/g, (digit) => String(MR_DIGITS.indexOf(digit)));
const strip = (html) => sanitizeHtml(String(html || ''), { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();

function normalizeComparable(value) {
  return fromMr(strip(value))
    .normalize('NFC')
    .replace(/\babhanga?\b/gi, '')
    .replace(/\bअभंग\b/g, '')
    .replace(/^[\s\d०-९]+[.)\-–—:।॥\s]*/g, '')
    .replace(/[.)\-–—:।॥]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isDuplicateTitleLine(lineHtml, number, title) {
  const text = strip(lineHtml);
  const titleText = normalizeComparable(title);
  const lineText = normalizeComparable(text);
  if (!text || !titleText || !lineText) return false;
  if (lineText === titleText) return true;
  if (!number) return false;

  const plain = fromMr(text).normalize('NFC').replace(/\s+/g, ' ').trim();
  const numbered = new RegExp('^(?:अभंग\\s*)?' + number + '\\s*[.)\\-–—:]?\\s*', 'i');
  return normalizeComparable(plain.replace(numbered, '')) === titleText;
}

function cleanAbhangVerseHtml(html, number, title) {
  let output = String(html || '').trim();
  const leadingStrong = /^(\s*<p\b[^>]*>\s*)<(strong|b)\b[^>]*>([\s\S]*?)<\/\2>\s*<br\s*\/?>/i;
  output = output.replace(leadingStrong, (match, start, tag, label) => (
    isDuplicateTitleLine(label, number, title) ? start : match
  ));

  const leadingLine = /^(\s*<p\b[^>]*>\s*)([^<]{1,180})\s*<br\s*\/?>/i;
  output = output.replace(leadingLine, (match, start, label) => (
    isDuplicateTitleLine(label, number, title) ? start : match
  ));

  const firstParagraphOnly = /^(\s*)<p\b[^>]*>([\s\S]*?)<\/p>\s*/i;
  output = output.replace(firstParagraphOnly, (match, leading, body) => {
    const hasLineBreak = /<br\b/i.test(body);
    if (!hasLineBreak && isDuplicateTitleLine(body, number, title)) return leading;
    return match;
  });

  return output.trim();
}

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

function extractClassBlock(html, className, fromIndex = 0) {
  const tagRe = /<([a-z0-9-]+)\b[^>]*class=["']([^"']*)["'][^>]*>/gi;
  tagRe.lastIndex = fromIndex;
  let match;
  while ((match = tagRe.exec(html))) {
    const classes = match[2].split(/\s+/).filter(Boolean);
    if (!classes.includes(className)) continue;
    const start = match.index;
    const end = findMatchingTag(html, start);
    if (end < 0) return null;
    return { tag: match[1].toLowerCase(), start, end, open: match[0], html: html.slice(start, end) };
  }
  return null;
}

function replaceClassBlocks(html, className, transform) {
  const edits = [];
  let offset = 0;
  while (true) {
    const block = extractClassBlock(html, className, offset);
    if (!block) break;
    const replacement = transform(block);
    if (replacement !== block.html) edits.push({ start: block.start, end: block.end, replacement });
    offset = block.end;
  }
  for (let i = edits.length - 1; i >= 0; i--) {
    const edit = edits[i];
    html = html.slice(0, edit.start) + edit.replacement + html.slice(edit.end);
  }
  return { html, count: edits.length };
}

function innerOf(block) {
  const close = new RegExp('<\\/' + block.tag + '>\\s*$', 'i');
  return block.html.slice(block.open.length).replace(close, '');
}

function replaceInner(block, inner) {
  return block.open + inner + '</' + block.tag + '>';
}

function cleanRangeBlocks(html) {
  return replaceClassBlocks(html, 'abhang-content-block', (article) => {
    const number = Number(/data-abhang-number=["'](\d+)["']/i.exec(article.open)?.[1] || 0);
    const title = strip(/<h3\b[^>]*class=["'][^"']*abhang-content-title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i.exec(article.html)?.[1] || '');
    const verses = extractClassBlock(article.html, 'abhang-readable-verses');
    if (!number || !title || !verses) return article.html;
    const cleaned = cleanAbhangVerseHtml(innerOf(verses), number, title);
    const originalInner = innerOf(verses);
    if (cleaned === originalInner.trim()) return article.html;
    return article.html.slice(0, verses.start) + replaceInner(verses, cleaned) + article.html.slice(verses.end);
  });
}

function cleanPostContent(html) {
  if (!/abhang-post-page|abhang-post-main|abhang-post/.test(html)) return { html, count: 0 };
  const rawTitle = strip(/<h1\b[^>]*class=["'][^"']*post-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] || '');
  if (!rawTitle) return { html, count: 0 };
  const number = Number(fromMr(rawTitle).match(/\d+/)?.[0] || 0);
  const title = rawTitle.replace(/^(?:अभंग\s*)?[०-९0-9]+\s*[.)\-–—:]?\s*/i, '').trim();
  const content = extractClassBlock(html, 'post-content') || extractClassBlock(html, 'entry-content');
  if (!content) return { html, count: 0 };
  const cleaned = cleanAbhangVerseHtml(innerOf(content), number, title || rawTitle);
  if (cleaned === innerOf(content)) return { html, count: 0 };
  return { html: html.slice(0, content.start) + replaceInner(content, cleaned) + html.slice(content.end), count: 1 };
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
let cleanedBlocks = 0;
for (const file of walk(SANTS_ROOT)) {
  let html = fs.readFileSync(file, 'utf8');
  const original = html;
  const rangeResult = cleanRangeBlocks(html);
  html = rangeResult.html;
  cleanedBlocks += rangeResult.count;
  const postResult = cleanPostContent(html);
  html = postResult.html;
  cleanedBlocks += postResult.count;
  html = html.replace(/sant\.css\?v=\d+/g, 'sant.css?v=38');
  if (html !== original) {
    fs.writeFileSync(file, html, 'utf8');
    changedFiles += 1;
  }
}

console.log(JSON.stringify({ changedFiles, cleanedBlocks }, null, 2));
