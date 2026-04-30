import { Navigate } from "react-router-dom";
import { ROLES } from "../../utils/constants";

function UserRoute({ children }) {
  let user = null;

  try {
    const stored = localStorage.getItem("user");

    if (stored && stored !== "undefined") {
      user = JSON.parse(stored);
    }
  } catch {
    user = null;
  }

  if (!user || user.role !== ROLES.USER) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default UserRoute;