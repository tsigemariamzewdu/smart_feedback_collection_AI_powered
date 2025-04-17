const express = require('express');
const { checkAuth } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const router = express.Router();

// Submit feedback for an order (protected route)
router.post('/', checkAuth, async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const userId = req.userId;

    // Check if order belongs to user
    const order = await Order.findOne({
      _id: orderId,
      user: userId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if feedback already exists
    if (order.feedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this order' });
    }

    // Create feedback
    const feedback = new Feedback({
      user: userId,
      order: orderId,
      rating,
      comment
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

// Get feedback for a specific order (protected route)
router.get('/order/:orderId', checkAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.userId
    }).populate('feedback');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.feedback) {
      return res.status(404).json({ message: 'No feedback for this order' });
    }

    res.json(order.feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;