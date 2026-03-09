/**
 * routes/auth.js — Authentication routes
 * POST /api/auth/signup
 * POST /api/auth/login
 * GET  /api/auth/google
 * GET  /api/auth/google/callback
 * GET  /api/auth/me
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/mailer');

const SALT_ROUNDS = 12;
const JWT_EXPIRES = '7d';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ── Sign Up ─────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Validate
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    // Check duplicate
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query(
      `INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role`,
      [name.trim(), email.toLowerCase(), hashed, phone || null]
    );

    const user = result.rows[0];
    const token = signToken(user);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      message: `Welcome to Creative Art Academy, ${user.name}! 🎨`,
    });
  } catch (err) {
    console.error('[Auth/signup]', err.message);
    res.status(500).json({ error: 'Sign-up failed. Please try again.' });
  }
});

// ── Log In ──────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[Auth/login]', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── Me (protected) ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, phone, role, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user.' });
  }
});

// ── Google OAuth (placeholder — configure with passport-google-oauth20) ─────
router.get('/google', (req, res) => {
  // In production: passport.authenticate('google', { scope: ['profile', 'email'] })
  res.json({ message: 'Google OAuth: configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env' });
});

module.exports = router;
