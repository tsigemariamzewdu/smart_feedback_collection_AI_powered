import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ChefDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [feedbackInsights, setFeedbackInsights] = useState({});
  const [loadingInsights, setLoadingInsights] = useState({});
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || user?.role !== 'chef') {
        navigate('/');
        return;
      }

      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/orders/all-orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
        
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate, user]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Map frontend status to backend status
      const statusMap = {
        'pending': 'pending',
        'preparing': 'processing',
        'ready': 'ready',
        'completed': 'completed'
      };

      const backendStatus = statusMap[newStatus] || newStatus;

      const token = localStorage.getItem('token');
      const response = await api.patch(
        `/orders/${orderId}/status`,
        { status: backendStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the local state with the response from server
      setOrders(orders.map(order => 
        order._id === orderId ? response.data : order
      ));
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  // Fetch feedback insights for a specific user and menu item
  const fetchFeedbackInsights = async (userId, menuItemId, orderId) => {
    const insightKey = `${userId}-${menuItemId}`;
    
    // Don't fetch if already loading or already fetched
    if (loadingInsights[insightKey] || feedbackInsights[insightKey]) {
      return;
    }

    setLoadingInsights(prev => ({ ...prev, [insightKey]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/feedback/user-history/${userId}/${menuItemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFeedbackInsights(prev => ({
        ...prev,
        [insightKey]: response.data
      }));
    } catch (error) {
      console.error('Error fetching feedback insights:', error);
      // Don't show error toast as this is not critical
    } finally {
      setLoadingInsights(prev => ({ ...prev, [insightKey]: false }));
    }
  };

  // Check for feedback insights when orders are loaded
  useEffect(() => {
    if (orders.length > 0) {
      orders.forEach(order => {
        order.items.forEach(item => {
          if (order.user && item.menuItem) {
            fetchFeedbackInsights(order.user._id, item.menuItem._id, order._id);
          }
        });
      });
    }
  }, [orders]);

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'preparing') return order.status === 'processing';
    if (activeTab === 'ready') return order.status === 'ready';
    return true;
  });

  // Feedback Insights Component
  const FeedbackInsights = ({ userId, menuItemId, menuItemName }) => {
    const insightKey = `${userId}-${menuItemId}`;
    const insight = feedbackInsights[insightKey];
    const isLoading = loadingInsights[insightKey];

    if (isLoading) {
      return (
        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-2"></div>
            Analyzing previous feedback...
          </div>
        </div>
      );
    }

    if (!insight || !insight.hasHistory) {
      return null;
    }

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

    return (
      <div className={`mt-2 p-3 rounded border ${getRiskColor(insight.riskLevel)}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-lg mr-2">{getSentimentIcon(insight.overallSentiment)}</span>
            <span className="font-medium text-sm">
              Previous Feedback for {menuItemName}
            </span>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
            insight.riskLevel === 'high' ? 'bg-red-200 text-red-900' :
            insight.riskLevel === 'medium' ? 'bg-yellow-200 text-yellow-900' :
            'bg-green-200 text-green-900'
          }`}>
            {insight.riskLevel.toUpperCase()} RISK
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
          <div>
            <span className="font-medium">Average Rating:</span>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${i < insight.averageRating ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-1">({insight.averageRating}/5)</span>
            </div>
          </div>
          <div>
            <span className="font-medium">Total Feedback:</span> {insight.totalFeedback}
          </div>
        </div>

        {insight.insights && insight.insights.length > 0 && (
          <div className="mb-2">
            <span className="font-medium text-xs">Key Insights:</span>
            <ul className="text-xs mt-1 space-y-1">
              {insight.insights.slice(0, 2).map((insightText, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-1">•</span>
                  <span>{insightText}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {insight.recentFeedback && insight.recentFeedback.length > 0 && (
          <div>
            <span className="font-medium text-xs">Recent Comments:</span>
            <div className="text-xs mt-1 space-y-1">
              {insight.recentFeedback.slice(0, 1).map((feedback, index) => (
                <div key={index} className="italic">
                  "{feedback.comment}"
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chef Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and update order statuses
            </p>
          </div>
          <button
            onClick={() => navigate('/feedback-insights')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <span className="mr-2">📊</span>
            Feedback Insights
          </button>
        </div>
      </div>
      
      {/* Status Tabs */}
      <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
        {['pending', 'preparing', 'ready', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab === 'all' ? 'All Orders' : 
             tab === 'pending' ? 'Pending' :
             tab === 'preparing' ? 'Preparing' : 'Ready'}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">No {activeTab} orders found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow divide-y">
              {/* Order Header */}
              <div className="p-4 flex justify-between items-start sm:items-center">
                <div>
                  <h2 className="font-semibold text-lg">
                    Order #{order._id.slice(-6).toUpperCase()}
                  </h2>
                  <div className="flex items-center mt-1 space-x-4">
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm font-medium">
                      {order.user?.name || 'Guest'}
                    </p>
                    {order.user?.specialMessage && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Special Request
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeout'}
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    order.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : order.status === 'ready'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'processing'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status === 'processing' ? 'Preparing' : 
                     order.status === 'ready' ? 'Ready' :
                     order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item._id} className="flex">
                      {item.menuItem?.image && (
                        <div className="flex-shrink-0 mr-3">
                          <img
                            src={item.menuItem.image}
                            alt={item.menuItem.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-food.jpg';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {item.menuItem?.name || 'Item not available'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                        
                        {item.removedIngredients?.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            <span className="font-medium">Exclude:</span> {item.removedIngredients.join(', ')}
                          </p>
                        )}
                        
                        {item.specialRequest && (
                          <p className="text-xs text-gray-700 mt-1">
                            <span className="font-medium">Note:</span> {item.specialRequest}
                          </p>
                        )}

                        {/* Feedback Insights */}
                        {order.user && item.menuItem && (
                          <FeedbackInsights
                            userId={order.user._id}
                            menuItemId={item.menuItem._id}
                            menuItemName={item.menuItem.name}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Controls */}
              <div className="p-4 bg-gray-50 flex flex-wrap gap-2 justify-between sm:justify-end">
                <button
                  onClick={() => updateOrderStatus(order._id, 'pending')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    order.status === 'pending'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={order.status === 'pending'}
                >
                  Set Pending
                </button>
                <button
                  onClick={() => updateOrderStatus(order._id, 'preparing')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    order.status === 'processing'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={order.status === 'processing'}
                >
                  Set Preparing
                </button>
                <button
                  onClick={() => updateOrderStatus(order._id, 'ready')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    order.status === 'ready'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={order.status === 'ready'}
                >
                  Set Ready
                </button>
                <button
                  onClick={() => updateOrderStatus(order._id, 'completed')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    order.status === 'completed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={order.status === 'completed'}
                >
                  Complete Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChefDashboard;