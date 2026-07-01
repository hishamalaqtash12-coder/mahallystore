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
  ChevronRight, 
  ShoppingCart,
  Heart,
  Info,
  Clock,
  ArrowLeft
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user, isVendor } = useAuth();
  const router = useRouter();
  const [explorePicks, setExplorePicks] = useState([]);
  const [isLoadingPicks, setIsLoadingPicks] = useState(true);

  // Vendor restriction removed

  // Live WooCommerce Data States
  const [liveProductsMap, setLiveProductsMap] = useState({});
  const [isLiveLoading, setIsLiveLoading] = useState(true);

  // Track unique product IDs in cart
  const uniqueIdsString = useMemo(() => {
    return Array.from(new Set(cart.map(item => item.id))).sort().join(",");
  }, [cart]);

  // Fetch live up-to-date prices and stock status from WooCommerce REST API
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
        fetched.filter(Boolean).forEach(p => {
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

  // Compute enriched cart with live WooCommerce prices and stock data
  const enrichedCart = useMemo(() => {
    return cart.map(item => {
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
        const variation = liveProduct.variations_data.find(v => String(v.id) === String(item.variation_id));
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

  // Checkout Calculations based on enriched live prices
  const MIN_CHECKOUT_AMOUNT = 10;
  const subtotal = enrichedCart.reduce((total, item) => total + parseFloat(item.price || 0) * item.quantity, 0);
  const remainingForMin = Math.max(0, MIN_CHECKOUT_AMOUNT - subtotal);
  const canCheckout = subtotal >= MIN_CHECKOUT_AMOUNT;

  useEffect(() => {
    // Fetch Explore Picks (Trending items)
    fetch('/api/products?per_page=12')
      .then(res => res.json())
      .then(data => {
        if (data.products) setExplorePicks(data.products);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoadingPicks(false));
  }, []);

  // Vendor flash prevention removed

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 w-full">
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg">
          <div className="relative mb-8">
             <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center">
                <ShoppingCart size={64} className="text-gray-200" />
             </div>
             <div className="absolute -bottom-2 -start-2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-100">
                <Heart size={24} className="text-[#be374f]" />
             </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">سلة التسوق فارغة</h2>
          <p className="text-gray-500 mb-8 font-medium">أضف منتجاتك المفضلة إليها.</p>
          <Link 
            href="/" 
            className="px-16 py-3 bg-[#be374f] text-white rounded-full font-bold text-[16px] hover:bg-[#8f2d4a] transition-all shadow-xl shadow-[#be374f]/15"
          >
            تصفح المنتجات الرائجة
          </Link>
        </div>

        {/* Explore Picks Section */}
        <div className="mt-20">
           <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
              اختيارات محلي لك
              <div className="h-[1px] flex-1 bg-gray-100" />
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {isLoadingPicks ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-50 rounded-lg animate-pulse" />
                ))
              ) : (
                explorePicks.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f7f7] min-h-screen">
      {/* Temu Style Top Trust Banner */}
      <div className="bg-white border-b border-gray-100 py-3">
         <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-600">
                  <Truck size={16} />
                  <span>شحن مجاني</span>
               </div>
               <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600">
                  <ShieldCheck size={16} />
                  <span>إرجاع مجاني</span>
               </div>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-bold text-[#be374f]">
               <Lock size={14} />
               <span>جميع البيانات محمية</span>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Cart Content */}
          <div className="flex-1 space-y-4">
            {/* Free Shipping Notice */}
            <div className="bg-[#fff9f5] border border-[#ffe0cc] rounded-lg p-4 flex items-center gap-3">
               <div className="w-10 h-10 bg-[#be374f]/10 rounded-full flex items-center justify-center text-[#be374f] shrink-0">
                  <Truck size={20} />
               </div>
               <p className="text-[14px] font-bold text-[#be374f]">شحن مجاني (باستثناء المنتجات المشحونة من البائعين)</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <h1 className="text-xl font-black text-gray-900 tracking-tight">السلة ({enrichedCart.length})</h1>
                  <button onClick={clearCart} className="text-[12px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest">حذف الكل</button>
               </div>

               <div className="divide-y divide-gray-50">
                  {isLiveLoading ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                       <div className="w-8 h-8 border-4 border-zinc-200 border-t-[#be374f] rounded-full animate-spin" />
                       <p className="text-[13px] text-gray-500 font-bold animate-pulse">جارٍ مزامنة الأسعار والمخزون...</p>
                    </div>
                  ) : (
                    enrichedCart.map((item) => (
                      <div key={`${item.id}-${item.variation_id || '0'}`} className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-gray-50/30 transition-all">
                         {/* Product Image */}
                         <div className="relative w-full sm:w-32 h-40 sm:h-32 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 group shrink-0">
                            <Image src={item.image || "https://placehold.co/200"} alt={item.name} fill className="object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                         </div>

                         {/* Product Info */}
                         <div className="flex-1 flex flex-col justify-between">
                            <div>
                               <div className="flex items-start justify-between gap-4 mb-1">
                                  <h3 className="text-[15px] font-bold text-gray-900 hover:text-[#be374f] cursor-pointer line-clamp-2 leading-snug">{item.name}</h3>
                                  <button onClick={() => removeFromCart(item.id, item.variation_id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                     <Trash2 size={18} />
                                  </button>
                               </div>
                               {item.variation_name && (
                                  <p className="text-[12px] text-gray-500 font-medium mb-2">{item.variation_name}</p>
                               )}
                               <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[18px] font-black text-gray-900">د.أ {parseFloat(item.price || 0).toFixed(2)}</span>
                                  {item.regular_price && parseFloat(item.regular_price) > parseFloat(item.price) && (
                                    <span className="text-[13px] text-gray-400 line-through">د.أ {parseFloat(item.regular_price).toFixed(2)}</span>
                                  )}
                               </div>
                            </div>

                            <div className="flex items-center justify-between mt-6">
                               <div className="flex items-center gap-4">
                                  <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-200">
                                     <button 
                                       onClick={() => updateQuantity(item.id, item.quantity - 1, item.variation_id)}
                                       className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-all text-gray-600 disabled:opacity-20"
                                       disabled={item.quantity <= 1}
                                     >
                                        <Minus size={14} strokeWidth={3} />
                                     </button>
                                     <span className="w-10 text-center text-[14px] font-black text-gray-900">{item.quantity}</span>
                                     <button 
                                       onClick={() => updateQuantity(item.id, item.quantity + 1, item.variation_id)}
                                       className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-all text-gray-600"
                                       disabled={item.manage_stock && item.stock_quantity !== null && item.quantity >= item.stock_quantity}
                                     >
                                        <Plus size={14} strokeWidth={3} />
                                     </button>
                                  </div>
                                  {item.manage_stock && item.stock_quantity !== null && item.quantity >= item.stock_quantity && (
                                     <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">وصلت لأقصى كمية</span>
                                  )}
                               </div>
                               
                               <div className="flex items-center gap-2 text-[12px] font-medium">
                                  {item.stock_status === "outofstock" || (item.manage_stock && item.stock_quantity === 0) ? (
                                     <span className="text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded uppercase tracking-wider text-[10px]">نفدت الكمية</span>
                                  ) : item.manage_stock && item.stock_quantity !== null && item.stock_quantity <= 5 ? (
                                     <span className="text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded uppercase tracking-wider text-[10px] flex items-center gap-1">
                                        <Clock size={11} /> كمية محدودة - بقي {item.stock_quantity} فقط!
                                     </span>
                                  ) : (
                                     <span className="text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded uppercase tracking-wider text-[10px]">متوفر</span>
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

          {/* Sidebar Summary */}
          <div className="w-full lg:w-[380px] space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-8 sticky top-24">
               <h2 className="text-xl font-black text-gray-900 mb-8">ملخص الطلب</h2>
               
               <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between text-[15px] font-medium text-gray-600">
                     <span>المجموع الفرعي ({enrichedCart.length})</span>
                     <span className="font-bold text-gray-900">د.أ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[15px] font-medium text-gray-600">
                     <span>الشحن</span>
                     <span className="text-emerald-600 font-bold">مجاني</span>
                  </div>
                  <div className="h-[1px] bg-gray-50 my-2" />
                  <div className="flex items-center justify-between">
                     <span className="text-[18px] font-black text-gray-900">الإجمالي</span>
                     <span className="text-[24px] font-black text-[#be374f]">د.أ {subtotal.toFixed(2)}</span>
                  </div>
                  <p className="text-[12px] text-gray-400 font-medium text-center">يُرجى الرجوع إلى المبلغ الفعلي النهائي.</p>
               </div>

               <div className="space-y-4">
                  {remainingForMin > 0 && (
                    <div className="bg-brand-light p-4 rounded-lg border border-orange-100 flex items-start gap-3">
                       <Info size={18} className="text-[#be374f] shrink-0 mt-0.5" />
                       <p className="text-[13px] text-orange-800 font-medium">
                          أضف <span className="font-bold">د.أ {remainingForMin.toFixed(2)}</span> إضافية للوصول للحد الأدنى للشراء.
                       </p>
                    </div>
                  )}

                  <Link 
                    href={canCheckout ? "/checkout" : "#"}
                    className={`flex items-center justify-center w-full h-14 rounded-full font-black text-[18px] shadow-lg transition-all ${canCheckout ? 'bg-[#be374f] text-white hover:bg-[#8f2d4a] shadow-[#be374f]/15' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                  >
                    {canCheckout ? "الدفع والتسوية" : `أدنى ${MIN_CHECKOUT_AMOUNT} د.أ للشراء`}
                  </Link>

                  <div className="flex flex-col gap-3 mt-8">
                     <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        <Lock size={14} className="text-emerald-500" />
                        دفع آمن ومحمي
                     </div>
                     <p className="text-[11px] text-gray-400 font-medium text-center leading-relaxed">
                        لن يتم الخصم حتى تراجع طلبك في الصفحة التالية.
                     </p>
                  </div>
               </div>
            </div>

            {/* Side Help Banner */}
            <div className="bg-emerald-600 rounded-xl p-6 text-white overflow-hidden relative group cursor-pointer">
               <div className="relative z-10">
                  <h4 className="font-black text-[16px] mb-1">حمّل التطبيق</h4>
                  <p className="text-[13px] text-emerald-100 font-medium">احصل على باقة كوبونات بقيمة 40 د.أ!</p>
               </div>
               <div className="absolute top-1/2 -start-4 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition-opacity">
                  <ShoppingCart size={80} strokeWidth={3} />
               </div>
            </div>
          </div>

        </div>

        {/* Bottom Explore Picks */}
        <div className="mt-20">
           <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
              موصى به لك
              <div className="h-[1px] flex-1 bg-gray-100" />
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {isLoadingPicks ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-50 rounded-lg animate-pulse" />
                ))
              ) : (
                explorePicks.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
