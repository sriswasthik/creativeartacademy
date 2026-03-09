/**
 * routes/admin.js — Admin panel routes
 * GET /admin          — admin dashboard HTML
 * GET /api/admin/*    — admin API endpoints (auth-guarded)
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../models/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Serve admin HTML
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// ── Admin API: Dashboard stats ────────────────────────────────────────────────
router.get('/api/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [users, classes, enrollments, revenue, messages] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users WHERE role = $1', ['student']),
      db.query('SELECT COUNT(*) FROM classes WHERE is_active = TRUE'),
      db.query('SELECT COUNT(*) FROM enrollments WHERE payment_status = $1', ['paid']),
      db.query('SELECT COALESCE(SUM(amount_paid),0) AS total FROM enrollments WHERE payment_status = $1', ['paid']),
      db.query('SELECT COUNT(*) FROM contact_messages WHERE is_read = FALSE'),
    ]);
    res.json({
      totalStudents: parseInt(users.rows[0].count),
      activeClasses: parseInt(classes.rows[0].count),
      paidEnrollments: parseInt(enrollments.rows[0].count),
      totalRevenue: parseInt(revenue.rows[0].total),
      unreadMessages: parseInt(messages.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch stats.' });
  }
});

// ── Admin API: All users ───────────────────────────────────────────────────────
router.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC'
  );
  res.json({ users: rows });
});

// ── Admin API: All enrollments ────────────────────────────────────────────────
router.get('/api/enrollments', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await db.query(`
    SELECT e.id, e.payment_status, e.amount_paid, e.enrolled_at,
           u.name AS student_name, u.email AS student_email,
           c.title AS class_title
    FROM enrollments e
    JOIN users u ON u.id = e.user_id
    JOIN classes c ON c.id = e.class_id
    ORDER BY e.enrolled_at DESC
  `);
  res.json({ enrollments: rows });
});

// ── Admin API: Testimonials (approve/delete) ──────────────────────────────────
router.get('/api/testimonials', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM testimonials ORDER BY created_at DESC');
  res.json({ testimonials: rows });
});

router.patch('/api/testimonials/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  await db.query('UPDATE testimonials SET is_approved=TRUE WHERE id=$1', [req.params.id]);
  res.json({ message: 'Testimonial approved.' });
});

router.delete('/api/testimonials/:id', requireAuth, requireAdmin, async (req, res) => {
  await db.query('DELETE FROM testimonials WHERE id=$1', [req.params.id]);
  res.json({ message: 'Testimonial deleted.' });
});

// ── Admin API: Contact messages ────────────────────────────────────────────────
router.get('/api/messages', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
  res.json({ messages: rows });
});

router.patch('/api/messages/:id/read', requireAuth, requireAdmin, async (req, res) => {
  await db.query('UPDATE contact_messages SET is_read=TRUE WHERE id=$1', [req.params.id]);
  res.json({ message: 'Marked as read.' });
});

module.exports = router;
