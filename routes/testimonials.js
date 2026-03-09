// routes/testimonials.js
const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM testimonials WHERE is_approved=TRUE ORDER BY created_at DESC'
  );
  res.json({ testimonials: rows });
});

router.post('/', requireAuth, async (req, res) => {
  const { body, rating, author_detail } = req.body;
  if (!body) return res.status(400).json({ error: 'Testimonial text required.' });
  const userResult = await db.query('SELECT name FROM users WHERE id=$1', [req.user.id]);
  const name = userResult.rows[0]?.name || 'Anonymous';
  const { rows } = await db.query(
    `INSERT INTO testimonials (user_id, author_name, author_detail, body, rating) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.id, name, author_detail, body, Math.min(5, Math.max(1, parseInt(rating) || 5))]
  );
  res.status(201).json({ testimonial: rows[0], message: 'Thank you! Your review is pending approval.' });
});

module.exports = router;
