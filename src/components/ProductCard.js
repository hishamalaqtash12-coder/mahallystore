"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Check, Eye, BadgeCheck, Heart, AlertCircle, Clock, Zap, Settings, TrendingDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useState } from "react";
import QuickLookModal from "./QuickLookModal";
import { useAuth } from "@/context/AuthContext";

import { isProductOutOfStock, getProductMerchant } from "@/lib/product-utils";
import { useEffect, useRef } from "react";

function CountdownTimer({ expiryDate, discountAmount, product }) {
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
        <div className="flex items-center gap-1 text-[10px] font-bold text-[#E67A00] bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5 w-fit shadow-xs">
          <TrendingDown size={11} className="text-[#E67A00] shrink-0" strokeWidth={3} />
          <span className="truncate">وفر {discountAmount.toFixed(2)} د.أ إضافية</span>
        </div>
      )}
      {/* Countdown Timer */}
      <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200/60 rounded-full px-2 py-0.5 w-fit shadow-xs">
        <Clock size={11} className="text-zinc-400 shrink-0" />
        <span className="tabular-nums">
          ينتهي: {timeLeft.days > 0 ? `${timeLeft.days}يوم ` : ""}
          {timeLeft.hours.toString().padStart(2, '0')}:
          {timeLeft.minutes.toString().padStart(2, '0')}:
          {timeLeft.seconds.toString().padStart(2, '0')}
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
          {displayPercent}% مباع
        </p>
      </div>
    </div>
  );
}

export default function ProductCard({ product }) {
  const { user, wooId, isVendor } = useAuth();
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

  const { name: merchantName, id: merchantId } = getProductMerchant(product);
  const merchantLink = merchantId ? `/vendors/${merchantId}` : "/vendors";
  const isVerifiedMerchant = !!merchantId;

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
    <div className="relative flex flex-col h-full bg-white group border border-zinc-200 hover:border-zinc-300 transition-all rounded-md p-2 shadow-sm hover:shadow-md min-w-0">
      {/* IMAGE */}
      <div className="relative aspect-square bg-[#F7F7F7] rounded-md overflow-hidden flex items-center justify-center p-2 mb-2">
        <Link href={`/product/${product.slug}`} className="block h-full w-full relative">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className={`object-contain transition-opacity ${outOfStock ? "opacity-50" : ""}`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
        </Link>

        {/* Out of Stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-zinc-800/80 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              نفدت الكمية
            </span>
          </div>
        )}

        {/* Badges (only when in stock) */}
        {!outOfStock && isBestSeller && (
          <div className="absolute top-0 left-0 bg-[#E67A00] text-white text-[10px] font-bold px-2 py-0.5 rounded-br-md shadow-sm z-10">
            الأكثر مبيعاً
          </div>
        )}
        {!outOfStock && onSale && !isBestSeller && (
          <div className={`absolute top-0 left-0 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-md shadow-sm z-10 flex items-center gap-1 ${isLimitedOffer ? "bg-gradient-to-r from-rose-600 to-orange-500" : "bg-[#CC0C39]"}`}>
            {isLimitedOffer && <Zap size={10} className="fill-white animate-bounce" />}
            {isLimitedOffer ? "عرض لفترة محدودة" : `وفر ${((1 - price / regularPrice) * 100).toFixed(0)}%`}
          </div>
        )}

        {/* Quick Look (only when in stock) */}
        {!outOfStock && (
          <button
            onClick={(e) => { e.preventDefault(); setIsQuickLookOpen(true); }}
            className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg pointer-events-auto">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-2"><Eye size={14} /> نظرة سريعة</span>
            </div>
          </button>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all z-20 group/wishlist"
        >
          <Heart
            size={16}
            className={`transition-colors ${alreadyInWishlist ? "fill-rose-500 text-rose-500" : "text-zinc-400 group-hover/wishlist:text-rose-400"}`}
          />
        </button>
      </div>

      {/* INFO */}
      <div className="px-1 flex flex-col flex-1 gap-1 min-w-0">
        {product.meta_data?.find(m => m.key === "_mahally_ad_status")?.value === "active" && (
          <span className="text-[11px] text-zinc-500 mb-[-2px]">إعلان ممول</span>
        )}

        <div className="relative group/title">
          <Link href={`/product/${product.slug}`}>
            <h3 className="text-[14px] leading-tight font-medium text-zinc-900 group-hover:text-[#9b2c41] line-clamp-2">
              {product.name}
            </h3>
          </Link>
          <div className="absolute left-0 top-full mt-1 w-[200%] sm:w-64 bg-white border border-zinc-200 shadow-xl p-2.5 rounded-md text-[12px] text-zinc-800 opacity-0 invisible group-hover/title:opacity-100 group-hover/title:visible transition-all z-[60] pointer-events-none font-medium">
            {product.name}
          </div>
        </div>

        {plainDescription && (
          <div className="relative group/desc w-full">
            <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5 leading-snug cursor-default">
              {plainDescription}
            </p>
            <div className="absolute left-0 top-full mt-1 w-[200%] sm:w-64 bg-white border border-zinc-200 shadow-xl p-2.5 rounded-md text-[11px] text-zinc-600 opacity-0 invisible group-hover/desc:opacity-100 group-hover/desc:visible transition-all z-[60] pointer-events-none leading-relaxed">
              {plainDescription}
            </div>
          </div>
        )}

        {/* Merchant Badge */}
        <div className="mt-1 flex">
          {merchantName ? (
            <Link
              href={merchantLink}
              className="inline-flex items-center gap-1 border border-zinc-200 bg-zinc-50 text-zinc-600 text-[10px] font-bold px-1.5 py-0.5 rounded-sm truncate max-w-full hover:border-[#007185] hover:text-[#007185] transition-all"
            >
              <span>يباع بواسطة {merchantName}</span>
              {isVerifiedMerchant && <BadgeCheck size={12} className="text-blue-500 shrink-0" />}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 border border-zinc-100 bg-zinc-50 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded-sm">
              محلي الرسمي
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex gap-0">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className={`${i < Math.round(avgRating) ? "text-[#FFA41C] fill-[#FFA41C]" : "text-zinc-200 fill-zinc-200"}`} />
            ))}
          </div>
          <span className="text-[12px] text-[#007185] hover:text-[#9b2c41] cursor-pointer">{ratingCount.toLocaleString()}</span>
        </div>

        {boughtLastMonth && !outOfStock && (
          <p className="text-[12px] text-zinc-600">{boughtLastMonth} شخص اشتروا هذا الشهر</p>
        )}

        <div className="mt-1">
          {outOfStock ? (
            <div className="flex items-center gap-1.5 text-rose-600">
              <AlertCircle size={13} />
              <span className="text-[13px] font-semibold">نفدت الكمية</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {onSale && <span className="text-[#CC0C39] text-[20px] font-light">-{Math.round((1 - price / regularPrice) * 100)}%</span>}
              <div className="flex items-start text-zinc-900">
                {product.type === "variable" && <span className="text-[12px] mt-1 font-normal text-zinc-600 mr-1">من</span>}
                <span className="text-2xl font-medium tracking-tight leading-none">{whole}</span>
                <span className="text-[12px] font-medium leading-none mt-1 mr-0.5">{decimal}</span>
                <span className="text-[12px] mt-1 font-medium mr-1">د.أ</span>
              </div>
            </div>
          )}
          {onSale && !outOfStock && (
            <p className="text-[12px] text-zinc-500 mt-0.5">
              السعر الأصلي: <span className="line-through font-medium">{regularPrice.toFixed(2)} د.أ</span>
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
                className="absolute bottom-3 left-3 w-[42px] h-8 rounded-full bg-white text-zinc-300 border border-zinc-200 flex items-center justify-center cursor-not-allowed shadow-sm"
                title="نفدت الكمية"
              >
                <AlertCircle size={16} />
              </div>
            );
          }

          if (isOwner) {
            return (
              <Link
                href="/merchant/dashboard/products"
                className="absolute bottom-3 left-3 w-[42px] h-8 rounded-full bg-white text-zinc-900 border border-zinc-900 flex items-center justify-center hover:bg-zinc-900 hover:text-white transition-colors shadow-sm"
                title="إدارة المنتج"
              >
                <Settings size={16} />
              </Link>
            );
          }

          if (isVendor) {
            return (
              <div
                className="absolute bottom-3 left-3 w-[42px] h-8 rounded-full bg-white text-zinc-300 border border-zinc-200 flex items-center justify-center cursor-not-allowed shadow-sm"
                title="الشراء معطل"
              >
                <ShoppingCart size={16} />
              </div>
            );
          }

          return (
            <button
              onClick={handleCartToggle}
              className={`absolute bottom-3 left-3 w-[42px] h-8 rounded-full flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95
                ${alreadyInCart ? "bg-zinc-900 text-white border border-zinc-900" : "bg-white text-zinc-900 border border-zinc-900 hover:bg-zinc-50"}`}
              title={alreadyInCart ? "إزالة من السلة" : "أضف إلى السلة"}
            >
              {alreadyInCart ? <Check size={16} /> : (
                 <div className="relative flex items-center justify-center">
                   <ShoppingCart size={16} strokeWidth={2.5} />
                   <span className="absolute -top-0.5 -right-1.5 text-[10px] font-black leading-none">+</span>
                 </div>
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
