"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, ChevronLeft, Zap } from "lucide-react";
import ProductCard from "./ProductCard";

export default function LightningDeals({ products }) {
  const t = useTranslations("LightningDeals");
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Filter products for Flash Deals
  const deals = products.filter(p => p.on_sale).slice(0, 10);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      
      if (scrollLeft <= 0 && document.documentElement.dir === 'rtl') {
        setCanScrollRight(scrollLeft < -10); // Prev (Right)
        setCanScrollLeft(Math.abs(scrollLeft) < maxScroll - 10); // Next (Left)
      } else {
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < maxScroll - 10);
      }
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [deals]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 600;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 500);
    }
  };

  if (deals.length === 0) {
    return (
      <section className="w-full max-w-[1200px] mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-extrabold text-black tracking-tight">{t("title")}</h2>
            <div className="h-1.5 w-20 bg-brand rounded-full"></div>
          </div>
        </div>
        <div className="py-12 bg-[#F7F7F7] border border-zinc-200 rounded-lg flex flex-col items-center justify-center text-center px-4">
          <Zap size={32} className="text-zinc-400 mb-3" />
          <h3 className="text-lg font-bold text-zinc-900 mb-1">{t("noDeals")}</h3>
          <p className="text-sm text-zinc-500">{t("noDealsDesc")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 lg:px-8">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-extrabold text-black tracking-tight">{t("title")}</h2>
          <div className="h-1.5 w-20 bg-brand rounded-full"></div>
        </div>
        <Link href="/browse?onsale=true" className="text-sm font-bold text-zinc-500 hover:text-black transition-colors flex items-center gap-1">
          {t("viewAll")} <ChevronRight size={16} className="rtl:-scale-x-100" />
        </Link>
      </div>

      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className={`flex absolute -left-4 md:-left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 bg-white border border-zinc-200 rounded-full items-center justify-center shadow-md transition-opacity hover:bg-zinc-50 ${!canScrollLeft ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <ChevronLeft size={20} className="text-zinc-700 w-4 h-4 md:w-5 md:h-5" />
        </button>

        <button
          onClick={() => scroll("right")}
          className={`flex absolute -right-4 md:-right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 bg-white border border-zinc-200 rounded-full items-center justify-center shadow-md transition-opacity hover:bg-zinc-50 ${!canScrollRight ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <ChevronRight size={20} className="text-zinc-700 w-4 h-4 md:w-5 md:h-5" />
        </button>

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 md:gap-4 overflow-x-auto overflow-y-hidden pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {deals.map((product) => (
            <div key={product.id} className="shrink-0 w-[180px] sm:w-[200px] md:w-[240px] snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
