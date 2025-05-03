const jwt = require('jsonwebtoken');
const User = require('../models/User');

const checkAuth = async (req, res, next) => {
  try {
    // Check for token in both cookies and Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Authorization token required' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    
    // Differentiate between token errors
    let message = 'Not authenticated';
    if (err.name === 'TokenExpiredError') {
      message = 'Session expired, please login again';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    }

    res.status(401).json({ 
      success: false,
      message: message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = { checkAuth };