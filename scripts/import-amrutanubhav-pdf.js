const fs = require('fs');
const os = require('os');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PDF_PATH = process.env.AMRUTANUBHAV_PDF || 'C:\\Users\\Dell\\Downloads\\अमृतानुभव.pdf';
const TOOL_ROOT = process.env.AMRUTANUBHAV_PDF_TOOLS || path.join(os.tmpdir(), 'vakibh-pdf-tools');
const TARGET_PATH = path.join(
  PROJECT_ROOT,
  'Vakibh-media',
  'sants',
  'dnyaneshwar',
  'amrutanubhav',
  'index.html'
);
const OCR_PATH = path.join(PROJECT_ROOT, 'database', 'amrutanubhav-ocr.json');
const START_PAGE = Number(process.env.AMRUTANUBHAV_START_PAGE || 51);
const END_PAGE = Number(process.env.AMRUTANUBHAV_END_PAGE || 478);
const WORKER_COUNT = Math.max(1, Number(process.env.AMRUTANUBHAV_OCR_WORKERS || 4));
const RENDER_SCALE = Number(process.env.AMRUTANUBHAV_RENDER_SCALE || 2.4);

function toolPath(...parts) {
  return path.join(TOOL_ROOT, 'node_modules', ...parts);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeLine(value) {
  return String(value || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s*[|_—=-]{4,}\s*$/, '')
    .trim();
}

function isHeading(line) {
  return /(?:प्रकरण|विवरणप्रारंभ|उपसंहार|समाप्त|संपूर्ण|अमृतानुभव)/i.test(line) && line.length < 150;
}

function isVerse(line) {
  return /[।॥]/.test(line) && line.length < 220;
}

function pageTextToHtml(pageNumber, rawText) {
  let lines = String(rawText || '')
    .split(/\r?\n/)
    .map(normalizeLine);
  const blocks = [];
  let paragraph = [];

  if (pageNumber === 51) {
    const firstVerse = lines.findIndex((line) => /यद.*क्षर/.test(line));
    if (firstVerse > 0) lines = lines.slice(firstVerse);
    blocks.push('<p class="amrutanubhav-verse" style="text-align: center;">॥ श्री ॥</p>');
    blocks.push('<p class="hdr2" style="text-align: center;"><strong>अमृतानुभव</strong></p>');
    blocks.push('<p class="hdr3" style="text-align: center;"><strong>सुबोध महाराष्ट्र विवरणसहित</strong></p>');
  }

  const flushParagraph = () => {
    const text = paragraph.join(' ').replace(/\s+/g, ' ').trim();
    if (text) blocks.push(`<p>${escapeHtml(text)}</p>`);
    paragraph = [];
  };

  for (const line of lines) {
    if (!line) {
      flushParagraph();
      continue;
    }

    if (isHeading(line)) {
      flushParagraph();
      blocks.push(`<p class="hdr2" style="text-align: center;"><strong>${escapeHtml(line)}</strong></p>`);
      continue;
    }

    if (isVerse(line)) {
      flushParagraph();
      blocks.push(`<p class="amrutanubhav-verse" style="text-align: center;">${escapeHtml(line)}</p>`);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  const pageKind = pageNumber >= 451 ? ' amrutanubhav-reference-page' : '';
  return `<div id="pdf-page-${pageNumber}" class="amrutanubhav-source-page${pageKind}" data-pdf-page="${pageNumber}">\n${blocks.join('\n')}\n</div>`;
}

function saveCheckpoint(results) {
  const pages = results
    .map((text, index) => text == null ? null : ({ page: START_PAGE + index, text }))
    .filter(Boolean);
  fs.writeFileSync(
    OCR_PATH,
    `${JSON.stringify({ source: PDF_PATH, startPage: START_PAGE, endPage: END_PAGE, pages }, null, 2)}\n`,
    'utf8'
  );
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) throw new Error(`PDF not found: ${PDF_PATH}`);
  if (!fs.existsSync(TARGET_PATH)) throw new Error(`Target page not found: ${TARGET_PATH}`);

  const pdfjs = await import(
    `file:///${toolPath('pdfjs-dist', 'legacy', 'build', 'pdf.mjs').replace(/\\/g, '/')}`
  );
  const { createCanvas } = require(toolPath('@napi-rs', 'canvas'));
  const { createWorker, OEM, PSM } = require(toolPath('tesseract.js'));
  const mar = require(toolPath('@tesseract.js-data', 'mar'));
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(fs.readFileSync(PDF_PATH))
  }).promise;

  if (END_PAGE > pdf.numPages) throw new Error(`PDF has only ${pdf.numPages} pages.`);

  const total = END_PAGE - START_PAGE + 1;
  const results = new Array(total).fill(null);
  if (fs.existsSync(OCR_PATH)) {
    try {
      const checkpoint = JSON.parse(fs.readFileSync(OCR_PATH, 'utf8'));
      if (checkpoint.startPage === START_PAGE) {
        checkpoint.pages.forEach((entry) => {
          if (entry.page >= START_PAGE && entry.page <= END_PAGE) {
            results[entry.page - START_PAGE] = entry.text;
          }
        });
      }
    } catch (_) {}
  }

  let cursor = 0;
  let completed = results.filter((text) => text != null).length;
  const nextPage = () => {
    while (cursor < total && results[cursor] != null) cursor += 1;
    if (cursor >= total) return null;
    const index = cursor;
    cursor += 1;
    return { index, pageNumber: START_PAGE + index };
  };

  const runWorker = async (workerNumber) => {
    const worker = await createWorker(mar.code, OEM.LSTM_ONLY, {
      langPath: mar.langPath,
      gzip: mar.gzip
    });
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1'
    });

    try {
      while (true) {
        const task = nextPage();
        if (!task) break;
        const page = await pdf.getPage(task.pageNumber);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const result = await worker.recognize(canvas.toBuffer('image/png'));
        results[task.index] = result.data.text;
        completed += 1;
        console.log(
          `OCR ${completed}/${total}: PDF page ${task.pageNumber} ` +
          `(worker ${workerNumber}, confidence ${Math.round(result.data.confidence)})`
        );
        if (completed % 10 === 0) saveCheckpoint(results);
      }
    } finally {
      await worker.terminate();
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(WORKER_COUNT, total) }, (_, index) => runWorker(index + 1))
  );
  saveCheckpoint(results);

  const generated = results
    .map((text, index) => pageTextToHtml(START_PAGE + index, text))
    .join('\n\n');
  const html = fs.readFileSync(TARGET_PATH, 'utf8');
  const contentStartPattern = /<div class="entry-content clear(?: amrutanubhav-reading-card)?" itemprop="text">/;
  const contentEndMarker = '<!-- CONTENT END 1 -->';
  const contentStartMatch = contentStartPattern.exec(html);
  const contentStart = contentStartMatch ? contentStartMatch.index : -1;
  const contentEnd = html.indexOf(contentEndMarker, contentStart);
  if (contentStart === -1 || contentEnd === -1) throw new Error('Amrutanubhav content markers not found.');

  const insertAt = contentStart + contentStartMatch[0].length;
  const updated =
    html.slice(0, insertAt) +
    `\n${generated}\n\n` +
    html.slice(contentEnd);
  fs.writeFileSync(TARGET_PATH, updated, 'utf8');
  console.log(`Updated ${TARGET_PATH} with PDF pages ${START_PAGE}-${END_PAGE}.`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
