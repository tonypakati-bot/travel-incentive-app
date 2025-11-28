import express from 'express';
import Config from '../models/Config.js';

const router = express.Router();

// Return the single config document (if multiple exist return the first)
router.get('/', async (req, res) => {
  try {
    const cfg = await Config.findOne().lean();
    if (!cfg) return res.status(404).json({ error: 'Config not found' });
    return res.json(cfg);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Dev helper to create/update the config (not mounted in production by default)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const data = { categoryEvents: Array.isArray(body.categoryEvents) ? body.categoryEvents.map(String) : [] };
    let cfg = await Config.findOne();
    if (cfg) {
      cfg.categoryEvents = data.categoryEvents;
      await cfg.save();
    } else {
      cfg = await Config.create(data);
    }
    return res.json(cfg);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
