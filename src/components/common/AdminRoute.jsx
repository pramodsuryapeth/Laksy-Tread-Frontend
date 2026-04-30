import { Navigate, useLocation } from "react-router-dom";
import { ROLES } from "../../utils/constants";

function AdminRoute({ children }) {
  let user = null;
  const location = useLocation();

  try {
    const stored = localStorage.getItem("user"); // ✅ FIX

    if (stored && stored !== "undefined") {
      user = JSON.parse(stored);
    }
  } catch (err) {
    user = null;
    console.error("Error parsing user:", err);
  }

  // ✅ Only protect admin routes
  if (location.pathname.startsWith("/admin")) {
    if (!user || user.role !== ROLES.ADMIN) {
      return <Navigate to="/admin/login" replace />;
    }
  }

  return children;
}

export default AdminRoute;