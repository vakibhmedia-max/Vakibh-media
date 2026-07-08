const bcrypt = require('bcryptjs');
const { getPool } = require('./db');
const { seedStaticBlogPosts } = require('./blogs');

const TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS admin_users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL DEFAULT 'वाकीभ प्रशासक',
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor') NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_users_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS blog_posts (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    category VARCHAR(120) NOT NULL DEFAULT 'वाकीभ ब्लॉग',
    author_name VARCHAR(120) NOT NULL DEFAULT 'वाकीभ संपादकीय मंडळ',
    card_label VARCHAR(120) DEFAULT NULL,
    excerpt TEXT NOT NULL,
    content_html MEDIUMTEXT NOT NULL,
    featured_image VARCHAR(500) NOT NULL DEFAULT '/assests/hero-bg.jpg',
    featured_image_alt VARCHAR(255) NOT NULL DEFAULT '',
    meta_description VARCHAR(500) DEFAULT NULL,
    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    sort_order INT NOT NULL DEFAULT 0,
    is_protected TINYINT(1) NOT NULL DEFAULT 0,
    published_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_blog_posts_slug (slug),
    KEY idx_blog_posts_status_sort (status, sort_order),
    KEY idx_blog_posts_published_at (published_at),
    KEY idx_blog_posts_updated_at (updated_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

async function ensureSchema() {
  const pool = getPool();
  for (const statement of TABLE_STATEMENTS) {
    await pool.query(statement);
  }
}

async function ensureBlogPostProtectionColumn() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'blog_posts'
       AND column_name = 'is_protected'`
  );

  if (Number(rows[0]?.total || 0) > 0) return;

  await pool.query(
    `ALTER TABLE blog_posts
     ADD COLUMN is_protected TINYINT(1) NOT NULL DEFAULT 0 AFTER sort_order`
  );
}

async function seedDefaultAdmin() {
  const pool = getPool();
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM admin_users');
  if (Number(rows[0]?.total || 0) > 0) return;

  const email = process.env.ADMIN_EMAIL || 'admin@vakibh.local';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const name = process.env.ADMIN_NAME || 'वाकीभ प्रशासक';
  const role = 'admin';

  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO admin_users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
}

async function bootstrapDatabase() {
  await ensureSchema();
  await ensureBlogPostProtectionColumn();
  await seedDefaultAdmin();
  await seedStaticBlogPosts();
}

module.exports = {
  bootstrapDatabase
};
