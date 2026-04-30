import { useState } from "react";

export function useCart() {
  // ✅ direct initialization (no useEffect)
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem("cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const save = (items) => {
    setCart(items);
    localStorage.setItem("cart", JSON.stringify(items));
  };

  const addToCart = (item) => {
    const exists = cart.find(
      (c) =>
        c.productId === item.productId &&
        c.size === item.size &&
        c.color === item.color
    );

    if (exists) {
      const updated = cart.map((c) =>
        c === exists ? { ...c, qty: c.qty + 1 } : c
      );
      save(updated);
    } else {
      save([...cart, { ...item, qty: 1 }]);
    }
  };

  const removeFromCart = (index) => {
    const updated = cart.filter((_, i) => i !== index);
    save(updated);
  };

  return { cart, addToCart, removeFromCart };
}