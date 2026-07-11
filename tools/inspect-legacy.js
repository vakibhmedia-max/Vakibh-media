const fs = require('fs');
const path = require('path');
const marker = /॥\s*(?:[०-९0-9]+\s*[-–]\s*)?[०-९0-9]+\s*॥/;
function stripTags(value){return value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();}
for (const ch of [5,6]) {
  const file = path.join('Vakibh-media','sants','dnyaneshwar',`adhyay-${ch}`,'index.html');
  const html = fs.readFileSync(file,'utf8');
  console.log(`chapter ${ch}`);
  for (const m of html.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)) {
    const attrs = m[1]; const inner = m[2];
    if (/class\s*=\s*["'][^"']*\b(hdr|end|ref)\b/i.test(attrs)) continue;
    if (/<br\s*\/?>/i.test(inner) && marker.test(stripTags(inner))) {
      console.log('attrs=', attrs);
      console.log(stripTags(inner).slice(0,500));
    }
  }
}