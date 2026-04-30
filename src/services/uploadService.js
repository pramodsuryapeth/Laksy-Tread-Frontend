import API from "./api";

export const uploadImage = (formData) =>
  API.post("/upload", formData);