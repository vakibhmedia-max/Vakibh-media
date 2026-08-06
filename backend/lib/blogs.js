const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');
const { getPool } = require('./db');
const { renderPage } = require('./render');
const {
  ensureLeadingSlash,
  formatDate,
  htmlPreviewText,
  normalizeSlug,
  stripHtml
} = require('./utils');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SITE_ROOT = path.join(PROJECT_ROOT, 'Vakibh-media');
const BLOG_INDEX_PATH = path.join(SITE_ROOT, 'blog', 'index.html');
const BLOG_ROOT_PATH = path.join(SITE_ROOT, 'blog');
const STATIC_BLOG_INDEX_TEMPLATE = 'static/blog-index.ejs';
const STATIC_BLOG_POST_TEMPLATE = 'static/blog-post.ejs';
const STATIC_BLOG_LAYOUT = 'static-blog';
const IS_VERCEL = process.env.VERCEL === '1';

const SANITIZE_OPTIONS = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
    'div',
    'span',
    'hr',
    'code',
    'pre'
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    div: ['class'],
    span: ['class'],
    code: ['class'],
    pre: ['class']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      target: '_blank',
      rel: 'noopener noreferrer'
    })
  }
};

const STATIC_SEED_POSTS = [
  { slug: 'namasmaran-mahatva', index: 1 },
  { slug: 'abhang-vachan-man-sthir', index: 2 },
  { slug: 'digital-sant-sahitya-jatan', index: 3 }
];

function readFileUtf8(relativePath) {
  return fs.readFileSync(path.join(SITE_ROOT, relativePath), 'utf8');
}

function extractFirstMatch(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

function normalizeAssetUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('/')) {
    return raw;
  }
  return ensureLeadingSlash(raw.replace(/^\.\.\//, '').replace(/^\.\/+/, ''));
}

function decodeImageUrl(value) {
  const decoded = String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&#38;/g, '&')
    .trim();

  if (/^https?:\/\//i.test(decoded) || decoded.startsWith('data:')) return decoded;
  return decoded.replace(/^(?:(?:\.\.\/|\.\/|\/))+/, '');
}

function removeDuplicateFeaturedImage(contentHtml, featuredImage) {
  const html = String(contentHtml || '');
  const featuredUrl = decodeImageUrl(featuredImage);
  if (!html || !featuredUrl) return html;

  const imageMatch = html.match(/<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/i);
  if (!imageMatch) return html;

  const imageUrl = decodeImageUrl(imageMatch[1] || imageMatch[2]);
  if (imageUrl !== featuredUrl) return html;

  const imageStart = imageMatch.index;
  const imageEnd = imageStart + imageMatch[0].length;
  const paragraphStart = html.lastIndexOf('<p', imageStart);
  const previousParagraphEnd = html.lastIndexOf('</p>', imageStart);
  const paragraphEnd = html.indexOf('</p>', imageEnd);

  if (paragraphStart > previousParagraphEnd && paragraphEnd !== -1) {
    const paragraph = html.slice(paragraphStart, paragraphEnd + 4);
    const withoutImage = paragraph.replace(imageMatch[0], '');
    if (!stripHtml(withoutImage).replace(/[\u200B-\u200D\uFEFF]/g, '').trim()) {
      return html.slice(0, paragraphStart) + html.slice(paragraphEnd + 4);
    }
  }

  return html.slice(0, imageStart) + html.slice(imageEnd);
}

function toStaticAssetUrl(value, depth = 1) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(?:https?:)?\/\//i.test(raw) || raw.startsWith('data:')) {
    return raw;
  }
  if (raw.startsWith('../') || raw.startsWith('./')) {
    return raw;
  }

  const prefix = '../'.repeat(Math.max(1, depth));
  return raw.startsWith('/') ? `${prefix}${raw.slice(1)}` : `${prefix}${raw}`;
}

function toStaticBlogUrl(slug, depth = 1) {
  const prefix = '../'.repeat(Math.max(1, depth));
  return `${prefix}${slug}/index.html`;
}

async function writeHtmlFile(filePath, html) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  const normalizedHtml = String(html || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+$/gm, '');
  await fs.promises.writeFile(filePath, normalizedHtml, 'utf8');
}

async function removeStaticBlogDirectory(slug) {
  await fs.promises.rm(path.join(BLOG_ROOT_PATH, slug), {
    recursive: true,
    force: true
  });
}

async function renderStaticBlogIndex(posts) {
  const html = await renderPage(
    STATIC_BLOG_INDEX_TEMPLATE,
    {
      title: 'वाकीभ ब्लॉग - संत साहित्यावरील निवडक लेख',
      description:
        'वाकीभ ब्लॉगमध्ये संत साहित्य, नामस्मरण, अभंग वाचन आणि वारकरी परंपरेतील निवडक मराठी लेख वाचा.',
      posts: posts.map((post) => ({
        ...post,
        featured_image: toStaticAssetUrl(post.featured_image, 1),
        public_url: toStaticBlogUrl(post.slug, 1)
      })),
      siteRootHref: '..',
      bodyClass: 'blog-page',
      extraHead: `
  <style>
    .blog-card-media {
      width: 100%;
      height: 220px;
      overflow: hidden;
      border-radius: 22px 22px 0 0;
      margin-bottom: 1.2rem;
    }

    .blog-card-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  </style>`
    },
    STATIC_BLOG_LAYOUT
  );

  await writeHtmlFile(BLOG_INDEX_PATH, html);
}

async function renderStaticBlogPosts(posts) {
  await fs.promises.mkdir(BLOG_ROOT_PATH, { recursive: true });
  const publishedSlugs = new Set(posts.map((post) => post.slug));

  const entries = await fs.promises.readdir(BLOG_ROOT_PATH, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && !publishedSlugs.has(entry.name))
      .map((entry) => removeStaticBlogDirectory(entry.name))
  );

  await Promise.all(
    posts.map(async (post) => {
      const html = await renderPage(
        STATIC_BLOG_POST_TEMPLATE,
        {
          title: `${post.title} - वाकीभ ब्लॉग`,
          description: post.meta_description || post.excerpt || '',
          post: {
            ...post,
            featured_image: toStaticAssetUrl(post.featured_image, 2),
            content_html: removeDuplicateFeaturedImage(post.content_html, post.featured_image),
            published_label: formatDate(post.published_at),
            public_url: toStaticBlogUrl(post.slug, 2)
          },
          siteRootHref: '../..',
          blogIndexHref: '../index.html',
          bodyClass: 'blog-post-page',
          bodyStyle: 'background-color: #fcfaf5; color: #333;'
        },
        STATIC_BLOG_LAYOUT
      );

      await writeHtmlFile(path.join(BLOG_ROOT_PATH, post.slug, 'index.html'), html);
    })
  );
}

async function syncStaticBlogPages() {
  const posts = await listPublishedPosts();
  await renderStaticBlogIndex(posts);
  await renderStaticBlogPosts(posts);
}

async function syncStaticBlogIndex() {
  const posts = await listPublishedPosts();
  await renderStaticBlogIndex(posts);
}

function extractSeedCard(listHtml, index) {
  const cardRegex = new RegExp(
    `<article class="arrival-card blog-card" id="blog-${index}">([\\s\\S]*?)<\\/article>`,
    'i'
  );
  const cardHtml = extractFirstMatch(listHtml, cardRegex);

  return {
    title: extractFirstMatch(cardHtml, /<h2 class="arrival-title"><a[^>]*>([\s\S]*?)<\/a><\/h2>/i),
    tag: extractFirstMatch(cardHtml, /<span class="arrival-tag">([\s\S]*?)<\/span>/i),
    cardLabel: extractFirstMatch(cardHtml, /<span class="arrival-date">([\s\S]*?)<\/span>/i),
    author: extractFirstMatch(cardHtml, /<p class="arrival-author">([\s\S]*?)<\/p>/i),
    excerpt: extractFirstMatch(cardHtml, /<p class="arrival-excerpt">([\s\S]*?)<\/p>/i),
    image: normalizeAssetUrl(extractFirstMatch(cardHtml, /<img src="([^"]+)"/i))
  };
}

function extractDetailPayload(detailHtml) {
  const title = extractFirstMatch(detailHtml, /<h1 class="post-title"[^>]*>([\s\S]*?)<\/h1>/i);
  const category = extractFirstMatch(
    detailHtml,
    /<a href="\.\.\/index\.html" class="post-category-link">([\s\S]*?)<\/a>/i
  );
  const description = extractFirstMatch(detailHtml, /<meta name="description" content="([^"]*)"/i);
  const contentHtml = extractFirstMatch(
    detailHtml,
    /<div class="post-content">([\s\S]*?)<\/div>\s*<\/article>/i
  );

  return {
    title,
    category,
    description,
    contentHtml
  };
}

function normalizeRow(row) {
  if (!row) return null;

  const cardLabel = row.card_label || (row.sort_order ? `लेख ${row.sort_order}` : '');

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category || 'संत साहित्य',
    author_name: row.author_name || 'वाकीभ संपादकीय मंडळ',
    card_label: cardLabel,
    excerpt: row.excerpt || '',
    content_html: row.content_html || '',
    featured_image: normalizeAssetUrl(row.featured_image) || '/assests/hero-bg.jpg',
    featured_image_alt: row.featured_image_alt || row.title || '',
    meta_title: row.meta_title || row.title || '',
    meta_description: row.meta_description || row.excerpt || '',
    original_url: row.original_url || '',
    status: row.status,
    sort_order: row.sort_order,
    published_at: row.published_at,
    is_protected: Number(row.is_protected || 0) === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
    public_url: `/blog/${row.slug}/index.html`
  };
}

function sanitizeContentHtml(input) {
  return sanitizeHtml(String(input || ''), SANITIZE_OPTIONS).trim();
}

function buildPostPayload({ body = {}, filePath = '', existingPost = null } = {}) {
  const title = String(body.title || '').trim();
  const rawSlug = String(body.slug || '').trim();
  const normalizedSlug = normalizeSlug(rawSlug);
  const slug =
    normalizedSlug ||
    existingPost?.slug ||
    `post-${Date.now().toString(36)}`;
  const category = String(body.category || 'संत साहित्य').trim() || 'संत साहित्य';
  const author_name =
    String(body.author_name || 'वाकीभ संपादकीय मंडळ').trim() || 'वाकीभ संपादकीय मंडळ';
  const content_html = sanitizeContentHtml(body.content_html || '');
  const excerptFallback = htmlPreviewText(content_html, 220);
  const excerpt = String(body.excerpt || '').trim() || excerptFallback;
  const meta_title = String(body.meta_title || '').trim() || title;
  const meta_description = String(body.meta_description || '').trim() || excerpt;
  const original_url = String(body.original_url || existingPost?.original_url || '').trim();
  const status = body.status === 'draft' ? 'draft' : 'published';
  const sort_order_input = Number.parseInt(body.sort_order, 10);
  const sort_order = Number.isFinite(sort_order_input)
    ? sort_order_input
    : (existingPost?.sort_order || 0);
  const uploadedImage = String(filePath || '').trim();
  const imageInput = String(body.featured_image || '').trim();
  const featured_image =
    normalizeAssetUrl(uploadedImage) ||
    normalizeAssetUrl(imageInput) ||
    normalizeAssetUrl(existingPost?.featured_image) ||
    '/assests/hero-bg.jpg';
  const featured_image_alt =
    String(body.featured_image_alt || '').trim() || title || 'वाकीभ ब्लॉग प्रतिमा';
  const card_label_input = String(body.card_label || '').trim();
  const card_label = card_label_input || (sort_order ? `लेख ${sort_order}` : '');
  const publishedAtInput = String(body.published_at || '').trim();
  const published_at = publishedAtInput
    ? new Date(publishedAtInput)
    : status === 'published'
      ? existingPost?.published_at || new Date()
      : existingPost?.published_at || null;

  const validationErrors = [];
  if (!title) validationErrors.push('लेखाचे शीर्षक आवश्यक आहे.');
  if (!content_html) validationErrors.push('लेखाचा मजकूर आवश्यक आहे.');
  if (!excerpt) validationErrors.push('Excerpt आवश्यक आहे.');

  return {
    validationErrors,
    payload: {
      title,
      slug,
      category,
      author_name,
      card_label,
      excerpt,
      content_html,
      featured_image,
      featured_image_alt,
      meta_title,
      meta_description,
      original_url,
      status,
      sort_order,
      published_at
    }
  };
}

function deleteManagedUpload(publicUrl) {
  const normalized = String(publicUrl || '').trim();
  if (!normalized.startsWith('/uploads/')) return;

  const diskPath = path.join(PROJECT_ROOT, normalized.replace(/^\//, ''));
  if (fs.existsSync(diskPath)) {
    fs.unlinkSync(diskPath);
  }
}

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  const pool = getPool();
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const params = excludeId
      ? [candidate, excludeId]
      : [candidate];

    const [rows] = await pool.query(
      `SELECT id FROM blog_posts
       WHERE slug = ?${excludeId ? ' AND id <> ?' : ''}
       LIMIT 1`,
      params
    );

    if (!rows.length) return candidate;
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function getNextSortOrder() {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order FROM blog_posts'
  );
  return rows[0]?.next_sort_order || 1;
}

async function listPublishedPosts() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM blog_posts
     WHERE status = 'published'
     ORDER BY COALESCE(published_at, created_at) DESC, id DESC`
  );
  return rows.map(normalizeRow);
}

async function listAllPosts() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM blog_posts
     ORDER BY sort_order ASC, updated_at DESC, id DESC`
  );
  return rows.map(normalizeRow);
}

async function getPostById(id) {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT * FROM blog_posts WHERE id = ? LIMIT 1',
    [id]
  );
  return normalizeRow(rows[0] || null);
}

async function getPostByOriginalUrl(originalUrl) {
  const pool = getPool();
  const value = String(originalUrl || '').trim();
  if (!value) return null;
  const [rows] = await pool.query('SELECT * FROM blog_posts WHERE original_url = ? LIMIT 1', [value]);
  return normalizeRow(rows[0] || null);
}

async function getPostBySlug(slug, { publishedOnly = true } = {}) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM blog_posts
     WHERE slug = ?${publishedOnly ? " AND status = 'published'" : ''}
     LIMIT 1`,
    [slug]
  );
  return normalizeRow(rows[0] || null);
}

async function getDashboardStats() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total_posts,
       SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_posts,
       SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_posts,
       MAX(updated_at) AS last_updated
     FROM blog_posts`
  );
  return rows[0] || {
    total_posts: 0,
    published_posts: 0,
    draft_posts: 0,
    last_updated: null
  };
}

async function getRecentPosts(limit = 5) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM blog_posts
     ORDER BY updated_at DESC, id DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map(normalizeRow);
}

async function createBlogPost(input) {
  const pool = getPool();
  const { validationErrors, payload } = buildPostPayload(input);
  if (validationErrors.length) {
    const error = new Error(validationErrors.join(' '));
    error.validationErrors = validationErrors;
    throw error;
  }

  const uniqueSlug = await ensureUniqueSlug(payload.slug);
  const [result] = await pool.query(
    `INSERT INTO blog_posts
      (title, slug, category, author_name, card_label, excerpt, content_html,
       featured_image, featured_image_alt, meta_title, meta_description, original_url, status, sort_order, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.title,
      uniqueSlug,
      payload.category,
      payload.author_name,
      payload.card_label,
      payload.excerpt,
      payload.content_html,
      payload.featured_image,
      payload.featured_image_alt,
      payload.meta_title,
      payload.meta_description,
      payload.original_url,
      payload.status,
      payload.sort_order,
      payload.published_at
    ]
  );

  const post = await getPostById(result.insertId);
  await syncStaticBlogPages();
  return post;
}

async function updateBlogPost(id, input) {
  const pool = getPool();
  const existingPost = await getPostById(id);
  if (!existingPost) {
    const error = new Error('Post not found.');
    error.statusCode = 404;
    throw error;
  }

  const { validationErrors, payload } = buildPostPayload({
    ...input,
    existingPost
  });

  if (validationErrors.length) {
    const error = new Error(validationErrors.join(' '));
    error.validationErrors = validationErrors;
    throw error;
  }

  const uniqueSlug =
    payload.slug === existingPost.slug
      ? payload.slug
      : await ensureUniqueSlug(payload.slug, id);

  await pool.query(
    `UPDATE blog_posts
     SET title = ?,
         slug = ?,
         category = ?,
         author_name = ?,
         card_label = ?,
         excerpt = ?,
         content_html = ?,
         featured_image = ?,
         featured_image_alt = ?,
         meta_title = ?,
         meta_description = ?,
         original_url = ?,
         status = ?,
         sort_order = ?,
         published_at = ?
     WHERE id = ?`,
    [
      payload.title,
      uniqueSlug,
      payload.category,
      payload.author_name,
      payload.card_label,
      payload.excerpt,
      payload.content_html,
      payload.featured_image,
      payload.featured_image_alt,
      payload.meta_title,
      payload.meta_description,
      payload.original_url,
      payload.status,
      payload.sort_order,
      payload.published_at,
      id
    ]
  );

  if (payload.featured_image !== existingPost.featured_image) {
    deleteManagedUpload(existingPost.featured_image);
  }

  const updatedPost = await getPostById(id);
  await syncStaticBlogPages();
  return updatedPost;
}

async function deleteBlogPost(id) {
  const pool = getPool();
  const existingPost = await getPostById(id);
  if (!existingPost) return false;

  await pool.query('DELETE FROM blog_posts WHERE id = ?', [id]);
  deleteManagedUpload(existingPost.featured_image);
  await syncStaticBlogPages();
  return true;
}

async function seedStaticBlogPosts() {
  const pool = getPool();

  if (!fs.existsSync(BLOG_INDEX_PATH)) return;

  const listHtml = readFileUtf8(path.join('blog', 'index.html'));
  const seededAt = Date.now();

  for (let index = 0; index < STATIC_SEED_POSTS.length; index += 1) {
    const seed = STATIC_SEED_POSTS[index];
    const card = extractSeedCard(listHtml, seed.index);
    const detailHtmlPath = path.join('blog', seed.slug, 'index.html');
    const fullDetailPath = path.join(SITE_ROOT, detailHtmlPath);

    if (!fs.existsSync(fullDetailPath)) {
      await pool.query(
        'UPDATE blog_posts SET is_protected = 1 WHERE slug = ?',
        [seed.slug]
      );
      continue;
    }

    const detailHtml = readFileUtf8(detailHtmlPath);
    const detail = extractDetailPayload(detailHtml);

    const contentHtml = detail.contentHtml || `<p>${card.excerpt}</p>`;
    const title = detail.title || card.title;

    await pool.query(
      `INSERT INTO blog_posts
        (title, slug, category, author_name, card_label, excerpt, content_html,
         featured_image, featured_image_alt,
      meta_title,
      meta_description,
      original_url,
      status, sort_order, published_at, is_protected)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'published', ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         is_protected = 1`,
      [
        title,
        seed.slug,
        card.tag || detail.category || 'संत साहित्य',
        card.author || 'वाकीभ संपादकीय मंडळ',
        card.cardLabel || `लेख ${seed.index}`,
        card.excerpt || htmlPreviewText(contentHtml, 220),
        contentHtml,
        card.image || '/assests/hero-bg.jpg',
        title,
        title,
        detail.description || card.excerpt || '',
        seed.index,
        new Date(seededAt - (STATIC_SEED_POSTS.length - index) * 86400000)
      ]
    );
  }

  await syncStaticBlogPages();
}

module.exports = {
  buildPostPayload,
  createBlogPost,
  deleteBlogPost,
  ensureUniqueSlug,
  getDashboardStats,
  getNextSortOrder,
  getPostById,
  getPostByOriginalUrl,
  getPostBySlug,
  getRecentPosts,
  listAllPosts,
  listPublishedPosts,
  normalizeRow,
  removeDuplicateFeaturedImage,
  seedStaticBlogPosts,
  sanitizeContentHtml,
  syncStaticBlogIndex,
  syncStaticBlogPages,
  updateBlogPost
};
