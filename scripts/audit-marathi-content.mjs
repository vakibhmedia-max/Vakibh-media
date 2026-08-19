import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'Vakibh-media');
const reportPath = path.resolve(process.argv[3] || 'reports/marathi-content-audit.json');
const extensions = new Set(['.html', '.htm', '.json', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.php', '.md', '.txt', '.css', '.sql']);
const ignoredDirectories = new Set(['.git', 'node_modules', 'vendor', 'uploads', 'reports']);
const findings = [];
let filesScanned = 0;

const rules = [
  { id: 'replacement-character', severity: 'confirmed', regex: /\uFFFD/g },
  { id: 'mojibake-devanagari', severity: 'confirmed', regex: /(?:à¤|à¥|Ã|Â|â€|â€™|â€œ|â€�|ðŸ)/g },
  { id: 'zero-width-space', severity: 'review', regex: /\u200B/g },
  { id: 'word-joiner', severity: 'review', regex: /\u2060/g },
  { id: 'unexpected-bom', severity: 'review', regex: /\uFEFF/g },
  { id: 'bidi-control', severity: 'review', regex: /[\u202A-\u202E\u2066-\u2069]/g },
  { id: 'control-character', severity: 'confirmed', regex: /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g },
  { id: 'latin-inside-devanagari-word', severity: 'review', regex: /[\u0900-\u097F][A-Za-z]+[\u0900-\u097F]/g },
  { id: 'visible-encoded-entity', severity: 'review', regex: /&amp;(?:nbsp|#\d+|#x[0-9a-f]+);/gi },
  { id: 'object-placeholder', severity: 'review', regex: /\uFFFC/g },
  { id: 'box-drawing-placeholder', severity: 'review', regex: /[□■▢▣]/g },
  { id: 'private-use-character', severity: 'confirmed', regex: /[-]/g },
  { id: 'unicode-noncharacter', severity: 'confirmed', regex: /[﷐-﷯￾￿]/g },
  { id: 'suspicious-ocr-mark', severity: 'review', regex: /[॑-॔॰«»]/g },
  { id: 'repeated-nbsp', severity: 'review', regex: /(?:&nbsp;|\u00A0){2,}/gi },
  { id: 'excessive-breaks', severity: 'review', regex: /(?:<br\s*\/?>\s*){4,}/gi },
];

function lineInfo(text, index) {
  const before = text.slice(0, index);
  const line = before.split(/\r?\n/).length;
  const lineStart = Math.max(before.lastIndexOf('\n') + 1, index - 55);
  const lineEndRaw = text.indexOf('\n', index);
  const lineEnd = lineEndRaw === -1 ? Math.min(text.length, index + 55) : Math.min(lineEndRaw, index + 55);
  return { line, context: text.slice(lineStart, lineEnd).replace(/\s+/g, ' ').trim() };
}

function codePoints(value) {
  return [...value].map((char) => `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
}

function scanFile(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return;
  }
  filesScanned += 1;
  const relativeFile = path.relative(root, file).replaceAll('\\', '/');
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(text);
  const pageTitle = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    : null;

  for (const rule of rules) {
    rule.regex.lastIndex = 0;
    for (const match of text.matchAll(rule.regex)) {
      if (rule.id === 'unexpected-bom' && match.index === 0) continue;
      const { line, context } = lineInfo(text, match.index);
      findings.push({ file: relativeFile, pageTitle, line, rule: rule.id, severity: rule.severity, character: match[0], unicode: codePoints(match[0]), context });
    }
  }

  if (text !== text.normalize('NFC')) {
    const normalized = text.normalize('NFC');
    let index = 0;
    while (index < text.length && text[index] === normalized[index]) index += 1;
    const { line, context } = lineInfo(text, index);
    findings.push({ file: relativeFile, pageTitle, line, rule: 'not-nfc-normalized', severity: 'review', character: text.slice(index, index + 4), unicode: codePoints(text.slice(index, index + 4)), context });
  }
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.isDirectory()) continue;
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (extensions.has(path.extname(entry.name).toLowerCase())) scanFile(fullPath);
  }
}

walk(root);
const byRule = Object.fromEntries([...new Set(findings.map((item) => item.rule))].sort().map((rule) => [rule, findings.filter((item) => item.rule === rule).length]));
const affectedFiles = new Set(findings.map((item) => item.file)).size;
const report = {
  generatedAt: new Date().toISOString(),
  root,
  filesScanned,
  affectedFiles,
  totalFindings: findings.length,
  confirmedFindings: findings.filter((item) => item.severity === 'confirmed').length,
  reviewFindings: findings.filter((item) => item.severity === 'review').length,
  byRule,
  findings,
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ filesScanned, affectedFiles, totalFindings: findings.length, confirmedFindings: report.confirmedFindings, reviewFindings: report.reviewFindings, byRule, reportPath }, null, 2));
