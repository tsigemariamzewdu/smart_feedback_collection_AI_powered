const express = require('express');
const MenuItem = require('../models/MenuItem');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ available: true });
    res.json(menuItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get menu item by ID
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Add new menu item
router.post('/', checkAuth, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add menu items' });
    }
    const { name, description, price, category, image, ingredients, available } = req.body;
    if (!name || !description || !price || !category || !image) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const menuItem = new MenuItem({
      name,
      description,
      price,
      category,
      image,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      available: available !== undefined ? available : true
    });
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes would go here (protected by auth middleware)

module.exports = router;