"use client";

import { useCart } from "@/context/CartContext";
import { isProductOutOfStock } from "@/lib/product-utils";

export default function AddToCartButton({ product }) {
  const { addToCart, setIsCartOpen } = useCart();
  const outOfStock = isProductOutOfStock(product);

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.src || "https://via.placeholder.com/150",
      quantity: 1,
    });
    setIsCartOpen(true);
  };

  if (outOfStock) {
    return (
      <button
        disabled
        className="w-full h-14 rounded-full bg-zinc-200 text-zinc-400 font-medium text-lg cursor-not-allowed"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      className="w-full h-14 rounded-full bg-black text-white dark:bg-white dark:text-black font-medium text-lg transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/10 dark:shadow-white/10"
    >
      Add to Cart
    </button>
  );
}
