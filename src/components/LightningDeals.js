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

  // Filter products for Flash Deals
  const deals = (products || []).filter(p => p.on_sale).slice(0, 10);

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 border-b border-zinc-100 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 w-fit px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 text-xs font-black uppercase tracking-wider">
            <Zap size={13} className="fill-amber-500 text-amber-500 animate-bounce" />
            <span>{isAr ? "تخفيضات سريعة حصرياً" : "Flash Deals Exclusive"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            {t("title")}
          </h2>
        </div>

        <Link
          href="/browse?onsale=true"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-zinc-700 hover:text-brand transition-colors bg-zinc-100 hover:bg-brand/10 px-4 py-2 rounded-full border border-zinc-200/80 w-fit"
        >
          <span>{t("viewAll")}</span>
          <ChevronLeft size={16} className="rtl:rotate-0 rotate-180" />
        </Link>
      </div>

      {/* ─── Carousel ─── */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-zinc-400 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
          <Zap size={32} className="mb-3 opacity-50" />
          <span className="text-sm font-medium">{isAr ? "لا توجد عروض حالياً، نعتذر عن هذا الخطأ أو أن المتجر لا يحتوي على عروض." : "No deals available at the moment or there is an issue connecting to the store."}</span>
        </div>
      ) : (
        <div className="relative group/flash">
          {/* Scroll Forward Button (Left in RTL, Right in LTR) */}
          <button
            onClick={scrollForward}
            className={`flex absolute end-0 md:-end-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-zinc-200 text-zinc-800 rounded-full items-center justify-center z-30 transition-all shadow-md hover:scale-110 active:scale-95 ${!canScrollEnd ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            aria-label={isAr ? "تمرير لليسار" : "Scroll Next"}
          >
            {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {/* Scroll Back Button (Right in RTL, Left in LTR) */}
          <button
            onClick={scrollBack}
            className={`flex absolute start-0 md:-start-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-zinc-200 text-zinc-800 rounded-full items-center justify-center z-30 transition-all shadow-md hover:scale-110 active:scale-95 ${!canScrollStart ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            aria-label={isAr ? "تمرير لليمين" : "Scroll Previous"}
          >
            {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 snap-x snap-mandatory"
          >
            {deals.map((product) => (
              <div key={product.id} className="shrink-0 w-[190px] sm:w-[220px] md:w-[250px] snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
