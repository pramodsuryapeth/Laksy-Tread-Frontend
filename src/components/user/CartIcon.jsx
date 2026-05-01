import { useNavigate } from "react-router-dom";

function CartIcon({ count = 0 }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/cart")}
      className="relative text-xl"
    >
      🛒

      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

export default CartIcon;