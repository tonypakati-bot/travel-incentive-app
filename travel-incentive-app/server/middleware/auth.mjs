import jwt from 'jsonwebtoken';

const auth = function(req, res, next) {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    console.log('Token received:', token);
    if (!process.env.JWT_SECRET) {
      console.log('JWT verify error: JWT_SECRET is not set');
      return res.status(500).json({ msg: 'Server misconfiguration: JWT_SECRET missing' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded:', decoded);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.log('JWT verify error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

export default auth;