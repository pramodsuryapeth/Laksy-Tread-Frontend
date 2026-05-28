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

  // ================= IMAGES =================

  const images = Array.isArray(product.images)
    ? product.images
    : [];

  const displayImage =
    hovered && images.length > 1
      ? images[1]
      : images[0];


  // ================= DISCOUNT =================

  const hasDiscount = product.discount;

  const discountPercentage =
    product.discount?.percentage || 0;

  const finalPrice =
    product.price -
    (product.price * discountPercentage) / 100;

  const formattedOriginalPrice =
    product.price?.toLocaleString("en-IN");

  const formattedFinalPrice =
    finalPrice?.toLocaleString("en-IN");


  // ================= ADD TO CART =================

  const addItem = async (size) => {

    const action = async () => {

      try {

       await addToCart({

  productId: product.productId,

  variantId: product._id,

  name: product.productName,

  // 🔥 FINAL PRICE
  price: hasDiscount
    ? finalPrice
    : product.price,

  // 🔥 DISCOUNT DATA
  discount: discountPercentage,

  originalPrice: product.price,

  finalPrice: hasDiscount
    ? finalPrice
    : product.price,

  size,

  // 🔥 COLOR FIX
  color: Array.isArray(product.color)
    ? product.color[0]
    : product.color,

  image: product.images?.[0],

  quantity: 1,

});

        setPopupMsg("🛒 Item added to cart!");

        setShowPopup(true);

      } catch (err) {

        setPopupMsg(
          "❌ Failed: " + err.message
        );

        setShowPopup(true);

      }
    };

    onProtectedAction
      ? onProtectedAction(action)
      : action();
  };


  // ================= HANDLE ADD =================

  const handleAdd = (e) => {

    e.stopPropagation();

    if (
      product.sizes &&
      product.sizes.length > 1
    ) {

      setShowSizePopup(true);

      return;
    }

    const size =
      product.size ||
      product.sizes?.[0];

    addItem(size);
  };


  // ================= HANDLE BUY =================

  const handleBuy = (e) => {

    e.stopPropagation();

    const size =
      product.size ||
      product.sizes?.[0];

    const action = () => {

      navigate("/checkout", {
        state: {
          selectedItems: [
            {
              productId: product.productId,
              variantId: product._id,
              name: product.productName,

              // 🔥 FINAL PRICE STORE
              price: hasDiscount
                ? finalPrice
                : product.price,

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

    onProtectedAction
      ? onProtectedAction(action)
      : action();
  };


  // ================= VIEW PRODUCT =================

  const handleView = () => {

    navigate(
      `/product/${product.productId}?variant=${product._id}`
    );
  };


  return (
    <>

      {/* ================= SIZE POPUP ================= */}

      {showSizePopup && (

        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">

          <div className="bg-white p-5 sm:p-6 rounded-lg text-center w-full max-w-[90%] sm:max-w-sm">

            <h3 className="mb-3 font-semibold text-base sm:text-lg">
              Select Size
            </h3>

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


      {/* ================= POPUP ================= */}

      {showPopup && (

        <Popup
          show={showPopup}
          type="success"
          message={popupMsg}
          onClose={() => setShowPopup(false)}
        />

      )}


      {/* ================= PRODUCT CARD ================= */}

      <div
        onClick={handleView}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative group bg-white rounded-xl border shadow hover:shadow-lg cursor-pointer transition-shadow overflow-hidden"
      >

        {/* ================= DISCOUNT BADGE ================= */}

        {hasDiscount && (

          <div className="absolute top-2 left-2 z-10">

            <span className="bg-red-600 text-white text-[10px] sm:text-xs px-2 py-1 rounded-full font-semibold shadow">

              {discountPercentage}% OFF

            </span>

          </div>

        )}


        {/* ================= PRODUCT IMAGE ================= */}

        <img
          src={displayImage || "/placeholder.png"}
          alt=""
          className="w-full h-32 sm:h-44 md:h-56 object-cover"
        />


        {/* ================= CONTENT ================= */}

        <div className="p-2 sm:p-3 flex flex-col min-h-[120px]">

          {/* PRODUCT NAME */}

          <h3 className="font-semibold text-sm sm:text-base line-clamp-2 min-h-[40px]">

            {product.productName}

          </h3>


          {/* ================= PRICE ================= */}

          <div className="mt-2">

            {hasDiscount ? (

              <div className="flex items-center gap-2 flex-wrap">

                {/* FINAL PRICE */}

                <p className="text-lg sm:text-xl font-bold text-black">

                  ₹{formattedFinalPrice}

                </p>


                {/* ORIGINAL PRICE */}

                <p className="text-sm sm:text-base text-red-500 line-through font-semibold">

                  ₹{formattedOriginalPrice}

                </p>

              </div>

            ) : (

              <p className="text-sm sm:text-base font-semibold text-black">

                ₹{formattedOriginalPrice}

              </p>

            )}

          </div>


          {/* ================= BUTTONS ================= */}

          <div className="flex gap-2 mt-auto pt-3">

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