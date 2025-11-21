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

    // Configure transport from env for safety; support secure/TLS
    const transportOptions = {};
    if (process.env.SMTP_HOST) {
      transportOptions.host = process.env.SMTP_HOST;
      transportOptions.port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
      transportOptions.secure = process.env.SMTP_SECURE === 'true' || false; // true for 465
      if (process.env.SMTP_USER) {
        transportOptions.auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
      }
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

    const results = { sent: 0, failed: 0, errors: [], previews: [] };

    // Helper: simple template renderer for placeholders
    function renderForParticipant(template, participant) {
      let out = template;
      try {
        const displayName = [participant.firstName, participant.lastName].filter(Boolean).join(' ') || participant.name || '';
        out = out.replace(/\[NOME_PARTECIPANTE\]/g, displayName);
        const id = participant.id ?? participant._id;
        out = out.replace(/\[LINK_REGISTRAZIONE\]/g, `${process.env.REGISTRATION_BASE_URL || 'https://example.com/register'}?id=${id}`);
      } catch (e) {}
      return out;
    }

    // Batch sending with concurrency limit
    const concurrency = process.env.CONCURRENCY ? Number(process.env.CONCURRENCY) : 6;
    const chunks = [];
    for (let i = 0; i < recipients.length; i += concurrency) chunks.push(recipients.slice(i, i + concurrency));

    for (const chunk of chunks) {
      const promises = chunk.map(async (p) => {
        const personalized = renderForParticipant(emailBody, p);
        try {
          const info = await transporter.sendMail({
            from: process.env.FROM_EMAIL || 'no-reply@example.com',
            to: p.email,
            subject: `Invito: ${tripName}`,
            text: personalized
          });

          // Persist participant status to Invited
          try {
            await Participant.findByIdAndUpdate(p._id, { status: 'Invited' });
          } catch (e) {
            console.warn('Failed updating participant status for', p._id, e);
          }

          results.sent++;
          const preview = nodemailer.getTestMessageUrl(info);
          if (preview) results.previews.push({ id: p._id, previewUrl: preview });
          return { ok: true };
        } catch (err) {
          results.failed++;
          results.errors.push({ id: p._id, email: p.email, err: String(err) });
          return { ok: false };
        }
      });

      // Wait for this chunk to complete
      await Promise.allSettled(promises);
    }

    res.json(results);
  } catch (err) {
    console.error('sendInvites error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
