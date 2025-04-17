const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();

// Configure token expiration (7 days)
const TOKEN_EXPIRATION = '7d'; // Changed from '1d' to '7d'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Please provide all fields' 
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already in use' 
            });
        }

        // Create user
        const user = new User({ name, email, password, role });
        await user.save();

        // Create token with longer expiration
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: TOKEN_EXPIRATION }
        );

        // Set cookie with longer maxAge
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: COOKIE_MAX_AGE,
            sameSite: 'strict'
        });

        res.status(201).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            expiresIn: COOKIE_MAX_AGE // Send expiration info to frontend
        });

    } catch (err) {
        console.error(err);
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

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Please provide both email and password' 
            });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        // Create token with longer expiration
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: TOKEN_EXPIRATION }
        );

        // Set cookie with longer maxAge
        // Remove the cookie setting and just return the token in response

  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;
  
  res.json({
    success: true,
    user: userWithoutPassword,
    token: token, // Send token in response body
    expiresIn: TOKEN_EXPIRATION // e.g., "7d"
  });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Add this new endpoint to check token validity
router.get('/check-session', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.json({ isValid: false });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.json({ isValid: false });
        }

        // Calculate remaining time
        const remainingTime = decoded.exp * 1000 - Date.now();

        res.json({ 
            isValid: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            expiresIn: remainingTime
        });
    } catch (err) {
        res.json({ isValid: false });
    }
});

module.exports = router;