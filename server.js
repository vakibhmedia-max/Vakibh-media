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
  getNextSortOrder,
  getPostById,
  getPostBySlug,
  getRecentPosts,
  listAllPosts,
  listPublishedPosts,
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

const ROOT = __dirname;
const SITE_ROOT = path.join(ROOT, 'Vakibh-media');
const UPLOAD_ROOT = path.join(ROOT, 'uploads', 'blog');
const BLOGGER_IMPORT_ROOT = path.join(ROOT, 'uploads', 'blogger-import');
const PORT = Number(process.env.PORT || 3000);

fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
fs.mkdirSync(BLOGGER_IMPORT_ROOT, { recursive: true });

const app = express();
let backendReadyPromise = null;

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
    category: 'वाकीभ ब्लॉग',
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
    category: resolved.category || 'वाकीभ ब्लॉग',
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
    req.path === '/blog' ||
    req.path.startsWith('/blog/') ||
    req.path.startsWith('/api/visitor-login/');

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

app.get('/blog/', (req, res) => res.redirect('/blog/index.html'));

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
    const [stats, recentPosts, visitorStats] = await Promise.all([
      getDashboardStats(),
      getRecentPosts(5),
      getVisitorStats()
    ]);

    await render(
      res,
      'admin/dashboard.ejs',
      {
        title: 'वाकीभ Admin Dashboard',
        stats,
        visitorStats,
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
        post,
        bodyClass: 'blog-post-page',
        formatDate
      },
      'public'
    );
  } catch (error) {
    next(error);
  }
});

app.get('/blog/:slug', (req, res) => {
  res.redirect(`/blog/${req.params.slug}/index.html`);
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
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; background: #f7ebda; color: #241a13; }
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
      </head>
      <body style="font-family: Arial, sans-serif; padding: 2rem; background: #fcf5eb; color: #241a13;">
        <h1>${title}</h1>
        <p>${message}</p>
        <p><a href="/blog/index.html">Back to blog</a></p>
      </body>
    </html>
  `);
});

async function start() {
  await ensureBackendReady();

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







