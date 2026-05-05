import API from "./api";

export const uploadFiles = async (formData) => {
  const res = await API.post("/order/upload", formData);
  return res.data.urls;
};