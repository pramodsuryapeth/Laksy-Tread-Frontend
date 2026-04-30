import { useEffect, useState } from "react";
import PageWrapper from "../../components/admin/PageWrapper";
import Popup from "../../components/common/Popup";
import { updateOrderStatus } from "../../services/orderService";
import { getErrorMessage } from "../../utils/getErrorMessage";

const USE_DUMMY = true;

function Orders() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // "all", "pickup", "delivery"
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "received", "confirmed", ...
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState({ show: false, message: "", type: "success" });

  // Fetch orders (dummy or real)
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      if (USE_DUMMY) {
        setTimeout(() => {
          setOrders([
            {
              _id: "1",
              user: { name: "Pramod S", phone: "9876543210", address: "Pune, Maharashtra" },
              items: [{ name: "T-Shirt", size: "M", color: "Black", quantity: 2, image: "https://via.placeholder.com/100" }],
              deliveryType: "pickup",
              status: "received",
              charges: { finalAmount: 899 },
              createdAt: new Date(),
            },
            {
              _id: "2",
              user: { name: "Rahul K", phone: "9123456789", address: "Mumbai, Maharashtra" },
              items: [{ name: "Shirt", size: "L", color: "Blue", quantity: 1, image: "https://via.placeholder.com/100" }],
              deliveryType: "delivery",
              status: "ready",
              charges: { finalAmount: 1299 },
              createdAt: new Date(),
            },
            {
              _id: "3",
              user: { name: "Neha S", phone: "9988776655", address: "Delhi, India" },
              items: [{ name: "Jeans", size: "32", color: "Blue", quantity: 1, image: "https://via.placeholder.com/100" }],
              deliveryType: "pickup",
              status: "confirmed",
              charges: { finalAmount: 1999 },
              createdAt: new Date(),
            },
          ]);
          setLoading(false);
        }, 500);
      } else {
        // API call later
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const showPopup = (message, type = "success") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup((prev) => ({ ...prev, show: false })), 3000);
  };

  // Combined filter: delivery type + status
  const filteredOrders = orders.filter((order) => {
    if (activeTab !== "all" && order.deliveryType !== activeTab) return false;
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    return true;
  });

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      if (!USE_DUMMY) await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
      showPopup(`Order status updated to “${newStatus}”`, "success");
    } catch (err) {
      showPopup(getErrorMessage(err), "error");
    }
  };

  const getStatusColor = (status) => ({
    received: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    ready: "bg-purple-100 text-purple-700",
    dispatched: "bg-indigo-100 text-indigo-700",
    delivered: "bg-emerald-100 text-emerald-700",
  }[status] || "bg-gray-100 text-gray-700");

  const getDeliveryColor = (type) => type === "pickup" ? "bg-gray-100 text-gray-700" : "bg-sky-100 text-sky-700";

  // Status options for the filter bar
  const statuses = ["all", "received", "confirmed", "ready", "dispatched", "delivered"];

  return (
    <PageWrapper title="Orders">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all customer orders</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
          <span className="text-sm text-gray-600">Total Orders:</span>
          <span className="ml-2 font-semibold text-gray-800">{orders.length}</span>
        </div>
      </div>

      {/* ✅ Tab section: All / Pickup / Delivery */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {[
            { key: "all", label: "All Orders" },
            { key: "pickup", label: "Pickup" },
            { key: "delivery", label: "Delivery" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ✅ Status filter bar (scrollable on mobile) */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition ${
                statusFilter === status
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === "all" ? "All status" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
              <div className="flex justify-between">
                <div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-32"></div><div className="h-6 bg-gray-200 rounded w-24"></div></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="mt-4 flex justify-between"><div className="h-6 bg-gray-200 rounded w-20"></div><div className="h-8 bg-gray-200 rounded w-24"></div></div>
              <div className="mt-3 h-8 bg-gray-200 rounded w-28"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state (after filters) */}
      {!loading && filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className="text-gray-400 mt-2">No orders match the selected filters.</p>
        </div>
      )}

      {/* Orders Grid */}
      {!loading && filteredOrders.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{order.user.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">₹{order.charges.finalAmount.toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full capitalize font-medium ${getDeliveryColor(order.deliveryType)}`}>
                    {order.deliveryType}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-gray-300 outline-none"
                  >
                    <option value="received">📦 Received</option>
                    <option value="confirmed">✅ Confirmed</option>
                    <option value="ready">🎯 Ready</option>
                    <option value="dispatched">🚚 Dispatched</option>
                    <option value="delivered">🏠 Delivered</option>
                  </select>
                </div>

                <button onClick={() => setSelectedOrder(order)} className="mt-4 text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 transition">
                  View details
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal (unchanged, but kept for completeness) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="font-medium text-gray-700">Customer Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Name:</span><p className="font-medium">{selectedOrder.user.name}</p></div>
                  <div><span className="text-gray-500">Phone:</span><p className="font-medium">{selectedOrder.user.phone}</p></div>
                  <div className="sm:col-span-2"><span className="text-gray-500">Address:</span><p className="font-medium">{selectedOrder.user.address}</p></div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="font-medium text-gray-700">Order Summary</h4>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery Type:</span><span className="font-medium capitalize">{selectedOrder.deliveryType}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Total Amount:</span><span className="font-bold text-gray-800">₹{selectedOrder.charges.finalAmount.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs text-gray-400 pt-1"><span>Order ID: {selectedOrder._id}</span><span>{new Date(selectedOrder.createdAt).toLocaleString()}</span></div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Items</h4>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 border-b border-gray-100 pb-3 last:border-0">
                    <img src={item.image || "https://via.placeholder.com/80"} alt={item.name} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.size} / {item.color}</p>
                      <p className="text-sm text-gray-600 mt-1">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end">
              <button onClick={() => setSelectedOrder(null)} className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Close</button>
            </div>
          </div>
        </div>
      )}

      <Popup show={popup.show} type={popup.type} message={popup.message} onClose={() => setPopup({ ...popup, show: false })} />
    </PageWrapper>
  );
}

export default Orders;