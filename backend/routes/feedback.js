const express = require('express');
const { checkAuth } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const sentimentAnalyzer = require('../services/sentimentAnalysis');
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

// Get user feedback history for specific menu items (for chef dashboard)
router.get('/user-history/:userId/:menuItemId', checkAuth, async (req, res) => {
  try {
    const { userId, menuItemId } = req.params;

    // Find all feedback from this user for this specific menu item
    const feedbackHistory = await Feedback.find({
      user: userId,
      'items.menuItem': menuItemId
    }).populate('order').populate('items.menuItem');

    // Debug logging
    console.log('Fetched feedbackHistory:', JSON.stringify(feedbackHistory, null, 2));

    if (!feedbackHistory || feedbackHistory.length === 0) {
      return res.json({
        hasHistory: false,
        message: 'No previous feedback found for this user and menu item'
      });
    }

    // Extract feedback items for this specific menu item
    const relevantFeedbackItems = [];
    feedbackHistory.forEach(feedback => {
      const itemFeedback = feedback.items.find(item => 
        (item.menuItem._id ? item.menuItem._id.toString() : item.menuItem.toString()) === menuItemId
      );
      if (itemFeedback) {
        relevantFeedbackItems.push({
          rating: itemFeedback.rating,
          comment: itemFeedback.comment,
          date: feedback.createdAt,
          orderId: feedback.order._id
        });
      }
    });

    // Debug logging
    console.log('Extracted relevantFeedbackItems:', JSON.stringify(relevantFeedbackItems, null, 2));

    // Perform sentiment analysis
    const sentimentAnalysis = sentimentAnalyzer.analyzeFeedbackSummary(relevantFeedbackItems);

    // Debug logging
    console.log('Sentiment analysis result:', JSON.stringify(sentimentAnalysis, null, 2));
    
    // Extract topics from comments
    const comments = relevantFeedbackItems
      .filter(item => item.comment)
      .map(item => item.comment);
    const topics = sentimentAnalyzer.extractTopics(comments);

    // Get recent feedback for detailed analysis
    const recentFeedback = relevantFeedbackItems
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    res.json({
      hasHistory: true,
      totalFeedback: relevantFeedbackItems.length,
      recentFeedback,
      sentimentAnalysis,
      topics,
      riskLevel: sentimentAnalysis.riskLevel,
      overallSentiment: sentimentAnalysis.overallSentiment,
      averageRating: sentimentAnalysis.averageRating,
      insights: sentimentAnalysis.insights
    });

  } catch (err) {
    console.error('Error fetching user feedback history:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all feedback for a specific menu item (for chef insights)
router.get('/menu-item/:menuItemId', checkAuth, async (req, res) => {
  try {
    const { menuItemId } = req.params;

    // Find all feedback for this menu item
    const allFeedback = await Feedback.find({
      'items.menuItem': menuItemId
    }).populate('user', 'name email').populate('items.menuItem');

    if (!allFeedback || allFeedback.length === 0) {
      return res.json({
        totalFeedback: 0,
        message: 'No feedback found for this menu item'
      });
    }

    // Extract feedback items for this specific menu item
    const relevantFeedbackItems = [];
    allFeedback.forEach(feedback => {
      const itemFeedback = feedback.items.find(item => 
        (item.menuItem._id ? item.menuItem._id.toString() : item.menuItem.toString()) === menuItemId
      );
      if (itemFeedback) {
        relevantFeedbackItems.push({
          rating: itemFeedback.rating,
          comment: itemFeedback.comment,
          date: feedback.createdAt,
          userId: feedback.user._id,
          userName: feedback.user.name,
          orderId: feedback.order
        });
      }
    });

    // Perform sentiment analysis
    const sentimentAnalysis = sentimentAnalyzer.analyzeFeedbackSummary(relevantFeedbackItems);
    
    // Extract topics from comments
    const comments = relevantFeedbackItems
      .filter(item => item.comment)
      .map(item => item.comment);
    const topics = sentimentAnalyzer.extractTopics(comments);

    res.json({
      totalFeedback: relevantFeedbackItems.length,
      feedbackItems: relevantFeedbackItems,
      sentimentAnalysis,
      topics,
      riskLevel: sentimentAnalysis.riskLevel,
      overallSentiment: sentimentAnalysis.overallSentiment,
      averageRating: sentimentAnalysis.averageRating,
      insights: sentimentAnalysis.insights
    });

  } catch (err) {
    console.error('Error fetching menu item feedback:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;