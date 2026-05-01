import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { getProducts, getVariants } from "../../services/productService";
import { CanvasProvider } from "../../context/CanvasProvider";
import TshirtDesigner from "../../components/common/TshirtDesigner";
import Loading from "../../components/common/Loader";
import { useLocation } from "react-router-dom";

function CustomizeProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation(); 
const size = state?.selectedSize;   // ✅ IMPORTANT
const images = state?.images;
const [product, setProduct] = useState(state?.product || null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changeBackgroundFn, setChangeBackgroundFn] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Derive variantImages and currentBgImage directly from selectedVariant (no effect needed)
  const variantImages = selectedVariant?.images || [];
const currentBgImage =
  variantImages[currentIndex] || "/tshirt-mockup.png";

  // Fetch product & variants
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const allProductsRes = await getProducts();
        const foundProduct = allProductsRes.data.find(p => p._id === productId);
        if (!foundProduct) throw new Error("Product not found");

        const variantsRes = await getVariants(productId);
        const fetchedVariants = variantsRes.data || [];

        setProduct(foundProduct);
        setVariants(fetchedVariants);

        if (fetchedVariants.length > 0) {
          setSelectedVariant(fetchedVariants[0]);
        } else {
          setError("No variants available.");
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load product data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  // When selectedVariant changes, update the canvas background (external action)
useEffect(() => {
  if (selectedVariant && changeBackgroundFn) {
    const images = selectedVariant.images || [];
    const defaultImg = images[0] || "/tshirt-mockup.png";

     // reset index

    changeBackgroundFn(defaultImg, `${selectedVariant._id}-0`); // ✅ only one call
  }
}, [selectedVariant, changeBackgroundFn]);

  // Callback from CanvasProvider – gives us the function to change background dynamically
  const handleProviderReady = useCallback((fn) => {
    setChangeBackgroundFn(() => fn);
  }, []);

  // Change background when user clicks a thumbnail (or next/prev)
const handleImageChange = (imgUrl, index) => {
  setCurrentIndex(index);
  changeBackgroundFn?.(imgUrl, `${selectedVariant._id}-${index}`); // ✅ key pass
};

  // Slider controls – use currentBgImage as derived value
 const nextImage = () => {
  if (!variantImages.length) return;
  const nextIndex = (currentIndex + 1) % variantImages.length;
  handleImageChange(variantImages[nextIndex], nextIndex);
};

 const prevImage = () => {
  if (!variantImages.length) return;
  const prevIndex = (currentIndex - 1 + variantImages.length) % variantImages.length;
  handleImageChange(variantImages[prevIndex], prevIndex);
};

  if (loading) return <Loading />;

  if (error || !product || !selectedVariant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Oops!</h2>
          <p className="text-gray-700 mb-6">{error || "No product or variant data available."}</p>
          <button
            onClick={() => navigate("/products")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition bg-white px-4 py-2 rounded-lg shadow-sm"
          >
            ← Back to Products
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 truncate">
            Customize {product.name}
          </h1>
          <div className="w-24 invisible md:visible" />
        </div>

        {/* Variant selector */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap items-center gap-4">
          <label className="font-semibold text-gray-700">Choose color:</label>
          <select
            value={selectedVariant._id}
           onChange={(e) => {
  const v = variants.find(v => v._id === e.target.value);

  setSelectedVariant(v);
  setCurrentIndex(0); // 🔥 MUST

  const defaultImg = v.images?.[0] || "/tshirt-mockup.png";

  changeBackgroundFn?.(defaultImg, `${v._id}-0`); // 🔥 key pass
}}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500"
          >
            {variants.map(v => (
              <option key={v._id} value={v._id}>
                {v.color} {v.stock && `(${v.stock} in stock)`}
              </option>
            ))}
          </select>
          {selectedVariant.price && (
            <span className="ml-auto text-lg font-bold text-green-600">
              ${selectedVariant.price}
            </span>
          )}
        </div>

        {/* Image Gallery (if multiple images exist) */}
        {variantImages.length > 1 && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Shirt Views:</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={prevImage}
                className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition"
                aria-label="Previous view"
              >
                ◀
              </button>
              <div className="flex flex-1 overflow-x-auto gap-3 py-2">
                {variantImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleImageChange(imgUrl, idx)} 
                    className={`border-2 rounded-lg overflow-hidden transition flex-shrink-0 ${
                      currentBgImage === imgUrl
                        ? "border-blue-500 shadow-md ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`View ${idx + 1}`}
                      className="w-16 h-16 object-cover"
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={nextImage}
                className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition"
                aria-label="Next view"
              >
                ▶
              </button>
            </div>
          </div>
        )}

        {/* Canvas Designer */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
  <CanvasProvider
    shirtImageUrl={currentBgImage}
    imageKey={`${selectedVariant._id}-${currentIndex}`}
    onProviderReady={handleProviderReady}
  >
<TshirtDesigner
  product={product}
  variant={selectedVariant}   // ✅ FIX
  size={size}
  images={images}
/>
  </CanvasProvider>
</div>

        <p className="text-center text-gray-500 text-sm mt-6">
          ✨ Add text, upload images, or draw on the T‑shirt. Your design will stay even when switching shirt views.
        </p>
      </div>
    </div>
  );
}

export default CustomizeProduct;