"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductGallery({ images, productName }) {
  const [activeImage, setActiveImage] = useState(0);
  const galleryImages = images?.length > 0 ? images : [{ src: `https://placehold.co/600/f5f5f5/ff6000?text=${encodeURIComponent(productName || 'Product')}` }];

  const nextImage = () => setActiveImage((prev) => (prev + 1) % galleryImages.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);

  // Sync with variation selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleVariationUpdate = (e) => {
        const variation = e.detail.variation;
        if (variation?.image?.src) {
          const index = galleryImages.findIndex(img => img.src === variation.image.src);
          if (index !== -1) {
            setActiveImage(index);
          }
        }
      };
      window.addEventListener('product-variation-update', handleVariationUpdate);
      return () => window.removeEventListener('product-variation-update', handleVariationUpdate);
    }
  }, [galleryImages]);

  return (
    <div className="w-full flex gap-4 p-4 lg:p-6 items-start">
      {/* Vertical Thumbnails (Carousel Style) */}
      <div className="hidden md:flex flex-col gap-2 w-[72px] shrink-0 max-h-[500px] overflow-y-auto no-scrollbar">
        {galleryImages.map((img, i) => (
          <div 
            key={i} 
            onMouseEnter={() => setActiveImage(i)}
            onClick={() => setActiveImage(i)}
            className={`w-[72px] h-[72px] rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 shrink-0 relative ${i === activeImage ? 'border-[#be374f] ring-2 ring-[#be374f]/10' : 'border-zinc-100 hover:border-zinc-300 opacity-70 hover:opacity-100'}`}
          >
            <Image 
              src={img?.src || `https://placehold.co/80/f5f5f5/ff6000?text=${i+1}`} 
              alt={`${productName || 'Product'} thumbnail ${i + 1}`}
              width={72} 
              height={72} 
              className="object-cover w-full h-full" 
            />
          </div>
        ))}
      </div>

      {/* Main Carousel Area */}
      <div className="flex-1 relative aspect-square rounded-2xl overflow-hidden bg-[#f9f9f9] group cursor-crosshair">
        {/* Main Image */}
        <div className="w-full h-full relative">
          <Image 
            src={galleryImages[activeImage]?.src}
            alt={productName || "Product"} 
            fill 
            className="object-contain transition-all duration-700 ease-in-out group-hover:scale-110" 
            priority
          />
        </div>
        
        {/* Navigation Arrows */}
        {galleryImages.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-zinc-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white z-20"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-zinc-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white z-20"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Counter Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur text-white text-[10px] font-black px-3 py-1 rounded-full z-20">
          {activeImage + 1} / {galleryImages.length}
        </div>

        {/* Ad Tag */}
        <div className="absolute top-0 right-0 bg-zinc-900 text-white text-[9px] font-black px-2 py-1 uppercase z-10 tracking-widest">
          MAHALLY EXCLUSIVE
        </div>
      </div>
    </div>
  );
}
