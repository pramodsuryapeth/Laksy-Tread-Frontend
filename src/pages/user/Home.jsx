import { useEffect, useState } from "react";
import { getProducts } from "../../services/productService";
import ProductGrid from "../../components/user/ProductGrid";
import UserLogin from "../../components/user/UserLogin";

function Home() {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showLogin, setShowLogin] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await getProducts();
        console.log("Products fetched:", res.data);

        const allVariants = (res?.data || []).flatMap((product) =>
  (product?.variants || []).map((variant) => ({
    ...variant, // ✅ keep original Mongo _id
    productName: product.name,
    productId: product._id,
    images: variant.images || [],
  }))
);

        setVariants(allVariants);
      } catch (err) {
        console.error(err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 🔐 PROTECTED ACTION (FINAL FIX)
  const handleProtectedAction = (callback) => {
    console.log("🔥 Protected clicked");

    const token = localStorage.getItem("token");

    // 🔥 SAFE CHECK
    if (!token || token === "undefined" || token === "null") {
      console.log("❌ No valid token → open login");

      setShowLogin(true);
      setPendingAction(() => callback);
      return;
    }

    console.log("✅ Token found → run action");
    callback();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">

      {error && <div className="bg-red-100 p-4">{error}</div>}

      <ProductGrid
        products={variants}
        loading={loading}
        onProtectedAction={handleProtectedAction}
      />

      {/* 🔥 LOGIN MODAL */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-white p-5 rounded-lg w-full max-w-md relative">

            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-2 right-3 text-xl"
            >
              ✕
            </button>

            <UserLogin
              onSuccess={() => {
                console.log("✅ Login success");

                setShowLogin(false);

                if (pendingAction) {
                  pendingAction();
                  setPendingAction(null);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;