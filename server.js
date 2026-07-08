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
const { formatDate, toDateTimeLocal } = require('./backend/lib/utils');

const ROOT = __dirname;
const SITE_ROOT = path.join(ROOT, 'Vakibh-media');
const UPLOAD_ROOT = path.join(ROOT, 'uploads', 'blog');
const PORT = Number(process.env.PORT || 3000);

fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const app = express();

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

app.get('/blog/', (req, res) => res.redirect('/blog/index.html'));

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
    const [stats, recentPosts] = await Promise.all([
      getDashboardStats(),
      getRecentPosts(5)
    ]);

    await render(
      res,
      'admin/dashboard.ejs',
      {
        title: 'वाकीभ Admin Dashboard',
        stats,
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
        title: `${post.title} - वाकीभ ब्लॉग`,
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
  await initPool();
  await bootstrapDatabase();

  app.listen(PORT, () => {
    console.log(`Vakibh backend running on http://127.0.0.1:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start Vakibh backend:', error);
  process.exit(1);
});
