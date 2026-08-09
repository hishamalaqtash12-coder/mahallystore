"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getProductUrl } from "@/lib/product-utils";
import { ChevronRight, Megaphone, Store, ExternalLink } from "lucide-react";
import { useMemo } from "react";

// Helper to extract Dokan/Mahally store name from vendor meta
function getStoreName(vendor) {
   if (!vendor) return "Premium Store";
   const dokanName = vendor.meta_data?.find(m => m.key === "dokan_store_name")?.value;
   if (dokanName) return dokanName;
   const settings = vendor.meta_data?.find(m => m.key === "dokan_settings")?.value;
   if (settings && typeof settings === "object" && settings.store_name) return settings.store_name;
   const mahallyName = vendor.meta_data?.find(m => m.key === "mahally_store_name" || m.key === "mahally_owner_name")?.value;
   return mahallyName || vendor.first_name || "Premium Store";
}

// Helper to extract store logo
function getStoreLogo(vendor) {
   if (!vendor) return null;
   const unifiedLogo = vendor.meta_data?.find(m => m.key === "mahally_avatar_url")?.value;
   if (unifiedLogo) return unifiedLogo;
   const logoMeta = vendor.meta_data?.find(m => m.key === "mahally_store_logo")?.value;
   if (logoMeta) return logoMeta;
   return vendor.avatar_url || null;
}

export default function SuperBuyerSection({ products = [], vendors = [], advertisingEnabled = true }) {
   const t = useTranslations("SuperBuyerSection");
   const tCard = useTranslations("ProductCard");
   // Use products for "Sponsored Products" - ONLY if they are active and not expired
   const sponsoredProducts = useMemo(() => {
      const now = Date.now();
      return products.filter(p => {
         const status = p.meta_data?.find(m => m.key === "_mahally_ad_status")?.value;
         const expiry = parseInt(p.meta_data?.find(m => m.key === "_mahally_ad_expiry")?.value || "0");
         return status === "active" && expiry > now;
      }).slice(0, 4);
   }, [products]);

   // Use vendors for "Featured Store" - ONLY if they are active and not expired
   const featuredStore = useMemo(() => {
      const now = Date.now();
      const activeStores = vendors.filter(v => {
         const status = v.meta_data?.find(m => m.key === "_mahally_store_ad_status")?.value;
         const expiry = parseInt(v.meta_data?.find(m => m.key === "_mahally_store_ad_expiry")?.value || "0");
         return status === "active" && expiry > now;
      });
      return activeStores.length > 0 ? activeStores[0] : null;
   }, [vendors]);

   // If the module is completely disabled, we force empty arrays so the placeholders show
   const finalProducts = advertisingEnabled ? sponsoredProducts : [];
   const finalStore = advertisingEnabled ? featuredStore : null;

   // Pad products to always show 4 slots
   const displayProducts = [...finalProducts, ...Array(Math.max(0, 4 - finalProducts.length)).fill(null)].slice(0, 4);

   return (
      <section className="w-full max-w-[1200px] mx-auto px-4 lg:px-8">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Sponsored Products (Ads) */}
            <div className="lg:col-span-2 bg-white border-2 border-zinc-300 rounded-xl overflow-hidden flex flex-col">
               <div className="flex items-center justify-between px-5 py-4 border-b-2 border-zinc-300 bg-zinc-50/60">
                  <div className="flex items-center gap-2">
                     <span className="p-1.5 rounded-lg bg-brand/10 text-brand border border-brand/20">
                        <Megaphone size={16} />
                     </span>
                     <h2 className="text-[18px] font-black text-zinc-900">{t("sponsoredProducts")}</h2>
                     <span className="ms-1 text-[10px] bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded border border-zinc-300 uppercase font-bold tracking-wider">{t("ad")}</span>
                  </div>
                  <Link href="/browse" className="text-[13px] text-zinc-700 hover:text-brand font-bold transition-colors border-2 border-zinc-300 hover:border-brand/60 px-3 py-1.5 rounded-lg">
                     {t("shopMore")}
                  </Link>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 divide-x-2 divide-y-2 md:divide-y-0 divide-zinc-200 flex-1">
                  {displayProducts.map((p, i) => {
                     if (!p) {
                        return (
                           <div key={i} className="group p-5 flex flex-col items-center justify-center text-center bg-zinc-50/50">
                              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border-2 border-zinc-300 mb-3 text-zinc-300">
                                 <Megaphone size={18} />
                              </div>
                              <h3 className="text-[12px] font-bold text-zinc-500 mb-1">{t("vacantAdSpace")}</h3>
                              <p className="text-[10px] text-zinc-400">{t("promoteHere")}</p>
                           </div>
                        );
                     }
                     return (
                        <Link key={i} href={getProductUrl(p)} className="group p-5 flex flex-col hover:bg-zinc-50 transition-colors">
                           <div className="aspect-square bg-white mb-4 relative flex items-center justify-center">
                              <Image src={p.images?.[0]?.src || "https://placehold.co/200x200"} alt={p.name} fill className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                           </div>
                           <h3 className="text-[13px] text-zinc-800 line-clamp-2 leading-snug mb-2 group-hover:text-brand transition-colors">{p.name}</h3>
                           <div className="mt-auto">
                              <p className="text-[16px] font-bold text-brand-dark">{parseFloat(p.price || 0).toFixed(2)} {tCard("jod")}</p>
                              {p.regular_price && p.regular_price !== p.price && (
                                 <p className="text-[11px] text-zinc-500 line-through">{parseFloat(p.regular_price).toFixed(2)} {tCard("jod")}</p>
                              )}
                           </div>
                        </Link>
                     );
                  })}
               </div>
            </div>

            {/* Featured Store (Store Ad) */}
            <div className="bg-gradient-to-br from-brand to-brand-dark border-2 border-brand-dark rounded-xl overflow-hidden relative text-white flex flex-col">
               {/* Decorative background */}
               <div className="absolute top-0 start-0 w-64 h-64 bg-white/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

               <div className="flex items-center justify-between px-5 py-4 border-b-2 border-white/15 relative z-10">
                  <div className="flex items-center gap-2">
                     <span className="p-1.5 rounded-lg bg-white/10 text-white border border-white/20">
                        <Store size={16} />
                     </span>
                     <h2 className="text-[18px] font-black text-white">{t("featuredStore")}</h2>
                     <span className="ms-1 text-[10px] bg-white/20 text-white px-2 py-0.5 rounded uppercase font-bold tracking-wider border border-white/20">{t("ad")}</span>
                  </div>
               </div>

               <div className="p-6 flex-1 flex flex-col relative z-10">
                  {finalStore ? (
                     <>
                        <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 p-1 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                           {getStoreLogo(finalStore) ? (
                              <Image src={getStoreLogo(finalStore)} alt={getStoreName(finalStore) || "Featured Store"} width={80} height={80} className="object-contain" />
                           ) : (
                              <Store size={32} className="text-zinc-300" />
                           )}
                        </div>
                        <h3 className="text-center text-[22px] font-bold mb-1">{getStoreName(finalStore)}</h3>
                        <p className="text-center text-[13px] text-white/80 mb-6 px-4 leading-relaxed">{t("featuredStoreDesc")}</p>

                        <div className="mt-auto w-full">
                           <Link href={`/vendors/${finalStore.id}`} className="w-full py-3 bg-white hover:bg-brand-light text-brand font-bold rounded-lg flex items-center justify-center gap-2 transition-all border-2 border-white active:scale-[0.98]">
                              {t("visitStore")} <ExternalLink size={16} className="rtl:-scale-x-100" />
                           </Link>
                        </div>
                     </>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <Store size={48} className="text-white/20 mb-4" />
                        <h3 className="text-[20px] font-bold mb-2">{t("promoteStore")}</h3>
                        <p className="text-[13px] text-white/80 mb-6">{t("promoteStoreDesc")}</p>
                        <Link href="/merchant" className="w-full py-3 bg-white hover:bg-brand-light text-brand font-bold rounded-lg flex items-center justify-center transition-all border-2 border-white active:scale-[0.98]">
                           {t("learnMore")}
                        </Link>
                     </div>
                  )}
               </div>
            </div>

         </div>
      </section>
   );
}