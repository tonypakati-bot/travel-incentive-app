import express from 'express';
import Participant from '../models/Participant.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Simple send endpoint for demo/proof-of-concept. For production use a queue.
router.post('/send', async (req, res) => {
  const { tripName, emailBody } = req.body;
  if (!tripName || !emailBody) return res.status(400).json({ error: 'Missing params' });

  try {
    const recipients = await Participant.find({ trip: tripName });

    // Configure transport from env for safety; fallback to a dummy transport
    const transportOptions = {};
    if (process.env.SMTP_HOST) {
      transportOptions.host = process.env.SMTP_HOST;
      transportOptions.port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
      transportOptions.auth = process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined;
    }

    let transporter;
    if (transportOptions.host) {
      transporter = nodemailer.createTransport(transportOptions);
    } else {
      // Using ethereal for local testing if no SMTP configured
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
    }

    const results = { sent: 0, failed: 0, errors: [] };

    for (const p of recipients) {
      try {
        const info = await transporter.sendMail({
          from: process.env.FROM_EMAIL || 'no-reply@example.com',
          to: p.email,
          subject: `Invito: ${tripName}`,
          text: emailBody
        });
        results.sent++;
        // Optionally update participant status
        // await Participant.findByIdAndUpdate(p._id, { status: 'Invited' });

        // If using ethereal, provide preview URL
        if (nodemailer.getTestMessageUrl(info)) {
          results.errors.push({ id: p._id, previewUrl: nodemailer.getTestMessageUrl(info) });
        }
      } catch (err) {
        results.failed++;
        results.errors.push({ id: p._id, email: p.email, err: String(err) });
      }
    }

    res.json(results);
  } catch (err) {
    console.error('sendInvites error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
