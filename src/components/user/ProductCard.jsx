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
  const [showSizePopup, setShowSizePopup] = useState(false);

  if (!product) return null;

  const images = Array.isArray(product.images) ? product.images : [];
  const displayImage = hovered && images.length > 1 ? images[1] : images[0];
  const formattedPrice = product.price?.toLocaleString("en-IN");

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

  const handleAdd = (e) => {
    e.stopPropagation();
    if (product.sizes && product.sizes.length > 1) {
      setShowSizePopup(true);
      return;
    }
    const size = product.size || product.sizes?.[0];
    addItem(size);
  };

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
      {showSizePopup && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-5 sm:p-6 rounded-lg text-center w-full max-w-[90%] sm:max-w-sm">
            <h3 className="mb-3 font-semibold text-base sm:text-lg">Select Size</h3>
            <div className="flex gap-2 justify-center mb-4 flex-wrap">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setShowSizePopup(false);
                    addItem(s);
                  }}
                  className="px-4 py-2 border rounded hover:bg-black hover:text-white text-sm sm:text-base"
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSizePopup(false)}
              className="text-sm text-gray-500 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showPopup && (
        <Popup
          show={showPopup}
          type="success"
          message={popupMsg}
          onClose={() => setShowPopup(false)}
        />
      )}

      {/* CARD: image ~120px on phone → bigger on desktop */}
      <div
        onClick={handleView}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group bg-white rounded-xl border shadow hover:shadow-lg cursor-pointer transition-shadow overflow-hidden"
      >
        <img
          src={displayImage || "/placeholder.png"}
          alt=""
          className="w-full h-32 sm:h-44 md:h-56 object-cover"
        />
        <div className="p-2 sm:p-3">
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2">
            {product.productName}
          </h3>
          <p className="text-xs sm:text-sm mt-0.5">₹{formattedPrice}</p>
          <div className="flex gap-2 mt-2 sm:mt-3">
            <button
              onClick={handleAdd}
              className="flex-1 border py-1.5 rounded text-xs sm:text-sm font-medium hover:bg-gray-50"
            >
              Add
            </button>
            <button
              onClick={handleBuy}
              className="flex-1 bg-black text-white py-1.5 rounded text-xs sm:text-sm font-medium"
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