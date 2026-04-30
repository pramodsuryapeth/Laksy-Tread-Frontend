import { useState } from "react";

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored && stored !== "undefined"
        ? JSON.parse(stored)
        : null;
    } catch {
      return null;
    }
  });

  const login = (data) => {
     localStorage.setItem("token", data.token); 
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  };

 const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token"); // 🔥 THIS IS MISSING
  setUser(null);
};

  return { user, login, logout };
}