import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.mjs';

// Register User
export const registerUser = async (req, res) => {
  const { name, email, password, group, role } = req.body;

  try {
    // Check if user exists with case-insensitive email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    const user = new User({
      firstName: name,
      lastName: '',
      email: email.toLowerCase(),
      groupName: group || 'Default',
      role: role || 'user'
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();

    // Create JWT token
    const payload = {
      user: { id: user.id }
    };

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set during registration');
      return res.status(500).json({ msg: 'Server misconfiguration: JWT_SECRET missing' });
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          return res.status(500).json({ msg: 'Error creating token' });
        }
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: 'Server error', debug: err.message });
  }
};

// Login User
export const loginUser = async (req, res) => {
  console.log('\n=== Login Attempt ===');
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    console.log('❌ Validation failed: Missing email or password');
    return res.status(400).json({ msg: 'Email and password are required' });
  }

  try {
    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    console.log('User search result:', {
      found: !!user,
      email: email.toLowerCase(),
      hasPassword: user ? !!user.password : false,
      passwordLength: user?.password?.length
    });

    // Check user exists
    if (!user) {
      return res.status(400).json({ 
        msg: 'Invalid Credentials',
        debug: { error: 'User not found', providedEmail: email }
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password verification:', { isMatch });

    if (!isMatch) {
      return res.status(400).json({ 
        msg: 'Invalid Credentials',
        debug: { error: 'Password mismatch' }
      });
    }

    // Create JWT token
    const payload = {
      user: { id: user.id }
    };

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set during login');
      return res.status(500).json({ msg: 'Server misconfiguration: JWT_SECRET missing' });
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          return res.status(500).json({ msg: 'Error creating token' });
        }
        console.log('Login successful:', {
          userId: user.id,
          tokenGenerated: true,
          tokenLength: token.length,
          tokenPreview: token.substring(0, 10) + '...'
        });
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error', debug: err.message });
  }
};

// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ msg: 'Server error', debug: err.message });
  }
};