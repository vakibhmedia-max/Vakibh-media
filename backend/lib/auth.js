const bcrypt = require('bcryptjs');
const { getPool } = require('./db');

function sanitizeAdminRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role
  };
}

async function getAdminByEmail(email) {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash, role FROM admin_users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function verifyAdminLogin(email, password) {
  const admin = await getAdminByEmail(email);
  if (!admin) return null;

  const passwordMatches = await bcrypt.compare(password, admin.password_hash);
  if (!passwordMatches) return null;

  return sanitizeAdminRow(admin);
}

function requireAdmin(req, res, next) {
  if (req.session?.admin) return next();
  return res.redirect('/admin/login');
}

function redirectIfAdmin(req, res, next) {
  if (req.session?.admin) return res.redirect('/admin');
  return next();
}

module.exports = {
  getAdminByEmail,
  redirectIfAdmin,
  requireAdmin,
  sanitizeAdminRow,
  verifyAdminLogin
};
