const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'Vakibh-media', 'sants', 'dnyaneshwar');
const markerOnly = /॥\s*[०-९0-9]+\s*॥/;
const chapterMarker = /॥\s*[०-९0-9]+\s*[-–]\s*[०-९0-9]+\s*॥/;

function read(chapter) {
  const file = path.join(root, `adhyay-${chapter}`, 'index.html');
  return { file, html: fs.readFileSync(file, 'utf8') };
}

function write(file, html, original) {
  if (html !== original) fs.writeFileSync(file, html, 'utf8');
}

function joinSplitOviBlocks(html) {
  let previous;
  do {
    previous = html;
    html = html.replace(/<div class="ovi">([\s\S]*?)<\/div>\s*<div class="ovi">([\s\S]*?)<\/div>\s*<div class="oviar">([\s\S]*?)<\/div>/g, (full, first, second, meaning) => {
      if (!markerOnly.test(second) || !chapterMarker.test(meaning)) return full;
      return `<div class="ovi">${first}<br/>${second}</div><div class="oviar">${meaning}</div>`;
    });
    html = html.replace(/<div class="ovi">([\s\S]*?)<\/div>\s*<div class="oviar">([\s\S]*?)<\/div>\s*<div class="oviar">([\s\S]*?)<\/div>/g, (full, first, second, meaning) => {
      if (!markerOnly.test(second) || !chapterMarker.test(meaning)) return full;
      return `<div class="ovi">${first}<br/>${second}</div><div class="oviar">${meaning}</div>`;
    });
  } while (html !== previous);
  return html;
}

{
  const { file, html: original } = read(12);
  let html = original;
  html = html.replace(/<div class="ovi">([\s\S]*?ब्रह्मरंध्र ॥ ५५ ॥)<\/p>\s*<div class="ovi">([\s\S]*?॥१२-५५॥)<\/div>\s*<div class="oviar">([\s\S]*?ते सांडोनिया गहन ।)<\/div>\s*<div class="oviar">([\s\S]*?॥ ५६ ॥)<\/div>\s*<div class="ovi">([\s\S]*?॥१२-५६॥)<\/div>/, '<div class="ovi">$1</div><div class="oviar">$2</div><div class="ovi">$3<br/>$4</div><div class="oviar">$5</div>');
  html = html.replace(/<p style="text-align: center;">([\s\S]*?जन्ममृत्यूचिया लाटीं[\s\S]*?इया सृष्टी ।)<\/div><div class="oviar">([\s\S]*?॥ ८७ ॥)<\/div>\s*<div class="ovi">([\s\S]*?॥१२-८७॥)<\/p>/, '<div class="ovi">$1<br/>$2</div><div class="oviar">$3</div>');
  html = joinSplitOviBlocks(html);
  write(file, html, original);
}

{
  const { file, html: original } = read(5);
  let html = original;
  html = html.replace(/<div class="ovi">([\s\S]*?॥ ८ ॥)<\/div><div class="oviar">([\s\S]*?॥ ९ ॥)<\/div><p style="text-align: center;">([\s\S]*?॥५-८, ९॥)<\/p>/, '<div class="ovi">$1<br/>$2</div><div class="oviar">$3</div>');
  write(file, html, original);
}

{
  const { file, html: original } = read(6);
  let html = original;
  html = html.replace(/<div><strong>([\s\S]*?)<\/strong><\/div>\s*<div><strong>([\s\S]*?॥६-[०-९0-9]+॥)<\/strong><\/div>\s*<div>([\s\S]*?॥६-[०-९0-9]+॥)<\/div>/g, '<div class="ovi"><strong>$1</strong><br/><strong>$2</strong></div><div class="oviar">$3</div>');
  html = html.replace(/\s*<p>[^<]*॥६-९६॥<\/p>\s*(?=<div class="ovi"><strong>ते जैशी निर्वाण|<div class="ovi"><strong>ते जैशी)/, '\n');
  write(file, html, original);
}