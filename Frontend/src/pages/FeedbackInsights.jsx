import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FeedbackInsights = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [menuItemInsights, setMenuItemInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!isAuthenticated || user?.role !== 'chef') {
        navigate('/');
        return;
      }

      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/menu', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMenuItems(response.data);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        toast.error('Failed to load menu items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, [isAuthenticated, navigate, user]);

  const fetchMenuItemInsights = async (menuItemId) => {
    setLoadingInsights(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/feedback/menu-item/${menuItemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMenuItemInsights(response.data);
    } catch (error) {
      console.error('Error fetching menu item insights:', error);
      toast.error('Failed to load feedback insights');
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleMenuItemSelect = (menuItem) => {
    setSelectedMenuItem(menuItem);
    fetchMenuItemInsights(menuItem._id);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      case 'neutral': return '😐';
      default: return '😐';
    }
  };

  if (!isAuthenticated || user?.role !== 'chef') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Feedback Insights</h1>
        <p className="mt-2 text-sm text-gray-600">
          Analyze customer feedback and sentiment for menu improvements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu Items List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Menu Items</h2>
            <div className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item._id}
                  onClick={() => handleMenuItemSelect(item)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedMenuItem?._id === item._id
                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded mr-3"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-food.jpg';
                        }}
                      />
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">${item.price}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            {!selectedMenuItem ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Menu Item
                </h3>
                <p className="text-gray-600">
                  Choose a menu item from the list to view detailed feedback insights
                </p>
              </div>
            ) : loadingInsights ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading insights...</p>
              </div>
            ) : menuItemInsights ? (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    {selectedMenuItem.image && (
                      <img
                        src={selectedMenuItem.image}
                        alt={selectedMenuItem.name}
                        className="w-16 h-16 object-cover rounded-lg mr-4"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-food.jpg';
                        }}
                      />
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedMenuItem.name}
                      </h2>
                      <p className="text-gray-600">${selectedMenuItem.price}</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full font-medium ${getRiskColor(menuItemInsights.riskLevel)}`}>
                    {menuItemInsights.riskLevel.toUpperCase()} RISK
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {menuItemInsights.totalFeedback}
                    </div>
                    <div className="text-sm text-blue-600">Total Reviews</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {menuItemInsights.averageRating}
                    </div>
                    <div className="text-sm text-green-600">Avg Rating</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {getSentimentIcon(menuItemInsights.overallSentiment)}
                    </div>
                    <div className="text-sm text-yellow-600">Sentiment</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {menuItemInsights.sentimentAnalysis?.sentimentBreakdown?.positive || 0}
                    </div>
                    <div className="text-sm text-purple-600">Positive</div>
                  </div>
                </div>

                {/* Insights */}
                {menuItemInsights.insights && menuItemInsights.insights.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Key Insights</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <ul className="space-y-2">
                        {menuItemInsights.insights.map((insight, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-yellow-600 mr-2">•</span>
                            <span className="text-yellow-800">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Recent Feedback */}
                {menuItemInsights.feedbackItems && menuItemInsights.feedbackItems.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Recent Feedback</h3>
                    <div className="space-y-3">
                      {menuItemInsights.feedbackItems.slice(0, 5).map((feedback, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {feedback.userName || 'Anonymous'}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                {new Date(feedback.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="text-sm text-gray-600 ml-1">({feedback.rating}/5)</span>
                            </div>
                          </div>
                          {feedback.comment && (
                            <p className="text-gray-700 italic">"{feedback.comment}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {menuItemInsights.totalFeedback === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Feedback Yet
                    </h3>
                    <p className="text-gray-600">
                      This menu item hasn't received any feedback yet.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">❌</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Data Available
                </h3>
                <p className="text-gray-600">
                  Unable to load feedback data for this menu item.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackInsights; 