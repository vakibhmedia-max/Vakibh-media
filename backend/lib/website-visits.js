const crypto = require('crypto');
const { getPool } = require('./db');

const COOKIE_NAME = 'visitor_session_id';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;
const STATS_CACHE_MS = 15 * 1000;
let statsCache = null;
let statsCacheTime = 0;

function readCookie(req, name) {
  const cookies = String(req.headers.cookie || '').split(';');
  const item = cookies.find((part) => part.trim().startsWith(`${name}=`));
  return item ? decodeURIComponent(item.trim().slice(name.length + 1)) : '';
}

function validSessionId(value) {
  return /^[a-f0-9-]{36}$/i.test(value || '');
}

function visitorSession(req, res) {
  const existing = readCookie(req, COOKIE_NAME);
  if (validSessionId(existing)) return existing;
  const id = crypto.randomUUID();
  res.cookie(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/'
  });
  return id;
}

function hashIp(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
    .split(',')[0].trim();
  const secret = process.env.VISITOR_HASH_SECRET || process.env.SESSION_SECRET || 'vakibh-visitor-hash';
  return crypto.createHmac('sha256', secret).update(ip || 'unknown').digest('hex');
}

function cleanPageUrl(value) {
  const page = String(value || '/').trim().slice(0, 500);
  return page.startsWith('/') && !page.startsWith('//') ? page : '/';
}

async function getWebsiteVisitorStats({ req, res, pageUrl, track = true } = {}) {
  const pool = getPool();
  if (track && req && res) {
    const sessionId = visitorSession(req, res);
    await pool.query(
      `INSERT IGNORE INTO website_visits (session_id, ip_hash, page_url)
       VALUES (?, ?, ?)`,
      [sessionId, hashIp(req), cleanPageUrl(pageUrl)]
    );
  }

  const now = Date.now();
  if (statsCache && now - statsCacheTime < STATS_CACHE_MS) return statsCache;
  const [rows] = await pool.query(
    `SELECT COUNT(DISTINCT session_id) AS totalVisitors,
      COUNT(DISTINCT CASE WHEN DATE(visited_at) = CURDATE() THEN session_id END) AS todayVisitors
     FROM website_visits`
  );
  statsCache = {
    totalVisitors: Number(rows[0]?.totalVisitors || 0),
    todayVisitors: Number(rows[0]?.todayVisitors || 0)
  };
  statsCacheTime = now;
  return statsCache;
}

module.exports = { getWebsiteVisitorStats };
