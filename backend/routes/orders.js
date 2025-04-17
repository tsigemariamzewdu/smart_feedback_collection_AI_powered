const express = require('express');
const { checkAuth } = require('../middleware/auth');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const user = require('../models/user');
const router = express.Router();

// Create new order (protected route)
router.post('/',checkAuth, async (req, res) => {
    try {
      const { items, totalAmount } = req.body;
      const userId = req.userId;
  
      // Validate request
    //   if (!items || !Array.isArray(items) {
    //     return res.status(400).json({ 
    //       success: false,
    //       message: 'Invalid order items format' 
    //     });
    //   }
  
      // Verify items and calculate total
      let calculatedTotal = 0;
      const orderItems = [];
      
      for (const item of items) {
        const menuItem = await MenuItem.findById(item.menuItem);
        
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
  
        orderItems.push({
          menuItem: menuItem._id,
          quantity: item.quantity,
          priceAtOrder: menuItem.price
        });
  
        calculatedTotal += menuItem.price * item.quantity;
      }
  
      // Verify calculated total matches frontend total
      if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
        return res.status(400).json({
          success: false,
          message: 'Order total mismatch detected'
        });
      }
  
      // Create and save order
      const order = await Order.create({
        user: userId,
        items: orderItems,
        total: calculatedTotal,
        status: 'pending'
      });
  
      // Update user's order history
      await user.findByIdAndUpdate(userId, {
        $push: { orders: order._id }
      });
  
      // Return success response
      res.status(201).json({
        success: true,
        orderId: order._id,
        total: order.total,
        status: order.status
      });
  
    } catch (err) {
      console.error('Order error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to process order'
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