"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useLocation } from "@/context/LocationContext";
import { JORDAN_GOVERNORATES } from "@/lib/constants";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Lock, ChevronRight, CheckCircle2, ChevronDown, Package, ShieldCheck } from "lucide-react";
import Loader from "@/components/Loader";

export default function CheckoutPage() {
  const t = useTranslations("Checkout");
  const tGov = useTranslations("Governorates");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const { cart, clearCart } = useCart();
  const { user, loading: authLoading, wooId, customerName, email: authEmail, phone: authPhone, address: authAddress, city: authCity, isVendor, isAdmin } = useAuth();
  const { governorate, updateGovernorate } = useLocation();
  const router = useRouter();

  // Redirect to login if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/checkout");
    } else if (!authLoading && user && isAdmin) {
      // Admins cannot shop
      router.replace("/admin");
    }
  }, [user, authLoading, isAdmin, router]);

  // Redirect to home if vendor/admin (except for allowed admin email)
  // Vendor restriction removed

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    country: "Jordan"
  });

  // CRITICAL: city as its own state so calculation effect re-triggers reliably
  const [city, setCity] = useState(governorate || "Amman");

  const [vendorShippingMap, setVendorShippingMap] = useState({});
  const [fetchingShipping, setFetchingShipping] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [enrichedCartItems, setEnrichedCartItems] = useState([]);

  useEffect(() => {
    setEnrichedCartItems(cart);
  }, [cart]);

  // Auto-fill form from user profile
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: authEmail || user.email || prev.email,
        firstName: customerName ? customerName.split(' ')[0] : prev.firstName,
        lastName: customerName ? customerName.split(' ').slice(1).join(' ') : prev.lastName,
        phone: authPhone || prev.phone,
        address: authAddress || prev.address
      }));
      if (authCity && !governorate) {
        setCity(authCity);
      }
    }
  }, [user, customerName, authEmail, authPhone, authAddress, authCity, governorate]);

  useEffect(() => {
    if (governorate) setCity(governorate);
  }, [governorate]);

  // Fetch live WooCommerce product details and merchant shipping data
  useEffect(() => {
    const fetchLiveDetailsAndShipping = async () => {
      if (cart.length === 0) return;

      setFetchingShipping(true);
      try {
        const uniqueProductIds = [...new Set(cart.map(item => item.id))];

        // Fetch all product details in parallel
        const fetchedProducts = await Promise.all(
          uniqueProductIds.map(async (productId) => {
            try {
              const res = await fetch(`/api/products/${productId}`);
              if (res.ok) return await res.json();
            } catch (e) {
              console.warn(`Error fetching checkout details for product ${productId}:`, e);
            }
            return null;
          })
        );

        const productsMap = {};
        fetchedProducts.filter(Boolean).forEach(p => {
          productsMap[p.id] = p;
        });

        // Enrich cart items with live name, price, image, and vendorId
        const enrichedCart = cart.map(item => {
          const liveProduct = productsMap[item.id];
          if (!liveProduct) return item;

          let livePrice = liveProduct.price;
          let liveImage = liveProduct.images?.[0]?.src || item.image;
          let liveName = liveProduct.name;

          if (item.variation_id && liveProduct.variations_data) {
            const variation = liveProduct.variations_data.find(v => String(v.id) === String(item.variation_id));
            if (variation) {
              livePrice = variation.price || livePrice;
              if (variation.image?.src) {
                liveImage = variation.image.src;
              }
            }
          }

          const vendorId = liveProduct.vendorId
            || liveProduct.meta_data?.find(m => m.key === "_vendor_id" || m.key === "mahally_owner_id")?.value
            || String(liveProduct.author || "");

          return {
            ...item,
            name: liveName,
            price: livePrice || item.price,
            image: liveImage,
            vendorId: vendorId || item.vendorId
          };
        });

        setEnrichedCartItems(enrichedCart);

        // Fetch shipping settings for unique vendor IDs
        const vendorIds = [...new Set(enrichedCart.map(item => item.vendorId).filter(Boolean))];
        if (vendorIds.length > 0) {
          const newMap = {};
          await Promise.all(vendorIds.map(async (vid) => {
            try {
              const res = await fetch(`/api/merchant/shipping?vendorId=${vid}`, { cache: 'no-store' });
              if (res.ok) {
                const data = await res.json();
                if (data.shippingData) {
                  newMap[vid] = data.shippingData;
                }
              }
            } catch (e) {
              console.warn(`Failed to fetch shipping fee for vendor ${vid}:`, e);
            }
          }));
          setVendorShippingMap(newMap);
        }
      } catch (err) {
        console.error("Failed to execute live checkout enrichment:", err);
        setEnrichedCartItems(cart);
      } finally {
        setFetchingShipping(false);
      }
    };

    fetchLiveDetailsAndShipping();
  }, [cart]);

  // Calculate shipping fee — useMemo guarantees re-run on city/cart/vendor changes
  const shippingFee = useMemo(() => {
    let totalShipping = 0;
    const vendorTotals = {};

    // Group cart items by vendor
    const itemsToCalculate = enrichedCartItems.length > 0 ? enrichedCartItems : cart;

    itemsToCalculate.forEach(item => {
      const vid = item.vendorId || "default";
      const itemSubtotal = parseFloat(item.price || 0) * item.quantity;
      vendorTotals[vid] = (vendorTotals[vid] || 0) + itemSubtotal;
    });

    Object.keys(vendorTotals).forEach(vid => {
      const vendorSettings = vendorShippingMap[vid];
      const settings = vendorSettings?.[city] || { fee: 2, free_over: null };
      const subtotal = vendorTotals[vid];
      const isFree = settings.free_over && subtotal >= settings.free_over;
      totalShipping += isFree ? 0 : (parseFloat(settings.fee) || 0);
    });

    return totalShipping;
  }, [cart, enrichedCartItems, city, vendorShippingMap]);

  const cartTotal = (enrichedCartItems.length > 0 ? enrichedCartItems : cart).reduce((total, item) => total + parseFloat(item.price || 0) * item.quantity, 0);
  const orderTotal = cartTotal + shippingFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "city") {
      setCity(value);
      updateGovernorate(value);
    }
    // Clear validation error when field is updated
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Field-level Validation
    const errors = {};
    if (!formData.firstName?.trim()) {
      errors.firstName = t("errFirstNameRequired");
    }
    if (!formData.email?.trim()) {
      errors.email = t("errEmailRequired");
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = t("errEmailInvalid");
    }
    if (!formData.phone?.trim()) {
      errors.phone = t("errPhoneRequired");
    }
    if (!formData.address?.trim()) {
      errors.address = t("errAddressRequired");
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError(t("errFormFix"));
      return;
    }
    setValidationErrors({});

    if (cart.length === 0) {
      setError(t("errCartEmpty"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: enrichedCartItems,
          customer: { ...formData, city },   // Merge city state into customer
          customerId: wooId,
          shippingFee: shippingFee,
          locale: locale
        })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error(t("errServer", { status: response.status }));
        }
        throw new Error(errorData.error || t("errOrderFailed"));
      }

      const data = await response.json();
      setOrderId(data.orderId);
      setSuccess(true);
      clearCart();
      // Redirect to the order's unique URL after a short delay
      setTimeout(() => {
        router.push(`/account/orders?order=${data.orderId}`);
      }, 2500);
    } catch (err) {
      setError(err.message || t("errOrderFailedTryAgain"));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return <Loader fullPage size="lg" text={t("loadingSession")} />;
  }

  // Vendor flash prevention removed

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center pt-20 px-4">
        <div className="max-w-xl w-full text-center">
          <div className="flex items-center justify-center gap-2 mb-8 text-[#007600]">
            <CheckCircle2 size={32} />
            <h1 className="text-[21px] font-bold">{t("orderSuccessTitle")}</h1>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-md p-8 text-start mb-8" dir={dir}>
            <div className="flex items-start gap-4">
              <div className="bg-white border border-zinc-200 p-2 rounded">
                <Package size={24} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-zinc-900">{t("orderNumber", { orderId })}</p>
                <p className="text-[13px] text-zinc-600">{t("orderProcessing")}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="h-[31px] px-8 bg-brand hover:bg-brand-dark text-white border-brand rounded-md text-[13px] font-medium shadow-sm transition-all"
          >
            {t("continueShopping")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3] pb-20">
      {/* Simple Header */}
      <header className="bg-white border-b border-zinc-200 h-[64px] flex items-center shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 max-w-5xl flex items-center justify-between">
          {/* Logo — always LTR, never translated */}
          <Link href="/" className="flex items-center gap-1.5 shrink-0" dir="ltr">
            <span className="text-2xl font-black italic tracking-tighter text-zinc-900">
              Mahally
            </span>
            <span className="text-brand font-bold text-xl">.jo</span>
          </Link>

          {/* Page context, separated with a divider for clearer hierarchy */}
          <div className="hidden md:flex items-center gap-3">
            <div className="h-5 w-px bg-zinc-200" />
            <h1 className="text-[18px] font-medium text-zinc-600">
              {t("checkoutTitle")}
            </h1>
          </div>

          {/* Trust signal — icon + label reads more professional than a bare lock */}
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Lock size={16} className="text-zinc-400 shrink-0" />
            <span className="hidden sm:inline text-[12px] font-medium tracking-wide">
              {t("secureCheckout")}
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: Step-by-Step Sections */}
          <div className="lg:col-span-8 space-y-4">

            {/* Step 1: Shipping Address */}
            <div className="bg-white border border-zinc-200 rounded-md overflow-hidden" dir={dir}>
              <div className="p-6">
                <div className="flex items-start gap-6">
                  <span className="text-[18px] font-bold text-zinc-900 shrink-0">1</span>
                  <div className="flex-1">
                    <h3 className="text-[18px] font-bold text-zinc-900 mb-4">{t("shippingAddress")}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label htmlFor="firstName" className="text-[12px] font-medium text-zinc-600 mb-1">{t("labelFirstName")}</label>
                        <input id="firstName" type="text" name="firstName" placeholder={t("firstNamePlaceholder")} value={formData.firstName} onChange={handleInputChange} className={`h-[44px] md:h-[31px] px-3 bg-white border ${validationErrors.firstName ? 'border-red-500 focus:border-red-500' : 'border-zinc-300 focus:border-brand'} rounded-md text-[13px] md:text-[13px] text-[16px] outline-none shadow-inner w-full`} />
                        {validationErrors.firstName && <span className="text-[11px] text-red-600 mt-1 font-medium pe-0.5">{validationErrors.firstName}</span>}
                      </div>

                      <div className="flex flex-col">
                        <label htmlFor="lastName" className="text-[12px] font-medium text-zinc-600 mb-1">{t("labelLastName")}</label>
                        <input id="lastName" type="text" name="lastName" placeholder={t("lastNamePlaceholder")} value={formData.lastName} onChange={handleInputChange} className="h-[44px] md:h-[31px] px-3 bg-white border border-zinc-300 rounded-md text-[16px] md:text-[13px] focus:border-brand outline-none shadow-inner w-full" />
                      </div>

                      <div className="flex flex-col md:col-span-2">
                        <label htmlFor="email" className="text-[12px] font-medium text-zinc-600 mb-1">{t("labelEmail")}</label>
                        <input id="email" type="email" name="email" placeholder={t("emailPlaceholder")} value={formData.email} onChange={handleInputChange} dir="ltr" className={`text-start h-[44px] md:h-[31px] px-3 bg-white border ${validationErrors.email ? 'border-red-500 focus:border-red-500' : 'border-zinc-300 focus:border-brand'} rounded-md text-[16px] md:text-[13px] outline-none shadow-inner w-full`} />
                        {validationErrors.email && <span className="text-[11px] text-red-600 mt-1 font-medium pe-0.5">{validationErrors.email}</span>}
                      </div>

                      <div className="flex flex-col md:col-span-2">
                        <label htmlFor="phone" className="text-[12px] font-medium text-zinc-600 mb-1">{t("labelPhone")}</label>
                        <input id="phone" type="tel" name="phone" placeholder={t("phonePlaceholder")} value={formData.phone} onChange={handleInputChange} dir="ltr" className={`text-start h-[44px] md:h-[31px] px-3 bg-white border ${validationErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-zinc-300 focus:border-brand'} rounded-md text-[16px] md:text-[13px] outline-none shadow-inner w-full`} />
                        {validationErrors.phone && <span className="text-[11px] text-red-600 mt-1 font-medium pe-0.5">{validationErrors.phone}</span>}
                      </div>

                      <div className="flex flex-col md:col-span-2">
                        <label htmlFor="address" className="text-[12px] font-medium text-zinc-600 mb-1">{t("labelAddress")}</label>
                        <input id="address" type="text" name="address" placeholder={t("addressPlaceholder")} value={formData.address} onChange={handleInputChange} className={`h-[44px] md:h-[31px] px-3 bg-white border ${validationErrors.address ? 'border-red-500 focus:border-red-500' : 'border-zinc-300 focus:border-brand'} rounded-md text-[16px] md:text-[13px] outline-none shadow-inner w-full`} />
                        {validationErrors.address && <span className="text-[11px] text-red-600 mt-1 font-medium pe-0.5">{validationErrors.address}</span>}
                      </div>

                      {/* Country first in DOM: renders on the LEFT in LTR (English), RIGHT in RTL (Arabic) */}
                      <div className="flex flex-col">
                        <label htmlFor="country" className="text-[12px] font-medium text-zinc-600 mb-1">{t("labelCountry")}</label>
                        <input id="country" readOnly value={t("countryJordan")} className="h-[44px] md:h-[31px] px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[16px] md:text-[13px] text-zinc-500 w-full" />
                      </div>

                      {/* City second in DOM: renders on the RIGHT in LTR (English), LEFT in RTL (Arabic) */}
                      <div className="flex flex-col">
                        <label htmlFor="city" className="text-[12px] font-medium text-zinc-600 mb-1">{t("labelCity")}</label>
                        <select id="city" name="city" value={city} onChange={handleInputChange} className="h-[44px] md:h-[31px] px-2 bg-white border border-zinc-300 rounded-md text-[16px] md:text-[13px] focus:border-brand outline-none shadow-sm cursor-pointer w-full">
                          {JORDAN_GOVERNORATES.map(gov => (
                            <option key={gov} value={gov}>{tGov(gov)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white border border-zinc-200 rounded-md overflow-hidden opacity-100 transition-all" dir={dir}>
              <div className="p-6">
                <div className="flex items-start gap-6">
                  <span className="text-[18px] font-bold text-zinc-900 shrink-0">2</span>
                  <div className="flex-1">
                    <h3 className="text-[18px] font-bold text-zinc-900 mb-4">{t("paymentMethod")}</h3>
                    <div className="bg-white border border-brand bg-brand-light rounded-md p-4">
                      <div className="flex items-center gap-3">
                        <input type="radio" checked readOnly className="accent-brand" />
                        <span className="text-[14px] font-bold text-zinc-900">{t("cashOnDelivery")}</span>
                      </div>
                      <p className="text-[12px] text-zinc-600 ms-6 mt-1">{t("payCashOnDelivery")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Items Review */}
            <div className="bg-white border border-zinc-200 rounded-md overflow-hidden" dir={dir}>
              <div className="p-6">
                <div className="flex items-start gap-6">
                  <span className="text-[18px] font-bold text-zinc-900 shrink-0">3</span>
                  <div className="flex-1">
                    <h3 className="text-[18px] font-bold text-zinc-900 mb-4">{t("reviewItems")}</h3>
                    <div className="space-y-4">
                      {(enrichedCartItems.length > 0 ? enrichedCartItems : cart).map((item, i) => (
                        <div key={i} className="flex gap-4 border border-zinc-200 rounded-md p-3">
                          <div className="w-16 h-16 relative bg-white shrink-0 border border-zinc-100 rounded">
                            <Image src={item.image} alt={item.name || "Cart item"} fill className="object-contain" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[13px] font-bold text-zinc-900 line-clamp-1">{item.name}</p>
                            <p className="text-[12px] text-[#007600] font-bold">{t("qty", { quantity: item.quantity })}</p>
                            <p className="text-[12px] font-bold text-brand" dir="ltr">JOD {parseFloat(item.price).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Place Order Bottom (Mobile only) */}
            <div className="lg:hidden p-4">
              <button
                onClick={handleSubmit}
                disabled={loading || cart.length === 0}
                className="w-full h-[44px] bg-brand hover:bg-brand-dark text-white border border-brand rounded-md text-[14px] font-bold shadow-sm transition-all"
              >
                {loading ? t("confirmingOrder") : t("confirmOrder")}
              </button>
            </div>
          </div>

          {/* RIGHT: Order Summary Sidebar */}
          <div className="lg:col-span-4" dir={dir}>
            <div className="bg-white border border-zinc-200 rounded-md p-5 sticky top-4">
              <button
                onClick={handleSubmit}
                disabled={loading || cart.length === 0}
                className="cursor-pointer w-full h-[29px] bg-brand hover:bg-brand-dark text-white border border-brand rounded-md text-[12px] font-bold shadow-sm transition-all mb-4"
              >
                {loading ? t("processing") : t("confirmOrder")}
              </button>

              <p className="text-[11px] text-zinc-500 text-center mb-4 leading-snug">
                {t("agreeToConditions")} <Link href="/conditions" aria-label="conditions" target="_blank" className="text-brand hover:underline cursor-pointer">{t("termsOfUse")}</Link> {t("termsSuffix")}
              </p>

              <div className="h-px bg-zinc-200 w-full mb-4" />

              <h3 className="text-[14px] font-bold text-zinc-900 mb-4">{t("orderSummary")}</h3>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-zinc-600 text-[13px]">{t("items")}</span>
                  <span className="text-zinc-900" dir="ltr">JOD {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 text-[13px]">{t("shippingAndHandling")}</span>
                  <div className="text-end">
                    <span className="text-zinc-900" dir="ltr">
                      {fetchingShipping ? "..." : `JOD ${shippingFee.toFixed(2)}`}
                    </span>
                    {Object.keys(vendorShippingMap).length > 0 && (
                      <div className="text-[10px] text-zinc-500 italic mt-0.5">
                        {t("vendorRatesApplied")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between border-t border-zinc-100 pt-2 text-[11px] text-zinc-500">
                  <span>{t("totalBeforeTax")}</span>
                  <span dir="ltr">JOD {orderTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>{t("estimatedTax")}</span>
                  <span dir="ltr">JOD 0.00</span>
                </div>
              </div>

              <div className="h-px bg-zinc-200 w-full my-4" />

              <div className="flex justify-between text-brand font-bold text-[18px]">
                <span>{t("orderTotal")}</span>
                <span dir="ltr">JOD {orderTotal.toFixed(2)}</span>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-700 font-bold">
                  {error}
                </div>
              )}
            </div>

            {/* <div className="mt-4 p-4 bg-zinc-100 border border-zinc-200 rounded-md flex items-center gap-3">
              <ShieldCheck size={20} className="text-zinc-400" />
              <p className="text-[11px] text-zinc-600 leading-snug">
                <span className="font-bold">Safe and Secure Checkout.</span> All transactions are encrypted for your protection.
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}