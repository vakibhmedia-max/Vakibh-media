const fs = require('fs');

const pages = [
  {
    localFile: 'Vakibh-media/sants/dnyaneshwar/abhang-598-903/index.html',
    sourceFile: 'C:/tmp/gatha-5.html',
    title: '\u0938\u0902\u0924 \u091c\u094d\u091e\u093e\u0928\u0947\u0936\u094d\u0935\u0930 \u0917\u093e\u0925\u093e \u096b\u096f\u096e \u0924\u0947 \u096f\u0966\u0969'
  },
  {
    localFile: 'Vakibh-media/sants/dnyaneshwar/abhang-904-1071/index.html',
    sourceFile: 'C:/tmp/gatha-904.html',
    title: '\u0938\u0902\u0924 \u091c\u094d\u091e\u093e\u0928\u0947\u0936\u094d\u0935\u0930 \u0917\u093e\u0925\u093e \u096f\u0966\u096a \u0924\u0947 \u0967\u0966\u0969\u096e'
  }
];

const printStyle = `  <style>
    body {
      background: #fff;
      color: #000;
      font-family: Georgia, "Noto Serif Devanagari", "Nirmala UI", serif;
    }

    body > header,
    body > footer,
    .floating-whatsapp,
    .sant-breadcrumb,
    .post-meta,
    .abhang-post-actions {
      display: none !important;
    }

    .sant-page-main.abhang-post-main {
      max-width: none;
      margin: 0;
      padding: 18px 16px 46px;
      background: #fff;
    }

    .abhang-post {
      max-width: 980px;
      margin: 0 auto;
      padding: 0;
      border: 0;
      box-shadow: none;
      background: transparent;
    }

    .post-header {
      margin: 0 auto 28px !important;
      padding: 0 !important;
    }

    .post-title {
      color: #000 !important;
      font-size: clamp(2rem, 4vw, 3rem) !important;
      line-height: 1.18;
      margin: 0 0 24px !important;
      font-weight: 800;
      letter-spacing: 0;
    }

    .post-content,
    .entry-content,
    .elementor-widget-container {
      font-size: 18px;
      line-height: 1.95;
      color: #000;
    }

    .abhang-verse {
      max-width: 980px !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: transparent !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }

    .entry-content p,
    .elementor-widget-container p {
      margin: 0 0 22px;
    }

    .entry-content > p:first-child,
    .elementor-widget-container > p:first-child {
      text-align: left;
      margin-bottom: 34px;
    }

    .entry-content h2,
    .elementor-widget-container h2,
    .section-heading {
      margin: 26px 0 28px;
      text-align: left;
      font-size: 18px !important;
      line-height: 1.7;
      font-weight: 500;
      color: #000;
    }

    .entry-content h2 span,
    .elementor-widget-container h2 span {
      font-size: inherit !important;
      color: inherit !important;
    }

    .entry-content strong,
    .elementor-widget-container strong {
      font-weight: 700;
    }

    .entry-content a,
    .elementor-widget-container a {
      color: inherit;
      text-decoration: none;
      pointer-events: none;
    }
  </style>`;

function extractBody(html) {
  const startMatch = html.match(/<div\b[^>]*class=["'][^"']*\bentry-content\b[^"']*\bclear\b[^"']*["'][^>]*>/i);
  if (!startMatch || startMatch.index === undefined) throw new Error('Source entry-content marker not found.');

  const contentStart = startMatch.index + startMatch[0].length;
  const navStart = html.indexOf('<nav class="navigation post-navigation"', contentStart);
  const contentEnd = navStart > -1 ? navStart : html.indexOf('</article>', contentStart);
  if (contentEnd < 0) throw new Error('Source content end not found.');

  return html
    .slice(contentStart, contentEnd)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<div[^>]*class="[^"]*ast-oembed-container[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<p>\s*&nbsp;\s*<\/p>/gi, '')
    .replace(/<p>\s*<a[^>]*play\.google\.com[\s\S]*?<\/p>/gi, '')
    .replace(/<p>\s*<strong>\s*à¤¸à¤‚à¤¤ à¤œà¥à¤žà¤¾à¤¨à¥‡à¤¶à¥à¤µà¤° à¤…à¤à¤ª à¤¡à¤¾à¤‰à¤¨à¤²à¥‹à¤¡[\s\S]*?<\/p>/gi, '')
    .replace(/<h2[^>]*>[\s\S]*?à¤…à¤­à¤‚à¤— à¤µà¤¿à¤¡à¤¿à¤“ à¤¸à¥à¤µà¤°à¥‚à¤ªà¤¾à¤¤ à¤ªà¤¹à¤¾[\s\S]*?<\/h2>/gi, '')
    .replace(/<h2[^>]*>[\s\S]*?sant dnyaneshwer abhnag[\s\S]*?<\/h2>/gi, '')
    .replace(/<a\s+[^>]*href="[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/\s*(?:\r?\n){3,}/g, '\n\n')
    .trim();
}

function updateWrapper(page, content) {
  let html = fs.readFileSync(page.localFile, 'utf8');
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${page.title} \u2013 \u0935\u093e\u0915\u0940\u092d</title>`);
  html = html.replace(/(<script src="\.\.\/\.\.\/\.\.\/Vakibh\/js\/main\.js\?v=22" defer><\/script>\s*)(?:<style>[\s\S]*?<\/style>\s*)?<\/head>/i, `$1${printStyle}\n</head>`);
  html = html.replace(/<span>[\s\S]*?<\/span>\s*\n\s*<\/nav>/i, `<span>${page.title}</span>\n    </nav>`);
  html = html.replace(/<h1 class="post-title"[^>]*>[\s\S]*?<\/h1>/i, `<h1 class="post-title" style="color: #a02020; font-size: 2rem; margin-bottom: 20px;">${page.title}</h1>`);

  const startMarker = '<div class="entry-content clear" itemprop="text">';
  const endMarker = '<!-- CONTENT END 1 -->';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Local entry markers not found in ${page.localFile}`);

  const before = html.slice(0, start + startMarker.length);
  const after = html.slice(end);
  fs.writeFileSync(page.localFile, `${before}\n\n${content}\n\n${after}`, 'utf8');
}

for (const page of pages) {
  const content = extractBody(fs.readFileSync(page.sourceFile, 'utf8'));
  updateWrapper(page, content);
  const numberedBlocks = (content.match(/<p>\s*<strong>[à¥¦-à¥¯0-9]+/g) || []).length;
  console.log(`${page.localFile}: inserted ${numberedBlocks} numbered blocks, ${content.length} chars`);
}
