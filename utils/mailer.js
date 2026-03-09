/**
 * utils/mailer.js — Nodemailer email notifications
 */

const nodemailer = require('nodemailer');

// Create transporter — uses env vars (e.g. Gmail SMTP or SendGrid)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"Creative Art Academy 2026" <${process.env.SMTP_USER || 'hello@creativeartacademy.in'}>`;
const STUDIO_EMAIL = process.env.STUDIO_EMAIL || 'hello@creativeartacademy.in';

// ── Welcome email ─────────────────────────────────────────────────────────────
async function sendWelcomeEmail(to, name) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Welcome to Creative Art Academy, ${name}! 🎨`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: auto; color: #2A2420;">
        <div style="background: #E07A5F; padding: 2rem; text-align: center;">
          <h1 style="color: white; font-size: 1.8rem; margin: 0;">Creative Art Academy 2026</h1>
        </div>
        <div style="padding: 2rem; background: #F5F5F0;">
          <p style="font-size: 1.1rem;">Hi <strong>${name}</strong>,</p>
          <p>Welcome to the academy! You're now part of a warm, slightly chaotic studio community in Hyderabad where paint meets purpose.</p>
          <p>Browse our classes and book your first session — remember, your first class is on us! ✨</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/#classes"
             style="display:inline-block;background:#E07A5F;color:white;padding:0.8rem 1.6rem;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:1rem">
            See Classes →
          </a>
        </div>
        <div style="padding: 1rem 2rem; background: #2A2420; color: rgba(245,245,240,0.6); font-size: 0.85rem;">
          <p>Creative Art Academy, Banjara Hills, Hyderabad | hello@creativeartacademy.in</p>
          <p>Follow us: <a href="https://www.instagram.com/creative_artacademy2026" style="color:#E07A5F">@creative_artacademy2026</a></p>
        </div>
      </div>
    `,
  });
}

// ── Enrollment confirmation ───────────────────────────────────────────────────
async function sendEnrollmentConfirmation(to, name, className) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `You're enrolled in ${className}! 🖌️`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: auto; color: #2A2420;">
        <div style="background: #4A7C59; padding: 2rem; text-align: center;">
          <h1 style="color: white; font-size: 1.6rem; margin: 0;">Booking Confirmed! ✓</h1>
        </div>
        <div style="padding: 2rem; background: #F5F5F0;">
          <p>Hi <strong>${name}</strong>,</p>
          <p>You're officially enrolled in <strong>${className}</strong> at Creative Art Academy. We can't wait to paint with you!</p>
          <p><strong>What to bring:</strong> Just yourself and a little curiosity. All materials are included.</p>
          <p><strong>Studio address:</strong> Plot 14, Road No. 2, Banjara Hills, Hyderabad — 500034</p>
          <p><strong>Questions?</strong> Reply to this email or WhatsApp us at +91 98765 43210</p>
        </div>
        <div style="padding: 1rem 2rem; background: #2A2420; color: rgba(245,245,240,0.6); font-size: 0.85rem;">
          <p>Creative Art Academy 2026 | Hyderabad</p>
        </div>
      </div>
    `,
  });
}

// ── Contact message notification ──────────────────────────────────────────────
async function sendContactNotification(name, email, message) {
  await transporter.sendMail({
    from: FROM,
    to: STUDIO_EMAIL,
    subject: `New contact message from ${name}`,
    html: `
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
    replyTo: email,
  });
}

module.exports = { sendWelcomeEmail, sendEnrollmentConfirmation, sendContactNotification };
