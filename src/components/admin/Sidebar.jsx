import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingCart,
  LogOut,
  X,
} from "lucide-react";

function Sidebar({ isMobileOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menu = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Products", path: "/admin/products", icon: <Package size={18} /> },
    { name: "Add Product", path: "/admin/add-product", icon: <PlusCircle size={18} /> },
    { name: "Orders", path: "/admin/orders", icon: <ShoppingCart size={18} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  // Lock body scroll when mobile sidebar opens
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isMobileOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMobileOpen, onClose]);

  // Active route detection with nested paths support
  const isActiveRoute = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Section */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Admin Panel
            </h2>
            <p className="text-xs text-gray-500 mt-1">Manage your store</p>
          </div>
          {isMobileOpen && (
            <button
              onClick={onClose}
              className="md:hidden text-gray-400 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <ul className="space-y-1.5">
          {menu.map((item) => {
            const isActive = isActiveRoute(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => isMobileOpen && onClose()}
                  className={`
                    group flex items-center gap-3 px-4 py-2.5 rounded-xl
                    transition-all duration-200 ease-out
                    ${isActive
                      ? "bg-white/10 text-white shadow-sm border border-white/20"
                      : "text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1"
                    }
                  `}
                >
                  <span className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60"></span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-400 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200 group"
      >
        <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        <span>Logout</span>
      </button>
    </div>
  );

  // Desktop version
  if (!isMobileOpen) {
    return (
      <div className="hidden md:flex md:w-64 bg-gradient-to-b from-gray-900 to-black text-white min-h-screen p-5 flex-col justify-between sticky top-0 border-r border-white/10 shadow-2xl">
        {sidebarContent}
      </div>
    );
  }

  // Mobile version with overlay + slide + fade animation
  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
        onClick={onClose}
      />
      {/* Sidebar panel - slide + fade */}
      <div className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-gray-900 to-black text-white z-50 p-5 shadow-2xl animate-slideInLeft md:hidden border-r border-white/10">
        {sidebarContent}
      </div>
    </>
  );
}

export default Sidebar;