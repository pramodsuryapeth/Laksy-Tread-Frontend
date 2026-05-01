import { useCart } from "../../hooks/useCart";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Popup from "../../components/common/Popup";
import Loader from "../../components/common/Loader";
import { Link } from "react-router-dom";

function Cart() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal state for item selection before checkout
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState({});

  const total = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // Auto close popup
  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  // When opening modal, initialize selectedItemIds with all items checked by default
  const openSelectionModal = () => {
    const initialSelected = {};
    cart.forEach(item => {
      initialSelected[item.variantId] = true;
    });
    setSelectedItemIds(initialSelected);
    setShowSelectionModal(true);
  };

  const handleSelectAll = () => {
    const allSelected = {};
    cart.forEach(item => {
      allSelected[item.variantId] = true;
    });
    setSelectedItemIds(allSelected);
  };

  const handleDeselectAll = () => {
    const noneSelected = {};
    cart.forEach(item => {
      noneSelected[item.variantId] = false;
    });
    setSelectedItemIds(noneSelected);
  };

  const toggleItemSelection = (variantId) => {
    setSelectedItemIds(prev => ({
      ...prev,
      [variantId]: !prev[variantId]
    }));
  };

  const confirmCheckout = () => {
    // Get selected items from cart
    const selectedItems = cart.filter(item => selectedItemIds[item.variantId]);
    if (selectedItems.length === 0) {
      setPopupMsg("Please select at least one item to checkout");
      setShowPopup(true);
      return;
    }

    setShowSelectionModal(false);
    setLoading(true);

    // Simulate a short delay (optional)
    setTimeout(() => {
      setLoading(false);
      // Navigate to checkout page with selected items in state
      navigate("/checkout", { state: { selectedItems,  fromCart: true  }});
    }, 300);
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Your Cart</h2>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-6">Add items to get started</p>
          <Link
            to="/products"
            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-md font-medium transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 relative">
      {loading && <Loader />}
      {showPopup && (
        <Popup
          show={showPopup}
          type="success"
          message={popupMsg}
          onClose={() => setShowPopup(false)}
        />
      )}

      <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>

      {/* Cart items list */}
      <div className="space-y-4">
        {cart.map((item) => (
          <div
            key={item.variantId}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row gap-4 hover:shadow transition"
          >
            <div className="sm:w-28 h-28 flex-shrink-0 bg-gray-50 rounded overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <h3 className="font-medium text-gray-800">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Size: {item.size} | Color: {item.color}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-2">
                    ₹{item.price}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={async () => {
                        if (item.quantity > 1) {
                          setLoading(true);
                          await updateQuantity(item.variantId, item.quantity - 1);
                          setPopupMsg("Quantity decreased");
                          setShowPopup(true);
                          setLoading(false);
                        }
                      }}
                      disabled={item.quantity <= 1}
                      className={`px-3 py-1 text-lg font-medium ${
                        item.quantity <= 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      −
                    </button>
                    <span className="px-2 py-1 border-x border-gray-300 min-w-[40px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={async () => {
                        setLoading(true);
                        await updateQuantity(item.variantId, item.quantity + 1);
                        setPopupMsg("Quantity increased");
                        setShowPopup(true);
                        setLoading(false);
                      }}
                      className="px-3 py-1 text-lg font-medium text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      await removeFromCart(item.variantId);
                      setPopupMsg("Item removed");
                      setShowPopup(true);
                      setLoading(false);
                    }}
                    className="text-sm text-blue-600 hover:text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total + Checkout */}
      <div className="mt-8 border-t border-gray-200 pt-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="text-right sm:text-left">
          <span className="text-gray-600">Subtotal ({cart.reduce((sum, i) => sum + i.quantity, 0)} items): </span>
          <span className="text-2xl font-bold text-gray-900">₹{total}</span>
        </div>
        <button
          onClick={openSelectionModal}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-6 rounded-md transition shadow-sm"
        >
          Proceed to Checkout
        </button>
      </div>

      <div className="mt-4 text-center sm:text-left">
        <Link to="/products" className="text-blue-600 hover:text-orange-600 text-sm">
          ← Continue Shopping
        </Link>
      </div>

      {/* Item selection modal (before checkout) */}
      {showSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Select items to checkout</h3>
              <button
                onClick={() => setShowSelectionModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-3">
              {cart.map((item) => (
                <label key={item.variantId} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!selectedItemIds[item.variantId]}
                    onChange={() => toggleItemSelection(item.variantId)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-gray-600">₹{item.price} × {item.quantity}</span>
                    </div>
                    <p className="text-xs text-gray-500">Size: {item.size} | Color: {item.color}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between gap-3">
              <div className="space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Deselect All
                </button>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setShowSelectionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCheckout}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-md font-medium"
                >
                  Checkout ({cart.filter(i => selectedItemIds[i.variantId]).length} items)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;