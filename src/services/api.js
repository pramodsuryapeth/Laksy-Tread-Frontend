import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

// 🔐 TOKEN ATTACH (USER + ADMIN SAFE)
API.interceptors.request.use((req) => {
  try {
    // 🔥 1. user token (NEW FIX)
    const userToken = localStorage.getItem("token");

    if (userToken) {
      req.headers.Authorization = `Bearer ${userToken}`;
      return req;
    }

    // 🔥 2. admin token (OLD FLOW untouched)
    const stored = localStorage.getItem("user");
    const user = stored ? JSON.parse(stored) : null;

    if (user?.token) {
      req.headers.Authorization = `Bearer ${user.token}`;
    }

  } catch (err) {
    console.error("Token parse error:", err);
  }

  return req;
});


// ❌ RESPONSE HANDLER (unchanged – admin safe)
API.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const path = window.location.pathname;

    console.error(
      "❌ API Error:",
      error.response?.data?.message || error.message
    );

    if (status === 401) {
      const isPublicPage =
        path === "/" ||
        path === "/login" ||
        path.startsWith("/product");

      if (!isPublicPage) {
        let user = null;

        try {
          const stored = localStorage.getItem("user");
          user = stored ? JSON.parse(stored) : null;
        } catch {
          console.error("Error parsing user from localStorage");
        }

        localStorage.removeItem("user");
        localStorage.removeItem("token"); // 🔥 add this

        // 🔥 admin logic untouched
        if (user?.role === "admin") {
          if (path !== "/admin/login") {
            window.location.href = "/admin/login";
          }
        } else {
          if (path !== "/") {
            window.location.href = "/";
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default API;