const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..", "Vakibh-media", "sants");
const chokhamelaCachePath = path.resolve(__dirname, "..", "database", "chokhamela-abhang-content.json");
const chokhamelaCache = fs.existsSync(chokhamelaCachePath)
  ? JSON.parse(fs.readFileSync(chokhamelaCachePath, "utf8"))
  : {};
const nivruttinathCachePath = path.resolve(__dirname, "..", "database", "nivruttinath-abhang-content.json");
const nivruttinathCache = fs.existsSync(nivruttinathCachePath)
  ? JSON.parse(fs.readFileSync(nivruttinathCachePath, "utf8"))
  : {};
const configs = [
  {
    folder: "janabai",
    list: "abhang/index.html",
    heading: "संत जनाबाई अभंग",
    linkPattern: /<li><a href="(?<href>\.\.\/[^"]+\/index\.html)">(?<title>.*?)<\/a><\/li>/gs,
    sectionPattern: /<section class="abhang-grid-section"[\s\S]*?<\/section>/,
  },
  {
    folder: "chokhamela",
    list: "chokhamela-abhang/index.html",
    heading: "संत चोखामेळा महाराज अभंग",
    linkPattern: /<a href="(?<href>\.\.\/[^"]+\/index\.html)" class="sahitya-link">(?<title>.*?)<\/a>/gs,
    sectionPattern: /<section class="abhang-grid-section"[\s\S]*?<\/section>/,
  },
  {
    folder: "sopandev",
    list: "abhang-list/index.html",
    heading: "संत सोपानदेव महाराज अभंग",
    linkPattern: /<a href="(?<href>\.\.\/[^"]+\/index\.html)" class="sahitya-link">(?<title>.*?)<\/a>/gs,
    sectionPattern: /<section class="abhang-grid-section"[\s\S]*?<\/section>/,
  },
  {
    folder: "muktabai",
    list: "abhang-list/index.html",
    heading: "संत मुक्ताबाई अभंग",
    linkPattern: /<a href="(?<href>\.\.\/[^"]+\/index\.html)" class="sahitya-link">(?<title>.*?)<\/a>/gs,
    sectionPattern: /<section class="abhang-grid-section"[\s\S]*?<\/section>/,
  },
  {
    folder: "nivruttinath",
    list: "abhang-list/index.html",
    heading: "संत निवृत्तीनाथ महाराज अभंग",
    linkPattern: /<a href="(?<href>\.\.\/[^"]+\/index\.html)" class="sahitya-link">(?<title>.*?)<\/a>/gs,
    sectionPattern: /<section class="abhang-grid-section"[\s\S]*?<\/section>/,
  },
];

const devanagariDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
const toDevanagari = (number) =>
  String(number).replace(/\d/g, (digit) => devanagariDigits[Number(digit)]);
const decode = (value) =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)));
const escapeAttribute = (value) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeText = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const chokhamelaTitleKey = (value) =>
  decode(value)
    .replace(/\s*[–-]\s*(?:संत\s+)?चोखामेळा\s+अभंग\s*[–-]\s*[०-९\d]+\s*$/u, "")
    .replace(/\s+/g, " ")
    .trim();
function recoverNivruttinathVerse(title) {
  const normalizedTitle = decode(title).replace(/\s+/g, " ").trim();
  if (nivruttinathCache[normalizedTitle]?.verse) return nivruttinathCache[normalizedTitle].verse;
  const prefixMatches = Object.entries(nivruttinathCache)
    .filter(([key, entry]) => (key.startsWith(normalizedTitle) || normalizedTitle.startsWith(key)) && entry?.verse)
    .sort((a, b) => {
      const aHasLines = /<br\s*\/?>/i.test(a[1].verse) ? 0 : 1;
      const bHasLines = /<br\s*\/?>/i.test(b[1].verse) ? 0 : 1;
      return aHasLines - bHasLines || a[1].verse.length - b[1].verse.length;
    });
  if (prefixMatches[0]?.[1]?.verse) return prefixMatches[0][1].verse;
  for (const entry of Object.values(nivruttinathCache)) {
    for (const paragraph of String(entry.verse || "").matchAll(/<p[^>]*>[\s\S]*?<\/p>/gi)) {
      const plain = decode(paragraph[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
      if (plain.startsWith(normalizedTitle)) return paragraph[0];
    }
  }
  return "";
}
function sanitizeVerse(verse, folder) {
  let cleaned = String(verse || "");
  if (folder === "nivruttinath") {
    const meaningAt = cleaned.search(/(?:भावार्थ|अर्थ)\s*(?:[:：-]|ः)/u);
    if (meaningAt >= 0) cleaned = cleaned.slice(0, meaningAt);
    cleaned = cleaned.replace(
      /<h[1-6][^>]*>[\s\S]*?संत\s+निवृत्तीनाथ\s+अभंग[\s\S]*?<\/h[1-6]>/gi,
      "",
    );
    cleaned = cleaned.replace(
      /<div[^>]*>[\s\S]*?संत\s+निवृत्तीनाथ\s+अभंग[\s\S]*?<\/div>/gi,
      "",
    );
  }
  cleaned = cleaned
    .replace(/<\/?mark[^>]*>/gi, "")
    .replace(/(<p[^>]*>)\s*[०-९\d]+\s*(?:<br\s*\/?>)?/gi, "$1")
    .replace(/<(?:div|span)[^>]*>\s*[०-९\d]+\s*<\/(?:div|span)>/gi, "")
    .trim();
  return cleaned;
}

function extractVerse(source) {
  const postContent = source.match(/<div class="post-content">([\s\S]*?)(?:<div class="abhang-item-actions|<hr class="post-hr"|<!-- Prev)/);
  if (postContent) {
    const directVerse = postContent[1].match(/<p class="abhang-verse"[^>]*>[\s\S]*?<\/p>/);
    if (directVerse) return directVerse[0];
  }

  const itemProp = source.match(/<div\s+itemprop="text">([\s\S]*?)<\/div>/);
  let verse = itemProp ? itemProp[1] : "";
  if (!verse) {
    const styled = source.match(/<div class="verse_style"[^>]*>([\s\S]*?)<\/div>/);
    verse = styled ? styled[1] : "";
  }

  verse = verse
    .replace(/<hr\s*\/?>/gi, "")
    .replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, "")
    .replace(/<span[^>]*>[^<]*–\s*संत[^<]*अभंग[^<]*<\/span>\s*(?:<br\s*\/?>)?/gi, "")
    .replace(/<h3[^>]*>/gi, "<div>")
    .replace(/<\/h3>/gi, "</div>")
    .replace(/<div>\s*<\/div>/gi, "")
    .trim();
  return verse;
}

function actionFooter() {
  return `<div class="abhang-item-actions abhang-card-footer" data-share-scope="item">
              <div class="abhang-actions-left"><button class="abhang-btn copy-abhang-btn" type="button" aria-label="अभंग कॉपी करा"><i class="far fa-copy"></i></button><div class="abhang-share-group"><button class="abhang-btn social-share-btn whatsapp-share-btn" type="button" data-platform="whatsapp" aria-label="व्हॉट्सअॅपवर शेअर करा"><i class="fab fa-whatsapp"></i></button><button class="abhang-btn social-share-btn facebook-share-btn" type="button" data-platform="facebook" aria-label="फेसबुकवर शेअर करा"><i class="fab fa-facebook-f"></i></button><button class="abhang-btn social-share-btn instagram-share-btn" type="button" data-platform="instagram" aria-label="इंस्टाग्रामसाठी कॉपी करा"><i class="fab fa-instagram"></i></button></div></div>
            </div>`;
}

for (const config of configs) {
  const listPath = path.join(root, config.folder, config.list);
  let html = fs.readFileSync(listPath, "utf8");
  const gitPath = path.relative(path.resolve(__dirname, ".."), listPath).replace(/\\/g, "/");
  let linkSource = html;
  try {
    linkSource = execFileSync("git", ["show", `HEAD:${gitPath}`], {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch {
    // A fresh uncommitted list can still be generated directly.
  }
  if (config.folder === "janabai") {
    const originalSection = linkSource.match(/<section class="abhang-grid-section"[\s\S]*?<\/section>/);
    if (originalSection) linkSource = originalSection[0];
  }
  const links = [...linkSource.matchAll(config.linkPattern)];
  const contentLinks = links.filter(
    (link) =>
      !(
        config.folder === "muktabai" &&
        decode(decode(link.groups.title.replace(/<[^>]+>/g, "").trim())) ===
          "ताटीचे अभंग संत मुक्ताबाई"
      ),
  );
  if (!contentLinks.length) throw new Error(`No links found in ${listPath}`);

  const cards = contentLinks.map((link, index) => {
    const number = index + 1;
    const sourceTitle = decode(decode(link.groups.title.replace(/<[^>]+>/g, "").trim()));
    const title = config.folder === "chokhamela" ? chokhamelaTitleKey(sourceTitle) : sourceTitle;
    const sourcePath = path.resolve(path.dirname(listPath), link.groups.href);
    const source = fs.readFileSync(sourcePath, "utf8");
    let verse = extractVerse(source);
    const recoveredChokhamela = chokhamelaCache[chokhamelaTitleKey(title)];
    if (config.folder === "chokhamela" && recoveredChokhamela?.verse) {
      verse = recoveredChokhamela.verse;
    }
    const verseHasText = decode(String(verse || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    if (!verseHasText && config.folder === "nivruttinath") {
      verse = recoverNivruttinathVerse(title);
    }
    verse = sanitizeVerse(verse, config.folder);
    const plainVerse = decode(verse.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    const search = escapeAttribute(`अभंग ${number} ${title} ${plainVerse}`);
    return `          <article class="abhang-content-block" id="abhang-${number}" data-abhang-number="${number}" data-search="${search}">
            <header class="abhang-content-header">
              <span class="abhang-content-number">अभंग ${toDevanagari(number)}</span>
              <h3 class="abhang-content-title">${escapeText(title)}</h3>
            </header>
            <div class="abhang-readable-verses" data-devotional-verse="true">
              <div class="abhang-verse natache-verse" data-devotional-verse="true">${verse}</div>
            </div>
            ${actionFooter()}
          </article>`;
  });

  const section = `    <section class="abhang-grid-section" id="abhang-grid">
      <div class="abhang-grid-inner">
        <h2 class="abhang-grid-heading">${config.heading}</h2>
        <div class="abhang-content-list" id="abhangContentList" data-total-count="${cards.length}">
${cards.join("\n")}
        </div>
      </div>
    </section>`;

  const oldLanding = /<div class="sahitya-landing-container">[\s\S]*?<\/div>\s*<\/div>\s*<\/main>/;
  if (config.sectionPattern && config.sectionPattern.test(html)) {
    html = html.replace(config.sectionPattern, section);
  } else if (oldLanding.test(html)) {
    html = html.replace(oldLanding, `${section}  </main>`);
  } else {
    throw new Error(`Replaceable list section not found in ${listPath}`);
  }

  html = html
    .replace(/<body(?:\s+class="[^"]*")?>/, '<body class="natache-abhang-page abhang-list-page abhang-range-page remaining-sant-full-abhang-page">')
    .replace(/sant\.css\?v=\d+/, "sant.css?v=82");
  fs.writeFileSync(listPath, html, "utf8");
  process.stdout.write(`${config.folder}: ${cards.length} cards\n`);
}
