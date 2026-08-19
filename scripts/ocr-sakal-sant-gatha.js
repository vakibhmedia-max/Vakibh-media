const fs = require('fs');
const path = require('path');

const PDF_PATH = process.env.SAKAL_GATHA_PDF || 'C:\\Users\\Dell\\Downloads\\सकल संत गाथा.pdf';
const TOOL_ROOT = process.env.SAKAL_GATHA_TOOLS || 'D:\\vakibh-pdf-tools';
const OUTPUT_PATH = process.env.SAKAL_GATHA_OCR || 'D:\\sakal-sant-gatha-ocr.json';
const START_PAGE = Number(process.env.SAKAL_GATHA_START_PAGE || 3);
const END_PAGE = Number(process.env.SAKAL_GATHA_END_PAGE || 664);
const WORKERS = Math.max(1, Number(process.env.SAKAL_GATHA_WORKERS || 6));
const SCALE = Number(process.env.SAKAL_GATHA_SCALE || 1.8);

function toolPath(...parts) {
  return path.join(TOOL_ROOT, 'node_modules', ...parts);
}

function save(results) {
  const pages = results
    .map((text, index) => text == null ? null : { page: START_PAGE + index, text })
    .filter(Boolean);
  const temporaryPath = `${OUTPUT_PATH}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify({ source: PDF_PATH, startPage: START_PAGE, endPage: END_PAGE, pages }), 'utf8');
  fs.renameSync(temporaryPath, OUTPUT_PATH);
}

async function main() {
  const pdfjs = await import(`file:///${toolPath('pdfjs-dist', 'legacy', 'build', 'pdf.mjs').replace(/\\/g, '/')}`);
  const { createCanvas } = require(toolPath('@napi-rs', 'canvas'));
  const { createWorker, OEM, PSM } = require(toolPath('tesseract.js'));
  const mar = require(toolPath('@tesseract.js-data', 'mar'));
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(PDF_PATH)) }).promise;
  const finalPage = Math.min(END_PAGE, pdf.numPages);
  const total = finalPage - START_PAGE + 1;
  const results = new Array(total).fill(null);

  if (fs.existsSync(OUTPUT_PATH)) {
    const checkpoint = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    if (checkpoint.startPage === START_PAGE) {
      checkpoint.pages.forEach(({ page, text }) => {
        if (page >= START_PAGE && page <= finalPage) results[page - START_PAGE] = text;
      });
    }
  }

  let cursor = 0;
  let completed = results.filter((text) => text != null).length;
  const next = () => {
    while (cursor < total && results[cursor] != null) cursor += 1;
    if (cursor >= total) return null;
    const index = cursor++;
    return { index, pageNumber: START_PAGE + index };
  };

  const run = async (workerNumber) => {
    const worker = await createWorker(mar.code, OEM.LSTM_ONLY, { langPath: mar.langPath, gzip: mar.gzip });
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO, preserve_interword_spaces: '1' });
    try {
      while (true) {
        const task = next();
        if (!task) break;
        const page = await pdf.getPage(task.pageNumber);
        const viewport = page.getViewport({ scale: SCALE });
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const result = await worker.recognize(canvas.toBuffer('image/png'));
        results[task.index] = result.data.text;
        completed += 1;
        console.log(`OCR ${completed}/${total}: page ${task.pageNumber}, worker ${workerNumber}, confidence ${Math.round(result.data.confidence)}`);
        if (completed % 12 === 0) save(results);
      }
    } finally {
      await worker.terminate();
    }
  };

  await Promise.all(Array.from({ length: Math.min(WORKERS, total) }, (_, index) => run(index + 1)));
  save(results);
  console.log(`Saved ${completed} OCR pages to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
