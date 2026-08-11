"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { History, ShoppingBag, Trash2, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { getProductUrl } from "@/lib/product-utils";
import { useLocale, useTranslations } from "next-intl";
import ProductCard from "@/components/ProductCard";

export default function AccountRecentlyViewedPage() {
  const t = useTranslations("AccountRecentlyViewed");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const { loading } = useAuth();
  const [recentViews, setRecentViews] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("mahally_recently_viewed");
    if (stored) {
      try {
        setRecentViews(JSON.parse(stored));
      } catch (e) { }
    }
  }, []);

  const clearAll = () => {
    localStorage.removeItem("mahally_recently_viewed");
    setRecentViews([]);
  };

  const removeItem = (id) => {
    const updated = recentViews.filter((p) => p.id !== id);
    setRecentViews(updated);
    localStorage.setItem("mahally_recently_viewed", JSON.stringify(updated));
  };

  if (loading) return null;

  return (
    <div className="w-full" dir={dir}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t("pageTitle")}</h2>
        {recentViews.length > 0 && (
          <button
            onClick={clearAll}
            className="text-[13px] text-gray-500 font-bold hover:text-black hover:underline transition-all uppercase tracking-tighter"
          >
            {t("clearAll")}
          </button>
        )}
      </div>

      {recentViews.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recentViews.map((item) => (
            <div key={item.id} className="relative group">
              <ProductCard product={item} />
              <button
                onClick={() => removeItem(item.id)}
                className="absolute top-2 start-2 p-2 text-gray-300 hover:text-rose-600 transition-colors bg-white/90 rounded-md backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 border border-gray-100 z-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 flex flex-col items-center border border-gray-100 rounded-md bg-white text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-md flex items-center justify-center mb-6 border border-gray-100">
            <History size={40} className="text-gray-100" />
          </div>
          <h3 className="text-[16px] font-bold mb-2 text-gray-900">
            {t("historyEmpty")}
          </h3>
          <p className="text-gray-500 text-[14px] mb-8 max-w-xs">
            {t("historyEmptyDesc")}
          </p>
          <Link
            href="/browse"
            className="px-10 py-3 bg-black text-white rounded-md font-bold text-[14px] transition-all hover:bg-gray-800"
          >
            {t("startBrowsing")}
          </Link>
        </div>
      )}
    </div>
  );
}