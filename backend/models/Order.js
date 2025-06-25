const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  priceAtOrder: {
    type: Number,
    required: true
  },
  removedIngredients: [String],  // Track which ingredients were removed
  specialRequest: String         // Custom message
});

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [OrderItemSchema],
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'ready', 'completed'],
    default: 'pending'
  },
//   deliveryAddress: {
//     type: String,
//     required: true
//   },
//   contactNumber: {
//     type: String,
//     required: true
//   },
  feedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);