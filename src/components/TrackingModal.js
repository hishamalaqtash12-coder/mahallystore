"use client";

import { X, MapPin, Package, CheckCircle2, Clock, Truck, ShoppingBag, Phone, Mail, Store, CreditCard } from "lucide-react";
import { Link } from "@/i18n/routing";

// ─── Status Config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  cancelled:          { step: 0, label: "ملغى",         color: "rose",    headline: "تم إلغاء الطلب",        sub: "تم إلغاء هذا الطلب." },
  refunded:           { step: 0, label: "مسترجع",          color: "rose",    headline: "تم استرجاع الطلب",         sub: "تم إصدار استرداد لهذا الطلب." },
};

const TRACKING_CONTENT = {
  1: { label: "مؤكد", color: "amber",   headline: "تم تأكيد الطلب",      sub: "تم استلام طلبك وتأكيده." },
  2: { label: "معالجة",color: "amber",   headline: "جاري تجهيز الطلب", sub: "جاري تغليف طلبك وسيتم شحنه قريباً." },
  3: { label: "جاهز",     color: "blue",    headline: "جاهز للشحن",        sub: "تم تغليف طلبك وبانتظار شركة الشحن." },
  4: { label: "في الطريق",       color: "blue",    headline: "في الطريق للتسليم",     sub: "شحنتك في طريقها إليك." },
  5: { label: "تم التسليم", color: "emerald", headline: "تم التسليم!",           sub: "تم تسليم شحنتك بنجاح." },
};

const STEPS = [
  { id: 1, icon: ShoppingBag,  label: "مؤكد" },
  { id: 2, icon: Package,      label: "معالجة" },
  { id: 3, icon: Store,        label: "جاهز" },
  { id: 4, icon: Truck,        label: "في الطريق" },
  { id: 5, icon: CheckCircle2, label: "تم التسليم" },
];

const COLOR = {
  amber:   { dot: "bg-amber-400",   bar: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",  ring: "ring-amber-100",  badge: "bg-amber-400 text-white" },
  blue:    { dot: "bg-blue-500",    bar: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",   ring: "ring-blue-100",   badge: "bg-blue-500 text-white" },
  emerald: { dot: "bg-emerald-500", bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", ring: "ring-emerald-100",badge: "bg-emerald-500 text-white" },
  rose:    { dot: "bg-rose-500",    bar: "bg-rose-500",    text: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",   ring: "ring-rose-100",   badge: "bg-rose-500 text-white" },
};

function getMeta(item, key) {
  return item?.meta_data?.find(m => m.key === key)?.value || null;
}

export default function TrackingModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  let cfg;
  let step = 0;

  if (order.status === "cancelled" || order.status === "refunded") {
    cfg = STATUS_CONFIG[order.status];
  } else {
    const metaStep = order.meta_data?.find(m => m.key === 'mahally_tracking_step')?.value || '1';
    step = parseInt(metaStep, 10);
    cfg = TRACKING_CONTENT[step] || TRACKING_CONTENT[1];
  }

  const col  = COLOR[cfg.color];
  const isCOD = order.payment_method === "cod";

  const progressPercent = step <= 1 ? 0 : ((step - 1) / (STEPS.length - 1)) * 100;

  const date = new Date(order.date_created).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const totalItems = (order.line_items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-900/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#f8f9fa] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-zinc-100 flex items-center justify-between shrink-0" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center">
              <Package size={20} className="text-zinc-600" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-zinc-900">تتبع الشحنة</h2>
              <p className="text-[12px] text-zinc-500">طلب #{order.id} · {totalItems} {totalItems === 1 ? "منتج" : "منتجات"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-all border border-zinc-200">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6" dir="rtl">

          {/* Status Hero */}
          <div className={`p-5 rounded-xl border ${col.border} ${col.bg} relative overflow-hidden`}>
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${col.dot} ${step > 0 && step < 3 ? "animate-pulse" : ""}`} />
                  <p className={`text-[11px] font-bold uppercase tracking-widest ${col.text}`}>الحالة الحالية</p>
                </div>
                <h3 className="text-[22px] font-black text-zinc-900 leading-tight">{cfg.headline}</h3>
                <p className="text-[13px] text-zinc-600 mt-1.5 max-w-xs">{cfg.sub}</p>
                {isCOD && order.status === "on-hold" && (
                  <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                    <CreditCard size={11} /> الدفع عند الاستلام
                  </span>
                )}
              </div>
              <span className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${col.badge}`}>
                {cfg.label}
              </span>
            </div>
            {/* Decorative bg icon */}
            <div className="absolute -start-4 -bottom-6 opacity-[0.04] pointer-events-none">
              {step === 3 ? <CheckCircle2 size={120} /> : <Truck size={120} />}
            </div>
          </div>

          {/* Progress Steps */}
          {step > 0 && (
            <div className="bg-white rounded-xl border border-zinc-100 p-6 shadow-sm">
              <div className="relative px-4">
                {/* Track line */}
                <div className="absolute top-6 end-12 start-12 h-[3px] bg-zinc-100 rounded-full overflow-hidden">
                  <div className={`h-full ${col.bar} transition-all duration-1000`} style={{ width: `${progressPercent}%` }} />
                </div>
                {/* Steps */}
                <div className="relative flex justify-between">
                  {STEPS.map(s => {
                    const isDone    = step >= s.id;
                    const isCurrent = step === s.id;
                    return (
                      <div key={s.id} className="flex flex-col items-center">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center relative z-10 border-4 border-white transition-all duration-500
                          ${isDone ? `${col.dot} shadow-lg` : "bg-zinc-100"}
                          ${isCurrent ? "scale-110" : ""}`}
                        >
                          <s.icon size={16} className={`md:w-[18px] md:h-[18px] ${isDone ? "text-white" : "text-zinc-400"}`} />
                        </div>
                        <div className="mt-2 md:mt-3 text-center">
                          <p className={`text-[10px] md:text-[12px] font-bold ${isDone ? "text-zinc-900" : "text-zinc-400"}`}>{s.label}</p>
                          {isCurrent && <p className="text-[9px] md:text-[10px] text-zinc-400">قيد التقدم</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-50 flex items-center justify-center gap-2 text-zinc-400 text-[12px]">
                <Clock size={13} /> <span>تاريخ الطلب {date}</span>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
              <h4 className="text-[13px] font-bold text-zinc-900">المنتجات في هذا الطلب</h4>
              <span className="text-[11px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded font-bold">الإجمالي {totalItems}</span>
            </div>
            <div className="divide-y divide-zinc-50">
              {(order.line_items || []).map((item, i) => {
                const merchantName = getMeta(item, "merchant_name");
                const merchantId   = getMeta(item, "merchant_id");
                const hasRealMerchant = merchantName && merchantName !== "Unknown Seller";

                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-14 h-14 bg-zinc-50 border border-zinc-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image?.src
                        ? <img src={item.image.src} className="w-full h-full object-contain p-1" alt={item.name} />
                        : <Package size={20} className="text-zinc-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-zinc-900 truncate">{item.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[11px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">الكمية: {item.quantity}</span>
                        <span className="text-[12px] font-bold text-zinc-800" dir="ltr">JOD {parseFloat(item.total || 0).toFixed(2)}</span>
                        {item.quantity > 1 && (
                          <span className="text-[11px] text-zinc-400" dir="ltr">({parseFloat(item.price || 0).toFixed(2)} لكل قطعة)</span>
                        )}
                      </div>
                      {/* Merchant */}
                      <div className="flex items-center gap-1 mt-1.5">
                        <ShoppingBag size={10} className="text-zinc-400" />
                        <span className="text-[11px] text-zinc-500">
                          مباع بواسطة:{" "}
                          {hasRealMerchant ? (
                            <Link href={merchantId ? `/vendors/${merchantId}` : "/vendors"} className="font-bold text-[#be374f] hover:underline">
                              {merchantName}
                            </Link>
                          ) : (
                            <span className="font-bold text-zinc-600">محلي (رسمي)</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-start shrink-0">
                      <p className="text-[13px] font-bold text-zinc-800" dir="ltr">JOD {parseFloat(item.total || 0).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Order total summary */}
            <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 space-y-1">
              {parseFloat(order.shipping_total || 0) > 0 && (
                <div className="flex justify-between text-[12px] text-zinc-500">
                  <span>الشحن</span><span dir="ltr">JOD {parseFloat(order.shipping_total).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(order.discount_total || 0) > 0 && (
                <div className="flex justify-between text-[12px] text-emerald-600">
                  <span>خصم</span><span dir="ltr">-JOD {parseFloat(order.discount_total).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[14px] font-bold text-zinc-900 pt-1 border-t border-zinc-200">
                <span>المجموع</span><span dir="ltr">JOD {parseFloat(order.total || 0).toFixed(2)}</span>
              </div>
              {order.payment_method_title && (
                <p className="text-[11px] text-zinc-400 text-start">{order.payment_method_title}</p>
              )}
            </div>
          </div>

          {/* Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
              <h4 className="text-[12px] font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin size={13} className="text-[#be374f]" /> عنوان التسليم
              </h4>
              <p className="text-[14px] font-bold text-zinc-900">{order.shipping?.first_name} {order.shipping?.last_name}</p>
              <p className="text-[13px] text-zinc-600 mt-0.5 leading-relaxed">
                {order.shipping?.address_1 || order.billing?.address_1}<br />
                {order.shipping?.city || order.billing?.city}, {order.shipping?.country || order.billing?.country}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
              <h4 className="text-[12px] font-bold text-zinc-900 uppercase tracking-wider mb-3">معلومات الاتصال</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[13px] text-zinc-700">
                  <Mail size={13} className="text-zinc-400" />{order.billing?.email || "—"}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-zinc-700">
                  <Phone size={13} className="text-zinc-400" />{order.billing?.phone || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-zinc-100 flex justify-end shrink-0" dir="ltr">
          <button onClick={onClose} className="h-10 px-8 bg-zinc-900 hover:bg-black text-white rounded-xl text-[13px] font-bold transition-all">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
