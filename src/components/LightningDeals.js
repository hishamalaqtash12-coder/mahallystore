"use client";

import { Link } from "@/i18n/routing";
import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChevronRight, ChevronLeft, Zap } from "lucide-react";
import ProductCard from "./ProductCard";

export default function LightningDeals({ products }) {
  const t = useTranslations("LightningDeals");
  const locale = useLocale();
  const isAr = locale === "ar";
  const scrollRef = useRef(null);

  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(true);

  // Filter products for Flash Deals (Only products with discount on price, no time limit)
  const deals = (products || []).filter(p => {
    const saleEndDate = p.date_on_sale_to || p.date_on_sale_to_gmt;
    const hasActiveTimer = saleEndDate && new Date(saleEndDate) > new Date();
    return p.on_sale && !hasActiveTimer;
  }).slice(0, 10);

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
  }, [deals]);

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

  const scrollBack = () => {
    if (scrollRef.current) {
      const amount = 360;
      scrollRef.current.scrollBy({
        left: isAr ? amount : -amount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 350);
    }
  };

  const isEmpty = deals.length === 0;

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-2">

      {/* ─── Header ─── */}
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
      </div>

      {/* ─── Carousel ─── */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-zinc-400 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-300">
          <Zap size={32} className="mb-3 opacity-50" />
          <span className="text-sm font-medium text-center">{isAr ? "لا توجد عروض حالياً، نعتذر عن هذا الخطأ أو أن المتجر لا يحتوي على عروض." : "No deals available at the moment or there is an issue connecting to the store."}</span>
        </div>
      ) : (
        <div className="relative group/flash">
          {/* Scroll Forward Button (Left in RTL, Right in LTR) */}
          {canScrollEnd && (
            <button
              onClick={scrollForward}
              className="flex absolute end-0 md:-end-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-2 border-zinc-400 text-zinc-800 rounded-lg items-center justify-center z-30 transition-all shadow-md hover:scale-105 active:scale-95 hover:border-zinc-900"
              aria-label={isAr ? "تمرير لليسار" : "Scroll Next"}
            >
              {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          )}

          {/* Scroll Back Button (Right in RTL, Left in LTR) */}
          {canScrollStart && (
            <button
              onClick={scrollBack}
              className="flex absolute start-0 md:-start-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-2 border-zinc-400 text-zinc-800 rounded-lg items-center justify-center z-30 transition-all shadow-md hover:scale-105 active:scale-95 hover:border-zinc-900"
              aria-label={isAr ? "تمرير لليمين" : "Scroll Previous"}
            >
              {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 snap-x snap-mandatory"
          >
            {deals.map((product) => (
              <div key={product.id} className="shrink-0 mahally-carousel-card snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <Link
              href="/browse?onsale=true"
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700 hover:text-brand transition-colors bg-zinc-100/80 hover:bg-brand/10 px-6 py-3 rounded-full border-2 border-zinc-300 hover:border-brand/60 w-fit"
            >
              {t("viewAll")} <ChevronLeft size={18} className="rtl:rotate-0 rotate-180" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}