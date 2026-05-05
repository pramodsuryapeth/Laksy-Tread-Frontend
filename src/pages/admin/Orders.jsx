import { useEffect, useState } from "react";
import PageWrapper from "../../components/admin/PageWrapper";
import Popup from "../../components/common/Popup";
import { updateOrderStatus } from "../../services/ordreService";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { getAllOrders } from "../../services/ordreService";

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
    try {
      const res = await getAllOrders();

      // 🔥 SAFE FIX
      const data = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      setOrders(data);

      console.log("ORDERS 👉", data); // debug
    } catch (err) {
      console.error("Orders fetch error:", err);
      setOrders([]); // fallback
    } finally {
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
 const filteredOrders = (orders || []).filter((order) => {
  if (activeTab !== "all" && order.deliveryType !== activeTab) return false;
  if (statusFilter !== "all" && order.status !== statusFilter) return false;
  return true;
});

const handleStatusChange = async (orderId, newStatus) => {
  try {
    const safeStatus = newStatus.trim().toLowerCase();

    console.log("Sending 👉", orderId, safeStatus);

    // ✅ FIX HERE
    await updateOrderStatus(orderId, safeStatus);

    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId ? { ...o, status: safeStatus } : o
      )
    );

    showPopup(`Order status updated to “${safeStatus}”`, "success");

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
          <div className="bg-gray-50 rounded-2xl p-5 shadow-sm border border-gray-100">
  
  <h4 className="text-md font-semibold text-gray-800 mb-4">
    👤 Customer Information
  </h4>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">

    {/* Name */}
    <div className="bg-white p-3 rounded-lg border">
      <p className="text-gray-500 text-xs">Name</p>
      <p className="font-semibold text-gray-800">
        {selectedOrder?.user?.name || "N/A"}
      </p>
    </div>

    {/* Phone */}
    <div className="bg-white p-3 rounded-lg border">
      <p className="text-gray-500 text-xs">Phone</p>
      <p className="font-semibold text-gray-800">
        {selectedOrder?.user?.phone || "N/A"}
      </p>
    </div>

    {/* Address */}
    <div className="bg-white p-3 rounded-lg border sm:col-span-2">
      <p className="text-gray-500 text-xs">Address</p>
      <p className="font-semibold text-gray-800">
        {selectedOrder?.user?.address || "N/A"}
      </p>
    </div>

    {/* City */}
    <div className="bg-white p-3 rounded-lg border">
      <p className="text-gray-500 text-xs">City</p>
      <p className="font-semibold text-gray-800">
        {selectedOrder?.user?.city || "N/A"}
      </p>
    </div>

    {/* State */}
    <div className="bg-white p-3 rounded-lg border">
      <p className="text-gray-500 text-xs">State</p>
      <p className="font-semibold text-gray-800">
        {selectedOrder?.user?.state || "N/A"}
      </p>
    </div>

    {/* Pincode */}
    <div className="bg-white p-3 rounded-lg border sm:col-span-2">
      <p className="text-gray-500 text-xs">Pincode</p>
      <p className="font-semibold text-gray-800">
        {selectedOrder?.user?.pincode || "N/A"}
      </p>
    </div>

  </div>
</div>
             <div className="bg-gray-50 rounded-2xl p-5 shadow-sm border border-gray-100">

  <h4 className="text-md font-semibold text-gray-800 mb-4">
    🧾 Order Summary
  </h4>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">

    {/* Delivery Type */}
    <div className="bg-white p-3 rounded-lg border">
      <p className="text-gray-500 text-xs">Delivery Type</p>
      <p className="font-semibold text-gray-800 capitalize">
        {selectedOrder?.deliveryType || "N/A"}
      </p>
    </div>

    {/* Total Amount */}
    <div className="bg-white p-3 rounded-lg border">
      <p className="text-gray-500 text-xs">Total Amount</p>
      <p className="font-bold text-green-600">
        ₹{selectedOrder?.charges?.finalAmount?.toLocaleString() || "0"}
      </p>
    </div>

    {/* Order ID */}
    <div className="bg-white p-3 rounded-lg border sm:col-span-2">
      <p className="text-gray-500 text-xs">Order ID</p>
      <p className="font-medium text-gray-800">
        #{selectedOrder?.orderId || selectedOrder?._id?.slice(-6) || "N/A"}
      </p>
    </div>

    {/* Date */}
    <div className="bg-white p-3 rounded-lg border sm:col-span-2">
      <p className="text-gray-500 text-xs">Order Date</p>
      <p className="font-medium text-gray-800">
        {selectedOrder?.createdAt
          ? new Date(selectedOrder.createdAt).toLocaleString()
          : "N/A"}
      </p>
    </div>

  </div>
</div>
           <div className="bg-gray-50 rounded-2xl p-5 shadow-sm border">

  <h4 className="text-md font-semibold text-gray-800 mb-4">
    🛒 Order Items
  </h4>

  <div className="space-y-4">

    {(selectedOrder?.items || []).map((item, idx) => (
      <div key={idx} className="bg-white p-4 rounded-xl border space-y-3">

        {/* 🔹 Top section */}
        <div className="flex gap-4">
          <img
            src={item?.image || "https://via.placeholder.com/80"}
            className="w-20 h-20 rounded-lg object-cover border"
          />

          <div className="flex-1">
            <p className="font-semibold">{item?.name}</p>
            <p className="text-xs text-gray-500">
              Size: {item?.size || "-"} | Color: {item?.color || "-"}
            </p>
            <p className="text-sm">Qty: {item?.quantity}</p>
            <p className="text-green-600 font-semibold">
              ₹{item?.price}
            </p>
          </div>
        </div>

        {/* 🎨 DESIGN IMAGE */}
        {item?.designImage?.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Design Image</p>
            <div className="flex gap-2 flex-wrap">
              {item.designImage.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="w-16 h-16 rounded border object-cover"
                />
              ))}
            </div>
          </div>
        )}
        {/* 📝 NOTE */}
        {item?.note && (
          <div className="bg-yellow-50 p-2 rounded border text-sm">
            <span className="text-gray-500 text-xs">Note:</span>
            <p className="font-medium text-gray-700">{item.note}</p>
          </div>
        )}

      </div>
    ))}

 {selectedOrder?.uploadedImages?.length > 0 && (
  <div>
    <p className="text-xs text-gray-500 mb-2">Uploaded Files</p>

    <div className="flex flex-col gap-2">
      {selectedOrder.uploadedImages.map((file, i) => {
        const fileName = file.split("/").pop().split("?")[0];
        const isImage = file.match(/\.(jpg|jpeg|png|webp)$/i);

        return (
          <div
            key={i}
            className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border"
          >
            <div className="flex items-center gap-2">
              {isImage && (
                <img
                  src={file}
                  alt="preview"
                  className="w-8 h-8 object-cover rounded"
                />
              )}

              <p className="text-sm text-gray-700 truncate max-w-[150px]">
                {fileName}
              </p>
            </div>

            <div className="flex gap-3">
              {/* VIEW */}
              <a
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-xs font-medium hover:underline"
              >
                View
              </a>

              {/* DOWNLOAD */}
              <a
                href={file.replace("/upload/", "/upload/fl_attachment/")}
                download
                className="text-green-600 text-xs font-medium hover:underline"
              >
                Download
              </a>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

  </div>
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