/**
 * UserHeader.jsx  ─  Kalakar Print Studio
 *
 * ✅  Shirt-on-hanger icon: base64-embedded PNG cropped from original logo
 * ✅  "कलाकार" rainbow gradient — stops sampled pixel-by-pixel from the PNG:
 *       0%  #FF2700  deep red
 *      15%  #FF5700  red-orange
 *      28%  #FF9A00  orange
 *      40%  #FFB901  amber
 *      50%  #D1CF00  yellow-green
 *      62%  #73D601  bright green
 *      78%  #25C6B7  cyan-teal
 *     100%  #4086FF  cobalt-indigo
 * ✅  "PRINT STUDIO" — #1a1a1a, Helvetica, 700, 0.28em letter-spacing, CAPS
 * ✅  Fully responsive: iPhone SE (375px) → tablet → desktop
 */

import { useNavigate } from "react-router-dom";
import UserAvatar from "./UserAvatar";
import CartIcon from "./CartIcon";
import { useAuth } from "../../hooks/useAuth";
import { useModal } from "../../hooks/useModal";
import Modal from "../common/Modal";
import UserLogin from "./UserLogin";
import { useCart } from "../../hooks/useCart";

/* ── Gradient SVG ID (must be unique on page) ─────────────────── */
const GRAD_ID = "kalakarLogoGrad";

/* ── Shirt icon: exact PNG from logo, base64 embedded ─────────── */
const SHIRT_ICON = "data:image/png;base64,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";

function UserHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { open, openModal, closeModal } = useModal();
  const { cartCount } = useCart();

  return (
    <>
      {/* Hidden SVG — puts gradient def into the DOM for SVG text fill */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={GRAD_ID} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#FF2700" />
            <stop offset="15%"  stopColor="#FF5700" />
            <stop offset="28%"  stopColor="#FF9A00" />
            <stop offset="40%"  stopColor="#FFB901" />
            <stop offset="50%"  stopColor="#D1CF00" />
            <stop offset="62%"  stopColor="#73D601" />
            <stop offset="78%"  stopColor="#25C6B7" />
            <stop offset="100%" stopColor="#4086FF" />
          </linearGradient>
        </defs>
      </svg>

      {/* ─── HEADER ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-[72px]">

            {/* BRAND */}
            <div
              onClick={() => navigate("/")}
              className="cursor-pointer group flex items-center gap-2 sm:gap-2.5 select-none"
            >
              {/*
                Shirt-on-hanger icon
                – exact PNG pixels from the original logo file
                – hover: scale + slight rotation (same as original code)
              */}
              <img
                src={SHIRT_ICON}
                alt=""
                aria-hidden="true"
                className="object-contain flex-shrink-0
                           w-8 h-8 sm:w-10 sm:h-10 md:w-[52px] md:h-[52px]
                           transition-transform duration-300
                           group-hover:scale-110 group-hover:rotate-3"
              />

              {/* Text stack */}
              <div className="flex flex-col" style={{ gap: "2px", lineHeight: 1 }}>

                {/*
                  "कलाकार"
                  SVG <text> with linearGradient fill — renders correctly
                  on ALL devices (iOS Safari / Android / Desktop).
                  CSS background-clip: text has known rendering bugs with
                  Devanagari glyphs on WebKit, so we use SVG instead.
                */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 310 52"
                  aria-label="कला"
                  role="img"
                  className="w-auto h-[26px] sm:h-[30px] md:h-[38px]"
                  style={{ overflow: "visible", display: "block" }}
                >
                  <text
                    x="1"
                    y="44"
                    fontFamily="'Noto Sans Devanagari', 'Mangal', 'Arial Unicode MS', sans-serif"
                    fontWeight="900"
                    fontSize="48"
                    fill={`url(#${GRAD_ID})`}
                    letterSpacing="1.5"
                  >
                    कला
                  </text>
                </svg>

                {/*
                  "PRINT STUDIO"
                  Color #1a1a1a (from pixel scan of PNG: mostly ~#020202 to #3A3A3A)
                  Wide letter-spacing, bold, all-caps — exactly as in the logo
                */}
                <span
                  style={{
                    fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.30em",
                    color: "#1a1a1a",
                    display: "block",
                  }}
                  className="text-[7px] sm:text-[8.5px] md:text-[10px]"
                >
                  trends
                </span>
              </div>
            </div>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-3 sm:gap-5">

              <CartIcon count={cartCount} />

              {user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <UserAvatar
                    user={user}
                    className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10
                               ring-2 ring-gray-200 hover:ring-gray-400 transition"
                  />
                  <button
                    onClick={logout}
                    className="text-xs sm:text-sm font-medium text-gray-600
                               hover:text-gray-900 hover:bg-gray-100
                               px-2.5 py-1.5 rounded-lg transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={openModal}
                  className="relative overflow-hidden group
                             bg-black text-white
                             px-3.5 sm:px-5 py-1.5 sm:py-2
                             rounded-xl text-xs sm:text-sm font-semibold
                             shadow-md hover:shadow-lg
                             transition-all duration-300
                             hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10">Login</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700
                                   opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Login Modal */}
      <Modal open={open} onClose={closeModal}>
        <UserLogin onClose={closeModal} />
      </Modal>
    </>
  );
}

export default UserHeader;