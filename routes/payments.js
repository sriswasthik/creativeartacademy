/**
 * routes/payments.js — Stripe payment integration
 * POST /api/payments/create-intent   — create PaymentIntent
 * POST /api/payments/webhook         — Stripe webhook handler
 */

const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');
const { sendEnrollmentConfirmation } = require('../utils/mailer');

// Initialise Stripe (test mode)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// ── Create Payment Intent ─────────────────────────────────────────────────────
router.post('/create-intent', requireAuth, async (req, res) => {
  const { class_id, name, phone } = req.body;

  if (!class_id) {
    return res.status(400).json({ error: 'class_id is required.' });
  }

  try {
    // Fetch class
    const classResult = await db.query('SELECT * FROM classes WHERE id = $1 AND is_active = TRUE', [class_id]);
    if (!classResult.rows.length) {
      return res.status(404).json({ error: 'Class not found.' });
    }
    const artClass = classResult.rows[0];

    // Check existing enrollment
    const enrolled = await db.query(
      'SELECT id FROM enrollments WHERE user_id=$1 AND class_id=$2',
      [req.user.id, class_id]
    );
    if (enrolled.rows.length > 0) {
      return res.status(409).json({ error: 'You are already enrolled in this class.' });
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: artClass.price,        // already in paise
      currency: 'inr',
      metadata: {
        user_id: req.user.id,
        class_id: class_id,
        class_title: artClass.title,
        user_email: req.user.email,
      },
      description: `Creative Art Academy — ${artClass.title}`,
    });

    // Record enrollment as pending
    await db.query(
      `INSERT INTO enrollments (user_id, class_id, payment_id, payment_status, amount_paid)
       VALUES ($1,$2,$3,'pending',$4)
       ON CONFLICT (user_id, class_id) DO UPDATE SET payment_id=$3, payment_status='pending'`,
      [req.user.id, class_id, paymentIntent.id, artClass.price]
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: artClass.price,
      currency: 'INR',
      class: artClass.title,
    });
  } catch (err) {
    console.error('[Payments/create-intent]', err.message);
    res.status(500).json({ error: 'Payment initiation failed.' });
  }
});

// ── Stripe Webhook ────────────────────────────────────────────────────────────
// Note: must receive raw body — handled via express.raw() in server.js
async function webhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      const { user_id, class_id } = pi.metadata;

      await db.query(
        `UPDATE enrollments SET payment_status='paid' WHERE payment_id=$1`,
        [pi.id]
      );

      // Send confirmation email
      const userResult = await db.query('SELECT email, name FROM users WHERE id=$1', [user_id]);
      const classResult = await db.query('SELECT title FROM classes WHERE id=$1', [class_id]);
      if (userResult.rows.length && classResult.rows.length) {
        sendEnrollmentConfirmation(
          userResult.rows[0].email,
          userResult.rows[0].name,
          classResult.rows[0].title
        ).catch(console.error);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      await db.query(
        `UPDATE enrollments SET payment_status='failed' WHERE payment_id=$1`,
        [pi.id]
      );
      break;
    }

    default:
      console.log(`[Stripe webhook] Unhandled event: ${event.type}`);
  }

  res.json({ received: true });
}

module.exports = router;
module.exports.webhook = webhook;
