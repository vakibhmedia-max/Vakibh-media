const bcrypt = require('bcryptjs');
const { getPool } = require('./db');
const { seedStaticBlogPosts } = require('./blogs');
const { syncStaticBlogPages } = require('./blogs');
const { assignDefaultCategoriesToImportedPosts, seedDefaultCategories } = require('./categories');

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
  `CREATE TABLE IF NOT EXISTS visitors (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME DEFAULT NULL,
    login_count INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_visitors_phone (phone),
    KEY idx_visitors_last_login_at (last_login_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS visitor_login_logs (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    visitor_id INT UNSIGNED NOT NULL,
    phone VARCHAR(20) NOT NULL,
    login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(64) DEFAULT NULL,
    user_agent VARCHAR(500) DEFAULT NULL,
    device_type VARCHAR(40) DEFAULT NULL,
    browser VARCHAR(80) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_visitor_login_logs_visitor_time (visitor_id, login_time),
    KEY idx_visitor_login_logs_phone (phone),
    KEY idx_visitor_login_logs_login_time (login_time),
    CONSTRAINT fk_visitor_login_logs_visitor
      FOREIGN KEY (visitor_id) REFERENCES visitors(id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS otp_verifications (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    phone VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    verified TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_otp_verifications_phone_created (phone, created_at),
    KEY idx_otp_verifications_expires (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS blog_categories (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(191) NOT NULL,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_blog_categories_name (name),
    UNIQUE KEY uq_blog_categories_slug (slug),
    KEY idx_blog_categories_sort (sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS blog_posts (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    category VARCHAR(120) NOT NULL DEFAULT 'संत साहित्य',
    author_name VARCHAR(120) NOT NULL DEFAULT 'वाकीभ संपादकीय मंडळ',
    card_label VARCHAR(120) DEFAULT NULL,
    excerpt TEXT NOT NULL,
    content_html MEDIUMTEXT NOT NULL,
    featured_image VARCHAR(500) NOT NULL DEFAULT '/assests/hero-bg.jpg',
    featured_image_alt VARCHAR(255) NOT NULL DEFAULT '',
    meta_title VARCHAR(255) DEFAULT NULL,
    meta_description VARCHAR(500) DEFAULT NULL,
    original_url VARCHAR(500) DEFAULT NULL,
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
    KEY idx_blog_posts_original_url (original_url),
    KEY idx_blog_posts_updated_at (updated_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  ,
  `CREATE TABLE IF NOT EXISTS blog_comments (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    post_id INT UNSIGNED DEFAULT NULL,
    post_slug VARCHAR(255) NOT NULL,
    author_name VARCHAR(120) NOT NULL,
    author_contact VARCHAR(191) DEFAULT NULL,
    comment_text TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    ip_address VARCHAR(64) DEFAULT NULL,
    user_agent VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_blog_comments_post_status (post_slug, status, created_at),
    KEY idx_blog_comments_status_created (status, created_at),
    CONSTRAINT fk_blog_comments_post
      FOREIGN KEY (post_id) REFERENCES blog_posts(id)
      ON DELETE SET NULL
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

async function ensureBlogPostImportColumns() {
  const pool = getPool();
  const columns = [
    { name: 'meta_title', sql: 'ADD COLUMN meta_title VARCHAR(255) DEFAULT NULL AFTER featured_image_alt' },
    { name: 'original_url', sql: 'ADD COLUMN original_url VARCHAR(500) DEFAULT NULL AFTER meta_description' }
  ];

  for (const column of columns) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'blog_posts'
         AND column_name = ?`,
      [column.name]
    );

    if (Number(rows[0]?.total || 0) === 0) {
      await pool.query(`ALTER TABLE blog_posts ${column.sql}`);
    }
  }

  const [indexes] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'blog_posts'
       AND index_name = 'idx_blog_posts_original_url'`
  );

  if (Number(indexes[0]?.total || 0) === 0) {
    await pool.query('ALTER TABLE blog_posts ADD KEY idx_blog_posts_original_url (original_url)');
  }
}

async function ensureBlogCategoryDefault() {
  const pool = getPool();
  await pool.query(
    "ALTER TABLE blog_posts MODIFY category VARCHAR(120) NOT NULL DEFAULT 'संत साहित्य'"
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
  await ensureBlogPostImportColumns();
  await ensureBlogCategoryDefault();
  await seedDefaultAdmin();
  await seedDefaultCategories();
  await assignDefaultCategoriesToImportedPosts();

  try {
    await seedStaticBlogPosts();
    await syncStaticBlogPages();
  } catch (error) {
    console.warn('Static blog sync skipped during bootstrap:', error.message || error);
  }
}

module.exports = {
  bootstrapDatabase
};


