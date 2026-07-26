const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MEDIA_ROOT = path.join(ROOT, 'Vakibh-media');
const EXCLUDE = /[\\/](?:extracted_new_data|www\.santsahitya\.in)[\\/]/i;

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

function getPrefix(html, file) {
  const styleHref = /<link\b[^>]*href=["']([^"']*Vakibh\/css\/(?:style|sant)\.css[^"']*)["'][^>]*>/i.exec(html)?.[1] || '';
  const styleMatch = styleHref.match(/^(.*?)Vakibh\/css\/(?:style|sant)\.css/i);
  if (styleMatch) return styleMatch[1] || '';
  const scriptSrc = /<script\b[^>]*src=["']([^"']*Vakibh\/js\/main\.js[^"']*)["'][^>]*>/i.exec(html)?.[1] || '';
  const scriptMatch = scriptSrc.match(/^(.*?)Vakibh\/js\/main\.js/i);
  if (scriptMatch) return scriptMatch[1] || '';
  const relative = path.relative(MEDIA_ROOT, path.dirname(file)).replace(/\\/g, '/');
  if (!relative) return '';
  return relative.split('/').map(() => '..').join('/') + '/';
}

function header(prefix) {
  const t = {
    logo: '&#x0935;&#x093E;&#x0915;&#x0940;&#x092D; &#x0932;&#x094B;&#x0917;&#x094B;',
    menu: '&#x092E;&#x0941;&#x0916;&#x094D;&#x092F; &#x092E;&#x0947;&#x0928;&#x0942;',
    openMenu: '&#x092E;&#x0941;&#x0916;&#x094D;&#x092F; &#x092E;&#x0947;&#x0928;&#x0942; &#x0909;&#x0918;&#x0921;&#x093E;',
    home: '&#x092E;&#x0941;&#x0916;&#x092A;&#x0943;&#x0937;&#x094D;&#x0920;',
    abhang: '&#x0905;&#x092D;&#x0902;&#x0917;/&#x092D;&#x091C;&#x0928;',
    sant: '&#x0938;&#x0902;&#x0924;',
    section: '&#x0935;&#x093F;&#x092D;&#x093E;&#x0917;',
    contact: '&#x0938;&#x0902;&#x092A;&#x0930;&#x094D;&#x0915;',
    language: '&#x092D;&#x093E;&#x0937;&#x093E; &#x0928;&#x093F;&#x0935;&#x0921;&#x093E;',
    marathi: '&#x092E;&#x0930;&#x093E;&#x0920;&#x0940;',
    search: '&#x0936;&#x094B;&#x0927; &#x0909;&#x0918;&#x0921;&#x093E;'
  };
  return `  <header>
    <div class="header-container">
      <a href="${prefix}index.html" class="logo-link">
        <img src="${prefix}Vakibh/vaakibh_logo.svg" alt="${t.logo}" class="logo-img">
      </a>
      <button class="menu-toggle" id="menuToggle" aria-label="${t.openMenu}" type="button">
        <i class="fas fa-bars"></i>
      </button>
      <nav id="navMenu" aria-label="${t.menu}">
        <ul>
          <li><a href="${prefix}index.html">${t.home}</a></li>
          <li><a href="${prefix}index.html#abhangs">${t.abhang}</a></li>
          <li><a href="${prefix}index.html#saints">${t.sant}</a></li>
          <li><a href="${prefix}index.html#categories">${t.section}</a></li>
          <li><a href="${prefix}contact/index.html">${t.contact}</a></li>
        </ul>
      </nav>
      <div class="header-actions">
        <div class="lang-switch-group" aria-label="${t.language}">
          <button class="lang-switch active" type="button" data-language="marathi" data-language-option="marathi">${t.marathi}</button>
          <button class="lang-switch" type="button" data-language="english" data-language-option="english">English</button>
        </div>
        <button class="search-trigger-btn" id="searchTrigger" aria-label="${t.search}" type="button">
          <i class="fas fa-search"></i>
        </button>
      </div>
    </div>
  </header>`;
}
function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (EXCLUDE.test(full)) continue;
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

let changed = 0;
let skipped = 0;
for (const file of walk(MEDIA_ROOT)) {
  let html = fs.readFileSync(file, 'utf8');
  if (!/<body\b/i.test(html)) { skipped += 1; continue; }
  const replacement = header(getPrefix(html, file));
  const headerMatch = /<header\b[^>]*>/i.exec(html);
  let next;
  if (headerMatch) {
    const start = headerMatch.index;
    const end = findMatchingTag(html, start);
    if (end < 0) { skipped += 1; continue; }
    next = html.slice(0, start) + replacement + html.slice(end);
  } else {
    next = html.replace(/<body\b([^>]*)>/i, (match) => `${match}\n${replacement}`);
  }
  if (next !== html) {
    fs.writeFileSync(file, next, 'utf8');
    changed += 1;
  }
}

console.log(JSON.stringify({ changed, skipped }, null, 2));
