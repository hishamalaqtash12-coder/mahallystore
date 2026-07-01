"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { X, Store, ShoppingBag } from "lucide-react";

export default function RegistrationPopup() {
  const { user, loading } = useAuth();
  const t = useTranslations("RegistrationPopup");
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Only check once auth state is resolved and no user is logged in
    if (!loading && !user) {
      const dismissedTimestamp = localStorage.getItem("mahally_reg_popup_dismissed");
      
      // Check if dismissed within the last 24 hours
      if (dismissedTimestamp) {
        const timeSinceDismissed = Date.now() - parseInt(dismissedTimestamp, 10);
        if (timeSinceDismissed < 24 * 60 * 60 * 1000) {
          return;
        }
      }

      // Delay popup by 3 seconds for better UX
      const timer = setTimeout(() => {
        setShow(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  const handleClose = () => {
    setIsClosing(true);
    localStorage.setItem("mahally_reg_popup_dismissed", Date.now().toString());
    setTimeout(() => {
      setShow(false);
      setIsClosing(false);
    }, 300); // Matches exit animation duration
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 end-4 w-8 h-8 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-full transition-colors z-10"
          aria-label={t("close")}
        >
          <X size={18} />
        </button>

        <div className="p-8 md:p-10 text-center border-b border-zinc-100 bg-brand/5">
          <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 mb-2">{t("welcomeTitle")}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-zinc-100">
          
          {/* Buyer Section */}
          <div className="p-8 flex flex-col items-center text-center group hover:bg-zinc-50 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShoppingBag size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">{t("buyerTitle")}</h3>
            <p className="text-[14px] text-zinc-600 mb-8 leading-relaxed flex-1">
              {t("buyerDesc")}
            </p>
            <Link 
              href="/register?role=customer" 
              onClick={handleClose}
              className="w-full h-11 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[14px] transition-colors shadow-sm shadow-blue-200"
            >
              {t("buyerButton")}
            </Link>
          </div>

          {/* Seller Section */}
          <div className="p-8 flex flex-col items-center text-center group hover:bg-zinc-50 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Store size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">{t("sellerTitle")}</h3>
            <p className="text-[14px] text-zinc-600 mb-8 leading-relaxed flex-1">
              {t("sellerDesc")}
            </p>
            <Link 
              href="/register?role=vendor" 
              onClick={handleClose}
              className="w-full h-11 flex items-center justify-center bg-brand hover:bg-brand-dark text-white rounded-lg font-bold text-[14px] transition-colors shadow-sm shadow-brand/30"
            >
              {t("sellerButton")}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
