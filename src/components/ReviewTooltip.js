"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Star, Loader2, ExternalLink } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";

export default function ReviewTooltip({ children, productId, ratingCount, averageRating, productUrl = "#reviews" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("ReviewTooltip");
  const locale = useLocale();
  const isAr = locale === "ar";
  const timerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      
      // Close if completely scrolled out of viewport
      if (
        rect.bottom < 0 ||
        rect.top > window.innerHeight ||
        rect.right < 0 ||
        rect.left > window.innerWidth
      ) {
        setIsOpen(false);
        return;
      }

      let calculatedLeft = isAr ? rect.right - 300 : rect.left;
      
      if (calculatedLeft + 300 > document.documentElement.clientWidth) {
        calculatedLeft = document.documentElement.clientWidth - 310;
      }
      if (calculatedLeft < 10) calculatedLeft = 10;
      
      setCoords({
        top: rect.bottom + 8,
        left: calculatedLeft
      });
    }
  };

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
      if (!data && !loading && productId) {
        setLoading(true);
        fetch(`/api/product/rating-distribution?productId=${productId}`)
          .then(res => res.json())
          .then(resData => {
            if (resData && resData.distribution) {
              setData(resData);
            }
          })
          .catch(err => console.error(err))
          .finally(() => setLoading(false));
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      
      let animationFrameId;
      const handleScrollOrResize = () => {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          updatePosition();
        });
      };
      
      // capture: true allows catching scroll events from any scrollable child (e.g., carousels)
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize, true);
      
      const handleClickOutside = (e) => {
        if (e.target.closest('.review-tooltip-portal')) return;
        if (popoverRef.current && !popoverRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("click", handleClickOutside);
      
      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize, true);
        document.removeEventListener("click", handleClickOutside);
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [isOpen, isAr]);

  const toggleOpen = (e) => {
    if (window.innerWidth < 1024) {
      e.preventDefault();
      if (!isOpen) {
        handleMouseEnter();
      } else {
        setIsOpen(false);
      }
    }
  };

  const tooltipContent = (
    <div 
      className={`fixed z-[85] w-[300px] bg-white border border-zinc-200 rounded-lg shadow-xl p-4 transition duration-200 origin-top review-tooltip-portal ${isOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
      style={{ 
        top: coords.top + "px", 
        left: coords.left + "px",
      }}
      onMouseEnter={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star 
              key={s} 
              size={18} 
              className={s <= Math.round(parseFloat(averageRating) || 0) ? "fill-[#FFA41C] text-[#FFA41C]" : "fill-zinc-100 text-zinc-200"} 
            />
          ))}
        </div>
        <span className="font-bold text-lg text-zinc-900">{parseFloat(averageRating || 0).toFixed(1)} {t("outOf")} 5</span>
      </div>
      <p className="text-[13px] text-zinc-500 mb-4">{ratingCount} {t("globalRatings")}</p>

      {loading ? (
        <div className="flex justify-center py-4 text-brand">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {[5, 4, 3, 2, 1].map((star) => {
            const percentage = data ? data.percentages[star] : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-[13px] text-brand hover:text-brand-dark">
                <span className="whitespace-nowrap w-[35px] text-left">{star} {t("star")}</span>
                <div className="flex-1 h-4 bg-zinc-100 rounded-sm border border-zinc-200 overflow-hidden relative">
                  <div 
                    className="absolute inset-y-0 bg-[#FFA41C] rounded-sm transition-all duration-500"
                    style={{ width: `${percentage}%`, [isAr ? "right" : "left"]: 0 }}
                  />
                </div>
                <span className="w-[30px] text-right text-zinc-600">{percentage}%</span>
              </div>
            );
          })}
        </div>
      )}

      <hr className="my-3 border-zinc-100" />
      
      <Link 
        href={productUrl}
        className="flex items-center justify-center gap-1.5 text-sm font-bold text-zinc-700 hover:text-brand transition-colors w-full"
      >
        {t("seeAllReviews")}
        <ExternalLink size={14} />
      </Link>
    </div>
  );

  return (
    <div 
      className="relative flex items-center w-fit cursor-pointer group" 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      onClick={toggleOpen}
      ref={popoverRef}
      data-state={isOpen ? "open" : "closed"}
    >
      {children}
      {mounted && typeof document !== "undefined" ? createPortal(tooltipContent, document.body) : null}
    </div>
  );
}
