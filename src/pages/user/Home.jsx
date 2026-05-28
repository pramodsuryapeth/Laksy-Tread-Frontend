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


  // ================= FETCH PRODUCTS =================

  useEffect(() => {

    const fetchProducts = async () => {

      try {

        const res = await getProducts();

        console.log("Products fetched:", res.data);

        console.log(import.meta.env.VITE_RAZORPAY_KEY);

        console.log(import.meta.env.VITE_API_URL);


        // 🔥 ALL VARIANTS
        const allVariants = (res?.data || [])

          .flatMap((product) =>

            (product?.variants || []).map((variant) => ({

              ...variant,

              // 🔥 PRODUCT DETAILS
              productName: product.name,

              productId: product._id,

              // 🔥 DISCOUNT ADD
              discount: product.discount,

              // 🔥 IMAGES
              images: variant.images || [],

              // 🔥 DATES
              createdAt: product.createdAt,

              updatedAt: product.updatedAt,

            }))
          )

          // 🔥 LATEST PRODUCTS FIRST
          .sort(
            (a, b) =>
              new Date(
                b.updatedAt || b.createdAt
              ) -
              new Date(
                a.updatedAt || a.createdAt
              )
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


  // ================= PROTECTED ACTION =================

  const handleProtectedAction = (callback) => {

    console.log("🔥 Protected clicked");

    const token =
      localStorage.getItem("token");


    // 🔥 VALID TOKEN CHECK
    const isValidToken =
      token &&
      token !== "undefined" &&
      token !== "null";


    // ❌ NO TOKEN
    if (!isValidToken) {

      console.log(
        "❌ No valid token → open login"
      );

      setShowLogin(true);

      // 🔥 STORE CALLBACK
      setPendingAction(() => callback);

      return;
    }


    // ✅ TOKEN FOUND
    console.log(
      "✅ Token found → run action"
    );

    setShowLogin(false);

    callback();
  };


  return (

    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">

      {/* ================= ERROR ================= */}

      {error && (

        <div className="bg-red-100 text-red-600 p-4 rounded-lg">

          {error}

        </div>

      )}


      {/* ================= PRODUCTS ================= */}

      <ProductGrid
        products={variants}
        loading={loading}
        onProtectedAction={
          handleProtectedAction
        }
      />


      {/* ================= LOGIN MODAL ================= */}

      {showLogin && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">

          <div className="bg-white p-5 rounded-lg w-full max-w-md relative">

            {/* CLOSE BUTTON */}

            <button
              onClick={() =>
                setShowLogin(false)
              }
              className="absolute top-2 right-3 text-xl"
            >
              ✕
            </button>


            {/* LOGIN COMPONENT */}

            <UserLogin

              onSuccess={() => {

                console.log(
                  "✅ Login success"
                );

                // 🔥 CLOSE MODAL
                setShowLogin(false);

                // 🔥 RUN PENDING ACTION
                setTimeout(() => {

                  if (pendingAction) {

                    console.log(
                      "🔥 Running pending action"
                    );

                    pendingAction();

                    setPendingAction(null);
                  }

                }, 300);

              }}
            />

          </div>

        </div>

      )}

    </div>
  );
}

export default Home;