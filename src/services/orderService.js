import API from "./api";

/* ===============================
   👤 USER APIs
================================ */

// 🔹 Checkout (create order)
export const checkoutOrder = async (data) => {
  const res = await API.post("/order/checkout", data); // ✅ FIX
  return res.data;
};

// 🔹 Get logged-in user orders
export const getMyOrders = async () => {
  const res = await API.get("/orders/my");
  return res.data;
};

// 🔹 Get single order (user / admin shared)
export const getOrderById = async (orderId) => {
  const res = await API.get(`/orders/${orderId}`);
  return res.data;
};


/* ===============================
   🧑‍💼 ADMIN APIs
================================ */

// 🔹 Get all orders
export const getAllOrders = async () => {
  const res = await API.get("/orders/all");
  return res.data;
};

// 🔹 Update order status
export const updateOrderStatus = async (orderId, status) => {
  const res = await API.put("/orders/status", {
    orderId,
    status
  });
  return res.data;
};

// 🔹 Get revenue
export const getRevenue = async () => {
  const res = await API.get("/orders/revenue");
  return res.data;
};