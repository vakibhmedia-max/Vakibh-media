const crypto = require('crypto');
const fs = require('fs');
const { inferBlogCategory } = require('./categories');
const http = require('http');
const https = require('https');
const path = require('path');

const { getPool } = require('./db');
const {
  ensureUniqueSlug,
  getNextSortOrder,
  getPostByOriginalUrl,
  getPostBySlug,
  sanitizeContentHtml,
  syncStaticBlogPages,
  updateBlogPost
} = require('./blogs');
const { htmlPreviewText, normalizeSlug, stripHtml } = require('./utils');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const IMPORT_UPLOAD_ROOT = path.join(PROJECT_ROOT, 'uploads', 'blogger-import');
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_HOSTS = ['blogger.com', 'blogspot.com', 'googleusercontent.com', 'ggpht.com'];

function decodeXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, '&');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function firstTag(xml, tagName) {
  const match = String(xml || '').match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? decodeXml(match[1]).trim() : '';
}

function allTags(xml, tagName) {
  const matches = [];
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  let match;
  while ((match = regex.exec(String(xml || '')))) {
    matches.push(decodeXml(match[1]).trim());
  }
  return matches;
}

function parseAttributes(tag) {
  const attributes = {};
  const regex = /([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = regex.exec(String(tag || '')))) {
    attributes[match[1]] = decodeXml(match[3] || match[4] || '');
  }
  return attributes;
}

function extractEntryBlocks(xml) {
  const entries = [];
  const regex = /<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi;
  let match;
  while ((match = regex.exec(String(xml || '')))) entries.push(match[0]);
  return entries;
}

function getContentHtml(entryXml) {
  const contentMatch = String(entryXml || '').match(/<content(?:\s[^>]*)?>([\s\S]*?)<\/content>/i);
  const summaryMatch = String(entryXml || '').match(/<summary(?:\s[^>]*)?>([\s\S]*?)<\/summary>/i);
  return decodeXml(contentMatch?.[1] || summaryMatch?.[1] || '').trim();
}

function getLinks(entryXml) {
  const links = [];
  const regex = /<link\b[^>]*>/gi;
  let match;
  while ((match = regex.exec(String(entryXml || '')))) links.push(parseAttributes(match[0]));
  return links;
}

function getEntryOriginalUrl(entryXml, links = []) {
  const alternate = links.find((link) => link.rel === 'alternate' && link.href);
  if (alternate?.href) return alternate.href.trim();

  const filename = firstTag(entryXml, 'blogger:filename');
  if (!filename) return '';
  return filename.startsWith('/') ? filename : `/${filename.replace(/^\/+/, '')}`;
}

function slugFromOriginalUrl(originalUrl) {
  const value = String(originalUrl || '').trim();
  if (!value) return '';

  let pathname = value;
  try {
    pathname = new URL(value).pathname || value;
  } catch (_) {
    pathname = value;
  }

  const cleanPath = pathname.replace(/\/+$/, '');
  const baseName = path.basename(cleanPath).replace(/\.html?$/i, '');
  const normalizedBase = normalizeSlug(baseName.replace(/_/g, '-'));
  if (!normalizedBase) return '';

  if (/^blog-post(?:-?\d+)?$/i.test(normalizedBase)) {
    const context = cleanPath
      .split('/')
      .filter(Boolean)
      .slice(-3, -1)
      .map((part) => normalizeSlug(part))
      .filter(Boolean);

    if (context.length) return [...context, normalizedBase].join('-');
  }

  return normalizedBase;
}

function getCategories(entryXml) {
  const labels = [];
  const regex = /<category\b[^>]*>/gi;
  let match;
  while ((match = regex.exec(String(entryXml || '')))) {
    const attrs = parseAttributes(match[0]);
    if (attrs.term && !/^http:\/\/schemas\.google\.com\/blogger\//i.test(attrs.term)) {
      labels.push(attrs.label || attrs.term);
    }
  }
  return [...new Set(labels.map((label) => String(label || '').trim()).filter(Boolean))];
}

function extractImageUrls(html) {
  const urls = [];
  const regex = /<img\b[^>]*\bsrc\s*=\s*("([^"]+)"|'([^']+)'|([^\s>]+))/gi;
  let match;
  while ((match = regex.exec(String(html || '')))) {
    const src = decodeXml(match[2] || match[3] || match[4] || '').trim();
    if (src && !urls.includes(src)) urls.push(src);
  }
  return urls;
}

function isDownloadableBloggerImage(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_IMAGE_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch (_) {
    return false;
  }
}

function getFileExtension(url, contentType = '') {
  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname).toLowerCase();
    if (/^\.(jpg|jpeg|png|gif|webp|avif)$/i.test(ext)) return ext;
  } catch (_) {}

  if (/png/i.test(contentType)) return '.png';
  if (/gif/i.test(contentType)) return '.gif';
  if (/webp/i.test(contentType)) return '.webp';
  if (/avif/i.test(contentType)) return '.avif';
  return '.jpg';
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const request = client.get(url, { timeout: 20000 }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.resume();
        const redirected = new URL(response.headers.location, url).toString();
        downloadFile(redirected, destination).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Image returned HTTP ${response.statusCode}`));
        return;
      }

      let downloaded = 0;
      const file = fs.createWriteStream(destination);
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (downloaded > MAX_IMAGE_BYTES) {
          request.destroy(new Error('Image is larger than 15 MB'));
          file.destroy();
        }
      });
      response.pipe(file);
      file.on('finish', () => file.close(() => resolve(destination)));
      file.on('error', reject);
    });

    request.on('timeout', () => request.destroy(new Error('Image download timed out')));
    request.on('error', reject);
  });
}

async function downloadAndRewriteImages(contentHtml, baseSlug) {
  await fs.promises.mkdir(IMPORT_UPLOAD_ROOT, { recursive: true });
  const urls = extractImageUrls(contentHtml).filter(isDownloadableBloggerImage);
  const replacements = new Map();
  const failures = [];

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      const ext = getFileExtension(url);
      const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
      const filename = `${baseSlug || 'blogger-post'}-${hash}${ext}`;
      const diskPath = path.join(IMPORT_UPLOAD_ROOT, filename);
      const publicPath = `/uploads/blogger-import/${filename}`;

      if (!fs.existsSync(diskPath)) await downloadFile(parsed.toString(), diskPath);
      replacements.set(url, publicPath);
    } catch (error) {
      failures.push({ url, error: error.message });
    }
  }

  let rewritten = contentHtml;
  for (const [oldUrl, newUrl] of replacements.entries()) {
    rewritten = rewritten.split(oldUrl).join(newUrl);
    rewritten = rewritten.split(escapeHtml(oldUrl)).join(newUrl);
  }

  return {
    contentHtml: rewritten,
    localImages: [...replacements.values()],
    failures
  };
}

function makeExcerpt(contentHtml) {
  return htmlPreviewText(contentHtml, 220);
}

function makeMetaDescription(contentHtml) {
  const plain = stripHtml(contentHtml);
  return plain.length > 150 ? plain.slice(0, 150).trimEnd() : plain;
}

function parseBloggerFeed(xml) {
  if (!/<feed[\s>]/i.test(xml) || !/<entry[\s>]/i.test(xml)) {
    const error = new Error('Invalid or empty Blogger Atom feed.');
    error.statusCode = 400;
    throw error;
  }

  return extractEntryBlocks(xml)
    .map((entryXml, index) => {
      const title = firstTag(entryXml, 'title') || `Blogger post ${index + 1}`;
      const contentHtml = getContentHtml(entryXml);
      const links = getLinks(entryXml);
      const originalUrl = getEntryOriginalUrl(entryXml, links);
      const slugFromUrl = slugFromOriginalUrl(originalUrl);
      const baseSlug = normalizeSlug(slugFromUrl) || normalizeSlug(title) || `blogger-post-${index + 1}`;
      const labels = getCategories(entryXml);
      const author = firstTag(firstTag(entryXml, 'author'), 'name') || firstTag(entryXml, 'name') || 'Blogger';
      const imageUrls = extractImageUrls(contentHtml);
      const sanitizedContent = sanitizeContentHtml(contentHtml || `<p>${escapeHtml(firstTag(entryXml, 'summary') || title)}</p>`);

      return {
        index: index + 1,
        id: firstTag(entryXml, 'id'),
        title,
        slug: baseSlug,
        content_html: sanitizedContent,
        excerpt: firstTag(entryXml, 'summary') || makeExcerpt(sanitizedContent),
        published_at: firstTag(entryXml, 'published') || firstTag(entryXml, 'issued') || firstTag(entryXml, 'updated'),
        updated_at: firstTag(entryXml, 'updated'),
        author_name: author,
        labels,
        category: inferBlogCategory(title, labels.join(' '), sanitizedContent),
        featured_image: imageUrls[0] || '',
        original_url: originalUrl,
        imageUrls,
        meta_title: title,
        meta_description: makeMetaDescription(sanitizedContent),
        errors: sanitizedContent ? [] : ['Empty post content']
      };
    })
    .filter((post) => post.title || post.content_html || post.original_url);
}

async function buildImportPreview(filePath) {
  const xml = await fs.promises.readFile(filePath, 'utf8');
  const posts = parseBloggerFeed(xml);
  if (!posts.length) {
    const error = new Error('No Blogger posts were found in this feed.');
    error.statusCode = 400;
    throw error;
  }

  let newPosts = 0;
  let duplicatePosts = 0;
  const previewPosts = [];

  for (const post of posts) {
    const originalMatch = post.original_url ? await getPostByOriginalUrl(post.original_url) : null;
    const slugMatch = originalMatch ? null : await getPostBySlug(post.slug, { publishedOnly: false });
    const duplicate = originalMatch || slugMatch;
    if (duplicate) duplicatePosts += 1;
    else newPosts += 1;

    previewPosts.push({
      ...post,
      duplicate_id: duplicate?.id || null,
      duplicate_reason: originalMatch ? 'original URL' : slugMatch ? 'slug' : '',
      public_url: `/blog/${post.slug}/index.html`
    });
  }

  const possibleErrors = previewPosts.flatMap((post) => post.errors.map((error) => `${post.title}: ${error}`));
  return {
    filePath,
    posts: previewPosts,
    stats: {
      totalPosts: previewPosts.length,
      newPosts,
      duplicatePosts,
      postsWithImages: previewPosts.filter((post) => post.imageUrls.length > 0).length,
      possibleErrors: possibleErrors.length
    },
    possibleErrors
  };
}

function toMysqlDate(value, fallback = null) {
  const date = value ? new Date(value) : fallback;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date;
}

async function insertImportedPost(post, sortOrder) {
  const pool = getPool();
  const uniqueSlug = await ensureUniqueSlug(post.slug);
  const [result] = await pool.query(
    `INSERT INTO blog_posts
      (title, slug, category, author_name, card_label, excerpt, content_html,
       featured_image, featured_image_alt, meta_title, meta_description, original_url,
       status, sort_order, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, NOW(), ?)`,
    [
      post.title,
      uniqueSlug,
      post.category,
      post.author_name,
      post.card_label || null,
      post.excerpt,
      post.content_html,
      post.featured_image || '/assests/hero-bg.jpg',
      post.title,
      post.meta_title,
      post.meta_description,
      post.original_url || null,
      sortOrder,
      toMysqlDate(post.published_at, new Date()),
      toMysqlDate(post.updated_at, new Date())
    ]
  );
  return result.insertId;
}

async function importBloggerFeed(filePath, mode = 'new_only') {
  const preview = await buildImportPreview(filePath);
  const summary = { imported: 0, updated: 0, skipped: 0, failed: 0, imageDownloadFailed: 0, errors: [] };
  let nextSortOrder = await getNextSortOrder();

  for (const rawPost of preview.posts) {
    try {
      const existing = rawPost.original_url
        ? await getPostByOriginalUrl(rawPost.original_url)
        : null;
      const slugExisting = existing ? null : await getPostBySlug(rawPost.slug, { publishedOnly: false });
      const duplicate = existing || slugExisting;

      if (duplicate && mode === 'skip_duplicates') {
        summary.skipped += 1;
        continue;
      }
      if (duplicate && mode === 'new_only') {
        summary.skipped += 1;
        continue;
      }

      const rewritten = await downloadAndRewriteImages(rawPost.content_html, rawPost.slug);
      summary.imageDownloadFailed += rewritten.failures.length;
      rewritten.failures.forEach((failure) => summary.errors.push(`${rawPost.title}: ${failure.url} - ${failure.error}`));

      const featuredImage = rewritten.localImages[0] || rawPost.featured_image || '/assests/hero-bg.jpg';
      const post = {
        ...rawPost,
        content_html: sanitizeContentHtml(rewritten.contentHtml),
        featured_image: featuredImage,
        excerpt: rawPost.excerpt || makeExcerpt(rewritten.contentHtml),
        meta_description: makeMetaDescription(rewritten.contentHtml)
      };

      if (duplicate && mode === 'update_existing') {
        await updateBlogPost(duplicate.id, {
          body: {
            title: post.title,
            slug: duplicate.slug,
            category: post.category,
            author_name: post.author_name,
            card_label: duplicate.card_label,
            excerpt: post.excerpt,
            content_html: post.content_html,
            featured_image: post.featured_image,
            featured_image_alt: post.title,
            meta_title: post.meta_title,
            meta_description: post.meta_description,
            original_url: post.original_url,
            status: 'published',
            sort_order: duplicate.sort_order,
            published_at: post.published_at
          }
        });
        summary.updated += 1;
      } else {
        await insertImportedPost(post, nextSortOrder);
        summary.imported += 1;
        nextSortOrder += 1;
      }
    } catch (error) {
      summary.failed += 1;
      summary.errors.push(`${rawPost.title || 'Untitled'}: ${error.message}`);
    }
  }

  await syncStaticBlogPages();
  return summary;
}

module.exports = {
  IMPORT_UPLOAD_ROOT,
  buildImportPreview,
  importBloggerFeed,
  parseBloggerFeed
};
