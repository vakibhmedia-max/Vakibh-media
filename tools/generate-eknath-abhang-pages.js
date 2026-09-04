const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');
const { execFileSync } = require('child_process');

const root = process.cwd();
const santDir = path.join(root, 'Vakibh-media', 'sants', 'eknath');
const sourceOverrides = new Map([
  ['abhang-1-to-102', 'C:/tmp/eknath-abhang-1-to-102-source.html'],
  ['abhang-202-to-469', 'git:222b3ef0:Vakibh-media/sants/eknath/abhang-202-to-469/index.html'],
  ['abhang-480-to-666', 'git:222b3ef0:Vakibh-media/sants/eknath/abhang-480-to-666/index.html'],
  ['abhang-667-to-910', 'git:222b3ef0:Vakibh-media/sants/eknath/abhang-667-to-910/index.html'],
  ['abhang-911-to-1191', 'git:222b3ef0:Vakibh-media/sants/eknath/abhang-911-to-1191/index.html'],
  ['abhang-1120-to-1323', 'git:222b3ef0:Vakibh-media/sants/eknath/abhang-1120-to-1323/index.html'],
  ['abhang-1324-to-1530', 'git:222b3ef0:Vakibh-media/sants/eknath/abhang-1324-to-1530/index.html'],
  ['abhang-1531-to-1750', 'git:222b3ef0:Vakibh-media/sants/eknath/abhang-1531-to-1750/index.html'],
  ['abhang-1751-to-1900', 'git:222b3ef0:Vakibh-media/sants/eknath/abhang-1751-to-1900/index.html'],
  ['abhang-1901-to-2132', 'git:222b3ef0:Vakibh-media/sants/eknath/abhang-1901-to-2132/index.html'],
  ['eknath-abhang-2133-to-2275', 'git:222b3ef0:Vakibh-media/sants/eknath/eknath-abhang-2133-to-2275/index.html'],
  ['abhang-2276-to-2573', 'git:222b3ef0:Vakibh-media/sants/eknath/abhang-2276-to-2573/index.html'],
  ['abhang-2574-to-2780', 'C:/tmp/eknath-abhang-2574-to-2780-source.html'],
  ['abhang-2781-to-3012', 'C:/tmp/eknath-abhang-2781-to-3012-source.html'],
  ['abhang-3013-to-3220', 'C:/tmp/eknath-abhang-3013-to-3220-source.html'],
  ['abhang-3221-to-3343', 'C:/tmp/eknath-abhang-3221-to-3343-source.html'],
  ['abhang-3344-to-3487', 'git:222b3ef0:Vakibh-media/sants/eknath/abhang-3344-to-3487/index.html'],
  ['abhang-3488-to-3688', 'git:222b3ef0:Vakibh-media/sants/eknath/abhang-3488-to-3688/index.html'],
]);
const localRangeDirs = [
  'abhang-1-to-102','abhang-202-to-469','abhang-480-to-666','abhang-667-to-910','abhang-911-to-1191',
  'abhang-1120-to-1323','abhang-1324-to-1530','abhang-1531-to-1750','abhang-1751-to-1900','abhang-1901-to-2132',
  'eknath-abhang-2133-to-2275','abhang-2276-to-2573','abhang-2574-to-2780','abhang-2781-to-3012',
  'abhang-3013-to-3220','abhang-3221-to-3343','abhang-3344-to-3487','abhang-3488-to-3688'
];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mrDigits = ['०','१','२','३','४','५','६','७','८','९'];
const toMr = n => String(n).replace(/\d/g, d => mrDigits[Number(d)]);
const fromMr = s => String(s).replace(/[०-९]/g, ch => String(mrDigits.indexOf(ch)));
const strip = html => sanitizeHtml(html, {allowedTags: [], allowedAttributes: {}}).replace(/\s+/g, ' ').trim();
const cleanHtml = html => sanitizeHtml(html, {
  allowedTags: ['p','br','strong','b','em','span','h2','h3','hr'],
  allowedAttributes: { p: ['class'], span: [], strong: [], b: [], em: [], h2: [], h3: [] },
}).replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '').replace(/\s*<hr\s*\/?>(\s*)/gi, '').trim();
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
  const plain = fromMr(text).normalize('NFC').replace(/\s+/g, ' ').trim();
  const numbered = new RegExp('^(?:अभंग\\s*)?' + number + '\\s*[.)\\-–—:]?\\s*', 'i');
  return normalizeComparable(plain.replace(numbered, '')) === titleText;
}

function cleanAbhangVerseHtml(html, number, title) {
  let output = String(html || '').trim();
  output = output.replace(/^(\s*<p\b[^>]*>\s*)<(strong|b)\b[^>]*>([\s\S]*?)<\/\2>\s*<br\s*\/?>/i, (match, start, tag, label) => (
    isDuplicateTitleLine(label, number, title) ? start : match
  ));
  output = output.replace(/^(\s*<p\b[^>]*>\s*)([^<]{1,180})\s*<br\s*\/?>/i, (match, start, label) => (
    isDuplicateTitleLine(label, number, title) ? start : match
  ));
  output = output.replace(/^(\s*)<p\b[^>]*>([\s\S]*?)<\/p>\s*/i, (match, leading, body) => {
    if (!/<br\b/i.test(body) && isDuplicateTitleLine(body, number, title)) return leading;
    return match;
  });
  return output.trim();
}

function getContent(html, sourceKind) {
  const scrub = value => value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<a\s+[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  if (sourceKind === 'remote') {
    const startMatch = html.match(/<div\s+class="entry-content clear"[\s\S]*?>/);
    if (startMatch) {
      const start = startMatch.index + startMatch[0].length;
      let end = html.indexOf("</article>", start);
      if (end < start) end = html.length;
      return scrub(html.slice(start, end)).replace(/<div[^>]*dir=["']auto["'][^>]*>/gi, '<p>').replace(/<div[^>]*>/gi, '').replace(/<\/div>/gi, '</p>');
    }
  }
  html = scrub(html);
  const startMatch = html.match(/<div[^>]*class=["'][^"']*post-content[^"']*["'][^>]*>/i);
  const looseStart = html.indexOf('post-content');
  if (startMatch || looseStart >= 0) {
    const start = startMatch ? startMatch.index + startMatch[0].length : html.indexOf('>', looseStart) + 1;
    let end = html.indexOf('<div class="abhang-post-actions', start + 1);
    if (end > start) return html.slice(start, end);
  }
  return html;
}

function extractRange(dir) {
  const override = sourceOverrides.get(dir);
  const file = override || path.join(santDir, dir, 'index.html');
  const isGitSource = typeof file === 'string' && file.startsWith('git:');
  if (!isGitSource && !fs.existsSync(file)) return [];
  const sourceKind = override && !isGitSource && !file.endsWith('-head.html') ? 'remote' : 'local';
  const raw = isGitSource ? execFileSync('git', ['show', file.slice(4)], {encoding: 'utf8', maxBuffer: 1024 * 1024 * 8}) : fs.readFileSync(file, 'utf8');
  let content = getContent(raw, sourceKind);
  content = content
    .replace(/<p[^>]*>\s*संत एकनाथ[^<]*(?:अभंग)?[^<]*(?:गाथा)?\s*<\/p>/gi, '')
    .replace(/<h2[^>]*>\s*<strong[^>]*>\s*संत एकनाथ अभंग[\s\S]*?<\/strong>\s*<\/h2>/gi, '')
    .replace(/<h3[^>]*>[\s\S]*?संत एकनाथ अभंग[\s\S]*?<\/h3>/gi, '')
    .replace(/(<br\s*\/?>\s*)([०-९0-9]{1,4})\s*\.?\s*<br\s*\/?>/gi, '$1</p><p>$2</p><p>');
  const marker = /<p[^>]*>\s*(?:<strong[^>]*>)?\s*(?:<span[^>]*>)?\s*([०-९0-9]{1,4})\s*\.?\s*(?:<\/span>)?\s*(?:<\/strong>)?\s*(?:<br\s*\/?>|<\/p>)/gi;
  const matches = [...content.matchAll(marker)].map(m => ({num: Number(fromMr(m[1])), index: m.index, len: m[0].length})).filter(m => m.num > 0 && m.num < 5000);
  const entries = [];
  let section = '';
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const before = content.slice(i === 0 ? 0 : matches[i-1].index + matches[i-1].len, m.index);
    const heading = [...before.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)].map(h => strip(h[1])).filter(Boolean).pop();
    if (heading && !/संत एकनाथ अभंग/.test(heading)) section = heading;
    const body = content.slice(m.index + m.len, i + 1 < matches.length ? matches[i+1].index : content.length).trim();
    const parts = body.split(/<p[^>]*>\s*(?:<strong[^>]*>)?\s*अर्थ\s*:-\s*(?:<\/strong>)?\s*<\/p>/i);
    const verseHtml = cleanHtml(parts[0] || '');
    const meaningHtml = cleanHtml(parts.slice(1).join('<p><strong>अर्थ:-</strong></p>') || '');
    const title = firstLine(verseHtml) || section || `अभंग ${toMr(m.num)}`;
    if (verseHtml && !entries.some(e => e.number === m.num)) {
      entries.push({ number: m.num, section, title, verseHtml, meaningHtml });
    }
  }
  return entries;
}

function firstLine(html) {
  let txt = strip(html).replace(/^\d+\.?\s*/, '').replace(/^[०-९]+\.?\s*/, '').trim();
  txt = txt.split(/[।॥\.]/)[0].trim();
  return txt.length > 70 ? txt.slice(0, 70).trim() : txt;
}

function header(depth) {
  const prefix = depth === 2 ? '../../' : '../../../';
  return `<!DOCTYPE html>\n<html lang="mr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">`;
}
function siteHeader(prefix) { return `\n  <header>\n    <div class="header-container">\n      <a href="${prefix}index.html" class="logo-link"><img src="${prefix}Vakibh/vaakibh_logo.svg" alt="वाकीभ लोगो" class="logo-img"></a>\n      <button class="menu-toggle" id="menuToggle" aria-label="मुख्य मेनू उघडा"><i class="fas fa-bars"></i></button>\n      <nav id="navMenu"><ul><li><a href="${prefix}index.html">मुखपृष्ठ</a></li><li><a href="${prefix}index.html#abhangs">अभंग/भजन</a></li><li><a href="${prefix}index.html#saints">संत</a></li><li><a href="${prefix}index.html#categories">विभाग</a></li><li><a href="${prefix}contact/index.html">संपर्क</a></li></ul></nav>\n      <div class="header-actions"><div class="lang-switch-group" aria-label="भाषा निवडा"><button class="lang-switch active" type="button" data-language="marathi">मराठी</button></div><button class="search-trigger-btn" id="searchTrigger" aria-label="शोध उघडा"><i class="fas fa-search"></i></button></div>\n    </div>\n  </header>`; }
function footer(prefix) { return `\n  <footer>\n    <div class="footer-container"><div class="footer-brand"><div class="footer-logo"><img src="${prefix}Vakibh/vaakibh_logo.svg" alt="वाकीभ लोगो"><h3>वाकीभ</h3></div><p>संत साहित्य, अभंग, ओव्या आणि ग्रंथांचा समृद्ध मराठी संग्रह. वारकरी परंपरेचे जतन, संवर्धन आणि प्रसार हा आमचा प्रयत्न.</p><div class="footer-socials"><a href="#" class="social-link" aria-label="फेसबुक"><i class="fab fa-facebook-f"></i></a><a href="#" class="social-link" aria-label="इंस्टाग्राम"><i class="fab fa-instagram"></i></a></div></div><div class="footer-links"><h4>मेन्यू</h4><ul><li><a href="${prefix}index.html">मुखपृष्ठ</a></li><li><a href="${prefix}index.html#granth">ग्रंथ</a></li><li><a href="${prefix}index.html#abhangs">अभंग/भजन</a></li><li><a href="${prefix}index.html#saints">संत</a></li><li><a href="${prefix}index.html#categories">विभाग</a></li></ul></div><div class="footer-contact"><h4>संपर्क</h4><ul class="footer-contact-list"><li><i class="fas fa-envelope"></i> vakibhmedia@gmail.com</li><li><i class="fas fa-phone"></i> 9225354427</li><li><i class="fas fa-map-marker-alt"></i> पुणे, महाराष्ट्र</li></ul></div></div>\n    <div class="footer-bottom"><p>&copy; २०२६ वाकीभ. सर्व हक्क सुरक्षित.</p><button class="scroll-top-btn" id="scrollTopBtn" aria-label="वर जा"><i class="fas fa-chevron-up"></i></button></div>\n  </footer>\n</body>\n</html>\n`; }

function makeList(items, hrefFor) {
  return items.map(item => `        <a class="abhang-item" href="${hrefFor(item)}" data-abhang-number="${item.number}" data-search="${esc((item.number + ' ' + toMr(item.number) + ' अभंग ' + item.title + ' ' + strip(item.verseHtml) + ' ').toLowerCase())}"><span class="abhang-number">${toMr(item.number)}.</span><span class="abhang-title">${esc(item.title)}</span></a>`).join('\n') + '\n';
}

function listingPage({title, subtitle, items, relPrefix, backHref, backLabel, rangeCards, searchData}) {
  const cssPrefix = relPrefix;
  const count = items.length;
  return `${header()}\n  <title>${esc(title)} – वाकीभ</title>\n  <meta name="description" content="${esc(title)} येथे क्रमाने वाचा.">\n  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n  <link rel="stylesheet" href="${cssPrefix}Vakibh/css/style.css?v=42">\n  <link rel="stylesheet" href="${cssPrefix}Vakibh/css/sant.css?v=38">\n  <script src="${cssPrefix}Vakibh/js/main.js?v=45" defer></script>\n</head>\n<body class="abhang-list-page">${siteHeader(cssPrefix)}\n  <main class="sant-page-main">\n    <section class="sant-title-section"><div class="sant-title-inner"><h1 class="sant-page-h1">${esc(title)}</h1><nav class="sant-quick-links" aria-label="संत एकनाथ विभाग"><a href="${cssPrefix}index.html" class="sant-quick-link">गृहपृष्ठ</a><a href="${backHref}" class="sant-quick-link">${esc(backLabel)}</a><a href="#abhang-grid" class="sant-quick-link active">अभंग</a></nav></div></section>\n    <section class="sant-search-bar-section"><div class="sant-search-inner"><div class="sant-search-wrap"><i class="fas fa-search"></i><input type="text" id="abhangSearch" placeholder="अभंग शोधा" aria-label="अभंग शोध"></div><span class="count-pill" id="countPill">${toMr(count)} अभंग</span></div></section>\n    <section class="abhang-grid-section" id="abhang-grid"><div class="abhang-grid-inner"><h2 class="abhang-grid-heading">${esc(subtitle)}</h2>${rangeCards || ''}<div class="abhang-list" id="abhangColumns">\n${makeList(items, item => `../sant-eknath-abhang-${item.number}/index.html`)}      </div><p class="abhang-empty-state" id="abhangEmptyState" hidden>जुळणारे अभंग सापडले नाहीत.</p></div></section>\n  </main>${footer(cssPrefix)}${searchScript(searchData)}\n`;
}
function searchScript(data) {
  if (!data) return '';
  return `<script>\n(function(){\n  const input=document.getElementById('abhangSearch'); const cols=document.getElementById('abhangColumns'); const count=document.getElementById('countPill'); const empty=document.getElementById('abhangEmptyState'); const ranges=document.getElementById('abhangRangeGrid');\n  const devanagari='०१२३४५६७८९'; const toAscii=s=>String(s).replace(/[०-९]/g,ch=>devanagari.indexOf(ch));\n  const all=${JSON.stringify(data)};\n  function render(items){ cols.innerHTML=''; items.forEach(item=>{ const a=document.createElement('a'); a.className='abhang-item'; a.href='../sant-eknath-abhang-'+item.number+'/index.html'; const n=document.createElement('span'); n.className='abhang-number'; n.textContent=item.mr+'.'; const t=document.createElement('span'); t.className='abhang-title'; t.textContent=item.title; a.appendChild(n); a.appendChild(t); cols.appendChild(a); }); count.textContent=(items.length?items.length:0).toLocaleString('mr-IN')+' अभंग'; empty.hidden=items.length!==0; }\n  function apply(){ const raw=input.value.trim().toLowerCase(); if(!raw){ if(ranges) ranges.hidden=false; render(all); return; } if(ranges) ranges.hidden=true; const q=toAscii(raw.replace(/^अभंग\\s*/,'')); render(all.filter(item=>item.search.includes(raw)||item.searchAscii.includes(q))); }\n  input&&input.addEventListener('input', apply);\n})();\n</script>`;
}
function detailPage(entry, prev, next) {
  const title = `${toMr(entry.number)}. ${entry.title}`;
  return `${header()}\n  <title>${esc(title)} – संत एकनाथ अभंग – वाकीभ</title>\n  <meta name="description" content="${esc(title)} – संत एकनाथ अभंग येथे वाचा.">\n  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n  <link rel="stylesheet" href="../../../Vakibh/css/style.css?v=42">\n  <link rel="stylesheet" href="../../../Vakibh/css/sant.css?v=38">\n  <script src="../../../Vakibh/js/main.js?v=45" defer></script>\n</head>\n<body class="abhang-post-page">${siteHeader('../../../')}\n<main class="sant-page-main abhang-post-main">\n  <nav class="sant-breadcrumb" aria-label="Breadcrumb"><a href="../../../index.html">गृहपृष्ठ</a><span class="bc-sep"> &rsaquo; </span><a href="../index.html">संत एकनाथ</a><span class="bc-sep"> &rsaquo; </span><a href="../eknath-abhang-gatha/index.html">एकनाथांचे अभंग / गाथा</a><span class="bc-sep"> &rsaquo; </span><span>${esc(title)}</span></nav>\n  <article class="abhang-post abhang-content-block"><header class="post-header abhang-content-header"><span class="abhang-content-number">अभंग ${toMr(entry.number)}</span><h1 class="post-title abhang-content-title">${esc(entry.title)}</h1></header><div class="post-content"><div class="abhang-readable-verses" data-devotional-verse="true">${cleanVerseHtml}</div><hr class="post-hr"><div class="abhang-post-actions abhang-card-footer" data-share-scope="post"><div class="abhang-actions-left"><button class="abhang-btn copy-abhang-btn" aria-label="अभंग कॉपी करा"><i class="far fa-copy"></i></button><div class="abhang-share-group"><button class="abhang-btn social-share-btn whatsapp-share-btn" data-platform="whatsapp" aria-label="व्हॉट्सअॅपवर शेअर करा"><i class="fab fa-whatsapp"></i></button><button class="abhang-btn social-share-btn facebook-share-btn" data-platform="facebook" aria-label="फेसबुकवर शेअर करा"><i class="fab fa-facebook-f"></i></button><button class="abhang-btn social-share-btn instagram-share-btn" data-platform="instagram" aria-label="इंस्टाग्रामसाठी कॉपी करा"><i class="fab fa-instagram"></i></button></div></div></div></div><nav class="post-navigation" aria-label="अभंग नेव्हिगेशन"><div class="nav-links"><div class="nav-previous">${prev ? `<a href="../sant-eknath-abhang-${prev.number}/index.html"><span>&larr;</span> मागील</a>` : ''}</div><div class="nav-center"><a href="../eknath-abhang-gatha/index.html" class="nav-list-btn"><i class="fas fa-list-ul"></i> सर्व अभंग</a></div><div class="nav-next">${next ? `<a href="../sant-eknath-abhang-${next.number}/index.html">पुढील <span>&rarr;</span></a>` : ''}</div></div></nav></article>\n</main>${footer('../../../')}`;
}
function rangeListPage(start, end, entries, slug) {
  const title = `संत एकनाथ अभंग ${toMr(start)} ते ${toMr(end)}`;
  return listingPage({title, subtitle: 'अभंग सूची', items: entries, relPrefix: '../../../', backHref: '../eknath-abhang-gatha/index.html', backLabel: 'एकनाथांचे अभंग / गाथा', searchData: entries.map(searchEntry)});
}
function searchEntry(e){ return {number:e.number, mr:toMr(e.number), title:e.title, search:(`${e.number} ${toMr(e.number)} अभंग ${e.title} ${strip(e.verseHtml)} `).toLowerCase(), searchAscii:(`${e.number} abhang ${fromMr(e.title)} ${fromMr(strip(e.verseHtml))} `).toLowerCase()}; }

let entries = [];
for (const dir of localRangeDirs) entries = entries.concat(extractRange(dir));
entries = [...new Map(entries.map(e => [e.number, e])).values()].sort((a,b)=>a.number-b.number);
if (!entries.length) throw new Error('No Eknath abhangs extracted');

for (let i = 0; i < entries.length; i++) {
  const e = entries[i];
  const outDir = path.join(santDir, `sant-eknath-abhang-${e.number}`);
  fs.mkdirSync(outDir, {recursive: true});
  fs.writeFileSync(path.join(outDir, 'index.html'), detailPage(e, entries[i-1], entries[i+1]), 'utf8');
}

const ranges = [];
for (let start = entries[0].number; start <= entries[entries.length - 1].number; start += 100) {
  const end = Math.min(start + 99, entries[entries.length - 1].number);
  const items = entries.filter(e => e.number >= start && e.number <= end);
  if (!items.length) continue;
  const actualStart = items[0].number;
  const actualEnd = items[items.length - 1].number;
  const slug = `abhang-${actualStart}-to-${actualEnd}`;
  ranges.push({start: actualStart, end: actualEnd, slug, count: items.length});
  const outDir = path.join(santDir, slug);
  fs.mkdirSync(outDir, {recursive: true});
  fs.writeFileSync(path.join(outDir, 'index.html'), rangeListPage(actualStart, actualEnd, items, slug), 'utf8');
}

for (const dir of localRangeDirs) {
  const nums = [...dir.matchAll(/(\d+)/g)].map(m => Number(m[1]));
  if (nums.length < 2) continue;
  const start = nums[0], end = nums[1];
  const items = entries.filter(e => e.number >= start && e.number <= end);
  if (!items.length) continue;
  fs.writeFileSync(path.join(santDir, dir, 'index.html'), rangeListPage(start, end, items, dir), 'utf8');
}

const rangeCards = `<div class="sahitya-links-grid eknath-range-grid" id="abhangRangeGrid">\n${ranges.map(r => `        <a href="../${r.slug}/index.html" class="sahitya-link">अभंग ${toMr(r.start)} ते ${toMr(r.end)}</a>`).join('\n')}\n      </div>`;
const mainHtml = listingPage({
  title: 'एकनाथांचे अभंग / गाथा',
  subtitle: 'अभंग क्रमांकानुसार',
  items: entries,
  relPrefix: '../../../',
  backHref: '../index.html',
  backLabel: 'संत एकनाथ',
  rangeCards,
  searchData: entries.map(searchEntry),
});
fs.writeFileSync(path.join(santDir, 'eknath-abhang-gatha', 'index.html'), mainHtml, 'utf8');

const numbers = entries.map(e => e.number);
const missing = [];
for (let n = numbers[0]; n <= numbers[numbers.length - 1]; n++) if (!numbers.includes(n)) missing.push(n);
const dupes = numbers.filter((n, i) => numbers.indexOf(n) !== i);
console.log(JSON.stringify({count: entries.length, first: numbers[0], last: numbers[numbers.length-1], missing: missing.slice(0,30), missingCount: missing.length, duplicateCount: dupes.length, rangeCount: ranges.length}, null, 2));
