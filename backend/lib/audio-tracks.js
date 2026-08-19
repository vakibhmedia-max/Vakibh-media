const fs = require('fs');
const path = require('path');
const { getPool } = require('./db');

function normalizeVolume(value, fallback = 0.35) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0.05, parsed));
}

function normalizeTrackInput(body = {}) {
  const title = String(body.title || '').replace(/\s+/g, ' ').trim();
  if (!title) throw new Error('Audio title is required.');
  if (title.length > 180) throw new Error('Audio title must be 180 characters or fewer.');

  return {
    title,
    description: String(body.description || '').trim().slice(0, 1000),
    defaultVolume: normalizeVolume(body.default_volume),
    loopEnabled: body.loop_enabled === '1' || body.loop_enabled === 'on' || body.loop_enabled === true,
    isActive: body.is_active === '1' || body.is_active === 'on' || body.is_active === true
  };
}

async function listAudioTracks() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, title, description, file_url, file_name, file_size, mime_type,
            is_active, default_volume, loop_enabled, uploaded_by, created_at, updated_at
     FROM audio_tracks
     ORDER BY is_active DESC, updated_at DESC, id DESC`
  );
  return rows;
}

async function getAudioTrack(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM audio_tracks WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function getActiveAudioTrack() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, title, description, file_url, file_name, file_size, mime_type,
            default_volume, loop_enabled, updated_at
     FROM audio_tracks
     WHERE is_active = 1
     ORDER BY updated_at DESC, id DESC
     LIMIT 1`
  );
  return rows[0] || null;
}

async function createAudioTrack({ body, file, uploadedBy }) {
  if (!file) throw new Error('Please select an audio file.');
  const input = normalizeTrackInput(body);
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    if (input.isActive) await connection.query('UPDATE audio_tracks SET is_active = 0 WHERE is_active = 1');
    const [result] = await connection.query(
      `INSERT INTO audio_tracks
       (title, description, file_url, file_name, file_size, mime_type, is_active,
        default_volume, loop_enabled, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.title,
        input.description || null,
        `/uploads/audio/${file.filename}`,
        file.originalname,
        file.size,
        file.mimetype,
        input.isActive ? 1 : 0,
        input.defaultVolume,
        input.loopEnabled ? 1 : 0,
        uploadedBy || null
      ]
    );
    await connection.commit();
    return getAudioTrack(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateAudioTrack(id, body) {
  const existing = await getAudioTrack(id);
  if (!existing) throw new Error('Audio track was not found.');
  const input = normalizeTrackInput(body);
  const pool = getPool();
  await pool.query(
    `UPDATE audio_tracks
     SET title = ?, description = ?, default_volume = ?, loop_enabled = ?
     WHERE id = ?`,
    [input.title, input.description || null, input.defaultVolume, input.loopEnabled ? 1 : 0, id]
  );
  return getAudioTrack(id);
}

async function activateAudioTrack(id) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT id FROM audio_tracks WHERE id = ? FOR UPDATE', [id]);
    if (!rows[0]) throw new Error('Audio track was not found.');
    await connection.query('UPDATE audio_tracks SET is_active = 0 WHERE is_active = 1');
    await connection.query('UPDATE audio_tracks SET is_active = 1 WHERE id = ?', [id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deactivateAudioTrack(id) {
  const pool = getPool();
  await pool.query('UPDATE audio_tracks SET is_active = 0 WHERE id = ?', [id]);
}

async function replaceAudioFile(id, file, uploadRoot) {
  if (!file) throw new Error('Please select a replacement audio file.');
  const existing = await getAudioTrack(id);
  if (!existing) throw new Error('Audio track was not found.');
  const pool = getPool();
  await pool.query(
    `UPDATE audio_tracks
     SET file_url = ?, file_name = ?, file_size = ?, mime_type = ?
     WHERE id = ?`,
    [`/uploads/audio/${file.filename}`, file.originalname, file.size, file.mimetype, id]
  );
  removeUploadedAudioFile(existing.file_url, uploadRoot);
  return getAudioTrack(id);
}

function removeUploadedAudioFile(fileUrl, uploadRoot) {
  if (!String(fileUrl || '').startsWith('/uploads/audio/')) return;
  const fileName = path.basename(fileUrl);
  const resolvedRoot = path.resolve(uploadRoot);
  const resolvedFile = path.resolve(resolvedRoot, fileName);
  if (!resolvedFile.startsWith(`${resolvedRoot}${path.sep}`)) return;
  try {
    if (fs.existsSync(resolvedFile)) fs.unlinkSync(resolvedFile);
  } catch (error) {
    console.warn('Could not remove old audio file:', error.message || error);
  }
}

async function deleteAudioTrack(id, uploadRoot) {
  const track = await getAudioTrack(id);
  if (!track) throw new Error('Audio track was not found.');
  if (track.is_active) throw new Error('This audio is currently active. Please activate another audio before deleting it.');
  const pool = getPool();
  await pool.query('DELETE FROM audio_tracks WHERE id = ?', [id]);
  removeUploadedAudioFile(track.file_url, uploadRoot);
}

async function seedDefaultAudioTrack() {
  const pool = getPool();
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM audio_tracks');
  if (Number(rows[0]?.total || 0) > 0) return;
  await pool.query(
    `INSERT INTO audio_tracks
     (title, description, file_url, file_name, file_size, mime_type, is_active,
      default_volume, loop_enabled)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, 1)`,
    [
      'Vaakibh Devotional Audio',
      'Default devotional audio used by the floating Veena player.',
      '/Vakibh/vaakibh_audio.mp3',
      'vaakibh_audio.mp3',
      4350955,
      'audio/mpeg',
      0.35
    ]
  );
}

module.exports = {
  activateAudioTrack,
  createAudioTrack,
  deactivateAudioTrack,
  deleteAudioTrack,
  getActiveAudioTrack,
  listAudioTracks,
  replaceAudioFile,
  seedDefaultAudioTrack,
  updateAudioTrack
};
