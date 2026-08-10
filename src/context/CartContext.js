"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext({
  cart: [],
  isCartOpen: false,
  setIsCartOpen: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  isInCart: () => false
});

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("mahally_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing cart:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("mahally_cart", JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const varId = product.variation_id || null;
      const existingItemIndex = prev.findIndex((item) => 
        item.id === product.id && item.variation_id === varId
      );
      
      if (existingItemIndex >= 0) {
        return prev.map((item, index) => {
          if (index === existingItemIndex) {
            const newQty = item.quantity + quantity;
            // Enforce stock limit if managed
            if (item.manage_stock && item.stock_quantity !== null && newQty > item.stock_quantity) {
              return { ...item, quantity: item.stock_quantity };
            }
            return { ...item, quantity: newQty };
          }
          return item;
        });
      } else {
        // Normalize the product into a clean cart item, preserving variation info
        return [...prev, {
          id: product.id,
          variation_id: product.variation_id || null,
          name: product.name,
          price: product.price || product.sale_price || "0",
          image: product.images?.[0]?.src || `https://placehold.co/100/f5f5f5/ff6000?text=${encodeURIComponent(product.name?.[0] || 'P')}`,
          quantity: quantity > (product.manage_stock && product.stock_quantity !== null ? product.stock_quantity : quantity) 
                    ? product.stock_quantity : quantity,
          stock_quantity: product.stock_quantity,
          manage_stock: product.manage_stock,
          selectedOptions: product.selectedOptions || {},
          vendorId: product.vendorId || null
        }];
      }
    });
  };

  const removeFromCart = (productId, variationId = null) => {
    const varId = variationId || null;
    setCart((prev) => prev.filter((item) => 
      !(item.id === productId && item.variation_id === varId)
    ));
  };

  const updateQuantity = (productId, newQty, variationId = null) => {
    const varId = variationId || null;
    if (newQty <= 0) {
      removeFromCart(productId, varId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId && item.variation_id === varId) {
          // Enforce stock limit
          let finalQty = newQty;
          if (item.manage_stock && item.stock_quantity !== null && finalQty > item.stock_quantity) {
            finalQty = item.stock_quantity;
            // Optionally alert the user here or handle it in the UI
          }
          return { ...item, quantity: finalQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("mahally_cart");
  };

  const isInCart = (productId, variationId = null) => {
    const varId = variationId || null;
    return cart.some((item) => item.id === productId && item.variation_id === varId);
  };

  return (
    <CartContext.Provider value={{ cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
