import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [expandedComments, setExpandedComments] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/orders/my-orders', {
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
  }, [isAuthenticated, navigate]);

  const toggleComment = (orderId) => {
    setExpandedComments(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">You haven't placed any orders yet.</p>
          <button
            onClick={() => navigate('/menu')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Order Header */}
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-lg">
                    <button 
                      onClick={() => navigate(`/orders/${order._id}`)}
                      className="hover:text-blue-600 transition-colors"
                    >
                      Order #{order._id.slice(-6).toUpperCase()}
                    </button>
                  </h2>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Total: ${order.total.toFixed(2)}</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-4">
              <h3 className="font-medium mb-2">Items:</h3>
              <ul className="divide-y">
                {order.items.map((item) => (
                  <li key={item._id} className="py-3">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        {item.menuItem?.image && (
                          <img
                            src={item.menuItem.image}
                            alt={item.menuItem.name}
                            className="w-16 h-16 object-cover rounded mr-3"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-food.jpg';
                            }}
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.menuItem?.name || 'Item not available'}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} × ${item.priceAtOrder.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">
                        ${(item.priceAtOrder * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Removed Ingredients */}
                    {item.removedIngredients && item.removedIngredients.length > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-gray-600">Removed: </span>
                        <span className="text-gray-500">
                          {item.removedIngredients.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Special Request */}
                    {item.specialRequest && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-gray-600">Special Request: </span>
                        <span className="text-gray-500">
                          {item.specialRequest}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feedback Section */}
            <div className="p-4 bg-gray-50 border-t">
              {order.feedback ? (
                <div>
                  <h3 className="font-medium mb-2">Your Feedback:</h3>
                  
                  {/* Always show overall rating */}
                  <div className="flex items-center mb-3">
                    <span className="text-sm text-gray-600 mr-2">Overall Rating:</span>
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < order.feedback.averageRating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-sm text-gray-600 ml-1">({order.feedback.averageRating}/5)</span>
                  </div>
                  
                  {/* Show "See More" button if there are item ratings */}
                  {order.feedback.items && order.feedback.items.length > 0 && (
                    <>
                      {!expandedComments[order._id] ? (
                        <button
                          onClick={() => toggleComment(order._id)}
                          className="text-blue-600 hover:underline text-sm mb-3"
                        >
                          + Show Details
                        </button>
                      ) : (
                        <div className="space-y-3">
                          {/* Individual Item Ratings */}
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Item Ratings:</h4>
                            <div className="space-y-2">
                              {order.feedback.items.map((feedbackItem, index) => {
                                // Find the corresponding order item
                                const orderItem = order.items.find(item => 
                                  item._id === feedbackItem.orderItemId ||  // Try matching by orderItemId first
                                  item.menuItem?._id === feedbackItem.menuItem // Fallback to menuItem ID
                                );
                                
                                return (
                                  <div key={index} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                      {orderItem?.menuItem?.name || feedbackItem.menuItemName || 'Unknown Item'}
                                    </span>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <svg
                                          key={i}
                                          className={`w-3 h-3 ${i < feedbackItem.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                      <span className="text-gray-500 ml-1">({feedbackItem.rating}/5)</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Comments */}
                          {order.feedback.items.some(item => item.comment) && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Comments:</h4>
                              <div className="space-y-2">
                                {order.feedback.items.map((feedbackItem, index) => {
                                  const orderItem = order.items.find(item => 
                                    item._id === feedbackItem.orderItemId || 
                                    item.menuItem?._id === feedbackItem.menuItem
                                  );
                                  
                                  return feedbackItem.comment ? (
                                    <div key={index} className="text-sm">
                                      <span className="font-medium text-gray-600">
                                        {orderItem?.menuItem?.name || feedbackItem.menuItemName || 'Item'}:
                                      </span>
                                      <p className="text-gray-600 mt-1">{feedbackItem.comment}</p>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                          
                          <button
                            onClick={() => toggleComment(order._id)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            - Hide Details
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (order.status === 'ready' || order.status === 'completed') ? (
                <button
                  onClick={() => navigate(`/feedback/${order._id}`)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  + Add Feedback
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  {order.status === 'pending' ? 'Your order is being prepared...' :
                   order.status === 'processing' ? 'Your order is being cooked...' :
                   'Feedback will be available once your order is ready.'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;