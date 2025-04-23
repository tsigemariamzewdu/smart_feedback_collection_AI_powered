const express = require('express');
const { checkAuth } = require('../middleware/auth');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const user = require('../models/user');
const router = express.Router();
const mongoose=require("mongoose")

// Create new order (protected route)
// Remove any transaction/session code like this:
router.post('/',checkAuth, async (req, res) => {
  try {
    // Remove any session/transaction code
    const order = new Order(req.body);
    await order.save(); // Simple save without transactions
    
    res.status(201).json({
      success: true,
      orderId: order._id
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
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