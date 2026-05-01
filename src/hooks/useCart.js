import { useState, useEffect, useCallback } from "react";
import {
  addCart,
  getCart,
  removeFromCart as removeCartAPI,
  updateCart as updateCartAPI,
} from "../services/cartService";

export function useCart() {
  const [cart, setCart] = useState([]);

  // ✅ stable fetch function
  const fetchCart = useCallback(async () => {
    try {
      const data = await getCart();
      setCart(data.items || []);
    } catch (err) {
      console.error("Cart fetch error:", err);
    }
  }, []);

  // ✅ FIXED useEffect (NO WARNING)
  useEffect(() => {
    const init = async () => {
      await fetchCart();
    };

    init(); // 👈 async wrapper

    const handler = () => fetchCart();

    window.addEventListener("cartUpdated", handler);

    return () => {
      window.removeEventListener("cartUpdated", handler);
    };
  }, [fetchCart]);

  // ✅ Add
  const addToCart = async (item) => {
    try {
      const res = await addCart(item);
      setCart(res.items || []);

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Add cart error:", err);
      throw err;
    }
  };

  // ✅ Remove
  const removeFromCart = async (variantId) => {
    try {
      const res = await removeCartAPI({ variantId });
      setCart(res.items || []);

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  // ✅ Update qty
  const updateQuantity = async (variantId, quantity) => {
  try {
    const res = await updateCartAPI({
      variantId,   // 🔥 FIX
      quantity,
    });

    setCart(res.items || []);

    window.dispatchEvent(new Event("cartUpdated"));
  } catch (err) {
    console.error("Update error:", err);
  }
};

  return {
    cart,
    cartCount: cart.length,
    addToCart,
    removeFromCart,
    updateQuantity,
  };
}