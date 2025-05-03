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
    const { orderId, items } = req.body;
    const userId = req.userId;

    // Validate items array exists and has ratings
    // if (!items || !Array.isArray(items) {
    //   return res.status(400).json({ message: 'Items array is required' });
    // }

    // Check order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      status: 'completed'
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or not eligible for feedback' });
    }

    if (order.feedback) {
      return res.status(400).json({ message: 'Feedback already submitted' });
    }

    // Calculate average rating
    const averageRating = items.reduce((sum, item) => sum + item.rating, 0) / items.length;

    // Create feedback with calculated average
    const feedback = new Feedback({
      user: userId,
      order: orderId,
      items: items.map(item => ({
        menuItem: item.menuItemId,
        rating: item.rating,
        comment: item.comment || "" // Ensure comment exists even if empty
      })),
      averageRating: parseFloat(averageRating.toFixed(2)) // Store with 2 decimal places
    });

    await feedback.save();

    // Link feedback to order
    order.feedback = feedback._id;
    await order.save();

    res.status(201).json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.patch('/:id/status',checkAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).send({ error: 'Order not found' });
    }

    res.send(order);
  } catch (error) {
    res.status(400).send({ error: error.message });
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