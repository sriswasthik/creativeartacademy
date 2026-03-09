/**
 * routes/gallery.js
 */
const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM gallery ORDER BY uploaded_at DESC');
  res.json({ gallery: rows });
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { image_url, caption, student_name, class_id, is_featured } = req.body;
  if (!image_url) return res.status(400).json({ error: 'image_url required.' });
  const { rows } = await db.query(
    `INSERT INTO gallery (image_url, caption, student_name, class_id, is_featured) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [image_url, caption, student_name, class_id || null, is_featured || false]
  );
  res.status(201).json({ item: rows[0] });
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await db.query('DELETE FROM gallery WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted.' });
});

module.exports = router;
