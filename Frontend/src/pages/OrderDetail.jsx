import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OrderDetail = () => {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { orderId } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showFeedbackDetails, setShowFeedbackDetails] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get(`/orders/${orderId}`);
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
        
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else if (error.response?.status === 404) {
          toast.error('Order not found');
          navigate('/orders');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isAuthenticated, navigate]);

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

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">Order not found.</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
        >
          ← Back to Orders
        </button>
        <h1 className="text-2xl font-bold">Order Details</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Order Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-xl">
                Order #{order._id.slice(-6).toUpperCase()}
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
              <p className="font-semibold text-lg">Total: ${order.total.toFixed(2)}</p>
              <span className={`px-3 py-1 text-sm rounded-full ${
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
        <div className="p-6">
          <h3 className="font-medium text-lg mb-4">Items:</h3>
          <ul className="divide-y">
            {order.items.map((item) => (
              <li key={item._id} className="py-4">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    {item.menuItem?.image && (
                      <img
                        src={item.menuItem.image}
                        alt={item.menuItem.name}
                        className="w-20 h-20 object-cover rounded mr-4"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-food.jpg';
                        }}
                      />
                    )}
                    <div>
                      <p className="font-medium text-lg">{item.menuItem?.name || 'Item not available'}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × ${item.priceAtOrder.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium text-lg">
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
        <div className="p-6 bg-gray-50 border-t">
          {order.feedback ? (
            <div>
              <h3 className="font-medium mb-2">Your Feedback:</h3>
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < order.feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              {!showFeedbackDetails && order.feedback.comment && (
                <button
                  className="text-blue-600 hover:underline text-sm"
                  onClick={() => setShowFeedbackDetails(true)}
                >
                  See More
                </button>
              )}
              {showFeedbackDetails && order.feedback.comment && (
                <div>
                  <p className="text-gray-600 mt-2">{order.feedback.comment}</p>
                  <button
                    className="text-blue-600 hover:underline text-sm mt-1"
                    onClick={() => setShowFeedbackDetails(false)}
                  >
                    Show Less
                  </button>
                </div>
              )}
            </div>
          ) : (order.status === 'ready' || order.status === 'completed') ? (
            <div>
              <p className="text-gray-600 mb-2">No feedback yet</p>
              <button
                onClick={() => navigate(`/feedback/${order._id}`)}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                + Add Feedback
              </button>
            </div>
          ) : (
            <p className="text-gray-600 mb-2">
              Feedback will be available once your order is ready.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail; 