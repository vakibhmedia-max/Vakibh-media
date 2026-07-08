const fs = require('fs');
const pageFile = 'Vakibh-media/sants/dnyaneshwar/abhang-1-200/index.html';
const sourceFile = 'C:/tmp/gatha-1-post.json';
const page = fs.readFileSync(pageFile, 'utf8');
const source = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
let content = source.content.rendered;

content = content
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
  .replace(/<div[^>]*class="[^"]*ast-oembed-container[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
  .replace(/<p>\s*&nbsp;\s*<\/p>/gi, '')
  .replace(/<p>\s*<a[^>]*play\.google\.com[\s\S]*?<\/p>/gi, '')
  .replace(/<p>\s*<strong>\s*संत ज्ञानेश्वर अँप डाउनलोड[\s\S]*?<\/p>/gi, '')
  .replace(/<h2[^>]*>[\s\S]*?अभंग विडिओ स्वरूपात पहा[\s\S]*?<\/h2>/gi, '')
  .replace(/<h2[^>]*>[\s\S]*?sant dnyaneshwer abhnag[\s\S]*?<\/h2>/gi, '')
  .replace(/<a\s+[^>]*href="[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, '$1')
  .replace(/\s*(?:\r?\n){3,}/g, '\n\n')
  .trim();

const startMarker = '<div class="entry-content clear" itemprop="text">';
const endMarker = '<!-- CONTENT END 1 -->';
const start = page.indexOf(startMarker);
const end = page.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error('entry markers not found');

const before = page.slice(0, start + startMarker.length);
const after = page.slice(end);
const next = `${before}\n\n${content}\n\n${after}`;
fs.writeFileSync(pageFile, next, 'utf8');

const pCount = (content.match(/<p\b/gi) || []).length;
const strongNumbers = (content.match(/<p><strong>[०-९0-9]+<\/strong>/g) || []).length;
console.log(`inserted paragraphs=${pCount} numberedBlocks=${strongNumbers} chars=${content.length}`);