# Moderated Comment Board

A simple, fully-functional moderated comment system that works in any modern browser without a backend server.

## What It Does

- **Public Page** (`index.html`): Visitors can submit comments
- **Moderation Queue**: Comments are held for review before appearing publicly
- **Admin Panel** (`admin.html`): Administrator can approve or reject comments
- **Stats Dashboard**: See counts of pending, approved, and rejected comments

## How to Use

### 1. Open the Public Page
```
Open index.html in your browser
```
- Fill out the comment form (name, email, message)
- Submit — you'll see a confirmation that it's awaiting moderation
- The comment won't appear publicly until approved

### 2. Open the Admin Panel
```
Open admin.html in your browser
```
- See all pending comments waiting for review
- Click **Approve** to make a comment public
- Click **Reject** to remove it
- Use **Approve All** or **Reject All** for bulk actions
- Switch tabs to see approved or rejected comments

### 3. View Approved Comments
Go back to `index.html` — approved comments now appear in the discussion section.

## How It Works

Comments are stored in your browser's **localStorage** — no server needed! This means:
- ✅ Works instantly with no setup
- ✅ No database to configure
- ⚠️ Data is stored only on YOUR computer (others won't see the same comments)
- ⚠️ Clearing browser data will delete all comments

## Files

| File | Purpose |
|------|---------|
| `index.html` | Public comment board with submission form |
| `admin.html` | Admin panel for moderation |
| `style.css` | Shared styles (modern, clean design) |
| `app.js` | Public page functionality |
| `admin.js` | Admin panel functionality |

## For Production Use

To make this work for multiple users across the internet, you'd need:
1. A backend server (Node.js, Python, PHP, etc.)
2. A database (PostgreSQL, MongoDB, etc.)
3. User authentication for the admin panel
4. Hosting (Vercel, Netlify, AWS, etc.)

## Browser Support

Works in all modern browsers: Chrome, Firefox, Safari, Edge.

---

Built for Yonas 🎓
