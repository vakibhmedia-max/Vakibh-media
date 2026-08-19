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

async function createBlogComment({ slug, name, contact, mobile, email, message, req }) {
  const pool = getPool();
  const postSlug = cleanText(slug, 255);
  const authorName = cleanText(name, 120);
  const authorContact = cleanText(contact, 191);
  const authorMobile = cleanText(mobile, 20).replace(/[\s()-]/g, '');
  const authorEmail = cleanText(email, 191).toLowerCase();
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
  if (!/^[6-9]\d{9}$/.test(authorMobile)) {
    const error = new Error('Please enter a valid Indian mobile number.');
    error.statusCode = 400;
    throw error;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    const error = new Error('Please enter a valid email address.');
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
      (post_id, post_slug, author_name, author_contact, author_mobile, author_email, comment_text, status, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      posts[0].id,
      postSlug,
      authorName,
      authorContact || `${authorMobile} / ${authorEmail}`,
      authorMobile,
      authorEmail,
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
    `SELECT id, post_id, author_name, comment_text, created_at
     FROM blog_comments
     WHERE post_slug = ? AND status = 'approved'
     ORDER BY created_at DESC
     LIMIT 50`,
    [postSlug]
  );
  if (!rows.length) return [];

  const ids = rows.map((row) => row.id);
  const [replies] = await pool.query(
    `SELECT id, feedback_id, author_name, reply_text, created_at
     FROM feedback_replies
     WHERE feedback_id IN (?) AND post_slug = ? AND status = 'approved'
     ORDER BY created_at ASC`,
    [ids, postSlug]
  );
  const repliesByFeedback = new Map();
  replies.forEach((reply) => {
    if (!repliesByFeedback.has(reply.feedback_id)) repliesByFeedback.set(reply.feedback_id, []);
    repliesByFeedback.get(reply.feedback_id).push(reply);
  });
  return rows.map((row) => ({ ...row, replies: repliesByFeedback.get(row.id) || [] }));
}

async function listComments(status = 'pending') {
  const pool = getPool();
  const allowedStatus = ['pending', 'approved', 'rejected'].includes(status) ? status : 'pending';
  const [rows] = await pool.query(
    `SELECT c.*, p.title AS post_title,
       (SELECT COUNT(*) FROM feedback_replies r WHERE r.feedback_id = c.id) AS reply_count
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

  const [replyRows] = await pool.query(
    `SELECT COUNT(*) AS total_replies,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_replies
     FROM feedback_replies`
  );
  return { ...(rows[0] || {
    total_comments: 0,
    pending_comments: 0,
    approved_comments: 0,
    rejected_comments: 0
  }), ...(replyRows[0] || { total_replies: 0, pending_replies: 0 }) };
}

async function createFeedbackReply({ feedbackId, name, mobile, email, message, req }) {
  const pool = getPool();
  const id = Number(feedbackId);
  const authorName = cleanText(name, 120);
  const authorMobile = cleanText(mobile, 20).replace(/[\s()-]/g, '');
  const authorEmail = cleanText(email, 191).toLowerCase();
  const replyText = cleanMessage(message);
  if (!Number.isInteger(id) || id < 1) throw Object.assign(new Error('Invalid feedback.'), { statusCode: 400 });
  if (authorName.length < 2) throw Object.assign(new Error('Please enter your full name.'), { statusCode: 400 });
  if (!/^[6-9]\d{9}$/.test(authorMobile)) throw Object.assign(new Error('Please enter a valid Indian mobile number.'), { statusCode: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) throw Object.assign(new Error('Please enter a valid email address.'), { statusCode: 400 });
  if (replyText.length < 2) throw Object.assign(new Error('Please enter your reply.'), { statusCode: 400 });

  const [comments] = await pool.query(
    "SELECT id, post_id, post_slug FROM blog_comments WHERE id = ? AND status = 'approved' LIMIT 1",
    [id]
  );
  if (!comments.length || !comments[0].post_id) throw Object.assign(new Error('Approved feedback was not found.'), { statusCode: 404 });
  const comment = comments[0];
  const [result] = await pool.query(
    `INSERT INTO feedback_replies
      (feedback_id, post_id, post_slug, author_name, author_mobile, author_email, reply_text, status, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)`,
    [id, comment.post_id, comment.post_slug, authorName, authorMobile, authorEmail, replyText,
      clientIp(req).slice(0, 64), String(req.headers['user-agent'] || '').slice(0, 500)]
  );
  return { id: result.insertId, status: 'approved' };
}

async function getCommentWithReplies(id) {
  const pool = getPool();
  const [comments] = await pool.query(
    `SELECT c.*, p.title AS post_title FROM blog_comments c
     LEFT JOIN blog_posts p ON p.id = c.post_id WHERE c.id = ? LIMIT 1`, [id]
  );
  if (!comments.length) return null;
  const [replies] = await pool.query(
    'SELECT * FROM feedback_replies WHERE feedback_id = ? ORDER BY created_at DESC', [id]
  );
  return { ...comments[0], replies };
}

async function updateReplyStatus(id, status) {
  const pool = getPool();
  if (!['pending', 'approved', 'rejected'].includes(status)) throw Object.assign(new Error('Invalid reply status.'), { statusCode: 400 });
  await pool.query('UPDATE feedback_replies SET status = ? WHERE id = ?', [status, id]);
}

async function listPendingReplies() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT r.*, c.author_name AS feedback_author, c.comment_text,
       p.title AS post_title
     FROM feedback_replies r
     INNER JOIN blog_comments c ON c.id = r.feedback_id
     LEFT JOIN blog_posts p ON p.id = r.post_id
     ORDER BY r.created_at DESC
     LIMIT 200`
  );
  return rows;
}

async function deleteReply(id) {
  const pool = getPool();
  await pool.query('DELETE FROM feedback_replies WHERE id = ?', [id]);
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
  createFeedbackReply,
  deleteComment,
  deleteReply,
  getCommentStats,
  getCommentWithReplies,
  listApprovedCommentsBySlug,
  listComments,
  listPendingReplies,
  updateCommentStatus,
  updateReplyStatus
};
