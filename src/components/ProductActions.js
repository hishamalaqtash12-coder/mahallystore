"use client";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import {
  ShoppingCart,
  Heart,
  Share2,
  Minus,
  Plus,
  Check,
  Clock,
  Truck,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { getProductMerchant, getProductIdentifier } from "@/lib/product-utils";
import ReportModal from "@/components/ReportModal";
import { useLocale, useTranslations } from "next-intl";

export default function ProductActions({
  product,
  variations = [],
  returnPolicy = null,
  whatsappNumber = null,
  merchantName: merchantNameProp = null,
}) {
  const t = useTranslations("ProductActions");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const { user, wooId, messagingEnabled, whatsappEnabled, isVendor, isAdmin } =
    useAuth();
  const router = useRouter();
  const { id: merchantId } = getProductMerchant(product);
  const isOwner = user && String(wooId) === String(merchantId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { addToCart, setIsCartOpen, cart, updateQuantity, removeFromCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [selectedOptions, setSelectedOptions] = useState({});
  const isFavorite = isInWishlist(product.id);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    if (product?.attributes?.length > 0) {
      const initial = {};
      product.attributes.forEach((attr) => {
        if (attr.options && attr.options.length > 0) {
          initial[attr.name] = attr.options[0];
        }
      });
      setSelectedOptions(initial);
    }
  }, [product]);

  const handleOptionSelect = (attrName, option) => {
    setSelectedOptions((prev) => ({ ...prev, [attrName]: option }));
  };

  const matchedVariation =
    variations && variations.length > 0
      ? variations.find((v) => {
        return (
          v.attributes &&
          v.attributes.every((attr) => {
            return !attr.option || selectedOptions[attr.name] === attr.option;
          })
        );
      })
      : null;

  useEffect(() => {
    if (matchedVariation) {
      window.dispatchEvent(
        new CustomEvent("product-variation-update", {
          detail: { variation: matchedVariation },
        })
      );
    }
  }, [matchedVariation?.id]);

  useEffect(() => {
    const saleEndStr =
      matchedVariation?.date_on_sale_to ||
      product.date_on_sale_to ||
      matchedVariation?.date_on_sale_to_gmt ||
      product.date_on_sale_to_gmt;

    if (!saleEndStr) {
      setTimeLeft("");
      return;
    }

    const targetDate = new Date(saleEndStr);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft("");
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      if (d > 0) {
        setTimeLeft(
          `${d}d ${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}:${s.toString().padStart(2, "0")}`
        );
      } else {
        setTimeLeft(
          `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}:${s.toString().padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [matchedVariation?.date_on_sale_to, product.date_on_sale_to]);

  const handleAddToCart = () => {
    const itemToAdd = {
      ...product,
      id: matchedVariation ? product.id : product.id,
      variation_id: matchedVariation?.id,
      price: matchedVariation?.price || product.price,
      regular_price:
        matchedVariation?.regular_price || product.regular_price,
      name: matchedVariation
        ? `${product.name} (${Object.values(selectedOptions).join(", ")})`
        : product.name,
      images: matchedVariation?.image?.src
        ? [{ src: matchedVariation.image.src }]
        : product.images,
      selectedOptions,
      vendorId:
        product.meta_data?.find(
          (m) =>
            m.key === "_vendor_id" ||
            m.key === "mahally_owner_id" ||
            m.key === "merchant_id"
        )?.value || product.author,
      stock_quantity: matchedVariation
        ? matchedVariation.stock_quantity
        : product.stock_quantity,
      manage_stock: matchedVariation
        ? matchedVariation.manage_stock
        : product.manage_stock,
    };

    addToCart(itemToAdd, qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setIsCartOpen(true);
    }, 600);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch { }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert(t("linkCopied"));
      } catch {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        alert(t("linkCopied"));
      }
    }
  };

  const currentRegularPrice = parseFloat(
    matchedVariation?.regular_price ||
    matchedVariation?.price ||
    product.regular_price ||
    product.price ||
    0
  );
  const currentSalePrice = parseFloat(
    matchedVariation?.price || product.price || 0
  );
  const currentDiscountPercent =
    currentRegularPrice > 0 && currentRegularPrice > currentSalePrice
      ? Math.round(
        ((currentRegularPrice - currentSalePrice) / currentRegularPrice) *
        100
      )
      : 0;
  const currentStockQuantity = matchedVariation
    ? matchedVariation.stock_quantity
    : product.stock_quantity;
  const currentStockStatus = matchedVariation
    ? matchedVariation.stock_status
    : product.stock_status;

  const deliveryStart = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const deliveryEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const dateLocale = locale === "ar" ? "ar-JO" : "en-GB";
  const fmtDate = (d) =>
    d.toLocaleDateString(dateLocale, { month: "short", day: "numeric" });

  const displayReturnPolicy = returnPolicy || t("noReturnInfo");

  return (
    <div
      className="border border-[#D5D9D9] rounded-lg p-4 bg-white w-full"
      dir={dir}
    >
      {/* Price */}
      <div className="mb-2">
        {currentRegularPrice > currentSalePrice && (
          <div className="text-[13px] text-[#565959] line-through">
            {t("currency")} {currentRegularPrice.toFixed(2)}
          </div>
        )}
        <div className="flex items-start gap-1">
          <span className="text-[24px] font-medium text-brand flex items-start leading-none">
            <span className="text-[12px] mt-1 ms-0.5">{t("currency")}</span>
            {currentSalePrice.toFixed(2)}
          </span>
          {currentDiscountPercent > 0 && (
            <span className="text-[14px] text-brand font-medium mt-1">
              -{currentDiscountPercent}%
            </span>
          )}
        </div>
      </div>

      {/* Delivery Estimate */}
      <div className="flex items-center gap-2 text-[14px] text-[#0F1111] mb-4">
        <Clock size={16} className="text-zinc-400" />
        <span>
          {t("expectedDelivery")}:{" "}
          <span className="font-bold">
            {fmtDate(deliveryStart)} – {fmtDate(deliveryEnd)}
          </span>
        </span>
      </div>

      {/* Stock Status */}
      <div
        className={`text-[18px] font-medium mb-3 ${currentStockStatus === "outofstock"
          ? "text-brand-dark"
          : "text-[#007600]"
          }`}
      >
        {currentStockStatus === "outofstock" ? t("outOfStock") : t("inStock")}
      </div>

      {/* Variations */}
      {product.type === "variable" &&
        product.attributes &&
        product.attributes.length > 0 && (
          <div className="space-y-4 mb-6 pt-2 border-t border-zinc-100">
            {product.attributes.map((attr) => (
              <div key={attr.id || attr.name} className="space-y-2">
                <label className="text-[13px] font-bold text-[#0F1111] flex items-center justify-between">
                  <span>
                    {attr.name}:{" "}
                    <span className="font-medium text-[#565959]">
                      {selectedOptions[attr.name]}
                    </span>
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {attr.options.map((option) => {
                    const isSelected = selectedOptions[attr.name] === option;
                    return (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect(attr.name, option)}
                        className={`min-w-[40px] h-[32px] px-3 flex items-center justify-center rounded border text-[13px] font-medium transition-all shadow-sm ${isSelected
                          ? "border-brand bg-brand-light ring-1 ring-brand text-zinc-900"
                          : "border-[#D5D9D9] bg-white hover:bg-[#F7FAFA] text-zinc-700"
                          }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Quantity */}
      {currentStockStatus !== "outofstock" && (
        <div className="mb-4">
          <div className="relative inline-block w-full">
            <select
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value))}
              className="w-full h-[32px] pe-3 ps-8 bg-[#F0F2F2] border border-[#D5D9D9] rounded-md text-[13px] text-[#0F1111] appearance-none cursor-pointer outline-none hover:bg-[#E3E6E6] shadow-[0_2px_5px_rgba(15,17,17,0.15)] focus:border-brand focus:shadow-[0_0_0_3px_var(--color-brand-light)]"
            >
              {Array.from(
                {
                  length:
                    currentStockQuantity > 0
                      ? Math.min(10, currentStockQuantity)
                      : 10,
                },
                (_, i) => i + 1
              ).map((n) => (
                <option key={n} value={n}>
                  {t("quantity")}: {n}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute start-2 top-1/2 -translate-y-1/2 text-[#0F1111] pointer-events-none"
              size={14}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 mb-4">
        {(() => {
          const productOwnerId =
            product.meta_data?.find(
              (m) =>
                m.key === "_vendor_id" ||
                m.key === "mahally_owner_id" ||
                m.key === "merchant_id"
            )?.value || String(product.author || "");

          const isProductOwner =
            user && String(wooId) === String(productOwnerId);

          if (isProductOwner) {
            return (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-[12px] text-amber-800 leading-tight">
                  <strong>{t("vendorView")}:</strong> {t("ownProductNote")}
                </div>
                <Link
                  href="/merchant/dashboard/products"
                  className="w-full h-[32px] rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 text-[13px] flex items-center justify-center transition-all font-bold"
                >
                  {t("manageProduct")}
                </Link>
              </div>
            );
          }

          if (isVendor || isAdmin) {
            return (
              <div className="w-full text-center text-[13px] font-medium text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-md py-2 px-3">
                {t("purchaseDisabled")}
              </div>
            );
          }

          const alreadyInCart = isInCart(product.id, matchedVariation?.id);
          const cartItem = cart.find(
            (item) => item.id === product.id && item.variation_id === (matchedVariation?.id || null)
          );
          const qtyInCart = cartItem?.quantity || 0;

          if (alreadyInCart) {
            return (
              <div className="w-full flex items-center justify-between bg-[#F8F9FA] border border-[#E5E7E8] rounded-xl px-4 py-2 mt-4">
                <p className="text-[13px] font-bold text-zinc-700 flex items-center gap-2">
                  <Check size={16} className="text-emerald-500" />
                  {t("addedToCart")}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-[#F0F2F2] border border-[#D5D9D9] rounded-lg h-[33px] px-1 shadow-sm">
                    <button onClick={() => updateQuantity(product.id, qtyInCart - 1, matchedVariation?.id)} className="w-8 h-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-[13px] font-bold text-zinc-900">{qtyInCart}</span>
                    <button onClick={() => updateQuantity(product.id, qtyInCart + 1, matchedVariation?.id)} className="w-8 h-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <>
              <button
                onClick={handleAddToCart}
                disabled={added || currentStockStatus === "outofstock"}
                className={`w-full h-[32px] rounded-full text-[13px] flex items-center justify-center transition-all ${currentStockStatus === "outofstock"
                  ? "bg-zinc-200 text-zinc-500 cursor-not-allowed border border-zinc-300"
                  : added
                    ? "bg-[#007600] text-white border border-[#007600]"
                    : "bg-brand hover:bg-brand-dark text-white border border-brand font-bold"
                  }`}
              >
                {added ? t("addedToCart") : t("addToCart")}
              </button>
              <button
                onClick={() => {
                  handleAddToCart();
                  router.push("/checkout");
                }}
                disabled={currentStockStatus === "outofstock"}
                className={`w-full h-[32px] rounded-full text-[13px] flex items-center justify-center transition-all ${currentStockStatus === "outofstock"
                  ? "bg-zinc-200 text-zinc-500 cursor-not-allowed border border-zinc-300"
                  : "bg-brand-light hover:bg-brand/20 text-brand-dark border border-brand-light font-bold"
                  }`}
              >
                {t("buyNow")}
              </button>
            </>
          );
        })()}
      </div>

      {/* Ships from / Sold by */}
      <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 text-[12px] mb-4 border-t border-zinc-100 pt-3">
        {/* <div className="text-[#565959]">{t("shipsFrom")}</div>
        <div className="text-[#0F1111]">
          {product.meta_data?.find((m) => m.key === "mahally_shipped_by")
            ?.value || t("noInfo")}
        </div> */}
        <div className="text-[#565959]">{t("soldBy")}</div>
        {(() => {
          const {
            name: metaStoreName,
            id: storeId,
            slug: storeSlug,
          } = getProductMerchant(product);
          // Use live merchantName prop (from server-fetched vendorData) when available
          const storeName = merchantNameProp || metaStoreName;
          return (
            <Link
              href={
                storeSlug || storeId
                  ? `/vendor/${storeSlug || storeId}`
                  : "/vendors"
              }
              className="text-brand hover:text-brand-dark hover:underline font-medium"
            >
              {storeName || t("officialMahally")}
            </Link>
          );
        })()}
        <div className="text-[#565959]">{t("returns")}</div>
        <div
          className={`text-[12px] font-medium ${displayReturnPolicy === t("noReturns")
            ? "text-rose-600"
            : "text-brand hover:text-brand-dark hover:underline cursor-pointer"
            }`}
        >
          {displayReturnPolicy}
        </div>
      </div>

      <div className="border-t border-[#D5D9D9] pt-3 flex flex-col gap-2">
        <button
          onClick={() => toggleWishlist(product)}
          className="w-full text-center text-[13px] text-[#0F1111] hover:text-brand-dark hover:underline border border-[#D5D9D9] rounded-md px-3 py-1.5 bg-white hover:bg-zinc-50 transition-colors shadow-sm"
        >
          {isFavorite ? t("removeFromList") : t("addToList")}
        </button>

        <div className="flex flex-col gap-2">
          {!isOwner && (
            <button
              onClick={() => setIsReportOpen(true)}
              className="w-full text-center text-[13px] font-medium text-red-600 border border-red-200 hover:bg-red-50/50 rounded-md px-3 py-1.5 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert size={14} />
              {t("reportProduct")}
            </button>
          )}

          {!isOwner &&
            messagingEnabled &&
            product.meta_data?.find((m) => m.key === "_vendor_id")?.value && (
              <button
                onClick={() => {
                  const vendorId = product.meta_data.find(
                    (m) => m.key === "_vendor_id"
                  ).value;
                  const msg = t("askSellerMessage", {
                    name: product.name,
                    id: getProductIdentifier(product),
                    url: `${window.location.origin}/product/${decodeURIComponent(product.slug)}`,
                  });
                  router.push(
                    `/messages?to=${vendorId}&msg=${encodeURIComponent(msg)}`
                  );
                }}
                className="w-full text-center text-[13px] font-bold text-zinc-900 border border-[#D5D9D9] rounded-md px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 transition-all shadow-sm"
              >
                {t("askSeller")}
              </button>
            )}

          {!isOwner && whatsappEnabled && whatsappNumber && (
            <a
              href={
                mounted
                  ? `https://wa.me/${whatsappNumber.replace(
                    /[^0-9]/g,
                    ""
                  )}?text=${encodeURIComponent(
                    t("whatsappMessage", {
                      name: product.name,
                      price: currentSalePrice.toFixed(2),
                      id: getProductIdentifier(product),
                      options:
                        Object.keys(selectedOptions).length > 0
                          ? Object.entries(selectedOptions)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ")
                          : "",
                      url: `${window.location.origin}/product/${decodeURIComponent(product.slug)}`,
                    })
                  )}`
                  : "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center text-[13px] font-bold text-[#25D366] border border-[#25D366] rounded-md px-3 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.031 0C5.383 0 0 5.383 0 12.031C0 14.156 0.556 16.208 1.583 17.989L0.117 23.351L5.617 21.908C7.339 22.84 9.278 23.351 11.272 23.351H11.277C17.925 23.351 23.311 17.965 23.311 11.317C23.311 8.093 22.056 5.068 19.78 2.788C17.504 0.509 14.479 0 12.031 0ZM12.031 19.467C10.231 19.467 8.5 18.983 6.983 18.083L6.633 17.872L3.372 18.728L4.244 15.544L4.017 15.183C3.028 13.611 2.506 11.8 2.506 9.928C2.506 4.672 6.772 0.406 12.033 0.406C14.583 0.406 16.933 1.4 18.739 3.206C20.544 5.011 21.539 7.361 21.539 9.917C21.539 15.172 17.272 19.439 12.031 19.467ZM17.261 14.133C16.972 13.989 15.544 13.283 15.278 13.189C15.011 13.094 14.817 13.044 14.628 13.333C14.433 13.617 13.889 14.283 13.722 14.472C13.556 14.661 13.389 14.683 13.106 14.539C12.817 14.394 11.878 14.089 10.767 13.094C9.889 12.306 9.306 11.356 9.139 11.067C8.972 10.778 9.122 10.622 9.267 10.478C9.394 10.35 9.55 10.15 9.694 9.983C9.839 9.817 9.889 9.694 9.983 9.506C10.078 9.317 10.028 9.15 9.956 9.006C9.883 8.861 9.306 7.444 9.067 6.861C8.833 6.294 8.6 6.372 8.433 6.361C8.278 6.356 8.083 6.35 7.894 6.35C7.706 6.35 7.394 6.422 7.133 6.706C6.872 6.989 6.133 7.678 6.133 9.083C6.133 10.489 7.156 11.844 7.3 12.033C7.444 12.222 9.306 15.111 12.189 16.35C12.878 16.644 13.406 16.822 13.817 16.956C14.506 17.178 15.133 17.144 15.628 17.067C16.183 16.978 17.261 16.4 17.483 15.756C17.706 15.111 17.706 14.567 17.628 14.472C17.556 14.372 17.361 14.278 17.072 14.133L17.261 14.133Z" />
              </svg>
              {t("contactWhatsApp")}
            </a>
          )}
        </div>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportedId={product.id}
        reportedName={product.name}
        type="product"
      />
    </div>
  );
}