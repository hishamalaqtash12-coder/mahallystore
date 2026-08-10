"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { X, Verified, MapPin, Heart, ShoppingBag, Store, ExternalLink, Award } from "lucide-react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VendorQuickLookModal({ vendor, isOpen, onClose }) {
  const t = useTranslations("VendorsPage");
  const pathname = usePathname();
  const isAr = pathname.startsWith("/ar");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !vendor) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-300 z-[99999]"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-[600px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 rounded-t-3xl md:rounded-2xl max-h-[90vh] md:max-h-[85vh] overflow-hidden z-[100000] border-t md:border border-zinc-200">
        
        {/* Mobile Pull Handle & Close Header */}
        <div className="w-full flex items-center justify-between px-4 py-2.5 md:hidden bg-white sticky top-0 z-50 border-b border-zinc-100 shrink-0">
          <div className="w-10 h-1 bg-zinc-300 rounded-full mx-auto absolute inset-x-0 top-2.5" />
          <div />
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-700 transition-all shadow-xs ms-auto"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className={`hidden md:flex absolute top-4 ${isAr ? "left-4" : "right-4"} z-50 w-9 h-9 items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full transition-all shadow-md active:scale-95`}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header / Banner */}
        <div className="relative h-48 w-full shrink-0 bg-gray-100">
          {vendor.storeBanner ? (
            <Image
              src={vendor.storeBanner}
              alt={vendor.storeName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-50 flex items-center justify-center">
              <Store size={48} className="text-brand-light" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Logo */}
          <div className={`absolute -bottom-8 ${isAr ? "right-6" : "left-6"} w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center z-10`}>
            {vendor.storeLogo ? (
              <Image src={vendor.storeLogo} alt={vendor.storeName} fill className="object-contain p-2" />
            ) : (
              <span className="text-gray-900 font-bold text-3xl">
                {vendor.storeName[0]?.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pt-10 pb-6 px-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">{vendor.storeName}</h2>
                {vendor.isVerified && (
                  <Verified size={18} className="text-emerald-500" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                {vendor.storeCategory && (
                  <span className="px-2 py-1 bg-red-50 text-brand-dark rounded-md font-medium">
                    {vendor.storeCategory}
                  </span>
                )}
                {vendor.followers && vendor.followers > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart size={14} className="fill-rose-400 text-rose-400" />
                    {vendor.followers.toLocaleString()} {t("followers", { defaultValue: "Followers" })}
                  </span>
                )}
                {vendor.products !== undefined && (
                  <span className="flex items-center gap-1">
                    <ShoppingBag size={14} />
                    {vendor.products} {t("products", { defaultValue: "Products" })}
                  </span>
                )}
              </div>
            </div>
            
            <Link
              href={`/vendor/${vendor.storeSlug || vendor.id}`}
              className="shrink-0 flex items-center justify-center gap-2 px-6 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-medium transition-colors shadow-sm"
            >
              {t("visitStore")}
              <ExternalLink size={16} />
            </Link>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t("about", { defaultValue: "About" })}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {vendor.storeDescription || (
                  <span className="text-gray-400 italic">
                    {t("noDescription")}
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
              <div className="space-y-1">
                <span className="text-xs text-gray-500">{t("joined", { defaultValue: "Joined" })}</span>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Award size={16} className="text-amber-500" />
                  {vendor.dateCreated ? new Date(vendor.dateCreated).getFullYear() : "2024"}
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-gray-500">{t("rating", { defaultValue: "Rating" })}</span>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-bold">
                    {Number(vendor.rating || 0).toFixed(1)}
                  </span>
                  ★
                </div>
              </div>
              
              {vendor.location && (
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">{t("location", { defaultValue: "Location" })}</span>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <MapPin size={16} className="text-gray-400" />
                    {vendor.location}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
