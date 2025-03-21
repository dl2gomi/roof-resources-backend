const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token missing, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password'); // Selects user without password
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth;
