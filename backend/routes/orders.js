const express = require('express');
const { checkAuth } = require('../middleware/auth');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const user = require('../models/User');
const router = express.Router();
const mongoose=require("mongoose")

// Create new order (protected route)
// Remove any transaction/session code like this:
router.post('/', checkAuth, async (req, res) => {
  try {
    // Add user from auth token if not provided
    if (!req.body.user) {
      req.body.user = req.userId; // Assuming checkAuth sets req.userId
    }

    const order = new Order({
      ...req.body,
      status: 'pending' // Ensure default status
    });

    await order.save();
    
    res.status(201).json({
      success: true,
      orderId: order._id
    });
  } catch (error) {
    console.error('Order creation error:', error);
    
    // More detailed error response
    const errors = {};
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
});

// Get user's orders (protected route)
router.get('/my-orders', checkAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate('items.menuItem')
      .populate('feedback');
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/all-orders', async (req, res) => {
  try {
    // Check if the requesting user is an admin (you might want to add this)
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ message: 'Unauthorized' });
    // }

    const orders = await Order.find({})
      .populate({
        path: 'user',
        select: 'name email specialMessage' // Include whatever user fields you need
      })
      .populate('items.menuItem')
      .populate('feedback');
    
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get order by ID (protected route)
router.get('/:id', checkAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.userId
    }).populate('items.menuItem').populate('feedback');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;