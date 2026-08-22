const sanitizeHtml = require('sanitize-html');
const { getPool } = require('./db');

const STATUSES = ['new', 'contacted', 'in_progress', 'resolved', 'closed'];

function cleanText(value, maxLength, multiline = false) {
  const plain = sanitizeHtml(String(value || ''), { allowedTags: [], allowedAttributes: {} });
  const normalized = multiline
    ? plain.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').trim()
    : plain.replace(/\s+/g, ' ').trim();
  return normalized.slice(0, maxLength);
}

function httpError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function normalizeId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw httpError('Invalid inquiry ID.');
  return id;
}

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
    .split(',')[0].trim().slice(0, 64);
}

async function createInquiry({ name, email, phone, subject, message, req }) {
  const normalizedPhone = String(phone || '').replace(/[०-९]/g, (digit) =>
    String('०१२३४५६७८९'.indexOf(digit))
  );
  const values = {
    name: cleanText(name, 120),
    email: cleanText(email, 191).toLowerCase(),
    phone: cleanText(normalizedPhone, 30),
    subject: cleanText(subject, 255),
    message: cleanText(message, 5000, true)
  };
  if (values.name.length < 2) throw httpError('कृपया तुमचे पूर्ण नाव लिहा.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) throw httpError('कृपया वैध ईमेल लिहा.');
  if (values.phone && !/^[+\d][\d\s()-]{6,24}$/.test(values.phone)) throw httpError('कृपया वैध फोन नंबर लिहा.');
  if (values.subject.length < 3) throw httpError('कृपया विषय लिहा.');
  if (values.message.length < 5) throw httpError('कृपया संपूर्ण संदेश लिहा.');

  const [result] = await getPool().query(
    `INSERT INTO contact_inquiries
      (name, email, phone, subject, message, status, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, 'new', ?, ?)`,
    [values.name, values.email, values.phone || null, values.subject, values.message,
      clientIp(req), String(req.headers['user-agent'] || '').slice(0, 500)]
  );
  return { id: result.insertId, status: 'new' };
}

function dateRangeClause(range, from, to, params) {
  if (range === 'today') return ' AND DATE(created_at) = CURDATE()';
  if (range === '7') return ' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  if (range === '30') return ' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
  if (range === 'custom') {
    let sql = '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(from || '')) { sql += ' AND created_at >= ?'; params.push(`${from} 00:00:00`); }
    if (/^\d{4}-\d{2}-\d{2}$/.test(to || '')) { sql += ' AND created_at <= ?'; params.push(`${to} 23:59:59`); }
    return sql;
  }
  return '';
}

async function listInquiries(filters = {}) {
  const params = [];
  let where = 'WHERE is_deleted = 0';
  if (STATUSES.includes(filters.status)) { where += ' AND status = ?'; params.push(filters.status); }
  const search = cleanText(filters.search, 191);
  if (search) {
    const term = `%${search}%`;
    where += ' AND (CAST(id AS CHAR) LIKE ? OR name LIKE ? OR email LIKE ? OR phone LIKE ? OR subject LIKE ? OR message LIKE ?)';
    params.push(term, term, term, term, term, term);
  }
  where += dateRangeClause(filters.range, filters.from, filters.to, params);
  const [rows] = await getPool().query(
    `SELECT id, name, email, phone, subject, status, created_at, updated_at
     FROM contact_inquiries ${where} ORDER BY created_at DESC LIMIT 500`, params
  );
  return rows;
}

async function getInquiryStats() {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) total,
      SUM(status='new') new_count, SUM(status='contacted') contacted_count,
      SUM(status='in_progress') in_progress_count, SUM(status='resolved') resolved_count,
      SUM(status='closed') closed_count
     FROM contact_inquiries WHERE is_deleted = 0`
  );
  return rows[0] || {};
}

async function getInquiry(id) {
  const inquiryId = normalizeId(id);
  const [rows] = await getPool().query('SELECT * FROM contact_inquiries WHERE id = ? AND is_deleted = 0 LIMIT 1', [inquiryId]);
  if (!rows.length) return null;
  const [history] = await getPool().query(
    `SELECT h.*, u.name changed_by_name FROM contact_inquiry_status_history h
     LEFT JOIN admin_users u ON u.id = h.changed_by
     WHERE h.inquiry_id = ? ORDER BY h.changed_at DESC`, [inquiryId]
  );
  return { ...rows[0], history };
}

async function updateInquiryStatus(id, status, changedBy) {
  const inquiryId = normalizeId(id);
  if (!STATUSES.includes(status)) throw httpError('Invalid inquiry status.');
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT status FROM contact_inquiries WHERE id = ? AND is_deleted = 0 FOR UPDATE', [inquiryId]);
    if (!rows.length) throw httpError('Inquiry not found.', 404);
    const oldStatus = rows[0].status;
    if (oldStatus !== status) {
      const timestamps = status === 'contacted'
        ? ', contacted_at = COALESCE(contacted_at, NOW())'
        : status === 'resolved' ? ', resolved_at = COALESCE(resolved_at, NOW())' : '';
      await connection.query(`UPDATE contact_inquiries SET status = ?${timestamps} WHERE id = ?`, [status, inquiryId]);
      await connection.query(
        'INSERT INTO contact_inquiry_status_history (inquiry_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
        [inquiryId, oldStatus, status, changedBy || null]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateInquiryNotes(id, notes) {
  const inquiryId = normalizeId(id);
  const adminNotes = cleanText(notes, 5000, true);
  const [result] = await getPool().query(
    'UPDATE contact_inquiries SET admin_notes = ? WHERE id = ? AND is_deleted = 0',
    [adminNotes || null, inquiryId]
  );
  if (!result.affectedRows) throw httpError('Inquiry not found.', 404);
}

async function deleteInquiry(id) {
  const inquiryId = normalizeId(id);
  const [result] = await getPool().query(
    'UPDATE contact_inquiries SET is_deleted = 1, deleted_at = NOW() WHERE id = ? AND is_deleted = 0', [inquiryId]
  );
  if (!result.affectedRows) throw httpError('Inquiry not found.', 404);
}

module.exports = {
  STATUSES, createInquiry, deleteInquiry, getInquiry, getInquiryStats,
  listInquiries, updateInquiryNotes, updateInquiryStatus
};
