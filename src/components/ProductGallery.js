"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { DEFAULT_FALLBACK_IMAGE } from "@/lib/product-utils";

export default function ProductGallery({ images, productName, isJordanian }) {
  const [activeImage, setActiveImage] = useState(0);
  const locale = useLocale();
  const galleryImages = images?.length > 0 ? images : [{ src: DEFAULT_FALLBACK_IMAGE }];

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

  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
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
                src={img?.src || DEFAULT_FALLBACK_IMAGE} 
                alt={`${productName || 'Product'} thumbnail ${i + 1}`}
                width={72} 
                height={72} 
                className="object-cover w-full h-full" 
              />
            </div>
          ))}
        </div>

        {/* Main Carousel Area */}
        <div 
          className="flex-1 relative aspect-square rounded-2xl overflow-hidden bg-[#f9f9f9] group cursor-zoom-in"
          onClick={() => setIsFullscreen(true)}
        >
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
                className="absolute end-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-zinc-900 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-white z-20"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute start-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-zinc-900 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-white z-20"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Counter Indicator */}
          <div className="absolute bottom-4 end-1/2 -translate-x-1/2 bg-black/50 backdrop-blur text-white text-[10px] font-black px-3 py-1 rounded-full z-20">
            {activeImage + 1} / {galleryImages.length}
          </div>

          {/* Ad Tag / Made In Jordan */}
          {isJordanian && (
            <div className="absolute top-0 start-0 bg-zinc-900 text-white text-[10px] sm:text-[11px] font-black px-3 py-1.5 z-10 uppercase tracking-widest rounded-ee-xl shadow-sm flex items-center gap-1.5">
              <span className="text-[12px] leading-none">🇯🇴</span>
              <span className="mt-0.5">{locale === "ar" ? "صُنع بأيادٍ أردنية" : "Made in Jordan"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsFullscreen(false)}
        >
          <button 
            className="absolute top-4 end-4 text-white hover:text-zinc-300 z-50 p-2 bg-white/10 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <div className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center">
            <Image 
              src={galleryImages[activeImage]?.src}
              alt={productName || "Product"} 
              fill 
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>

          {galleryImages.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute end-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition-all z-20"
              >
                <ChevronLeft size={28} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute start-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition-all z-20"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
          
          <div className="absolute bottom-6 end-1/2 -translate-x-1/2 bg-black/50 backdrop-blur text-white text-xs font-black px-4 py-1.5 rounded-full z-20">
            {activeImage + 1} / {galleryImages.length}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
