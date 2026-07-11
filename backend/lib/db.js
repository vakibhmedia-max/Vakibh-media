const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'vakibh';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD =
  Object.prototype.hasOwnProperty.call(process.env, 'DB_PASSWORD')
    ? process.env.DB_PASSWORD
    : 'root';
const DB_CREATE_DATABASE_ON_STARTUP = String(
  process.env.DB_CREATE_DATABASE_ON_STARTUP || 'true'
).toLowerCase() !== 'false';

let pool = null;

async function ensureDatabase() {
  if (!DB_CREATE_DATABASE_ON_STARTUP) return;

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    charset: 'utf8mb4'
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci`
  );

  await connection.end();
}

async function initPool() {
  if (pool) return pool;

  await ensureDatabase();

  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  });

  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool has not been initialized yet.');
  }

  return pool;
}

module.exports = {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  getPool,
  initPool
};
