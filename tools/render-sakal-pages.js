const fs = require('fs');
const path = require('path');

const pdfPath = process.env.SAKAL_GATHA_PDF || 'C:\\Users\\Dell\\Downloads\\सकल संत गाथा.pdf';
const toolRoot = process.env.SAKAL_GATHA_TOOLS || 'D:\\vakibh-pdf-tools';
const outputRoot = process.env.SAKAL_RENDER_OUTPUT || path.resolve('reports', 'sakal-pages');
const pages = process.argv.slice(2).map(Number).filter(Number.isFinite);

if (!pages.length) throw new Error('Pass one or more PDF page numbers.');

async function main() {
  const pdfModule = path.join(toolRoot, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs').replace(/\\/g, '/');
  const pdfjs = await import(`file:///${pdfModule}`);
  const { createCanvas } = require(path.join(toolRoot, 'node_modules', '@napi-rs', 'canvas'));
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)) }).promise;
  fs.mkdirSync(outputRoot, { recursive: true });

  for (const pageNumber of pages) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2.4 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    const outputPath = path.join(outputRoot, `page-${pageNumber}.png`);
    fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
    process.stdout.write(`${outputPath}\n`);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
