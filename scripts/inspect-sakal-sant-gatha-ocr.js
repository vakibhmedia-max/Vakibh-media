const fs = require('fs');

const source = JSON.parse(fs.readFileSync(process.env.SAKAL_GATHA_OCR || 'D:\\sakal-sant-gatha-ocr.json', 'utf8'));
const requestedPages = process.argv.slice(2).map(Number).filter(Number.isFinite);
if (process.argv.includes('--headers')) {
  for (const { page, text } of source.pages) {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 4);
    console.log(`${page}: ${lines.join(' | ')}`);
  }
  process.exit(0);
}
if (requestedPages.length) {
  for (const pageNumber of requestedPages) {
    const page = source.pages.find((entry) => entry.page === pageNumber);
    console.log(`\n===== PDF PAGE ${pageNumber} =====\n${page?.text || ''}`);
  }
  process.exit(0);
}
const terms = [
  'रूपपर', 'नामपर', 'मोक्ष', 'कीर्तनपर', 'एकविध', 'करुणापर', 'मागणीपर',
  'भक्तवत्स', 'भेटीपर', 'सळगी', 'सलगी', 'प्रेमकळह', 'विठ्ठलपर', 'वैकुंठ',
  'अद्भुत', 'अद्वैत', 'स्थितिपर', 'नाटपर', 'भूपाळ', 'उपदेशपर', 'पाईक',
  'कृष्णमाहात्म्य', 'गौळणी', 'विरहिण', 'खिरापती', 'काल्याचे', 'गळती',
  'घोंगडी', 'संतश्रेष्ठ', 'आळंदी', 'संतपर', 'वैष्णवपर', 'वासुदेव', 'आंधळे',
  'पांगूळ', 'कोल्हाटी', 'अंबुला', 'आशीर्वाद', 'प्रासंगिक', 'मारुतीपर', 'आरत्या'
];

console.log(JSON.stringify({ pages: source.pages.length, first: source.pages[0].page, last: source.pages.at(-1).page }));
for (const term of terms) {
  const hits = source.pages.filter(({ text }) => text.includes(term)).map(({ page }) => page);
  console.log(`${term}: ${hits.slice(0, 20).join(', ')}`);
}

for (const pageNumber of [5, 6, 20, 21, 22, 23]) {
  const page = source.pages.find((entry) => entry.page === pageNumber);
  console.log(`\n===== PDF PAGE ${pageNumber} =====\n${page?.text || ''}`);
}
