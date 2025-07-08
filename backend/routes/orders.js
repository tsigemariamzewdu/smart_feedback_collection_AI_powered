const express = require('express');
const { checkAuth } = require('../middleware/auth');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Feedback = require('../models/Feedback');
const router = express.Router();
const mongoose=require("mongoose")

// Create new order (protected route)
router.post('/', checkAuth, async (req, res) => {
  try {
    const { items, total } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required and cannot be empty' });
    }

    if (!total || typeof total !== 'number') {
      return res.status(400).json({ message: 'Total amount is required' });
    }

    // Validate each item
    for (const item of items) {
      if (!item.menuItem || !item.quantity || !item.priceAtOrder) {
        return res.status(400).json({ message: 'Each item must have menuItem, quantity, and priceAtOrder' });
      }

      // Verify menu item exists
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(400).json({ message: `Menu item with ID ${item.menuItem} not found` });
      }
    }

    // Create new order
    const order = new Order({
      user: userId,
      items: items.map(item => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
        priceAtOrder: item.priceAtOrder,
        removedIngredients: item.removedIngredients || [],
        specialRequest: item.specialRequest || ""
      })),
      total: total,
      status: 'pending'
    });

    await order.save();

    // Populate menu items for response
    await order.populate('items.menuItem');

    res.status(201).json({
      success: true,
      orderId: order._id,
      order: order
    });

  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Server error while creating order' });
  }
});

// Submit feedback for an order (protected route)
router.post('/feedback', checkAuth, async (req, res) => {
  try {
    const { orderId, items } = req.body;
    const userId = req.userId;

    // Validate items array exists and has ratings
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    // Check order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      status: { $in: ['ready', 'completed'] }
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

// Update order status (protected route)
router.patch('/:id/status', checkAuth, async (req, res) => {
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

// Assign chef to an order
router.post('/:orderId/assign-chef', require('../middleware/auth').checkAuth, async (req, res) => {
  const { orderId } = req.params;
  const chefId = req.userId; // assuming the chef is authenticated

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Assign the chef to the order
    order.chef = chefId;
    await order.save();

    res.json({ message: 'Chef assigned to this order.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's orders (protected route)
router.get('/my-orders', checkAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate('items.menuItem')
      .populate({
        path: 'feedback',
        populate: {
          path: 'items.menuItem',
          select: 'name'
        }
      });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all orders (admin route)
router.get('/all-orders', async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate({
        path: 'user',
        select: 'name email specialMessage'
      })
      .populate('items.menuItem')
      .populate({
        path: 'feedback',
        populate: {
          path: 'items.menuItem',
          select: 'name'
        }
      });
    
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
    }).populate('items.menuItem').populate({
      path: 'feedback',
      populate: {
        path: 'items.menuItem',
        select: 'name'
      }
    });

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