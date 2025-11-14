import jwt from 'jsonwebtoken';

const auth = function(req, res, next) {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    console.log('No token found in request headers');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    // Verify using configured secret. Do not fall back to an insecure default.
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not set in the environment; refusing to verify token.');
      return res.status(500).json({ msg: 'Server misconfiguration' });
    }
    const decoded = jwt.verify(token, secret);
    console.log('Token verified successfully:', { userId: decoded.user.id });
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};