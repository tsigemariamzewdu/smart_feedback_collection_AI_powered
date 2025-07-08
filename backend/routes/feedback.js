const express = require('express');
const { checkAuth } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const sentimentAnalyzer = require('../services/sentimentAnalysis');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
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

// Admin analytics endpoint
router.get('/analytics/admin', async (req, res) => {
  try {
    // Parse date range (default to 30 days)
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all menu items
    const menuItems = await MenuItem.find();
    // Get all feedback within date range
    const feedbacks = await Feedback.find({ 
      createdAt: { $gte: startDate } 
    });
    // Get all orders within date range
    const orders = await Order.find({ 
      createdAt: { $gte: startDate } 
    });
    // Get all chefs
    const chefs = await User.find({ role: 'chef' });

    // Calculate trends (daily average rating and order count)
    const trends = [];
    const dateMap = {};
    
    // Initialize dateMap with all dates in range
    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap[dateStr] = {
        date: dateStr,
        totalRating: 0,
        ratingCount: 0,
        orderCount: 0
      };
    }

    // Process orders to count daily orders and collect feedback
    orders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (dateMap[dateStr]) {
        dateMap[dateStr].orderCount += 1;
      }
    });

    // Process feedback to calculate daily average ratings
    feedbacks.forEach(fb => {
      const dateStr = fb.createdAt.toISOString().split('T')[0];
      if (dateMap[dateStr]) {
        let total = 0;
        let count = 0;
        (fb.items || []).forEach(item => {
          total += item.rating || 0;
          count += 1;
        });
        if (count > 0) {
          dateMap[dateStr].totalRating += total;
          dateMap[dateStr].ratingCount += count;
        }
      }
    });

    // Convert dateMap to trends array
    for (const date in dateMap) {
      const dayData = dateMap[date];
      trends.push({
        date: dayData.date,
        averageRating: dayData.ratingCount > 0 ? (dayData.totalRating / dayData.ratingCount) : 0,
        orderCount: dayData.orderCount
      });
    }

    // Sort trends by date
    trends.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate overall rating
    let totalRating = 0;
    let ratingCount = 0;
    feedbacks.forEach(fb => {
      (fb.items || []).forEach(item => {
        totalRating += item.rating || 0;
        ratingCount += 1;
      });
    });
    const overallRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    // Aggregate feedback by menu item
    const menuItemRatings = {};
    feedbacks.forEach(fb => {
      (fb.items || []).forEach(item => {
        if (!menuItemRatings[item.menuItem]) {
          menuItemRatings[item.menuItem] = { total: 0, count: 0 };
        }
        menuItemRatings[item.menuItem].total += item.rating || 0;
        menuItemRatings[item.menuItem].count += 1;
      });
    });
    
    const foodRatings = menuItems.map(item => {
      const stats = menuItemRatings[item._id] || { total: 0, count: 0 };
      const averageRating = stats.count > 0 ? stats.total / stats.count : 0;
      return { 
        name: item.name, 
        averageRating: parseFloat(averageRating.toFixed(2)) 
      };
    });

    // Most liked and hated food
    const sortedByRating = [...foodRatings].sort((a, b) => b.averageRating - a.averageRating);
    const mostLikedFood = sortedByRating[0] || { name: '', averageRating: 0 };
    const mostHatedFood = sortedByRating[sortedByRating.length - 1] || { name: '', averageRating: 0 };

    // Food order counts
    const menuItemOrderCounts = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        if (!menuItemOrderCounts[item.menuItem]) {
          menuItemOrderCounts[item.menuItem] = 0;
        }
        menuItemOrderCounts[item.menuItem] += 1;
      });
    });
    
    const foodOrders = menuItems.map(item => {
      const orderCount = menuItemOrderCounts[item._id] || 0;
      return { name: item.name, orderCount };
    });
    
    const sortedByOrders = [...foodOrders].sort((a, b) => b.orderCount - a.orderCount);
    const mostOrderedFood = sortedByOrders[0] || { name: '', orderCount: 0 };
    const leastOrderedFood = sortedByOrders[sortedByOrders.length - 1] || { name: '', orderCount: 0 };

    // Chef performance (average rating for orders prepared by each chef)
    const chefPerformance = await Promise.all(chefs.map(async chef => {
      // Find orders prepared by this chef
      const chefOrders = orders.filter(order => String(order.chef) === String(chef._id));
      // Get feedback for those orders
      let total = 0, count = 0;
      chefOrders.forEach(order => {
        if (order.feedback) {
          const fb = feedbacks.find(f => String(f._id) === String(order.feedback));
          if (fb && fb.items) {
            fb.items.forEach(item => {
              total += item.rating || 0;
              count += 1;
            });
          }
        }
      });
      const averageRating = count > 0 ? total / count : 0;
      return { 
        chefName: chef.name, 
        averageRating: parseFloat(averageRating.toFixed(2)) 
      };
    }));

    // Calculate trends for metrics
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
    
    // Previous period feedback count
    const prevFeedbacks = await Feedback.countDocuments({ 
      createdAt: { 
        $gte: previousPeriodStart,
        $lt: startDate
      } 
    });
    
    // Current period feedback count
    const currentFeedbacks = feedbacks.length;
    const reviewsTrend = prevFeedbacks > 0 ? 
      ((currentFeedbacks - prevFeedbacks) / prevFeedbacks) * 100 : 0;

    // Previous period average rating
    const prevFeedbackDocs = await Feedback.find({ 
      createdAt: { 
        $gte: previousPeriodStart,
        $lt: startDate
      } 
    });
    
    let prevTotalRating = 0;
    let prevRatingCount = 0;
    prevFeedbackDocs.forEach(fb => {
      (fb.items || []).forEach(item => {
        prevTotalRating += item.rating || 0;
        prevRatingCount += 1;
      });
    });
    const prevAvgRating = prevRatingCount > 0 ? prevTotalRating / prevRatingCount : 0;
    const ratingTrend = prevAvgRating > 0 ? 
      ((overallRating - prevAvgRating) / prevAvgRating) * 100 : 0;

    res.json({
      // Key metrics
      totalReviews: feedbacks.length,
      overallRating,
      activeChefs: chefs.length,
      totalMenuItems: menuItems.length,
      
      // Trends
      reviewsTrend: parseFloat(reviewsTrend.toFixed(1)),
      ratingTrend: parseFloat(ratingTrend.toFixed(1)),
      chefsTrend: 0, // Not implemented
      menuTrend: 0,  // Not implemented
      
      // Food data
      mostLikedFood,
      mostHatedFood,
      foodRatings,
      mostOrderedFood,
      leastOrderedFood,
      foodOrders,
      
      // Chef data
      chefPerformance,
      
      // Trend data
      trends
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});


module.exports = router;