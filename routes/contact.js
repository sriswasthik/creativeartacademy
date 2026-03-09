// routes/contact.js
const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { sendContactNotification } = require('../utils/mailer');

router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  try {
    await db.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES ($1,$2,$3,$4)',
      [name.trim(), email.toLowerCase(), subject || '', message.trim()]
    );
    sendContactNotification(name, email, message).catch(console.error);
    res.json({ message: 'Message received! We\'ll get back to you within 24 hours. 🎨' });
  } catch (err) {
    res.status(500).json({ error: 'Could not send message. Please try again.' });
  }
});

module.exports = router;
