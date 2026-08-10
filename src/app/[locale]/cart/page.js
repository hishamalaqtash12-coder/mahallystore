"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import {
   Trash2,
   Minus,
   Plus,
   Lock,
   ShieldCheck,
   Truck,
   ShoppingCart,
   Heart,
   Info,
   Clock,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { useLocale, useTranslations } from "next-intl";

export default function CartPage() {
   const t = useTranslations("Cart");
   const locale = useLocale();
   const dir = locale === "ar" ? "rtl" : "ltr";

   const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
   const { user, isVendor } = useAuth();
   const router = useRouter();
   const [explorePicks, setExplorePicks] = useState([]);
   const [isLoadingPicks, setIsLoadingPicks] = useState(true);

   const [liveProductsMap, setLiveProductsMap] = useState({});
   const [isLiveLoading, setIsLiveLoading] = useState(true);

   const uniqueIdsString = useMemo(() => {
      return Array.from(new Set(cart.map((item) => item.id)))
         .sort()
         .join(",");
   }, [cart]);

   useEffect(() => {
      if (!uniqueIdsString) {
         setLiveProductsMap({});
         setIsLiveLoading(false);
         return;
      }

      const fetchLiveDetails = async () => {
         setIsLiveLoading(true);
         try {
            const idsArray = uniqueIdsString.split(",");
            const fetched = await Promise.all(
               idsArray.map(async (id) => {
                  try {
                     const res = await fetch(`/api/products/${id}`);
                     if (res.ok) return await res.json();
                  } catch (e) {
                     console.error(`Error fetching live details for product ${id}:`, e);
                  }
                  return null;
               })
            );

            const productsMap = {};
            fetched.filter(Boolean).forEach((p) => {
               productsMap[p.id] = p;
            });
            setLiveProductsMap(productsMap);
         } catch (err) {
            console.error("Failed to fetch live cart details:", err);
         } finally {
            setIsLiveLoading(false);
         }
      };

      fetchLiveDetails();
   }, [uniqueIdsString]);

   const enrichedCart = useMemo(() => {
      return cart.map((item) => {
         const liveProduct = liveProductsMap[item.id];
         if (!liveProduct) return item;

         let livePrice = liveProduct.price;
         let liveRegularPrice = liveProduct.regular_price;
         let liveStockQty = liveProduct.stock_quantity;
         let liveManageStock = liveProduct.manage_stock;
         let liveStockStatus = liveProduct.stock_status;
         let liveImage = liveProduct.images?.[0]?.src || item.image;
         let liveName = liveProduct.name;

         if (item.variation_id && liveProduct.variations_data) {
            const variation = liveProduct.variations_data.find(
               (v) => String(v.id) === String(item.variation_id)
            );
            if (variation) {
               livePrice = variation.price || livePrice;
               liveRegularPrice = variation.regular_price || liveRegularPrice;
               liveStockQty = variation.stock_quantity;
               liveManageStock = variation.manage_stock;
               liveStockStatus = variation.stock_status;
               if (variation.image?.src) {
                  liveImage = variation.image.src;
               }
            }
         }

         return {
            ...item,
            name: liveName,
            price: livePrice || item.price,
            regular_price: liveRegularPrice || item.regular_price,
            image: liveImage,
            stock_quantity: liveStockQty,
            manage_stock: liveManageStock,
            stock_status: liveStockStatus,
         };
      });
   }, [cart, liveProductsMap]);

   const MIN_CHECKOUT_AMOUNT = 10;
   const subtotal = enrichedCart.reduce(
      (total, item) => total + parseFloat(item.price || 0) * item.quantity,
      0
   );
   const remainingForMin = Math.max(0, MIN_CHECKOUT_AMOUNT - subtotal);
   const canCheckout = subtotal >= MIN_CHECKOUT_AMOUNT;

   useEffect(() => {
      fetch("/api/products?per_page=12")
         .then((res) => res.json())
         .then((data) => {
            if (data.products) setExplorePicks(data.products);
         })
         .catch((err) => console.error(err))
         .finally(() => setIsLoadingPicks(false));
   }, []);

   // ── Empty Cart ──────────────────────────────────────────────
   if (cart.length === 0) {
      return (
         <div className="max-w-6xl mx-auto px-4 py-10 w-full" dir={dir}>
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-zinc-100">
               <div className="relative mb-6">
                  <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center">
                     <ShoppingCart size={48} className="text-zinc-200" />
                  </div>
                  <div className="absolute -bottom-1 -start-1 w-10 h-10 bg-white rounded-full shadow flex items-center justify-center border border-zinc-100">
                     <Heart size={18} className="text-brand" />
                  </div>
               </div>
               <h2 className="text-xl font-bold text-zinc-900 mb-1">{t("emptyTitle")}</h2>
               <p className="text-sm text-zinc-500 mb-6">{t("emptyDesc")}</p>
               <Link
                  href="/browse"
                  className="px-10 py-2.5 bg-brand text-white rounded-lg font-bold text-sm hover:bg-brand-dark transition-all"
               >
                  {t("browseProducts")}
               </Link>
            </div>

            {/* Explore Picks */}
            <div className="mt-12">
               <h3 className="text-lg font-bold text-zinc-900 mb-5">{t("picksForYou")}</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {isLoadingPicks
                     ? Array(6)
                        .fill(0)
                        .map((_, i) => (
                           <div
                              key={i}
                              className="aspect-[3/4] bg-zinc-50 rounded-lg animate-pulse"
                           />
                        ))
                     : explorePicks.map((product) => (
                        <ProductCard key={product.id} product={product} />
                     ))}
               </div>
            </div>
         </div>
      );
   }

   // ── Cart with items ─────────────────────────────────────────
   return (
      <div className="bg-zinc-50 min-h-screen" dir={dir}>

         <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row gap-6">
               {/* Cart items */}
               <div className="flex-1 space-y-3">
                  {/* Free shipping notice */}
                  <div className="bg-brand/5 border border-brand/15 rounded-lg px-4 py-3 flex items-center gap-2.5">
                     <Truck size={16} className="text-brand shrink-0" />
                     <p className="text-[13px] font-medium text-brand">
                        {t("freeShippingNotice")}
                     </p>
                  </div>

                  <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                     <div className="px-5 py-3.5 border-b border-zinc-50 flex items-center justify-between">
                        <h1 className="text-lg font-bold text-zinc-900">
                           {t("cart")} ({enrichedCart.length})
                        </h1>
                        <button
                           onClick={clearCart}
                           className="text-[12px] font-medium text-zinc-400 hover:text-red-500 transition-colors"
                        >
                           {t("clearAll")}
                        </button>
                     </div>

                     <div className="divide-y divide-zinc-50">
                        {isLiveLoading ? (
                           <div className="py-12 flex flex-col items-center justify-center gap-2">
                              <div className="w-7 h-7 border-2 border-zinc-200 border-t-brand rounded-full animate-spin" />
                              <p className="text-[12px] text-zinc-400 font-medium">
                                 {t("syncing")}
                              </p>
                           </div>
                        ) : (
                           enrichedCart.map((item) => (
                              <div
                                 key={`${item.id}-${item.variation_id || "0"}`}
                                 className="p-4 flex gap-4 hover:bg-zinc-50/40 transition-colors"
                              >
                                 {/* Image */}
                                 <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-zinc-50 rounded-lg overflow-hidden border border-zinc-100 shrink-0">
                                    <Image
                                       src={item.image || "https://placehold.co/200"}
                                       alt={item.name}
                                       fill
                                       className="object-contain p-1.5"
                                    />
                                 </div>

                                 {/* Info */}
                                 <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                       <div className="flex items-start justify-between gap-3">
                                          <h3 className="text-[13px] font-semibold text-zinc-900 line-clamp-2 leading-snug">
                                             {item.name}
                                          </h3>
                                          <button
                                             onClick={() =>
                                                removeFromCart(item.id, item.variation_id)
                                             }
                                             className="text-zinc-300 hover:text-red-500 transition-colors shrink-0 p-0.5"
                                          >
                                             <Trash2 size={15} />
                                          </button>
                                       </div>
                                       {item.variation_name && (
                                          <p className="text-[11px] text-zinc-400 mt-0.5">
                                             {item.variation_name}
                                          </p>
                                       )}
                                       <div className="flex items-center gap-2 mt-1.5">
                                          <span className="text-[15px] font-bold text-zinc-900">
                                             {t("currency")}{" "}
                                             {parseFloat(item.price || 0).toFixed(2)}
                                          </span>
                                          {item.regular_price &&
                                             parseFloat(item.regular_price) >
                                             parseFloat(item.price) && (
                                                <span className="text-[12px] text-zinc-400 line-through">
                                                   {t("currency")}{" "}
                                                   {parseFloat(item.regular_price).toFixed(2)}
                                                </span>
                                             )}
                                       </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3">
                                       {/* Qty controls */}
                                       <div className="flex items-center gap-2">
                                          <div className="flex items-center bg-zinc-50 rounded-full p-0.5 border border-zinc-200">
                                             <button
                                                onClick={() =>
                                                   updateQuantity(
                                                      item.id,
                                                      item.quantity - 1,
                                                      item.variation_id
                                                   )
                                                }
                                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white transition-all text-zinc-600 disabled:opacity-20"
                                                disabled={item.quantity <= 1}
                                             >
                                                <Minus size={12} strokeWidth={3} />
                                             </button>
                                             <span className="w-8 text-center text-[13px] font-bold text-zinc-900">
                                                {item.quantity}
                                             </span>
                                             <button
                                                onClick={() =>
                                                   updateQuantity(
                                                      item.id,
                                                      item.quantity + 1,
                                                      item.variation_id
                                                   )
                                                }
                                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white transition-all text-zinc-600"
                                                disabled={
                                                   item.manage_stock &&
                                                   item.stock_quantity !== null &&
                                                   item.quantity >= item.stock_quantity
                                                }
                                             >
                                                <Plus size={12} strokeWidth={3} />
                                             </button>
                                          </div>
                                          {item.manage_stock &&
                                             item.stock_quantity !== null &&
                                             item.quantity >= item.stock_quantity && (
                                                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                                   {t("maxQty")}
                                                </span>
                                             )}
                                       </div>

                                       {/* Stock badge */}
                                       <div className="text-[11px] font-semibold">
                                          {item.stock_status === "outofstock" ||
                                             (item.manage_stock &&
                                                item.stock_quantity === 0) ? (
                                             <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                                                {t("outOfStock")}
                                             </span>
                                          ) : item.manage_stock &&
                                             item.stock_quantity !== null &&
                                             item.stock_quantity <= 5 ? (
                                             <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Clock size={10} />
                                                {t("limitedStock", {
                                                   count: item.stock_quantity,
                                                })}
                                             </span>
                                          ) : (
                                             <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                                {t("inStock")}
                                             </span>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </div>

               {/* Order summary */}
               <div className="w-full lg:w-[340px] space-y-4">
                  <div className="bg-white rounded-xl border border-zinc-100 p-6 sticky top-20">
                     <h2 className="text-base font-bold text-zinc-900 mb-5">
                        {t("orderSummary")}
                     </h2>

                     <div className="space-y-3 mb-5">
                        <div className="flex items-center justify-between text-[13px] text-zinc-600">
                           <span>
                              {t("subtotal")} ({enrichedCart.length})
                           </span>
                           <span className="font-semibold text-zinc-900">
                              {t("currency")} {subtotal.toFixed(2)}
                           </span>
                        </div>
                        <div className="flex items-center justify-between text-[13px] text-zinc-600">
                           <span>{t("shipping")}</span>
                           <span className="text-emerald-600 font-semibold">
                              {t("free")}
                           </span>
                        </div>
                        <div className="h-px bg-zinc-100" />
                        <div className="flex items-center justify-between">
                           <span className="text-[15px] font-bold text-zinc-900">
                              {t("total")}
                           </span>
                           <span className="text-xl font-bold text-brand">
                              {t("currency")} {subtotal.toFixed(2)}
                           </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 text-center">
                           {t("finalAmountNote")}
                        </p>
                     </div>

                     <div className="space-y-3">
                        {remainingForMin > 0 && (
                           <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-start gap-2">
                              <Info size={15} className="text-brand shrink-0 mt-0.5" />
                              <p className="text-[12px] text-orange-800">
                                 {t("minAmountNotice", {
                                    amount: remainingForMin.toFixed(2),
                                 })}
                              </p>
                           </div>
                        )}

                        <Link
                           href={canCheckout ? "/checkout" : "#"}
                           className={`flex items-center justify-center w-full h-12 rounded-lg font-bold text-[15px] transition-all ${canCheckout
                                 ? "bg-brand text-white hover:bg-brand-dark"
                                 : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                              }`}
                        >
                           {canCheckout
                              ? t("checkout")
                              : t("minCheckout", { amount: MIN_CHECKOUT_AMOUNT })}
                        </Link>

                        <div className="flex flex-col gap-1.5 mt-4">
                           <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-zinc-400">
                              <Lock size={12} className="text-emerald-500" />
                              {t("secureCheckout")}
                           </div>
                           <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
                              {t("noChargeNote")}
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* App promo */}
                  <div className="bg-emerald-600 rounded-xl p-5 text-white overflow-hidden relative group cursor-pointer">
                     <div className="relative z-10">
                        <h4 className="font-bold text-[14px] mb-0.5">
                           {t("downloadApp")}
                        </h4>
                        <p className="text-[12px] text-emerald-100">
                           {t("appPromo")}
                        </p>
                     </div>
                     <div className="absolute top-1/2 -start-3 -translate-y-1/2 opacity-15 group-hover:opacity-30 transition-opacity">
                        <ShoppingCart size={64} strokeWidth={2.5} />
                     </div>
                  </div>
               </div>
            </div>

            {/* Recommended */}
            <div className="mt-12">
               <h3 className="text-lg font-bold text-zinc-900 mb-5">
                  {t("recommended")}
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {isLoadingPicks
                     ? Array(6)
                        .fill(0)
                        .map((_, i) => (
                           <div
                              key={i}
                              className="aspect-[3/4] bg-zinc-50 rounded-lg animate-pulse"
                           />
                        ))
                     : explorePicks.map((product) => (
                        <ProductCard key={product.id} product={product} />
                     ))}
               </div>
            </div>
         </div>
      </div>
   );
}