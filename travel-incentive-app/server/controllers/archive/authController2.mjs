import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';

export const loginUser = async (req, res) => {
  console.log('\n=== Login Attempt ===');
  console.log('Request details:', {
    body: req.body,
    email: req.body.email,
    passwordProvided: !!req.body.password
  });

  const { email, password } = req.body;

  if (!email || !password) {
    console.log('❌ Validation failed: Missing email or password');
    return res.status(400).json({ msg: 'Email and password are required' });
  }

  try {
    // Convert email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase();
    console.log('Looking for user with normalized email:', normalizedEmail);

    // Try to find user with explicit field selection
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    
    console.log('Query result:', {
      found: !!user,
      userFields: user ? Object.keys(user.toObject()) : [],
      emailInDb: user?.email,
      hasPasswordHash: !!user?.passwordHash
    });

    if (!user) {
      console.log('User not found with email:', normalizedEmail);
      // Check all users in database to debug
      const allUsers = await User.find({}).select('email');
      console.log('All users in database:', 
        allUsers.map(u => ({
          email: u.email,
          normalizedEmail: u.email?.toLowerCase()
        }))
      );
      return res.status(400).json({ 
        msg: 'Invalid Credentials',
        debug: {
          error: 'User not found',
          providedEmail: email,
          normalizedEmail
        }
      });
    }

    console.log('Password verification details:', {
      providedPassword: password,
      hasStoredHash: !!user.passwordHash,
      hashLength: user.passwordHash?.length
    });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log('Password verification result:', { isMatch });

    if (!isMatch) {
      return res.status(400).json({ 
        msg: 'Invalid Credentials',
        debug: {
          error: 'Password mismatch',
          userFound: true
        }
      });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          throw err;
        }
        console.log('Login successful, token generated');
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
};

export default {
  loginUser
};
