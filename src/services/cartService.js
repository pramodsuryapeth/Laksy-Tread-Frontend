import API from "./api";

// ✅ Add to Cart
export const addCart = async (data) => {
  const res = await API.post("/cart/add", data);
  return res.data;
};

// ✅ Get Cart
export const getCart = async () => {
  const res = await API.get("/cart");
  return res.data;
};

// ✅ Remove from Cart
export const removeFromCart = async (data) => {
  const res = await API.delete("/cart/remove", { data });
  return res.data;
};

// ✅ Update Cart (increase/decrease qty)
export const updateCart = async (data) => {
  const res = await API.put("/cart/update", data);
  return res.data;
};