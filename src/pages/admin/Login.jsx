import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../../services/authService";
import { ROLES } from "../../utils/constants";
import Popup from "../../components/common/Popup";
import { getErrorMessage } from "../../utils/getErrorMessage";

function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: "", type: "success" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await adminLogin(form);

    localStorage.setItem(
      "user",
      JSON.stringify({ token: res.data.token, role: ROLES.ADMIN })
    );

    setPopup({ show: true, message: "Welcome back, Admin", type: "success" });

    setTimeout(() => navigate("/admin/dashboard"), 1500);

  } catch (err) {
    setPopup({
      show: true,
      message: getErrorMessage(err),
      type: "error"
    });

    setLoading(false);   // 👈 important
    return;              // 👈 STOP execution
  }

  setLoading(false);
};
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50">
      {/* Subtle pattern overlay for texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#00000008_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Main card container */}
      <div className="relative z-10 w-full max-w-md px-4 sm:px-0">
        <div className="relative group">
          {/* Card with white background and black/dark gray accents */}
          <div className="relative bg-white rounded-3xl shadow-xl border border-gray-200 p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            {/* Brand section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-900 rounded-3xl shadow-md">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h1 className="mt-5 text-4xl font-bold text-gray-900 tracking-tight">
                LakshyTreade
              </h1>
              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-medium text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse" />
                Admin Portal
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition shadow-sm"
                    placeholder="admin@lakshytreade.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition shadow-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3.5 bg-gray-900 text-white font-semibold rounded-xl shadow-md transition-all duration-200 hover:bg-gray-800 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  "Access Dashboard"
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-gray-400 text-xs mt-8 pt-4 border-t border-gray-100">
              Secure admin area • LakshyTreade © 2025
            </p>
          </div>
        </div>
      </div>

      <Popup
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup({ ...popup, show: false })}
      />
    </div>
  );
}

export default AdminLogin;