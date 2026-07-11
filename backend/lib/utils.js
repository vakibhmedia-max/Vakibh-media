const slugify = require('slugify');

function normalizeSlug(input) {
  const value = String(input || '').trim();
  const asciiSlug = slugify(value, { lower: true, strict: true, trim: true });
  if (asciiSlug) return asciiSlug;

  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensureLeadingSlash(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('/')) {
    return raw;
  }
  return `/${raw.replace(/^\.\/+/, '').replace(/^\/+/, '')}`;
}

function formatDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('mr-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function htmlPreviewText(html, maxLength = 180) {
  const plain = stripHtml(html);
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}...`;
}

module.exports = {
  ensureLeadingSlash,
  formatDate,
  htmlPreviewText,
  normalizeSlug,
  stripHtml,
  toDateTimeLocal
};
