"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { X, ChevronRight, ChevronDown, Star, Truck, ShieldCheck, RotateCcw, Plus, Minus, Trash2, AlertCircle, Clock } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { isProductOutOfStock, getProductMerchant, getProductUrl, getProductIdentifier, DEFAULT_FALLBACK_IMAGE } from "@/lib/product-utils";
import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLocale } from "next-intl";
import ProductCountdown from "./ProductCountdown";
import ShippingInfoDisplay from "./ShippingInfoDisplay";
import { isMadeInJordanProduct } from "@/lib/made-in-jordan";
import ReviewTooltip from "./ReviewTooltip";

export default function QuickLookModal({ product: initialProduct, isOpen, onClose }) {
  const t = useTranslations("QuickLook");
  const locale = useLocale();
  const router = useRouter();
  const { user, wooId, isVendor, isAdmin } = useAuth();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const [product, setProduct] = useState(initialProduct);
  const [vendorData, setVendorData] = useState(null);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen && typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    } else if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);

  // Sync with global cart state
  const cartItem = useMemo(() => cart.find(item => item.id === product?.id), [cart, product?.id]);
  const qtyInCart = cartItem?.quantity || 0;

  useEffect(() => {
    if (product?.attributes?.length > 0) {
      const initial = {};
      product.attributes.forEach(attr => {
        if (attr.options && attr.options.length > 0) {
          initial[attr.name] = attr.options[0];
        }
      });
      setSelectedOptions(initial);
    }
  }, [product]);

  const handleOptionSelect = (attrName, option) => {
    setSelectedOptions(prev => ({ ...prev, [attrName]: option }));
  };

  const matchedVariation = useMemo(() => {
    const variations = product?.variations_data || [];
    if (variations.length === 0) return null;
    return variations.find(v => {
      return v.attributes && v.attributes.every(attr => {
        return !attr.option || selectedOptions[attr.name] === attr.option;
      });
    });
  }, [product?.variations_data, selectedOptions]);

  // Reset selected image index when matched variation changes
  useEffect(() => {
    setSelectedImage(0);
  }, [matchedVariation?.id]);

  // Compute the images to show: variation image (if any) takes priority
  const displayImages = useMemo(() => {
    if (matchedVariation?.image?.src) {
      // Variation image first, then remaining product images (excluding duplicates)
      const variationImg = { src: matchedVariation.image.src };
      const otherImgs = (product?.images || []).filter(img => img.src !== matchedVariation.image.src);
      return [variationImg, ...otherImgs];
    }
    return product?.images || [];
  }, [matchedVariation?.image?.src, product?.images]);

  // Fetch full product details when opened
  useEffect(() => {
    if (isOpen && initialProduct?.id) {
      const fetchFullProduct = async () => {
        setLoading(true);
        try {
          // Fetch product details and live ratings in parallel
          const productRes = await fetch(`/api/products/${initialProduct.id}`);

          if (productRes.ok) {
            const data = await productRes.json();
            setProduct(data);

            // 3. Fetch Vendor Data for policies
            const { id: vId } = getProductMerchant(data);
            if (vId) {
              setVendorLoading(true);
              fetch(`/api/vendors/${vId}`).then(r => r.json()).then(v => {
                if (v?.vendor) setVendorData(v.vendor);
              }).catch(() => { })
                .finally(() => setVendorLoading(false));
            }
          }
        } catch (e) {
          console.error("QuickLook fetch error", e);
        } finally {
          setLoading(false);
        }
      };
      fetchFullProduct();
    }
  }, [isOpen, initialProduct?.id]);

  const handleBuyNow = () => {
    if (!product) return;
    const isOutOfStock = isProductOutOfStock(matchedVariation || product);
    if (isOutOfStock) return;
    if (qtyInCart === 0) addToCart(product, 1);
    router.push('/checkout');
    onClose();
  };

  // Return Policy Logic
  const returnPolicyData = useMemo(() => {
    if (!product) return { text: "", isReady: false };
    const itemReturnPolicy = product.meta_data?.find(m => m.key === "mahally_return_policy")?.value;
    const itemReturnPeriod = product.meta_data?.find(m => m.key === "mahally_return_period")?.value;

    if (itemReturnPolicy === "no-returns") return { text: t("noReturns"), isReady: true };
    if (itemReturnPolicy === "custom") return { text: t("eligibleForReturn", { days: itemReturnPeriod || "14" }), isReady: true };

    if (vendorLoading) return { text: "", isReady: false };

    // Check Vendor Global Policy
    if (vendorData) {
      // The API flattens vendor data into direct properties
      const globalPolicy = vendorData.returnPolicy || vendorData.meta_data?.find(m => m.key === "mahally_return_policy")?.value;
      const globalPeriod = vendorData.returnPeriod || vendorData.meta_data?.find(m => m.key === "mahally_return_period")?.value;

      if (globalPolicy === "no-returns") return { text: t("noReturns"), isReady: true };
      if (globalPolicy === "global" || globalPolicy === "eligible" || globalPeriod) {
        return { text: t("eligibleForReturn", { days: globalPeriod || "14" }), isReady: true };
      }
    }

    return { text: t("eligibleForReturnGlobal"), isReady: true };
  }, [product, vendorData, vendorLoading, t]);

  // Delivery Dates
  const deliveryDates = useMemo(() => {
    const start = new Date(); start.setDate(start.getDate() + 2);
    const end = new Date(); end.setDate(end.getDate() + 5);
    const fmt = (d) => d.toLocaleDateString(locale === "ar" ? "ar-JO" : "en-US", { month: "short", day: "numeric" });
    return `${fmt(start)} - ${fmt(end)}`;
  }, [locale]);

  if (!isOpen || !product || !mounted) return null;

  const outOfStock = isProductOutOfStock(matchedVariation || product);
  const regularPrice = parseFloat(matchedVariation?.regular_price || matchedVariation?.price || product.regular_price || product.price || 0);
  const salePrice = parseFloat(matchedVariation?.price || product.price || 0);
  const discount = (regularPrice > 0 && regularPrice > salePrice) ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;

  const ratingCount = product.rating_count || 0;
  const avgRating = product.average_rating ? parseFloat(product.average_rating) : 0;
  const { name: metaMerchantName, id: merchantId, slug: merchantSlug } = getProductMerchant(product);
  // Use live storeName from vendorData (fetched from /api/vendors) when available
  const merchantName = vendorData?.storeName || metaMerchantName;



  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-300 z-[99999]"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-[900px] shadow-2xl flex flex-col md:flex-row animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 rounded-t-3xl md:rounded-2xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto no-scrollbar md:overflow-hidden z-[100000] border-t md:border border-zinc-200">

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
          className="hidden md:flex absolute top-4 end-4 z-50 w-9 h-9 items-center justify-center bg-white/90 border border-zinc-200 hover:bg-white rounded-full text-zinc-700 transition-all shadow-md active:scale-95"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="w-full flex items-center justify-center p-20 min-h-[350px]">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-brand rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* LEFT: Image Gallery */}
            <div className="w-full md:w-[45%] p-4 sm:p-6 pt-3 md:pt-6 flex flex-col bg-white border-b md:border-b-0 md:border-l border-zinc-200 shrink-0 md:overflow-y-auto no-scrollbar">
              <div className="relative aspect-square max-h-[240px] sm:max-h-[280px] md:max-h-none mb-3 md:mb-6 flex items-center justify-center bg-zinc-50/50 rounded-xl overflow-hidden border border-zinc-100 shadow-xs mx-auto w-full">
                {isMadeInJordanProduct(product) && (
                  <div className="absolute top-0 start-0 bg-zinc-900 text-white text-[10px] sm:text-[11px] font-black px-3 py-1.5 z-10 uppercase tracking-widest rounded-ee-xl shadow-sm flex items-center gap-1.5">
                    <span className="text-[12px] leading-none">🇯🇴</span>
                    <span className="mt-0.5">{locale === "ar" ? "صُنع بأيادٍ أردنية" : "Made in Jordan"}</span>
                  </div>
                )}
                <Image
                  src={displayImages[selectedImage]?.src || displayImages[0]?.src || DEFAULT_FALLBACK_IMAGE}
                  alt={product.name}
                  fill
                  className="object-contain transition-all duration-300 p-2"
                  priority={true}
                />
              </div>

              {/* Thumbnails Row */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar justify-center pb-1 md:pb-0">
                {displayImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-12 h-12 rounded border transition-all shrink-0 bg-white ${selectedImage === i ? 'border-brand ring-1 ring-brand' : 'border-zinc-200 hover:border-brand'}`}
                  >
                    <Image src={img.src} alt={`Product thumbnail ${i + 1}`} fill className="object-cover p-0.5 rounded" />
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT: Product Details */}
            <div className="flex-1 p-5 sm:p-6 flex flex-col bg-white md:overflow-y-auto no-scrollbar pb-10 md:pb-6">
              {/* Product Identity */}
              <div className="mb-4">
                <h2 className="text-[20px] font-medium text-zinc-900 leading-snug mb-1">
                  {product.name}
                </h2>
                <ReviewTooltip
                  productId={product.id}
                  ratingCount={ratingCount}
                  averageRating={avgRating}
                  productUrl={`${getProductUrl(product)}#reviews`}
                >
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={`${i < Math.round(avgRating) ? 'fill-[#FFA41C] text-[#FFA41C]' : 'fill-zinc-200 text-zinc-200'}`}
                        />
                      ))}
                    </div>
                    <ChevronDown size={13} className="text-zinc-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    <span className="text-[13px] text-brand hover:text-brand-dark hover:underline cursor-pointer">
                      {ratingCount} {ratingCount === 1 ? t("ratingSingular") : t("ratingPlural")}
                    </span>
                  </div>
                </ReviewTooltip>

                <div className="flex items-center gap-2 mt-2 text-[12px]">
                  <span className="text-zinc-500">{locale === "ar" ? "رقم المنتج:" : "Product ID:"}</span>
                  <span className="font-mono text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 font-bold">
                    {getProductIdentifier(product)}
                  </span>
                  <span className="font-mono text-zinc-400 text-[11px]">
                    (ID: {product.id})
                  </span>
                </div>
              </div>

              <div className="h-px bg-zinc-100 w-full mb-4" />

              {/* Pricing */}
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {discount > 0 && (
                    <div className="inline-block bg-brand text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
                      {t("limitedTimeOffer")}
                    </div>
                  )}
                  <ProductCountdown endDate={product.date_on_sale_to} />
                </div>
                <div className="flex items-start gap-1">
                  <span className="text-[28px] font-medium leading-none text-zinc-900">{salePrice.toFixed(2)}</span>
                  <span className="text-[13px] mt-1 font-medium text-zinc-900 ms-1">{t("jod")}</span>
                </div>
                {regularPrice > salePrice && (
                  <p className="text-[13px] text-zinc-500 mt-1">
                    {t("originalPrice")} <span className="line-through">{regularPrice.toFixed(2)} {t("jod")}</span>
                    <span className="ms-2 text-rose-700">{t("discount", { discount })}</span>
                  </p>
                )}
              </div>

              {/* Delivery & Trust */}
              <div className="space-y-1 mb-6">
                <ShippingInfoDisplay
                  vendorId={merchantId}
                  productPrice={salePrice}
                  merchantName={merchantName}
                />

                {!returnPolicyData.isReady ? (
                  <div className="flex items-center gap-3 text-[13px] pt-3 px-1">
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-200 border-t-brand animate-spin" />
                    <div className="h-3 bg-zinc-200 rounded w-24 animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-[13px] pt-3 px-1">
                    <RotateCcw size={16} className={returnPolicyData.text === t("noReturns") ? "text-rose-500" : "text-zinc-600"} />
                    <span className={`font-medium ${returnPolicyData.text === t("noReturns") ? "text-rose-600" : "text-brand hover:text-brand-dark hover:underline cursor-pointer"}`}>{returnPolicyData.text}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-[12px] pt-1 px-1">
                  <Clock size={14} className="text-zinc-400" />
                  <span className="text-zinc-500">{t("expectedDelivery")} <span className="font-bold text-zinc-700">{deliveryDates}</span></span>
                </div>
                {/* <div className="flex items-center gap-3 text-[13px] pt-1 px-1">
                  <ShieldCheck size={16} className="text-zinc-600" />
                  <span className="text-zinc-500">Secure transaction</span>
                </div> */}
              </div>

              <div className="h-px bg-zinc-100 w-full mb-4" />

              {/* Variations / Attributes */}
              {product.type === "variable" && product.attributes && product.attributes.length > 0 && (
                <div className="space-y-4 mb-6">
                  {product.attributes.map((attr) => (
                    <div key={attr.id || attr.name} className="space-y-2">
                      <label className="text-[13px] font-bold text-[#0F1111]">
                        {attr.name}: <span className="font-medium text-[#565959]">{selectedOptions[attr.name]}</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {attr.options.map((option) => {
                          const isSelected = selectedOptions[attr.name] === option;
                          return (
                            <button
                              key={option}
                              onClick={() => handleOptionSelect(attr.name, option)}
                              className={`min-w-[40px] h-[32px] px-3 flex items-center justify-center rounded border text-[13px] font-medium transition-all shadow-sm ${isSelected
                                ? 'border-brand bg-brand-light ring-1 ring-brand text-zinc-900'
                                : 'border-[#D5D9D9] bg-white hover:bg-[#F7FAFA] text-zinc-700'
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

              <div className="h-px bg-zinc-100 w-full mb-6" />

              {/* Action Buttons */}
              <div className="space-y-4 mb-6">
                {(() => {
                  const isOwner = user && String(wooId) === String(merchantId);

                  if (isOwner) {
                    return (
                      <div className="space-y-3">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-[12px] text-amber-800 leading-tight flex gap-2">
                          <AlertCircle size={14} className="shrink-0 mt-0.5" />
                          <span><strong>{t("merchantView")}</strong> {t("cannotBuyOwnProducts")}</span>
                        </div>
                        <Link
                          href="/merchant/dashboard/products"
                          className="w-full h-[33px] bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 rounded-full text-[13px] font-bold flex items-center justify-center transition-all"
                        >
                          {t("manageProduct")}
                        </Link>
                      </div>
                    );
                  }

                  if (isVendor || isAdmin) {
                    return (
                      <div className="w-full text-center text-[13px] font-medium text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-md py-2 px-3">
                        خيارات الشراء غير متاحة لحسابات الإدارة والبائعين
                      </div>
                    );
                  }

                  if (outOfStock) {
                    return (
                      <div className="w-full rounded-lg bg-zinc-100 border border-zinc-200 p-3 flex items-center gap-2 text-zinc-500">
                        <AlertCircle size={16} className="text-rose-400" />
                        <span className="text-[13px] font-semibold text-rose-600">{t("outOfStock")}</span>
                        <span className="text-[12px] text-zinc-400 me-1">{t("unavailableForPurchase")}</span>
                      </div>
                    );
                  }

                  if (qtyInCart > 0) {
                    return (
                      <div className="space-y-3">
                        <p className="text-[14px] font-bold text-brand-600 flex items-center gap-2">
                          {/* <ShieldCheck size={16} /> */}
                          {t("productInCart")}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center bg-[#F0F2F2] border border-[#D5D9D9] rounded-lg h-[33px] px-1 shadow-sm">
                            <button onClick={() => updateQuantity(product.id, qtyInCart - 1)} className="w-8 h-full flex items-center justify-center text-zinc-600 hover:text-zinc-900">
                              <Minus size={14} />
                            </button>
                            <span className="w-10 text-center text-[13px] font-bold text-zinc-900">{qtyInCart}</span>
                            <button onClick={() => updateQuantity(product.id, qtyInCart + 1)} className="w-8 h-full flex items-center justify-center text-zinc-600 hover:text-zinc-900">
                              <Plus size={14} />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(product.id)} className="text-[12px] text-brand hover:text-brand-dark hover:underline flex items-center gap-1 font-medium">
                            <Trash2 size={14} /> {t("remove")}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <>
                      <button
                        onClick={() => {
                          const itemToAdd = {
                            ...product,
                            stock_quantity: matchedVariation ? matchedVariation.stock_quantity : product.stock_quantity,
                            manage_stock: matchedVariation ? matchedVariation.manage_stock : product.manage_stock
                          };
                          addToCart(itemToAdd, 1);
                        }}
                        className="w-full h-[33px] bg-brand hover:bg-brand-dark text-white border border-brand rounded-full text-[13px] font-medium shadow-sm transition-all"
                      >
                        {t("addToCart")}
                      </button>
                      <button
                        onClick={handleBuyNow}
                        className="w-full h-[33px] bg-brand-light hover:bg-brand/20 text-brand-dark border border-brand-light rounded-full text-[13px] font-medium shadow-sm transition-all"
                      >
                        {t("buyNow")}
                      </button>
                    </>
                  );
                })()}
              </div>

              <div className="mt-auto pt-4 border-t border-zinc-100 flex justify-between items-center">
                <Link href={getProductUrl(product)} className="text-[13px] text-brand hover:text-brand-dark hover:underline flex items-center gap-1">
                  {t("viewFullDetails")} <ChevronRight size={14} className="rtl:-scale-x-100" />
                </Link>
                <a href={merchantSlug || merchantId ? `/vendor/${merchantSlug || merchantId}` : "/vendors"} className="text-[11px] text-zinc-400 hover:text-brand hover:underline transition-colors">
                  {t("soldBy", { merchantName: merchantName || (typeof t === 'function' ? t('mahallyOfficial', { fallback: "Mahally Official" }) : "Mahally Official") })}
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
