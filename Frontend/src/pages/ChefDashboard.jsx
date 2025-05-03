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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Chef Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage and update order statuses
        </p>
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
                    order.status === 'preparing'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={order.status === 'preparing'}
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
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
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