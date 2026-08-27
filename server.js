require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const multer = require('multer');

const { initPool } = require('./backend/lib/db');
const { bootstrapDatabase } = require('./backend/lib/bootstrap');
const {
  redirectIfAdmin,
  requireAdmin,
  verifyAdminLogin
} = require('./backend/lib/auth');
const {
  createBlogPost,
  deleteBlogPost,
  getDashboardStats,
  getBlogSlugRedirect,
  getNextSortOrder,
  getPostById,
  getPostBySlug,
  getRecentPosts,
  listAllPosts,
  listPublishedPosts,
  removeDuplicateFeaturedImage,
  updateBlogPost
} = require('./backend/lib/blogs');
const { renderPage } = require('./backend/lib/render');
const {
  getVisitorStats,
  listVisitorLogins,
  requestVisitorOtp,
  verifyVisitorOtp
} = require('./backend/lib/visitors');
const { formatDate, toDateTimeLocal } = require('./backend/lib/utils');
const { buildImportPreview, importBloggerFeed } = require('./backend/lib/blogger-import');
const { createCategory, deleteCategory, listCategories } = require('./backend/lib/categories');
const {
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
} = require('./backend/lib/comments');
const {
  activateAudioTrack,
  createAudioTrack,
  deactivateAudioTrack,
  deleteAudioTrack,
  getActiveAudioTrack,
  listAudioTracks,
  replaceAudioFile,
  updateAudioTrack
} = require('./backend/lib/audio-tracks');
const {
  STATUSES: CONTACT_STATUSES,
  createInquiry,
  deleteInquiry,
  getInquiry,
  getInquiryStats,
  listInquiries,
  updateInquiryNotes,
  updateInquiryStatus
} = require('./backend/lib/contact-inquiries');
const { getWebsiteVisitorStats } = require('./backend/lib/website-visits');

const ROOT = __dirname;
const SITE_ROOT = path.join(ROOT, 'Vakibh-media');
const UPLOAD_ROOT = path.join(ROOT, 'uploads', 'blog');
const AUDIO_UPLOAD_ROOT = path.join(ROOT, 'uploads', 'audio');
const BLOGGER_IMPORT_ROOT = path.join(ROOT, 'uploads', 'blogger-import');
const PORT = Number(process.env.PORT || 3000);

fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
fs.mkdirSync(AUDIO_UPLOAD_ROOT, { recursive: true });
fs.mkdirSync(BLOGGER_IMPORT_ROOT, { recursive: true });

const app = express();
let backendReadyPromise = null;
const publicSubmissionWindows = new Map();

function rateLimitPublicSubmission(req, res, next) {
  const now = Date.now();
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const submissionType = req.path.includes('contact-inquiries')
    ? 'contact-inquiry'
    : req.path.includes('/replies') ? 'reply' : 'feedback';
  const key = `${ip}:${submissionType}`;
  const recent = (publicSubmissionWindows.get(key) || []).filter((time) => now - time < 10 * 60 * 1000);
  if (recent.length >= 5) {
    res.status(429).json({ ok: false, message: 'Too many submissions. Please try again later.' });
    return;
  }
  recent.push(now);
  publicSubmissionWindows.set(key, recent);
  next();
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'vakibh-admin-session',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use('/backend', express.static(path.join(ROOT, 'backend/public')));
app.use('/uploads', express.static(path.join(ROOT, 'uploads')));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_ROOT),
  filename: (_, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase() || '.png';
    const baseName = path
      .basename(file.originalname || 'upload', extension)
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    cb(null, `${Date.now()}-${baseName || 'image'}${extension}`);
  }
});

const upload = multer({ storage });

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.m4a']);
const AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a'
]);
const audioUpload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, AUDIO_UPLOAD_ROOT),
    filename: (_, file, cb) => {
      const extension = path.extname(file.originalname || '').toLowerCase();
      const baseName = path.basename(file.originalname || 'audio', extension)
        .normalize('NFKD')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
      cb(null, `${Date.now()}-${baseName || 'devotional-audio'}${extension}`);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const mimeType = String(file.mimetype || '').toLowerCase();
    if (!AUDIO_EXTENSIONS.has(extension) || !AUDIO_MIME_TYPES.has(mimeType)) {
      cb(new Error('Only valid MP3, WAV, OGG, or M4A audio files up to 20 MB are allowed.'));
      return;
    }
    cb(null, true);
  }
});

function removeFailedUpload(file) {
  if (!file?.path) return;
  const resolved = path.resolve(file.path);
  if (!resolved.startsWith(`${path.resolve(AUDIO_UPLOAD_ROOT)}${path.sep}`)) return;
  try {
    if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
  } catch (error) {
    console.warn('Could not remove failed audio upload:', error.message || error);
  }
}

function validateUploadedAudioSignature(file) {
  if (!file?.path) throw new Error('Please select an audio file.');
  const extension = path.extname(file.originalname || '').toLowerCase();
  const descriptor = fs.openSync(file.path, 'r');
  const header = Buffer.alloc(16);
  try {
    fs.readSync(descriptor, header, 0, header.length, 0);
  } finally {
    fs.closeSync(descriptor);
  }

  const isMp3 = header.subarray(0, 3).toString('ascii') === 'ID3' || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
  const isWav = header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WAVE';
  const isOgg = header.subarray(0, 4).toString('ascii') === 'OggS';
  const isM4a = header.subarray(4, 8).toString('ascii') === 'ftyp';
  const valid = (extension === '.mp3' && isMp3)
    || (extension === '.wav' && isWav)
    || (extension === '.ogg' && isOgg)
    || (extension === '.m4a' && isM4a);

  if (!valid) throw new Error('The uploaded file content does not match a supported audio format.');
}

const bloggerImportUpload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, BLOGGER_IMPORT_ROOT),
    filename: (_, file, cb) => {
      const extension = path.extname(file.originalname || '').toLowerCase();
      cb(null, `${Date.now()}-blogger-feed${extension || '.atom'}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    if (!['.atom', '.xml'].includes(extension)) {
      cb(new Error('Only .atom or .xml Blogger export files are allowed.'));
      return;
    }
    cb(null, true);
  }
});

function resolveImportFile(filePath) {
  const value = String(filePath || '').trim();
  const resolved = path.resolve(value);
  if (!resolved.startsWith(BLOGGER_IMPORT_ROOT + path.sep)) {
    const error = new Error('Invalid import file reference. Please upload the Blogger feed again.');
    error.statusCode = 400;
    throw error;
  }
  if (!fs.existsSync(resolved)) {
    const error = new Error('Import file was not found. Please upload the Blogger feed again.');
    error.statusCode = 400;
    throw error;
  }
  return resolved;
}

async function ensureBackendReady() {
  if (!backendReadyPromise) {
    backendReadyPromise = (async () => {
      await initPool();
      await bootstrapDatabase();
    })().catch((error) => {
      backendReadyPromise = null;
      throw error;
    });
  }

  return backendReadyPromise;
}


function getNotice(req) {
  return String(req.query.notice || '').trim();
}

function getError(req) {
  return String(req.query.error || '').trim();
}

function uploadedImagePath(file) {
  if (!file) return '';
  return `/uploads/blog/${file.filename}`;
}

function makeDefaultPost(nextSortOrder) {
  return {
    title: '',
    slug: '',
    category: 'संत साहित्य',
    author_name: 'वाकीभ संपादकीय मंडळ',
    card_label: `लेख ${nextSortOrder}`,
    excerpt: '',
    content_html: '',
    featured_image: '/assests/hero-bg.jpg',
    featured_image_alt: '',
    meta_description: '',
    status: 'published',
    sort_order: nextSortOrder,
    published_at: null
  };
}

function prepareFormPost(post, nextSortOrder) {
  const resolved = post || makeDefaultPost(nextSortOrder);
  return {
    ...resolved,
    featured_image: resolved.featured_image || '/assests/hero-bg.jpg',
    featured_image_alt: resolved.featured_image_alt || resolved.title || '',
    category: resolved.category || 'संत साहित्य',
    author_name: resolved.author_name || 'वाकीभ संपादकीय मंडळ',
    card_label: resolved.card_label || (resolved.sort_order ? `लेख ${resolved.sort_order}` : `लेख ${nextSortOrder}`),
    excerpt: resolved.excerpt || '',
    content_html: resolved.content_html || '',
    meta_description: resolved.meta_description || '',
    status: resolved.status || 'published',
    sort_order: resolved.sort_order ?? nextSortOrder,
    publishedAtValue: toDateTimeLocal(resolved.published_at)
  };
}

async function render(res, template, data = {}, layout = 'public') {
  const html = await renderPage(template, data, layout);
  res.send(html);
}

app.use(async (req, res, next) => {
  const needsBackend =
    req.path === '/admin' ||
    req.path.startsWith('/admin/') ||
    req.path.startsWith('/api/audio/') ||
    req.path.startsWith('/api/visitor-login/') ||
    req.path.startsWith('/api/blog-comments') ||
    req.path.startsWith('/api/contact-inquiries') ||
    req.path.startsWith('/api/visitor-stats') ||
    req.path.startsWith('/api/admin/contact-inquiries') ||
    req.path.startsWith('/blog/');

  if (!needsBackend) {
    return next();
  }

  try {
    await ensureBackendReady();
    return next();
  } catch (error) {
    return next(error);
  }
});

app.get('/blog/', (req, res) => res.sendFile(path.join(SITE_ROOT, 'blog', 'index.html')));

app.get('/api/visitor-login/status', (req, res) => {
  res.json({
    loggedIn: Boolean(req.session.visitor?.id),
    visitor: req.session.visitor ? { name: req.session.visitor.name } : null
  });
});

app.post('/api/visitor-login/send-otp', async (req, res, next) => {
  try {
    const result = await requestVisitorOtp({
      name: req.body.name,
      phone: req.body.phone,
      req
    });
    req.session.pendingVisitorLogin = {
      name: String(req.body.name || '').trim(),
      phone: result.phone,
      requestedAt: Date.now()
    };
    res.json({ ok: true, message: 'OTP sent successfully.', resendAfter: result.resendAfter });
  } catch (error) {
    console.error('[Vakibh OTP] Send OTP API error:', error.message);
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || 'Unable to send OTP.' });
  }
});

app.post('/api/visitor-login/verify-otp', async (req, res, next) => {
  try {
    const pending = req.session.pendingVisitorLogin || {};
    const visitor = await verifyVisitorOtp({
      name: req.body.name || pending.name,
      phone: req.body.phone || pending.phone,
      otp: req.body.otp,
      req
    });
    req.session.cookie.maxAge = 1000 * 60 * 60 * 24;
    req.session.visitor = {
      id: visitor.id,
      name: visitor.name,
      phone: visitor.phone,
      loggedInAt: Date.now()
    };
    delete req.session.pendingVisitorLogin;
    res.json({ ok: true, message: 'Login successful', visitor: { name: visitor.name } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || 'Unable to verify OTP.' });
  }
});

app.get('/api/visitor-stats', async (req, res) => {
  try {
    const stats = await getWebsiteVisitorStats({
      req,
      res,
      pageUrl: req.query.page,
      track: true
    });
    res.set('Cache-Control', 'private, max-age=15');
    res.json(stats);
  } catch (error) {
    res.status(500).json({ totalVisitors: 0, todayVisitors: 0 });
  }
});

app.get('/api/blog-comments/:slug', async (req, res) => {
  try {
    const comments = await listApprovedCommentsBySlug(req.params.slug);
    res.json({ ok: true, comments });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || 'Unable to load feedback.' });
  }
});

app.post('/api/blog-comments', rateLimitPublicSubmission, async (req, res) => {
  try {
    const comment = await createBlogComment({
      slug: req.body.slug,
      name: req.body.name,
      contact: req.body.contact,
      mobile: req.body.mobile,
      email: req.body.email,
      message: req.body.message,
      req
    });
    res.status(201).json({
      ok: true,
      comment,
      message: 'धन्यवाद!'
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || 'Unable to save feedback.' });
  }
});

app.post('/api/contact-inquiries', rateLimitPublicSubmission, async (req, res) => {
  try {
    await createInquiry({ ...req.body, req });
    res.status(201).json({
      ok: true,
      message: 'तुमचा संदेश यशस्वीरित्या पाठवला गेला आहे.'
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || 'संदेश पाठवता आला नाही. कृपया पुन्हा प्रयत्न करा.'
    });
  }
});

app.post('/api/feedback/:feedbackId/replies', rateLimitPublicSubmission, async (req, res) => {
  try {
    const reply = await createFeedbackReply({
      feedbackId: req.params.feedbackId,
      name: req.body.name,
      mobile: req.body.mobile,
      email: req.body.email,
      message: req.body.message,
      req
    });
    res.status(201).json({ ok: true, reply, message: 'धन्यवाद!' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, message: error.message || 'Unable to save reply.' });
  }
});

app.get('/api/audio/active', async (req, res) => {
  try {
    const track = await getActiveAudioTrack();
    res.set('Cache-Control', 'no-store, max-age=0');
    if (!track) {
      res.status(404).json({ ok: false, message: 'No active audio is configured.' });
      return;
    }
    res.json({
      ok: true,
      id: track.id,
      title: track.title,
      description: track.description || '',
      fileUrl: track.file_url,
      fileName: track.file_name,
      mimeType: track.mime_type,
      fileSize: Number(track.file_size || 0),
      volume: Number(track.default_volume || 0.35),
      loop: Boolean(track.loop_enabled),
      updatedAt: track.updated_at
    });
  } catch (error) {
    console.error('[api/audio/active] failed:', error);
    res.status(500).json({ ok: false, message: 'Unable to load the active audio.' });
  }
});

app.get('/admin/login', redirectIfAdmin, async (req, res, next) => {
  try {
    await render(
      res,
      'admin/login.ejs',
      {
        title: 'वाकीभ Admin Login',
        error: getError(req),
        notice: getNotice(req),
        email: '',
        bodyClass: 'admin-login-page'
      },
      'admin'
    );
  } catch (error) {
    next(error);
  }
});

app.post('/admin/login', redirectIfAdmin, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '').trim();
    const admin = await verifyAdminLogin(email, password);

    if (!admin) {
      await render(
        res,
        'admin/login.ejs',
        {
          title: 'वाकीभ Admin Login',
          error: 'Email किंवा password चुकीचा आहे.',
          notice: '',
          email,
          bodyClass: 'admin-login-page'
        },
        'admin'
      );
      return;
    }

    req.session.admin = admin;
    return res.redirect('/admin?notice=Welcome%20back');
  } catch (error) {
    next(error);
  }
});

app.post('/admin/logout', requireAdmin, async (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login?notice=Logged%20out');
  });
});

app.get('/admin', requireAdmin, async (req, res, next) => {
  try {
    const [stats, recentPosts, visitorStats, inquiryStats, websiteVisitorStats] = await Promise.all([
      getDashboardStats(),
      getRecentPosts(5),
      getVisitorStats(),
      getInquiryStats(),
      getWebsiteVisitorStats({ track: false })
    ]);

    await render(
      res,
      'admin/dashboard.ejs',
      {
        title: 'वाकीभ Admin Dashboard',
        stats,
        visitorStats,
        inquiryStats,
        websiteVisitorStats,
        recentPosts,
        currentUser: req.session.admin,
        notice: getNotice(req),
        activeNav: 'dashboard',
        formatDate,
        bodyClass: 'admin-dashboard-page'
      },
      'admin'
    );
  } catch (error) {
    next(error);
  }
});

function contactFilters(query = {}) {
  return {
    status: CONTACT_STATUSES.includes(query.status) ? query.status : 'all',
    search: String(query.search || '').trim(),
    range: ['today', '7', '30', 'custom'].includes(query.range) ? query.range : 'all',
    from: String(query.from || '').trim(),
    to: String(query.to || '').trim()
  };
}

app.get('/admin/contact-inquiries', requireAdmin, async (req, res, next) => {
  try {
    const filters = contactFilters(req.query);
    const [inquiries, inquiryStats] = await Promise.all([listInquiries(filters), getInquiryStats()]);
    await render(res, 'admin/contact-inquiries.ejs', {
      title: 'Contact Inquiries - Vaakibh Admin', inquiries, inquiryStats, filters,
      statuses: CONTACT_STATUSES, currentUser: req.session.admin,
      notice: getNotice(req), error: getError(req), activeNav: 'contact-inquiries',
      formatDate, bodyClass: 'admin-contact-inquiries-page'
    }, 'admin');
  } catch (error) { next(error); }
});

app.get('/admin/contact-inquiries/:id', requireAdmin, async (req, res, next) => {
  try {
    const inquiry = await getInquiry(req.params.id);
    if (!inquiry) return res.redirect('/admin/contact-inquiries?error=Inquiry%20not%20found.');
    await render(res, 'admin/contact-inquiry-detail.ejs', {
      title: `Inquiry #${inquiry.id} - Vaakibh Admin`, inquiry,
      statuses: CONTACT_STATUSES, currentUser: req.session.admin,
      notice: getNotice(req), error: getError(req), activeNav: 'contact-inquiries',
      formatDate, bodyClass: 'admin-contact-inquiries-page'
    }, 'admin');
  } catch (error) { next(error); }
});

app.post('/admin/contact-inquiries/:id/status', requireAdmin, async (req, res) => {
  try {
    await updateInquiryStatus(req.params.id, req.body.status, req.session.admin?.id);
    res.redirect(`/admin/contact-inquiries/${req.params.id}?notice=${encodeURIComponent('Inquiry status updated successfully.')}`);
  } catch (error) {
    res.redirect(`/admin/contact-inquiries/${req.params.id}?error=${encodeURIComponent(error.message || 'Status update failed.')}`);
  }
});

app.post('/admin/contact-inquiries/:id/notes', requireAdmin, async (req, res) => {
  try {
    await updateInquiryNotes(req.params.id, req.body.admin_notes);
    res.redirect(`/admin/contact-inquiries/${req.params.id}?notice=${encodeURIComponent('Admin notes saved successfully.')}`);
  } catch (error) {
    res.redirect(`/admin/contact-inquiries/${req.params.id}?error=${encodeURIComponent(error.message || 'Notes update failed.')}`);
  }
});

app.post('/admin/contact-inquiries/:id/delete', requireAdmin, async (req, res) => {
  try {
    await deleteInquiry(req.params.id);
    res.redirect(`/admin/contact-inquiries?notice=${encodeURIComponent('Inquiry deleted from the active list.')}`);
  } catch (error) {
    res.redirect(`/admin/contact-inquiries/${req.params.id}?error=${encodeURIComponent(error.message || 'Inquiry delete failed.')}`);
  }
});

app.get('/api/admin/contact-inquiries', requireAdmin, async (req, res) => {
  try { res.json({ ok: true, inquiries: await listInquiries(contactFilters(req.query)), stats: await getInquiryStats() }); }
  catch (error) { res.status(error.statusCode || 500).json({ ok: false, message: error.message }); }
});

app.get('/api/admin/contact-inquiries/:id', requireAdmin, async (req, res) => {
  try {
    const inquiry = await getInquiry(req.params.id);
    if (!inquiry) return res.status(404).json({ ok: false, message: 'Inquiry not found.' });
    res.json({ ok: true, inquiry });
  } catch (error) { res.status(error.statusCode || 500).json({ ok: false, message: error.message }); }
});

app.patch('/api/admin/contact-inquiries/:id/status', requireAdmin, async (req, res) => {
  try { await updateInquiryStatus(req.params.id, req.body.status, req.session.admin?.id); res.json({ ok: true }); }
  catch (error) { res.status(error.statusCode || 500).json({ ok: false, message: error.message }); }
});

app.patch('/api/admin/contact-inquiries/:id/notes', requireAdmin, async (req, res) => {
  try { await updateInquiryNotes(req.params.id, req.body.admin_notes); res.json({ ok: true }); }
  catch (error) { res.status(error.statusCode || 500).json({ ok: false, message: error.message }); }
});

app.delete('/api/admin/contact-inquiries/:id', requireAdmin, async (req, res) => {
  try { await deleteInquiry(req.params.id); res.json({ ok: true }); }
  catch (error) { res.status(error.statusCode || 500).json({ ok: false, message: error.message }); }
});

app.get('/admin/audio', requireAdmin, async (req, res, next) => {
  try {
    const tracks = await listAudioTracks();
    await render(
      res,
      'admin/audio.ejs',
      {
        title: 'Audio Management - Vaakibh Admin',
        tracks,
        activeTrack: tracks.find((track) => Boolean(track.is_active)) || null,
        currentUser: req.session.admin,
        notice: getNotice(req),
        error: getError(req),
        activeNav: 'audio',
        formatDate,
        bodyClass: 'admin-audio-page'
      },
      'admin'
    );
  } catch (error) {
    next(error);
  }
});

app.post('/admin/audio', requireAdmin, (req, res) => {
  audioUpload.single('audio_file')(req, res, async (uploadError) => {
    if (uploadError) {
      res.redirect(`/admin/audio?error=${encodeURIComponent(uploadError.message || 'Audio upload failed.')}`);
      return;
    }
    try {
      validateUploadedAudioSignature(req.file);
      await createAudioTrack({ body: req.body, file: req.file, uploadedBy: req.session.admin?.id });
      res.redirect(`/admin/audio?notice=${encodeURIComponent('Audio uploaded successfully.')}`);
    } catch (error) {
      removeFailedUpload(req.file);
      res.redirect(`/admin/audio?error=${encodeURIComponent(error.message || 'Audio upload failed.')}`);
    }
  });
});

app.post('/admin/audio/:id/update', requireAdmin, async (req, res) => {
  try {
    await updateAudioTrack(req.params.id, req.body);
    res.redirect(`/admin/audio?notice=${encodeURIComponent('Audio details updated successfully.')}`);
  } catch (error) {
    res.redirect(`/admin/audio?error=${encodeURIComponent(error.message || 'Audio update failed.')}`);
  }
});

app.post('/admin/audio/:id/replace', requireAdmin, (req, res) => {
  audioUpload.single('replacement_audio_file')(req, res, async (uploadError) => {
    if (uploadError) {
      res.redirect(`/admin/audio?error=${encodeURIComponent(uploadError.message || 'Audio replacement failed.')}`);
      return;
    }
    try {
      validateUploadedAudioSignature(req.file);
      await replaceAudioFile(req.params.id, req.file, AUDIO_UPLOAD_ROOT);
      res.redirect(`/admin/audio?notice=${encodeURIComponent('Audio file replaced successfully.')}`);
    } catch (error) {
      removeFailedUpload(req.file);
      res.redirect(`/admin/audio?error=${encodeURIComponent(error.message || 'Audio replacement failed.')}`);
    }
  });
});

app.post('/admin/audio/:id/activate', requireAdmin, async (req, res) => {
  try {
    await activateAudioTrack(req.params.id);
    res.redirect(`/admin/audio?notice=${encodeURIComponent('Website audio activated successfully.')}`);
  } catch (error) {
    res.redirect(`/admin/audio?error=${encodeURIComponent(error.message || 'Audio activation failed.')}`);
  }
});

app.post('/admin/audio/:id/deactivate', requireAdmin, async (req, res) => {
  try {
    await deactivateAudioTrack(req.params.id);
    res.redirect(`/admin/audio?notice=${encodeURIComponent('Audio deactivated.')}`);
  } catch (error) {
    res.redirect(`/admin/audio?error=${encodeURIComponent(error.message || 'Audio deactivation failed.')}`);
  }
});

app.post('/admin/audio/:id/delete', requireAdmin, async (req, res) => {
  try {
    await deleteAudioTrack(req.params.id, AUDIO_UPLOAD_ROOT);
    res.redirect(`/admin/audio?notice=${encodeURIComponent('Audio deleted successfully.')}`);
  } catch (error) {
    res.redirect(`/admin/audio?error=${encodeURIComponent(error.message || 'Audio delete failed.')}`);
  }
});

app.get('/admin/visitor-logins', requireAdmin, async (req, res, next) => {
  try {
    const [visitorStats, visitors] = await Promise.all([
      getVisitorStats(),
      listVisitorLogins(300)
    ]);
    await render(
      res,
      'admin/visitor-logins.ejs',
      {
        title: 'Visitor Logins - Vakibh Admin',
        visitors,
        visitorStats,
        currentUser: req.session.admin,
        notice: getNotice(req),
        activeNav: 'visitor-logins',
        formatDate,
        bodyClass: 'admin-visitor-logins-page'
      },
      'admin'
    );
  } catch (error) {
    next(error);
  }
});

app.get('/admin/comments', requireAdmin, async (req, res, next) => {
  try {
    const status = ['pending', 'approved', 'rejected'].includes(req.query.status)
      ? req.query.status
      : 'pending';
    const [comments, commentStats, pendingReplies] = await Promise.all([
      listComments(status),
      getCommentStats(),
      listPendingReplies()
    ]);

    await render(
      res,
      'admin/comments.ejs',
      {
        title: 'Blog Feedback - Vakibh Admin',
        comments,
        commentStats,
        pendingReplies,
        selectedStatus: status,
        currentUser: req.session.admin,
        notice: getNotice(req),
        error: getError(req),
        activeNav: 'comments',
        formatDate,
        bodyClass: 'admin-comments-page'
      },
      'admin'
    );
  } catch (error) {
    next(error);
  }
});

app.get('/admin/comments/:id', requireAdmin, async (req, res, next) => {
  try {
    const comment = await getCommentWithReplies(req.params.id);
    if (!comment) return res.redirect('/admin/comments?error=Feedback%20not%20found.');
    await render(res, 'admin/comment-detail.ejs', {
      title: `Feedback #${comment.id} - Vakibh Admin`, comment,
      currentUser: req.session.admin, notice: getNotice(req), error: getError(req),
      activeNav: 'comments', formatDate, bodyClass: 'admin-comments-page'
    }, 'admin');
  } catch (error) { next(error); }
});

app.post('/admin/comments/:id/status', requireAdmin, async (req, res) => {
  const returnStatus = ['pending', 'approved', 'rejected'].includes(req.body.return_status)
    ? req.body.return_status
    : 'pending';
  try {
    await updateCommentStatus(req.params.id, req.body.status);
    res.redirect(`/admin/comments?status=${encodeURIComponent(returnStatus)}&notice=${encodeURIComponent('Feedback updated successfully.')}`);
  } catch (error) {
    res.redirect(`/admin/comments?status=${encodeURIComponent(returnStatus)}&error=${encodeURIComponent(error.message || 'Feedback update failed.')}`);
  }
});

app.post('/admin/comments/:id/delete', requireAdmin, async (req, res) => {
  const returnStatus = ['pending', 'approved', 'rejected'].includes(req.body.return_status)
    ? req.body.return_status
    : 'pending';
  try {
    await deleteComment(req.params.id);
    res.redirect(`/admin/comments?status=${encodeURIComponent(returnStatus)}&notice=${encodeURIComponent('Feedback deleted successfully.')}`);
  } catch (error) {
    res.redirect(`/admin/comments?status=${encodeURIComponent(returnStatus)}&error=${encodeURIComponent(error.message || 'Feedback delete failed.')}`);
  }
});

app.post('/admin/replies/:id/status', requireAdmin, async (req, res) => {
  const feedbackId = Number(req.body.feedback_id);
  try {
    await updateReplyStatus(req.params.id, req.body.status);
    const returnTo = req.body.return_to === 'list' ? '/admin/comments' : `/admin/comments/${feedbackId}`;
    res.redirect(`${returnTo}?notice=${encodeURIComponent('Reply updated successfully.')}`);
  } catch (error) {
    res.redirect(`/admin/comments/${feedbackId}?error=${encodeURIComponent(error.message || 'Reply update failed.')}`);
  }
});

app.post('/admin/replies/:id/delete', requireAdmin, async (req, res) => {
  const feedbackId = Number(req.body.feedback_id);
  try {
    await deleteReply(req.params.id);
    const returnTo = req.body.return_to === 'list' ? '/admin/comments' : `/admin/comments/${feedbackId}`;
    res.redirect(`${returnTo}?notice=${encodeURIComponent('Reply deleted successfully.')}`);
  } catch (error) {
    res.redirect(`/admin/comments/${feedbackId}?error=${encodeURIComponent(error.message || 'Reply delete failed.')}`);
  }
});
app.get('/admin/posts/import-blogger', requireAdmin, async (req, res, next) => {
  try {
    await render(
      res,
      'admin/import-blogger.ejs',
      {
        title: 'Import from Blogger - Vakibh Admin',
        currentUser: req.session.admin,
        notice: getNotice(req),
        error: getError(req),
        activeNav: 'import-blogger',
        preview: null,
        summary: null,
        selectedMode: 'new_only',
        formatDate,
        bodyClass: 'admin-import-page'
      },
      'admin'
    );
  } catch (error) {
    next(error);
  }
});

app.post('/admin/posts/import-blogger/preview', requireAdmin, (req, res, next) => {
  bloggerImportUpload.single('blogger_feed')(req, res, async (uploadError) => {
    try {
      if (uploadError) throw uploadError;
      if (!req.file) {
        const error = new Error('Please upload a .atom or .xml Blogger export file.');
        error.statusCode = 400;
        throw error;
      }

      const preview = await buildImportPreview(req.file.path);
      await render(
        res,
        'admin/import-blogger.ejs',
        {
          title: 'Import from Blogger - Vakibh Admin',
          currentUser: req.session.admin,
          notice: '',
          error: '',
          activeNav: 'import-blogger',
          preview,
          summary: null,
          selectedMode: req.body.duplicate_mode || 'new_only',
          formatDate,
          bodyClass: 'admin-import-page'
        },
        'admin'
      );
    } catch (error) {
      await render(
        res,
        'admin/import-blogger.ejs',
        {
          title: 'Import from Blogger - Vakibh Admin',
          currentUser: req.session.admin,
          notice: '',
          error: error.message || 'Could not read the Blogger feed.',
          activeNav: 'import-blogger',
          preview: null,
          summary: null,
          selectedMode: req.body.duplicate_mode || 'new_only',
          formatDate,
          bodyClass: 'admin-import-page'
        },
        'admin'
      );
    }
  });
});

app.post('/admin/posts/import-blogger/run', requireAdmin, async (req, res, next) => {
  try {
    const filePath = resolveImportFile(req.body.import_file);
    const mode = ['new_only', 'update_existing', 'skip_duplicates'].includes(req.body.duplicate_mode)
      ? req.body.duplicate_mode
      : 'new_only';
    const preview = await buildImportPreview(filePath);
    const summary = await importBloggerFeed(filePath, mode);

    await render(
      res,
      'admin/import-blogger.ejs',
      {
        title: 'Import from Blogger - Vakibh Admin',
        currentUser: req.session.admin,
        notice: 'Blogger import completed.',
        error: '',
        activeNav: 'import-blogger',
        preview,
        summary,
        selectedMode: mode,
        formatDate,
        bodyClass: 'admin-import-page'
      },
      'admin'
    );
  } catch (error) {
    try {
      await render(
        res,
        'admin/import-blogger.ejs',
        {
          title: 'Import from Blogger - Vakibh Admin',
          currentUser: req.session.admin,
          notice: '',
          error: error.message || 'Import failed.',
          activeNav: 'import-blogger',
          preview: null,
          summary: null,
          selectedMode: req.body.duplicate_mode || 'new_only',
          formatDate,
          bodyClass: 'admin-import-page'
        },
        'admin'
      );
    } catch (renderError) {
      next(renderError);
    }
  }
});
// Backward-compatible alias for the admin sidebar's Blogs tab.
app.get(['/admin/blogs', '/admin/blogs/'], requireAdmin, (req, res) => {
  res.redirect('/admin/posts');
});
app.get('/admin/posts', requireAdmin, async (req, res, next) => {
  try {
    const posts = await listAllPosts();
    await render(
      res,
      'admin/posts.ejs',
      {
        title: 'वाकीभ Blog Management',
        posts,
        currentUser: req.session.admin,
        notice: getNotice(req),
        error: getError(req),
        activeNav: 'posts',
        formatDate,
        bodyClass: 'admin-posts-page'
      },
      'admin'
    );
  } catch (error) {
    next(error);
  }
});

async function renderAdminCategoriesPage(req, res, next) {
  try {
    await render(
      res,
      'admin/categories.ejs',
      {
        title: 'Blog Categories - Vakibh Admin',
        categories: await listCategories(),
        currentUser: req.session.admin,
        notice: getNotice(req),
        error: getError(req),
        activeNav: 'categories',
        bodyClass: 'admin-categories-page'
      },
      'admin'
    );
  } catch (error) {
    next(error);
  }
}

app.get('/admin/categories', requireAdmin, renderAdminCategoriesPage);
app.get('/admin/categories/', requireAdmin, renderAdminCategoriesPage);

app.post('/admin/categories', requireAdmin, async (req, res) => {
  try {
    await createCategory(req.body.name);
    res.redirect(`/admin/categories?notice=${encodeURIComponent('Category created successfully.')}`);
  } catch (error) {
    res.redirect(`/admin/categories?error=${encodeURIComponent(error.message || 'Category तयार करता आली नाही.')}`);
  }
});

app.post('/admin/categories/:id/delete', requireAdmin, async (req, res) => {
  try {
    await deleteCategory(req.params.id);
    res.redirect(`/admin/categories?notice=${encodeURIComponent('Category deleted successfully.')}`);
  } catch (error) {
    res.redirect(`/admin/categories?error=${encodeURIComponent(error.message || 'Category delete करता आली नाही.')}`);
  }
});

app.get('/admin/posts/new', requireAdmin, async (req, res, next) => {
  try {
    const nextSortOrder = await getNextSortOrder();
    const post = prepareFormPost(makeDefaultPost(nextSortOrder), nextSortOrder);

    await render(
      res,
      'admin/form.ejs',
      {
        title: 'नवीन ब्लॉग लेख',
        post,
        mode: 'new',
        actionUrl: '/admin/posts',
        currentUser: req.session.admin,
        activeNav: 'new-post',
        nextSortOrder,
        notice: getNotice(req),
        error: getError(req),
        formatDate,
        toDateTimeLocal,
        categories: await listCategories(),
        bodyClass: 'admin-editor-page'
      },
      'admin'
    );
  } catch (error) {
    next(error);
  }
});

app.post('/admin/posts', requireAdmin, upload.single('featured_image_file'), async (req, res, next) => {
  try {
    const post = await createBlogPost({
      body: req.body,
      filePath: uploadedImagePath(req.file)
    });

    res.redirect(`/admin/posts/${post.id}/edit?notice=${encodeURIComponent('Blog created successfully.')}`);
  } catch (error) {
    try {
      const nextSortOrder = await getNextSortOrder();
      await render(
        res,
        'admin/form.ejs',
        {
          title: 'नवीन ब्लॉग लेख',
          post: prepareFormPost({
            ...req.body,
            featured_image: req.body.featured_image || '/assests/hero-bg.jpg',
            status: req.body.status || 'published'
          }, nextSortOrder),
          mode: 'new',
          actionUrl: '/admin/posts',
          currentUser: req.session.admin,
          activeNav: 'new-post',
          nextSortOrder,
          notice: '',
          error: error.message || 'Could not save the post.',
          formatDate,
          toDateTimeLocal,
          categories: await listCategories(),
          bodyClass: 'admin-editor-page'
        },
        'admin'
      );
    } catch (renderError) {
      next(renderError);
    }
  }
});

app.get('/admin/posts/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) {
      return res.redirect('/admin/posts?notice=Post%20not%20found');
    }

    const nextSortOrder = await getNextSortOrder();
    await render(
      res,
      'admin/form.ejs',
      {
        title: `Edit - ${post.title}`,
        post: prepareFormPost(post, nextSortOrder),
        mode: 'edit',
        actionUrl: `/admin/posts/${post.id}`,
        currentUser: req.session.admin,
        activeNav: 'posts',
        nextSortOrder,
        notice: getNotice(req),
        error: getError(req),
        formatDate,
        toDateTimeLocal,
        categories: await listCategories(),
        bodyClass: 'admin-editor-page'
      },
      'admin'
    );
  } catch (error) {
    next(error);
  }
});

app.post('/admin/posts/:id', requireAdmin, upload.single('featured_image_file'), async (req, res, next) => {
  try {
    const post = await updateBlogPost(req.params.id, {
      body: req.body,
      filePath: uploadedImagePath(req.file)
    });

    res.redirect(`/admin/posts/${post.id}/edit?notice=${encodeURIComponent('Blog updated successfully.')}`);
  } catch (error) {
    try {
      const existingPost = await getPostById(req.params.id);
      if (!existingPost) {
        return res.redirect('/admin/posts?notice=Post%20not%20found');
      }

      const nextSortOrder = await getNextSortOrder();
      await render(
        res,
        'admin/form.ejs',
        {
          title: `Edit - ${existingPost.title}`,
          post: prepareFormPost(
            {
              ...existingPost,
              ...req.body,
              featured_image: req.body.featured_image || existingPost.featured_image,
              status: req.body.status || existingPost.status
            },
            nextSortOrder
          ),
          mode: 'edit',
          actionUrl: `/admin/posts/${existingPost.id}`,
          currentUser: req.session.admin,
          activeNav: 'posts',
          nextSortOrder,
          notice: '',
          error: error.message || 'Could not update the post.',
          formatDate,
          toDateTimeLocal,
          categories: await listCategories(),
          bodyClass: 'admin-editor-page'
        },
        'admin'
      );
    } catch (renderError) {
      next(renderError);
    }
  }
});

app.post('/admin/posts/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    const deleted = await deleteBlogPost(req.params.id);
    if (!deleted) {
      return res.redirect('/admin/posts?error=Post%20not%20found.');
    }
    res.redirect('/admin/posts?notice=Blog%20deleted%20successfully.');
  } catch (error) {
    next(error);
  }
});

// Public blog pages are already generated in Vakibh-media/blog. Serve those
// files directly so the footer link shows every imported/live blog, even when
// the local admin database has not been populated from Blogger yet.
app.get('/blog/index.html', (req, res) => res.redirect(301, '/blog/'));

app.get('/blog/:slug/index.html', (req, res) => {
  res.redirect(301, `/blog/${encodeURIComponent(req.params.slug)}/`);
});

app.get('/blog/:slug/', async (req, res, next) => {
  const slug = String(req.params.slug || '').toLowerCase();
  if (!/^[a-z0-9-]+$/.test(slug)) return next();
  if (!req.path.endsWith('/')) return res.redirect(301, `/blog/${slug}/`);
  const blogFile = path.join(SITE_ROOT, 'blog', req.params.slug, 'index.html');
  if (fs.existsSync(blogFile)) return res.sendFile(blogFile);
  try {
    const replacement = await getBlogSlugRedirect(slug);
    if (replacement) return res.redirect(301, `/blog/${replacement}/`);
    return next();
  } catch (error) { return next(error); }
});

app.get('/blog/index.html', async (req, res, next) => {
  try {
    const posts = await listPublishedPosts();
    await render(
      res,
      'public/blog-index.ejs',
      {
        title: 'वाकीभ ब्लॉग - संत साहित्याचा डिजिटल ठेवा',
        description:
          'वाकीभ ब्लॉगमध्ये संत साहित्य, नामस्मरण, अभंग वाचन आणि वारकरी परंपरेवरील निवडक लेख वाचा.',
        posts,
        bodyClass: 'blog-page'
      },
      'public'
    );
  } catch (error) {
    next(error);
  }
});

app.get('/blog/:slug/index.html', async (req, res, next) => {
  try {
    const post = await getPostBySlug(req.params.slug, { publishedOnly: true });

    if (!post) {
      const html = await renderPage(
        'public/not-found.ejs',
        {
          title: 'लेख सापडला नाही',
          heading: 'लेख सापडला नाही',
          message: 'हा ब्लॉग लेख सध्या उपलब्ध नाही.',
          bodyClass: 'blog-page'
        },
        'public'
      );

      return res.status(404).send(html);
    }

    await render(
      res,
      'public/blog-post.ejs',
      {
        title: post.meta_title || `${post.title} - वाकीभ ब्लॉग`,
        description: post.meta_description || post.excerpt,
        post: {
          ...post,
          content_html: removeDuplicateFeaturedImage(post.content_html, post.featured_image)
        },
        bodyClass: 'blog-post-page',
        formatDate
      },
      'public'
    );
  } catch (error) {
    next(error);
  }
});

app.get('/sants/dnyaneshwar/amrut', (req, res) => {
  res.redirect(301, '/sants/dnyaneshwar/amrutanubhav/index.html');
});

app.get('/sant/:santSlug/abhang/:range', (req, res, next) => {
  const santSlug = String(req.params.santSlug || '').toLowerCase();
  const range = String(req.params.range || '').toLowerCase();
  if (!/^[a-z0-9-]+$/.test(santSlug) || !/^\d+-\d+$/.test(range)) return next();

  const [start, end] = range.split('-');
  const candidates = [
    path.join(SITE_ROOT, 'sants', santSlug, 'abhang-' + start + '-to-' + end, 'index.html'),
    path.join(SITE_ROOT, 'sants', santSlug, 'abhang-' + start + '-' + end, 'index.html')
  ];
  const found = candidates.find((file) => fs.existsSync(file));
  if (!found) return next();

  const relative = path.relative(path.join(SITE_ROOT, 'sants', santSlug), path.dirname(found)).replace(/\\/g, '/');
  res.redirect(301, '/sants/' + santSlug + '/' + relative + '/index.html');
});

app.get('/blog/:slug', (req, res) => {
  res.redirect(301, `/blog/${req.params.slug}/`);
});

app.use(express.static(SITE_ROOT));

app.use(async (err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);

  const status = err.statusCode || 500;
  const title = status === 404 ? 'पृष्ठ सापडले नाही' : 'सर्व्हर त्रुटी';
  const message = err.message || 'Unexpected error occurred.';

  if (req.path.startsWith('/admin')) {
    return res.status(status).send(`
      <!DOCTYPE html>
      <html lang="mr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Hind:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Hind', sans-serif; padding: 2rem; background: #f7ebda; color: #241a13; }
            .card { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 20px; padding: 1.5rem; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
            a { color: #8a3716; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${title}</h1>
            <p>${message}</p>
            <p><a href="/admin">Back to dashboard</a></p>
          </div>
        </body>
      </html>
    `);
  }

  return res.status(status).send(`
    <!DOCTYPE html>
    <html lang="mr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Hind:wght@400;500;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="font-family: 'Hind', sans-serif; padding: 2rem; background: #fcf5eb; color: #241a13;">
        <h1>${title}</h1>
        <p>${message}</p>
        <p><a href="/blog/index.html">Back to blog</a></p>
      </body>
    </html>
  `);
});

async function start() {
  app.listen(PORT, () => {
    console.log(`Vakibh backend running on http://127.0.0.1:${PORT}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start Vakibh backend:', error);
    process.exit(1);
  });
}

module.exports = app;









