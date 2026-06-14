"use client";

import { useEffect } from "react";

export default function RecentlyViewedTracker({ product }) {
  useEffect(() => {
    if (!product || !product.id) return;

    try {
      const stored = localStorage.getItem("mahally_recently_viewed");
      let recent = stored ? JSON.parse(stored) : [];

      // Remove if already exists to push to front
      recent = recent.filter(p => p.id !== product.id);

      // Add to front, keeping essential data only (id, name, image, price)
      recent.unshift({
        id: product.id,
        name: product.name,
        image: product.images?.[0]?.src || "https://placehold.co/100",
        price: product.price || product.regular_price,
      });

      // Keep only last 10
      recent = recent.slice(0, 10);

      localStorage.setItem("mahally_recently_viewed", JSON.stringify(recent));
      
      // Dispatch custom event so Header can update instantly
      window.dispatchEvent(new Event("recently_viewed_updated"));
    } catch (e) {
      console.warn("Failed to save recently viewed:", e);
    }
  }, [product]);

  return null;
}
