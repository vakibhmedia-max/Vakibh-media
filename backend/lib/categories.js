const { getPool } = require('./db');

const DEFAULT_CATEGORIES = [
  'संत साहित्य',
  'अभंग वाचन',
  'नामस्मरण',
  'वारकरी परंपरा',
  'आध्यात्मिक विचार',
  'डिजिटल संत साहित्य'
];

function categorySlug(name) {
  return Buffer.from(String(name || '').trim(), 'utf8').toString('hex').slice(0, 180);
}

function inferBlogCategory(...parts) {
  const text = parts.map((part) => String(part || '')).join(' ');
  if (/डिजिटल|ऑनलाइन|वेबसाइट/i.test(text)) return 'डिजिटल संत साहित्य';
  if (/अभंग/i.test(text)) return 'अभंग वाचन';
  if (/नामस्मरण|नामजप|नाम घ्या|नामाचे/i.test(text)) return 'नामस्मरण';
  if (/वारी|वारकरी|पंढरपूर|रिंगण|पालखी|विठ्ठल/i.test(text)) return 'वारकरी परंपरा';
  if (/आध्यात्म|मन|भक्ती|ध्यान|साधना/i.test(text)) return 'आध्यात्मिक विचार';
  return 'संत साहित्य';
}

async function seedDefaultCategories() {
  const pool = getPool();
  const [existing] = await pool.query('SELECT COUNT(*) AS total FROM blog_categories');
  if (Number(existing[0]?.total || 0) > 0) return;

  for (let index = 0; index < DEFAULT_CATEGORIES.length; index += 1) {
    const name = DEFAULT_CATEGORIES[index];
    await pool.query(
      `INSERT INTO blog_categories (name, slug, is_default, sort_order)
       VALUES (?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE is_default = 1, sort_order = VALUES(sort_order)`,
      [name, categorySlug(name), index + 1]
    );
  }
}

async function listCategories() {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT id, name, slug, is_default, sort_order, created_at FROM blog_categories ORDER BY sort_order ASC, name ASC'
  );
  return rows;
}

async function createCategory(name) {
  const value = String(name || '').replace(/\s+/g, ' ').trim();
  if (!value) throw new Error('Category name आवश्यक आहे.');
  if (value.length > 120) throw new Error('Category name 120 अक्षरांपेक्षा लहान असावे.');
  const pool = getPool();
  const [orderRows] = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM blog_categories');
  try {
    await pool.query(
      'INSERT INTO blog_categories (name, slug, is_default, sort_order) VALUES (?, ?, 0, ?)',
      [value, categorySlug(value), orderRows[0]?.next_order || 1]
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw new Error('ही category आधीपासून उपलब्ध आहे.');
    throw error;
  }
}

async function deleteCategory(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM blog_categories WHERE id = ? LIMIT 1', [id]);
  const category = rows[0];
  if (!category) return false;
  const [usage] = await pool.query('SELECT COUNT(*) AS total FROM blog_posts WHERE category = ?', [category.name]);
  if (Number(usage[0]?.total || 0) > 0) throw new Error('ही category blog posts मध्ये वापरली आहे; आधी त्या posts ची category बदला.');
  await pool.query('DELETE FROM blog_categories WHERE id = ?', [id]);
  return true;
}

async function assignDefaultCategoriesToImportedPosts() {
  const pool = getPool();
  await pool.query(
    `UPDATE blog_posts
     SET category = CASE
       WHEN category = 'अभंग चिंतन' THEN 'अभंग वाचन'
       WHEN category = 'डिजिटल जतन' THEN 'डिजिटल संत साहित्य'
       ELSE category
     END
     WHERE category IN ('अभंग चिंतन', 'डिजिटल जतन')`
  );
  await pool.query(
    `UPDATE blog_posts
     SET category = CASE
       WHEN CONCAT_WS(' ', title, excerpt, content_html) REGEXP 'डिजिटल|ऑनलाइन|वेबसाइट' THEN 'डिजिटल संत साहित्य'
       WHEN CONCAT_WS(' ', title, excerpt, content_html) REGEXP 'अभंग' THEN 'अभंग वाचन'
       WHEN CONCAT_WS(' ', title, excerpt, content_html) REGEXP 'नामस्मरण|नामजप|नाम घ्या|नामाचे' THEN 'नामस्मरण'
       WHEN CONCAT_WS(' ', title, excerpt, content_html) REGEXP 'वारी|वारकरी|पंढरपूर|रिंगण|पालखी|विठ्ठल' THEN 'वारकरी परंपरा'
       WHEN CONCAT_WS(' ', title, excerpt, content_html) REGEXP 'आध्यात्म|मन|भक्ती|ध्यान|साधना' THEN 'आध्यात्मिक विचार'
       ELSE 'संत साहित्य'
     END
     WHERE category IN ('Blogger Import', 'वाकीभ ब्लॉग', '') OR category IS NULL`
  );
}

module.exports = {
  DEFAULT_CATEGORIES,
  assignDefaultCategoriesToImportedPosts,
  createCategory,
  deleteCategory,
  inferBlogCategory,
  listCategories,
  seedDefaultCategories
};
