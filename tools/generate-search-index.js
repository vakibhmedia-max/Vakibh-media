const fs = require('fs');
const path = require('path');

const root = path.resolve('Vakibh-media');
const outFile = path.join(root, 'Vakibh', 'data', 'search-index.json');
const skipDirs = new Set(['.git', 'node_modules', 'www.santsahitya.in', 'extracted_new_data', 'ajax', 'wp-content', 'wp-includes']);

const saintNames = {
  dnyaneshwar: 'संत ज्ञानेश्वर महाराज', tukaram: 'संत तुकाराम महाराज', namdev: 'संत नामदेव महाराज', eknath: 'संत एकनाथ महाराज',
  janabai: 'संत जनाबाई', chokhamela: 'संत चोखामेळा महाराज', muktabai: 'संत मुक्ताबाई', sopandev: 'संत सोपानदेव',
  nivruttinath: 'संत निवृत्तिनाथ', savata: 'संत सावता माळी', gora: 'संत गोरा कुंभार', narhari: 'संत नरहरी सोनार',
  rohidas: 'संत रोहिदास महाराज',
  nilobaray: 'संत निळोबाराय महाराज',
  'santaji-jagnade': 'संत संताजी जगनाडे महाराज',
  'visoba-khechar': 'संत विसोबा खेचर महाराज',
  'narhari-sonar': 'संत नरहरी सोनार महाराज'
};
const saintAliases = {
  dnyaneshwar: 'dnyaneshwar dnyaneshwari jnaneshwar jnaneshwari gyaneshwar gyaneshwari gyanadev jnanadev dnyandev mauli ज्ञानदेव माऊली',
  tukaram: 'tukaram tukoba tuka tukaram maharaj तुकोबा तुका',
  namdev: 'namdev nama नामदेव नामा', eknath: 'eknath eknathi एकनाथ एकनाथी', janabai: 'janabai jani jana जनाबाई जनी',
  chokhamela: 'chokhamela chokhoba चोखामेळा चोखोबा', muktabai: 'muktabai mukta मुक्ताबाई मुक्ता', sopandev: 'sopandev sopan सोपानदेव सोपान',
  nivruttinath: 'nivruttinath nivrutti निवृत्तिनाथ निवृत्ती', savata: 'savata sawata mali सावता सावतामाळी', gora: 'gora kumbhar गोरा कुंभार',
  narhari: 'narhari sonar नरहरी सोनार', rohidas: 'rohidas ravidas रोहिदास रविदास',
  nilobaray: 'nilobaray niloba sant niloba निळोबाराय निळोबा',
  'santaji-jagnade': 'santaji jagnade jaganade संताजी जगनाडे जगनाडे महाराज',
  'visoba-khechar': 'visoba khechar sant visoba विसोबा खेचर विसोबा महाराज',
  'narhari-sonar': 'narhari sonar sant narhari नरहरी सोनार नरहरी महाराज'
};
const contentAliases = [
  ['हरिपाठ', 'haripath hari path hari mukhe mhana hari mukhe mhna हरि मुखे म्हणा'],
  ['गाथा', 'gatha gaatha granth'],
  ['अभंग', 'abhang abhanga bhajan'],
  ['ज्ञानेश्वरी', 'dnyaneshwari jnaneshwari gyaneshwari'],
  ['पसायदान', 'pasaydan pasayadaan'],
  ['अमृतानुभव', 'amrutanubhav amritanubhav'],
  ['चांगदेव', 'changdev changdeo'],
  ['विठ्ठल', 'vitthal vithoba pandurang pandharpur'],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walk(path.join(dir, entry.name), files);
    } else if (/\.html?$/i.test(entry.name)) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function decodeEntities(value = '') {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
function stripTags(html = '') {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function cleanTitle(value = '') {
  return stripTags(value).replace(/\s+[–-]\s+वाकीभ\s*$/i, '').replace(/\s+वाकीभ\s*$/i, '').trim();
}
function relative(file) { return path.relative(root, file).replace(/\\/g, '/'); }
function getSaint(rel) {
  const parts = rel.split('/');
  const idx = parts.indexOf('sants');
  return idx >= 0 ? parts[idx + 1] || '' : '';
}
function typeFor(rel, text) {
  const v = `${rel} ${text}`.toLowerCase();
  if (v.includes('gatha') || v.includes('गाथा')) return 'गाथा';
  if (v.includes('haripath') || v.includes('हरिपाठ')) return 'हरिपाठ';
  if (v.includes('abhang') || v.includes('अभंग')) return 'अभंग';
  if (v.includes('adhyay') || v.includes('अध्याय')) return 'अध्याय';
  return rel.includes('/sants/') ? 'साहित्य' : 'पृष्ठ';
}
function aliasesFor(rel, text, saintSlug) {
  const aliases = [saintAliases[saintSlug] || '', rel.replace(/[\/_.-]+/g, ' ')];
  for (const [needle, alias] of contentAliases) if (text.includes(needle) || rel.toLowerCase().includes(alias.split(' ')[0])) aliases.push(alias);
  return aliases.join(' ').trim();
}
function makeEntry({ title, heading, excerpt, rel, saintSlug, type, hash = '' }) {
  const saint = saintNames[saintSlug] || saintSlug || '';
  const aliases = aliasesFor(rel, `${title} ${heading}`, saintSlug);
  const preview = (excerpt || '').replace(/\s+/g, ' ').trim().slice(0, 420);
  return {
    title: title || heading || 'वाकीभ',
    heading: heading || title || 'वाकीभ',
    saint,
    saintSlug,
    type,
    excerpt: preview.slice(0, 260),
    path: `${rel}${hash}`,
    aliases,
    searchText: `${title} ${heading} ${saint} ${type} ${preview} ${aliases}`.toLowerCase()
  };
}

const entries = [];
for (const file of walk(root)) {
  const rel = relative(file);
  if (!rel || rel.startsWith('Vakibh/') || rel.toLowerCase().includes('/audio/') || /audio/i.test(rel)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const title = cleanTitle(h1Match?.[1] || titleMatch?.[1] || h2Match?.[1] || rel);
  const heading = cleanTitle(h1Match?.[1] || h2Match?.[1] || title);
  const bodyText = stripTags(html).replace(/मुख्यपृष्ठ|गृहपृष्ठ|ग्रंथ|संत|विभाग|मेन्यू|संपर्क/g, ' ').replace(/\s+/g, ' ').trim();
  const saintSlug = getSaint(rel);
  const type = typeFor(rel, `${title} ${heading} ${bodyText}`);

  entries.push(makeEntry({ title, heading, excerpt: bodyText, rel, saintSlug, type }));

  if (/sants\/dnyaneshwar\/abhang-\d/i.test(rel)) {
    const paraRe = /<p[^>]*>\s*(?:<strong[^>]*>\s*([\u0966-\u096F0-9]+)\.?\s*<\/strong>|([\u0966-\u096F0-9]+)\.?)\s*<br\s*\/?>([\s\S]*?)<\/p>\s*(?:<p[^>]*>\s*<strong[^>]*>\s*अर्थ[:-]?\s*<\/strong>\s*<\/p>\s*)?(?:<p[^>]*>([\s\S]*?)<\/p>)?/gi;
    let m;
    while ((m = paraRe.exec(html))) {
      const number = (m[1] || m[2] || '').trim();
      const verse = stripTags(m[3] || '');
      if (!number || verse.length < 10) continue;
      const firstLine = verse.split(/[।॥\n]/)[0].trim() || `अभंग ${number}`;
      entries.push(makeEntry({
        title: `अभंग ${number} - ${firstLine}`,
        heading: firstLine,
        excerpt: verse.trim(),
        rel,
        saintSlug,
        type: 'अभंग',
        hash: `#abhang-${number.replace(/[.)]+$/g, '')}`
      }));
    }
  }
}

const seen = new Set();
const unique = entries.filter((entry) => {
  const key = entry.path + '|' + entry.title;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(unique, null, 0), 'utf8');
console.log(`Wrote ${unique.length} search entries to ${outFile}`);
