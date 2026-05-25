import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Sidebar from "../components/admin/Sidebar";

function AdminLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile sidebar on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen">
      
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="md:ml-64 min-h-screen flex flex-col">
        
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-white shadow-sm p-4 flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Menu size={24} className="text-gray-700" />
          </button>

          <h1 className="text-lg font-semibold text-gray-800">
            Admin Panel
          </h1>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;