import API from "./api";

//
// 🧾 CREATE ORDER (Checkout)
//
export const createOrder = (orderData) => {
  return API.post("/order/checkout", orderData);
};

//
// 👤 USER ORDERS
//
export const getMyOrders = () => {
  return API.get("/order/my");
};

//
// 🧑‍💼 ADMIN - ALL ORDERS
//
export const getAllOrders = () => {
  return API.get("/order/all");
};

//
// 🔍 SINGLE ORDER
//
export const getOrderById = (orderId) => {
  return API.get(`/order/${orderId}`);
};

//
// 🔄 UPDATE ORDER STATUS (ADMIN)
//
export const updateOrderStatus = (data) => {
  // data = { orderId, status }
  return API.put("/order/status", data);
};

//
// 💰 GET REVENUE (ADMIN)
//
export const getRevenue = () => {
  return API.get("/order/revenue");
};

export const createRazorpayOrder = (data) => {
  return API.post("/order/razorpay-order", data);
};

export const verifyPayment = (data) => {
  return API.post("/order/verify-payment", data);
};

