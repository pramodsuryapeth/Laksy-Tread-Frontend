import { useNavigate } from "react-router-dom";
import UserAvatar from "./UserAvatar";
import CartIcon from "./CartIcon";
import { useAuth } from "../../hooks/useAuth";
import { useModal } from "../../hooks/useModal";
import Modal from "../common/Modal";
import UserLogin from "./UserLogin";
import { useCart } from "../../hooks/useCart";

function UserHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { open, openModal, closeModal } = useModal();
  const { cartCount } = useCart();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
            
            {/* ── BRANDING / LOGO ─────────────────────────────── */}
            <div
              onClick={() => navigate("/")}
              className="cursor-pointer group flex items-center gap-2 sm:gap-3 select-none"
            >
              {/* Logo Image (from /public) */}
              <img
                src="/logo.png"   // 👈 your logo file in /public
                alt="कलाकार Logo"
                className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full object-contain
                           group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
              />

              <div className="flex flex-col leading-tight">
                {/* Hindi Name – Rainbow Gradient + Glow */}
                <span
                  className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-wide
                             bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400
                             bg-clip-text text-transparent
                             drop-shadow-[0_1px_2px_rgba(245,40,145,0.3)]"
                >
                  कलाकार
                </span>
                {/* English Subtitle – Subtle but crisp */}
                <span className="text-[9px] sm:text-[10px] md:text-xs font-bold tracking-[0.25em] text-gray-600 uppercase">
                  PRINT STUDIO
                </span>
              </div>
            </div>

            {/* ── RIGHT ACTIONS (Cart, User/Login) ────────────── */}
            <div className="flex items-center gap-3 sm:gap-5">
              
              <CartIcon count={cartCount} />

              {user ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  <UserAvatar
                    user={user}
                    className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 ring-2 ring-gray-200 hover:ring-gray-400 transition"
                  />
                  <button
                    onClick={logout}
                    className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={openModal}
                  className="relative overflow-hidden group bg-black text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10">Login</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modal for login */}
      <Modal open={open} onClose={closeModal}>
        <UserLogin onClose={closeModal} />
      </Modal>
    </>
  );
}

export default UserHeader;