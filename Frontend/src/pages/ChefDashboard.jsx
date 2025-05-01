import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ChefDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      // if (!isAuthenticated || user?.role !== 'chef') {
      //   navigate('/');
      //   return;
      // }

      // setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/orders/kitchen', {
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

    // Set up WebSocket or polling for real-time updates
    const interval = setInterval(fetchOrders, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, navigate, user]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(
        `/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'preparing') return order.status === 'preparing';
    if (activeTab === 'ready') return order.status === 'ready';
    return true;
  });

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
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Chef Dashboard</h1>
      
      {/* Status Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium ${activeTab === 'pending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveTab('preparing')}
          className={`px-4 py-2 font-medium ${activeTab === 'preparing' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Preparing
        </button>
        <button
          onClick={() => setActiveTab('ready')}
          className={`px-4 py-2 font-medium ${activeTab === 'ready' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Ready for Pickup
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          All Orders
        </button>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">No {activeTab} orders found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Order Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-lg">
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
                    <p className="font-semibold">Table: {order.tableNumber || 'Takeout'}</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'ready' 
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
                              className="w-12 h-12 object-cover rounded mr-3"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/placeholder-food.jpg';
                              }}
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.menuItem?.name || 'Item not available'}</p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Removed Ingredients */}
                      {item.removedIngredients && item.removedIngredients.length > 0 && (
                        <div className="mt-1 text-xs">
                          <span className="font-medium text-gray-600">No: </span>
                          <span className="text-gray-500">
                            {item.removedIngredients.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Special Request */}
                      {item.specialRequest && (
                        <div className="mt-1 text-xs">
                          <span className="font-medium text-gray-600">Note: </span>
                          <span className="text-gray-500">
                            {item.specialRequest}
                          </span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status Controls */}
              <div className="p-4 bg-gray-50 border-t flex justify-between">
                <button
                  onClick={() => updateOrderStatus(order._id, 'pending')}
                  className={`px-3 py-1 text-sm rounded ${order.status === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  disabled={order.status === 'pending'}
                >
                  Pending
                </button>
                <button
                  onClick={() => updateOrderStatus(order._id, 'preparing')}
                  className={`px-3 py-1 text-sm rounded ${order.status === 'preparing' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  disabled={order.status === 'preparing'}
                >
                  Preparing
                </button>
                <button
                  onClick={() => updateOrderStatus(order._id, 'ready')}
                  className={`px-3 py-1 text-sm rounded ${order.status === 'ready' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  disabled={order.status === 'ready'}
                >
                  Ready
                </button>
                <button
                  onClick={() => updateOrderStatus(order._id, 'completed')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Complete
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