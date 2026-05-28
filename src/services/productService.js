import API from "./api";

// =====================
// 📦 PRODUCT APIs
// =====================


// ➕ Add Product
export const addProduct = (data) =>
  API.post("/product/add", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// 📦 Get Products
export const getProducts = () =>
  API.get("/product");

// ✏ Update Product
export const updateProduct = (data) =>
  API.put("/product/update", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// ❌ Delete Product
export const deleteProduct = (productId) =>
  API.delete(`/product/${productId}`);


// =====================
// 🔁 VARIANT APIs
// =====================

// ➕ Add Variant
export const addVariant = (data) =>
  API.post("/product/variant", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  export const getVariants = (productId) =>
  API.get(`/product/variant/${productId}`);

// ✏ Update Variant
export const updateVariant = (data) =>
  API.put("/product/variant", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// ❌ Delete Variant
export const deleteVariant = (variantId) =>
  API.delete(`/product/variant/${variantId}`);

export const applyDiscountToProduct = async (data) => {
  const res = await API.put(
    "/product/apply-discount",
    data
  );

  return res.data;
};

// 🔥 REMOVE DISCOUNT FROM PRODUCT

export const removeDiscountFromProduct = async (data) => {

  const res = await API.put(

    "/product/remove-discount",

    data

  );

  return res.data;

};