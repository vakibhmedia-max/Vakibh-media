import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const requestedChapter = process.argv[2] || '31';
const chapters = {
  '26': { slug: 'adhyay-savvis', title: 'एकनाथी भागवत/अध्याय सव्विसावा', minimumBlocks: 450 },
  '31': { slug: 'adhyay-ektisawa', title: 'एकनाथी भागवत/अध्याय एकतिसावा', minimumBlocks: 550 }
};
const chapter = chapters[requestedChapter];
if (!chapter) throw new Error(`Unsupported chapter: ${requestedChapter}`);
const target = path.join(root, 'Vakibh-media', 'sants', 'eknath', chapter.slug, 'index.html');
const { title } = chapter;
const api = new URL('https://mr.wikisource.org/w/api.php');
api.search = new URLSearchParams({
  action: 'parse',
  page: title,
  prop: 'text',
  format: 'json',
  formatversion: '2',
  utf8: '1'
});

const response = await fetch(api, { headers: { 'user-agent': 'Vakibh content importer/1.0' } });
if (!response.ok) throw new Error(`Wikisource request failed: ${response.status}`);
const data = await response.json();
const sourceHtml = data?.parse?.text || '';
const poemStart = sourceHtml.indexOf('&lt;poem&gt;');
const licenseStart = sourceHtml.indexOf('हे साहित्य भारतात तयार झालेले');
if (poemStart < 0 || licenseStart < 0) throw new Error('Could not locate the Wikisource poem content.');

const decodeHtml = (value) => value
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
  .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&amp;/g, '&');

const raw = decodeHtml(sourceHtml.slice(poemStart, licenseStart)
  .replace(/<br\s*\/?\s*>/gi, '\n')
  .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
  .replace(/<[^>]+>/g, ''));

const lines = raw.split(/\r?\n/)
  .map((line) => line.replace(/\s+/g, ' ').trim())
  .filter(Boolean)
  .filter((line) => !/^<?\/?poem>?$/.test(line))
  .filter((line) => !/^एकनाथी भागवत\s*-\s*(?:आरंभ|श्लोक)/.test(line));

const endIndex = lines.findIndex((line) => /^इति श्री.*भागवते/.test(line));
const contentLines = (endIndex >= 0 ? lines.slice(0, endIndex) : lines)
  .filter((line) => !/कृष्णार्पणमस्तु|^\[\[/.test(line));

const groups = [];
let group = [];
for (const line of contentLines) {
  group.push(line);
  if (/॥\s*[०-९0-9]+\s*॥/.test(line)) {
    groups.push(group);
    group = [];
  }
}
if (group.length) groups.push(group);

if (groups.length < chapter.minimumBlocks) throw new Error(`Unexpectedly short chapter: ${groups.length} blocks.`);

const escapeHtml = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
const content = groups.map((linesInGroup) =>
  `<p>${linesInGroup.map(escapeHtml).join('<br/>\n')}</p>`
).join('\n');

let html = await fs.readFile(target, 'utf8');
html = html.replace(/\s*<p class="eknathi-source-note">[\s\S]*?<\/p>/, '');
const containerPattern = /(<div\s+itemprop="text">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/div>)/;
if (!containerPattern.test(html)) throw new Error('Target content container was not found.');
html = html.replace(containerPattern, `$1\n${content}\n$2`);
if (requestedChapter !== '26') {
  html = html.replace(
    /(\s*<\/div>\s*<\/div>\s*)(<\/div>\s*<\/article>)/,
    `$1<p class="eknathi-source-note">मजकूर स्रोत: <a href="https://mr.wikisource.org/wiki/${title.replaceAll(' ', '_')}" target="_blank" rel="noopener noreferrer">मराठी विकिस्रोत</a></p>\n      $2`
  );
}
await fs.writeFile(target, html, 'utf8');
console.log(`Imported ${groups.length} numbered blocks into ${target}`);
