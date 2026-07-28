const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(projectRoot, 'Vakibh-media');
const siteOrigin = 'https://vakibh.com';
const today = new Date().toISOString().slice(0, 10);

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolute = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(absolute) : [absolute];
});

const decodeEntities = (value = '') => value
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&nbsp;/gi, ' ');

const stripTags = (value = '') => decodeEntities(value.replace(/<[^>]*>/g, ' '))
  .replace(/\s+/g, ' ')
  .trim();

const escapeAttribute = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const encodeUrlPath = (relativePath) => {
  const normalized = relativePath.replace(/\\/g, '/');
  const clean = normalized.toLowerCase().endsWith('/index.html')
    ? normalized.slice(0, -'index.html'.length)
    : normalized === 'index.html'
      ? ''
      : normalized;
  return `/${clean.split('/').filter(Boolean).map((part) => encodeURIComponent(part)).join('/')}${clean.endsWith('/') ? '/' : ''}`;
};

const pageDescription = (title) => {
  const subject = title
    .replace(/\s*[|–-]\s*(?:वाकीभ|vaakibh|vakibh)\s*$/iu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90) || 'वाकीभ मराठी संत साहित्य';
  return `${subject} — मराठी संत साहित्य, अभंग, ओव्या, आरती, हरिपाठ आणि वारकरी परंपरेचा डिजिटल संग्रह.`;
};

const removeSeoTags = (head) => head
  .replace(/<meta\b(?=[^>]*\bname\s*=\s*["']description["'])[^>]*>\s*/gi, '')
  .replace(/<meta\b(?=[^>]*\bproperty\s*=\s*["']og:[^"']+["'])[^>]*>\s*/gi, '')
  .replace(/<meta\b(?=[^>]*\bname\s*=\s*["']twitter:[^"']+["'])[^>]*>\s*/gi, '')
  .replace(/<link\b(?=[^>]*\brel\s*=\s*["'][^"']*(?:icon|apple-touch-icon)[^"']*["'])[^>]*>\s*/gi, '')
  .replace(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>\s*/gi, '')
  .replace(/<script\b[^>]*data-vakibh-seo=["']true["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');

const htmlFiles = walk(siteRoot).filter((file) => file.toLowerCase().endsWith('.html'));
const publicUrls = [];
let updated = 0;

for (const file of htmlFiles) {
  const source = fs.readFileSync(file, 'utf8');
  if (!/<html\b/i.test(source) || !/<head\b[^>]*>[\s\S]*?<\/head>/i.test(source)) continue;

  const relative = path.relative(siteRoot, file).replace(/\\/g, '/');
  const urlPath = encodeUrlPath(relative);
  const canonical = `${siteOrigin}${urlPath}`;
  const titleMatch = source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = stripTags(titleMatch?.[1] || path.basename(path.dirname(file)) || 'वाकीभ');
  const description = pageDescription(title);
  const image = `${siteOrigin}/Vakibh/vaakibh_logo.svg`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: canonical,
    inLanguage: 'mr',
    isPartOf: {
      '@type': 'WebSite',
      name: 'वाकीभ',
      url: `${siteOrigin}/`
    }
  }).replace(/</g, '\\u003c');

  const seoMarkup = [
    '  <!-- Vaakibh favicon and normalized SEO metadata -->',
    '  <link rel="icon" type="image/svg+xml" href="/Vakibh/vaakibh_logo.svg">',
    '  <link rel="shortcut icon" href="/Vakibh/vaakibh_logo.svg">',
    '  <link rel="apple-touch-icon" href="/Vakibh/vaakibh_logo.svg">',
    `  <meta name="description" content="${escapeAttribute(description)}">`,
    `  <link rel="canonical" href="${escapeAttribute(canonical)}">`,
    `  <meta property="og:title" content="${escapeAttribute(title)}">`,
    `  <meta property="og:description" content="${escapeAttribute(description)}">`,
    '  <meta property="og:type" content="website">',
    `  <meta property="og:url" content="${escapeAttribute(canonical)}">`,
    `  <meta property="og:image" content="${escapeAttribute(image)}">`,
    '  <meta property="og:site_name" content="वाकीभ">',
    '  <meta property="og:locale" content="mr_IN">',
    '  <meta name="twitter:card" content="summary">',
    `  <meta name="twitter:title" content="${escapeAttribute(title)}">`,
    `  <meta name="twitter:description" content="${escapeAttribute(description)}">`,
    `  <meta name="twitter:image" content="${escapeAttribute(image)}">`,
    `  <script type="application/ld+json" data-vakibh-seo="true">${jsonLd}</script>`
  ].join('\n');

  const next = source.replace(/<head\b([^>]*)>([\s\S]*?)<\/head>/i, (_, attributes, headContent) => {
    const cleaned = removeSeoTags(headContent).replace(/\s+$/, '');
    return `<head${attributes}>${cleaned}\n${seoMarkup}\n</head>`;
  });

  if (next !== source) {
    fs.writeFileSync(file, next, 'utf8');
    updated += 1;
  }

  if (/^(?:index\.html|sants\/|blog\/|contact\/|search\/)/i.test(relative)) {
    publicUrls.push(canonical);
  }
}

const uniqueUrls = [...new Set(publicUrls)].sort((a, b) => a.localeCompare(b, 'en'));
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...uniqueUrls.map((url) => [
    '  <url>',
    `    <loc>${url.replace(/&/g, '&amp;')}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    '  </url>'
  ].join('\n')),
  '</urlset>',
  ''
].join('\n');

fs.writeFileSync(path.join(siteRoot, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(siteRoot, 'robots.txt'), [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${siteOrigin}/sitemap.xml`,
  ''
].join('\n'), 'utf8');

console.log(JSON.stringify({
  scannedHtml: htmlFiles.length,
  updatedHtml: updated,
  sitemapUrls: uniqueUrls.length
}, null, 2));
