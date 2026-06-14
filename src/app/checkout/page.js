"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocation } from "@/context/LocationContext";
import { JORDAN_GOVERNORATES } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { Lock, ChevronRight, CheckCircle2, ChevronDown, Package, ShieldCheck } from "lucide-react";
import Loader from "@/components/Loader";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user, loading: authLoading, wooId, customerName, email: authEmail, phone: authPhone, address: authAddress, city: authCity, isVendor } = useAuth();
  const { governorate, updateGovernorate } = useLocation();
  const router = useRouter();

  // Redirect to login if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  // Redirect to home if vendor/admin
  useEffect(() => {
    if (isVendor) {
      router.replace("/");
    }
  }, [isVendor, router]);

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
      errors.firstName = "الاسم الأول مطلوب.";
    }
    if (!formData.email?.trim()) {
      errors.email = "البريد الإلكتروني مطلوب.";
    } else if (!/\\S+@\\S+\\.\\S+/.test(formData.email)) {
      errors.email = "يرجى إدخال بريد إلكتروني صحيح.";
    }
    if (!formData.phone?.trim()) {
      errors.phone = "رقم الهاتف مطلوب.";
    }
    if (!formData.address?.trim()) {
      errors.address = "العنوان مطلوب.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError("يرجى إصلاح الأخطاء في نموذج الشحن.");
      return;
    }
    setValidationErrors({});

    if (cart.length === 0) {
      setError("سلة التسوق فارغة.");
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
          shippingFee: shippingFee
        })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error(`خطأ في الخادم (${response.status}). يرجى المحاولة لاحقاً.`);
        }
        throw new Error(errorData.error || "فشل تقديم الطلب.");
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
      setError(err.message || "فشل تقديم الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return <Loader fullPage size="lg" text="جاري التحقق من جلستك..." />;
  }

  if (isVendor) {
    return null; // Prevent flash while redirecting
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center pt-20 px-4">
        <div className="max-w-xl w-full text-center">
          <div className="flex items-center justify-center gap-2 mb-8 text-[#007600]">
            <CheckCircle2 size={32} />
            <h1 className="text-[21px] font-bold">تم تقديم الطلب، شكراً لك!</h1>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-md p-8 text-right mb-8" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="bg-white border border-zinc-200 p-2 rounded">
                <Package size={24} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-zinc-900">رقم الطلب #{orderId}</p>
                <p className="text-[13px] text-zinc-600">جاري معالجة طلبك وسيتم شحنه قريباً.</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="h-[31px] px-8 bg-[#FFD814] hover:bg-[#F7CA00] text-zinc-900 border border-[#FCD200] rounded-md text-[13px] font-medium shadow-sm transition-all"
          >
            متابعة التسوق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3] pb-20">
      {/* Simple Header */}
      <div className="bg-zinc-100 border-b border-zinc-200 h-[60px] flex items-center shadow-sm">
        <div className="container mx-auto px-4 max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-2xl font-black italic tracking-tighter text-zinc-900">محلي</span>
            <span className="text-orange-500 font-bold text-xl">.jo</span>
          </Link>
          <h1 className="text-[28px] font-normal text-zinc-600 hidden md:block">إتمام الطلب</h1>
          <Lock size={20} className="text-zinc-400" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: Step-by-Step Sections */}
          <div className="lg:col-span-8 space-y-4">

            {/* Step 1: Shipping Address */}
            <div className="bg-white border border-zinc-200 rounded-md overflow-hidden" dir="rtl">
              <div className="p-6">
                <div className="flex items-start gap-6">
                  <span className="text-[18px] font-bold text-zinc-900 shrink-0">1</span>
                  <div className="flex-1">
                    <h3 className="text-[18px] font-bold text-zinc-900 mb-4">عنوان الشحن</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <input type="text" name="firstName" placeholder="الاسم الأول *" value={formData.firstName} onChange={handleInputChange} className={`h-[44px] md:h-[31px] px-3 bg-white border ${validationErrors.firstName ? 'border-red-500 focus:border-red-500' : 'border-zinc-300 focus:border-[#e77600]'} rounded-md text-[13px] md:text-[13px] text-[16px] outline-none shadow-inner w-full`} />
                        {validationErrors.firstName && <span className="text-[11px] text-red-600 mt-1 font-medium pl-0.5">{validationErrors.firstName}</span>}
                      </div>
                      <div className="flex flex-col">
                        <input type="text" name="lastName" placeholder="الاسم الأخير" value={formData.lastName} onChange={handleInputChange} className="h-[44px] md:h-[31px] px-3 bg-white border border-zinc-300 rounded-md text-[16px] md:text-[13px] focus:border-[#e77600] outline-none shadow-inner w-full" />
                      </div>
                      <div className="flex flex-col md:col-span-2">
                        <input type="email" name="email" placeholder="البريد الإلكتروني *" value={formData.email} onChange={handleInputChange} className={`h-[44px] md:h-[31px] px-3 bg-white border ${validationErrors.email ? 'border-red-500 focus:border-red-500' : 'border-zinc-300 focus:border-[#e77600]'} rounded-md text-[16px] md:text-[13px] outline-none shadow-inner w-full`} />
                        {validationErrors.email && <span className="text-[11px] text-red-600 mt-1 font-medium pl-0.5">{validationErrors.email}</span>}
                      </div>
                      <div className="flex flex-col md:col-span-2">
                        <input type="tel" name="phone" placeholder="رقم الهاتف (مثال: 079XXXXXXX) *" value={formData.phone} onChange={handleInputChange} dir="ltr" className={`text-right h-[44px] md:h-[31px] px-3 bg-white border ${validationErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-zinc-300 focus:border-[#e77600]'} rounded-md text-[16px] md:text-[13px] outline-none shadow-inner w-full`} />
                        {validationErrors.phone && <span className="text-[11px] text-red-600 mt-1 font-medium pl-0.5">{validationErrors.phone}</span>}
                      </div>
                      <div className="flex flex-col md:col-span-2">
                        <input type="text" name="address" placeholder="اسم الشارع والمنطقة *" value={formData.address} onChange={handleInputChange} className={`h-[44px] md:h-[31px] px-3 bg-white border ${validationErrors.address ? 'border-red-500 focus:border-red-500' : 'border-zinc-300 focus:border-[#e77600]'} rounded-md text-[16px] md:text-[13px] outline-none shadow-inner w-full`} />
                        {validationErrors.address && <span className="text-[11px] text-red-600 mt-1 font-medium pl-0.5">{validationErrors.address}</span>}
                      </div>
                      <div className="flex flex-col">
                        <select name="city" value={city} onChange={handleInputChange} className="h-[44px] md:h-[31px] px-2 bg-white border border-zinc-300 rounded-md text-[16px] md:text-[13px] focus:border-[#e77600] outline-none shadow-sm cursor-pointer w-full">
                          {JORDAN_GOVERNORATES.map(gov => (
                            <option key={gov} value={gov}>{gov}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <input readOnly value="الأردن" className="h-[44px] md:h-[31px] px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[16px] md:text-[13px] text-zinc-500 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white border border-zinc-200 rounded-md overflow-hidden opacity-100 transition-all" dir="rtl">
              <div className="p-6">
                <div className="flex items-start gap-6">
                  <span className="text-[18px] font-bold text-zinc-900 shrink-0">2</span>
                  <div className="flex-1">
                    <h3 className="text-[18px] font-bold text-zinc-900 mb-4">طريقة الدفع</h3>
                    <div className="bg-white border border-[#e77600] bg-[#fcf5ee] rounded-md p-4">
                      <div className="flex items-center gap-3">
                        <input type="radio" checked readOnly className="accent-[#e77600]" />
                        <span className="text-[14px] font-bold text-zinc-900">الدفع عند الاستلام (COD)</span>
                      </div>
                      <p className="text-[12px] text-zinc-600 mr-6 mt-1">ادفع نقداً عند استلام طلبك.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Items Review */}
            <div className="bg-white border border-zinc-200 rounded-md overflow-hidden" dir="rtl">
              <div className="p-6">
                <div className="flex items-start gap-6">
                  <span className="text-[18px] font-bold text-zinc-900 shrink-0">3</span>
                  <div className="flex-1">
                    <h3 className="text-[18px] font-bold text-zinc-900 mb-4">مراجعة المنتجات والشحن</h3>
                    <div className="space-y-4">
                      {(enrichedCartItems.length > 0 ? enrichedCartItems : cart).map((item, i) => (
                        <div key={i} className="flex gap-4 border border-zinc-200 rounded-md p-3">
                          <div className="w-16 h-16 relative bg-white shrink-0 border border-zinc-100 rounded">
                            <Image src={item.image} alt={item.name || "Cart item"} fill className="object-contain" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[13px] font-bold text-zinc-900 line-clamp-1">{item.name}</p>
                            <p className="text-[12px] text-[#007600] font-bold">الكمية: {item.quantity}</p>
                            <p className="text-[12px] font-bold text-[#b12704]" dir="ltr">JOD {parseFloat(item.price).toFixed(2)}</p>
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
                className="w-full h-[44px] bg-[#FFD814] hover:bg-[#F7CA00] text-zinc-900 border border-[#FCD200] rounded-md text-[14px] font-bold shadow-sm transition-all"
              >
                {loading ? "جاري تأكيد الطلب..." : "تأكيد الطلب"}
              </button>
            </div>
          </div>

          {/* RIGHT: Order Summary Sidebar */}
          <div className="lg:col-span-4" dir="rtl">
            <div className="bg-white border border-zinc-200 rounded-md p-5 sticky top-4">
              <button
                onClick={handleSubmit}
                disabled={loading || cart.length === 0}
                className="cursor-pointer w-full h-[29px] bg-[#FFD814] hover:bg-[#F7CA00] text-zinc-900 border border-[#FCD200] rounded-md text-[12px] font-bold shadow-sm transition-all mb-4"
              >
                {loading ? "جاري المعالجة..." : "تأكيد الطلب"}
              </button>

              <p className="text-[11px] text-zinc-500 text-center mb-4 leading-snug">
                بتأكيد طلبك، أنت توافق على <Link href="/conditions" aria-label="conditions" target="_blank" className="text-[#007185] hover:underline cursor-pointer">شروط الاستخدام</Link> الخاصة بمحلي.
              </p>

              <div className="h-px bg-zinc-200 w-full mb-4" />

              <h3 className="text-[14px] font-bold text-zinc-900 mb-4">ملخص الطلب</h3>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-zinc-600 text-[13px]">المنتجات:</span>
                  <span className="text-zinc-900" dir="ltr">JOD {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 text-[13px]">الشحن والتوصيل:</span>
                  <div className="text-left">
                    <span className="text-zinc-900" dir="ltr">
                      {fetchingShipping ? "..." : `JOD ${shippingFee.toFixed(2)}`}
                    </span>
                    {Object.keys(vendorShippingMap).length > 0 && (
                      <div className="text-[10px] text-zinc-500 italic mt-0.5">
                        تم تطبيق أسعار التاجر
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between border-t border-zinc-100 pt-2 text-[11px] text-zinc-500">
                  <span>المجموع قبل الضريبة:</span>
                  <span dir="ltr">JOD {orderTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>الضريبة المقدرة:</span>
                  <span dir="ltr">JOD 0.00</span>
                </div>
              </div>

              <div className="h-px bg-zinc-200 w-full my-4" />

              <div className="flex justify-between text-[#b12704] font-bold text-[18px]">
                <span>المجموع الكلي:</span>
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
