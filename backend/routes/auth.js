const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();
const bcrypt = require("bcryptjs")

// Token configuration
const TOKEN_EXPIRATION = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Helper function to sanitize user object
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body; // Added phone

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide name, email, and password' 
      });
    }

    // Create user with phone and fixed role
    const user = new User({ 
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone?.trim(), // Added phone
      role: 'customer' // Force role to customer for self-registration
    });


    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'Email already in use' 
      });
    }

    // Create user
    // const user = new User({ 
    //   name: name.trim(),
    //   email: email.toLowerCase().trim(),
    //   password,
    //   role: role || 'user' // Default to 'user' if role not provided
    // });

    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'strict'
    });

    // Respond with user data (without sensitive info)
    res.status(201).json({
      success: true,
      user: sanitizeUser(user),
      token, // Also send token in response for clients that can't use cookies
      expiresIn: TOKEN_EXPIRATION
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email); // Debug log

    // Validate input
    if (!email || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ 
        success: false,
        message: 'Please provide both email and password' 
      });
    }

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .lean(); // Add lean() for better performance

    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    console.log('User found:', user.email); // Debug log

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isMatch); // Debug log

    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Create token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    console.log('Token generated successfully'); // Debug log

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'strict'
    });

    // Respond with sanitized user data
    const userData = sanitizeUser(user);
    
    res.json({
      success: true,
      user: userData,
      token, // For clients that can't use cookies
      expiresIn: TOKEN_EXPIRATION
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
// Check session
router.get('/check-session', async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.json({ isValid: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.json({ isValid: false });
    }

    // Calculate remaining time in seconds
    const remainingTime = Math.floor((decoded.exp * 1000 - Date.now()) / 1000);

    res.json({ 
      isValid: true,
      user: sanitizeUser(user),
      expiresIn: remainingTime > 0 ? remainingTime : 0
    });
  } catch (err) {
    res.json({ isValid: false });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;