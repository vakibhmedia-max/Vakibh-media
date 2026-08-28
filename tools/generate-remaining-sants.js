const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(projectRoot, 'Vakibh-media');
const sourceRoot = path.join(projectRoot, 'database', 'remaining-sants');

const nilobaray = JSON.parse(
  fs.readFileSync(path.join(sourceRoot, 'sant-nilobaray', 'sant_nilobaray_full_data.json'), 'utf8')
);
const santaji = JSON.parse(
  fs.readFileSync(path.join(sourceRoot, 'santaji-maharaj', 'santaji_maharaj_full_data.json'), 'utf8')
);
const narhari = JSON.parse(
  fs.readFileSync(path.join(sourceRoot, 'narhari-sonar', 'sant_narhari_sonar_full_data.json'), 'utf8')
);

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toMarathiDigits(value) {
  return String(value).replace(/\d/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
}

function cleanText(value = '') {
  return String(value)
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function textToHtml(value = '', className = 'marathi-paragraph') {
  return cleanText(value)
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return '';
      const formattedLines = lines.map((line) =>
        escapeHtml(line).replace(
          /\s+([।॥|]{1,2}\s*[०-९0-9]+\s*[।॥|]{1,2})\s*$/,
          '&nbsp;$1'
        )
      );
      const inlineStyle = /(?:nilobaray|santaji)-aarti-line/.test(className)
        ? ' style="display:block !important;width:100% !important;max-width:100% !important;text-align:center !important;font-weight:400 !important;margin-left:auto !important;margin-right:auto !important;"'
        : '';
      return `<p class="${className}"${inlineStyle}>${formattedLines.join('<br>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

function stripRepeatedHeading(value, phrases = []) {
  const ignored = new Set(phrases.map((item) => cleanText(item)));
  return cleanText(value)
    .split('\n')
    .filter((line, index) => index > 5 || !ignored.has(cleanText(line)))
    .join('\n')
    .trim();
}

function cleanAbhangText(value, { saintName = '', title = '' } = {}) {
  const seen = new Set();
  const titleLead = cleanText(title).split(/\s+[–-]\s+/)[0].trim();
  const lines = cleanText(value).split('\n');
  const cleaned = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (cleaned.length && cleaned[cleaned.length - 1] !== '') cleaned.push('');
      continue;
    }

    const isSourceHeading =
      line === saintName ||
      /^संत\s+संताजी\s+जगनाडे(?:\s+महाराज)?$/i.test(line) ||
      /^संत\s+नरहरी\s+सोनार(?:\s+महाराज)?$/i.test(line) ||
      (titleLead && line === titleLead) ||
      /अँप\s+डाउनलोड|अॅप\s+डाउनलोड|app\s+download/i.test(line) ||
      /क[ंम]?मेंट\s*बॉक्स\s*मध्ये|कमेंट\s*बॉक्स|कमेंट बॉक्स|वरील\s+अभंगाचा?\s+अर्थ|वरील\s+अभांगाचा?\s+अर्थ|या\s+अभंगाचा\s+अर्थ\s+माहित\s+असेल/i.test(line) ||
      /संत\s+(?:संताजी|निळोबाराय|निळोबा|नरहरी\s+सोनार).*(?:अभंग|अभंग गाथा).*[–-]\s*[०-९\d]+/i.test(line) ||
      /[–-]\s*संत\s+नरहरी\s+सोनार\s+अभंग/i.test(line);

    if (isSourceHeading || seen.has(line)) continue;
    seen.add(line);
    cleaned.push(line);
  }

  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function cleanProseText(value) {
  const seen = new Set();
  const cleaned = [];

  for (const rawLine of cleanText(value).split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      if (cleaned.length && cleaned[cleaned.length - 1] !== '') cleaned.push('');
      continue;
    }
    if (
      /^_{4,}$/.test(line) ||
      /^(?:महती संताची|wikipedia\.org)$/i.test(line) ||
      /sant nilobaray gatha|niloba abhang|sarv gatha/i.test(line)
    ) continue;
    if (seen.has(line)) continue;
    seen.add(line);
    cleaned.push(line);
  }

  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function cleanNilobarayAartiText(value) {
  return cleanProseText(value)
    .split('\n')
    .filter((line) => {
      const normalized = cleanText(line);
      return !(
        /^संत निळोबाराय\s*\((?:आरती|आरत्या)\)$/i.test(normalized) ||
        /^संत निळोबा महाराज\s*,\s*आरती$/i.test(normalized)
      );
    })
    .join('\n')
    .replace(/(^|\n\n)([०-९0-9]+)\n+(?=\S)/g, '$1$2. ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanSantajiBiographyText(value) {
  return cleanProseText(value)
    .split('\n')
    .filter((line) => {
      const normalized = cleanText(line);
      return !(
        /^संत जगनाडे महाराज(?:महती संताची,\s*संत संताजी जगनाडे)?$/i.test(normalized) ||
        /^महती संताची,\s*संत संताजी जगनाडे$/i.test(normalized)
      );
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanSantajiAartiText(value) {
  return cleanProseText(value)
    .split('\n')
    .filter((line) => {
      const normalized = cleanText(line);
      return !(
        /^संत जगनाडे आरती$/i.test(normalized) ||
        /^आरती,\s*संत संताजी जगनाडे$/i.test(normalized) ||
        /^संत जगनाडे आरती विडिओ सहित$/i.test(normalized)
      );
    })
    .join('\n')
    .replace(/(^|\n\n)([०-९0-9]+)\n+(?=\S)/g, '$1$2. ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanVisobaBiographyText(value) {
  return cleanText(value)
    .split('\n')
    .filter((line) => cleanText(line) !== 'संत विसोबा खेचर माहिती')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanNarhariBiographyText(value) {
  return cleanProseText(value)
    .split('\n')
    .filter((line) => {
      const normalized = cleanText(line);
      return !(
        /^संत नरहरी सोनार माहिती$/i.test(normalized) ||
        /^महती संताची,\s*संत नरहरी सोनार$/i.test(normalized) ||
        /^संत नरहरी सोनार$/i.test(normalized) ||
        /^हे पण वाचा\s*[:-]\s*संत नरहरी सोनार मंदिर माहिती$/i.test(normalized) ||
        /^संत नरहरी सोनार अँप डाउनलोड/i.test(normalized) ||
        /^संत नरहरी सोनार अभंग\s*।\s*संत नरहरी महाराज फोटो\s*।\s*संत नरहरी सोनार आरती\s*।$/i.test(normalized) ||
        /^संतनरहरी महाराज जयंती\s*।\s*संत नरहरी सोनार मराठी माहिती\s*।$/i.test(normalized) ||
        /^sant narhari sonar abhang\s*।.*Sant Narhari Sonar Information In Marathi$/i.test(normalized) ||
        /^source\s+wikipedia$/i.test(normalized) ||
        /^(?:«\s*)?मागे$/i.test(normalized) ||
        /^पुढे\s*»$/i.test(normalized)
      );
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanNarhariMandirText(value) {
  return cleanProseText(value)
    .split('\n')
    .filter((line) => {
      const normalized = cleanText(line);
      return !(
        /^संत नरहरी सोनार मंदिर$/i.test(normalized) ||
        /^तीर्थक्षेत्र,\s*संत नरहरी सोनार\s*\/\s*संतांचे तीर्थक्षेत्र$/i.test(normalized) ||
        /^ref\s*:/i.test(normalized)
      );
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanCategoryText(value) {
  const seenHeadings = new Set();
  const filtered = cleanText(value)
    .split('\n')
    .filter((line) => {
      const normalized = cleanText(line);
      if (!normalized) return true;
      const isNilobarayContentHeading =
        (!/[।॥]/.test(normalized) && (
          /^संत निळोबाराय(?:ांच्या)?(?:\s|$)/i.test(normalized) ||
          /^आळंदीची व पंढरीची तुलना\s*[–-]\s*संत निळोबाराय/i.test(normalized) ||
          /^निळोबाकृत चांगदेव चरित्र\s*\(प्रकरण/i.test(normalized) ||
          /^web$/i.test(normalized)
        ));
      const isSourceLine =
        /sant nilobaray gatha|niloba abhang|sarv gatha/i.test(normalized) ||
        isNilobarayContentHeading ||
        /^संत निळोबाराय गाथा\s*\([^)]*\)\s*समाप्त$/i.test(normalized) ||
        /^संत निळोबाराय गाथा\s*\([^)]*\)$/i.test(normalized) ||
        /^संत निळोबा महाराज\s*\/\s*संत निळोबाराय गाथा$/i.test(normalized) ||
        /^(?:निळोबाराय\s*\([^)]*\)\s*)+$/i.test(normalized);
      if (isSourceLine) return false;
      if (seenHeadings.has(normalized)) return false;
      if (!/[।॥]/.test(normalized) && normalized.length < 100) seenHeadings.add(normalized);
      return true;
    })
    .join('\n')
    .replace(/(^|\n\n)([०-९]+)\n+(?=\S)/g, '$1$2. ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const contentLines = filtered.split('\n').map((line) => line.trim()).filter(Boolean);
  const grouped = [];
  let current = [];

  for (const line of contentLines) {
    const startsNumberedStanza = /^[०-९0-9]{1,4}\.\s+/.test(line);
    if (startsNumberedStanza && current.length) {
      grouped.push(current.join('\n'));
      current = [];
    }
    current.push(line);
  }
  if (current.length) grouped.push(current.join('\n'));

  return grouped.join('\n\n');
}

function markdownToText(value) {
  return cleanText(value)
    .split('\n')
    .filter((line) =>
      !/^\s*(?:\*\*)?(?:स्रोत URL|संदर्भ|विवरण)\s*:/i.test(line.replace(/\*\*/g, '')) &&
      !/^\s*-?\s*!\[.*?\]\(.*?\)\s*$/.test(line) &&
      !/^\s*-{3,}\s*$/.test(line) &&
      !/^\s*(?:चित्रे|समाधी चित्र)\s*\/?\s*(?:Images?|Image)?\s*:?\s*$/i.test(line.replace(/^#{1,6}\s*/, ''))
    )
    .map((line) => line.replace(/^#{1,6}\s+/, '').replace(/\*\*/g, '').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sourceSlug(url, fallback) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const candidate = parts[parts.length - 1] || fallback;
    return candidate.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '') || fallback;
  } catch {
    return fallback;
  }
}

function write(relativePath, html) {
  const target = path.join(siteRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html, 'utf8');
}

function head({ title, description, depth }) {
  const prefix = '../'.repeat(depth);
  return `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | वाकीभ</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="${prefix}Vakibh/css/style.css?v=43">
  <link rel="stylesheet" href="${prefix}Vakibh/css/sant.css?v=79">
  <script src="${prefix}Vakibh/js/main.js?v=87" defer></script>
</head>`;
}

function siteHeader(depth) {
  const prefix = '../'.repeat(depth);
  return `<header>
  <div class="header-container">
    <a href="${prefix}index.html" class="logo-link">
      <img src="${prefix}Vakibh/vaakibh_logo.svg" alt="वाकीभ लोगो" class="logo-img">
    </a>
    <button class="menu-toggle" id="menuToggle" aria-label="मुख्य मेनू उघडा" type="button"><i class="fas fa-bars"></i></button>
    <nav id="navMenu" aria-label="मुख्य मेनू">
      <ul>
        <li><a href="${prefix}index.html">मुखपृष्ठ</a></li>
        <li><a href="${prefix}index.html#abhangs">अभंग/भजन</a></li>
        <li><a href="${prefix}index.html#saints">संत</a></li>
        <li><a href="${prefix}index.html#categories">विभाग</a></li>
        <li><a href="${prefix}contact/index.html">संपर्क</a></li>
      </ul>
    </nav>
    <div class="header-actions">
      <div class="lang-switch-group" aria-label="भाषा निवडा">
        <button class="lang-switch active" type="button" data-language="marathi" data-language-option="marathi">मराठी</button>
        <button class="lang-switch" type="button" data-language="english" data-language-option="english">English</button>
      </div>
      <button class="search-trigger-btn" id="searchTrigger" aria-label="शोध उघडा" type="button"><i class="fas fa-search"></i></button>
    </div>
  </div>
</header>`;
}

function siteFooter(depth) {
  const prefix = '../'.repeat(depth);
  return `<footer>
  <div class="footer-container">
    <div class="footer-brand">
      <div class="footer-logo"><img src="${prefix}Vakibh/vaakibh_logo.svg" alt="वाकीभ लोगो"><h3>वाकीभ</h3></div>
      <p>संत साहित्य, अभंग, ओव्या आणि ग्रंथांचा समृद्ध मराठी संग्रह. वारकरी परंपरेचे जतन, संवर्धन आणि प्रसार हा आमचा प्रयत्न.</p>
      <div class="footer-socials">
        <a href="#" class="social-link" aria-label="फेसबुक"><i class="fab fa-facebook-f"></i></a>
        <a href="#" class="social-link" aria-label="इंस्टाग्राम"><i class="fab fa-instagram"></i></a>
      </div>
    </div>
    <div class="footer-links"><h4>मेन्यू</h4><ul>
      <li><a href="${prefix}index.html">मुखपृष्ठ</a></li>
      <li><a href="${prefix}index.html#granth">ग्रंथ</a></li>
      <li><a href="${prefix}index.html#abhangs">अभंग/भजन</a></li>
      <li><a href="${prefix}index.html#saints">संत</a></li>
      <li><a href="${prefix}index.html#categories">विभाग</a></li>
    </ul></div>
    <div class="footer-contact"><h4>संपर्क</h4><ul class="footer-contact-list">
      <li><i class="fas fa-envelope"></i> vakibhmedia@gmail.com</li>
      <li><i class="fas fa-phone"></i> +91 92253 54427</li>
      <li><i class="fas fa-map-marker-alt"></i> पुणे, महाराष्ट्र</li>
    </ul></div>
  </div>
  <div class="footer-bottom"><p>&copy; २०२६ वाकीभ. सर्व हक्क सुरक्षित.</p>
    <button class="scroll-top-btn" id="scrollTopBtn" aria-label="वर जा"><i class="fas fa-chevron-up"></i></button>
  </div>
</footer>
<a href="https://wa.me/919225354427" class="floating-whatsapp" target="_blank" rel="noopener noreferrer" aria-label="व्हॉट्सअॅप वर संपर्क करा">
  <img src="${prefix}Vakibh/whatsapp_icon.svg" alt="व्हॉट्सअॅप">
</a>`;
}

function quickLinks(depth, links) {
  const prefix = '../'.repeat(depth);
  return `<section class="sant-title-section"><div class="sant-title-inner">
    <h1 class="sant-page-h1">${escapeHtml(links.title)}</h1>
    <nav class="sant-quick-links">
      <a href="${prefix}index.html" class="sant-quick-link">गृहपृष्ठ</a>
      ${links.items.map((item, index) => `<a href="${item.href}" class="sant-quick-link${index === links.items.length - 1 ? ' active' : ''}">${escapeHtml(item.label)}</a>`).join('\n')}
    </nav>
  </div></section>`;
}

function layout({ title, description, depth, bodyClass = '', main }) {
  return `${head({ title, description, depth })}
<body class="${bodyClass}">
${siteHeader(depth)}
${main}
${siteFooter(depth)}
</body>
</html>
`;
}

function landingPage(config) {
  const depth = 2;
  const cards = config.cards.map((card) => `<a href="${card.href}" class="tukaram-link">${escapeHtml(card.label)}</a>`).join('\n');
  const main = `<main class="sant-page-main">
  ${quickLinks(depth, { title: config.name, items: [{ href: '#', label: 'साहित्य' }] })}
  <div class="tukaram-landing-container remaining-sant-landing">
    <section class="remaining-sant-literature-section">
      <h2 class="tukaram-heading">${escapeHtml(config.name)} साहित्य</h2>
      <div class="remaining-sant-links-grid">${cards}</div>
    </section>
  </div>
</main>`;
  return layout({
    title: `${config.name} साहित्य`,
    description: `${config.name} यांचे चरित्र, अभंग, आरती आणि उपलब्ध साहित्य वाचा.`,
    depth,
    main
  });
}

function contentPage({ saintName, saintSlug, sectionTitle, content, output, description, bodyClass = '', contentClass = 'marathi-paragraph' }) {
  const depth = 3;
  const main = `<main class="sant-page-main abhang-post-main">
  <nav class="sant-breadcrumb" aria-label="Breadcrumb">
    <a href="../../../index.html">गृहपृष्ठ</a><span class="bc-sep"> &rsaquo; </span>
    <a href="../index.html">${escapeHtml(saintName)}</a><span class="bc-sep"> &rsaquo; </span>
    <span>${escapeHtml(sectionTitle)}</span>
  </nav>
  <article class="abhang-post">
    <header class="post-header"><h1 class="post-title">${escapeHtml(sectionTitle)}</h1></header>
    <div class="post-content"><div class="entry-content">${textToHtml(content, contentClass)}</div></div>
  </article>
</main>`;
  write(`sants/${saintSlug}/${output}/index.html`, layout({
    title: sectionTitle,
    description: description || `${saintName} ${sectionTitle}`,
    depth,
    bodyClass: `sant-literature-detail-page ${bodyClass}`.trim(),
    main
  }));
}

function underConstructionPage({ saintName, saintSlug, sectionTitle, output }) {
  const depth = 3;
  const main = `<main class="sant-page-main" style="padding: 80px 20px;">
  <div style="max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid #f0d5ab; border-radius: 24px; padding: 48px 24px; text-align: center; box-shadow: 0 12px 30px rgba(160, 32, 32, 0.08);">
    <h1 style="color: #a02020; font-size: 2rem; margin-bottom: 16px;">${escapeHtml(sectionTitle)}</h1>
    <p style="font-size: 1.3rem; color: #444; font-weight: 700;">काम चालू आहे.</p>
  </div>
</main>`;
  write(`sants/${saintSlug}/${output}/index.html`, layout({
    title: sectionTitle,
    description: `${saintName} ${sectionTitle} माहिती लवकरच उपलब्ध होईल.`,
    depth,
    bodyClass: 'sant-under-construction-page',
    main
  }));
}

function actionButtons() {
  return `<hr class="post-hr">
  <div class="abhang-post-actions abhang-card-footer" data-share-scope="post"><div class="abhang-actions-left">
    <button class="abhang-btn copy-abhang-btn" aria-label="अभंग कॉपी करा"><i class="far fa-copy"></i></button>
    <div class="abhang-share-group">
      <button class="abhang-btn social-share-btn whatsapp-share-btn" data-platform="whatsapp" aria-label="व्हॉट्सअॅपवर शेअर करा"><i class="fab fa-whatsapp"></i></button>
      <button class="abhang-btn social-share-btn facebook-share-btn" data-platform="facebook" aria-label="फेसबुकवर शेअर करा"><i class="fab fa-facebook-f"></i></button>
      <button class="abhang-btn social-share-btn instagram-share-btn" data-platform="instagram" aria-label="इंस्टाग्रामसाठी कॉपी करा"><i class="fab fa-instagram"></i></button>
    </div>
  </div></div>`;
}

function abhangDetail({ saintName, saintSlug, collectionLabel, item, index, items, directory = 'abhang' }) {
  const depth = 4;
  const number = item.number || index + 1;
  const previous = index > 0 ? items[index - 1] : null;
  const next = index < items.length - 1 ? items[index + 1] : null;
  const title = item.title || `${collectionLabel} ${number}`;
  const cleaned = cleanAbhangText(item.full_text, { saintName, title });
  const nav = `<nav class="post-navigation" aria-label="अभंग नेव्हिगेशन"><div class="nav-links">
    <div class="nav-prev">${previous ? `<a href="../${previous.number || index}/index.html"><span>&larr;</span> मागील अभंग</a>` : ''}</div>
    <div class="nav-center"><a href="../index.html" class="nav-list-btn"><i class="fas fa-list-ul"></i> सर्व अभंग</a></div>
    <div class="nav-next">${next ? `<a href="../${next.number || index + 2}/index.html">पुढील अभंग <span>&rarr;</span></a>` : ''}</div>
  </div></nav>`;
  const main = `<main class="sant-page-main abhang-post-main">
  <nav class="sant-breadcrumb" aria-label="Breadcrumb">
    <a href="../../../../index.html">गृहपृष्ठ</a><span class="bc-sep"> &rsaquo; </span>
    <a href="../../index.html">${escapeHtml(saintName)}</a><span class="bc-sep"> &rsaquo; </span>
    <span>अभंग ${escapeHtml(number)}</span>
  </nav>
  <article class="abhang-post">
    <header class="post-header"><h1 class="post-title">${escapeHtml(title)}</h1></header>
    <div class="post-content"><div class="abhang-verse" data-devotional-verse="true">${textToHtml(cleaned, 'marathi-verse')}</div>${actionButtons()}</div>
    ${nav}
  </article>
</main>`;
  write(`sants/${saintSlug}/${directory}/${number}/index.html`, layout({
    title,
    description: `${saintName} यांचा ${title} वाचा.`,
    depth,
    bodyClass: 'abhang-detail-page',
    main
  }));
}

function abhangIndex({ saintName, saintSlug, label, items, directory = 'abhang', extraSections = '', hideList = false }) {
  const depth = 3;
  const cards = items.map((item, index) => {
    const number = item.number || index + 1;
    return `<a href="${number}/index.html" class="sahitya-link">${escapeHtml(item.title || `अभंग ${number}`)}</a>`;
  }).join('\n');
  const main = `<main class="sant-page-main">
  ${quickLinks(depth, {
    title: `${saintName} ${label}`,
    items: [{ href: '../index.html', label: saintName }, { href: '#', label }]
  })}
  <div class="sahitya-landing-container${extraSections ? ' remaining-sants-collection-page' : ''}">
    ${extraSections}
    ${hideList ? '' : `<h2 class="sahitya-heading">${escapeHtml(label)} सूची</h2>
    <div class="sahitya-links-grid">${cards}</div>`}
  </div>
</main>`;
  write(`sants/${saintSlug}/${directory}/index.html`, layout({
    title: `${saintName} ${label}`,
    description: `${saintName} यांचे ${label} वाचा.`,
    depth,
    bodyClass: 'abhang-list-page',
    main
  }));
}

function fullAbhangCardsPage({ saintName, saintSlug, items }) {
  const depth = 3;
  const cards = items.map((item, index) => {
    const number = item.number || index + 1;
    const cleaned = cleanAbhangText(item.full_text, { saintName, title: item.title });
    const title = cleanText(item.title || `अभंग ${number}`)
      .replace(/\s+[–-]\s+संत\s+निळोबाराय.*$/i, '')
      .replace(/\s+[–-]\s*(?:अभंग\s*)?\d+\s*$/i, '')
      .trim();
    const searchable = cleanText(`अभंग ${number} ${title} ${cleaned}`).replace(/\s+/g, ' ');

    return `<article class="abhang-content-block" id="abhang-${escapeHtml(number)}" data-abhang-number="${escapeHtml(number)}" data-search="${escapeHtml(searchable)}">
      <header class="abhang-content-header">
        <span class="abhang-content-number">अभंग ${toMarathiDigits(number)}</span>
        <h3 class="abhang-content-title">${escapeHtml(title)}</h3>
      </header>
      <div class="abhang-readable-verses" data-devotional-verse="true">
        <div class="abhang-verse natache-verse" data-devotional-verse="true">${textToHtml(cleaned, 'natache-line')}</div>
      </div>
      <div class="abhang-item-actions abhang-card-footer" data-share-scope="item">
        <div class="abhang-actions-left">
          <button class="abhang-btn copy-abhang-btn" type="button" aria-label="अभंग कॉपी करा"><i class="far fa-copy"></i></button>
          <div class="abhang-share-group">
            <button class="abhang-btn social-share-btn whatsapp-share-btn" type="button" data-platform="whatsapp" aria-label="व्हॉट्सअॅपवर शेअर करा"><i class="fab fa-whatsapp"></i></button>
            <button class="abhang-btn social-share-btn facebook-share-btn" type="button" data-platform="facebook" aria-label="फेसबुकवर शेअर करा"><i class="fab fa-facebook-f"></i></button>
            <button class="abhang-btn social-share-btn instagram-share-btn" type="button" data-platform="instagram" aria-label="इंस्टाग्रामसाठी कॉपी करा"><i class="fab fa-instagram"></i></button>
          </div>
        </div>
      </div>
    </article>`;
  }).join('\n');

  const main = `<main class="sant-page-main">
  <nav class="sant-breadcrumb" aria-label="Breadcrumb">
    <a href="../../../index.html">गृहपृष्ठ</a><span class="bc-sep"> &rsaquo; </span>
    <a href="../index.html">${escapeHtml(saintName)}</a><span class="bc-sep"> &rsaquo; </span>
    <span>अभंग</span>
  </nav>
  ${quickLinks(depth, {
    title: `${saintName} अभंग`,
    items: [{ href: '../index.html', label: saintName }, { href: '#abhang-grid', label: 'अभंग' }]
  })}
  <section class="abhang-grid-section" id="abhang-grid">
    <div class="abhang-grid-inner">
      <h2 class="abhang-grid-heading">${escapeHtml(saintName)} अभंग</h2>
      <div class="abhang-content-list" id="abhangContentList" data-total-count="${items.length}">
        ${cards}
      </div>
    </div>
  </section>
</main>`;

  write(`sants/${saintSlug}/abhang/index.html`, layout({
    title: `${saintName} अभंग`,
    description: `${saintName} यांचे सर्व उपलब्ध अभंग वाचा आणि शोधा.`,
    depth,
    bodyClass: 'natache-abhang-page abhang-list-page abhang-range-page remaining-sant-full-abhang-page',
    main
  }));
}

function categoryDetail({ saintName, saintSlug, item, slug }) {
  const depth = 4;
  const cleaned = cleanCategoryText(stripRepeatedHeading(item.full_text, [item.title, saintName]));
  const main = `<main class="sant-page-main abhang-post-main">
  <nav class="sant-breadcrumb" aria-label="Breadcrumb">
    <a href="../../../../index.html">गृहपृष्ठ</a><span class="bc-sep"> &rsaquo; </span>
    <a href="../../index.html">${escapeHtml(saintName)}</a><span class="bc-sep"> &rsaquo; </span>
    <span>${escapeHtml(item.title)}</span>
  </nav>
  <article class="abhang-post">
    <header class="post-header"><h1 class="post-title">${escapeHtml(item.title)}</h1></header>
    <div class="post-content"><div class="entry-content gatha-content">${textToHtml(cleaned, 'marathi-verse')}</div>${actionButtons()}</div>
  </article>
</main>`;
  write(`sants/${saintSlug}/sahitya/${slug}/index.html`, layout({
    title: `${saintName} – ${item.title}`,
    description: `${saintName} यांचे ${item.title} साहित्य.`,
    depth,
    bodyClass: 'gatha-typography-page',
    main
  }));
}

function generateSantaji() {
  const saintName = 'संत संताजी जगनाडे महाराज';
  const saintSlug = 'santaji-jagnade';
  const individual = santaji.abhangas.slice(1).map((item, index) => ({
    ...item,
    number: index + 1,
    title: `${item.title} – अभंग ${index + 1}`
  }));

  write(`sants/${saintSlug}/index.html`, landingPage({
    name: saintName,
    cards: [
      { href: 'charitra/index.html', label: 'संत संताजी जगनाडे महाराज चरित्र' },
      { href: 'abhang/index.html', label: 'संत संताजी जगनाडे महाराज अभंग' },
      { href: 'aarti/index.html', label: 'संत संताजी जगनाडे महाराज आरती' },
      { href: 'mandir-samadhi/index.html', label: 'मंदिर व समाधी स्थान' }
    ]
  }));

  contentPage({ saintName, saintSlug, sectionTitle: `${saintName} चरित्र`, content: cleanSantajiBiographyText(santaji.biography.full_text), output: 'charitra' });
  contentPage({
    saintName,
    saintSlug,
    sectionTitle: `${saintName} आरती`,
    content: cleanSantajiAartiText(santaji.aarti.full_text),
    output: 'aarti',
    bodyClass: 'santaji-aarti-page',
    contentClass: 'santaji-aarti-line'
  });
  underConstructionPage({
    saintName,
    saintSlug,
    sectionTitle: `${saintName} मंदिर व समाधी`,
    output: 'mandir-samadhi'
  });
  fullAbhangCardsPage({ saintName, saintSlug, items: individual });
  individual.forEach((item, index) => abhangDetail({ saintName, saintSlug, collectionLabel: 'अभंग', item, index, items: individual }));
}

function generateNilobaray() {
  const saintName = 'संत निळोबाराय महाराज';
  const saintSlug = 'nilobaray';
  const valid = nilobaray.literature.filter((item) => item.title.trim() !== 'पुढे »');
  const categories = valid.slice(1).filter((item) => item.id <= 34);
  const categoryCards = [];
  const usedSlugs = new Set();
  categories.forEach((item) => {
    let slug = sourceSlug(item.url, `category-${item.id}`);
    if (usedSlugs.has(slug)) slug = `${slug}-${item.id}`;
    usedSlugs.add(slug);
    categoryCards.push({ item, slug });
    categoryDetail({ saintName, saintSlug, item, slug });
  });

  const individual = valid.filter((item) => item.id >= 35).map((item) => {
    const match = item.title.match(/(\d{3,4})\s*$/);
    return { ...item, number: match ? Number(match[1]) : item.id };
  }).sort((a, b) => a.number - b.number);

  write(`sants/${saintSlug}/index.html`, landingPage({
    name: saintName,
    cards: [
      { href: 'charitra/index.html', label: 'संत निळोबाराय महाराज चरित्र' },
      { href: 'abhang-gatha/index.html', label: 'संत निळोबाराय अभंग गाथा' },
      { href: 'aarti/index.html', label: 'संत निळोबाराय महाराज आरती' }
    ]
  }));

  contentPage({ saintName, saintSlug, sectionTitle: `${saintName} चरित्र`, content: cleanProseText(nilobaray.biography.full_text), output: 'charitra' });
  contentPage({
    saintName,
    saintSlug,
    sectionTitle: `${saintName} आरती`,
    content: cleanNilobarayAartiText(nilobaray.aarti.full_text),
    output: 'aarti',
    bodyClass: 'nilobaray-aarti-page',
    contentClass: 'nilobaray-aarti-line'
  });

  const categoryHtml = `<section class="remaining-sant-literature-section remaining-sants-category-section">
    <h2 class="tukaram-heading">विषयानुसार साहित्य</h2>
    <div class="remaining-sant-links-grid remaining-sants-category-grid">
      <a href="../abhang/index.html" class="tukaram-link">अभंग</a>
      ${categoryCards.map(({ item, slug }) => `<a href="../sahitya/${slug}/index.html" class="tukaram-link">${escapeHtml(item.title)}</a>`).join('\n')}
    </div>
  </section>`;
  abhangIndex({
    saintName,
    saintSlug,
    label: 'उपलब्ध स्वतंत्र अभंग',
    items: individual,
    directory: 'abhang-gatha',
    extraSections: categoryHtml,
    hideList: true
  });
  fullAbhangCardsPage({ saintName, saintSlug, items: individual });
  individual.forEach((item, index) => abhangDetail({
    saintName,
    saintSlug,
    collectionLabel: 'अभंग गाथा',
    item,
    index,
    items: individual,
    directory: 'abhang-gatha'
  }));
}

function generateVisoba() {
  const saintName = 'संत विसोबा खेचर महाराज';
  const saintSlug = 'visoba-khechar';
  const biography = markdownToText(
    fs.readFileSync(path.join(sourceRoot, 'visoba', 'sant_visoba_khechar_mahiti.md'), 'utf8')
  );
  const samadhi = markdownToText(
    fs.readFileSync(path.join(sourceRoot, 'visoba', 'sant_visoba_khechar_samadhi.md'), 'utf8')
  );

  write(`sants/${saintSlug}/index.html`, landingPage({
    name: saintName,
    cards: [
      { href: 'charitra/index.html', label: 'संत विसोबा खेचर महाराज चरित्र' },
      { href: 'samadhi/index.html', label: 'संत विसोबा खेचर समाधी' }
    ]
  }));
  contentPage({
    saintName,
    saintSlug,
    sectionTitle: `${saintName} चरित्र`,
    content: cleanVisobaBiographyText(biography),
    output: 'charitra'
  });
  underConstructionPage({
    saintName,
    saintSlug,
    sectionTitle: `${saintName} समाधी`,
    output: 'samadhi'
  });
}

function generateNarhari() {
  const saintName = 'संत नरहरी सोनार महाराज';
  const saintSlug = 'narhari-sonar';
  const individual = narhari.abhangas
    .filter((item) => item.id >= 4 && item.id <= 37 && item.title.trim() !== 'पुढे »')
    .map((item, index) => ({
      ...item,
      number: index + 1,
      title: `${item.title} – अभंग ${index + 1}`
    }));

  write(`sants/${saintSlug}/index.html`, landingPage({
    name: saintName,
    cards: [
      { href: 'charitra/index.html', label: 'संत नरहरी सोनार महाराज चरित्र' },
      { href: 'abhang/index.html', label: 'संत नरहरी सोनार महाराज अभंग' },
      { href: 'mandir-samadhi/index.html', label: 'संत नरहरी सोनार महाराज मंदिर व समाधी' }
    ]
  }));

  contentPage({
    saintName,
    saintSlug,
    sectionTitle: `${saintName} चरित्र`,
    content: cleanNarhariBiographyText(narhari.biography.full_text),
    output: 'charitra'
  });
  underConstructionPage({
    saintName,
    saintSlug,
    sectionTitle: `${saintName} मंदिर व समाधी`,
    output: 'mandir-samadhi'
  });
  fullAbhangCardsPage({ saintName, saintSlug, items: individual });
  individual.forEach((item, index) => abhangDetail({
    saintName,
    saintSlug,
    collectionLabel: 'अभंग',
    item,
    index,
    items: individual
  }));
}

generateSantaji();
generateNilobaray();
generateVisoba();
generateNarhari();

console.log('Generated remaining saints: Santaji Jagnade, Nilobaray, Visoba Khechar, and Narhari Sonar.');
