import { useState } from "react";
import { useCart } from "../../hooks/useCart";
import { useNavigate } from "react-router-dom";

function ProductCard({ product, onProtectedAction }) {
  // ✅ ALWAYS CALL HOOKS FIRST
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  // ✅ THEN do conditional return
  if (!product) return null;

  const images = Array.isArray(product.images) ? product.images : [];

  const displayImage =
    hovered && images.length > 1 ? images[1] : images[0];

  const formattedPrice = product.price?.toLocaleString("en-IN");

  const firstSize = product.sizes?.[0] || product.size || "";
  // const hasMultipleSizes = product.sizes && product.sizes.length > 1;

  // const discountPercent =
  //   product.mrp && product.price
  //     ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
  //     : 0;

  const handleAdd = (e) => {
    e.stopPropagation();

    const action = () =>
      addToCart({
        productId: product.productId,
        variantId: product._id,
        name: product.productName,
        price: product.price,
        size: firstSize,
        color: product.color,
        image: images[0],
        quantity: 1,
      });

    onProtectedAction ? onProtectedAction(action) : action();
  };

const handleBuy = (e) => {
  e.stopPropagation();

  const action = () => {
    const productData = {
      productId: product.productId,
      variantId: product._id,
      name: product.productName,
      price: product.price,
      size: firstSize,
      color: product.color,
      image: images[0],
      quantity: 1,
    };

    navigate("/checkout", {
      state: productData, // 🔥 send data
    });
  };

  onProtectedAction ? onProtectedAction(action) : action();
};

  const handleView = () => {
    navigate(`/product/${product.productId}?variant=${product._id}`);
  };

  return (
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

        <div className="flex gap-2 mt-2">
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
  );
}

export default ProductCard;