const natural = require('natural');
const compromise = require('compromise');

class SentimentAnalyzer {
  constructor() {
    // Initialize sentiment analyzer
    this.analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    
    // Keywords for different sentiment categories
    this.positiveKeywords = [
      'delicious', 'amazing', 'excellent', 'fantastic', 'great', 'good', 'tasty', 
      'yummy', 'love', 'perfect', 'wonderful', 'outstanding', 'superb', 'best',
      'awesome', 'incredible', 'fabulous', 'brilliant', 'satisfied', 'happy'
    ];
    
    this.negativeKeywords = [
      'terrible', 'awful', 'bad', 'disgusting', 'horrible', 'worst', 'hate',
      'disappointed', 'unhappy', 'sad', 'angry', 'upset', 'frustrated', 'annoyed',
      'poor', 'mediocre', 'bland', 'tasteless', 'cold', 'burnt', 'overcooked',
      'undercooked', 'salty', 'spicy', 'dry', 'soggy'
    ];
    
    this.neutralKeywords = [
      'okay', 'fine', 'average', 'normal', 'regular', 'standard', 'decent',
      'acceptable', 'satisfactory', 'adequate', 'reasonable'
    ];
  }

  // Analyze sentiment of a single feedback comment
  analyzeSentiment(text) {
    if (!text || text.trim() === '') {
      return { sentiment: 'neutral', score: 0, confidence: 0 };
    }

    const lowerText = text.toLowerCase();
    let score = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    // Check for positive keywords
    this.positiveKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        score += 1;
        positiveCount++;
      }
    });

    // Check for negative keywords
    this.negativeKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        score -= 1;
        negativeCount++;
      }
    });

    // Check for neutral keywords
    this.neutralKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        neutralCount++;
      }
    });

    // Use natural library for additional analysis
    const naturalScore = this.analyzer.getSentiment(text.split(' '));
    score += naturalScore;

    // Determine sentiment category
    let sentiment = 'neutral';
    let confidence = 0;

    if (score > 0.5) {
      sentiment = 'positive';
      confidence = Math.min(1, (positiveCount / (positiveCount + negativeCount + neutralCount)) + 0.3);
    } else if (score < -0.5) {
      sentiment = 'negative';
      confidence = Math.min(1, (negativeCount / (positiveCount + negativeCount + neutralCount)) + 0.3);
    } else {
      sentiment = 'neutral';
      confidence = Math.min(1, (neutralCount / (positiveCount + negativeCount + neutralCount)) + 0.3);
    }

    return {
      sentiment,
      score: parseFloat(score.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(2)),
      positiveCount,
      negativeCount,
      neutralCount
    };
  }

  // Analyze multiple feedback items and provide summary
  analyzeFeedbackSummary(feedbackItems) {
    if (!feedbackItems || feedbackItems.length === 0) {
      return {
        overallSentiment: 'neutral',
        averageRating: 0,
        totalFeedback: 0,
        sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
        insights: [],
        riskLevel: 'low'
      };
    }

    let totalScore = 0;
    let totalRating = 0;
    let sentimentBreakdown = { positive: 0, negative: 0, neutral: 0 };
    let allComments = [];
    let insights = [];

    feedbackItems.forEach(item => {
      // Analyze rating
      totalRating += item.rating;
      
      // Analyze comment sentiment
      if (item.comment) {
        const sentiment = this.analyzeSentiment(item.comment);
        totalScore += sentiment.score;
        sentimentBreakdown[sentiment.sentiment]++;
        allComments.push(item.comment);
      }
    });

    const averageRating = totalRating / feedbackItems.length;
    const averageSentimentScore = totalScore / feedbackItems.length;
    const totalFeedback = feedbackItems.length;

    // Determine overall sentiment
    let overallSentiment = 'neutral';
    if (averageSentimentScore > 0.3) {
      overallSentiment = 'positive';
    } else if (averageSentimentScore < -0.3) {
      overallSentiment = 'negative';
    }

    // Generate insights
    if (averageRating < 3) {
      insights.push('Low average rating - consider improving this dish');
    }
    
    if (sentimentBreakdown.negative > sentimentBreakdown.positive) {
      insights.push('More negative feedback than positive - customer satisfaction needs attention');
    }

    if (sentimentBreakdown.negative > 0) {
      insights.push('Some customers have expressed concerns - review feedback for improvement areas');
    }

    if (averageRating >= 4 && sentimentBreakdown.positive > 0) {
      insights.push('Generally well-received dish with positive feedback');
    }

    // Determine risk level
    let riskLevel = 'low';
    if (averageRating < 2.5 || sentimentBreakdown.negative > sentimentBreakdown.positive) {
      riskLevel = 'high';
    } else if (averageRating < 3.5 || sentimentBreakdown.negative > 0) {
      riskLevel = 'medium';
    }

    return {
      overallSentiment,
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalFeedback,
      sentimentBreakdown,
      insights,
      riskLevel,
      averageSentimentScore: parseFloat(averageSentimentScore.toFixed(2))
    };
  }

  // Extract key topics from feedback
  extractTopics(comments) {
    if (!comments || comments.length === 0) return [];

    const allText = comments.join(' ');
    const doc = compromise(allText);
    
    // Extract nouns and adjectives
    const nouns = doc.nouns().out('array');
    const adjectives = doc.adjectives().out('array');
    
    // Count frequency
    const topicCount = {};
    [...nouns, ...adjectives].forEach(word => {
      const cleanWord = word.toLowerCase().trim();
      if (cleanWord.length > 2) {
        topicCount[cleanWord] = (topicCount[cleanWord] || 0) + 1;
      }
    });

    // Return top topics
    return Object.entries(topicCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));
  }
}

module.exports = new SentimentAnalyzer(); 