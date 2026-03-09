# 🎨 Creative Art Academy 2026

> *A warm, slightly chaotic art school in Hyderabad. This is its website.*

Full-stack website for Creative Art Academy 2026 — offering hands-on drawing, painting, and creative workshops for kids and adults in Hyderabad, India.

---

## ✨ Features

- **Frontend**: Hand-crafted HTML/CSS/JS with organic, human-designed feel
- **Backend**: Node.js + Express REST API
- **Database**: PostgreSQL via Supabase
- **Auth**: JWT email/password + Google OAuth ready
- **Payments**: Stripe (test mode) for class bookings
- **Email**: Nodemailer notifications for sign-ups & enrollments
- **Admin Panel**: `/admin` dashboard for CRUD operations
- **Student Dashboard**: View enrollments, upload artwork

---

## 📁 Folder Structure

```
creative-art-academy/
├── public/
│   └── index.html          ← Main frontend (single-page)
├── admin/
│   └── index.html          ← Admin dashboard
├── routes/
│   ├── auth.js             ← Signup, login, Google OAuth
│   ├── classes.js          ← CRUD for classes
│   ├── enrollments.js      ← Student enrollments
│   ├── gallery.js          ← Gallery management
│   ├── testimonials.js     ← Reviews
│   ├── contact.js          ← Contact form
│   ├── payments.js         ← Stripe integration
│   └── admin.js            ← Admin API
├── models/
│   ├── db.js               ← PostgreSQL pool
│   └── migrate.js          ← DB schema + seed data
├── middleware/
│   └── auth.js             ← JWT middleware
├── utils/
│   └── mailer.js           ← Nodemailer templates
├── server.js               ← Express app entry point
├── package.json
├── .env.example            ← Environment variable template
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- A [Supabase](https://supabase.com) account (free tier works)
- A [Stripe](https://stripe.com) account (test mode)

### 1. Clone & Install

```bash
git clone <your-repo-url> creative-art-academy
cd creative-art-academy
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual values (see comments inside)
```

**Minimum required vars to get started:**
```
DATABASE_URL=postgresql://...  (from Supabase)
JWT_SECRET=any_long_random_string
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Set Up Database

```bash
# Run migrations (creates all tables + seeds sample data)
npm run db:migrate
```

### 4. Start the Server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Visit: **http://localhost:3000**
Admin: **http://localhost:3000/admin**

---

## 🗄️ Database Schema

| Table | Key columns |
|-------|-------------|
| `users` | id, email, password, name, role (student/admin) |
| `classes` | id, title, price (paise), description, is_active |
| `enrollments` | user_id, class_id, payment_id, payment_status |
| `gallery` | id, image_url, caption, is_featured |
| `testimonials` | id, author_name, body, rating, is_approved |
| `contact_messages` | id, name, email, message, is_read |
| `artworks` | user_id, class_id, image_url (student uploads) |

---

## 💳 Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Copy **Test mode** keys from Dashboard → Developers → API Keys
3. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
4. For webhooks (local testing): install [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   # Copy the webhook secret to STRIPE_WEBHOOK_SECRET in .env
   ```

---

## 📧 Email Setup (Gmail)

1. Enable 2-Factor Authentication on Gmail
2. Go to: myaccount.google.com/apppasswords
3. Create an App Password for "Mail"
4. Add to `.env`:
   ```
   SMTP_USER=your@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  (16-char app password)
   ```

---

## 🔑 Create Admin User

After running migrations, update a user's role in Supabase:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```
Or via Supabase Table Editor → users → change role to `admin`.

---

## 🌐 Deploy to Vercel

```bash
npm install -g vercel
vercel

# Set environment variables in Vercel dashboard:
# Settings → Environment Variables → paste from .env
```

Add a `vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--cream` | `#F5F5F0` | Page background |
| `--taupe` | `#8B7355` | Secondary text |
| `--terracotta` | `#E07A5F` | Primary accent, CTAs |
| `--sage` | `#4A7C59` | Secondary accent |
| `--ink` | `#2A2420` | Dark text |
| Montserrat | 700/300 | Headings |
| Open Sans | 400/600 | Body text |
| Caveat | italic | Quotes, handwritten feel |

---

## 📞 Contact

Creative Art Academy 2026  
Plot 14, Road No. 2, Banjara Hills, Hyderabad — 500034  
📱 +91 98765 43210  
📧 hello@creativeartacademy.in  
📸 [@creative_artacademy2026](https://www.instagram.com/creative_artacademy2026)

---

*Made with ♥ and a lot of paint — Hyderabad, 2026*
