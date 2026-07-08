# Vakibh Blog Backend

Node/Express + MySQL backend for the Vakibh site. The existing static frontend lives in `Vakibh-media/`, and the new backend/admin shell lives at the workspace root.

## What You Get

- Public blog list at `/blog/index.html`
- Public blog detail pages at `/blog/:slug/index.html`
- Admin login at `/admin/login`
- Admin dashboard
- Blog create, update, delete
- MySQL-backed storage in `vakibh`
- Seeded data from the existing three blog pages

## Setup

1. Ensure MySQL is running locally.
2. Review `.env.example` and create a matching `.env` if needed.
3. Install dependencies:

```bash
npm install
```

4. Start the backend:

```bash
npm start
```

## URLs

- Public blog: `http://127.0.0.1:3000/blog/index.html`
- Admin login: `http://127.0.0.1:3000/admin/login`

## Default Admin

- Email: `admin@vakibh.local`
- Password: `Admin@123`

## Database

- Database name: `vakibh`
- Tables are created automatically on startup
- Existing blog posts from the static site are seeded automatically if the `blog_posts` table is empty

## Notes

- Blog images can use either a local upload or a direct image path such as `/assests/pandharpur.webp`
- The admin form accepts HTML content for the article body
- Uploaded files are stored under `uploads/blog/`
