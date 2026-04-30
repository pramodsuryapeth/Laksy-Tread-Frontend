import API from "./api";

export const adminLogin = (data) => API.post("/admin/login", data);