"use client";

import { Link } from "@/i18n/routing";
import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { ChevronRight, ChevronLeft, Award, Sparkles, MapPin } from "lucide-react";
import ProductCard from "./ProductCard";
import { getMadeInJordanProducts } from "@/lib/made-in-jordan";

export default function MadeInJordan({ products = [] }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const scrollRef = useRef(null);

  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(true);

  const jordanianProducts = getMadeInJordanProducts(products || []);

  // If no products match the tag yet, fallback to top products to keep UI populated
  const displayProducts = jordanianProducts.length > 0 ? jordanianProducts.slice(0, 10) : (products || []).slice(0, 8);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const isRtl = document.documentElement.dir === 'rtl' || isAr;

      if (maxScroll <= 5) {
        setCanScrollStart(false);
        setCanScrollEnd(false);
        return;
      }

      if (isRtl) {
        const scrolledAmount = Math.abs(scrollLeft);
        setCanScrollStart(scrolledAmount > 10);
        setCanScrollEnd(scrolledAmount < maxScroll - 10);
      } else {
        setCanScrollStart(scrollLeft > 10);
        setCanScrollEnd(scrollLeft < maxScroll - 10);
      }
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [displayProducts]);

  const scrollForward = () => {
    if (scrollRef.current) {
      const amount = 360;
      scrollRef.current.scrollBy({
        left: isAr ? -amount : amount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 350);
    }
  };

  const scrollBackward = () => {
    if (scrollRef.current) {
      const amount = 360;
      scrollRef.current.scrollBy({
        left: isAr ? amount : -amount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 my-8">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 border-b border-emerald-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <Award size={14} className="text-emerald-600" />
              <span>{isAr ? "صُنِع بأيادٍ أردنية 🇯🇴" : "Made in Jordan 🇯🇴"}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            {isAr ? "منتجات صنع في الأردن" : "Made in Jordan Products"}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
            {isAr ? "دعم المشاريع والأيدي الحرفية والمصانع المحلية في جميع المحافظات" : "Supporting local artisans, projects, and factories across all Jordan governorates"}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {displayProducts.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 me-2">
              <button
                onClick={scrollBackward}
                disabled={!canScrollStart}
                aria-label="Previous"
                className={`p-2 rounded-full border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-all ${
                  !canScrollStart ? "opacity-30 cursor-not-allowed" : "active:scale-95 shadow-xs"
                }`}
              >
                {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
              <button
                onClick={scrollForward}
                disabled={!canScrollEnd}
                aria-label="Next"
                className={`p-2 rounded-full border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-all ${
                  !canScrollEnd ? "opacity-30 cursor-not-allowed" : "active:scale-95 shadow-xs"
                }`}
              >
                {isAr ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>
          )}

          <Link
            href="/browse?tag=made-in-jordan"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline shrink-0 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200"
          >
            <span>{isAr ? "عرض الكل" : "View All"}</span>
            {isAr ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </Link>
        </div>
      </div>

      {/* ── Carousel Grid ── */}
      {displayProducts.length > 0 ? (
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
          >
            {displayProducts.map((product) => (
              <div key={product.id} className="w-[220px] sm:w-[250px] shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-12 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col items-center justify-center text-center px-4">
          <MapPin size={36} className="text-emerald-400 mb-2" />
          <h3 className="text-base font-bold text-zinc-900 mb-1">
            {isAr ? "لا توجد منتجات صادرة حالياً" : "No products available"}
          </h3>
          <p className="text-xs text-zinc-500">
            {isAr ? "سيتم إضافة تشكيلة جديدة من المنتجات الأردنية قريباً." : "New Jordanian products will be added shortly."}
          </p>
        </div>
      )}
    </section>
  );
}
