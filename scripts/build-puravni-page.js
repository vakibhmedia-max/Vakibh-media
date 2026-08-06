const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'database', 'puravni-abhang-ocr.json');
const targetPath = path.join(root, 'Vakibh-media', 'puravni-abhang', 'index.html');
const startMarker = '<!-- PURAVNI TEXT START -->';
const endMarker = '<!-- PURAVNI TEXT END -->';

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cleanPage(text, page) {
  let lines = text.replace(/\r/g, '').split('\n').map((line) => line.replace(/[ \t]+/g, ' ').trim());
  if (page === 661) {
    const firstAbhang = lines.findIndex((line) => /४४०१/.test(line));
    lines = firstAbhang >= 0 ? lines.slice(firstAbhang) : lines;
  } else {
    lines = lines.filter((line, index) => {
      if (index < 4 && /पुरवणी|^[६४५६\s]+$/.test(line)) return false;
      return true;
    });
  }
  return lines
    .filter((line) => !/^[\s.,'"*\-०-९A-Za-z]{1,12}$/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitGroups(text) {
  const matches = [...text.matchAll(/(?:^|\n)\s*(४४[०-२][०-९])\s+/g)];
  const groups = [];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const start = match.index + (match[0].startsWith('\n') ? 1 : 0);
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
    const block = text.slice(start, end).trim();
    if (block) groups.push({ number: match[1], text: block.replace(/^४४[०-२][०-९]\s*/, '') });
  }
  return groups;
}

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
let combined = source.pages.map(({ page, text }) => cleanPage(text, page)).join('\n');
combined = combined.replace(/\n?[^\n]*समाप्त[^\n]*[\s\S]*$/u, '').trim();
combined = combined
  .replace(/,\s*४४०३/g, '\n४४०३')
  .replace(/४४०९६/g, '\n४४०६')
  .replace(/\.\s*\.48१२/g, '\n४४१२')
  .replace(/१४१५/g, '\n४४१५')
  .replace(/,\s*४४१९/g, '\n४४१९')
  .replace(/^\s*[A-Za-z0-9.$'"*\- ]{2,}\s*$/gm, '')
  .replace(/\n{3,}/g, '\n\n');
const groups = splitGroups(combined);
if (groups.length !== 20) throw new Error(`Expected 20 abhangs but detected ${groups.length}.`);

const toMarathiNumber = (value) => String(value).replace(/\d/g, (digit) => '०१२३४५६७८९'[Number(digit)]);

const groupHtml = groups.map(({ number, text }, index) => {
  const cleaned = text
    .replace(/\n([^\n]+पर[ः:]?--?)\n/g, '\n\n$1\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const firstLine = cleaned.split('\n').find(Boolean) || `अभंग ${number}`;
  const title = firstLine.split('।')[0].trim().replace(/[|॥]+$/g, '').trim();
  const displayNumber = toMarathiNumber(index + 1);
  const shareUrl = `location.href.split('#')[0] + '#puravni-${number}'`;
  return `        <section class="puravni-abhang-group" aria-labelledby="puravni-${number}">\n` +
    `          <span class="puravni-abhang-tag">अभंग ${displayNumber}</span>\n` +
    `          <h2 id="puravni-${number}">${escapeHtml(title)}</h2>\n` +
    `          <p>${escapeHtml(cleaned)}</p>\n` +
    `          <div class="abhang-card-footer puravni-card-actions" aria-label="अभंग ${number} शेअर करा">\n` +
    `            <button type="button" class="abhang-btn copy-abhang-btn" aria-label="लिंक कॉपी करा" title="लिंक कॉपी करा" onclick="navigator.clipboard && navigator.clipboard.writeText(${shareUrl})"><i class="far fa-copy"></i></button>\n` +
    `            <button type="button" class="abhang-btn social-share-btn whatsapp-share-btn" aria-label="व्हॉट्सॲपवर शेअर करा" title="व्हॉट्सॲपवर शेअर करा" onclick="window.open('https://wa.me/?text=' + encodeURIComponent('अभंग ${number} ' + ${shareUrl}), '_blank', 'noopener')"><i class="fab fa-whatsapp"></i></button>\n` +
    `            <button type="button" class="abhang-btn social-share-btn facebook-share-btn" aria-label="फेसबुकवर शेअर करा" title="फेसबुकवर शेअर करा" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(${shareUrl}), '_blank', 'noopener')"><i class="fab fa-facebook-f"></i></button>\n` +
    `            <button type="button" class="abhang-btn social-share-btn instagram-share-btn" aria-label="इंस्टाग्रामसाठी कॉपी करा" title="इंस्टाग्रामसाठी कॉपी करा" onclick="navigator.clipboard && navigator.clipboard.writeText(${shareUrl}); window.open('https://www.instagram.com/', '_blank', 'noopener')"><i class="fab fa-instagram"></i></button>\n` +
    `            <button type="button" class="abhang-btn puravni-link-btn" aria-label="अभंगाची लिंक कॉपी करा" title="अभंगाची लिंक कॉपी करा" onclick="navigator.clipboard && navigator.clipboard.writeText(${shareUrl})"><i class="fas fa-link"></i></button>\n` +
    `          </div>\n` +
    `        </section>`;
}).join('\n');

const fragment = `${startMarker}\n` +
  `      <div class="puravni-text-content">\n` +
  `${groupHtml}\n` +
  `      </div>\n` +
  `      ${endMarker}`;

const html = fs.readFileSync(targetPath, 'utf8');
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error('Puravni text markers were not found.');
fs.writeFileSync(targetPath, html.slice(0, start) + fragment + html.slice(end + endMarker.length), 'utf8');
process.stdout.write(`Inserted ${groups.length} abhangs into ${targetPath}.\n`);
