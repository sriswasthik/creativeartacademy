/**
 * routes/classes.js
 * GET    /api/classes          — list all active classes
 * GET    /api/classes/:id      — single class
 * POST   /api/classes          — create (admin)
 * PUT    /api/classes/:id      — update (admin)
 * DELETE /api/classes/:id      — delete (admin)
 */

const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// List all active
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM classes WHERE is_active = TRUE ORDER BY created_at ASC'
    );
    res.json({ classes: rows });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch classes.' });
  }
});

// Single class
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM classes WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Class not found.' });
    res.json({ class: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch class.' });
  }
});

// Create (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { title, description, price, age_group, image_url, tag, max_students } = req.body;
  if (!title || !description || !price) {
    return res.status(400).json({ error: 'Title, description, and price are required.' });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO classes (title, description, price, age_group, image_url, tag, max_students)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description, price, age_group, image_url, tag, max_students || 10]
    );
    res.status(201).json({ class: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Could not create class.' });
  }
});

// Update (admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { title, description, price, age_group, image_url, tag, max_students, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE classes SET
         title=$1, description=$2, price=$3, age_group=$4,
         image_url=$5, tag=$6, max_students=$7, is_active=$8
       WHERE id=$9 RETURNING *`,
      [title, description, price, age_group, image_url, tag, max_students, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Class not found.' });
    res.json({ class: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Could not update class.' });
  }
});

// Delete (admin only) — soft delete
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE classes SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Class deactivated.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete class.' });
  }
});

module.exports = router;
