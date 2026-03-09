// routes/enrollments.js
const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');

// My enrollments
router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await db.query(`
    SELECT e.*, c.title, c.image_url, c.tag, c.price
    FROM enrollments e JOIN classes c ON c.id = e.class_id
    WHERE e.user_id=$1 ORDER BY e.enrolled_at DESC
  `, [req.user.id]);
  res.json({ enrollments: rows });
});

module.exports = router;
