const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const checkAuth = require('../middleware/auth');


// Chef updates order status
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
module.exports = router;