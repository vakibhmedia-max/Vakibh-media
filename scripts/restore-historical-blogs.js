require('dotenv').config();

const { execFileSync } = require('child_process');
const path = require('path');

const { getPool, initPool } = require('../backend/lib/db');
const { sanitizeContentHtml, syncStaticBlogPages } = require('../backend/lib/blogs');
const { htmlPreviewText, stripHtml } = require('../backend/lib/utils');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SOURCE_REVISION = process.env.BLOG_RESTORE_REVISION || 'c4be4fd15';
const BLOG_PREFIX = 'Vakibh-media/blog/';
const CURRENT_SEED_SLUGS = new Set([
  'namasmaran-mahatva',
  'abhang-vachan-man-sthir',
  'digital-sant-sahitya-jatan'
]);

function git(...args) {
  return execFileSync('git', args, {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  });
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .trim();
}

function firstMatch(value, regex) {
  const match = String(value || '').match(regex);
  return match ? match[1].trim() : '';
}

function parseCards(indexHtml) {
  const cards = new Map();
  const cardRegex = /<article class="arrival-card blog-card"[^>]*>([\s\S]*?)<\/article>/gi;
  let match;

  while ((match = cardRegex.exec(indexHtml))) {
    const html = match[1];
    const href = firstMatch(html, /<h2 class="arrival-title">[\s\S]*?<a href="([^"/]+)\/index\.html"/i);
    if (!href) continue;

    cards.set(decodeEntities(href), {
      category: decodeEntities(firstMatch(html, /<span class="arrival-tag">([\s\S]*?)<\/span>/i)),
      cardLabel: decodeEntities(firstMatch(html, /<span class="arrival-date">([\s\S]*?)<\/span>/i)),
      author: decodeEntities(firstMatch(html, /<p class="arrival-author">([\s\S]*?)<\/p>/i)),
      excerpt: decodeEntities(stripHtml(firstMatch(html, /<p class="arrival-excerpt">([\s\S]*?)<\/p>/i)))
    });
  }

  return cards;
}

function historicalPostPaths() {
  return git('-c', 'core.quotePath=false', 'ls-tree', '-r', '--name-only', SOURCE_REVISION, '--', `${BLOG_PREFIX}`)
    .split(/\r?\n/)
    .filter((file) => file.endsWith('/index.html') && file !== `${BLOG_PREFIX}index.html`)
    .filter((file) => !CURRENT_SEED_SLUGS.has(file.slice(BLOG_PREFIX.length, -'/index.html'.length)));
}

function parsePost(file, cards, order) {
  const slug = file.slice(BLOG_PREFIX.length, -'/index.html'.length);
  const html = git('show', `${SOURCE_REVISION}:${file}`);
  const card = cards.get(slug) || {};
  const title = decodeEntities(stripHtml(firstMatch(html, /<h1 class="post-title"[^>]*>([\s\S]*?)<\/h1>/i)));
  const rawContent = firstMatch(html, /<div class="post-content">([\s\S]*?)<\/div>\s*<\/article>/i);
  const content = sanitizeContentHtml(rawContent);
  const image = decodeEntities(firstMatch(html, /<article class="post-article"[\s\S]*?<img src="([^"]+)"/i));
  const description = decodeEntities(firstMatch(html, /<meta name="description" content="([^"]*)"/i));

  if (!title || !content) throw new Error(`Could not parse ${file}`);

  return {
    title,
    slug,
    category: card.category || 'Blogger Import',
    author: card.author || 'Vaakib - वाकीभ',
    cardLabel: card.cardLabel || `लेख ${order + 4}`,
    excerpt: card.excerpt || htmlPreviewText(content, 220),
    content,
    image: image || '/assests/hero-bg.jpg',
    description: description || htmlPreviewText(content, 150),
    sortOrder: order + 4,
    publishedAt: new Date(Date.UTC(2026, 6, 1 - order))
  };
}

async function restorePost(post) {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO blog_posts
      (title, slug, category, author_name, card_label, excerpt, content_html,
       featured_image, featured_image_alt, meta_title, meta_description, original_url,
       status, sort_order, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'published', ?, ?)
     ON DUPLICATE KEY UPDATE
       title = VALUES(title), category = VALUES(category), author_name = VALUES(author_name),
       card_label = VALUES(card_label), excerpt = VALUES(excerpt), content_html = VALUES(content_html),
       featured_image = VALUES(featured_image), featured_image_alt = VALUES(featured_image_alt),
       meta_title = VALUES(meta_title), meta_description = VALUES(meta_description),
       status = 'published', sort_order = VALUES(sort_order), published_at = VALUES(published_at)`,
    [
      post.title, post.slug, post.category, post.author, post.cardLabel, post.excerpt,
      post.content, post.image, post.title, post.title, post.description,
      post.sortOrder, post.publishedAt
    ]
  );

  return result.affectedRows === 1 ? 'inserted' : 'updated';
}

async function main() {
  await initPool();
  const indexHtml = git('show', `${SOURCE_REVISION}:${BLOG_PREFIX}index.html`);
  const cards = parseCards(indexHtml);
  const posts = historicalPostPaths().map((file, index) => parsePost(file, cards, index));
  const summary = { inserted: 0, updated: 0 };

  for (const post of posts) {
    const action = await restorePost(post);
    summary[action] += 1;
  }

  await syncStaticBlogPages();
  console.log(`Historical blogs restored: ${summary.inserted} inserted, ${summary.updated} updated.`);
  console.log(`Published blog total: ${(await getPool().query("SELECT COUNT(*) AS total FROM blog_posts WHERE status = 'published'"))[0][0].total}`);
  await getPool().end();
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
