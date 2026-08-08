"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Star, ShoppingCart, Check, Eye, BadgeCheck, Heart, AlertCircle, Clock, Zap, Settings, TrendingDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTranslations } from "next-intl";
import { useWishlist } from "@/context/WishlistContext";
import { useState } from "react";
import QuickLookModal from "./QuickLookModal";
import { useAuth } from "@/context/AuthContext";

import { isProductOutOfStock, getProductMerchant, getProductUrl } from "@/lib/product-utils";
import { isMadeInJordanProduct } from "@/lib/made-in-jordan";
import { useEffect, useRef } from "react";

function CountdownTimer({ expiryDate, discountAmount, product }) {
  const t = useTranslations("ProductCard");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(expiryDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setIsExpired(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  if (isExpired) return null;

  // Timeout strip (progress bar) logic
  const totalSales = parseInt(product?.total_sales || 0);
  const stock = parseInt(product?.stock_quantity || 10);
  const totalInitial = totalSales + stock;
  const claimedPercent = totalInitial > 0 ? Math.min(Math.round((totalSales / totalInitial) * 100), 99) : 0;
  const displayPercent = totalSales > 0 ? Math.max(claimedPercent, 15) : 5;

  return (
    <div className="flex flex-col gap-1 mt-2 max-w-[calc(100%-44px)] select-none">
      {/* Save Extra Badge */}
      {discountAmount > 0 && (
        <div className="flex items-center gap-1 text-[10px] font-bold text-brand bg-brand-light border border-brand-light/40 rounded-full px-2 py-0.5 w-fit shadow-xs">
          <TrendingDown size={11} className="text-brand shrink-0" strokeWidth={3} />
          <span className="truncate">{t("saveExtra", {amount: discountAmount.toFixed(2)})}</span>
        </div>
      )}
      {/* Countdown Timer */}
      <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200/60 rounded-full px-2 py-0.5 w-fit shadow-xs">
        <Clock size={11} className="text-zinc-400 shrink-0" />
        <span className="tabular-nums">
          {t("ends", {
            time: `${timeLeft.days > 0 ? `${timeLeft.days} ${t("day")} ` : ""}${timeLeft.hours.toString().padStart(2, '0')}:${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`
          })}
        </span>
      </div>
      {/* Timeout Strip / Progress Bar */}
      <div className="mt-1.5 w-full">
        <div className="h-1 w-full bg-zinc-200/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-950 transition-all duration-1000"
            style={{ width: `${displayPercent}%` }}
          />
        </div>
        <p className="text-[9px] font-black text-zinc-500 mt-1 uppercase tracking-wider">
          {t("sold", {percent: displayPercent})}
        </p>
      </div>
    </div>
  );
}

export default function ProductCard({ product }) {
  const t = useTranslations("ProductCard");
  const { user, wooId, isVendor, isAdmin } = useAuth();
  const { addToCart, removeFromCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isQuickLookOpen, setIsQuickLookOpen] = useState(false);

  const imageUrl = product.images?.[0]?.src || `https://placehold.co/400x400/f5f5f5/ff6000?text=${encodeURIComponent(product.name || "Product")}`;
  const alreadyInCart = isInCart(product.id);
  const alreadyInWishlist = isInWishlist(product.id);
  const outOfStock = isProductOutOfStock(product);

  const price = parseFloat(product.price || 0);
  const regularPrice = parseFloat(product.regular_price || 0);
  const onSale = (product.on_sale || (regularPrice > price && price > 0)) && regularPrice > 0;
  
  // Schedule Logic
  const saleEndDate = product.date_on_sale_to || product.date_on_sale_to_gmt;
  const isLimitedOffer = onSale && saleEndDate && new Date(saleEndDate) > new Date();

  const soldCount = product.total_sales || 0;
  const avgRating = parseFloat(product.average_rating || 0);
  const ratingCount = parseInt(product.rating_count || 0);

  const isBestSeller = soldCount > 500;
  const boughtLastMonth = soldCount > 0 ? (soldCount > 100 ? `${Math.floor(soldCount / 10) * 10}+` : soldCount) : null;

  const priceStr = price.toFixed(2);
  const [whole, decimal] = priceStr.split(".");

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const deliveryStr = deliveryDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const { name: merchantName, id: merchantId, slug: merchantSlug } = getProductMerchant(product);
  const merchantLink = merchantSlug || merchantId ? `/vendor/${merchantSlug || merchantId}` : "/vendors";
  const isVerifiedMerchant = !!merchantId;
  const isJordanian = isMadeInJordanProduct(product);

  const descriptionText = product.short_description || product.description || "";
  const plainDescription = descriptionText.replace(/<[^>]+>/g, "").trim();

  const handleCartToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    if (alreadyInCart) removeFromCart(product.id);
    else {
      // Ensure stock fields are explicitly available
      const itemToAdd = {
        ...product,
        stock_quantity: product.stock_quantity,
        manage_stock: product.manage_stock
      };
      addToCart(itemToAdd);
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-white group border border-zinc-200/80 hover:border-brand/40 transition-all duration-300 rounded-2xl p-2.5 shadow-xs hover:shadow-xl hover:-translate-y-1 min-w-0">
      {/* IMAGE */}
      <div className="relative aspect-square bg-[#F8F9FA] rounded-xl overflow-hidden flex items-center justify-center p-3 mb-2.5 group/img">
        <Link href={getProductUrl(product)} className="block h-full w-full relative">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className={`object-contain transition-transform duration-500 group-hover/img:scale-105 ${outOfStock ? "opacity-50" : ""}`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
        </Link>

        {/* Out of Stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/5 backdrop-blur-[2px] z-20">
            <span className="bg-rose-600/95 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              {t("outOfStock")}
            </span>
          </div>
        )}

        {/* Badges (only when in stock) */}
        {!outOfStock && isBestSeller && (
          <div className="absolute top-2.5 end-2.5 bg-zinc-900 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md z-10 uppercase tracking-wider">
            {t("bestSeller")}
          </div>
        )}
        {!outOfStock && onSale && !isBestSeller && (
          <div className={`absolute top-2.5 end-2.5 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md z-10 flex items-center gap-1 ${isLimitedOffer ? "bg-gradient-to-r from-rose-600 to-amber-500" : "bg-rose-600"}`}>
            {isLimitedOffer && <Zap size={10} className="fill-white animate-bounce" />}
            {isLimitedOffer ? t("limitedTimeOffer") : t("savePercent", {percent: ((1 - price / regularPrice) * 100).toFixed(0)})}
          </div>
        )}
        {!outOfStock && isJordanian && (
          <div className="absolute top-2.5 start-2.5 bg-emerald-600/95 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md z-10 uppercase tracking-wider">
            {locale === "ar" ? "صُنع في الأردن" : "Made in Jordan"}
          </div>
        )}

        {/* Quick Look (only when in stock) */}
        {!outOfStock && (
          <button
            onClick={(e) => { e.preventDefault(); setIsQuickLookOpen(true); }}
            className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg pointer-events-auto hover:scale-105 active:scale-95 transition-all">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5"><Eye size={14} className="text-brand" /> {t("quickLook")}</span>
            </div>
          </button>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
          className="absolute top-2.5 start-2.5 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all z-20 group/wishlist active:scale-90"
        >
          <Heart
            size={15}
            className={`transition-colors ${alreadyInWishlist ? "fill-rose-500 text-rose-500" : "text-zinc-400 group-hover/wishlist:text-rose-500"}`}
          />
        </button>
      </div>

      {/* INFO */}
      <div className="px-1 flex flex-col flex-1 gap-1 min-w-0">
        {product.meta_data?.find(m => m.key === "_mahally_ad_status")?.value === "active" && (
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-[-2px]">{t("sponsoredAd")}</span>
        )}

        <div className="relative group/title">
          <Link href={getProductUrl(product)}>
            <h3 className="text-xs sm:text-sm leading-snug font-bold text-zinc-900 group-hover:text-brand transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
        </div>

        {plainDescription && (
          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5 leading-snug">
            {plainDescription}
          </p>
        )}

        {/* Merchant Badge */}
        <div className="mt-1 flex">
          {merchantName ? (
            <Link
              href={merchantLink}
              className="inline-flex items-center gap-1 border border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-full hover:border-brand/40 hover:text-brand transition-all"
            >
              <span>{t("soldBy", {name: merchantName})}</span>
              {isVerifiedMerchant && <BadgeCheck size={12} className="text-blue-500 shrink-0" />}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 border border-zinc-100 bg-zinc-50 text-zinc-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {t("officialMahally")}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-0.5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className={`${i < Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-zinc-200 fill-zinc-200"}`} />
            ))}
          </div>
          <span className="text-[11px] font-bold text-zinc-400">({ratingCount.toLocaleString()})</span>
        </div>

        <div className="mt-2">
          {outOfStock ? (
            <div className="flex items-center gap-1.5 text-rose-600">
              <AlertCircle size={13} />
              <span className="text-xs font-bold">{t("outOfStock")}</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {onSale && <span className="text-rose-600 text-sm font-black">-{Math.round((1 - price / regularPrice) * 100)}%</span>}
              <div className="flex items-start text-zinc-900">
                {product.type === "variable" && <span className="text-[11px] mt-0.5 font-medium text-zinc-500 me-1">{t("from")}</span>}
                <span className="text-xl sm:text-2xl font-black tracking-tight leading-none text-zinc-900">{whole}</span>
                <span className="text-xs font-bold leading-none mt-0.5 ms-0.5 text-zinc-700">.{decimal}</span>
                <span className="text-xs font-bold mt-0.5 ms-1 text-zinc-500">{t("jod")}</span>
              </div>
            </div>
          )}
          {onSale && !outOfStock && (
            <p className="text-[11px] text-zinc-400 line-through mt-0.5 font-medium">
              {t("originalPrice", {price: regularPrice.toFixed(2)})}
            </p>
          )}

          {/* Countdown Timer for Limited Offers */}
          {isLimitedOffer && !outOfStock && <CountdownTimer expiryDate={saleEndDate} discountAmount={regularPrice > price ? regularPrice - price : 0} product={product} />}
        </div>

        <div className="mt-auto"></div>

        {(() => {
          const isOwner = user && String(wooId) === String(merchantId);

          if (outOfStock) {
            return (
              <div
                className="absolute bottom-3 end-3 w-9 h-9 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center cursor-not-allowed"
                title={t("outOfStock")}
              >
                <AlertCircle size={16} />
              </div>
            );
          }

          if (isOwner) {
            return (
              <Link
                href="/merchant/dashboard/products"
                className="absolute bottom-3 end-3 w-9 h-9 rounded-full bg-white text-zinc-900 border border-zinc-300 flex items-center justify-center hover:bg-zinc-900 hover:text-white transition-all shadow-sm active:scale-90"
                title={t("manageProduct")}
              >
                <Settings size={15} />
              </Link>
            );
          }

          if (isVendor || isAdmin) {
            return (
              <div
                className="absolute bottom-3 end-3 w-9 h-9 rounded-full bg-zinc-100 text-zinc-300 flex items-center justify-center cursor-not-allowed"
                title={t("purchaseDisabled")}
              >
                <ShoppingCart size={15} />
              </div>
            );
          }

          return (
            <button
              onClick={handleCartToggle}
              className={`absolute bottom-3 end-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md hover:scale-110 active:scale-90
                ${alreadyInCart ? "bg-brand text-white border border-brand hover:bg-brand-dark" : "bg-zinc-900 text-white hover:bg-brand"}`}
              title={alreadyInCart ? t("removeFromCart") : t("addToCart")}
            >
              {alreadyInCart ? <Check size={16} /> : (
                 <ShoppingCart size={15} strokeWidth={2.2} />
              )}
            </button>
          );
        })()}
      </div>

      <QuickLookModal
        product={product}
        isOpen={isQuickLookOpen}
        onClose={() => setIsQuickLookOpen(false)}
      />
    </div>
  );
}
