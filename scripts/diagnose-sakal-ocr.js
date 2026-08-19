const fs = require('fs');

const sourcePath = process.argv[2] || 'D:/sakal-sant-gatha-highres-ocr.json';
const targets = process.argv.slice(3).map(Number).filter(Number.isFinite);
if (!targets.length) throw new Error('Pass one or more expected abhang numbers.');

const devanagari = '०१२३४५६७८९';
const toNumber = (value) => {
  const digits = [...String(value)].map((character) => devanagari.indexOf(character)).filter((digit) => digit >= 0).join('');
  return digits ? Number(digits) : NaN;
};
const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

for (const page of data.pages) {
  const lines = String(page.text).replace(/\r/g, '').split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const numeric = toNumber(lines[index].slice(0, 14));
    if (!targets.some((target) => Math.abs(numeric - target) <= 2)) continue;
    const from = Math.max(0, index - 1);
    const to = Math.min(lines.length, index + 3);
    console.log(`\n[page ${page.page}, line ${index + 1}, parsed ${numeric}]`);
    console.log(lines.slice(from, to).join('\n'));
  }
}
