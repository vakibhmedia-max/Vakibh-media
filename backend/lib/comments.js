const { getPool } = require('./db');

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanMessage(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .trim()
    .slice(0, 2000);
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || '';
}

async function createBlogComment({ slug, name, contact, message, req }) {
  const pool = getPool();
  const postSlug = cleanText(slug, 255);
  const authorName = cleanText(name, 120);
  const authorContact = cleanText(contact, 191);
  const commentText = cleanMessage(message);

  if (!postSlug || !/^[a-z0-9-]+$/i.test(postSlug)) {
    const error = new Error('Invalid blog post.');
    error.statusCode = 400;
    throw error;
  }
  if (!authorName) {
    const error = new Error('Please enter your name.');
    error.statusCode = 400;
    throw error;
  }
  if (!commentText || commentText.length < 3) {
    const error = new Error('Please enter your feedback.');
    error.statusCode = 400;
    throw error;
  }

  const [posts] = await pool.query(
    "SELECT id FROM blog_posts WHERE slug = ? AND status = 'published' LIMIT 1",
    [postSlug]
  );

  if (!posts.length) {
    const error = new Error('Blog post was not found.');
    error.statusCode = 404;
    throw error;
  }

  const [result] = await pool.query(
    `INSERT INTO blog_comments
      (post_id, post_slug, author_name, author_contact, comment_text, status, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      posts[0].id,
      postSlug,
      authorName,
      authorContact || null,
      commentText,
      clientIp(req).slice(0, 64),
      String(req.headers['user-agent'] || '').slice(0, 500)
    ]
  );

  return { id: result.insertId, status: 'pending' };
}

async function listApprovedCommentsBySlug(slug) {
  const pool = getPool();
  const postSlug = cleanText(slug, 255);
  if (!postSlug || !/^[a-z0-9-]+$/i.test(postSlug)) return [];

  const [rows] = await pool.query(
    `SELECT id, author_name, comment_text, created_at
     FROM blog_comments
     WHERE post_slug = ? AND status = 'approved'
     ORDER BY created_at DESC
     LIMIT 50`,
    [postSlug]
  );

  return rows;
}

async function listComments(status = 'pending') {
  const pool = getPool();
  const allowedStatus = ['pending', 'approved', 'rejected'].includes(status) ? status : 'pending';
  const [rows] = await pool.query(
    `SELECT c.*, p.title AS post_title
     FROM blog_comments c
     LEFT JOIN blog_posts p ON p.id = c.post_id
     WHERE c.status = ?
     ORDER BY c.created_at DESC
     LIMIT 300`,
    [allowedStatus]
  );

  return rows;
}

async function getCommentStats() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total_comments,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_comments,
       SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_comments,
       SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_comments
     FROM blog_comments`
  );

  return rows[0] || {
    total_comments: 0,
    pending_comments: 0,
    approved_comments: 0,
    rejected_comments: 0
  };
}

async function updateCommentStatus(id, status) {
  const pool = getPool();
  const allowedStatus = ['pending', 'approved', 'rejected'].includes(status) ? status : '';
  if (!allowedStatus) {
    const error = new Error('Invalid comment status.');
    error.statusCode = 400;
    throw error;
  }

  await pool.query('UPDATE blog_comments SET status = ? WHERE id = ?', [allowedStatus, id]);
}

async function deleteComment(id) {
  const pool = getPool();
  await pool.query('DELETE FROM blog_comments WHERE id = ?', [id]);
}

module.exports = {
  createBlogComment,
  deleteComment,
  getCommentStats,
  listApprovedCommentsBySlug,
  listComments,
  updateCommentStatus
};
