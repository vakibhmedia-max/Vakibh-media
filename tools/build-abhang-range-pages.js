const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');

const ROOT = process.cwd();
const SANTS_ROOT = path.join(ROOT, 'Vakibh-media', 'sants');
const RANGE_PAGE_RE = /(?:^|-)abhang-\d+(?:-(?:to-)?\d+)?$/i;
const MR_DIGITS = ['\u0966','\u0967','\u0968','\u0969','\u096a','\u096b','\u096c','\u096d','\u096e','\u096f'];
const LABELS = {
  abhang: '\u0905\u092d\u0902\u0917',
  count: '\u0905\u092d\u0902\u0917',
  empty: '\u091c\u0941\u0933\u0923\u093e\u0930\u0947 \u0905\u092d\u0902\u0917 \u0938\u093e\u092a\u0921\u0932\u0947 \u0928\u093e\u0939\u0940\u0924.',
  previous: '\u092e\u093e\u0917\u0940\u0932 \u0905\u092d\u0902\u0917 \u0936\u094d\u0930\u0947\u0923\u0940',
  next: '\u092a\u0941\u0922\u0940\u0932 \u0905\u092d\u0902\u0917 \u0936\u094d\u0930\u0947\u0923\u0940',
  copy: '\u0905\u092d\u0902\u0917 \u0915\u0949\u092a\u0940 \u0915\u0930\u093e',
  shareWhatsapp: '\u0935\u094d\u0939\u0949\u091f\u094d\u0938\u0905\u0945\u092a\u0935\u0930 \u0936\u0947\u0905\u0930 \u0915\u0930\u093e',
  shareFacebook: '\u092b\u0947\u0938\u092c\u0941\u0915\u0935\u0930 \u0936\u0947\u0905\u0930 \u0915\u0930\u093e',
  shareInstagram: '\u0907\u0902\u0938\u094d\u091f\u093e\u0917\u094d\u0930\u093e\u092e\u0938\u093e\u0920\u0940 \u0915\u0949\u092a\u0940 \u0915\u0930\u093e',
  rangeNav: '\u0905\u092d\u0902\u0917 \u0930\u0947\u0902\u091c \u0928\u0947\u0935\u094d\u0939\u093f\u0917\u0947\u0936\u0928',
  to: '\u0924\u0947'
};

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const toMr = (value) => String(value).replace(/\d/g, (digit) => MR_DIGITS[Number(digit)]);
const fromMr = (value) => String(value).replace(/[\u0966-\u096f]/g, (digit) => String(MR_DIGITS.indexOf(digit)));
const strip = (html) => sanitizeHtml(String(html || ''), { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
const cleanSnippet = (html) => sanitizeHtml(String(html || ''), {
  allowedTags: ['p','br','strong','b','em','span','div','hr'],
  allowedAttributes: {
    p: ['class','data-devotional-verse'],
    div: ['class','data-devotional-verse'],
    span: ['class'],
    strong: [],
    b: [],
    em: [],
    br: [],
    hr: ['class']
  }
}).replace(/<p>\s*<\/p>/gi, '').trim();

function normalizeComparable(value) {
  return fromMr(strip(value))
    .normalize('NFC')
    .replace(/&nbsp;/gi, ' ')
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
  if (!text) return false;
  const titleText = normalizeComparable(title);
  const lineText = normalizeComparable(text);
  if (!titleText || !lineText) return false;
  if (lineText === titleText) return true;

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
    return { start, end, html: html.slice(start, end), open: match[0] };
  }
  return null;
}

function extractAnchors(html) {
  const block = extractClassBlock(html, 'abhang-list') || extractClassBlock(html, 'abhang-columns');
  if (!block) return [];
  const anchors = [];
  const anchorRe = /<a\b([^>]*?)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRe.exec(block.html))) {
    const tag = '<a ' + match[1] + '>';
    if (!/class=["'][^"']*abhang-item[^"']*["']/i.test(tag) && !/data-(?:abhang-)?number=["'][0-9]+["']/i.test(tag)) continue;
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href) continue;
    const dataNumber = /data-(?:abhang-)?number=["']([0-9]+)["']/i.exec(tag)?.[1];
    const textNumber = fromMr(strip(match[2])).match(/\d+/)?.[0];
    const number = Number(dataNumber || textNumber || anchors.length + 1);
    const title = strip(match[2]).replace(/^[\u0966-\u096f0-9]+\.?\s*/, '').trim() || (LABELS.abhang + ' ' + toMr(number));
    const search = /data-search=["']([\s\S]*?)["']/i.exec(tag)?.[1] || '';
    anchors.push({ href, number, title, search });
  }
  return anchors;
}

function resolveHref(pageFile, href) {
  const clean = href.split('#')[0].split('?')[0];
  const target = path.resolve(path.dirname(pageFile), clean);
  if (clean.endsWith('/') || !path.extname(clean)) return path.join(target, 'index.html');
  return target;
}

function splitDetail(pageHtml) {
  const content = extractClassBlock(pageHtml, 'post-content') || extractClassBlock(pageHtml, 'entry-content');
  if (!content) return null;
  let inner = content.html.replace(/^<[^>]+>/, '').replace(/<\/[^>]+>\s*$/, '');
  inner = inner.replace(/<div\b[^>]*class=["'][^"']*abhang-post-actions[\s\S]*$/i, '').trim();
  inner = inner.replace(/<hr\b[^>]*class=["'][^"']*post-hr[^>]*>[\s\S]*$/i, '').trim();
  return { verseHtml: cleanSnippet(inner) };
}

function actions() {
  return '<div class="abhang-item-actions abhang-card-footer" data-share-scope="item">\n' +
    '          <div class="abhang-actions-left">\n' +
    '            <button class="abhang-btn copy-abhang-btn" type="button" aria-label="' + LABELS.copy + '"><i class="far fa-copy"></i></button>\n' +
    '            <div class="abhang-share-group">\n' +
    '              <button class="abhang-btn social-share-btn whatsapp-share-btn" type="button" data-platform="whatsapp" aria-label="' + LABELS.shareWhatsapp + '"><i class="fab fa-whatsapp"></i></button>\n' +
    '              <button class="abhang-btn social-share-btn facebook-share-btn" type="button" data-platform="facebook" aria-label="' + LABELS.shareFacebook + '"><i class="fab fa-facebook-f"></i></button>\n' +
    '              <button class="abhang-btn social-share-btn instagram-share-btn" type="button" data-platform="instagram" aria-label="' + LABELS.shareInstagram + '"><i class="fab fa-instagram"></i></button>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>';
}

function abhangBlock(item) {
  const id = 'abhang-' + item.number;
  const verseHtml = cleanAbhangVerseHtml(item.verseHtml, item.number, item.title);
  const search = esc((item.number + ' ' + toMr(item.number) + ' ' + item.title + ' ' + strip(verseHtml) + ' ' + item.search).toLowerCase());
  return '<article class="abhang-content-block" id="' + id + '" data-abhang-number="' + item.number + '" data-search="' + search + '">\n' +
    '        <header class="abhang-content-header">\n' +
    '          <span class="abhang-content-number">' + LABELS.abhang + ' ' + toMr(item.number) + '</span>\n' +
    '          <h3 class="abhang-content-title">' + esc(item.title) + '</h3>\n' +
    '        </header>\n' +
    '        <div class="abhang-readable-verses" data-devotional-verse="true">' + verseHtml + '</div>\n' +
    '        ' + actions() + '\n' +
    '      </article>';
}

function getPageTitle(html, fallback) {
  return strip(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] || /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || fallback);
}

function rangeFromName(name, items) {
  const nums = [...name.matchAll(/\d+/g)].map((m) => Number(m[0]));
  if (nums.length >= 2) return { start: nums[0], end: nums[1] };
  if (items.length) return { start: items[0].number, end: items[items.length - 1].number };
  return { start: 0, end: 0 };
}

function normalizeRangeLabel(range) {
  return toMr(range.start) + ' ' + LABELS.to + ' ' + toMr(range.end);
}

function discoverRangePages(santDir) {
  const pages = [];
  for (const dirent of fs.readdirSync(santDir, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const file = path.join(santDir, dirent.name, 'index.html');
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    const anchors = extractAnchors(html);
    if (!anchors.length) continue;
    if (!RANGE_PAGE_RE.test(dirent.name) && !/range|natache-abhang/i.test(dirent.name)) continue;
    const range = rangeFromName(dirent.name, anchors);
    pages.push({ slug: dirent.name, file, html, anchors, range });
  }
  return pages.sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end || a.slug.localeCompare(b.slug));
}

function walkHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtmlFiles(full, files);
    else if (entry.isFile() && entry.name === 'index.html') files.push(full);
  }
  return files;
}

function discoverCanonicalNavigationPages(santDir, fallbackPages) {
  const bySlug = new Map(fallbackPages.map((page) => [page.slug, page]));
  const seen = new Map();
  for (const file of walkHtmlFiles(santDir)) {
    const html = fs.readFileSync(file, 'utf8');
    if (/abhang-range-page/.test(html)) continue;
    if (!/sahitya-links-grid/.test(html)) continue;
    const linkRe = /href=["']\.\.\/(abhang-\d+(?:-to-\d+)?)\/index\.html["']/g;
    let match;
    while ((match = linkRe.exec(html))) {
      const page = bySlug.get(match[1]);
      if (page) seen.set(page.slug, page);
    }
  }
  const pages = seen.size ? [...seen.values()] : fallbackPages;
  return pages.sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end || a.slug.localeCompare(b.slug));
}

function rangeLinkLabel(prefix, page) {
  return prefix + ': ' + LABELS.abhang + ' ' + normalizeRangeLabel(page.range);
}

function bottomNavigation(pages, current) {
  const index = pages.findIndex((page) => page.slug === current.slug);
  if (index < 0) return '';
  const prev = index > 0 ? pages[index - 1] : null;
  const next = index + 1 < pages.length ? pages[index + 1] : null;
  if (!prev && !next) return '';
  return '<nav class="abhang-range-bottom-nav" aria-label="' + LABELS.rangeNav + '">\n' +
    (prev ? '        <div><a class="abhang-range-nav-link" href="../' + prev.slug + '/index.html"><span>&larr;</span> ' + rangeLinkLabel(LABELS.previous, prev) + '</a></div>\n' : '') +
    (next ? '        <div><a class="abhang-range-nav-link" href="../' + next.slug + '/index.html">' + rangeLinkLabel(LABELS.next, next) + ' <span>&rarr;</span></a></div>\n' : '') +
    '      </nav>';
}

function replaceFirstBlock(html, className, replacement) {
  const block = extractClassBlock(html, className);
  if (!block) return html;
  return html.slice(0, block.start) + replacement + html.slice(block.end);
}

function upsertBodyClass(html, className) {
  return html.replace(/<body\b([^>]*)>/i, (match, attrs) => {
    if (/class=["']/.test(attrs)) {
      return match.replace(/class=["']([^"']*)["']/, (m, classes) => 'class="' + (classes.includes(className) ? classes : (classes + ' ' + className).trim()) + '"');
    }
    return '<body' + attrs + ' class="' + className + '">';
  });
}

function updateAssetVersions(html) {
  return html.replace(/style\.css\?v=\d+/g, 'style.css?v=42').replace(/sant\.css\?v=\d+/g, 'sant.css?v=38').replace(/main\.js\?v=\d+/g, 'main.js?v=45');
}

function transformRangePage(page, pages) {
  const items = [];
  for (const anchor of page.anchors) {
    const target = resolveHref(page.file, anchor.href);
    if (!fs.existsSync(target)) continue;
    const detail = splitDetail(fs.readFileSync(target, 'utf8'));
    if (!detail || !detail.verseHtml) continue;
    items.push({ ...anchor, ...detail });
  }
  if (!items.length) return false;
  const title = getPageTitle(page.html, page.slug);
  const content = '<div class="abhang-content-list" id="abhangContentList" data-total-count="' + items.length + '">\n      ' +
    items.map(abhangBlock).join('\n') +
    '\n      </div>\n      <p class="abhang-empty-state" id="abhangEmptyState" hidden>' + LABELS.empty + '</p>\n      ' + bottomNavigation(pages, page);

  let html = page.html;
  html = upsertBodyClass(html, 'abhang-range-page');
  html = html.replace(/<input([^>]*?)id=["']abhangSearch["']([^>]*)>/i, '<input$1id="abhangRangeSearch"$2>');
  html = html.replace(/(<span\b[^>]*id=["']countPill["'][^>]*>)[\s\S]*?(<\/span>)/i, '$1' + toMr(items.length) + ' ' + LABELS.count + '$2');
  html = html.replace(/<h2\b([^>]*)class=["']([^"']*abhang-grid-heading[^"']*)["']([^>]*)>[\s\S]*?<\/h2>/i, '<h2$1class="$2"$3>' + esc(title) + '</h2>');
  html = extractClassBlock(html, 'abhang-list') ? replaceFirstBlock(html, 'abhang-list', content) : replaceFirstBlock(html, 'abhang-columns', content);
  html = html.replace(/<nav\b[^>]*class=["'][^"']*abhang-range-tabs[\s\S]*?<\/nav>\s*/i, '');
  html = html.replace(/<script>\s*\(function\(\)\{[\s\S]*?const all=\[[\s\S]*?\}\)\(\);\s*<\/script>/gi, '');
  html = updateAssetVersions(html);
  fs.writeFileSync(page.file, html, 'utf8');
  return true;
}

function main() {
  const changed = [];
  const skipped = [];
  for (const sant of fs.readdirSync(SANTS_ROOT, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const santDir = path.join(SANTS_ROOT, sant.name);
    const pages = discoverRangePages(santDir);
    if (!pages.length) continue;
    const navigationPages = discoverCanonicalNavigationPages(santDir, pages);
    for (const page of pages) {
      try {
        if (transformRangePage(page, navigationPages)) changed.push(path.relative(ROOT, page.file));
        else skipped.push(path.relative(ROOT, page.file));
      } catch (error) {
        skipped.push(path.relative(ROOT, page.file) + ': ' + error.message);
      }
    }
  }
  console.log(JSON.stringify({ changed: changed.length, skipped: skipped.length, changedSample: changed.slice(0, 20), skippedSample: skipped.slice(0, 10) }, null, 2));
}

main();


