/**
 * Creative Art Academy 2026 — Express Server
 * Node.js + Express + PostgreSQL (Supabase)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'unpkg.com', 'fonts.googleapis.com', 'js.stripe.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'images.unsplash.com', '*.openstreetmap.org'],
      frameSrc: ["'self'", 'www.openstreetmap.org', 'js.stripe.com'],
      connectSrc: ["'self'", 'api.stripe.com'],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts, please try again later.' },
});
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ─── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Serve static frontend ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ────────────────────────────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const classRoutes    = require('./routes/classes');
const enrollRoutes   = require('./routes/enrollments');
const galleryRoutes  = require('./routes/gallery');
const testiRoutes    = require('./routes/testimonials');
const contactRoutes  = require('./routes/contact');
const adminRoutes    = require('./routes/admin');
const paymentRoutes  = require('./routes/payments');

app.use('/api/auth',         authRoutes);
app.use('/api/classes',      classRoutes);
app.use('/api/enrollments',  enrollRoutes);
app.use('/api/gallery',      galleryRoutes);
app.use('/api/testimonials', testiRoutes);
app.use('/api/contact',      contactRoutes);
app.use('/api/payments',     paymentRoutes);
app.use('/admin',            adminRoutes);

// ─── Stripe webhook (raw body required) ───────────────────────────────────────
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/payments').webhook
);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Creative Art Academy 2026' });
});

// ─── Catch-all: serve SPA ─────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎨  Creative Art Academy server running`);
  console.log(`   → http://localhost:${PORT}`);
  console.log(`   → Admin: http://localhost:${PORT}/admin`);
  console.log(`   → API:   http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
