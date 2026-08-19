const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = process.env.SAKAL_GATHA_OCR || 'D:\\sakal-sant-gatha-ocr.json';
const highResSourcePath = process.env.SAKAL_GATHA_HIGHRES_OCR || 'D:\\sakal-sant-gatha-highres-ocr.json';
const archiveOcrPath = path.join(root, 'database', 'sakal-gatha-internet-archive-ocr.txt');
const frontSupplementPath = path.join(root, 'database', 'puravni-front-supplement-ocr.json');
const aartyaPath = path.join(root, 'database', 'sakal-gatha-aartya-ocr.json');
const targetPath = process.env.PURAVNI_OUTPUT || path.join(root, 'Vakibh-media', 'puravni-abhang', 'index.html');
const startMarker = '<!-- PURAVNI TEXT START -->';
const endMarker = '<!-- PURAVNI TEXT END -->';
const marathiDigits = '०१२३४५६७८९';

const categories = [
  ['rupapar', 'रूपपर', 21, 34],
  ['namapar', 'नामपर', 35, 80],
  ['moksha', 'मोक्षतुच्छतापर', 81, 90],
  ['kirtanapar', 'कीर्तनपर', 91, 108],
  ['ekavidh', 'एकविध', 109, 126],
  ['karunapar', 'करुणापर', 127, 177],
  ['maganipar', 'मागणीपर', 178, 211],
  ['bhaktavatsalata', 'भक्तवत्सलता', 212, 231],
  ['bhetipar', 'भेटीपर', 232, 241],
  ['salagipar', 'सलगीपर', 242, 260],
  ['premakalaha', 'प्रेमकलहपर', 261, 271],
  ['vitthalpar', 'श्रीविठ्ठलपर', 272, 297],
  ['pandharipar', 'पंढरीपर', 298, 327],
  ['vaikunthapar', 'वैकुंठपर', 328, 330],
  ['advaitapar', 'अद्वैतपर', 331, 352],
  ['advaita-saguna', 'अद्वैत सगुण भक्ती', 353, 355],
  ['sthitipar', 'स्थितीपर', 356, 386],
  ['natapar', 'नाटपर', 387, 399],
  ['bhupalya', 'भूपाळ्या', 400, 402],
  ['upadeshpar', 'उपदेशपर', 403, 484],
  ['paik', 'पाईक अभंग', 485, 487],
  ['krishna-mahatmya', 'श्रीकृष्णमाहात्म्य', 488, 488],
  ['gaulani', 'गौळणी', 489, 524],
  ['virahinya', 'विरहिण्या', 525, 542],
  ['khirapatiche', 'खिरापतीचे अभंग', 543, 543],
  ['kalyache', 'काल्याचे अभंग', 544, 548],
  ['galati', 'गळती', 549, 549],
  ['ghongadi', 'घोंगडी', 550, 552],
  ['sadgurupar', 'सद्गुरुपर', 553, 573],
  ['santashreshtha', 'संतश्रेष्ठांचे स्तवन', 574, 580],
  ['alandi-dehu', 'आळंदी–देहू महिमा', 581, 581],
  ['santapar', 'संतपर', 582, 620],
  ['vaishnavapar', 'वैष्णवपर', 621, 624],
  ['vasudev', 'वासुदेव', 625, 630, null, /\n\s*आंधळे\s*\n/u],
  ['andhale', 'आंधळे', 630, 633, /\n\s*आंधळे\s*\n/u, /\n\s*पांगुळ\s*\n/u],
  ['pangul', 'पांगुळ', 633, 637, /\n\s*पांगुळ\s*\n/u, /\n\s*आंधळा\s+पांगळा\s*\n/u],
  ['andhala-pangala', 'आंधळा पांगळा', 637, 638, /\n\s*आंधळा\s+पांगळा[^\n]*\n/u, /\n\s*कोल्हाटी\s*\n/u],
  ['kolhati', 'कोल्हाटी', 638, 639, /\n\s*कोल्हाटी\s*\n/u, /\n\s*खंडेराव\s*\n/u],
  ['khanderav', 'खंडेराव', 639, 640, /\n\s*खंडेराव\s*\n/u, /\n\s*खेळिया\s*\n/u],
  ['kheliya', 'खेळिया', 640, 644, /\n\s*खेळिया\s*\n/u, /\n\s*गोंधळ\s*\n/u],
  ['gondhal', 'गोंधळ', 644, 647, /\n\s*गोंधळ\s*\n/u, /\n\s*दसरा\s*\n/u],
  ['dasara', 'दसरा', 647, 647, /\n\s*दसरा\s*\n/u],
  ['dhenu', 'धेनु', 648, 648, /\n\s*शरीनामदेवमहारज\s*\n/u, /\n\s*कापडी\s*\n/u],
  ['kapadi', 'कापडी', 648, 649, /\n\s*कापडी\s*\n/u, /\n\s*बाळछंद\s*\n/u],
  ['balachhand', 'बाळछंद', 649, 650, /\n\s*बाळछंद\s*\n/u, /\n\s*[“"']?डौर\s*\n/u],
  ['daur', 'डौर', 650, 651, /\n\s*[“"']?डौर\s*\n/u, /\n\s*अंबुला\s*\n/u],
  ['ambula', 'अंबुला', 651, 652, /\n\s*अंबुला\s*\n/u, /\n\s*(?:आशीर्वाद|आरशाबाद)\s*\n/u],
  ['ashirvad', 'आशीर्वाद', 652, 653, /\n\s*(?:आशीर्वाद|आरशाबाद)\s*\n/u, /\n\s*प्रासंगिक\s+अभंग[^\n]*\n/u],
  ['prasangik', 'प्रासंगिक अभंग', 653, 660, /\n\s*प्रासंगिक\s+अभंग[^\n]*\n/u, /\n\s*श्रीमारुतीपर\s+अभंग[^\n]*\n/u],
  ['marutipar', 'श्रीमारुतीपर अभंग', 660, 661, /\n\s*श्रीमारुतीपर\s+अभंग[^\n]*\n/u, /\n\s*पुरवणी[-–]?अभंग\s*\n/u],
  ['puravni', 'पुरवणी अभंग', 661, 664, /\n\s*पुरवणी[-–]?अभंग\s*\n/u],
  ['aartya', 'आरत्या', 0, 0]
].map(([id, label, startPage, endPage, startPattern, endPattern]) => ({ id, label, startPage, endPage, startPattern, endPattern }));

const expectedRanges = {
  rupapar: [1, 92], namapar: [93, 426], moksha: [427, 488], kirtanapar: [489, 619],
  ekavidh: [620, 749], karunapar: [750, 1142], maganipar: [1143, 1402], bhaktavatsalata: [1403, 1559],
  bhetipar: [1560, 1635], salagipar: [1636, 1767], premakalaha: [1768, 1854], vitthalpar: [1855, 2007],
  pandharipar: [2008, 2224], vaikunthapar: [2225, 2240], advaitapar: [2241, 2413], 'advaita-saguna': [2414, 2436],
  sthitipar: [2437, 2686], natapar: [2687, 2734], bhupalya: [2735, 2752], upadeshpar: [2753, 3375],
  paik: [3376, 3396], 'krishna-mahatmya': [3397, 3402], gaulani: [3403, 3558], virahinya: [3559, 3652],
  khirapatiche: [3653, 3657], kalyache: [3658, 3693], galati: [3694, 3696], ghongadi: [3697, 3715],
  sadgurupar: [3716, 3869], santashreshtha: [3870, 3900], 'alandi-dehu': [3901, 3906], santapar: [3907, 4211],
  vaishnavapar: [4212, 4251], vasudev: [4252, 4270], andhale: [4271, 4279], pangul: [4280, 4288],
  'andhala-pangala': [4289, 4294], kolhati: [4295, 4296], khanderav: [4297, 4297], kheliya: [4298, 4309],
  gondhal: [4310, 4319], dasara: [4320, 4320], dhenu: [4321, 4322], kapadi: [4323, 4324],
  balachhand: [4325, 4325], daur: [4326, 4326], ambula: [4327, 4334], ashirvad: [4335, 4341],
  prasangik: [4342, 4393], marutipar: [4394, 4398], puravni: [4399, 4420]
};

// The supplied 1955 scan jumps directly from 1092 to 1096 on printed page 151.
// These are documented source omissions, not missing website extraction.
const documentedPrintedOmissions = { karunapar: [1093, 1094, 1095] };

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toMarathiNumber(value) {
  return String(value).replace(/\d/g, (digit) => marathiDigits[Number(digit)]);
}

function parseOcrNumberToken(token) {
  const normalized = String(token).replace(/</g, '८').replace(/[^०-९]/gu, '');
  if (!normalized) return NaN;
  return Number(normalized.replace(/[०-९]/g, (digit) => String(marathiDigits.indexOf(digit))));
}

function nearestExpectedNumber(rawNumeric, category, lastNumber) {
  const range = expectedRanges[category.id];
  if (!range || !Number.isFinite(rawNumeric)) return rawNumeric;
  const scopedCorrections = {
    ekavidh: { 221: 621 },
    karunapar: { 214: 914, 1245: 1045, 1708: 1078 },
    sthitipar: { 2991: 2661 },
    upadeshpar: { 2829: 2822 },
    gaulani: { 2408: 3408, 23410: 3410 }
  };
  if (scopedCorrections[category.id]?.[rawNumeric]) return scopedCorrections[category.id][rawNumeric];
  const raw = String(rawNumeric);
  const minimum = Math.max(range[0], lastNumber === null ? range[0] : lastNumber + 1);
  const maximum = Math.min(range[1], lastNumber === null ? range[1] : lastNumber + 50);
  const candidates = [];
  for (let numeric = minimum; numeric <= maximum; numeric += 1) {
    const value = String(numeric);
    if (value.length !== raw.length) {
      // OCR sometimes inserts one extra digit into a valid abhang number.
      if (raw.length === value.length + 1) {
        for (let removed = 0; removed < raw.length; removed += 1) {
          if (raw.slice(0, removed) + raw.slice(removed + 1) === value) {
            candidates.push({ numeric, differences: 1 });
            break;
          }
        }
      }
      continue;
    }
    let differences = 0;
    for (let index = 0; index < value.length; index += 1) if (value[index] !== raw[index]) differences += 1;
    if (differences <= 2) candidates.push({ numeric, differences });
  }
  candidates.sort((left, right) => left.differences - right.differences || left.numeric - right.numeric);
  return candidates[0]?.numeric ?? rawNumeric;
}

function cleanText(text, label) {
  return String(text)
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => {
      if (!line) return true;
      if (/^[०-९\s.,'"|*\-–—]+$/u.test(line) && line.length < 18) return false;
      if (line.length < 55 && /(?:अभंग|भाग दुसरा)$/u.test(line) && (line.includes(label.replace(/ अभंग$/u, '')) || /भाग दुसरा/u.test(line))) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseAbhangs(rawText, category) {
  let text = rawText;
  if (category.startPattern) {
    const match = category.startPattern.exec(text);
    if (match) text = text.slice(match.index + match[0].length);
  }
  if (category.endPattern) {
    const match = category.endPattern.exec(text);
    if (match) text = text.slice(0, match.index);
  }
  text = cleanText(text, category.label);
  const candidates = [...text.matchAll(/(?:^|\n)[^०-९<\n]{0,15}?([०-९<](?:[ \t_.«»-]*[०-९<]){0,4})['’"]?[,.)]?\s+([^\n])/gu)]
    .map((match) => ({ match, numeric: parseOcrNumberToken(match[1]) }));
  const matches = [];
  const acceptedNumericByIndex = new Map();
  let lastNumber = null;
  for (const candidate of candidates) {
    candidate.numeric = nearestExpectedNumber(candidate.numeric, category, lastNumber);
    const range = expectedRanges[category.id];
    if (candidate.numeric < 10 || (range && (candidate.numeric < range[0] || candidate.numeric > range[1]))) continue;
    if (lastNumber !== null && (candidate.numeric <= lastNumber || candidate.numeric - lastNumber > 50)) continue;
    matches.push(candidate.match);
    acceptedNumericByIndex.set(candidate.match.index, candidate.numeric);
    lastNumber = candidate.numeric;
  }
  const groups = [];
  if (category.id === 'rupapar') {
    const firstRegularMatch = matches[0];
    const openingText = firstRegularMatch ? text.slice(0, firstRegularMatch.index) : text;
    const openingMatches = [...openingText.matchAll(/(?:^|\n\s*\n)\s*([१-९])[.)]?\s+([^\n])/gu)]
      .filter((match, index, all) => Number(match[1].replace(/[०-९]/g, (digit) => String(marathiDigits.indexOf(digit)))) === index + 1);

    for (let index = 0; index < openingMatches.length; index += 1) {
      const match = openingMatches[index];
      const start = match.index + (match[0].startsWith('\n') ? match[0].indexOf(match[1]) : 0);
      const end = index + 1 < openingMatches.length ? openingMatches[index + 1].index : openingText.length;
      const block = openingText.slice(start, end).trim();
      const body = block.replace(/^([०-९]{1,4})[.)]?\s*/u, '').trim();
      if (body.length < 20) continue;
      const title = (body.split(/\n|।/u).find(Boolean) || `${category.label} अभंग`).trim().slice(0, 125);
      groups.push({ number: match[1], body, title });
    }
  }
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const start = match.index + (match[0].startsWith('\n') ? 1 : 0);
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
    const block = text.slice(start, end).trim();
    const body = block.replace(/^[^०-९<\n]{0,15}[०-९<](?:[ \t_.«»-]*[०-९<]){0,4}['’"]?[,.)]?\s*/u, '').trim();
    if (body.length < 20) continue;
    const title = (body.split(/\n|।/u).find(Boolean) || `${category.label} अभंग`).trim().slice(0, 125);
    groups.push({ number: toMarathiNumber(acceptedNumericByIndex.get(match.index) ?? parseOcrNumberToken(match[1])), body, title });
  }
  return groups;
}

function textFromOcrFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return data.pages.sort((a, b) => a.page - b.page).map(({ text }) => text.replace(/\r/g, '')).join('\n');
}

function trimExtractedPoem(text) {
  const endings = [...text.matchAll(/॥\s*[०-९0-9धू]+\s*॥/gu)];
  const end = endings.length ? endings.at(-1).index + endings.at(-1)[0].length : text.length;
  return text.slice(0, end).replace(/\n{3,}/g, '\n\n').trim();
}

function extractCuratedPoems(rawText, definitions, numberPrefix) {
  const located = definitions.map((definition) => {
    const index = rawText.indexOf(definition.start);
    if (index < 0) throw new Error(`Supplement start was not found: ${definition.start}`);
    return { ...definition, index };
  }).sort((a, b) => a.index - b.index);

  const perCategoryCount = new Map();
  return located.map((definition, index) => {
    const nextIndex = index + 1 < located.length ? located[index + 1].index : rawText.length;
    const body = trimExtractedPoem(rawText.slice(definition.index, nextIndex));
    const count = (perCategoryCount.get(definition.category) || 0) + 1;
    perCategoryCount.set(definition.category, count);
    return {
      category: definition.category,
      number: `${numberPrefix} ${toMarathiNumber(count)}`,
      tag: numberPrefix === 'आरती' ? `आरती ${toMarathiNumber(count)}` : `पुरवणी अभंग ${toMarathiNumber(count)}`,
      title: definition.title || body.split(/\n|।/u).find(Boolean).trim().slice(0, 125),
      body
    };
  });
}

const frontSupplementDefinitions = [
  ['rupapar', 'सत्यज्ञानानंत'],
  ['namapar', 'खेवा ते आवडी'],
  ['kirtanapar', 'कातेन ऐकावया'],
  ['namapar', 'नाम तेंचि रूप'],
  ['bhetipar', 'आत माझ्या बहु पोटीं'],
  ['bhetipar', 'बोलविखी तेस'],
  ['karunapar', 'समथीचें बाळ'],
  ['karunapar', 'वियोगाच्या दुःख'],
  ['bhetipar', 'दुरुनी आलो तुझे भेटी'],
  ['vitthalpar', 'विठल आयचा निज्ञाचा'],
  ['vitthalpar', 'विठल माझा जीव'],
  ['vitthalpar', 'विठल टाळ'],
  ['vitthalpar', 'आवडी घरोनी'],
  ['vitthalpar', 'आम्हां आवडे नांव'],
  ['bhaktavatsalata', 'भक्त समागमे'],
  ['bhaktavatsalata', 'पक रात्रीचे समयी'],
  ['bhaktavatsalata', 'ऊंस डोंगा'],
  ['natapar', 'कई देखतां होईन'],
  ['natapar', 'एक मागणें हृषीकेशी'],
  ['natapar', 'उभा देखिला भामातीरीं'],
  ['santapar', 'देव ते संत'],
  ['santapar', 'धन्य आजि दिन।'],
  ['santapar', 'घन्य आजि दिन संत'],
  ['santapar', 'गुरुचिया सुखं'],
  ['santapar', 'अस्ताचीं फळे'],
  ['santapar', 'भाग्यवंता पेशी जोड़ी'],
  ['vaishnavapar', 'भूत भाविष्य'],
  ['vaishnavapar', 'आम्हा अळंकार'],
  ['vaishnavapar', 'वृक्षवल्ली'],
  ['gaulani', 'माझें अच वचड़े'],
  ['virahinya', 'अवचिता परिमळ'],
  ['santapar', 'मड मेणाहूनी'],
  ['vaishnavapar', 'आम्ही क्षेत्रींचे']
].map(([category, start]) => ({ category, start }));

const aartyaDefinitions = [
  ['युग अहावीख विटेवरी', 'श्रीपांडुरंगाची आरती'],
  ['आरती ज्ञानराज्ञा', 'श्रीज्ञानेश्वर महाराजांची आरती'],
  ['जयदेव जयदेव जय ज्ञानसिंधु', 'श्रीज्ञानेश्वर महाराजांची दुसरी आरती'],
  ['जन्मता पांडरंगें', 'श्रीनामदेव महाराजांची आरती'],
  ['भातुदासाच्या कुळीं', 'श्रीएकनाथ महाराजांची आरती'],
  ['प्रपंचरचना सर्वही', 'श्रीतुकाराम महाराजांची आरती'],
  ['आरती तुकी स्वामी', 'श्रीतुकाराम महाराजांची दुसरी आरती']
].map(([start, title]) => ({ category: 'aartya', start, title }));

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const pageMap = new Map(source.pages.map(({ page, text }) => [page, text]));
const deferredNamaparCorrections = {
  '९३': { title: 'समुद्रवलयांकित पृथ्वीचे दान', body: `समुद्रवलयांकित पृथ्वीचे दान । करितां समान नये नामा ॥१॥

म्हणऊनि कोणी न करावा आळस । म्हणा रात्रंदिवस राम राम ॥२॥

सकळही शास्त्रें पठण करितां वेद । सरी नये गोविंद नामें एकें ॥३॥

सकळही तीर्थें प्रयागादि काशी । करितां नामासी तुळतीना ॥४॥

करवतीं काशी देहासी दंडण । करितां समान नये नामा ॥५॥

तुका म्हणे ऐसा आहे श्रेष्ठाचार । नाम हेंचि सार विठोबाचें ॥६॥` },
  '९४': { title: 'नाम पावन पावन', body: `नाम पावन पावन । त्याहूनि पवित्र आहे कोण ॥१॥

शिव हाळाहळें तापला । तोही नामें शीतळ झाला ॥२॥

शिवास नामाचा आधार । केला कळिकाळ किंकर ॥३॥

मरण झालें काशीपुरीं । तेथें नामचि उद्धरी ॥४॥

तुका म्हणे अवघीं सोयरीं । एक हरिनाम सोयरे ॥५॥` },
  '९५': { title: 'नाम घेतां उठाउठी', body: `नाम घेतां उठाउठी । होय संसाराची तुटी ॥१॥

ऐसा लाभ बांधा गांठीं । विठ्ठलपायीं पडे मिठी ॥२॥

नामापरतें साधन नाहीं । जें तूं करिसी आणिक कांहीं ॥३॥

हांकायोनि सांगे तुका । नाम घेतां राहूं नका ॥४॥` },
  '९६': { title: 'नाम गोड नाम गोड', body: `नाम गोड नाम गोड । पुरे कोड सकळही ॥१॥

रसना येरां रसां विटे । घेतां घोट अधिक हें ॥२॥

आणिका रसें मरण गांठी । येणें तुटी संसारें ॥३॥

तुका म्हणे आहार झाला । हा विठ्ठल आम्हांसी ॥४॥` },
  '९७': { title: 'नाम घेतां कंठ शीतळ शरीर', body: `नाम घेतां कंठ शीतळ शरीर । इंद्रियां व्यापार नाठवती ॥१॥

गोड हें गोमटें अमृतासी वाड । केला कैवाड माझ्या चित्तें ॥२॥

प्रेमरसें झाली पुष्ट अंगकांती । त्रिविध नासती ताप क्षणें ॥३॥

तुका म्हणे तेथें विकाराची मात । बोलों नये हित सकळांचें ॥४॥` },
  '९८': { title: 'नामाचिया बळें कैवल्यसाधन', body: `नामाचिया बळें कैवल्यसाधन । उगेचि निधान हातां चढे ॥१॥

जाणोनियां वर्म भक्त भागवत । राहिले निवांत प्रेमबोधें ॥२॥

कोण यज्ञ तप वाहे हें काबाड । म्हणती अवघड यारे नाच ॥३॥

उघड समाधि हरिकथा सोहळा । नरनारी बाळा लहान थोर ॥४॥

छंदें वाहती टाळी गाती नामावळी । जयजयकारें होळी दहन दोषां ॥५॥

येणें ब्रह्मानंदें दुमदुमलें जग । सुलभ हा मार्ग सांपडला ॥६॥

तुका म्हणे हरिभक्तीच्या उल्हासें । आणियला त्रास यमदूतां ॥७॥` }
};

for (const category of categories) {
  if (category.id === 'aartya') {
    category.abhangs = [];
    continue;
  }
  const sourceStartPage = category.id === 'rupapar' ? category.startPage : category.startPage - 1;
  const rawText = Array.from({ length: category.endPage - sourceStartPage + 1 }, (_, index) => pageMap.get(sourceStartPage + index) || '').join('\n');
  category.abhangs = parseAbhangs(rawText, category);
  const expectedRange = expectedRanges[category.id];
  if (expectedRange) {
    const markers = [];
    for (const match of rawText.matchAll(/(?:^|\n)[^०-९<\n]{0,15}?([०-९<](?:[ \t_.«»-]*[०-९<]){1,4})['’"]?[,.)]?\s+(\S)/gu)) {
      const numeric = parseOcrNumberToken(match[1]);
      if (numeric < expectedRange[0] || numeric > expectedRange[1]) continue;
      markers.push({ number: toMarathiNumber(numeric), numeric, markerStart: match.index + (match[0].startsWith('\n') ? 1 : 0), bodyStart: match.index + match[0].lastIndexOf(match[2]) });
    }
    const counts = new Map();
    for (const marker of markers) counts.set(marker.numeric, (counts.get(marker.numeric) || 0) + 1);
    const preferredDuplicate = new Map();
    for (let index = 0; index < markers.length; index += 1) {
      const marker = markers[index];
      if (counts.get(marker.numeric) === 1) continue;
      const previous = markers[index - 1]?.numeric;
      const following = markers[index + 1]?.numeric;
      const score = (previous < marker.numeric ? marker.numeric - previous : 10000)
        + (following > marker.numeric ? following - marker.numeric : 10000);
      if (!preferredDuplicate.has(marker.numeric) || score < preferredDuplicate.get(marker.numeric).score) {
        preferredDuplicate.set(marker.numeric, { marker, score });
      }
    }
    for (let index = 0; index < markers.length; index += 1) {
      const marker = markers[index];
      if (category.abhangs.some(({ number }) => number === marker.number)) continue;
      if (counts.get(marker.numeric) !== 1 && preferredDuplicate.get(marker.numeric)?.marker !== marker) continue;
      const next = markers.slice(index + 1).find((candidate) => candidate.numeric > marker.numeric);
      const body = cleanText(rawText.slice(marker.bodyStart, next ? next.markerStart : rawText.length), category.label);
      if (body.length < 20 || body.length > 5000) continue;
      category.abhangs.push({ number: marker.number, title: (body.split(/\n|।/u).find(Boolean) || `${category.label} अभंग`).trim().slice(0, 125), body });
    }
    category.abhangs.sort((left, right) => Number(left.number.replace(/[०-९]/g, (digit) => String(marathiDigits.indexOf(digit)))) - Number(right.number.replace(/[०-९]/g, (digit) => String(marathiDigits.indexOf(digit)))));
  }
}

const baselineByCategoryAndNumber = new Map();
for (const category of categories) {
  for (const abhang of category.abhangs) {
    baselineByCategoryAndNumber.set(`${category.id}:${abhang.number}`, { ...abhang });
  }
}

let highResReplacements = 0;
let guidedHighResReplacements = 0;
let fuzzyHighResReplacements = 0;
let highResAdditions = 0;
let archiveDuplicateRepairs = 0;
let exactHighResDuplicateRepairs = 0;
let similarityGuidedDuplicateRepairs = 0;
let orderedArchiveDuplicateRepairs = 0;
let fallbackArchiveDuplicateRepairs = 0;
const independentCandidatesByNumber = new Map();
const remainingOcrReview = {};
const forcedOcrCards = {
  namapar: [{ number: 238, start: 'गोक्षीर छाविळे', end: '२३९ ज्ञान ध्यान' }],
  ekavidh: [{ number: 621, start: 'पतिन्नता नेणे', end: '«_ ६२२' }],
  karunapar: [
    { number: 914, start: 'कां हो देवा कांहीं', end: '९१५ आतां' },
    { number: 1045, start: 'नावडे प्रपंच तापत्रय', end: 'श्रीजनाबाई' },
    { number: 1078, start: 'पाहतां पंढस्रिया', end: 'श्रीभायुदासमहाराज' },
    { number: 1091, start: 'चरित एकाचिये घरीं', end: '१०९२ शेंबडी' }
  ],
  bhetipar: [{ number: 1593, start: 'तुमची तों भेटी नव्हे', end: '१५९४ आतां' }],
  sthitipar: [{ number: 2661, start: 'अवघाचि संस्रार खुखाचा', end: '२६६२ विठळ्याचे' }],
  upadeshpar: [
    { number: 2822, start: 'भाव धरी तया तारीछ', end: '२८२३ म्मयबार्पे' },
    { number: 3000, start: 'निया राख । डोळे', end: '३००१ संत चिन्ह' },
    { number: 3101, start: 'हो चे कपि', end: 'उपदेशपर अभंग                 ४२७' },
    { number: 3205, start: 'मागें बहतांसी सांगितलें', end: '२०६ सलळगीने' }
  ],
  gaulani: [
    { number: 3408, start: 'मेळवी सवंगडे खेळतसे', end: '३४०९ मिळती' },
    { number: 3410, start: 'जगाचे जीवन ब्रह्म परिपूर्ण', end: '३४११ लक्षाचे' },
    { number: 3438, start: 'सुख डोळां पाहे', end: '_ ३४३९' },
    { number: 3473, start: 'कृष्ण डोळतु रांगतु', end: '३४७४ बाळ' },
    { number: 3478, start: 'हातीं घेऊनिया काठी', end: '३४७९ सोडी' },
    { number: 3487, start: 'पुत्र झाला यशोदेला', end: '३७८८ मग' },
    { number: 3488, start: 'मग म्हणे नंदाजीला', end: '३७८९, आलिया' },
    { number: 3489, start: 'आलिया ब्राह्मणांसी दान', end: '३४९० ब्रह्मा' },
    { number: 3553, start: 'त्वचेचिया रानां धाडू नको मना', end: '३५५४ काय सांगूं' }
  ],
  balachhand: [{ number: 4325, start: 'अलक्षलक्षी मी लक्षी', end: 'डोर.' }],
  virahinya: [{ number: 3647, start: 'घल:वाजे घुणघुणा', end: '३६४९ पांचा' }],
  santapar: [{ number: 3927, start: 'कोणा गांठीं', end: '३९२८ त्यांचिया' }]
};
if (fs.existsSync(highResSourcePath)) {
  const highResSource = JSON.parse(fs.readFileSync(highResSourcePath, 'utf8'));
  const highResPageMap = new Map(highResSource.pages.map(({ page, text }) => [page, text]));

  for (const category of categories) {
    if (!category.startPage) continue;
    const sourceStartPage = category.id === 'rupapar' ? category.startPage : category.startPage - 1;
    const rawText = Array.from(
      { length: category.endPage - sourceStartPage + 1 },
      (_, index) => highResPageMap.get(sourceStartPage + index) || ''
    ).join('\n');
    const highResAbhangs = parseAbhangs(rawText, category);
    const uniqueByNumber = new Map();
    for (const abhang of highResAbhangs) {
      if (uniqueByNumber.has(abhang.number)) uniqueByNumber.set(abhang.number, null);
      else uniqueByNumber.set(abhang.number, abhang);
    }

    for (const definition of forcedOcrCards[category.id] || []) {
      const start = rawText.indexOf(definition.start);
      const end = start < 0 ? -1 : rawText.indexOf(definition.end, start + definition.start.length);
      if (start < 0 || end <= start) continue;
      const body = cleanText(rawText.slice(start, end), category.label);
      if (body.length < 20) continue;
      const recovered = {
        number: toMarathiNumber(definition.number),
        title: (body.split(/\n|।/u).find(Boolean) || `${category.label} अभंग`).trim().slice(0, 125),
        body
      };
      const existingIndex = highResAbhangs.findIndex(({ number }) => number === recovered.number);
      if (existingIndex >= 0) highResAbhangs[existingIndex] = recovered;
      else highResAbhangs.push(recovered);
      uniqueByNumber.set(recovered.number, recovered);
    }

    // Independent expected-number pass. A single bad OCR number must not prevent
    // later valid markers on the same page from becoming cards.
    const expectedRange = expectedRanges[category.id];
    if (expectedRange) {
      const directMarkers = [];
      for (const match of rawText.matchAll(/(?:^|\n)[^०-९<\n]{0,15}?([०-९<](?:[ \t_.«»-]*[०-९<]){1,4})['’"]?[,.)]?\s+(\S)/gu)) {
        const numeric = parseOcrNumberToken(match[1]);
        if (numeric < expectedRange[0] || numeric > expectedRange[1]) continue;
        directMarkers.push({
          number: toMarathiNumber(numeric), numeric,
          markerStart: match.index + (match[0].startsWith('\n') ? 1 : 0),
          bodyStart: match.index + match[0].lastIndexOf(match[2])
        });
      }
      const markerCounts = new Map();
      for (const marker of directMarkers) markerCounts.set(marker.numeric, (markerCounts.get(marker.numeric) || 0) + 1);
      const preferredDuplicate = new Map();
      for (let index = 0; index < directMarkers.length; index += 1) {
        const marker = directMarkers[index];
        if (markerCounts.get(marker.numeric) === 1) continue;
        const previous = directMarkers[index - 1]?.numeric;
        const following = directMarkers[index + 1]?.numeric;
        const score = (previous < marker.numeric ? marker.numeric - previous : 10000)
          + (following > marker.numeric ? following - marker.numeric : 10000);
        if (!preferredDuplicate.has(marker.numeric) || score < preferredDuplicate.get(marker.numeric).score) {
          preferredDuplicate.set(marker.numeric, { marker, score });
        }
      }
      for (let index = 0; index < directMarkers.length; index += 1) {
        const marker = directMarkers[index];
        if (uniqueByNumber.has(marker.number)) continue;
        if (markerCounts.get(marker.numeric) !== 1 && preferredDuplicate.get(marker.numeric)?.marker !== marker) continue;
        const next = directMarkers.slice(index + 1).find((candidate) => candidate.numeric > marker.numeric);
        const body = cleanText(rawText.slice(marker.bodyStart, next ? next.markerStart : rawText.length), category.label);
        if (body.length < 20 || body.length > 5000) continue;
        const title = (body.split(/\n|।/u).find(Boolean) || `${category.label} अभंग`).trim().slice(0, 125);
        const recovered = { number: marker.number, title, body };
        highResAbhangs.push(recovered);
        uniqueByNumber.set(marker.number, recovered);
      }
    }

    // Recover structurally missing cards found unambiguously by the high-resolution
    // OCR. Requiring nearby canonical numbers prevents obvious OCR outliers (for
    // example 54 being read as 754) from becoming new cards.
    const numericValue = (number) => Number(String(number).replace(/[०-९]/g, (digit) => String(marathiDigits.indexOf(digit))));
    const existingNumbers = category.abhangs.map(({ number }) => numericValue(number)).filter(Number.isFinite).sort((a, b) => a - b);
    for (const candidate of uniqueByNumber.values()) {
      if (!candidate || category.abhangs.some(({ number }) => number === candidate.number) || candidate.body.length < 20) continue;
      const numeric = numericValue(candidate.number);
      if (!Number.isFinite(numeric)) continue;
      const lower = existingNumbers.filter((number) => number < numeric).at(-1);
      const upper = existingNumbers.find((number) => number > numeric);
      const bracketed = Number.isFinite(lower) && Number.isFinite(upper) && numeric - lower <= 100 && upper - numeric <= 100;
      const edgeAdjacent = (!Number.isFinite(lower) && Number.isFinite(upper) && upper - numeric <= 10)
        || (Number.isFinite(lower) && !Number.isFinite(upper) && numeric - lower <= 10);
      if (!bracketed && !edgeAdjacent) continue;
      category.abhangs.push({ ...candidate });
      existingNumbers.push(numeric);
      existingNumbers.sort((a, b) => a - b);
      highResAdditions += 1;
    }
    category.abhangs.sort((left, right) => numericValue(left.number) - numericValue(right.number));

    const replacedNumbers = new Set();
    for (const abhang of category.abhangs) {
      const replacement = uniqueByNumber.get(abhang.number);
      if (!replacement) continue;
      const lengthRatio = replacement.body.length / Math.max(1, abhang.body.length);
      const repairsMergedCard = abhang.body.length > 1500 && replacement.body.length >= 20 && replacement.body.length < 1500;
      if (!repairsMergedCard && (lengthRatio < 0.55 || lengthRatio > 1.65)) continue;
      abhang.title = replacement.title;
      abhang.body = replacement.body;
      highResReplacements += 1;
      replacedNumbers.add(abhang.number);
    }

    // Second pass: use the canonical card-number order to locate verses that the
    // generic OCR parser missed. This preserves every existing card and category.
    let cursor = 0;
    const located = [];
    for (const abhang of category.abhangs) {
      const numeric = Number(String(abhang.number).replace(/[०-९]/g, (digit) => String(marathiDigits.indexOf(digit))));
      if (!Number.isFinite(numeric) || numeric < 10) {
        located.push(null);
        continue;
      }
      const escapedNumber = abhang.number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const expression = new RegExp(`(?:^|\\n)\\s*${escapedNumber}[.)]?\\s+(\\S)`, 'gu');
      expression.lastIndex = cursor;
      const match = expression.exec(rawText);
      if (!match) {
        located.push(null);
        continue;
      }
      const bodyStart = match.index + match[0].lastIndexOf(match[1]);
      located.push({ abhang, markerStart: match.index, bodyStart });
      cursor = bodyStart;
    }

    for (let index = 0; index < located.length; index += 1) {
      const item = located[index];
      if (!item || replacedNumbers.has(item.abhang.number)) continue;
      const next = located.slice(index + 1).find(Boolean);
      const end = next ? next.markerStart : rawText.length;
      const body = cleanText(rawText.slice(item.bodyStart, end), category.label);
      const lengthRatio = body.length / Math.max(1, item.abhang.body.length);
      const repairsMergedCard = item.abhang.body.length > 1500 && body.length >= 20 && body.length < 1500;
      if (body.length < 20 || (!repairsMergedCard && (lengthRatio < 0.55 || lengthRatio > 1.65))) continue;
      item.abhang.body = body;
      item.abhang.title = (body.split(/\n|।/u).find(Boolean) || item.abhang.title).trim().slice(0, 125);
      guidedHighResReplacements += 1;
      replacedNumbers.add(item.abhang.number);
    }

    const normalizeForComparison = (value) => String(value)
      .normalize('NFC')
      .replace(/[^ऀ-ॿ]+/gu, '')
      .slice(0, 500);
    const bigrams = (value) => {
      const normalized = normalizeForComparison(value);
      const result = new Set();
      for (let index = 0; index + 1 < normalized.length; index += 1) result.add(normalized.slice(index, index + 2));
      return result;
    };
    const similarity = (left, right) => {
      const a = bigrams(left);
      const b = bigrams(right);
      if (!a.size || !b.size) return 0;
      let common = 0;
      for (const item of a) if (b.has(item)) common += 1;
      return (2 * common) / (a.size + b.size);
    };

    const usedHighRes = new Set();
    for (const abhang of category.abhangs) {
      if (replacedNumbers.has(abhang.number)) {
        const exact = highResAbhangs.find((candidate) => candidate.number === abhang.number);
        if (exact) usedHighRes.add(exact);
      }
    }

    for (const abhang of category.abhangs) {
      if (replacedNumbers.has(abhang.number)) continue;
      const candidates = highResAbhangs
        .filter((candidate) => !usedHighRes.has(candidate))
        .map((candidate) => {
          const lengthRatio = candidate.body.length / Math.max(1, abhang.body.length);
          if (lengthRatio < 0.6 || lengthRatio > 1.55) return null;
          return { candidate, score: similarity(abhang.body, candidate.body) };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);
      const best = candidates[0];
      const runnerUp = candidates[1];
      if (!best || best.score < 0.56 || (runnerUp && best.score - runnerUp.score < 0.08)) continue;
      abhang.title = best.candidate.title;
      abhang.body = best.candidate.body;
      usedHighRes.add(best.candidate);
      replacedNumbers.add(abhang.number);
      fuzzyHighResReplacements += 1;
    }
    remainingOcrReview[category.id] = category.abhangs
      .filter((abhang) => !replacedNumbers.has(abhang.number))
      .map((abhang) => abhang.number);
  }
}

// Printed pages 602–603 are absent from the supplied scan. These two cards are
// restored from the same 1955 edition's Internet Archive text and checked
// against independent Janabai transcriptions.
const vaishnavSourceGapCards = [
  {
    number: '४२३१',
    title: 'वैष्णव तो एक इतर तीं सोंगें',
    body: `वैष्णव तो एक इतर तीं सोंगें । ठसे देउनी अंगें चितारिती ॥१॥

जिचे योनि जन्मला तिसी दंडूं लागला । तीर्थरूप केला देशधडी ॥२॥

नाइकोनी ब्रह्मज्ञान जो का दुराचारी । अखंड द्वेष करी सज्जनांचा ॥३॥

विद्येच्या अभिमानें नाइके कीर्तन । पाखांडी हें म्हणे करिती काई ॥४॥

पंचरस पात्रा कांता हे बडविती । उद्धरलों म्हणती आम्ही संत ॥५॥

कीर्तनाचा द्वेष करी तो चांडाळ । तयाचा विटाळ मातंगीसी ॥६॥

वैष्णव तो एक चोखामेळा महार । जनी म्हणे निर्धार केला संतीं ॥७॥`
  },
  {
    number: '४२३२',
    title: 'वैष्णव तो कबीर चोखामेळा महार',
    body: `वैष्णव तो कबीर चोखामेळा महार । तिजा तो चांभार रोहिदास ॥१॥

सजण कसाई बाया तो कसाब । वैष्णव तो शुद्ध एकनिष्ठ ॥२॥

कमाल फुलार मुकुंद जोहरी । जिहीं देवद्वारीं वस्ती केली ॥३॥

राजाई गोणाई आणि तो नामदेव । वैष्णवांचा राव म्हणवितसे ॥४॥

त्या वैष्णवाचरणीं करी ओवाळणी । तेथें दासी जनी शरीराची ॥५॥`
  }
];
const vaishnavCategory = categories.find(({ id }) => id === 'vaishnavapar');
for (const card of vaishnavSourceGapCards) {
  if (!vaishnavCategory.abhangs.some(({ number }) => number === card.number)) vaishnavCategory.abhangs.push(card);
}
vaishnavCategory.abhangs.sort((left, right) => parseOcrNumberToken(left.number) - parseOcrNumberToken(right.number));

const virahinya3647 = categories.find(({ id }) => id === 'virahinya')?.abhangs.find(({ number }) => number === '३६४७');
if (virahinya3647) {
  virahinya3647.title = 'मज तुरंबा कां वो जिये तिये';
  virahinya3647.body = `मज तुरंबा कां वो जिये तिये । जेणें वेधें हरि सोयरा होये । मज लावा कां वो चंदन ऐसिये परीचे । जे लाविलियाचि अनादि पुसोनि जाये वो ॥१॥

मज करा कां वो कांहीं एक । जेणें करणें ठाके अशेख । सरा कांवो मज आडुनि मज पाहों द्या । आपुले मुख गे माये ॥२॥

मज श्रृंगारा कां वो तया जोगी । पुढती अंग न समाय अंगी । या मना पासोनी पढिये तो गोंवळु । तोचि तो जिव्हारीं भोगीन गे माये ॥३॥

देह पालटा वो तयासाठीं । वरच या देईन अवघी सृष्टी । बापरखुमादेवीवरा विठ्ठलास योगी । तोचि तो त्यागुन भोगीये माये ॥४॥`;
}

const verifiedShortCardCorrections = [
  {
    category: 'kirtanapar', number: '५८४', title: 'अंतर शुद्धीचें कारण',
    body: `अंतर शुद्धीचें कारण । वाचें करा हरिकीर्तन ॥१॥

कीर्तन देवा आवडी कैसी । धेनु धांवे वत्सा जैसी ॥२॥

कीर्तनीं तारिला वाल्हा कोळी । अजामेळ दोषी बळी ॥३॥

कीर्तनीं तारिली गणिका । नामस्मरणें मोक्ष देखा ॥४॥

ऐसी कीर्तनाची गोडी । एकाजनार्दनीं घाली उडी ॥५॥`
  },
  {
    category: 'sthitipar', number: '२४६७', title: 'प्रेमसूत्र दोरी',
    body: `प्रेमसूत्र दोरी । नेतो तिकडे जातो हरी ॥१॥

मनेंसहित वाचा काया । अवघे दिलें पंढरीराया ॥२॥

सत्ता सकळ तया हातीं । माझी कोण काकुलती ॥३॥

तुका म्हणे ठेवी तैसें । आम्ही राहों त्याचे इच्छे ॥४॥`
  },
  {
    category: 'virahinya', number: '३६३८', title: 'आजिवरीं होतें मी मोकाट',
    body: `आजिवरीं होतें मी मोकाट । तंव डोळे फुकट मोडा तुम्हीं ॥१॥

समर्थांचें अंगीं पडलें अवचितीं । तुम्हांपैकी किती चाळविलीं ॥धृ०॥

बापरखुमादेवीवरू विठ्ठलाचि घरवात जाले । जन्मवरी एकांत करूनि ठेले ॥२॥`
  }
];
for (const correction of verifiedShortCardCorrections) {
  const card = categories.find(({ id }) => id === correction.category)?.abhangs.find(({ number }) => number === correction.number);
  if (card) Object.assign(card, correction);
}

// OCR corrections verified directly against the scanned PDF.
const verifiedCorrections = {
  rupapar: {
    '१': {
      title: 'सुंदर तें ध्यान उभे विटेवरी',
      body: `सुंदर तें ध्यान उभे विटेवरी । कर कटावरी ठेवूनियां ॥१॥

तुळसीहार गळां कासे पीतांबर । आवडे निरंतर हेंचि ध्यान ॥२॥

मकरकुंडले तळपती श्रवणी । कंठीं कौस्तुभमणि विराजित ॥३॥

तुका म्हणे माझें हेंचि सर्व सुख । पाहीन श्रीमुख आवडीने ॥४॥`
    },
    '४': {
      title: 'राहो आतां हेंचि ध्यान',
      body: `राहो आतां हेंचि ध्यान । डोळा मन लंपट ॥१॥

कोंडकोंडुनि धरीन जीवें । देहभावें पूजीन ॥२॥

होईल येणें कळसा आलें । स्थिरावलें अंतरीं ॥३॥

तुका म्हणे गोजिरिया । विठोबा पायां पडों द्या ॥४॥`
    },
    '५': {
      title: 'तुझें रूपीं डोळे',
      body: `तुझें रूपीं डोळे । निवती सकळ सोहळे ॥१॥

ध्यान साजिरें गोजिरें । कुंडले तीं मकराकारें ॥२॥

तुझ्या ध्यानाची आवडी । अवलोकितो घडोघडी ॥३॥

तुका म्हणे चित्ता । वाटे न व्हावा परता ॥४॥`
    },
    '६': {
      title: 'धणी न पुरे गुण गातां',
      body: `धणी न पुरे गुण गातां । रूप दृष्टी न्याहाळितां ॥१॥

बरवा बरवा पांडुरंग । कांति सांवळी सुरंग ॥२॥

सकळ मंगळाचें सार । मुख सिद्धीचें भांडार ॥३॥

तुका म्हणे सुखा । अंतपार नाहीं लेखा ॥४॥`
    },
    '७': {
      title: 'रूपीं गुंतले लोचन',
      body: `रूपीं गुंतले लोचन । पायीं स्थिरावलें मन ॥१॥

देहभाव हारपला । तुज पाहतां विठ्ठला ॥२॥

कळों नेदी सुख दुःख । तहान हारपली भूक ॥३॥

तुका म्हणे नव्हे परती । तुझ्या दर्शनें मागुती ॥४॥`
    },
    '८': {
      title: 'तुज पाहतां सामोरी',
      body: `तुज पाहतां सामोरी । दृष्टी न फिरे माघारी ॥१॥

माझें चित्त तुझ्या पायां । मिठी पडली पंढरीराया ॥२॥

नव्हे सारितां निराळें । लवण मेळवितां जळें ॥३॥

तुका म्हणे बळी । जीव दिला पायांतळी ॥४॥`
    },
    '९': {
      title: 'राजस सुकुमार मदनाचा पुतळा',
      body: `राजस सुकुमार मदनाचा पुतळा । रविशशिकळा लोपलिया ॥१॥

कस्तुरी मळवट चंदनाची उटी । रुळे माळ कंठीं वैजयंती ॥२॥

मुगुट कुंडले श्रीमुख शोभले । सुखाचें ओतलें सकळही ॥३॥

कासे सोनसळा पांघरे पाटोळा । घननीळ सांवळा बाईयांनो ॥४॥

सकळही तुम्ही व्हा गे एकीसवा । तुका म्हणे जीवा धीर नाहीं ॥५॥`
    },
    '१२': {
      title: 'पैल पहातां श्रीमुख',
      body: `पैल पहातां श्रीमुख । तहान हारपली भूक ॥१॥

पाहा पाहा डोळेभरी । मूर्ति सांवळी गोजिरी ॥२॥

रविशशि ज्याच्या कळा । तो हा मदनाचा पुतळा ॥३॥

तुका म्हणे वर्णूं काई । घेतों अलई बलई ॥४॥`
    },
    '१८': {
      title: 'मुगुट कुंडलें वनमाळा',
      body: `मुगुट कुंडलें वनमाळा । केशर कस्तुरीचा टिळा ॥१॥

विठो देखिला म्यां दिठी । अंगीं चंदनाची उटी ॥२॥

जडित कंकणें मुद्रिका । कासे पीतांबर नेटका ॥३॥

कटी मेखळा विराजित । वांकी किंकिणी तोडर गर्जत ॥४॥

एक लावण्याची खाणी । जैसा चंद्र पूर्णपणी ॥५॥

निळा म्हणे कटीं कर । अंगकांति मनोहर ॥६॥`
    },
    '१९': {
      title: 'गुण लावण्याची खाणी',
      body: `गुण लावण्याची खाणी । विठोजी मुकुटमणी सकळांचा ॥१॥

जाणे अंतरींचा भाव । देवाधिदेव पूजनीय ॥२॥

ब्रह्मादिक लागती पायीं । भूपती तोही आज्ञांकित ॥३॥

निळा म्हणे लागला भाग्यें । हातीं अनुज्ञेनें गीतां गातां ॥४॥`
    },
    '३३': {
      title: 'पाय जोडूनि विटेवरी',
      body: `पाय जोडूनि विटेवरी । कर ठेवुनी कटावरी ॥१॥

रूप सांवळें सुंदर । कानीं कुंडलें मकराकार ॥२॥

गळां माळ वैजयंती । पुढें गोपाळ नाचती ॥३॥

गरुड सन्मुख उभा । म्हणे जनी धन्य शोभा ॥४॥`
    },
    '३४': {
      title: 'अनंत लावण्याची शोभा',
      body: `अनंत लावण्याची शोभा । तो हा विटेवरी उभा ॥१॥

पितांबर माल गांठीं । भाविकांसी घाली मिठी ॥२॥

त्याचे पाय चुरी हातें । कष्टलीस माझे माते ॥३॥

आवडी बोलें त्यासी । चला जाऊं एकांतासी ॥४॥

ऐसा ब्रह्मींचा पुतळा । दासी जनी पाहे डोळां ॥५॥`
    },
    '३६': {
      title: 'देखतांचि रूप विटेवरी गोजिरें',
      body: `देखतांचि रूप विटेवरी गोजिरें । पाहतां साजिरें चरणकमळ ॥१॥

पाहतां पाहतां दृष्टी धाये जेणें । वैकुंठीचें येणें सहज हातीं ॥२॥

भानुदास म्हणे लावण्य पुतळा । देखियेला डोळां पांडुरंग ॥३॥`
    },
    '३७': {
      title: 'गोड साजिरें रूपस',
      body: `गोड साजिरें रूपस । उभा आहे हृषीकेश । योगी ध्याती जयास । तो हा सर्वेश साजिरा ॥१॥

रूप मंडित सगुण । शंख चक्र पद्म जाण । गळां वैजयंती भूषण । पीतांबर मेखळा ॥२॥

कस्तुरी चंदनाचा टिळा । मस्तकीं मुकुट रेखिला । घवघवीत घन सांवळा । नंदरायाचा नंदनु ॥३॥

हरुषें भानुदास गात । नाम गातसे सदा वाचे । प्रेम विठोबाचें । अंगीं वसे सर्वदा ॥४॥`
    },
    '३८': {
      title: 'शामसुंदर मूर्ति विटेवरी साजिरी',
      body: `शामसुंदर मूर्ति विटेवरी साजिरी । पाउलें गोजिरीं कोमळीं तीं ॥१॥

ध्वजवज्रांकुश चिन्हें मिरवती । कटीं धरिले कर अनुपम शोभती ॥२॥

ऐसा देखिला देव विठ्ठल माये । एकाजनार्दनीं त्यासी गाय ॥३॥`
    },
    '३९': {
      title: 'सुंदर बाळपणाची बुंथी घेउनिया श्रीपती',
      body: `सुंदर बाळपणाची बुंथी घेउनिया श्रीपती । सनकादिक ध्याती तेथें कुंठित गे माय ॥१॥

ब्रह्म वेडावलें गे वेडावलें । पुंडलिकाधीन झालें गे माय ॥२॥

इंद्र चंद्र गुरु उपरमोनी जया सुखा । तो वाळुवंटी देखा संतांसवें गे माय ॥३॥

ऐसा नटधारी मनु सर्वांचे हरी । एका जनार्दनाचे करीं उच्छिष्ट खाय ॥४॥`
    },
    '४०': {
      title: 'डोळियांची भूक हारपली',
      body: `डोळियांची भूक हारपली । पाहतां श्रीविठ्ठल माउली ॥१॥

पुंडलिकें बरवें केलें । परब्रह्म उभें ठेलें ॥२॥

अठ्ठावीस युगें झालीं । अद्यापि न बैसे खालीं ॥३॥

उगा राहिला तिष्ठत । आलियासी क्षेम देत ॥४॥

ऐसा कृपाळु दीनांचा । एकाजनार्दनीं साचा ॥५॥`
    },
    '४१': {
      title: 'विटेवरी दिसे स्वानंदाचा गाभा',
      body: `विटेवरी दिसे स्वानंदाचा गाभा । श्रीमुखाची शोभा काय वानूं ॥१॥

कटीं पितांबर तुळसींचे हार । उभा सर्वेश्वर भक्तिकाजा ॥२॥

लावण्य रूपडें पाहे पुंडलीक । आणीक सम्यक नये दुजा ॥३॥

पाहतां पाहतां विश्रांती पैं झाली । एकाजनार्दनीं माउली संतांची ते ॥४॥`
    },
    '४२': {
      title: 'रूप सांवळें सुकुमार',
      body: `रूप सांवळें सुकुमार । कानीं कुंडलें मकराकार ॥१॥

तो हा पंढरीचा राणा । न कळे योगियांच्या ध्याना ॥२॥

पीतांबर वैजयंती । माथां मुकुट शोभे दीप्ती ॥३॥

एका जनार्दनीं ध्यान । विटे पाउलें समान ॥४॥`
    },
    '४३': {
      title: 'मूर्ति सांवळी गोमटी',
      body: `मूर्ति सांवळी गोमटी । अंगीं केशराची उटी ॥१॥

मुगुट कुंडलें वनमाळा । टिळक रेखिला पिवळा ॥२॥

कर्णी कुंडलें मकराकार । गळां शोभे वैजयंती हार ॥३॥

नेत्र आकर्ण सुकुमार । एका जनार्दनीं विटेवर ॥४॥`
    },
    '४४': {
      title: 'दोन्ही कर ठेवुनी कटीं',
      body: `दोन्ही कर ठेवुनी कटीं । उभा भीवरेचे तटीं ॥१॥

रूप सांवळें सुंदर । गळां वैजयंती हार ॥२॥

कानीं कुंडलें मकराकार । तेज न समाये अंबर ॥३॥

एकाजनार्दनीं उदार । भीमातीरीं दिगंबर ॥४॥`
    },
    '४५': {
      title: 'भीमरथीचे तीरीं',
      body: `भीमरथीचे तीरीं । उभा विठ्ठल विटेवरीं ॥१॥

रूप सांवळें सुंदर । कुंडलें कानीं मकराकार ॥२॥

गळां शोभे वैजयंती । चंद्रसूर्य तेजें लपती ॥३॥

कौस्तुभ हृदयावरी । उटी केशरी साजिरी ॥४॥

एकाजनार्दनीं निढळें । बरवें देखिलें साजिरें ॥५॥`
    }
  }
};

Object.assign(verifiedCorrections.rupapar, {
  '८५': { title: 'अनाम जयासी तेंचि रूप आलें', body: `अनाम जयासी तेंचि रूप आलें । उभें तें राहिलें विटेवरी ॥१॥

पुंडलिकाच्या प्रेमा युगें अठ्ठावीस । समचरणीं वास पंढरीये ॥२॥

चोखा म्हणे ऐसा भक्तांचा कनवाळू । जाणे लळा पाळू भाविकांचा ॥३॥` },
  '८६': { title: 'व्यापक व्यापला तिहीं त्रिभुवनीं', body: `व्यापक व्यापला तिहीं त्रिभुवनीं । चारी वर्ण खाणी विठू माझा ॥१॥

शंख चक्र करीं वैजयंती माळा । नेसला पिवळा पीतांबर ॥२॥

कटावरीं जेणें कर हे ठेविले । ध्यान मिरविलें भीमातीरीं ॥३॥

चोखा म्हणे माझा आनंदाचा कंद । नाम हें गोविंद मिरविलें ॥४॥` },
  '८७': { title: 'श्रीमुख चांगलें कांसे पीतांबर', body: `श्रीमुख चांगलें कांसे पीतांबर । वैजयंती हार रुळे कंठीं ॥१॥

तो माझ्या जीवींचा जिवलग सांवळा । भेटवा हो डोळां संतजन ॥२॥

बहुतांचे धांवणें केलें नानापरी । पुराणेंही थोरी वानिताती ॥३॥

चोखा म्हणे वेदशास्त्रांसी जो साक्षी । तोचि आम्हां रक्षी नानापरी ॥४॥` },
  '८८': { title: 'वैकुंठ पंढरी भीवरेचे तीरीं', body: `वैकुंठ पंढरी भीवरेचे तीरीं । प्रत्यक्ष श्रीहरी उभा तेथें ॥१॥

रूप हें सांवळें गोड तें गोजिरें । धणी न पुरे पाहतां जया ॥२॥

कांसे सोनसळा पीतांबर पिवळा । वैजयंती माळा गळां शोभे ॥३॥

चोखा म्हणे ऐसें सगुण हें ध्यान । विटे समचरण ठेवियेलें ॥४॥` },
  '८९': { title: 'सुखाचें जें सुख चंद्रभागेतटीं', body: `सुखाचें जें सुख चंद्रभागेतटीं । पुंडलिकापाठीं उभें असे ॥१॥

साजिरें गोजिरें समचरणीं उभें । भक्ताचिया लोभें विटेवरी ॥२॥

कर दोनीं कटीं श्रीमुख चांगलें । शंख चक्र मिरवलें गदा पद्म ॥३॥

चोखा म्हणे शोभे वैजयंती कंठीं । चंदनाची उटी सर्व अंगीं ॥४॥` },
  '९०': { title: 'सुंदर मुखकमळ कस्तुरी मळवटीं', body: `सुंदर मुखकमळ कस्तुरी मळवटीं । उभा देखिला तटीं भीवरेच्या ॥१॥

मकराकार कुंडलें श्रवणीं ढाळ देती । गळां वैजयंती मुक्तमाळा ॥२॥

शंख चक्र गदा पद्म चहूं करीं । गरुडवाहन हरी देखियेला ॥३॥

चोखा म्हणे सर्व सुखाचें आगर । तीरा भीवरा विठ्ठल उभा ॥४॥` },
  '९१': { title: 'ज्या कारणें वेदश्रुति अनुवादती', body: `ज्या कारणें वेदश्रुति अनुवादती । तो हा रमापती पंढरीये ॥१॥

सुखाचें ठेवणें क्षीरसागरनिवासी । तो हा पंढरीसी उभा विटे ॥२॥

भाविकां कारणें उभवोनी हात । उदारपणें देत भुक्तिमुक्ति ॥३॥

न पाहे उंच नीच याती कुळ । क्षत्री शूद्र चांडाळ सरते पायीं ॥४॥

चोखा म्हणे ऐसा भावाचा भुकेला । म्हणोनि स्थिरावला भीमातटीं ॥५॥` },
  '९२': { title: 'जाणतें असोनी नेणतें पैं झालें', body: `जाणतें असोनी नेणतें पैं झालें । सुखाला पावलें भक्तांचिया ॥१॥

कैसा हा नवलाव सुखाचा पाहा हो । न कळे माव ब्रह्मादिकां ॥२॥

तो हरी समर्थ पंढरीये उभा । त्रैलोक्याची शोभा शोभतसे ॥३॥

चोखा म्हणे आमुचे दीनांचें माहेर । तें पंढरपूर भीमातटीं ॥४॥` },
  '७७': { title: 'विटेवरी उभा नीट देखिला गे माये', body: `विटेवरी उभा नीट देखिला गे माये । निवाली कांती हरपला देहभाव ॥१॥

तें रूप पाहतां मन माझें वेधलें । नुठेचि कांहीं केलें तेथुनि गे माये ॥२॥

अवघे अवघियाचा विसर पडियेला । पाहतां चरणाला श्रीविठोबाच्या ॥३॥

सेना म्हणे चला जाऊं पंढरीसी । जिवलग विठ्ठलासी भेटावया ॥४॥` },
  '७८': { title: 'विटेवरी उभा जैसा लावण्याचा गाभा', body: `विटेवरी उभा । जैसा लावण्याचा गाभा ॥१॥

पायीं ठेवूनियां माथा । अवघी वारली चिंता ॥२॥

समाधान चित्ता । डोळां श्रीमुख पाहतां ॥३॥

बहु जन्मीं केला लाग । सेना देखे पांडुरंग ॥४॥` },
  '७९': { title: 'जो हा दुर्लभ योगिया जनासी', body: `जो हा दुर्लभ योगिया जनासी । उभाचि देखिला पुंडलिकापासीं ॥१॥

हारपलें दुजेपण फिटला संदेह । निमाली वासना गेला देहभाव ॥२॥

विटेवरी उभा पंढरीचा राणा । सेना म्हणे बहु आवडतो मना ॥३॥` },
  '८०': { title: 'श्रीमुखाची शोभा कस्तुरी मळवट', body: `श्रीमुखाची शोभा कस्तुरी मळवट । उभा असे नीट विटेवरी ॥१॥

कर दोनीं कटीं कुंडलें झळकतीं । तेज हें फांकतीं दशदिशां ॥२॥

वैजयंती माळा चंदनाची उटी । टिळक लल्लाटीं कस्तुरीचा ॥३॥

चोखा म्हणे माझ्या जीवींचा जीवनु । पाहतां तनु मनु भुलोनी जाय ॥४॥` },
  '८१': { title: 'गोजिरें साजिरें श्रीमुख चांगलें', body: `गोजिरें साजिरें श्रीमुख चांगलें । ध्यानीं मिरवलें योगियांच्या ॥१॥

पंढरी भुवैकुंठ भीवरेच्या तीरीं । वैकुंठाचा हरी उभा विटे ॥२॥

राही रखुमाई सत्यभामा नारी । पुंडलिकें सहपरिवारीं आणियेला ॥३॥

वैजयंती माळ किरीटकुंडलें । प्रेमे आलिंगिलें चोखियानें ॥४॥` },
  '८२': { title: 'सर्वही सुखाचें ओतिलें श्रीमुख', body: `सर्वही सुखाचें ओतिलें श्रीमुख । त्रिभुवननायक पंढरीये ॥१॥

कर दोन्ही कटीं सम पाय विटे । शोभलें गोमटें बाळरूप ॥२॥

जीवाचें जीवन योगियांचें धन । चोखा म्हणे मंडन तिन्ही लोकीं ॥३॥` },
  '८३': { title: 'उतरलें सुख चंद्रभागेतटीं', body: `उतरलें सुख चंद्रभागेतटीं । पाहा वाळुवंटीं बाळरूप ॥१॥

बहुतां काळाचें ठेवणें योगियांचें । ध्येय शंकराचें सुख ब्रह्म ॥२॥

जयालागीं अहोरात्र विवादती । तो भक्ताचिये प्रीतीं उभा असे ॥३॥

चोखा म्हणे सर्व सुखाचें आगर । न कळे ज्याचा पार श्रुतिशास्त्रां ॥४॥` },
  '८४': { title: 'अनादि निर्मळ वेदाचें जें मूळ', body: `अनादि निर्मळ वेदाचें जें मूळ । परब्रह्म सोज्वळ विटेवरी ॥१॥

कर दोन्ही कटीं राहिलासे उभा । नीळवर्ण प्रभा फांकतसे ॥२॥

आनंदाचा कंद पाउलें साजिरीं । चोखा म्हणे हरी पंढरीये ॥३॥` },
  '७१': { title: 'मुक्त जीव सदा होती पैं नामपाठें', body: `मुक्त जीव सदा होती पैं नामपाठें । तेंचि रूप विटे देखिलें आम्हीं ॥१॥

पुंडलिकें विठ्ठल आणिला पंढरी । आणूनि लवकरी तारिलें जग ॥२॥

ऐसें पुण्य केलें एका पुंडलिकेंची । निरसली जनाची भ्रमभुली ॥३॥

मुक्ताई चिंतनें मुक्त पैं जाली । चरणीं समरसली हरिपाठें ॥४॥` },
  '७२': { title: 'प्रकृति निर्गुण प्रकृति सगुण', body: `प्रकृति निर्गुण प्रकृति सगुण । दीपें दीप पूर्ण एका तत्त्वें ॥१॥

देखिलें गे माये पंढरीपाटणीं । पुंडलिका अंगणीं विठ्ठलराज ॥२॥

विज्ञानेंसी तेज सज्ञानेसी निज । निर्गुणेंसी चोज केलें सये ॥३॥

मुक्ताई तारक सम्यक विठ्ठल । निवृत्तीनें चोखाळ दाखविलें ॥४॥` },
  '७३': { title: 'शून्यापरतें पाही तंव शून्य तेंही नाहीं', body: `शून्यापरतें पाही तंव शून्य तेंही नाहीं । पाहाते पाहोनि ठायीं ठेवियलें ॥१॥

कैसा गे माये हा तारकु दिवटा । पंढरी वैकुंठा प्रगटला ॥२॥

न कळे याची गती आदि मध्य अंतीं । जेथें श्रुति नेति नेति प्रगटल्या ॥३॥

मुक्ताई सप्रेम विठ्ठल संभ्रम । शून्याहि शून्य समशेजबाजे ॥४॥` },
  '७४': { title: 'विटेवरी उभा नीट कटावरी कर', body: `विटेवरी उभा नीट कटावरी कर । वाट पाहे निरंतर भक्ताची गे माये ॥१॥

श्रीमुकुट रत्नाचा ढाळ देती कुंडलांचा । तुरा खोंविला मोत्याचा तो गे माये ॥२॥

कंठीं शोभे एकावळी । तोडर गर्जे भूमंडळीं । भक्तजनाची माउली तो गे माये ॥३॥

सोनसळा पीतांबर । ब्रीद वागवी मनोहर । सेना वंदी निरंतर तो गे माये ॥४॥` },
  '७५': { title: 'समचरण विटेवरी', body: `समचरण विटेवरी । पाहतां समाधान अंतरीं ॥१॥

चला जाऊं पंढरीसी । भेटूं रखुमाईवरासी ॥२॥

होती संतांचिया भेटी । सांगूं सुखाचिया गोष्टी ॥३॥

जन्ममरणाची चिंता । सेना म्हणे नाहीं आतां ॥४॥` },
  '७६': { title: 'कटीं ठेवूनियां कर', body: `कटीं ठेवूनियां कर । रूप पाहिलें मनोहर ॥१॥

तेणें समाधान चित्ता । पायीं ठेविलिया माथा ॥२॥

मुखें गातों गीत वाजवितों टाळी । नाचतों राउळीं प्रेमसुखें ॥३॥

सेना म्हणे नामापुढें । तुच्छ सकळ बापुडें ॥४॥` },
  '६५': { title: 'बरवा वो हरी बरवा वो', body: `बरवा वो हरी बरवा वो । गोविंद गोपाळ गुण गरुवा वो ॥१॥

सांवळा वो हरी सांवळा वो । मदनमोहन कान्हो गोवळा वो ॥२॥

पाहतां वो हरी पाहतां वो । ध्यान लागलें या चित्ता वो ॥३॥

पडिये वो हरी पडिये वो । बापरखुमादेवीवरु घडिये वो ॥४॥` },
  '६६': { title: 'अनुपम्य मनोहर', body: `अनुपम्य मनोहर । कांसे शोभे पीतांबर । चरणीं ब्रीदाचा तोडर । देखिला देवो ॥१॥

योगियांची कसवटी । दावितसे नेत्रपुटीं । उभा भीवरेच्या तटीं । देखिला देवो ॥२॥

बापरखुमादेवीवरु । पुंडलिका अभयकरु । परब्रह्म साकारु । देखिला देवो ॥३॥` },
  '६७': { title: 'पांडुरंगकांती दिव्य तेज झळकती', body: `पांडुरंगकांती दिव्य तेज झळकती । रत्नकीळ फांकती प्रभा । अगणित लावण्य तेजःपुंजाळलें । न वर्णवे तेथींची शोभा ॥१॥

कानडा हो विठ्ठलु कर्नाटकु । येणें मज लावियला वेधु । खोळ बुंथी घेऊनि खुणाची पालवी । आळविल्या नेदी सादु ॥२॥

शब्देंविण संवादु दुजेंवीण अनुवादु । हें तंव कैसेंनि गमे । परेहि परतें बोलणें खुंटलें । वैखरी कैसेंनि सांगें ॥३॥

पाया पडूं गेलें तंव पाऊलचि न दिसे । उभाचि स्वयंभु असे । समोर कीं पाठिमोरा न कळे । ठकचि पडिलें कैसें ॥४॥

क्षेमालागी जीव उतावीळ माझा । म्हणवूनि स्फुरताती बाहो । क्षेम देऊं गेलें तंव मीचि मी एकली । आसावला जीव राहो ॥५॥

बापरखुमादेविवरु हृदयींचा जाणुनी । अनुभवु सौरसु केला । दृष्टीचा डोळां पाहों मी गेलीये । तंव भीतरीं पालटु झाला ॥६॥` },
  '६८': { title: 'त्रिभंगी देहुडा ठाण मांडुनियां माये', body: `त्रिभंगी देहुडा ठाण मांडुनियां माये । कल्पद्रुमातळीं वेणु वाजवित आहे ॥१॥

गोविंदु वो माये गोपाळु वो । सबाह्य अभ्यंतरीं अवघा परमानंदु वो ॥धृ०॥

सांवळें सगुण सकळां जीवांचें जीवन । घनानंद मूर्ति पाहतां हारपलें मन ॥२॥

शून्य स्थावर जंगम व्यापुनि राहिला अकळ । बापरखुमादेविवरु विठ्ठलु सकळ ॥३॥` },
  '६९': { title: 'तुरे कांबळा डांगेवरी विषाण वेणु घेऊनि करीं', body: `तुरे कांबळा डांगेवरी विषाण वेणु घेऊनि करीं । वैजयंती रुळे कैशी वक्षस्थळावरी ॥१॥

गोविंदु वो पैल गोपाळु माये । सुरतरु तळवटीं देखे कैसा उभा राहे ॥धृ०॥

आडत्रिपुंड्र शोभत द्रुमिळ भारेंसि जे जात । नागर केशरीचीं पुष्पें कैसा खोप मिरवत ॥२॥

हिरिया ऐशा दंतपंक्ति अधर पोंवळ वेली । श्रवणीं कुंडलें ब्रह्मरसाचीं वोतलीं ॥३॥

विश्वाचें जीवन तें म्यां सार देखियलें । योगी ध्याती ध्यानीं ब्रह्म तेंचि गोकुळासि आलें ॥४॥

आजि धन्य धन्य जालें राया कृष्णासि देखिलें । निवृत्तिमुनिरायप्रसादें ध्यान तें हृदयासि आलें ॥५॥` },
  '७०': { title: 'स्वरूपीं पाहतां बिंबीं बिंब उमटे', body: `स्वरूपीं पाहतां बिंबीं बिंब उमटे । तें मेघःश्याम दाटे बुंथी मनीं ॥१॥

चित्त वित्त हरि जाला वो साजणी । अवचिता आंगणीं म्यां देखियला ॥धृ०॥

सांवळा डोळसु चतुर्भुज रूपडें । दिसे चहूंकडे एक तत्त्व ॥२॥

ज्ञानदेव म्हणे द्वैत निरसूनि पाही । एका रूपें वाही तरशील ॥३॥` },
  '५८': { title: 'सर्वांघरीं बिंबला व्यापुनी राहिला', body: `सर्वांघरीं बिंबला व्यापुनी राहिला । पुंडलिकें उभा केला विटेवरी ॥१॥

सांवळा चतुर्भुज कांसे पीतांबर । वैजयंती माळ शोभे कंठीं ॥२॥

कटावरीं कर पाउलें साजिरीं । उभा तो श्रीहरी विटेवरी ॥३॥

एका जनार्दनीं बिंबें तो बिंबला । बिंब बिंबोनी ठेला देहामाजीं ॥४॥` },
  '५९': { title: 'परा पश्यंती मध्यमा', body: `परा पश्यंती मध्यमा । जो न कळे आगमा निगमा । पुंडलिकालागीं धामा । पंढरिये आला तो ॥१॥

तीरीं भीवरेचे तीरीं । कास घालुनी गोमटी । वैजयंती शोभे कंठीं । श्रीवत्सलांछन ॥२॥

शंख चक्र मिरवे करीं । उटी चंदनाची साजिरी । खोपा मिरवे शिरीं । मयूरपिच्छें शोभती ॥३॥

शोभे कस्तुरीचा टिळा । राजस सुंदर सांवळा । एका जनार्दनीं डोळां । वेधिलें मन ॥४॥` },
  '६०': { title: 'ध्यानाचे ध्यान ज्ञानाचे ज्ञान', body: `ध्यानाचे ध्यान ज्ञानाचे ज्ञान । तें समचरण विटेवरी ॥१॥

भावाचा तो भाव देवाचा तो देव । वैकुंठींचा राव विटेवरी ॥२॥

कामाचा तो काम योगियां विश्राम । धामाचा तो धाम विटेवरी ॥३॥

वैराग्याचे वैराग्य मुक्तांचे माहेर । तो देव सर्वेश्वर विटेवरी ॥४॥

भोळियांचा भोळा ज्ञानियांचा डोळा । एका जनार्दनीं सोहळा विटेवरी ॥५॥` },
  '६१': { title: 'गोकुळीं जें शोभलें', body: `गोकुळीं जें शोभलें । तें विटेवरी देखिलें ॥१॥

काळिया पृष्ठीं शोभलें । तें विटेवरी देखिलें ॥२॥

पूतनेहृदयीं शोभलें । तें विटेवरी देखिलें ॥३॥

काळयवनें पाहिलें । तें विटेवरी देखिलें ॥४॥

एका जनार्दनीं भलें । तें विटेवरी देखिलें ॥५॥` },
  '६२': { title: 'भीष्में जया ध्याइलें', body: `भीष्में जया ध्याइलें । तें विटेवरी देखिलें ॥१॥

धर्मरायें पूजियेलें । तें विटेवरी देखिलें ॥२॥

शिशुपाळा अंतक जाहलें । तें विटेवरी देखिलें ॥३॥

एका जनार्दनीं पूजिलें । तें विटेवरी देखिलें ॥४॥` },
  '६३': { title: 'जें द्रौपदीने स्मरिलें', body: `जें द्रौपदीने स्मरिलें । तें विटेवरी शोभलें ॥१॥

जें अर्जुनें स्मरिलें । तें विटेवरी शोभलें ॥२॥

जेणें गजेंद्रा उद्धरिलें । तें विटेवरी शोभलें ॥३॥

जें हनुमंतें स्मरिलें । तें विटेवरी शोभलें ॥४॥

जें पुंडलिकें ध्याइलें । तें एका जनार्दनीं देखिलें ॥५॥` },
  '६४': { title: 'रूप पाहतां लोचनी', body: `रूप पाहतां लोचनी । सुख झालें वो साजणी ॥१॥

तो हा विठ्ठल बरवा । तो हा माधव बरवा ॥२॥

बहुतां सुकृताची जोडी । म्हणुनी विठ्ठलीं आवडी ॥३॥

सर्व सुखाचे आगर । बाप रखुमादेवीवर ॥४॥` },
  '२८': { title: 'वेदांसी अगोचर परब्रह्म कारण', body: `वेदांसी अगोचर परब्रह्म कारण । योगियां हृदयींचें ममत्व निर्वाण । आकळूं न कळेचि शेखीं धरियेलें मौन । तें रूप पंढरीये विटे समचरण ॥१॥

कानडा विठ्ठलवो । उभा भिवरेतीरीं । भक्तांचें आर्तवो जीवा लागलें भारी ॥धृ०॥

भूवैकुंठ पंढरी हे देवें रचियली पैं गा । शिवें ती वंदियेली विठो समचरणांची गंगा । सदाचा नामघोषु कलिमळ जाय भंगा । काय वानूं सुख तेथिंचें भेटिलिया पांडुरंगा ॥२॥

विठ्ठल नाम वाचे जना हाचि उपचारू । म्हणवूनियां दावितुसे कटीं ठेवूनियां करू । येरासी मायानदी कामक्रोध मगरू । ठेवा हा नामयाचा स्वामी विठ्ठल वीरू ॥३॥` },
  '३५': { title: 'चतुर्भुज मूर्ति लावण्य रूपडें', body: `चतुर्भुज मूर्ति लावण्य रूपडें । पाहतां आवडे जीवा बहु ॥१॥

वैजयंती माळा किरीट कुंडलें । भूषण मिरवलें मकराकार ॥२॥

कासे सोनसळा पीतांबर पिवळा । कस्तुरीचा टिळा शोभे माथे ॥३॥

शंख चक्र हातीं पद्म तें शोभलें । भानुदासें वंदिलें चरणकमळ ॥४॥` },
  '२५': { title: 'रूप शामसुंदर नीलोत्पल गाभा', body: `रूप शामसुंदर नीलोत्पल गाभा । सखीये स्वप्नीं शोभा देखियेली ॥१॥

नेत्र विशाल भाळ दंत हिऱ्या ज्योती । बाइये मदनमूर्ति देखियेला ॥२॥

शंख चक्र गदा शोभती चहूं करीं । सखीये गरुडावरीं देखियेला ॥३॥

शयन शेषापृष्ठीं नाभीं परमेष्ठी । गंगा वामांगी देखियेला ॥४॥

पीतांबर कटीतटीं दिव्य चंदन उटी । सखीये जगजेठी देखियेला ॥५॥

विचारितां मानसीं नये जो व्यक्तीसी । नामा केशवासी लुब्धोनी ठेला ॥६॥` },
  '२६': { title: 'वैकुंठीं पाहे तंव चतुर्भुज', body: `वैकुंठीं पाहे तंव चतुर्भुज । परि सुंदर रूप तेथें नाहीं ॥१॥

क्षीरसागरीं पाहे तों तेथें निद्रिस्त । परि सुंदर रूप तेथें नाहीं ॥२॥

द्वारके पाहे तंव पाताळीं चरण । परि सुंदर रूप तेथें नाहीं ॥३॥

हृदयीं पाहे तंव अव्यक्तचि दिसे । परि सुंदर रूप तेथें नाहीं ॥४॥

नामा म्हणे ऐसा सर्व गुण संपूर्ण । पंढरीये उभा शोभतसे ॥५॥` },
  '४६': { title: 'चतुर्भुज साजिरी शोभा', body: `चतुर्भुज साजिरी शोभा । चिन्मय गाभा साकार ॥१॥

शंख चक्र गदा कमळ । कांसे पीतांबर सोज्वळ ॥२॥

मुगुट कुंडलें मेखळा । श्रीवत्स शोभे वक्षस्थळा ॥३॥

निर्गुण सगुण ऐसें ठाण । एका जनार्दनीं ध्यान ॥४॥` },
  '४७': { title: 'सुंदर तें ध्यान मांडीवरी घेउनी', body: `सुंदर तें ध्यान मांडीवरी घेउनी । कौसल्या जननी गीतीं गाये ॥१॥

सुंदर तें ध्यान नंदाच्या अंगणीं । गोपाळ गौळणी खेळताती ॥२॥

सुंदर तें ध्यान चंद्रभागे तटीं । पुंडलिका पाठीं उभें असे ॥३॥

सुंदर तें ध्यान एका जनार्दनीं । जिहीं वनीं मनीं भरलासे ॥४॥` },
  '४८': { title: 'जें या चराचरीं गोमटें', body: `जें या चराचरीं गोमटें । पाहतां वेदां वाट न फुटे । तें पुंडलिकाचे पेठे । उभें नीट विटेवरी ॥१॥

सोपारा सोपार झाला आम्हां । शास्त्र वर्णिती महिमा । न कळे जो आगमानिगमा । वंद्य पुराणा तिहीं लोकीं ॥२॥

सहस्रमुखांचे ठेवणें । योगी ध्याती जया ध्यानें । तो नाचतो कीर्तनें । प्रेमळ भक्त देखोनी ॥३॥

एका जनार्दनीं देखा । आम्हां झाला सुलभ सोपा । निवारूनी भवतापा । उतरी पार निर्धारें ॥४॥` },
  '४९': { title: 'सर्वांचे जें मूळ सर्वांचे जें स्थळ', body: `सर्वांचे जें मूळ सर्वांचे जें स्थळ । तें पदयुगुळ विटेवरी ॥१॥

साजिरे साजिरे कर दोन्ही कटीं । उभा असे तटीं भीवरेच्या ॥२॥

न ये ध्यातां मना आगमाच्या खुणा । कळासींचा राणा ध्यात जया ॥३॥

एका जनार्दनीं परेपरता दुरी । पुंडलिकाचे द्वारीं उभा विठो ॥४॥` },
  '५०': { title: 'वेदाचा विवेक शास्त्रांचा हा बोध', body: `वेदाचा विवेक शास्त्रांचा हा बोध । तो हा परमानंद विठ्ठलमूर्ती ॥१॥

पुराणासी वाड साधनांचे कोड । ते गोडाचे गोड विठ्ठलमूर्ती ॥२॥

ब्रह्मादि वंदिती शिवादि ज्या ध्याती । सर्वांसी विश्रांती विठ्ठलमूर्ती ॥३॥

मुनीजनांचे ध्यान परम पावन । एका जनार्दनीं पावन विठ्ठलमूर्ती ॥४॥` },
  '५१': { title: 'सगुण निर्गुण मूर्ति उभी असे विटे', body: `सगुण निर्गुण मूर्ति उभी असे विटे । कोटी सूर्य दाटे प्रभा तेथें ॥१॥

सुंदर सगुण मूर्ति चतुर्भुज । पाहतां पूर्वज उद्धरती ॥२॥

त्रिभुवनीं गाजे ब्रीदाचा तोडर । तोचि कटीं कर उभा विटे ॥३॥

एका जनार्दनीं नातुडे जो वेदा । उभा तो मर्यादा धरूनियां ॥४॥` },
  '५२': { title: 'परेहूनी परता वैखरीये कानडा', body: `परेहूनी परता वैखरीये कानडा । विठ्ठल उघडा भीमातीरीं ॥१॥

शिणलीं दर्शनें भागलीं पुराणें । शास्त्रांचिये अनुमानें नये दृष्टी ॥२॥

नेति नेति शब्दें श्रुति अनुवादती । ते हे विठ्ठलमूर्ति विटेवरी ॥३॥

एका जनार्दनीं चहूं वाचा वेगळा । तेणें मज चाळा लावियेला ॥४॥` },
  '५३': { title: 'जयाची समदृष्टी पाहूं धांवे मन', body: `जयाची समदृष्टी पाहूं धांवे मन । शोभती चरण विटेवरी ॥१॥

कानडे कानडे वेदांसी कानडे । श्रुतीसी जो आतुडे गीतीं गातां ॥२॥

परात्पर साजिरें बाळरूप गोजिरें । भाग्याचे साजिरें नरनारी ॥३॥

एका जनार्दनीं कैवल्य जिव्हाळा । मदनाचा पुतळा विटेवरी ॥४॥` },
  '५४': { title: 'अकार तो अकारू मकार तो मकारू', body: `अकार तो अकारू मकार तो मकारू । उकाराचा पालव शोभे गे माय ॥१॥

आदि अंत नसे ज्या रूपावेगळें । तें कैसें वोळलें पुंडलिका गे माय ॥२॥

वेद उपशमला पुराणें कुंठित । शास्त्रांची मति नेणत तया सुखा गे माय ॥३॥

जाणते नेणते सर्व वेडावले । ठकलेचि ठेले सांगूं काय गे माय ॥४॥

या पुंडलिकें वेडाविलें चाळवूनि गोविलें । एका जनार्दनीं उभें केलें विटेवरी गे माय ॥५॥` },
  '५५': { title: 'अनंताचे गुण अनंत अपार', body: `अनंताचे गुण अनंत अपार । न कळेचि पार श्रुतिशास्त्रां ॥१॥

तो हा महाराज विटेवरीं उभा । लावण्याचा गाभा शोभतसे ॥२॥

कटावरी कर ठेवी जगजेठी । पाहे कृपादृष्टी भक्तांकडे ॥३॥

पुंडलिकाचे तेजें जोडलासे ठेवा । एका जनार्दनीं सेवा देई देवा ॥४॥` },
  '५६': { title: 'आनंदाचा कंद उभा पांडुरंग', body: `आनंदाचा कंद उभा पांडुरंग । गोपाळांचा संघ भोवता उभा ॥१॥

चंद्रभागातीरीं शोभे पुंडलीक । संत अलोलिक गर्जताती ॥२॥

भोळे भोळे जन गाती तें सांकडे । विठ्ठला आवडे प्रेम त्यांचें ॥३॥

नारीनर मिळाले आनंदें गजर । होत जयजयकार महाद्वारीं ॥४॥

एका जनार्दनीं प्रेमळ ते जन । करिती भजन विठोबाचे ॥५॥` },
  '५७': { title: 'देतो मोक्ष मुक्ती वांटितसे फुका', body: `देतो मोक्ष मुक्ती वांटितसे फुका । ऐसा हा निश्चयो देखा करूनि ठेला ॥१॥

सांवळें रूपडें गोजिरें गोमटें । उभें पुंडलिक पेठें पंढरीये ॥२॥

वांटितसे इच्छा जयासी जे आहे । उभारूनी बाह्या देत असे ॥३॥

एका जनार्दनीं देतां न सरे मागें । जाहला असती युगें अठ्ठावीस ॥४॥` }
});

verifiedCorrections.namapar = deferredNamaparCorrections;

for (const category of categories) {
  const corrections = verifiedCorrections[category.id];
  if (!corrections) continue;
  for (const [number, correction] of Object.entries(corrections)) {
    let abhang = category.abhangs.find((candidate) => candidate.number === number);
    if (abhang) {
      Object.assign(abhang, correction);
    } else {
      abhang = { number, ...correction };
      const numeric = Number(number.replace(/[०-९]/g, (digit) => String(marathiDigits.indexOf(digit))));
      const insertionIndex = category.abhangs.findIndex((candidate) => {
        const candidateNumeric = Number(candidate.number.replace(/[०-९]/g, (digit) => String(marathiDigits.indexOf(digit))));
        return Number.isFinite(candidateNumeric) && candidateNumeric > numeric;
      });
      if (insertionIndex < 0) category.abhangs.push(abhang);
      else category.abhangs.splice(insertionIndex, 0, abhang);
    }
    if (remainingOcrReview[category.id]) {
      remainingOcrReview[category.id] = remainingOcrReview[category.id].filter((reviewNumber) => reviewNumber !== number);
    }
  }
}

// Page 28 OCR read abhang 54 as 754; the verified 54 record above replaces it.
const rupaparCategory = categories.find(({ id }) => id === 'rupapar');
rupaparCategory.abhangs = rupaparCategory.abhangs.filter(({ number }) => number !== '७५४');
if (remainingOcrReview.rupapar) {
  remainingOcrReview.rupapar = remainingOcrReview.rupapar.filter((number) => number !== '७५४');
}

// A missed OCR number can leave the first poem followed by many later poems in
// one card. Abhangs consistently close with a double danda and verse number;
// for an obviously merged body, keep the first complete poem only.
// Repair exact duplicate assignments with an independent OCR of the same 1955
// edition. Only cards whose current bodies collide are considered, and only an
// unambiguous printed-number candidate ending in a complete abhang is accepted.
if (fs.existsSync(archiveOcrPath)) {
  const normalizeBody = (value) => String(value).normalize('NFC').replace(/[^ऀ-ॿ]+/gu, '');
  const bodyOwners = new Map();
  for (const category of categories) {
    for (const abhang of category.abhangs) {
      const key = normalizeBody(abhang.body);
      if (key.length < 40) continue;
      const owners = bodyOwners.get(key) || [];
      owners.push({ category, abhang });
      bodyOwners.set(key, owners);
    }
  }
  const duplicateCards = new Set([...bodyOwners.values()].filter((owners) => owners.length > 1).flatMap((owners) => owners.map(({ abhang }) => abhang)));
  const archiveText = fs.readFileSync(archiveOcrPath, 'utf8').replace(/\r/g, '');
  const archiveMarkers = [...archiveText.matchAll(/(?:^|\n)\s*([०-९]{1,5})\s+([^\n])/gu)]
    .map((match) => ({
      numeric: parseOcrNumberToken(match[1]),
      markerStart: match.index + (match[0].startsWith('\n') ? 1 : 0),
      bodyStart: match.index + match[0].lastIndexOf(match[2]),
    }))
    .filter(({ numeric }) => numeric >= 1 && numeric <= 4420);
  const archiveCandidates = new Map();
  for (let index = 0; index < archiveMarkers.length; index += 1) {
    const marker = archiveMarkers[index];
    const rawBody = archiveText.slice(marker.bodyStart, archiveMarkers[index + 1]?.markerStart ?? archiveText.length);
    const ending = [...rawBody.matchAll(/॥\s*[०-९0-9]+\s*॥/gu)].at(-1);
    if (!ending) continue;
    const body = rawBody.slice(0, ending.index + ending[0].length).replace(/\n{3,}/g, '\n\n').trim();
    if (body.length < 40 || body.length > 2200) continue;
    const candidates = archiveCandidates.get(marker.numeric) || [];
    if (!candidates.some((candidate) => normalizeBody(candidate) === normalizeBody(body))) candidates.push(body);
    archiveCandidates.set(marker.numeric, candidates);
    const independent = independentCandidatesByNumber.get(marker.numeric) || [];
    if (!independent.some((candidate) => normalizeBody(candidate) === normalizeBody(body))) independent.push(body);
    independentCandidatesByNumber.set(marker.numeric, independent);
  }
  for (const category of categories) {
    for (const abhang of category.abhangs) {
      if (!duplicateCards.has(abhang)) continue;
      const numeric = parseOcrNumberToken(abhang.number);
      const candidates = archiveCandidates.get(numeric) || [];
      if (candidates.length !== 1) continue;
      const body = cleanText(candidates[0], category.label);
      if (body.length < 40) continue;
      abhang.body = body;
      abhang.title = (body.split(/\n|।/u).find(Boolean) || abhang.title).trim().slice(0, 125);
      archiveDuplicateRepairs += 1;
    }
  }
}

if (fs.existsSync(highResSourcePath)) {
  const normalizeBody = (value) => String(value).normalize('NFC').replace(/[^ऀ-ॿ]+/gu, '');
  const ownersByBody = new Map();
  for (const category of categories) {
    for (const abhang of category.abhangs) {
      const key = normalizeBody(abhang.body);
      if (key.length < 40) continue;
      const owners = ownersByBody.get(key) || [];
      owners.push({ category, abhang });
      ownersByBody.set(key, owners);
    }
  }
  const duplicateCards = new Set([...ownersByBody.values()].filter((owners) => owners.length > 1).flatMap((owners) => owners.map(({ abhang }) => abhang)));
  const source = JSON.parse(fs.readFileSync(highResSourcePath, 'utf8'));
  const text = source.pages.sort((left, right) => left.page - right.page).map(({ text: pageText }) => pageText).join('\n');
  const markers = [...text.matchAll(/(?:^|\n)\s*([०-९]{1,5})\s+([^\n])/gu)]
    .map((match) => ({
      numeric: parseOcrNumberToken(match[1]),
      markerStart: match.index + (match[0].startsWith('\n') ? 1 : 0),
      bodyStart: match.index + match[0].lastIndexOf(match[2]),
    }))
    .filter(({ numeric }) => numeric >= 1 && numeric <= 4420);
  const candidatesByNumber = new Map();
  for (let index = 0; index < markers.length; index += 1) {
    const marker = markers[index];
    const rawBody = text.slice(marker.bodyStart, markers[index + 1]?.markerStart ?? text.length);
    const ending = [...rawBody.matchAll(/॥\s*[०-९0-9]+\s*॥/gu)].at(-1);
    if (!ending) continue;
    const body = rawBody.slice(0, ending.index + ending[0].length).replace(/\n{3,}/g, '\n\n').trim();
    if (body.length < 40 || body.length > 2200) continue;
    const candidates = candidatesByNumber.get(marker.numeric) || [];
    if (!candidates.some((candidate) => normalizeBody(candidate) === normalizeBody(body))) candidates.push(body);
    candidatesByNumber.set(marker.numeric, candidates);
    const independent = independentCandidatesByNumber.get(marker.numeric) || [];
    if (!independent.some((candidate) => normalizeBody(candidate) === normalizeBody(body))) independent.push(body);
    independentCandidatesByNumber.set(marker.numeric, independent);
  }
  for (const category of categories) {
    for (const abhang of category.abhangs) {
      if (!duplicateCards.has(abhang)) continue;
      const candidates = candidatesByNumber.get(parseOcrNumberToken(abhang.number)) || [];
      if (candidates.length !== 1) continue;
      const body = cleanText(candidates[0], category.label);
      if (body.length < 40) continue;
      abhang.body = body;
      abhang.title = (body.split(/\n|।/u).find(Boolean) || abhang.title).trim().slice(0, 125);
      exactHighResDuplicateRepairs += 1;
    }
  }
}

{
  const normalizeBody = (value) => String(value).normalize('NFC').replace(/[^ऀ-ॿ]+/gu, '');
  const bigrams = (value) => {
    const normalized = normalizeBody(value);
    const result = new Set();
    for (let index = 0; index + 1 < normalized.length; index += 1) result.add(normalized.slice(index, index + 2));
    return result;
  };
  const similarity = (left, right) => {
    const leftBigrams = bigrams(left);
    const rightBigrams = bigrams(right);
    if (!leftBigrams.size || !rightBigrams.size) return 0;
    let common = 0;
    for (const item of leftBigrams) if (rightBigrams.has(item)) common += 1;
    return (2 * common) / (leftBigrams.size + rightBigrams.size);
  };
  const ownersByBody = new Map();
  for (const category of categories) {
    for (const abhang of category.abhangs) {
      const key = normalizeBody(abhang.body);
      if (key.length < 40) continue;
      const owners = ownersByBody.get(key) || [];
      owners.push({ category, abhang });
      ownersByBody.set(key, owners);
    }
  }
  const duplicateCards = new Set([...ownersByBody.values()].filter((owners) => owners.length > 1).flatMap((owners) => owners.map(({ abhang }) => abhang)));
  for (const category of categories) {
    for (const abhang of category.abhangs) {
      if (!duplicateCards.has(abhang)) continue;
      const baseline = baselineByCategoryAndNumber.get(`${category.id}:${abhang.number}`);
      if (!baseline || baseline.body.length < 40) continue;
      const candidates = (independentCandidatesByNumber.get(parseOcrNumberToken(abhang.number)) || [])
        .map((body) => ({ body, score: similarity(baseline.body, body) }))
        .filter(({ body }) => {
          const ratio = body.length / Math.max(1, baseline.body.length);
          return ratio >= 0.5 && ratio <= 1.9;
        })
        .sort((left, right) => right.score - left.score);
      const best = candidates[0];
      const runnerUp = candidates[1];
      if (!best || best.score < 0.62 || (runnerUp && best.score - runnerUp.score < 0.1)) continue;
      const body = cleanText(best.body, category.label);
      if (body.length < 40 || normalizeBody(body) === normalizeBody(abhang.body)) continue;
      abhang.body = body;
      abhang.title = (body.split(/\n|।/u).find(Boolean) || abhang.title).trim().slice(0, 125);
      similarityGuidedDuplicateRepairs += 1;
    }
  }
}

if (fs.existsSync(archiveOcrPath)) {
  const normalizeBody = (value) => String(value).normalize('NFC').replace(/[^ऀ-ॿ]+/gu, '');
  const ownersByBody = new Map();
  for (const category of categories) {
    for (const abhang of category.abhangs) {
      const key = normalizeBody(abhang.body);
      if (key.length < 40) continue;
      const owners = ownersByBody.get(key) || [];
      owners.push({ category, abhang });
      ownersByBody.set(key, owners);
    }
  }
  const duplicateCards = new Set([...ownersByBody.values()].filter((owners) => owners.length > 1).flatMap((owners) => owners.map(({ abhang }) => abhang)));
  const fullText = fs.readFileSync(archiveOcrPath, 'utf8').replace(/\r/g, '');
  const mainStartMatch = /(?:^|\n)\s*१०\s+साजिरे/u.exec(fullText);
  const mainText = mainStartMatch ? fullText.slice(mainStartMatch.index) : fullText;
  const markers = [...mainText.matchAll(/(?:^|\n)\s*([०-९]{2,5})\s+([^\n])/gu)]
    .map((match) => ({
      numeric: parseOcrNumberToken(match[1]),
      markerStart: match.index + (match[0].startsWith('\n') ? 1 : 0),
      bodyStart: match.index + match[0].lastIndexOf(match[2]),
    }))
    .filter(({ numeric }) => numeric >= 10 && numeric <= 4420);
  const candidatesByNumber = new Map();
  for (let index = 0; index < markers.length; index += 1) {
    const marker = markers[index];
    const next = markers.slice(index + 1).find((candidate) => candidate.numeric > marker.numeric && candidate.numeric - marker.numeric <= 5);
    if (!next) continue;
    const rawBody = mainText.slice(marker.bodyStart, next.markerStart);
    const ending = [...rawBody.matchAll(/॥\s*[०-९0-9]+\s*॥/gu)].at(-1);
    if (!ending) continue;
    const body = rawBody.slice(0, ending.index + ending[0].length).replace(/\n{3,}/g, '\n\n').trim();
    if (body.length < 40 || body.length > 2200) continue;
    const candidates = candidatesByNumber.get(marker.numeric) || [];
    if (!candidates.some((candidate) => normalizeBody(candidate) === normalizeBody(body))) candidates.push(body);
    candidatesByNumber.set(marker.numeric, candidates);
  }
  for (const category of categories) {
    for (const abhang of category.abhangs) {
      if (!duplicateCards.has(abhang)) continue;
      const candidates = candidatesByNumber.get(parseOcrNumberToken(abhang.number)) || [];
      if (candidates.length !== 1) continue;
      const body = cleanText(candidates[0], category.label);
      if (body.length < 40 || normalizeBody(body) === normalizeBody(abhang.body)) continue;
      abhang.body = body;
      abhang.title = (body.split(/\n|।/u).find(Boolean) || abhang.title).trim().slice(0, 125);
      orderedArchiveDuplicateRepairs += 1;
    }
  }

  const remainingOwnersByBody = new Map();
  for (const category of categories) {
    for (const abhang of category.abhangs) {
      const key = normalizeBody(abhang.body);
      if (key.length < 40) continue;
      const owners = remainingOwnersByBody.get(key) || [];
      owners.push({ category, abhang });
      remainingOwnersByBody.set(key, owners);
    }
  }
  const remainingDuplicateCards = new Set([...remainingOwnersByBody.values()].filter((owners) => owners.length > 1).flatMap((owners) => owners.map(({ abhang }) => abhang)));
  const fallbackCandidatesByNumber = new Map();
  for (let index = 0; index < markers.length; index += 1) {
    const marker = markers[index];
    const next = markers.slice(index + 1).find((candidate) => candidate.numeric > marker.numeric && candidate.numeric - marker.numeric <= 50);
    if (!next || next.numeric - marker.numeric <= 5) continue;
    const rawBody = mainText.slice(marker.bodyStart, next.markerStart);
    const ending = [...rawBody.matchAll(/॥\s*[०-९0-9]+\s*॥/gu)][0];
    if (!ending) continue;
    const body = rawBody.slice(0, ending.index + ending[0].length).replace(/\n{3,}/g, '\n\n').trim();
    if (body.length < 40 || body.length > 1200) continue;
    const candidates = fallbackCandidatesByNumber.get(marker.numeric) || [];
    if (!candidates.some((candidate) => normalizeBody(candidate) === normalizeBody(body))) candidates.push(body);
    fallbackCandidatesByNumber.set(marker.numeric, candidates);
  }
  for (const category of categories) {
    for (const abhang of category.abhangs) {
      if (!remainingDuplicateCards.has(abhang)) continue;
      const candidates = fallbackCandidatesByNumber.get(parseOcrNumberToken(abhang.number)) || [];
      if (candidates.length !== 1) continue;
      const body = cleanText(candidates[0], category.label);
      if (body.length < 40 || normalizeBody(body) === normalizeBody(abhang.body)) continue;
      abhang.body = body;
      abhang.title = (body.split(/\n|।/u).find(Boolean) || abhang.title).trim().slice(0, 125);
      fallbackArchiveDuplicateRepairs += 1;
    }
  }
}

const gaulani3553 = categories.find(({ id }) => id === 'gaulani')?.abhangs.find(({ number }) => number === '३५५३');
if (gaulani3553) {
  gaulani3553.title = 'त्वचेचिया रानां धाडू नको मना';
  gaulani3553.body = `त्वचेचिया रानां धाडू नको मना । तेथे नेदाचा कान्हा डोळा घालि गो आयियो ॥१॥

गाईंचा गावळा यमुनेचा पाबळा । धरिला माझा अंचळा मग मी पळालिये गो ॥धृ०॥

ताकपिरीं गोंवळीं कळी मजसी रांडोळी । भावे नारळी मग मी पळालिये गो ॥२॥

गळां गुंजमाळा गांठी । डांगा मोरपिसा वेठी । सोकरू लागे पाठीं । नेदरायाचा गो आयियो ॥३॥

एक्या करें धरी । बिजा करें वेठारी । चुंबन दे हरी । मग मी पळालिये गो ॥४॥

ऐसी पळत पळत गेलिये । कान्होने मोहिलिये । माझी मीचि जालिये । मग मी समोखिलिये गो ॥५॥

तुना चारा लागते गोर । तना बोर लागतो गोर । तुना बाही माजीं चार । माझी आइयो गो गो ॥६॥

पूर्वपुण्य फळलें । देह मुक्त झाले । बापरखुमादेवीवर विठले ऐसें केलें गो आइयो ॥७॥`;
}

const verifiedGaulaniCorrections = {
  '३५३६': {
    title: 'माझा कृष्ण देखिला काय',
    body: `माझा कृष्ण देखिला काय । कोणी तरी सांगा गे ॥धृ०॥

हाती घेऊनियां फूल । अंगणी रांगत आले मूल । होते सारवित मी चूल । कैसी भूल पाडियेली ॥१॥

माथां शोभे पिंपळपान । मेघवर्ण ऐसा जाण । त्याला म्हणती श्रीभगवान । योगी ध्यान विश्रांति ॥२॥

संगे घेऊनी गोपाळ । बाळ खेळे अलुमाळ । पायीं पोल्हार झळाळ । गळां माळ वैजयंती ॥३॥

एकाजनार्दनीं माय । घरोघरांप्रती जाय । कृष्ण जाणावे ते काय । कोणी सांगा गे ॥४॥`,
  },
  '३५५८': {
    title: 'दूती जाणवित स्वामिनी',
    body: `दूती जाणवित स्वामिनी । काम दाटला हृदयभुवनीं । कां पा नयेचि सारंगपाणी । सेज पाहतां न दिसे नयनीं ॥१॥

मज भेटवा गे श्रीहरी । लागला वेध त्याचा अंतरीं । ध्यानीं बिंबलासे मुरारी । प्राण रिघों पाहे जरी ॥२॥

गोड न लागे कामधंदा कांहीं । नावरे चीर चोळी पाही । सुमनसेज रुपती बाई । चित्त वेधले हरिपायीं वो ॥३॥

वृत्ति स्वानंदी निमग्न । गेली देहभाव विसरून । रंगली परिपूर्ण । धन्य धन्य सेना म्हणे ॥४॥`,
  },
};
for (const [number, correction] of Object.entries(verifiedGaulaniCorrections)) {
  const card = categories.find(({ id }) => id === 'gaulani')?.abhangs.find((abhang) => abhang.number === number);
  if (card) Object.assign(card, correction);
}

const verifiedDuplicateCorrections = [
  {
    category: 'ekavidh', number: '७२३', title: 'मी तो समर्थांची दासी',
    body: `मी तो समर्थांची दासी । मिठी घालीन पायांसी ॥१॥

हाचि माझा दृढभाव । करीन नामाचा उत्सव ॥२॥

आम्हां दासीस हें काम । मुखीं विठ्ठल हरिनाम ॥३॥

सर्व सुख पायीं लोळे । जनीसंगे विठ्ठल बोले ॥४॥`,
  },
  {
    category: 'kirtanapar', number: '५७५', title: 'धन्य भाग्याचे जन इहलोकीं',
    body: `धन्य भाग्याचे जन इहलोकीं । कीर्तनें झाले सुखी कृतकृत्य ॥१॥

पातकी घातकी यासी सोपा पंथ । कीर्तनें सरते कलीमाजीं ॥२॥

योगयाग व्रत तप कल्पकोडी । कीर्तनश्रवणगोडी तेथें नाहीं ॥३॥

वेदशास्त्र पुराण श्रुतीचें अनुमोदन । करा रे कीर्तन कलीमाजीं ॥४॥

एकाजनार्दनीं आल्हाद कीर्तन । करितां श्रोते वक्ते जाण पावन होती ॥५॥`,
  },
  {
    category: 'ekavidh', number: '६४१', title: 'आतां माझा सर्वभावे हा निर्धार',
    body: `आतां माझा सर्वभावे हा निर्धार । न करी विचार आणिकांसी ॥१॥

सर्वभावे नाम गाईन आवडी । सर्व माझी जोडी पाय तुझे ॥२॥

लोटांगण तुझ्या घालीन अंगणीं । पाहीन भरोनि डोळे मुख ॥३॥

निर्लज्ज होऊनि नाचेन रंगणीं । येऊं नेदी मती शंका कांहीं ॥४॥

अंकित अंकिला दास तुझा देवा । संकल्प हा जीवा तुका म्हणे ॥५॥`,
  },
  {
    category: 'karunapar', number: '१११५', title: 'लेकुराची आळी मायबापापुढे',
    body: `लेकुराची आळी मायबापापुढे । पुरवी लाडकोड लळे त्याचे ॥१॥

करावा सांभाळ सर्वस्वा गा आतां । कां हो अव्हेरितां जवळींचा ॥२॥

आम्हांवरी चाले सत्ता आणिकांची । थोरीव तुमची काय मग ॥३॥

आला सेना न्हावी पायांपें जवळी । आतां टाळाटाळी नका करूं ॥४॥`,
  },
  {
    category: 'karunapar', number: '१०९२', title: 'शेंबडी वांकुडीं गौळियांचीं पोरें',
    body: `शेंबडी वांकुडीं गौळियांचीं पोरें । तेथें नाचे निर्धारें आवडीने ॥१॥

जाणते वेदांती न करिती तिकडे तोंड । म्हणे हे तों होती भांड शाब्दिक ते ॥२॥

चोरितांना लोणी बांधिती गौळणी । तेथें काकुळतीं पाय धरी ॥३॥

यज्ञाचे ठायीं अन्नदान न घे । विदुरासी मागे आणी कण्या ॥४॥

भानुदास म्हणे जाणते नेणते । दोन्ही ते सरते होती पायीं ॥५॥`,
  },
  {
    category: 'karunapar', number: '१०९६', title: 'तुम्ही कृपानिधी संत',
    body: `तुम्ही कृपानिधी संत । मी पतित अन्यायी ॥१॥

सलगी बोलियेला फार । न कळे निर्धार योग्यता ॥२॥

म्हणवी दास तुमचा देवा । करितां हेवा पुढिल्याचा ॥३॥

उच्छिष्ट प्रसादाची आस । म्हणे भानुदास तुमचा ॥४॥`,
  },
  {
    category: 'maganipar', number: '११५९', title: 'आम्हां वैष्णवांचा कुळधर्म कुळींचा',
    body: `आम्हां वैष्णवांचा कुळधर्म कुळींचा । विश्वास नामाचा एका भावें ॥१॥

तरीच हरिचे दास म्हणवितां साजे । निर्वासना कीजे चित्त आधीं ॥२॥

गाऊं नाचूं प्रेमे आनंद कीर्तनीं । भुक्ति मुक्ति दोन्ही न मागों तुज ॥३॥

तुका म्हणे देवा ऐसियांची सेवा । द्यावी जी केशवा जन्मोजन्मीं ॥४॥`,
  },
  {
    category: 'maganipar', number: '११६८', title: 'करूं जातां सन्निधान',
    body: `करूं जातां सन्निधान । क्षणीं जन पालटे ॥१॥

आतां गोमटे ते पाय । तुझे माय विठ्ठले ॥२॥

हरिदासांचा समागम । अंगीं प्रेम विसांवे ॥३॥

तुका म्हणे हेंचि मत । इच्छादान मागतसे ॥४॥`,
  },
  {
    category: 'maganipar', number: '११७४', title: 'आतां माझ्या भावा',
    body: `आतां माझ्या भावा । अंतराय नको देवा ॥१॥

आळ भागा ते करितां । तुझे नाम उच्चारितां ॥२॥

दृढ माझें मन । येथें राखावे बांधोन ॥३॥

तुका म्हणे वाटे । नको फुटों देऊं फांटे ॥४॥`,
  },
  {
    category: 'bhetipar', number: '१६०६', title: 'भेटीलागीं जीवा लागलीसे आस',
    body: `भेटीलागीं जीवा लागलीसे आस । पाहे रात्रंदिवस वाट तुझी ॥१॥

पौर्णिमेचा चंद्रमा चकोरा जीवन । तैसें माझें मन वाट पाहे ॥२॥

दिवाळीच्या मुळा मोठी आस केली । पाहतां वाटुली मायबापा ॥३॥

नामा म्हणे आम्ही लेकराची जाति । भेटावया खंती वाटतसे ॥४॥`,
  },
  {
    category: 'salagipar', number: '१७६५', title: 'आम्ही पतितांनीं घालावें सांकडे',
    body: `आम्ही पतितांनीं घालावें सांकडे । तुम्हां लागे कोडे उगवणें ॥१॥

आचरतां दोष न धरूं सांभाळ । निवाड उकल तुम्हां हातीं ॥२॥

न घेतां कवडी करावा कुढावा । पाचारितां देवा नामासाठीं ॥३॥

दयासिंधु पतितपावन । हें आम्हां वचन सांपडलें ॥४॥

तुका म्हणे करूं अन्यायाच्या राशी । कृपावंत पोटीं तूंचि देवो ॥५॥`,
  },
  {
    category: 'advaita-saguna', number: '२४३६', title: 'चतुरानन घन अनंत उपजती',
    body: `चतुरानन घन अनंत उपजती । देवो देवी किती तयामाजी ॥१॥

तोचि हे सांवळें अंकुरलें ब्रह्म । गोपसंगें सम वर्ते रया ॥२॥

निगमा नाठवे वेदांचा द्योतकु । तो चतुर्भुज बंधु नंदाघरीं ॥३॥

निवृत्ति म्हणे शंखचक्रांकित मूर्ती । आपण श्रीपती क्रीडतुसे ॥४॥`,
  },
  {
    category: 'advaitapar', number: '२३४०', title: 'काय वर्णूं याचे गुण',
    body: `काय वर्णूं याचे गुण । ज्याचे त्रिभुवन रूपस ॥१॥

चंद्र सूर्य तारांगण । दीप्ति होतसे ज्याचेनी ॥२॥

जेणें वाड केलें गगन । दिधलें आसन वसुंधरे ॥३॥

निळा म्हणे धरिला मेरू । भरिला सागरू दिव्य क्षीरें ॥४॥`,
  },
  {
    category: 'maganipar', number: '१३९६', title: 'धीट अधिकार कापिले',
    body: `धीट अधिकार कापिले । बधिर बोलके तोतरे ॥१॥

भाविकांचा गोड भावो । देखोनि सर्वे नाचे देवो ॥२॥

म्हणे धन्य तुमचें कर्म । अवघे माझे ठायीं प्रेम ॥३॥

निळा म्हणे तुम्हांविण । दुजे आप्त मज ते कोण ॥४॥`,
  },
  {
    category: 'sthitipar', number: '२४४७', title: 'आम्हांसी सकळ तुझ्या नामाचेचि बळ',
    body: `आम्हांसी सकळ । तुझ्या नामाचेचि बळ ॥१॥

करूं अमृताचे पान । दुजे नेणों कांहीं आन ॥२॥

जयाचा जो भोग । सुख दुःख पीडा रोग ॥३॥

तुका म्हणे देवा । तुझ्या पायीं माझा हेवा ॥४॥`,
  },
  {
    category: 'upadeshpar', number: '३३१०', title: 'निःसंदेह हरि भावयुक्त करी',
    body: `निःसंदेह हरि भावयुक्त करी । भजन निर्धारी सत्त्वशील ॥१॥

रज तम खंडी वासना हे गंडी । चित्त हे अखंडी हरिपंथीं ॥२॥

साधन हरिपंथु हाचि निज हेतु । गुरुमुख मातु ऐसी असे ॥३॥

निवृत्तीचे धन हरि आत्मा जाण । हरि हाचि प्राण जनकु रया ॥४॥`,
  },
  {
    category: 'upadeshpar', number: '३२७३', title: 'होऊनी उदास मागा प्रेम सावकाश',
    body: `होऊनी उदास । मागा प्रेम सावकाश ॥१॥

उभा विटेवरी उदित । देतां न पाहे चित्त वित्त ॥२॥

जें जें पाहिजे जयालागीं । तें तें देतो त्या प्रसंगीं ॥३॥

न म्हणे उत्तम चांडाळ । ऐसा भक्तीचा भुकाळ ॥४॥

एकाजनार्दनीं म्हणा दास । करा निर्भय आस ॥५॥`,
  },
  {
    category: 'upadeshpar', number: '२९९९', title: 'एक करिती गुरु भोवतां भारु शिष्यांचा',
    body: `एक करिती गुरु । भोवतां भारु शिष्यांचा ॥१॥

पूस नाहीं पाय चारी । मनुष्य परी कुतरीं तीं ॥२॥

परस्त्री मद्यपान । पेंडखाण माजविले ॥३॥

तुका म्हणे निर्भर चित्तीं । अधोगती जावया ॥४॥`,
  },
  {
    category: 'upadeshpar', number: '३३३७', title: 'निर्गुणाची वार्ता सगुणा मांडिली',
    body: `निर्गुणाची वार्ता सगुणा मांडिली । सगुण निर्गुण दोन्ही एकरूपा आली ॥१॥

सगुण नव्हे तें निर्गुण नव्हे । गुरुमुखें चोजव जाणितलें पां ॥२॥

रखुमादेवीवरु साकारू निराकारू नव्हे । कांहीं न होनि होये तोचि बाइये वो ॥३॥`,
  },
  {
    category: 'upadeshpar', number: '३३१९', title: 'देहीं देव आहे हे बोलती वेद',
    body: `देहीं देव आहे हे बोलती वेद । परी वासनेचे भेद न दवडिती ॥१॥

वासना हे चोख तेथेंचि वैकुंठ । भावोचि प्रगट होये जनां ॥२॥

न लगती सायास करणें उपवास । नाममात्रे पाहें तुटे जनां ॥३॥

निवृत्ति पाहतु देहामाजी प्रांतु । देवोचि दिसतु सर्वाघटीं ॥४॥`,
  },
  {
    category: 'ghongadi', number: '३७१५', title: 'मज अनाथासी घेऊनी पदरी',
    body: `मज अनाथासी घेऊनी पदरी । निघाले बाहेरी गुरुराज ॥१॥

आकाराचे माथां देऊनीया पाय । ठेविलें अक्षय निजपदीं ॥२॥

काय सांगूं माझी वाचा हे तुतिमाली । सद्गुरु माऊली दयाळू जे ॥३॥

तुका म्हणे येथें मरोनी जन्मला । आपुले पावला अधिष्ठान ॥४॥`,
  },
  {
    category: 'gaulani', number: '३५२२', title: 'देखिला अवचितां डोळां सुखाचा सागरू',
    body: `देखिला अवचितां डोळां सुखाचा सागरू । मन बुद्धि हारपली झाले एकाकारू । न दिसे काया माया कृष्णीं लागला मोहरू ॥१॥

अद्वया आनंदा रे अद्वया आनंदा रे । वेधियल्या कामिनी अद्वया आनंदा रे ॥धृ०॥

खुंटले येणें जाणें घर सासुर । नाठवे आपपर वेधियेलें सुंदर । आंत सबाह्य व्यापिल कृष्ण परात्पर नागर वो ॥२॥

सहजी कळलें आतां लाधलें निर्गुणा । एकाजनार्दनीं कृपा केली परिपूर्णा । गगनीं गिळियेलें येणें उरी नुरे आपणा ॥३॥`,
  },
  {
    category: 'kalyache', number: '३६७२', title: 'काकुळती येतो हरी',
    body: `काकुळती येतो हरी । क्षणभरीं निवडितां ॥१॥

तुमची मज लागली सवे । ठायींचें नवें नव्हें गडी ॥२॥

आणीक बोलाविती फार । बहु थोर नावडती ॥३॥

भाविके त्यांची आवडी मोठी । तुका म्हणे मिठी घाली जीवें ॥४॥`,
  },
  {
    category: 'gaulani', number: '३५५०', title: 'भक्ति गोकुळी नवविधा नारी',
    body: `भक्ति गोकुळी नवविधा नारी । गजरें चालती भारी वो । सुनीळ जळीं अति संतोषें । क्रीडती यमुनातीरीं वो ॥१॥

स्थिर स्थिर माधवा विचार धरी । आम्ही परात्पर परनारी ॥धृ०॥

वासना वास अलक्ष लक्षुनी । दह्याची करिसी चोरी रे ॥२॥

आकंठ मग्न सुनीळ नारी । घनसांवळा देखोनि वरी । येथोनि निघतां लाज मोठी । विनोद न करी रे ॥३॥

लाज सांडोनि धरा चरण । तंव मी होईन प्रसन्न । एकाजनार्दनीं निःशंक झाल्या । जीवींची जाणुनी खूण वो ॥४॥`,
  },
  {
    category: 'sadgurupar', number: '३८६९', title: 'निवृत्ति निवृत्ति म्हणतां पाप नुरेचि',
    body: `निवृत्ति निवृत्ति । म्हणतां पाप नुरेचि ॥१॥

जप करितां त्रिअक्षरी । मुक्ति लोळे चरणावरीं ॥२॥

ध्यान धरितां निवृत्ती । आनंदमय राहे वृत्ती ॥३॥

सेना म्हणे चित्तीं धरा । स्मरतां चुके येरझारा ॥४॥`,
  },
  {
    category: 'alandi-dehu', number: '३९०८', title: 'अलंकापुरी पुण्य ठाव',
    body: `अलंकापुरी पुण्य ठाव । तेथें समाधी ज्ञानदेव ॥१॥

पांडुरंगे दिधला वर । भेटी निर्धार कृष्णपक्षीं ॥२॥

नित्य स्नानालागीं जाणा । भागीरथी दिधली ज्ञाना ॥३॥

सरस्वती मणिकर्णिका । त्रिसंगमीं वाहती देखा ॥४॥

येथें स्नान करितां । वास वैकुंठीं तत्त्वतां ॥५॥

ऐसें देव सांगत । कान्होपात्रा आनंदत ॥६॥`,
  },
  {
    category: 'virahinya', number: '३६४१', title: 'त्रिभुवनाचें सुख पाहावया नयनीं',
    body: `त्रिभुवनाचें सुख पाहावया नयनीं । दिनरात्री धणी न पुरे माझी ॥१॥

विटेवरी सांवळा पाहतां पैं डोळां । मन वेळोवेळां आठवितु ॥२॥

सागरीं भरित दाटे तैसें मन उल्हाटे । वाट पाहे कोठें तुझी रया ॥३॥

बापरखुमादेवीवरु पूर्ण प्रकाशला । कुमुदिनी विकासली तैसें झालें ॥४॥`,
  },
  {
    category: 'vaishnavapar', number: '४२२२', title: 'वैष्णव वसती जये स्थळीं',
    body: `वैष्णव वसती जये स्थळीं । तेथें धुमाळी कथेची ॥१॥

विठ्ठल देव नाचे उभा । दाटे सभा संतांची ॥२॥

सुखी होती महानुभाव । पावती ठाव तत्पदीं ॥३॥

निळा म्हणे नारी नर । होती तत्पर परमार्थी ॥४॥`,
  },
  {
    category: 'vasudev', number: '४२६७', title: 'सुखें सेवूं ब्रह्मानंदा',
    body: `सुखें सेवूं ब्रह्मानंदा । गाऊं रामनाम सदा । नोहे मग बाधा । काळदूत यमाची ॥१॥

करूं वासुदेव स्मरण । तेणें तुटे रे बंधन । खंडेल कर्माचें बंधन । वासुदेव जपतांची ॥२॥

तीर्थयात्रे सुखें जाऊं । वाचे विठ्ठलनाम घेऊं । संतासंग सेवूं । वासुदेव धणीवरीं ॥३॥

लोभ ममता दवडूं आशा । उदरव्यथेचा वोळसा । न करूं आणिक सायासा । वासुदेवावांचुनी ॥४॥

मुख्य धर्माचें हें वर्म । येणें साधे सकळ धर्म । एकाजनार्दनीं नाम । वासुदेव आवडी ॥५॥`,
  },
  {
    category: 'prasangik', number: '४३९०', title: 'माझी तूं माउली',
    body: `माझी तूं माउली माझी तूं माउली । माझी तूं माउली विठ्ठला तूं ॥१॥

मज कां मोकलिलें वेगळें कां केलें । कां बा धाडियेलें मंगळवेढ्या ॥२॥

काय माझा भार झालासे जडभार । म्हणोनि केलें दूर पायांपरतें ॥३॥

चोखा म्हणे मज द्रव्याची नाहीं चाड । तुझें नाम गोड मुखीं गातां ॥४॥`,
  },
  {
    category: 'virahinya', number: '३५७९', title: 'आम्हां आम्ही आतां वडील धाकुटीं',
    body: `आम्हां आम्ही आतां वडील धाकुटीं । नाहीं पाठीं पोटीं कोणी दुजे ॥१॥

फावला एकांत एकविध भाव । हरि आम्हांसवें भोगी ॥२॥

तुका म्हणे अंगसंग एके ठायीं । असो जेथें नाहीं दुजे कोणी ॥३॥`,
  },
  {
    category: 'santapar', number: '३९५१', title: 'संतांनी सरता केलो तैशापरी',
    body: `संतांनी सरता केलो तैशापरी । चंदन ते बोरी व्यापियेली ॥१॥

गुणदोष याती न विचारी कांहीं । ठाव दिला पायीं आपुलिया ॥२॥

तुका म्हणे आलें समर्थांच्या मना । तरी होय राणा रंक त्याचा ॥३॥`,
  },
  {
    category: 'kolhati', number: '४२९६', title: 'आम्ही कोल्हाटी कोल्हाटी',
    body: `आम्ही कोल्हाटी कोल्हाटी । आमची उडी उलटी सुलटी । शून्य स्थावर दिधली गांठी । न्यास जंगम केली उफराटी गा ॥१॥

सोहं शब्द ढोलक पाटी । आमचें वास्तव्य त्रिपुटी । आमच्या खेळांत पडली मिठी । पाहावी कसबाची आटाआटी गा ॥२॥

आली कोल्हाटी प्रेमाळ । ब्रह्मा विष्णू जयाचे बाळ । महाप्रपंच रोविला वेळू । खेळ केला त्याने तुंबळू गा ॥३॥

आमुचा खेळ हो पाहून । सगुणासी लागलें ध्यान । त्यानें केलें निर्गुण । ऐसें बोले जनार्दन ॥४॥`,
  },
  {
    category: 'advaitapar', number: '२३६६', title: 'नाहींचि उरला रिता ठावो याविण तत्त्वतां',
    body: `नाहींचि उरला रिता । ठावो याविण तत्त्वतां ॥१॥

अणुरेणु महदाकाश । त्याहीमाजी याचा वास ॥२॥

होतां जातां सहस्रावरीं । ब्रह्मांडांच्या भरोवरीं ॥३॥

निळा म्हणे अखंडता । नव्या जुन्याही हा परता ॥४॥`,
  },
  {
    category: 'sthitipar', number: '२४६६', title: 'पावलो प्रसाद इच्छा केली तैसी',
    body: `पावलो प्रसाद इच्छा केली तैसी । झालें या चित्तासी समाधान ॥१॥

मायबाप माझा उभा कृपादानी । विटे सम जोडूनी पदांबुज ॥२॥

सांभाळासा येऊं नेदीच उणीव । अधिकार गौरव राखे तैसे ॥३॥

तुका म्हणे सर्व अंतर्बाह्य आहे । जया तैसा राहे कवळूनि ॥४॥`,
  },
  {
    category: 'upadeshpar', number: '२७६४', title: 'परस्त्रीतें म्हणतां माता',
    body: `परस्त्रीतें म्हणतां माता । चित्त लाजवितें चित्ता ॥१॥

काय बोलोनियां तोंडें । मनामाजीं कानकोंडें ॥२॥

धर्मधारिष्ट गोष्टी सांगे । उष्ट्या हातें नुडवी काग ॥३॥

जें जें कर्म वसे अंगीं । तें तें आठवे प्रसंगीं ॥४॥

बोले तैसा चाले । तुका म्हणे तो अमोल ॥५॥`,
  },
  {
    category: 'upadeshpar', number: '३११७', title: 'होईल अंगीं बळ',
    body: `होईल अंगीं बळ । तरी फजित करावे ते खळ ॥१॥

जे कां करूनियां पाखांड । लटिकेंचि वाढविती बंड ॥२॥

भांडिती भाविकां । कथुनी परमार्थ तो लटिका ॥३॥

निळा म्हणे तोंडें सांगे । तैसें नाचरोनियां अंगें ॥४॥`,
  },
  {
    category: 'upadeshpar', number: '३१६३', title: 'दावी जडावुटी जारण मारण',
    body: `दावी जडावुटी जारण मारण । नागवे हिंडणें काय काज ॥१॥

दावी उग्र तप केले उपवास । फिरतांहि देश काय काज ॥२॥

काय काज तरी होसील फजीत । स्मरा रे अनंत सर्वकाळ ॥३॥

नामा म्हणे नव्हे उदंड उपाय । धरीं आधीं पाय विठोबाचे ॥४॥`,
  },
  {
    category: 'upadeshpar', number: '३३०३', title: 'द्रव्याचिये आशें करा जो कथा',
    body: `द्रव्याचिये आशें करा जो कथा । चांडाळ तत्त्वतां जाणावा तो ॥१॥

द्रव्याचिये आशें वेद जे पढती । रौरव भोगिती कल्पवरीं ॥२॥

द्रव्याचिये आशें पुराण सांगती । सकुळ ते जाती नरकामध्यें ॥३॥

द्रव्याचिये आशें कथेचा विकरा । प्रत्यक्ष तो खरा मातंगचि ॥४॥

एकाजनार्दनीं निराशे भजन । तो प्राणी उत्तम कलियुगीं ॥५॥`,
  },
  {
    category: 'upadeshpar', number: '३३१३', title: 'समता वर्तावी अहंता खंडावी',
    body: `समता वर्तावी । अहंता खंडावी । तेणें पदवी मोक्षमार्ग ॥१॥

क्षमा धरीं चित्तीं अखंड श्रीपति । एकतत्त्व चित्तीं ध्याईजे सु ॥२॥

नाम हाचि मंत्र नित्य नाम सार । दुसरा विचार घेऊं नको ॥३॥

अन्य शास्त्रें मजतां नाहीं हे मुक्तता । हरिनाम गातां मुक्ति रोकडी ॥४॥

नित्य सुख ध्यावे नामचि अनुभवावे । तरीच सुख पावे इहलोकीं ॥५॥

निवृत्ति भजन नित्य जनार्दन । एकरूप ध्यान मी ध्यातु सदा ॥६॥`,
  },
  {
    category: 'sadgurupar', number: '३७१९', title: 'सकळ देवांचे दैवत',
    body: `सकळ देवांचे दैवत । सद्गुरुनाथ एकला ॥१॥

राम केला ब्रह्मज्ञानी । वसिष्ठ मुनी तारक ॥२॥

कृष्ण गुरु सांदीपन । पूर्ण ब्रह्म दाविलें ॥३॥

तुका म्हणे सद्गुरुसेवा । सकळ देवां वरिष्ठ ॥४॥`,
  },
  {
    category: 'gondhal', number: '४३१५', title: 'माझे कुळींची कुळस्वामिनी',
    body: `माझे कुळींची कुळस्वामिनी । विठाई जगत्रयजननी । येई वो पंढरपुरवासिनी । ठेविले दोन्ही कर कटितटी । उभी सखी सजनी ॥१॥

ये पुंडलीक वरदायिनी । विश्वजननी । रंगा येई वो ॥धृ०॥

मध्ये सिंहासन घातलें । प्रमाण चौक हे साधिलें । ज्ञानकळस वर ठेविलें । पूर्ण भरियेलें । धूप दाविलें । सुवास करुनी ॥२॥

सभामंडप शोभला । भक्तिचांदवा दिधला । उदो उदो शब्द गाजला । रंग माजला । वेद बोलिला । मूळचा ध्वनी ॥३॥

शुक सनकादिक गोंधळी । जीव शिव घेऊनी संबळी । गाती हरिची नामावळी । मातले बळी प्रेमकल्लोळीं । सुखाचे सदनीं ॥४॥

ऐसा गोंधळ घातला । भला परमार्थ सुटला । एकाजनार्दनीं भला । ऐक्य साधिला । ठाव आपुला । लाभ त्रिभुवनीं ॥५॥`,
  },
  {
    category: 'moksha', number: '४३१', title: 'नाम हे सोपें जपतां विठ्ठल',
    body: `नाम हे सोपें जपतां विठ्ठल । अवघेचि फळ हातां लागे ॥१॥

योग याग जप तप अनुष्ठान । तीर्थ व्रत दान नाम जपतां ॥२॥

सुखाचें सुख नाहीं यातायाती । बैसोनि एकांतीं नाम स्मरा ॥३॥

चोखा म्हणे येणें साधेल साधन । तुटेल बंधन भवपाशा ॥४॥`,
  },
  {
    category: 'namapar', number: '१३९', title: 'सर्व सुखां अधिकारी',
    body: `सर्व सुखां अधिकारी । मुखें उच्चारी हरिनाम ॥१॥

सर्वांगें तो सर्वोत्तम । मुखीं नाम हरीचें ॥२॥

ऐसी उभारिली बाहे । वेदीं पाहें पुराणीं ॥३॥

तुका म्हणे येथें कांहीं । संदेह नाहीं भरंवसा ॥४॥`,
  },
  {
    category: 'namapar', number: '१४२', title: 'झाडें बोरपोनि खाऊनियां पाला',
    body: `झाडें बोरपोनि खाऊनियां पाला । आठवी विठ्ठला वेळोवेळां ॥१॥

वस्त्र नेसूनि चिंधिया वेढूनि । सांडी जवळूनि देहभान ॥२॥

लोकमान वमनासमान मानणें । एकांतीं राहणें विठोबासाठीं ॥३॥

सहसा करूं नये प्रपंचीं सौजन्य । सेवावें अरण्य एकांतवास ॥४॥

ऐसा हा निर्धार करी जो मनाचा । तुका म्हणे त्याचा पांग फिटे ॥५॥`,
  },
  {
    category: 'namapar', number: '१४४', title: 'संध्या कर्म ध्यान जप तप अनुष्ठान',
    body: `संध्या कर्म ध्यान जप तप अनुष्ठान । अवघें जोडे नाम उच्चारितां । न वेचे मोल कांहीं लागती न सायास । तरी कां आळस करिसी झणीं ॥१॥

ऐसें हें सार कां नेघेसी फुकाचें । काय तुझें वेचे मोल तया ॥धृ०॥

पुत्रस्नेहें शोक करी अजामेळ । तंव तो कृपाळ जवळी उभा । अनाथांच्या नाथें घातला विमानीं । नेला उचलूनि परलोका ॥२॥

अंतकाळीं गणिका पक्षियाच्या छंदें । राम राम पद उच्चारिलें । तंव त्या दीनानाथा कृपा आली कैसी । त्यानें तियेसी वैकुंठासी नेलें ॥३॥

अवचिता नाम आलिया हे गती । चिंतितां चित्तीं जवळी असे । तुका म्हणे भावें स्मरा राम राम । कोण जाणे तये देशे ॥४॥`,
  },
  {
    category: 'namapar', number: '१५७', title: 'उपदेशिला एकचि सार',
    body: `उपदेशिला एकचि सार । मजही उच्चार नामाचा ॥१॥

म्हणती न पडे साधन फंदीं । होशील दोंदी काळाचा ॥२॥

करीं संत समागम । गाईं हरिनाम कीर्तनीं ॥३॥

निळा म्हणे ऐसा संतीं । केला निजप्रीति उपदेश ॥४॥`,
  },
  {
    category: 'namapar', number: '१७१', title: 'विष्णुनाम श्रेष्ठ गाती देवऋषी',
    body: `विष्णुनाम श्रेष्ठ गाती देवऋषी । नाम अहर्निशीं गोपाळाचें ॥१॥

हरि हरि हरि तूंचि गा श्रीहरी । वसे चराचरीं जनार्दन ॥२॥

आदि ब्रह्म हरी आळवी त्रिपुरारी । उमेप्रती करी उपदेश ॥३॥

नामा म्हणे राम हा जप परम । शंकरासी नेम दिननिशीं ॥४॥`,
  },
  {
    category: 'namapar', number: '१८३', title: 'नामावांचूनि कांहीं दुजें येथें नाहीं',
    body: `नामावांचूनि कांहीं दुजें येथें नाहीं । वेगीं लवलाहीं राम जपा ॥१॥

गोविंद गोपाळ वाचेसी रसाळ । पावसी केवळ निजपद ॥२॥

ध्रुव प्रल्हाद बळी अंबऋषि प्रबुद्ध । नामेंचि चित्पद पावले देख ॥३॥

नामा म्हणे राम वाचे जपा नाम । संसार भवभ्रम हरे नामें ॥४॥`,
  },
  {
    category: 'namapar', number: '१८६', title: 'नाम फुकाचें चोखट',
    body: `नाम फुकाचें चोखट । नाम घेतां नलगे कष्ट ॥१॥

पडशील ज्या सागरीं । रामनामें आत्मा तारी ॥२॥

पुत्रभावें स्मरण केलें । तया वैकुंठासी नेलें ॥३॥

नामा म्हणे महिमान जाण । घेतो विठ्ठलाची आण ॥४॥`,
  },
  {
    category: 'namapar', number: '२००', title: 'तरले तरती हा भरंवसा',
    body: `तरले तरती हा भरंवसा । पुढती न येती गर्भवासा ॥१॥

वाट सांपडली निकी । विठ्ठल नाम ज्याचे मुखीं ॥२॥

तीर्थ इच्छिती चरणींचे । रज नामधारकांचे ॥३॥

प्रायश्चित्तें सांडोनि प्रौढी । झाली दीनरूपें बापुडीं ॥४॥

ऋद्धि सिद्धी महाद्वारी । मोक्ष वोळंगण करी ॥५॥

नामा म्हणे सुखनिधान । नाम पतितपावन ॥६॥`,
  },
  {
    category: 'namapar', number: '२०८', title: 'तप तीर्थ दान हें सर्व कुवाड',
    body: `तप तीर्थ दान हें सर्व कुवाड । नाम एक वाड केशवाचें ॥१॥

मुमुक्षु साधकीं सदा नाम गावें । तेणेंचिया व्हावें अखंडित ॥२॥

विपत्तीचें बळें न होतां विन्मुख । नाममात्र एक धरा वाचे ॥३॥

जीवन्मुक्त शुक मुनि ध्रुवादिक । तयासी आणिक ध्यास नाहीं ॥४॥

नामयाची वाणी अमृताची खाणी । घ्यावी आतां धणी सर्वत्रांही ॥५॥`,
  },
  {
    category: 'namapar', number: '२१२', title: 'जप तप अनुष्ठान हरी',
    body: `जप तप अनुष्ठान हरी । एकचि तो नमस्कारी । भूतद्वेष कदा न करी । तप सासुरें हेंचि तुझें ॥१॥

हरी माधव यादवा । कृष्णा गोविंदा केशवा । येणें करोनियां जीवा । सर्वकाळ रंजवीं ॥२॥

स्मरतां हरीचें नाम । पळोनि जाती काळ यम । तुटती नाना योनि जन्म । गर्भवासा मग नये ॥३॥

नामा जपे नामावळी । अखंड तप हेंचि सदा काळीं । हरिनामें पिटोनि टाळी । हाचि तरणोपाय सकळांचा ॥४॥`,
  },
  {
    category: 'namapar', number: '२२६', title: 'न पूजी आणिकां देवा',
    body: `न पूजी आणिकां देवा । न करी त्यांची सेवा । न मनी या केशवाविण दुजें ॥१॥

काय उणें झालें मज तयापायीं । तूं मी मागों काई कवणासी ॥२॥

आणिकांची कीर्ति न आइकेन कानीं । चाड या विठ्ठलाविण नाहीं ॥३॥

न पाहे लोचनीं श्रीमुखावांचुनी । पंढरी सांडूनी न वजे कोठें ॥४॥

न करी कांहीं आस मुक्तीचे सायास । न भये संसारास येतां जातां ॥५॥

तुका म्हणे कांहीं व्हावें ऐसें जीवा । नाहीं या केशवाविण दुजें ॥६॥`,
  },
  {
    category: 'namapar', number: '२३६', title: 'हरिविण देह मळीण सर्वथा',
    body: `हरिविण देह मळीण सर्वथा । मंगळाची कथा रामकृष्ण ॥१॥

कथा करी कोणी ऐकती जे जन । वैकुंठभुवन हातां आलें ॥२॥

वेदशास्त्रां सार नामाचा उच्चार । अंतीं पैल पार दाखवितो ॥३॥

जन्मोनियां जगीं अलिप्त असावें । नाम तें स्मरावें म्हणे नामा ॥४॥`,
  },
  {
    category: 'namapar', number: '२५४', title: 'ब्राह्मण हो शूद्र वैश्य नारीनर',
    body: `ब्राह्मण हो शूद्र वैश्य नारीनर । सर्वांसी आधार नाम सत्य ॥१॥

नामाविण गति नाहीं हो आणीक । वैकुंठनायक बोले मुखें ॥२॥

परी तेंचि नाम पाहावें शोधून । चौर्‍यांशी खाणी चुके तेव्हां ॥३॥

नामा म्हणे आतां सद्गुरु वंदुनी । नाम घ्या शोधोनि सत्यमुक्त ॥४॥`,
  },
  {
    category: 'namapar', number: '२५८', title: 'एक नाम अवघें सार',
    body: `एक नाम अवघें सार । वरकड अवघें तें असार ॥१॥

म्हणोनियां परतें करा । आधीं विठ्ठल हें स्मरा ॥२॥

जनी देवाधिदेव । एक विठ्ठल पंढरीराव ॥३॥`,
  },
  {
    category: 'namapar', number: '२५९', title: 'काय हें करावें',
    body: `काय हें करावें । धनवंतादि अवघे ॥१॥

तुझें नाम नाहीं जेथें । नको माझी आस तेथें ॥२॥

तुजविण बोल न मानीं । करीं ऐसें म्हणे जनी ॥३॥`,
  },
  {
    category: 'namapar', number: '२६७', title: 'निराकाराचें नाणें',
    body: `निराकाराचें नाणें । शुद्ध ब्रह्मींचें ठेवणें ॥१॥

प्रयत्नें काढिलें बाहेरी । संत साधु सौदागरीं ॥२॥

व्यास वसिष्ठ नारदमुनी । टांकसाळ घातली त्यांनीं ॥३॥

उद्धव अक्रूर स्वच्छंदीं । त्यांनीं आटविली चांदी ॥४॥

केशव नामयाचा शिक्का । हारप चाले तिन्ही लोकां ॥५॥

पारख नामयाची जनी । वरती विठोबाची निशाणी ॥६॥`,
  },
  {
    category: 'namapar', number: '२७८', title: 'जगासी तारक हरि हा उच्चार',
    body: `जगासी तारक हरि हा उच्चार । सर्व येरझार खुंटे जेणें ॥१॥

पाहतां ब्रह्मांडीं व्यापक तो हरी । सबाह्य अभ्यंतरीं भरलासे ॥२॥

एका जनार्दनीं रिता ठाव कोठें । पुंडलिक पेठे उभा नीट ॥३॥`,
  },
  {
    category: 'namapar', number: '२८४', title: 'नाम गाये तो पवित्र क्षितीं',
    body: `नाम गाये तो पवित्र क्षितीं । नामें उद्धार त्रिजगतीं ॥१॥

ज्याचें उच्चारितां नाम । निवारे क्रोध आणि काम ॥२॥

वेदशास्त्रीं विवेकी संपन्न । नामें होताती पावन ॥३॥

नामें उत्तम अधमां गती । एका जनार्दनीं ध्याये चित्तीं ॥४॥`,
  },
  {
    category: 'namapar', number: '३०२', title: 'नाम तें ब्रह्म नाम तें ब्रह्म',
    body: `नाम तें ब्रह्म नाम तें ब्रह्म । नामापाशीं नाहीं कर्म विकर्म ॥१॥

अबद्ध पढतां वेद बाधी निषिद्ध । अबद्ध नाम रटतां प्राणी होती शुद्ध ॥२॥

अबद्ध मंत्र जपतां जापक चळे । अबद्ध नाम जपतां जडमूढ उद्धरले ॥३॥

स्वधर्म कर्म करी पडे व्यंग । विष्णुस्मरणें तें समूळ होय सांग ॥४॥

नामापाशीं नाहीं विधिविधान । आसनीं शयनीं भोजनीं नाम पावन ॥५॥

एका जनार्दनीं नाम निकटीं । ब्रह्मानंदीं भरली सृष्टी ॥६॥`,
  },
  {
    category: 'namapar', number: '३०८', title: 'सुलभ सोपारें नाम मुखीं गातां',
    body: `सुलभ सोपारें नाम मुखीं गातां । पातकांच्या चळथा कांपताति ॥१॥

हरिनाम सार वाचे तो उच्चार । तरले नारीनर नाममात्रें ॥२॥

वेदांत सिद्धांत तयांचा संकेत । नामें होती मुक्त महापापी ॥३॥

एका जनार्दनीं निजसार । नाम परात्पर जपती सर्व ॥४॥`,
  },
  {
    category: 'namapar', number: '३१५', title: 'चिंतन तें हरिचरण',
    body: `चिंतन तें हरिचरण । हेंचि कलीमाजीं प्रमाण । सर्व पुण्याचें फळ जाण । नामस्मरण विठ्ठल ॥१॥

मागें तरले पुढें तरती । याची पुराणीं प्रचिती । वेदशास्त्र जया गाती । श्रुतीहि आनंदें ॥२॥

हेंचि सर्वांसी माहेर । भूवैकुंठ पंढरपूर । एका जनार्दनीं नर । धन्य जाणा तेथींचे ॥३॥`,
  },
  {
    category: 'namapar', number: '३२०', title: 'भाग्याचें भाग्य धन्य ते संसारीं',
    body: `भाग्याचें भाग्य धन्य ते संसारीं । सांठविती हरी हृदयामाजीं ॥१॥

धन्य त्यांचें कुळ धन्य त्यांचें कर्म । धन्य त्यांचा स्वधर्म नाम मुखीं ॥२॥

संकटीं सुखांत नाम सदा गाय । न विसंबे देवराय क्षण एक ॥३॥

एका जनार्दनीं धन्य त्यांचें दैव । उभा स्वयमेव देव घरीं ॥४॥`,
  },
  {
    category: 'namapar', number: '३३१', title: 'दुजा छंद नोहे साचे',
    body: `दुजा छंद नोहे साचे । वदे वाचे हरिनाम ॥१॥

कोटी कुळें होती पावत । नामस्मरण करतांची ॥२॥

यम न पाहे तयाकडे । चाडें कोडें नमस्कारी ॥३॥

विधि शची उमारमण । वंदिती चरण आवडी ॥४॥

म्हणे जनार्दनाचा एका । उपाय नेटका कलियुगीं ॥५॥`,
  },
  {
    category: 'namapar', number: '३३२', title: 'चिंतनें धांवे भक्तांपाठीं',
    body: `चिंतनें धांवे भक्तांपाठीं । धरीं कांबळी हातीं काठी । चिंतनें उठाउठी । बांधवितो आपणिया ॥१॥

ऐसा भुकेला चिंतनाचा । न पाहे यातीहीन उंचाचा । काय अधिकार शबरीचा । फळें काय प्रिय तीं ॥२॥

एका जनार्दनीं चिंतन । तेणें जोडे नारायण । आणिक न लगे साधन । कलीमाजीं सर्वथा ॥३॥`,
  },
  {
    category: 'namapar', number: '३३५', title: 'अंकितपणें राहिला उभा',
    body: `अंकितपणें राहिला उभा । विठ्ठल चैतन्याचा गाभा । उजळली दिव्य प्रभा । अंगकांति साजिरी ॥१॥

पीतांबर माळ कंठीं । केशर कस्तुरीची उटी । मुकुटा तळवटीं । मयूरपिच्छें शोभतीं ॥२॥

सनकादिकांचें जें ध्यान । उभें विटे समचरण । भक्तांचें तें ठेवण । जाप्य गौरीशिवाचें ॥३॥

तो देवाधिदेव विठ्ठल । वाचे वदतां न लगे मोल । एका जनार्दनीं बोल । फुकाचें तें वेचितां ॥४॥`,
  },
  {
    category: 'namapar', number: '३३८', title: 'नाम हें नौका तारक भवडोहीं',
    body: `नाम हें नौका तारक भवडोहीं । म्हणोनि लवलाहीं वेग करा ॥१॥

बुडतां सागरीं तारूं श्रीहरी । म्हणोनि झडकरी लाहो करा ॥२॥

काळाचा तो फांसा पडला नाहीं देहीं । म्हणोनि झडकरी लाहो करा ॥३॥

एका जनार्दनीं लाहो करा वेळ । सर्वदा सर्वकाळ लाहो करा ॥४॥`,
  },
  {
    category: 'namapar', number: '३४७', title: 'कलियुगामाजीं एक हरिनाम साचें',
    body: `कलियुगामाजीं एक हरिनाम साचें । मुखें उच्चारितां पर्वत छेदी पापांचे ॥१॥

सर्वभावें भजा एक हरीचें नाम । मंगळा मंगल करील निर्गुण निष्काम ॥२॥

दोषी अजामेळ तोहि नामें तरला । हरिनामें गणिकेचा उद्धार झाला ॥३॥

एका जनार्दनीं नाम सारांचें सार । स्त्रियादि अंत्यजा एकदांचि उद्धार ॥४॥`,
  },
  {
    category: 'namapar', number: '३५६', title: 'ज्याचे मुखीं नाम अमृतसरिता',
    body: `ज्याचे मुखीं नाम अमृतसरिता । तोचि एक पुरता घटु जाणा ॥१॥

नामचेनि बळें कळिकाळ आपणा । ब्रह्मांडा येसणा तोचि होय ॥२॥

न पाहे तयाकडे काळ अवचिता । नामाची सरिता जया मुखीं ॥३॥

निवृत्ति नामामृत उच्चारी रामनामें । नित्य परब्रह्म त्याचे घरीं ॥४॥`,
  },
  {
    category: 'namapar', number: '३६५', title: 'सर्व रूपे हरी ऐसें मन करी',
    body: `सर्व रूपे हरी ऐसें मन करी । वासना प्रहरी नामपाठ ॥१॥

रामकृष्ण वाड सवें हे वैकुंठ । दिसेल प्रगट निजरूप ॥२॥

व्रत तप तीर्थ नाम हे अनंत । माजी सामावत आत्मनाथीं ॥३॥

निवृत्ति म्हणे तं नाम राम वदे जप । फळेल संकल्प रामनामे ॥४॥`,
  },
  {
    category: 'kirtanapar', number: '६१६', title: 'पांगुळ झालों देवा नाहीं हात ना पाय',
    body: `पांगुळ झालों देवा नाहीं हात ना पाय । बैसलों जयावरी सैराट तें जाय । खेटितां कुंप कांटी खुंट दरडी न पाहे । आधार नाहीं मज कोणी बाप ना माये ॥१॥

दाते हो दान करा । जातें पंढरपुरा । न्या मज तेथवरी । अखमाचा सोयरा ॥धृ०॥

हिंडतां गव्हानें गा शिणलों येरझारीं । न मिळेचि दाता कोणी जन्मदुःख निवारी । कीर्ति हे संतांमुखीं तोचि दाखवा हरी । पांगुळा पाय देतो नांदे पंढरपुरी ॥२॥

या पोटाकारणें गा झालों पांगिला जना । न सरेचि बापमाय भीक नाहीं खंडणा । पुढारा म्हणती एक तया नाहीं करुणा । श्वान हें लागे पाठीं आशा बहु दारुणा ॥३॥

काय मी चुकलों गा मागें नेणवे कांहीं । न कळेचि पापपुण्य तेथें आठव नाहीं । मी माजी भुललों गा दीप पतंगासोयीं । द्या मज जीवदान संत महानुभाव कांहीं ॥४॥

दुरोनि आलों मी गा दुःख झालें दारुण । यावया येथवरी होतें हेंचि कारण । दुर्लभ भेटी तुम्हां पायीं झालें दरुषन । विनवितो तुका संतां दोन्ही कर जोडून ॥५॥`,
  },
  {
    category: 'maganipar', number: '११८५', title: 'हीच व्हावी माझी आस',
    body: `हीच व्हावी माझी आस । जन्मोजन्मीं तुझा दास ॥१॥

पंढरीचा वारकरी । वारी चुको नेदी हरी ॥२॥

संत समागम । अंगीं भरोनियां प्रेम ॥३॥

चंद्रभागे स्नान । तुका मागे हेचि दान ॥४॥`,
  },
  {
    category: 'maganipar', number: '१२७९', title: 'देवा दिवस गेले वांयांविण',
    body: `देवा दिवस गेले वांयांविण । हरिसी न रिघतां शरण । बाळकत्व अज्ञानपण । ते आठवण नव्हेचि ॥१॥

आला तारुण्याचा अवसरू । सर्वचि विषयाचा पडिभरू । काम क्रोध मदमत्सरू । अति व्यापारू तृष्णेचा ॥२॥

वेच वृद्धत्व पातळे । सकळ इंद्रियें सांडियले । देह न करीं म्हणितले । अंतर पडले भक्तीसी ॥३॥

देवा हित कांहीं नव्हे माझें । दास्यत्व न घडेचि तुझें । आयुष्य गेले वायां काजें । धरणिये ओझें पै झालें ॥४॥

पुनरपि जन्मा येणें मागुता । कवण जाणे कैसी व्यवस्था । कैसा देह लागेल अनंता । केव्हां तव चरणीं येईल ॥५॥

आतां मज करूं नको उदास । तुझिया नामाचा विश्वास । हृदयीं नांदे हृषीकेश । विष्णुदास म्हणे नामा ॥६॥`,
  },
  {
    category: 'pandharipar', number: '२१३७', title: 'देव गुज सांगे पंढरीसि यारे',
    body: `देव गुज सांगे पंढरीसि यारे । प्रेमे चित्तीं ध्यारे नाम माझें ॥१॥

काया वाचा मन दृढ धरा जीवीं । सर्व मी चालवीं भार त्यांचा ॥२॥

भवसिंधु तारीन घ्यारे माझी भाक । साक्ष पुंडलीक करूनि बोले ॥३॥

लटिकें जरी असे नामयासी पुसा । त्यां आहे भरंवसा नामीं माझ्या ॥४॥`,
  },
  {
    category: 'sthitipar', number: '२४८३', title: 'धरोनी दोन्ही रूपें पाळणें संहार',
    body: `धरोनी दोन्ही रूपें पाळणें संहार । करी कोप रुद्र दयाळ विष्णु ॥१॥

जटाजूट एका मुकुट माथां शिरीं । कमळापति गौरीहर एक ॥२॥

भस्मउधळण लक्ष्मीचा भोग । शंकर श्रीरंग उभयरूपी ॥३॥

वैजयंती माळ वासुकीचा हार । लेणें अलंकार हरिहरा ॥४॥

कपाळ झोळी एका स्मशानींचा वास । एक जगन्निवास विश्वंभर ॥५॥

तुका म्हणे मज उभयरूपी एक । सारोनि संकल्प शरण आलो ॥६॥`,
  },
  {
    category: 'sthitipar', number: '२६२३', title: 'पायांपाशीं जीव',
    body: `पायांपाशीं जीव । ठेवियला तुमच्या भाव ॥१॥

न्याल म्हणोनियां सदना । विठ्ठल देवा कृपाघना ॥२॥

आळवितों नामें । लाहो करुनियां प्रेमें ॥३॥

निळा म्हणे दिवसरातीं । दुजें नेणोनियां चित्तीं ॥४॥`,
  },
  {
    category: 'upadeshpar', number: '३२९८', title: 'कळीमाजीं संत झाले',
    body: `कळीमाजीं संत झाले । टिळा टोपी लाविती भले ॥१॥

नाहीं वर्मींचें साधन । न कळे हृदयीं आत्मज्ञान ॥२॥

सदा सर्वदा गुरगुर । द्वेष सर्वदा ते करी ॥३॥

भजनीं नाहीं चाड । सदा विषयीं कवाड ॥४॥

ऐसिया संतांचा सांगात । नको मजसी आदि अंत ॥५॥

भोळियाच्या पायीं । एकाजनार्दनीं ठाव देई ॥६॥`,
  },
  {
    category: 'ghongadi', number: '३७१४', title: 'अनंता जन्मींचा शीण उतरला',
    body: `अनंता जन्मींचा शीण उतरला । सद्गुरु भेटला सदानंद ॥१॥

सदानंद माझा पांडुरंग पूर्ण । मायादि कारण विश्वबीज ॥२॥

देऊनियां हातीं निजबोधरत्न । तोडिला प्रयत्न संसारींचा ॥३॥

तुका म्हणे गुरुउपकारासी पाहीं । न मिळेचि कांहीं ब्रह्मांडांत ॥४॥`,
  },
  {
    category: 'virahinya', number: '३६५०', title: 'आजि शुभ लवे लोचनु हरिखें',
    body: `आजि शुभ लवे लोचनु हरिखें । सांगतांहे शकुन स्वप्न देखिलें सुंदरी । अळंकार लेववा चंदन चर्चावा जाति जुई पारिजातक शेवंती । करा आइती शेजारीं । शेला काढा मंचूचा हा दिन दैवाचा । सोहळा तो आमुचा मंदिरीं गे माये ॥१॥

गुढिया उभवा मखरें शृंगारा । भेटी होईल आळंगीं । स्फुरण आलें बाहीं क्षेमालागीं पाहीं । काचोळी न समाये अंगीं गे माये ॥धृ०॥

जीवीं जीव सुंदर । त्याचेनि साचार तो मज भेटवा सुखाचा विसावा । सुमनें उकलिलीं नित्य दे माळी । उचित करा तया भावा । आजि वेळु कां वो लाविला । नेणें पंथीं शीणला । बुझाऊं जाऊं त्याच्या गांवा गे माये ॥२॥

हृदयीं निर्भर प्रेम वारंवार माझें चित्तीं राहो ऐक्य मज । दुजिये वस्तुलागीं रुत जाय । माधवी मन्मथ करितांहे वोज । ऐसी तेथवरीं जाईन सुखाची होईन । नाचेन आनंदाचे भोजें गे माये ॥३॥

ऐसा विपरीत लाघवी लपे सवेंचि दावी वसिपे चौंके । अभ्यासें अंतर पडलें येणें तरी मी त्यजीन जिणें । म्हणोनि विनवितसें चतुर सुरेखें । रात्रीचे ठायीं देख मेघश्याम बोलला अंबरीं गे माये ॥४॥

ऐसिये निवांत मूर्ति ऐकोनि ठेली श्रुती । आकर्षोनि चित्तचैतन्य भरोनि ठेले लोचन । ध्यानीं विसर्जिलें मन । परमात्मया रामा तूं एक लाघवी सावेव पावलें ज्ञान । बापरखुमादेवीवरा विठ्ठला सुमनसंयोगीं आजि सत्य झालें माझें स्वप्न गे माये ॥५॥`,
  },
  {
    category: 'santapar', number: '३९०८', title: 'अलंकापुरी पुण्य ठाव',
    body: `अलंकापुरी पुण्य ठाव । तेथ समाधी ज्ञानदेव ॥१॥

पांडुरंगे दिधला वर । भेटी निर्धार कृष्णपक्षीं ॥२॥

नित्य स्नानालागीं जाणा । भागीरथी दिधली ज्ञाना ॥३॥

सरस्वती मणिकर्णिका । त्रिसंगमीं वाहती देखा ॥४॥

येथ स्नान करितां । वास वैकुंठीं तत्त्वतां ॥५॥

ऐसें देव सांगत । कान्होपाचा आनंदत ॥६॥`,
  },
  {
    category: 'santapar', number: '४०८३', title: 'कृपा केली संतजनीं',
    body: `कृपा केली संतजनीं । लाविला भजनीं श्रीहरीच्या ॥१॥

नाहीं तरी आणिकां साधनीं । जातां वायां लक्ष भोगावया चौर्‍यांशीं ॥२॥

आणिकां साधनीं गुंताचि पडतां । अभिमान वाढला नित्य तत्त्वतां ॥३॥

निळा म्हणे धांवणें केलें । सुपंथें लाविलें नीट घाट ॥४॥`,
  },
  {
    category: 'namapar', number: '३६३', title: 'एक तत्त्व हरि असे पै सर्वत्र',
    body: `एक तत्त्व हरि असे पै सर्वत्र । ऐसें सर्व शास्त्र बोलियेलें ॥१॥

हरिनाम उद्धरे हरिनामे उद्धरे । वेगीं हरि त्वरे उच्चारी जो ॥२॥

जपतां पै नाम यमकाळ कांपे । हरि हरि सोपें जपिजे सुखें ॥३॥

निवृत्ति म्हणे हरिनाम पाठ जपा । जन्मांतर खेपा अंतरती ॥४॥`,
  },
  {
    category: 'namapar', number: '३६७', title: 'ज्याचेनि सुखे चळत पै विश्व',
    body: `ज्याचेनि सुखे चळत पै विश्व । नांदे जगदीश सर्वांघटीं ॥१॥

त्याचें नाम हरी त्याचें नाम हरी । प्रपंच बोहरी कल्पनेची ॥२॥

शांती त्याची नारी प्रकृति विकारी । उन्मनी वोवरी हृदयांतु ॥३॥

निवृत्तिदेवीं धरिली निर्गुणीं । शांती हे संपूर्णी हरिप्रेमे ॥४॥`,
  },
  {
    category: 'namapar', number: '३९३', title: 'पदपदार्थ संपन्नता',
    body: `पदपदार्थ संपन्नता । व्यर्थ टवाळी कां सांगतां । हरिनामीं नित्य अनुसरतां । हे सार सर्वार्थी ॥१॥

हरिनाम सर्वपंथी । पाहावे नलगे ये अर्थी । जे अनुसरले ते कृतार्थी । भवपंथा मुकले ॥२॥

कुळ तरल तयांचे । जीहीं स्मरण केलें नामाचें । भय नाहीं त्या यमाचे । सर्व ग्रंथीं बोलियेलें ॥३॥

नलगे धन नलगे मोल । न लगती कष्ट बहुसाल । कीर्तन करितां काळवेळ । नाहीं नाहीं सर्वथा ॥४॥

हरि सर्वकाळ अविकल । स्मरे तो योगिया धन्य केवळ । त्याचेनि दर्शन सर्वकाळ । सुफळ संसार होतसे ॥५॥

ज्ञानदेवीं जप केला । मन मुरडुनि हरि ध्याइला । तेणें सर्वांगीं निवाला । हरि झाला निजांगे ॥६॥`,
  },
  {
    category: 'namapar', number: '३९४', title: 'जन्मजन्मांतरीं असेल पुण्यसामुग्री',
    body: `जन्मजन्मांतरीं असेल पुण्यसामुग्री । तरीच नाम जिव्हायीं येईल श्रीरामाचें ॥१॥

धन्य कुळ तयाचें रामनाम हेंचि वाचे । दोष हरतील जन्माचे श्रीराम म्हणतांची ॥२॥

कोटी कुळाचे उद्धरण । मुखीं राम नारायण । रामकृष्ण स्मरण । धन्य जन्म तयाचें ॥३॥

नाम तारक सांगडी । नाम न विसंबे अर्धघडी । तप केलें असेल कोडी । तरीच नाम येईल ॥४॥

ज्ञानदेवीं अभ्यास मोठा । नामस्मरण सुखावाटा । पूर्वज गेले वैकुंठा । हरि हरि स्मरतां ॥५॥`,
  },
  {
    category: 'namapar', number: '३९७', title: 'रामकृष्णनामें ये दोन्ही साजिरीं',
    body: `रामकृष्णनामें ये दोन्ही साजिरीं । हृदयमंदिरीं स्मरा कां रे ॥१॥

आपुली आपण करा सोडवण । संसारबंधन तोडा वेगीं ॥२॥

ज्ञानदेवा ध्यानीं रामकृष्ण माळा । हृदयीं जिव्हाळा श्रीमूर्ति रया ॥३॥`,
  },
  {
    category: 'namapar', number: '४१४', title: 'आवडीचे मागें प्रवृत्तीचे नेघे',
    body: `आवडीचे मागें प्रवृत्तीचे नेघे । नाममार्गे निघे वेगीं रया ॥१॥

नाम परब्रह्म नाम परब्रह्म । नित्य रामनाम सुख जपीजेसु ॥२॥

सोपान निवांत रामनाम सुखांत । नेणें दुजी मात हरीविण ॥३॥`,
  },
  {
    category: 'namapar', number: '४२०', title: 'आदि मध्य ऊर्ध्वे मुक्त भक्त हरी',
    body: `आदि मध्य ऊर्ध्वे मुक्त भक्त हरी । सबाह्य अभ्यंतरीं हरि पुरी ॥१॥

न लगती तीर्थ हरिरूप मुक्त । अवघेचि सूक्त जपिन्नलें ॥२॥

जयाचेनि नामे मुक्त पै जडकूढ । तरळे दगड समुद्री देखा ॥३॥

मुक्ताई हरिनाम सर्वदा पै मुक्त । नाहीं आदि अंत उरला आम्हा ॥४॥`,
  },
  {
    category: 'namapar', number: '४२१', title: 'अंतरीचें पुरे काम',
    body: `अंतरीचें पुरे काम । घेतां नाम विठोबाचें ॥१॥

नाम साराचेंही सार । हारणांगत यमकिंकर ॥२॥

पाहिले वेदांत । निश्चय केला निगमांत ॥३॥

सेना म्हणे न वचे कांहीं । लाभ नाहीं या पेक्षा ॥४॥`,
  },
];
for (const correction of verifiedDuplicateCorrections) {
  const card = categories.find(({ id }) => id === correction.category)?.abhangs.find(({ number }) => number === correction.number);
  if (!card) continue;
  Object.assign(card, correction);
  if (remainingOcrReview[correction.category]) {
    remainingOcrReview[correction.category] = remainingOcrReview[correction.category]
      .filter((number) => number !== correction.number);
  }
}

for (const [categoryId, omittedNumbers] of Object.entries(documentedPrintedOmissions)) {
  const category = categories.find(({ id }) => id === categoryId);
  if (!category) continue;
  const omitted = new Set(omittedNumbers);
  category.abhangs = category.abhangs.filter(({ number }) => !omitted.has(parseOcrNumberToken(number)));
}

const abhangEnding = /॥\s*[०-९0-9]+\s*॥/u;
for (const category of categories) {
  for (const abhang of category.abhangs) {
    if (abhang.body.length <= 1500) continue;
    const ending = abhangEnding.exec(abhang.body);
    if (!ending || ending.index + ending[0].length >= 2000) continue;
    abhang.body = abhang.body.slice(0, ending.index + ending[0].length).trim();
    abhang.title = (abhang.body.split(/\n|।/u).find(Boolean) || abhang.title).trim().slice(0, 125);
  }
}

const extraPoems = [
  ...extractCuratedPoems(textFromOcrFile(frontSupplementPath), frontSupplementDefinitions, 'पुरवणी'),
  ...extractCuratedPoems(textFromOcrFile(aartyaPath), aartyaDefinitions, 'आरती')
];
for (const poem of extraPoems) {
  const category = categories.find(({ id }) => id === poem.category);
  if (!category) throw new Error(`Supplement category was not found: ${poem.category}`);
  category.abhangs.push(poem);
}

const emptyCategories = categories.filter(({ abhangs }) => !abhangs.length);
if (emptyCategories.length) throw new Error(`No abhangs detected for: ${emptyCategories.map(({ label }) => label).join(', ')}`);

const categoryButtons = categories.map((category, index) =>
  `          <button type="button" class="puravni-index-button${index === 0 ? ' is-active' : ''}" data-category="${category.id}" aria-pressed="${index === 0 ? 'true' : 'false'}">` +
  `<span>${category.label}</span><small>${toMarathiNumber(category.abhangs.length)} अभंग</small></button>`
).join('\n');

let globalIndex = 0;
const cards = categories.flatMap((category) => category.abhangs.map((abhang) => {
  globalIndex += 1;
  const id = `gatha-${category.id}-${globalIndex}`;
  const shareUrl = `location.href.split('#')[0] + '#${id}'`;
  return `        <section class="puravni-abhang-group" data-category="${category.id}" data-abhang-number="${escapeHtml(abhang.number)}" aria-labelledby="${id}" hidden>\n` +
    `          <span class="puravni-abhang-tag">${escapeHtml(abhang.tag || `अभंग ${abhang.number}`)}</span>\n` +
    `          <h2 id="${id}">${escapeHtml(abhang.title)}</h2>\n` +
    `          <p>${escapeHtml(abhang.body)}</p>\n` +
    `          <div class="abhang-card-footer puravni-card-actions" aria-label="अभंग ${escapeHtml(abhang.number)} शेअर करा">\n` +
    `            <button type="button" class="abhang-btn copy-abhang-btn" aria-label="लिंक कॉपी करा" title="लिंक कॉपी करा" onclick="navigator.clipboard && navigator.clipboard.writeText(${shareUrl})"><i class="far fa-copy"></i></button>\n` +
    `            <button type="button" class="abhang-btn social-share-btn whatsapp-share-btn" aria-label="व्हॉट्सॲपवर शेअर करा" title="व्हॉट्सॲपवर शेअर करा" onclick="window.open('https://wa.me/?text=' + encodeURIComponent('अभंग ${escapeHtml(abhang.number)} ' + ${shareUrl}), '_blank', 'noopener')"><i class="fab fa-whatsapp"></i></button>\n` +
    `            <button type="button" class="abhang-btn social-share-btn facebook-share-btn" aria-label="फेसबुकवर शेअर करा" title="फेसबुकवर शेअर करा" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(${shareUrl}), '_blank', 'noopener')"><i class="fab fa-facebook-f"></i></button>\n` +
    `            <button type="button" class="abhang-btn social-share-btn instagram-share-btn" aria-label="इन्स्टाग्रामसाठी कॉपी करा" title="इन्स्टाग्रामसाठी कॉपी करा" onclick="navigator.clipboard && navigator.clipboard.writeText(${shareUrl}); window.open('https://www.instagram.com/', '_blank', 'noopener')"><i class="fab fa-instagram"></i></button>\n` +
    `            <button type="button" class="abhang-btn puravni-link-btn" aria-label="अभंगाची लिंक कॉपी करा" title="अभंगाची लिंक कॉपी करा" onclick="navigator.clipboard && navigator.clipboard.writeText(${shareUrl})"><i class="fas fa-link"></i></button>\n` +
    `          </div>\n` +
    `        </section>`;
})).join('\n');

const fragment = `${startMarker}\n` +
  `      <div class="puravni-browser">\n` +
  `        <section class="puravni-index-panel" aria-label="अभंग विषय">\n` +
  `          <div class="puravni-index-grid">\n${categoryButtons}\n          </div>\n` +
  `        </section>\n` +
  `      </div>\n` +
  `      <div class="puravni-text-content">\n${cards}\n      </div>\n` +
  `      ${endMarker}`;

const html = fs.readFileSync(targetPath, 'utf8');
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error('Content markers were not found.');
fs.writeFileSync(targetPath, html.slice(0, start) + fragment + html.slice(end + endMarker.length), 'utf8');

console.log(JSON.stringify({ categories: categories.length, abhangs: globalIndex, highResAdditions, highResReplacements, guidedHighResReplacements, fuzzyHighResReplacements, archiveDuplicateRepairs, exactHighResDuplicateRepairs, similarityGuidedDuplicateRepairs, orderedArchiveDuplicateRepairs, fallbackArchiveDuplicateRepairs, remainingOcrReview, bytes: Buffer.byteLength(fragment), counts: Object.fromEntries(categories.map(({ label, abhangs }) => [label, abhangs.length])) }, null, 2));
