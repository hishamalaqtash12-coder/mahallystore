"use client";

import { Link } from "@/i18n/routing";
import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChevronRight, ChevronLeft, Award, Sparkles, MapPin } from "lucide-react";
import ProductCard from "./ProductCard";
import { getMadeInJordanProducts } from "@/lib/made-in-jordan";

export default function MadeInJordan({ products = [] }) {
  const t = useTranslations("MadeInJordan");
  const locale = useLocale();
  const isAr = locale === "ar";
  const scrollRef = useRef(null);

  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(true);

  const jordanianProducts = getMadeInJordanProducts(products || []);
  const displayProducts = jordanianProducts.slice(0, 10);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const isRtl = document.documentElement.dir === "rtl" || isAr;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
            {t("title")}
          </h2>
          <div className="h-1.5 w-20 bg-brand rounded-full"></div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 font-medium">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {displayProducts.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 me-1">
              {canScrollStart && (
                <button
                  onClick={scrollBackward}
                  aria-label="Previous"
                  className="p-2 rounded-lg border-2 border-zinc-400 text-zinc-800 hover:border-zinc-900 hover:bg-zinc-50 transition-all active:scale-95"
                >
                  {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
              )}
              {canScrollEnd && (
                <button
                  onClick={scrollForward}
                  aria-label="Next"
                  className="p-2 rounded-lg border-2 border-zinc-400 text-zinc-800 hover:border-zinc-900 hover:bg-zinc-50 transition-all active:scale-95"
                >
                  {isAr ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
              )}
            </div>
          )}

          <Link
            href="/browse?tag=made-in-jordan"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700 hover:text-emerald-700 transition-colors bg-zinc-100/80 hover:bg-emerald-50 px-5 py-2.5 rounded-lg border-2 border-zinc-300 hover:border-emerald-600/60 w-fit shrink-0"
          >
            <span>{t("viewAll")}</span>
            {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
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
              <div key={product.id} className="shrink-0 mahally-carousel-card snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-12 bg-emerald-50/50 border-2 border-emerald-200 rounded-xl flex flex-col items-center justify-center text-center px-4">
          <MapPin size={36} className="text-emerald-400 mb-2" />
          <h3 className="text-base font-bold text-zinc-900 mb-1">
            {t("noProducts")}
          </h3>
          <p className="text-xs text-zinc-500">
            {t("noProductsDesc")}
          </p>
        </div>
      )}
    </section>
  );
}