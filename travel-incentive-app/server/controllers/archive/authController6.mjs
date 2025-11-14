import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Looking for user with email:', email);
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: 3600 }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
};
