const express = require('express');
const { checkAuth } = require('../middleware/auth');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const user = require('../models/user');
const router = express.Router();
const mongoose=require("mongoose")

// Create new order (protected route)
router.post('/', checkAuth, async (req, res) => {
  try {
    const { items, totalAmount } = req.body;
    const userId = req.userId;

    // Validate request body
    // if (!items || !Array.isArray(items) {
    //   return res.status(400).json({ 
    //     success: false,
    //     message: 'Invalid order items format' 
    //   });
    // }

    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid total amount'
      });
    }

    // Verify items and calculate total
    let calculatedTotal = 0;
    const orderItems = [];
    
    // Check for empty cart
    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Process each item
    for (const item of items) {
      // Validate item structure
      if (!item.menuItem || !item.quantity || typeof item.quantity !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Invalid item format'
        });
      }

      // Find menu item
      const menuItem = await MenuItem.findById(item.menuItem).select('name price available');
      
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Item ${item.menuItem} not found`
        });
      }
      
      if (!menuItem.available) {
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} is currently unavailable`
        });
      }

      // Validate quantity
      if (item.quantity < 1 || item.quantity > 10) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${menuItem.name}`
        });
      }

      // Add to order items
      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        priceAtOrder: menuItem.price,
        removedIngredients: item.removedIngredients || [],
        specialRequest: item.specialRequest || ''
      });

      calculatedTotal += menuItem.price * item.quantity;
    }

    // Verify calculated total matches frontend total (with small tolerance for floating point)
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Order total mismatch detected'
      });
    }

    // Start transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create and save order
      const order = await Order.create([{
        user: userId,
        items: orderItems,
        total: calculatedTotal,
        status: 'pending'
      }], { session });

      // Update user's order history
      await User.findByIdAndUpdate(userId, {
        $push: { orders: order[0]._id }
      }, { session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // Return success response
      res.status(201).json({
        success: true,
        orderId: order[0]._id,
        total: order[0].total,
        status: order[0].status
      });

    } catch (transactionError) {
      // If any error occurs, abort transaction
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }

  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to process order',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
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