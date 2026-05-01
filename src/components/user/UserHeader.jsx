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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo – with subtle hover effect */}
            <div 
              onClick={() => navigate("/")}
              className="cursor-pointer group"
            >
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent group-hover:from-gray-800 group-hover:to-gray-500 transition-all duration-300">
                LakshyTreade
              </h1>
              <div className="h-0.5 w-0 group-hover:w-full bg-gray-900 transition-all duration-300 mt-0.5 rounded-full" />
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4 sm:gap-6">
              
              {/* Cart Icon – with improved badge styling (count passed from CartIcon itself) */}
             <CartIcon count={cartCount}  />

              {/* User area */}
              {user ? (
                <div className="flex items-center gap-3 sm:gap-4">
                  <UserAvatar user={user} className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-gray-200 hover:ring-gray-400 transition" />
                  <button
                    onClick={logout}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={openModal}
                  className="relative overflow-hidden group bg-black text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
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