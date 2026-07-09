const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const https = require('https');
const { URLSearchParams } = require('url');
const { getPool } = require('./db');

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_SECONDS = 30;
const OTP_MAX_ATTEMPTS = 3;
const OTP_RATE_WINDOW_MS = 10 * 60 * 1000;
const OTP_RATE_MAX_REQUESTS = 5;
const OTP_DEV_MODE = String(process.env.OTP_DEV_MODE || '').toLowerCase() === 'true';

const sendRateMap = new Map();

function resolvePhone(value) {
  const raw = String(value || '').trim();
  const digits = raw.replace(/\D+/g, '');

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return { raw, storage: digits, national: digits, country91: `91${digits}`, e164: `+91${digits}` };
  }

  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    const national = digits.slice(2);
    return { raw, storage: national, national, country91: digits, e164: `+${digits}` };
  }

  if (digits.length === 11 && /^9\d{10}$/.test(digits)) {
    return { raw, storage: digits, national: digits, country91: digits, e164: `+${digits}` };
  }

  return { raw, storage: digits, national: digits, country91: digits.startsWith('91') ? digits : `91${digits}`, e164: digits.startsWith('91') ? `+${digits}` : `+91${digits}` };
}

function normalizePhone(value) {
  return resolvePhone(value).storage;
}

function isValidIndianPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone) || /^9\d{10}$/.test(phone);
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || req.ip || '';
}

function detectDevice(userAgent = '') {
  const ua = String(userAgent).toLowerCase();
  if (/tablet|ipad/.test(ua)) return 'Tablet';
  if (/mobi|android|iphone|ipod|phone/.test(ua)) return 'Mobile';
  return 'Desktop';
}

function detectBrowser(userAgent = '') {
  const ua = String(userAgent);
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua) || /Opera/.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  return 'Other';
}

function assertSendRateLimit(phone, ip) {
  const now = Date.now();
  const key = `${phone}:${ip}`;
  const entry = sendRateMap.get(key) || { count: 0, resetAt: now + OTP_RATE_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + OTP_RATE_WINDOW_MS;
  }
  entry.count += 1;
  sendRateMap.set(key, entry);
  if (entry.count > OTP_RATE_MAX_REQUESTS) {
    const error = new Error('Too many OTP requests. Please try again later.');
    error.statusCode = 429;
    throw error;
  }
}

function postJson(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        method: 'POST',
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        port: target.port || 443,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...headers
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve(data);
          reject(new Error(`SMS provider failed with status ${res.statusCode}: ${data}`));
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function postForm(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const body = new URLSearchParams(payload).toString();
    const req = https.request(
      {
        method: 'POST',
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        port: target.port || 443,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
          ...headers
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve(data);
          reject(new Error(`SMS provider failed with status ${res.statusCode}: ${data}`));
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sendSmsOtp(phoneInfo, otp) {
  const provider = String(process.env.OTP_SMS_PROVIDER || '').toLowerCase();
  const message = `Your Vakibh login OTP is ${otp}. It is valid for 5 minutes.`;
  console.log('[Vakibh OTP] SMS provider selected:', provider || 'not configured');
  console.log('[Vakibh OTP] Provider phone formats:', {
    national: phoneInfo.national,
    country91: phoneInfo.country91,
    e164: phoneInfo.e164
  });

  try {
    if (provider === 'fast2sms' && process.env.FAST2SMS_API_KEY) {
      const response = await postForm(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: process.env.FAST2SMS_ROUTE || 'q',
          numbers: phoneInfo.national,
          message,
          language: 'english',
          flash: '0'
        },
        { authorization: process.env.FAST2SMS_API_KEY }
      );
      console.log('[Vakibh OTP] Fast2SMS response:', response);
      return;
    }

    if (provider === 'msg91' && process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
      const response = await postJson(
        'https://control.msg91.com/api/v5/flow/',
        {
          template_id: process.env.MSG91_TEMPLATE_ID,
          short_url: '0',
          recipients: [{ mobiles: phoneInfo.country91, otp }]
        },
        { authkey: process.env.MSG91_AUTH_KEY }
      );
      console.log('[Vakibh OTP] MSG91 response:', response);
      return;
    }

    if (provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const response = await postForm(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        { To: phoneInfo.e164, From: process.env.TWILIO_FROM_NUMBER, Body: message },
        { Authorization: `Basic ${auth}` }
      );
      console.log('[Vakibh OTP] Twilio response:', response);
      return;
    }

    if (OTP_DEV_MODE) {
      console.log(`[Vakibh OTP DEV] ${phoneInfo.country91}: ${otp}`);
      return;
    }

    const error = new Error('SMS service not configured. Please add API key.');
    error.statusCode = 503;
    throw error;
  } catch (error) {
    console.error('[Vakibh OTP] SMS provider error:', error.message);
    throw error;
  }
}
async function requestVisitorOtp({ name, phone, req }) {
  const cleanName = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 120);
  const phoneInfo = resolvePhone(phone);
  const cleanPhone = phoneInfo.storage;
  console.log('[Vakibh OTP] phone number received:', phoneInfo.raw);
  console.log('[Vakibh OTP] normalized phone number:', cleanPhone);

  if (!cleanName) {
    const error = new Error('Name is required.');
    error.statusCode = 400;
    throw error;
  }
  if (!isValidIndianPhone(cleanPhone)) {
    const error = new Error('Enter a valid Indian mobile number.');
    error.statusCode = 400;
    throw error;
  }

  const ip = getClientIp(req);
  assertSendRateLimit(cleanPhone, ip);

  const pool = getPool();
  const [recentRows] = await pool.query(
    `SELECT created_at FROM otp_verifications
     WHERE phone = ? AND verified = 0
     ORDER BY id DESC LIMIT 1`,
    [cleanPhone]
  );
  if (recentRows.length) {
    const since = Date.now() - new Date(recentRows[0].created_at).getTime();
    if (since < OTP_RESEND_SECONDS * 1000) {
      const error = new Error(`Please wait ${OTP_RESEND_SECONDS} seconds before requesting another OTP.`);
      error.statusCode = 429;
      throw error;
    }
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await sendSmsOtp(phoneInfo, otp);

  await pool.query(
    `INSERT INTO otp_verifications (phone, otp_hash, expires_at, attempts, verified)
     VALUES (?, ?, ?, 0, 0)`,
    [cleanPhone, otpHash, expiresAt]
  );

  return { phone: cleanPhone, resendAfter: OTP_RESEND_SECONDS };
}
async function verifyVisitorOtp({ name, phone, otp, req }) {
  const cleanName = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 120);
  const cleanPhone = normalizePhone(phone);
  const cleanOtp = String(otp || '').replace(/\D+/g, '');
  if (!cleanName || !isValidIndianPhone(cleanPhone) || !/^\d{6}$/.test(cleanOtp)) {
    const error = new Error('Invalid OTP login details.');
    error.statusCode = 400;
    throw error;
  }

  const pool = getPool();
  const [otpRows] = await pool.query(
    `SELECT id, otp_hash, expires_at, attempts, verified
     FROM otp_verifications
     WHERE phone = ?
     ORDER BY id DESC LIMIT 1`,
    [cleanPhone]
  );
  const otpRow = otpRows[0];
  if (!otpRow || Number(otpRow.verified) === 1) {
    const error = new Error('OTP not found. Please request a new OTP.');
    error.statusCode = 400;
    throw error;
  }
  if (new Date(otpRow.expires_at).getTime() < Date.now()) {
    const error = new Error('OTP expired. Please request a new OTP.');
    error.statusCode = 400;
    throw error;
  }
  if (Number(otpRow.attempts) >= OTP_MAX_ATTEMPTS) {
    const error = new Error('Maximum OTP attempts reached. Please request a new OTP.');
    error.statusCode = 429;
    throw error;
  }

  const matches = await bcrypt.compare(cleanOtp, otpRow.otp_hash);
  await pool.query('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?', [otpRow.id]);
  if (!matches) {
    const error = new Error('Incorrect OTP.');
    error.statusCode = 400;
    throw error;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('UPDATE otp_verifications SET verified = 1 WHERE id = ?', [otpRow.id]);
    await connection.query(
      `INSERT INTO visitors (name, phone, created_at, last_login_at, login_count)
       VALUES (?, ?, NOW(), NOW(), 1)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         last_login_at = NOW(),
         login_count = login_count + 1`,
      [cleanName, cleanPhone]
    );
    const [visitorRows] = await connection.query('SELECT id, name, phone, login_count FROM visitors WHERE phone = ? LIMIT 1', [cleanPhone]);
    const visitor = visitorRows[0];
    await connection.query(
      `INSERT INTO visitor_login_logs (visitor_id, phone, login_time, ip_address, user_agent, device_type, browser)
       VALUES (?, ?, NOW(), ?, ?, ?, ?)`,
      [
        visitor.id,
        cleanPhone,
        getClientIp(req),
        String(req.headers['user-agent'] || '').slice(0, 500),
        detectDevice(req.headers['user-agent']),
        detectBrowser(req.headers['user-agent'])
      ]
    );
    await connection.commit();
    return visitor;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getVisitorStats() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM visitor_login_logs) AS total_logins,
      (SELECT COUNT(*) FROM visitor_login_logs WHERE DATE(login_time) = CURDATE()) AS today_logins,
      (SELECT COUNT(*) FROM visitor_login_logs WHERE YEARWEEK(login_time, 1) = YEARWEEK(CURDATE(), 1)) AS week_logins,
      (SELECT COUNT(*) FROM visitor_login_logs WHERE YEAR(login_time) = YEAR(CURDATE()) AND MONTH(login_time) = MONTH(CURDATE())) AS month_logins,
      (SELECT COUNT(*) FROM visitors WHERE login_count > 1) AS repeat_visitors,
      (SELECT COUNT(DISTINCT phone) FROM visitors) AS unique_phones`
  );
  return rows[0] || {};
}

async function listVisitorLogins(limit = 200) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
       v.id,
       v.name,
       v.phone,
       v.created_at,
       v.last_login_at,
       v.login_count,
       l.login_time,
       l.ip_address,
       l.user_agent,
       l.device_type,
       l.browser
     FROM visitors v
     LEFT JOIN visitor_login_logs l ON l.id = (
       SELECT id FROM visitor_login_logs WHERE visitor_id = v.id ORDER BY login_time DESC, id DESC LIMIT 1
     )
     ORDER BY v.last_login_at DESC
     LIMIT ?`,
    [Number(limit) || 200]
  );
  return rows;
}

module.exports = {
  getVisitorStats,
  listVisitorLogins,
  normalizePhone,
  requestVisitorOtp,
  verifyVisitorOtp
};






