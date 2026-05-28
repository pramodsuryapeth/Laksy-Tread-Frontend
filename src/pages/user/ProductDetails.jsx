import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { getProducts } from "../../services/productService";
import Loading from "../../components/common/Loader";
import { useCart } from "../../hooks/useCart";
import { useNavigate } from "react-router-dom";
import Popup from "../../components/common/Popup";
import UserLogin from "../../components/user/UserLogin";
import { getReviews } from "../../services/reviewService";

// Skeleton Loader
const ProductDetailsSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-4">
        <div className="bg-gray-200 rounded-2xl h-[500px]" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-12 bg-gray-200 rounded w-1/3" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 w-16 bg-gray-200 rounded-full" />
            ))}
          </div>
        </div>
        <div className="h-24 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
);

// Star Rating Component
const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Product states
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [slideDirection, setSlideDirection] = useState("right");

  // Login protection states
  const [showLogin, setShowLogin] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [popupMsg, setPopupMsg] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);

  // Helper: check if user is logged in (valid token)
  const isLoggedIn = useCallback(() => {
    const token = localStorage.getItem("token");
    return token && token !== "undefined" && token !== "null" && token.trim() !== "";
  }, []);

  useEffect(() => {
    if (!product?._id) return;
    const fetchReviews = async () => {
      try {
        setReviewLoading(true);
        const data = await getReviews(product._id);
        setReviews(data || []);
      } catch (err) {
        console.error("Review fetch error:", err);
        setReviews([]);
      } finally {
        setReviewLoading(false);
      }
    };
    fetchReviews();
  }, [product?._id]);
  const handleVariantChange = (variant) => {
  setSelectedVariant(variant);

  if (Array.isArray(variant.color) && variant.color.length > 0) {
    setSelectedColor(variant.color[0]);
  }

  if (Array.isArray(variant.sizes) && variant.sizes.length > 0) {
    setSelectedSize(variant.sizes[0]);
  }
};

  // Protected action wrapper
  const handleProtectedAction = useCallback(
    (callback) => {
      if (isLoggedIn()) {
        callback();
      } else {
        setPendingAction(() => callback);
        setShowLogin(true);
      }
    },
    [isLoggedIn]
  );

  // Callbacks for login modal
  const onLoginSuccess = useCallback(() => {
    setShowLogin(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const onLoginClose = useCallback(() => {
    setShowLogin(false);
    setPendingAction(null);
  }, []);

  // Combined images (variant images + product images)
  const combinedImages = useMemo(() => {
    if (!selectedVariant) return [];
    return [
      ...(selectedVariant.images || []),
      ...(product?.images || []),
    ].filter(Boolean);
  }, [selectedVariant, product]);

  // Safe first image for cart / checkout
  const fallbackImage = "/placeholder-image.jpg";
  const primaryImage = combinedImages[0] || fallbackImage;

  // Available sizes for selected variant
  const availableSizes = useMemo(() => {
    if (!selectedVariant) return [];
    return selectedVariant.sizes || [];
  }, [selectedVariant]);

  // Flatten variants (one entry per color)
  const flattenedVariants = useMemo(() => {
    if (!product?.variants) return [];
    return product.variants.flatMap((variant) => {
      const colors = Array.isArray(variant.color) ? variant.color : [variant.color];
      return colors.map((color) => ({
        ...variant,
        color,
        originalColorArray: variant.color,
      }));
    });
  }, [product]);

  // Fetch product on mount
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await getProducts();
        const foundProduct = res.data.find((p) => p._id === id);
        if (!foundProduct) return;
        setProduct(foundProduct);

        const initialVariant = foundProduct.variants[0];
        setSelectedVariant(initialVariant);

        const initialColors = Array.isArray(initialVariant.color)
          ? initialVariant.color
          : [initialVariant.color];
        setSelectedColor(initialColors[0] || "");

        const initialSize = initialVariant.sizes?.[0] || null;
        setSelectedSize(initialSize);

        setQuantity(initialVariant.stock > 0 ? 1 : 0);
        setActiveImage(0);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);
  const availableVariants =
  product?.variants?.filter(
    (variant) =>
      variant &&
      Array.isArray(variant.sizes) &&
      variant.sizes.length > 0
  ) || [];

  // Color + variant change handler
  const handleVariantColorChange = useCallback((flatVariant) => {
    setSelectedVariant(flatVariant);
    setSelectedColor(flatVariant.color);
    const firstSize = flatVariant.sizes?.[0] || null;
    setSelectedSize(firstSize);
    setQuantity(flatVariant.stock > 0 ? 1 : 0);
    setSlideDirection("right");
    setActiveImage(0);
  }, []);

  // Size change handler
  const handleSizeChange = useCallback((size) => {
    setSelectedSize(size);
    setSlideDirection("right");
    setActiveImage(0);
  }, []);

  // Quantity updater
  const updateQuantity = useCallback(
    (newQty) => {
      if (newQty < 1) newQty = 1;
      if (selectedVariant?.stock && newQty > selectedVariant.stock)
        newQty = selectedVariant.stock;
      setQuantity(newQty);
    },
    [selectedVariant]
  );

  // Image navigation with direction
  const prevImage = () => {
    setSlideDirection("left");
    setActiveImage((prev) =>
      prev === 0 ? combinedImages.length - 1 : prev - 1
    );
  };
  const nextImage = () => {
    setSlideDirection("right");
    setActiveImage((prev) =>
      prev === combinedImages.length - 1 ? 0 : prev + 1
    );
  };

  const productDiscount =
  product?.discount?.percentage || 0;

const hasDiscount =
  productDiscount > 0;

const originalPrice =
  selectedVariant?.price;

const finalPrice =
  hasDiscount
    ? originalPrice -
      (originalPrice * productDiscount) / 100
    : originalPrice;

const discountPercent =
  productDiscount;

  // ---------- Protected actions (cart & buy) ----------
  const handleAddToCart = useCallback(() => {
    if (selectedVariant?.stock <= 0) return;
    const action = () => {
      addToCart({

  productId: product._id,

  variantId: selectedVariant._id,

  name: product.name,

  // 🔥 FINAL PRICE
  price: finalPrice,

  // 🔥 DISCOUNT DATA
  discount: productDiscount,

  originalPrice: originalPrice,

  finalPrice: finalPrice,

  size: selectedSize,

  color: selectedColor,

  image: primaryImage,

  quantity,

});
      setPopupMsg("🛒 Item added to cart!");
      setShowPopup(true);
    };
    handleProtectedAction(action);
  }, [
    selectedVariant,
    product,
    selectedSize,
    selectedColor,
    quantity,
    addToCart,
    primaryImage,
    handleProtectedAction,
    finalPrice,
    productDiscount,
    originalPrice,
  ]);

const handleBuyNow = useCallback(() => {

  if (selectedVariant?.stock <= 0) return;

  const action = () => {

    navigate("/checkout", {

      state: {

        selectedItems: [

          {

            productId: product._id,

            variantId: selectedVariant._id,

            name: product.name,

            // 🔥 DISCOUNT PRICE
            price: finalPrice,

            size: selectedSize,

            color: selectedColor,

            image: primaryImage,

            quantity,

          },

        ],

        fromCart: false,

      },

    });

  };

  handleProtectedAction(action);

}, [
  selectedVariant,
  product,
  selectedSize,
  selectedColor,
  quantity,
  navigate,
  primaryImage,
  handleProtectedAction,
  finalPrice,
]);

 const handleCustomize = useCallback(() => {

  const action = () => {

    navigate(`/customize/${product._id}`, {

      state: {

        product,

        variant: selectedVariant,

        selectedSize,

        // 🔥 DISCOUNT PRICE
        price: finalPrice,

        images: combinedImages,

      },

    });

  };

  handleProtectedAction(action);

}, [
  product,
  selectedVariant,
  selectedSize,
  combinedImages,
  navigate,
  handleProtectedAction,
  finalPrice,
]);

  // Loading / error states
  if (loading) return <ProductDetailsSkeleton />;
  if (!product || !selectedVariant) return <Loading />;

  // Derived values for UI
  const isOutOfStock = selectedVariant?.stock === 0;
  const stockLeft = selectedVariant?.stock || 0;
  const isLowStock = stockLeft > 0 && stockLeft <= 10;

  const avgRating = reviews.length
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 min-h-screen">
      {/* Direction-aware slide-in animations */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.4s ease-out;
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.4s ease-out;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Product main section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* LEFT: Image Gallery */}
          <div className="space-y-4">
            <div className="relative group bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100">
              <img
                key={activeImage}
                src={combinedImages[activeImage] || fallbackImage}
                alt={product.name}
                className={`w-full h-auto max-h-[550px] object-contain bg-white ${
                  slideDirection === "right"
                    ? "animate-slide-in-right"
                    : "animate-slide-in-left"
                }`}
              />
              {combinedImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110 backdrop-blur-sm"
                  >
                    ◀
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110 backdrop-blur-sm"
                  >
                    ▶
                  </button>
                </>
              )}
              {discountPercent > 0 && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
                  {discountPercent}% OFF
                </div>
              )}
            </div>
            {combinedImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {combinedImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSlideDirection(i > activeImage ? "right" : "left");
                      setActiveImage(i);
                    }}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                      activeImage === i
                        ? "border-gray-900 ring-2 ring-gray-900/20"
                        : "border-gray-200 hover:border-gray-400 hover:scale-105"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-sm text-gray-500">by The कला Trends</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(avgRating)} />
                  <span className="text-sm text-gray-600">
                    ({reviews.length} reviews)
                  </span>
                </div>
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                  </span>
                  In Stock
                </span>
              </div>
            </div>

            <div className="border-t border-b border-gray-100 py-4">
              <div className="flex items-baseline gap-3 flex-wrap">
               <div className="flex items-baseline gap-3 flex-wrap">

  {/* FINAL PRICE */}

  <p className="text-3xl font-bold text-gray-900">

    ₹{finalPrice?.toLocaleString("en-IN")}

  </p>


  {/* ORIGINAL PRICE */}

  {hasDiscount && (

    <>

      <p className="text-lg text-red-500 line-through font-semibold">

        ₹{originalPrice?.toLocaleString("en-IN")}

      </p>


      {/* SAVE BADGE */}

      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">

        Save ₹
        {(
          originalPrice - finalPrice
        ).toLocaleString("en-IN")}

      </span>

    </>

  )}

</div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Inclusive of all taxes
              </p>
            </div>

            {/* Color selection – using flattenedVariants */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                Color
                <span className="text-xs font-normal text-gray-500">
                  (Select variant)
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {flattenedVariants.map((fv) => (
                  <button
                    key={`${fv._id}-${fv.color}`}
                    onClick={() => handleVariantColorChange(fv)}
                    className={`px-5 py-2 rounded-full border text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      selectedVariant._id === fv._id && selectedColor === fv.color
                        ? "bg-gray-900 text-white border-gray-900 shadow-md scale-105"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-sm"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full inline-block border border-gray-300"
                      style={{ backgroundColor: fv.color || "#ccc" }}
                    ></span>
                    {fv.color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size selection */}
            {availableSizes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Size</h3>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSizeChange(size)}
                      disabled={isOutOfStock}
                      className={`min-w-[70px] px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        size === selectedSize
                          ? "bg-gray-900 text-white border-gray-900 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-sm"
                      } ${
                        isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock & Quantity */}
            <div className="space-y-3">
              <div className="flex items-center flex-wrap gap-3">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    !isOutOfStock ? "bg-green-600 animate-pulse" : "bg-red-600"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    !isOutOfStock ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {!isOutOfStock
                    ? `In Stock • ${stockLeft} items left`
                    : "Out of Stock"}
                </p>
                {isLowStock && !isOutOfStock && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    Hurry, only {stockLeft} left!
                  </span>
                )}
              </div>

              {!isOutOfStock && (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">
                    Quantity:
                  </span>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                    <button
                      onClick={() => updateQuantity(quantity - 1)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      −
                    </button>
                    <span className="w-12 text-center py-2 text-gray-900 font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(quantity + 1)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">
                    Max {stockLeft}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 border-2 border-gray-900 rounded-xl font-semibold text-gray-900 hover:bg-gray-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Buy Now
              </button>
            </div>

            {/* Description */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Product Description
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.description || "No description available."}
              </p>
            </div>
          </div>
        </div>

        {/* Custom T‑Shirt Designer Section */}
        <div className="mt-20 pt-8 border-t border-gray-200">
          <div className="text-center">
            <button
              onClick={handleCustomize}
              className="px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
            >
              🎨 Customize Your T‑Shirt
            </button>
            <p className="text-gray-500 text-sm mt-3">
              Upload images, add text, and create your own unique design on a
              dedicated editor.
            </p>
          </div>
        </div>

        {/* All Variants Section */}
       {/* All Variants Section */}
{availableVariants.length > 1 && (
  <div className="mt-16 pt-8 border-t border-gray-200">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-gray-900">
        All Variants
      </h2>

      <p className="text-gray-500 text-sm mt-1">
        Choose your perfect match
      </p>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {availableVariants.map((variant) => {
        const isSelected = selectedVariant._id === variant._id;

        const variantImage =
          variant.images?.[0] ||
          product.images?.[0] ||
          fallbackImage;

        return (
          <button
            key={variant._id}
            onClick={() => handleVariantChange(variant)}
            className={`group border rounded-xl p-3 text-left transition-all duration-200 ${
              isSelected
                ? "border-gray-900 ring-2 ring-gray-900 shadow-lg transform scale-[1.02]"
                : "border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-1"
            } bg-white`}
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
              <img
                src={variantImage}
                alt="variant"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            <p className="font-semibold text-gray-800 truncate">
              {Array.isArray(variant.color)
                ? variant.color.join(", ")
                : variant.color}
            </p>

            <p className="text-lg font-bold text-gray-900 mt-1">
              ₹{variant.price.toLocaleString("en-IN")}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              {variant.sizes?.length || 0} sizes
            </p>

            {isSelected && (
              <div className="mt-2 text-xs text-white bg-gray-900 rounded-full px-2 py-0.5 inline-block">
                Selected
              </div>
            )}
          </button>
        );
      })}
    </div>
  </div>
)}

        {/* Reviews Section */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Customer Reviews
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-2">
                <div className="flex items-center">
                  <StarRating rating={Math.round(avgRating)} />
                  <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">
                    {avgRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  Based on {reviews.length} reviews
                </span>
              </div>
            </div>
            <button className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition shadow-md hover:shadow-lg text-sm sm:text-base self-center sm:self-auto">
              Write a Review
            </button>
          </div>

          <div className="space-y-5">
            {reviewLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-gray-900"></div>
                <p className="text-gray-500 mt-3">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <p className="text-gray-500">No reviews yet 😢</p>
                <p className="text-sm text-gray-400 mt-1">Be the first to review this product!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex justify-center sm:justify-start">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          review.userId?.email?.split("@")[0] || "User"
                        )}&background=random&color=fff&rounded=true&size=48`}
                        className="w-12 h-12 rounded-full ring-2 ring-white shadow-sm"
                        alt="avatar"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="text-center sm:text-left">
                          <h4 className="font-bold text-gray-900 text-base">
                            {review.userId?.email?.split("@")[0] || "User"}
                          </h4>
                          <p className="text-xs text-gray-400 break-all mt-0.5">
                            {review.userId?.email || "anonymous@example.com"}
                          </p>
                        </div>
                        <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full self-center sm:self-auto whitespace-nowrap">
                          ✓ Verified
                        </span>
                      </div>

                      <div className="flex items-center justify-center sm:justify-start gap-3 mt-1">
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <p className="text-gray-700 text-sm leading-relaxed mt-3 text-center sm:text-left">
                        {review.comment}
                      </p>

                      {review.images?.length > 0 && (
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                          {review.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`review-img-${i}`}
                              className="w-20 h-20 rounded-xl border border-gray-200 object-cover shadow-sm hover:scale-105 transition-transform duration-200"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Popup for cart messages */}
      <Popup
        message={popupMsg}
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
      />

      {/* Login Modal */}
      {showLogin && (
        <UserLogin onSuccess={onLoginSuccess} onClose={onLoginClose} />
      )}
    </div>
  );
}

export default ProductDetails;