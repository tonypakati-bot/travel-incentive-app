// Archived copy of authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.mjs';

// This is an archived version kept for reference.

export const loginUser = async (req, res) => {
  try {
    // Old implementation archived
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error('Archived login error:', err);
    res.status(500).send('Server error');
  }
};
