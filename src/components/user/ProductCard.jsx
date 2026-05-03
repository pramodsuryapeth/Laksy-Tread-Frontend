import { useState } from "react";
import { useCart } from "../../hooks/useCart";
import { useNavigate } from "react-router-dom";
import Popup from "../common/Popup";

function ProductCard({ product, onProtectedAction }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [hovered, setHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const [showSizePopup, setShowSizePopup] = useState(false); // 🔥 NEW

  if (!product) return null;

  const images = Array.isArray(product.images) ? product.images : [];

  const displayImage =
    hovered && images.length > 1 ? images[1] : images[0];

  const formattedPrice = product.price?.toLocaleString("en-IN");

  // 🔥 COMMON ADD FUNCTION
  const addItem = async (size) => {
    const action = async () => {
      try {
        await addToCart({
          productId: product.productId,
          variantId: product._id,
          name: product.productName,
          price: product.price,
          size,
          color: product.color,
          image: product.images?.[0],
          quantity: 1,
        });

        setPopupMsg("🛒 Item added to cart!");
        setShowPopup(true);

      } catch (err) {
        setPopupMsg("❌ Failed: " + err.message);
        setShowPopup(true);
      }
    };

    onProtectedAction ? onProtectedAction(action) : action();
  };

  // 🔥 ADD BUTTON
  const handleAdd = (e) => {
    e.stopPropagation();

    // multiple sizes → popup
    if (product.sizes && product.sizes.length > 1) {
      setShowSizePopup(true);
      return;
    }

    // single size → direct
    const size = product.size || product.sizes?.[0];
    addItem(size);
  };

  // 🔥 BUY BUTTON (same logic)
  const handleBuy = (e) => {
    e.stopPropagation();

    const size = product.size || product.sizes?.[0];

    const action = () => {
  navigate("/checkout", {
    state: {
      selectedItems: [
        {
          productId: product.productId,
          variantId: product._id,
          name: product.productName,
          price: product.price,
          size,
          color: product.color,
          image: images[0],
          quantity: 1,
        },
      ],
      fromCart: false,
    },
  });
};

    onProtectedAction ? onProtectedAction(action) : action();
  };

  const handleView = () => {
    navigate(`/product/${product.productId}?variant=${product._id}`);
  };

  return (
    <>
      {/* 🔥 SIZE POPUP */}
      {showSizePopup && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-5 rounded-lg text-center">
            <h3 className="mb-3 font-semibold">Select Size</h3>

            <div className="flex gap-2 justify-center mb-4">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setShowSizePopup(false);
                    addItem(s); // ✅ select → add
                  }}
                  className="px-3 py-1 border rounded hover:bg-black hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSizePopup(false)}
              className="text-sm text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 🔥 SUCCESS / ERROR POPUP */}
      {showPopup && (
        <Popup
          show={showPopup}
          type="success"
          message={popupMsg}
          onClose={() => setShowPopup(false)}
        />
      )}

      {/* 🔥 CARD */}
      <div
        onClick={handleView}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group bg-white rounded-xl border shadow hover:shadow-lg cursor-pointer"
      >
        <img
          src={displayImage || "/placeholder.png"}
          alt=""
          className="w-full h-56 object-cover"
        />

        <div className="p-3">
          <h3 className="font-semibold">{product.productName}</h3>
          <p>₹{formattedPrice}</p>

          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="flex-1 border py-1">
              Add
            </button>
            <button
              onClick={handleBuy}
              className="flex-1 bg-black text-white py-1"
            >
              Buy
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductCard;