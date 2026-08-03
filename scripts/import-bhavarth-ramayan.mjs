import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// The archival source still serves a legacy certificate chain. This setting is
// scoped to this one-off importer process; fetched HTML is validated for ovi
// blocks before any local file is changed.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const root = path.resolve('Vakibh-media/sants/eknath');
const devanagariDigits = new Map([...'०१२३४५६७८९'].map((digit, index) => [digit, String(index)]));
const toAsciiNumber = (value) => Number([...value].map((char) => devanagariDigits.get(char) ?? char).join(''));

const getKand = (slug) => {
  if (/^bhawarth-ramayan-adhyay-/.test(slug)) return 1;
  if (slug.includes('-ayodhyakand-')) return 2;
  if (slug.includes('-aranyakand-')) return 3;
  if (slug.includes('-kishkindhakand-')) return 4;
  if (slug.includes('-sundarkand-')) return 5;
  if (slug.includes('-yudhkand-')) return 6;
  if (slug.includes('-uttarkand-')) return 7;
  return 0;
};

const folders = (await readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && /^bhawarth-ramayan-.*adhyay-/.test(entry.name));

let cursor = 0;
let imported = 0;
let failed = 0;
let skipped = 0;
const failures = [];

const worker = async () => {
  while (cursor < folders.length) {
    const folder = folders[cursor++];
    const file = path.join(root, folder.name, 'index.html');
    const localHtml = await readFile(file, 'utf8');
    if (localHtml.includes('bhavarth-source-note')) {
      skipped++;
      continue;
    }
    const title = localHtml.match(/<h1[^>]*class="post-title"[^>]*>\s*अध्याय\s*([०-९0-9]+)/u)?.[1]
      || localHtml.match(/<span>\s*अध्याय\s*([०-९0-9]+)\s*<\/span>/u)?.[1];
    const kand = getKand(folder.name);
    const chapter = title ? toAsciiNumber(title) : 0;
    if (!kand || !chapter) {
      failed++;
      failures.push(`${folder.name}: missing kand/chapter`);
      continue;
    }

    const sourceUrl = `https://satsangdhara.net/bh-ram/bhk${kand}a${String(chapter).padStart(2, '0')}.htm`;
    try {
      const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const sourceHtml = await response.text();
      let blocks = [...sourceHtml.matchAll(/<p\s+class="(hdr[234]|sndrbh|ovi)"[^>]*>([\s\S]*?)<\/p>/gi)];
      if (!blocks.some((match) => match[1].toLowerCase() === 'ovi')) {
        blocks = [...sourceHtml.matchAll(/<p\s+class="(hdr[234]|sndrbh|ovi)"[^>]*>([\s\S]*?)(?=<p\s+class=|<\/body>)/gi)];
      }
      const verses = blocks.filter((match) => match[1].toLowerCase() === 'ovi');
      if (!verses.length) throw new Error('no ovi blocks');

      const content = blocks.map((match) => {
        const className = match[1].toLowerCase();
        const mappedClass = className === 'ovi'
          ? 'bhavarth-ramayan-ovi'
          : className === 'sndrbh'
            ? 'bhavarth-ramayan-topic'
            : 'bhavarth-ramayan-source-heading';
        return `<p class="${mappedClass}">${match[2].trim()}</p>`;
      }).join('\n');
      const attribution = `<p class="bhavarth-source-note">स्रोत: <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">सत्संगधारा</a></p>`;
      const replacement = `$1\n${content}\n${attribution}\n$2`;
      const pattern = /(<div[^>]*itemprop="text"[^>]*>)[\s\S]*?(<\/div>\s*<\/div>\s*<\/div>\s*<\/article>)/i;
      let updated;
      if (pattern.test(localHtml)) {
        updated = localHtml.replace(pattern, replacement);
      } else {
        const articlePattern = /<article[^>]*class="post-article"[^>]*>[\s\S]*?<\/article>/i;
        if (!articlePattern.test(localHtml)) throw new Error('local article boundary missing');
        const numberText = title;
        const normalizedArticle = `<article class="post-article"><header class="post-header" style="text-align: center;"><h1 class="post-title">अध्याय ${numberText}</h1></header><div class="post-content"><div class="verse_style"><div itemprop="text">\n${content}\n${attribution}\n</div></div></div></article>`;
        updated = localHtml.replace(articlePattern, normalizedArticle);
      }
      await writeFile(file, updated, 'utf8');
      imported++;
    } catch (error) {
      failed++;
      failures.push(`${folder.name}: ${error.message}`);
    }

    if ((imported + failed) % 25 === 0) {
      process.stdout.write(`processed=${imported + failed}/${folders.length} imported=${imported} failed=${failed}\n`);
    }
  }
};

await Promise.all(Array.from({ length: 8 }, () => worker()));
process.stdout.write(`complete total=${folders.length} imported=${imported} skipped=${skipped} failed=${failed}\n`);
if (failures.length) process.stdout.write(`${failures.join('\n')}\n`);
