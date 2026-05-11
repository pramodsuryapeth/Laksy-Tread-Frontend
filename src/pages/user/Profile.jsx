import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyOrders } from "../../services/ordreService";

function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await getMyOrders();
        console.log("API RESPONSE 👉", res.data);
        setOrders(res.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Helper to extract productId from item (object or string)
  const getProductId = (item) => {
    const raw = item.productId;
    if (!raw) return null;
    return typeof raw === "object" ? raw._id : raw;
  };

  // Status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return styles[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">My Profile</h2>

        {/* User Info Card – Role removed, name added */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-100">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-sm">
              {(user?.name || user?.email)?.[0]?.toUpperCase() || "U"}
            </span>
            Account Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {user?.name && (
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">{user.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="font-medium text-gray-900 break-all">{user?.email || "Not available"}</p>
            </div>
            {/* Role removed intentionally */}
          </div>
        </div>

        {/* Orders Section */}
        <div className="mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">My Orders</h3>
          
          {loading ? (
            // Skeleton loaders
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
                  <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                    <div className="h-6 bg-gray-200 rounded w-32"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-40 mb-4"></div>
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-dashed border-gray-300">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
              <p className="text-gray-500 mt-1">When you place an order, it will appear here.</p>
              <button
                onClick={() => navigate("/shop")}
                className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order._id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      {/* You can add Order ID or other info if needed */}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadge(order.status)}`}>
                        {order.status?.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-5">
                    {/* Items grid - responsive */}
                    <div className="space-y-4 mb-4">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-4 pb-4 border-b last:border-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 rounded-lg object-cover bg-gray-100 self-center sm:self-start"
                          />
                          <div className="flex-1 text-center sm:text-left">
                            <h4 className="font-semibold text-gray-900">{item.name}</h4>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                              {item.size && <span>Size: {item.size}</span>}
                              {item.color && <span>Color: {item.color}</span>}
                              <span>Qty: {item.quantity}</span>
                            </div>
                            <p className="font-bold text-gray-900 mt-2">₹{item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order details summary */}
                    <div className="bg-gray-50 rounded-xl p-4 mt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Delivery Address</p>
                          <p className="font-medium text-gray-800">
                            {order.user?.name || "Customer"}, {order.user?.addressLine},<br />
                            {order.user?.city}, {order.user?.state} - {order.user?.pincode}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Payment Method</p>
                          <p className="font-medium text-gray-800 capitalize">{order.paymentMethod || "Razorpay"}</p>
                          <p className="text-gray-500 mt-1">Delivery: {order.deliveryType === "delivery" ? "Home Delivery" : "Store Pickup"}</p>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                        <span className="font-semibold">Total Amount</span>
                        <span className="text-xl font-bold text-green-600">₹{order.charges?.finalAmount}</span>
                      </div>
                    </div>

                    {/* Review button for delivered orders */}
                    {order.status === "delivered" && !order.isReviewed && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => {
                            const firstItem = order.items?.[0];
                            const productId = getProductId(firstItem);
                            if (!productId) {
                              alert("Cannot find product for review");
                              return;
                            }
                            navigate(`/review/${order._id}?productId=${productId}`);
                          }}
                          className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                        >
                          <span>⭐</span> Write a Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;