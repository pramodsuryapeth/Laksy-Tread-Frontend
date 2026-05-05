import API from "./api";

// ⭐ Add Review
export const addReview = async (formData) => {
  const res = await API.post("/review/add", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return res.data;
};

// 📦 Get reviews by product
export const getReviews = async (productId) => {
  const res = await API.get(`/review/${productId}`);
  return res.data;
};