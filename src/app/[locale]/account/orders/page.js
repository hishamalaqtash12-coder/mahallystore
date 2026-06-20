"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Loader2
} from "lucide-react";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import TrackingModal from "@/components/TrackingModal";
import ReviewSubmissionModal from "@/components/ReviewSubmissionModal";
import ReturnRequestModal from "@/components/ReturnRequestModal";
import ConfirmationModal from "@/components/ConfirmationModal";

const STATUS_TABS = {
  "all": null,
  "processing": ["processing", "pending", "pending payment"],
  "on-hold": ["on-hold"],
  "completed": ["completed"],
  "cancelled": ["cancelled", "failed"],
};

import { Suspense } from "react";

function AccountOrdersContent() {
  const { user, loading, wooId, email } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status") || "all";

  // Data State
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewedProducts, setReviewedProducts] = useState(new Set());

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    if (user && (wooId || user.email)) {
      setIsLoadingOrders(true);
      const query = wooId
        ? `customerId=${wooId}`
        : `email=${encodeURIComponent(user.email)}`;

      fetch(`/api/orders?${query}`)
        .then(r => r.json())
        .then(data => { setOrders(Array.isArray(data) ? data : []); })
        .catch(err => console.error("Orders fetch error:", err))
        .finally(() => setIsLoadingOrders(false));

      if (wooId) {
        const userEmail = user.email || email;
        const reviewsUrl = `/api/reviews?user_id=${wooId}${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ''}`;
        fetch(reviewsUrl)
          .then(r => r.json())
          .then(data => {
            if (data.reviews) {
              const ids = new Set(data.reviews.map(r => r.product_id));
              setReviewedProducts(ids);
            }
          })
          .catch(() => { });
      }
    }
  }, [user, loading, wooId, email, router]);

  useEffect(() => {
    const reviewParam = searchParams.get("review");
    const orderIdParam = searchParams.get("id");
    if (reviewParam === "true" && orderIdParam && orders.length > 0) {
      const order = orders.find(o => String(o.id) === String(orderIdParam));
      if (order && order.status === 'completed' && order.meta_data?.some(m => m.key === "mahally_customer_confirmed_receipt" && m.value === "yes")) {
        setSelectedOrder(order);
        setIsReviewOpen(true);
      }
    }
  }, [searchParams, orders]);


  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status Tab
    const targets = STATUS_TABS[activeStatus];
    if (targets) result = result.filter(o => targets.includes(o.status));

    // Search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(o =>
        o.id.toString().includes(q) ||
        (o.line_items || []).some(i => i.name?.toLowerCase().includes(q))
      );
    }

    return result;
  }, [orders, activeStatus, searchQuery]);

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    setIsProcessingAction(selectedOrder.id);
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrder.id, email: user.email })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: "cancelled" } : o));
        setIsCancelOpen(false);
      }
    } catch (e) { }
    finally { setIsProcessingAction(null); }
  };

  const tabs = [
    { id: 'all', label: 'جميع الطلبات' },
    { id: 'processing', label: 'قيد المعالجة' },
    { id: 'on-hold', label: 'قيد الانتظار' },
    { id: 'completed', label: 'مكتملة' },
    { id: 'cancelled', label: 'ملغاة' },
  ];

  if (loading) return null;

  return (
    <div className="w-full">
      {/* Orders Header Tabs */}
      <div className="flex items-center gap-8 mb-6 border-b border-gray-100 pb-0.5 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === 'all' ? '/account/orders' : `/account/orders?status=${tab.id}`}
            className={`pb-3 text-[15px] whitespace-nowrap font-medium relative ${activeStatus === tab.id ? 'text-black' : 'text-gray-500 hover:text-black transition-colors'}`}
          >
            {tab.label}
            {activeStatus === tab.id && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black"></div>}
          </Link>
        ))}

        <div className="ml-auto relative mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="اسم المنتج / رقم الطلب"
            className="w-72 h-9 bg-gray-50 border border-gray-200 rounded-md pl-4 pr-10 text-[13px] outline-none focus:border-[#be374f] focus:bg-white transition-all text-right"
            dir="rtl"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>


      {/* List */}
      {isLoadingOrders ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-100 border-t-[#be374f] rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-md overflow-hidden hover:shadow-sm transition-shadow" dir="rtl">
              <div className="bg-gray-50/50 px-6 py-3 flex items-center justify-between border-b border-gray-50 text-[12px] text-gray-500">
                <div className="flex gap-8">
                  <div>
                    <p className="uppercase tracking-tight mb-0.5">تاريخ الطلب</p>
                    <p className="text-gray-900 font-medium">{new Date(order.date_created).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-tight mb-0.5">المجموع</p>
                    <p className="text-gray-900 font-bold" dir="ltr">JOD {parseFloat(order.total).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-tight mb-0.5">رقم الطلب</p>
                    <p className="text-gray-900 font-medium" dir="ltr">#{order.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }} className="cursor-pointer text-gray-900 hover:text-[#be374f] font-medium flex items-center gap-1">
                    {order.status === 'completed' ? "عرض التفاصيل" : "عرض/تعديل التفاصيل"}
                    <ChevronRight size={12} className="rotate-180" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className={`w-2 h-2 rounded-full ${order.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <span className="text-[15px] font-bold capitalize">{order.status}</span>
                </div>
                <div className="flex gap-6">
                  <div className="flex-1 space-y-6">
                    {(() => {
                      const trackingStep = Number(order.meta_data?.find(m => m.key === 'mahally_tracking_step')?.value || 1);
                      const isDelivered = trackingStep >= 5;

                      // Group items by vendor
                      const itemsByVendor = (order.line_items || []).reduce((acc, item) => {
                        const merchantId = item.meta_data?.find(m => m.key === "merchant_id")?.value || "mahally";
                        const merchantName = item.meta_data?.find(m => m.key === "merchant_name")?.value || "Mahally Official";
                        if (!acc[merchantId]) {
                          acc[merchantId] = { id: merchantId, name: merchantName, items: [] };
                        }
                        acc[merchantId].items.push(item);
                        return acc;
                      }, {});

                      return Object.values(itemsByVendor).map((vendor, vIdx) => (
                        <div key={vIdx} className="space-y-4">
                          {vendor.id !== "mahally" && (
                            <h4 className="text-[13px] font-bold text-zinc-700 flex items-center gap-1.5 border-b border-zinc-100 pb-2">
                              <Package size={14} className="text-zinc-400" />
                              شحنة من {vendor.name}
                            </h4>
                          )}
                          <div className="space-y-4 pl-1">
                            {vendor.items.map((item, idx) => (
                              <div key={idx} className="flex gap-4">
                                <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden border border-gray-50 flex items-center justify-center p-1">
                                  {item.image?.src ? <img src={item.image.src} alt={item.name} className="w-full h-full object-contain" /> : <Package size={24} className="text-gray-200" />}
                                </div>
                                <div className="flex-1">
                                  <Link href={`/product/${item.product_id}`} className="text-[14px] text-gray-800 hover:text-[#be374f] font-medium line-clamp-1 mb-1">{item.name}</Link>
                                  <p className="text-[12px] text-gray-500 mb-2">الكمية: {item.quantity}</p>
                                  <div className="flex items-center gap-3">
                                    <Link href={`/product/${item.product_id}`} className="h-8 px-4 bg-[#be374f] text-white rounded-full text-[12px] font-bold hover:bg-[#8f2d4a] transition-colors flex items-center">شراء مرة أخرى</Link>
                                    {!isDelivered && (
                                      <button onClick={() => { setSelectedOrder(order); setIsTrackingOpen(true); }} className="cursor-pointer h-8 px-4 border border-gray-200 rounded-full text-[12px] font-bold hover:bg-gray-50 transition-colors">تتبع الشحنة</button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  {/* Right action column: only render if there are active actions available */}
                  {(order.status === 'completed' || ["processing", "on-hold", "pending", "pending payment"].includes(order.status)) && (
                    <div className="w-48 border-r border-gray-50 pr-6 space-y-2">
                      {(() => {
                        const hasReviewedItems = (order.line_items || []).some(item => reviewedProducts.has(item.product_id));
                        const canWriteReview = order.status === 'completed' && order.meta_data?.some(m => m.key === "mahally_customer_confirmed_receipt" && m.value === "yes") && !hasReviewedItems;

                        if (hasReviewedItems) {
                          return (
                            <Link href="/account/reviews" className="block w-full py-2 text-center border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-[13px] font-bold hover:bg-emerald-100 transition-colors">
                              مشاهدة تقييمك
                            </Link>
                          );
                        }

                        if (canWriteReview) {
                          return (
                            <button onClick={() => { setSelectedOrder(order); setIsReviewOpen(true); }} className="cursor-pointer w-full py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-[13px] font-bold transition-colors">كتابة تقييم</button>
                          );
                        }

                        return null;
                      })()}
                      {["processing", "on-hold", "pending", "pending payment"].includes(order.status) && (
                        <button
                          onClick={() => { setSelectedOrder(order); setIsCancelOpen(true); }}
                          className="cursor-pointer w-full py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-[13px] font-bold transition-colors"
                        >
                          إلغاء الطلب
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl md:shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center">
          <div className="w-28 h-28 relative flex items-center justify-center mb-8">
            <Package size={64} className="text-gray-100" />
          </div>
          <h2 className="text-[18px] font-bold mb-2">ليس لديك أي طلبات</h2>
          <p className="text-[14px] text-gray-500 mb-12">ابحث أو تصفح للبدء في التسوق!</p>
          <Link href="/browse" className="px-12 py-3 bg-[#be374f] text-white rounded-full font-bold hover:bg-[#8f2d4a] transition-all">
            ابدأ التسوق
          </Link>
        </div>
      )}

      {/* Modals */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        reviewedProducts={[...reviewedProducts]}
      />
      <TrackingModal
        order={selectedOrder}
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
      />
      <ReviewSubmissionModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        order={selectedOrder}
        user={user}
        userId={wooId}
        reviewedProducts={[...reviewedProducts]}
        onReviewSubmitted={(productId) => setReviewedProducts(prev => new Set([...prev, productId]))}
      />
      <ReturnRequestModal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        order={selectedOrder}
        user={user}
        onSubmitted={() => { }}
      />
      <ConfirmationModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancelOrder}
        title="Cancel Order?"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel Order"
        type="danger"
        isLoading={isProcessingAction === selectedOrder?.id}
      />
    </div>
  );
}

export default function AccountOrdersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-24"><Loader2 className="animate-spin text-[#be374f]" size={32} /></div>}>
      <AccountOrdersContent />
    </Suspense>
  );
}
