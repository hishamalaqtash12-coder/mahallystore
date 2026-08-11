"use client";

import { X, Package, Printer, MapPin, CreditCard, MessageCircle, Clock, RefreshCw, History, CheckCircle2, Star, ShoppingBag, Edit2, AlertTriangle, MessageSquare, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import ReportModal from "@/components/ReportModal";
import { getProductUrl } from "@/lib/product-utils";


function getMeta(item, key) {
  return item?.meta_data?.find(m => m.key === key)?.value || null;
}

function decodeHTMLEntities(str) {
  if (!str) return "";
  return str
    .replace(/&rarr;/g, "→")
    .replace(/&larr;/g, "←")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&hellip;/g, "...");
}

function getStatusColors(status) {
  if (status === "completed")  return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "cancelled" || status === "refunded") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "shipped" || status === "in-transit") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function OrderDetailsModal({ order, isOpen, onClose, reviewedProducts = [] }) {
  const [notes, setNotes]           = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [isConfirmed, setIsConfirmed]   = useState(false);
  const [confirming, setConfirming]     = useState(false);

  // Address edit state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportedMerchant, setReportedMerchant] = useState(null);

  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState(null);
  const [currentShipping, setCurrentShipping] = useState(null);
  const [currentBillingPhone, setCurrentBillingPhone] = useState(null);

  useEffect(() => {
    if (isOpen && order) {
      setCurrentShipping(order.shipping);
      setCurrentBillingPhone(order.billing?.phone);
      setAddressForm({
        first_name: order.shipping?.first_name || '',
        last_name: order.shipping?.last_name || '',
        address_1: order.shipping?.address_1 || order.billing?.address_1 || '',
        city: order.shipping?.city || order.billing?.city || '',
        country: order.shipping?.country || order.billing?.country || '',
        phone: order.billing?.phone || ''
      });
      setIsEditingAddress(false);

      setIsConfirmed(
        order.meta_data?.some(m => m.key === "mahally_customer_confirmed_receipt" && m.value === "yes") || false
      );
      setLoadingNotes(true);
      fetch(`/api/orders/notes?id=${order.id}`)
        .then(r => r.json())
        .then(data => setNotes(Array.isArray(data) ? data : []))
        .catch(() => setNotes([]))
        .finally(() => setLoadingNotes(false));
    }
  }, [isOpen, order]);

  const handleConfirmReceipt = async () => {
    setConfirming(true);
    try {
      const res = await fetch("/api/orders/confirm-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id })
      });
      if (res.ok) {
        setIsConfirmed(true);
        setNotes(prev => [{ id: Date.now(), note: "You confirmed receipt of this order.", date_created: new Date().toISOString(), customer_note: true }, ...prev]);
      }
    } catch { alert("Failed to confirm receipt."); }
    finally { setConfirming(false); }
  };

  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      const res = await fetch("/api/orders/update-address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          email: order.billing?.email,
          shipping: addressForm
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update address");
      }
      const updatedOrder = await res.json();
      setCurrentShipping(updatedOrder.shipping);
      setCurrentBillingPhone(updatedOrder.billing?.phone);
      setIsEditingAddress(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingAddress(false);
    }
  };

  if (!isOpen || !order) return null;

  const mahallyId = order.meta_data?.find(m => m.key === "mahally_id")?.value;
  const isCOD     = order.payment_method === "cod";
  const hasReviewedItems = (order.line_items || []).some(item => reviewedProducts.includes(item.product_id));
  const statusColors = getStatusColors(order.status);
  const totalItems = (order.line_items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);

  // Compute subtotal from line items
  const subtotal = (order.line_items || []).reduce((acc, i) => acc + parseFloat(i.total || 0), 0);

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      return;
    }

    const invoiceItems = Object.values(itemsByVendor || {});
    const formatCurrency = (value) => `JOD ${parseFloat(value || 0).toFixed(2)}`;

    const invoiceHtml = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Invoice #${order.id}</title>
          <style>
            :root { color-scheme: light; font-family: Arial, Helvetica, sans-serif; }
            * { box-sizing: border-box; }
            body { margin: 0; padding: 24px; color: #18181b; background: #fff; }
            h1, h2, h3, p { margin: 0; }
            .page { max-width: 980px; margin: 0 auto; }
            .brand { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; border-bottom: 3px solid #18181b; padding-bottom: 14px; margin-bottom: 18px; }
            .brand-title { font-size: 30px; line-height: 1; text-transform: uppercase; letter-spacing: 1.5px; }
            .brand-sub { font-size: 13px; color: #52525b; margin-top: 6px; }
            .tag { display: inline-block; padding: 4px 8px; border-radius: 999px; background: #f4f4f5; color: #27272a; font-size: 11px; text-transform: uppercase; letter-spacing: .8px; }
            .muted { color: #52525b; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
            .card { border: 1px solid #e4e4e7; border-radius: 12px; padding: 12px 14px; background: #fff; }
            .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; margin-bottom: 6px; }
            .section-title { font-size: 15px; font-weight: 700; margin-bottom: 10px; }
            .vendor-block { margin-bottom: 24px; page-break-inside: avoid; border: 1px solid #e4e4e7; border-radius: 12px; padding: 12px; background: #fff; }
            .vendor-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-bottom: 8px; border-bottom: 1px solid #e4e4e7; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px 8px; text-align: left; vertical-align: top; font-size: 13px; border-bottom: 1px solid #e4e4e7; }
            th { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #52525b; }
            .text-start { text-align: right; }
            .text-center { text-align: center; }
            .summary { width: 340px; margin-left: auto; border-top: 2px solid #18181b; padding-top: 10px; }
            .summary-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; }
            .summary-total { font-weight: 700; font-size: 15px; }
            .note { font-size: 11px; color: #71717a; margin-top: 12px; }
            .no-print { display: flex; align-items: center; justify-content: space-between; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; }
            .print-btn { background: #16a34a; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; }
            .print-btn:hover { background: #15803d; }
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="no-print">
              <div>
                <strong>Want to download as PDF?</strong> Change the printer destination to "Save as PDF" in the print dialog.
              </div>
              <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
            </div>

            <div class="brand">
              <div>
                <div class="tag">Tax Invoice</div>
                <h1 class="brand-title">Invoice</h1>
                <p class="brand-sub">Order #${order.id} • Generated from Mahally</p>
              </div>
              <div style="text-align: right;">
                <h2 style="font-size: 18px; font-weight: 700;">Mahally Official</h2>
                <p class="muted">${order.billing?.first_name || ''} ${order.billing?.last_name || ''}</p>
                <p class="muted">${order.billing?.address_1 || ''}</p>
                <p class="muted">${order.billing?.city || ''}, ${order.billing?.country || ''}</p>
              </div>
            </div>

            <div class="grid">
              <div class="card">
                <div class="card-label">Bill To</div>
                <p style="font-weight: 700;">${order.billing?.first_name || ''} ${order.billing?.last_name || ''}</p>
                <p class="muted" style="margin-top: 3px;">${order.billing?.address_1 || ''}</p>
                <p class="muted">${order.billing?.city || ''}, ${order.billing?.country || ''}</p>
                <p class="muted">${order.billing?.phone || ''}</p>
              </div>
              <div class="card">
                <div class="card-label">Invoice Details</div>
                <p style="margin-bottom: 4px;"><strong>Invoice Date:</strong> ${new Date(order.date_created).toLocaleDateString()}</p>
                <p class="muted" style="margin-bottom: 4px;"><strong>Payment Method:</strong> ${order.payment_method_title || '—'}</p>
                <p class="muted"><strong>Status:</strong> ${order.status || '—'}</p>
              </div>
            </div>

            <div class="section-title">Vendor Breakdown</div>
            ${invoiceItems.map((vendor) => `
              <div class="vendor-block">
                <div class="vendor-head">
                  <div>
                    <h3 style="font-size: 15px; font-weight: 700;">${vendor.id !== 'mahally' ? vendor.name : 'Mahally Official'}</h3>
                    ${vendor.phone ? `<p class="muted" style="font-size: 12px; margin-top: 2px;">Tel: ${vendor.phone}</p>` : ''}
                  </div>
                  <span style="font-size: 13px; font-weight: 700;">${formatCurrency(vendor.subtotal)}</span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th class="text-center">Qty</th>
                      <th class="text-start">Price</th>
                      <th class="text-start">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${vendor.items.map((item) => `
                      <tr>
                        <td>
                          <div style="font-weight: 700;">${item.name || 'Item'}</div>
                          <div class="muted" style="font-size: 11px;">
                            ${item.sku ? `SKU: ${item.sku} &bull; ` : ''}Product ID: ${item.product_id}
                          </div>
                        </td>
                        <td class="text-center">${item.quantity || 1}</td>
                        <td class="text-start">${formatCurrency(item.price || 0)}</td>
                        <td class="text-start">${formatCurrency(item.total || 0)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `).join('')}

            <div class="summary">
              <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
              <div class="summary-row"><span>Shipping</span><span>${parseFloat(order.shipping_total || 0) > 0 ? formatCurrency(order.shipping_total) : 'Free'}</span></div>
              <div class="summary-row summary-total"><span>Grand Total</span><span>${formatCurrency(order.total || 0)}</span></div>
            </div>

            <p class="note">This invoice is structured by vendor for clear order reconciliation and print-ready documentation.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  // Group items by vendor to create separate sub-invoices
  const itemsByVendor = (order.line_items || []).reduce((acc, item) => {
    const merchantId = getMeta(item, "merchant_id") || "mahally";
    const merchantName = getMeta(item, "merchant_name") || "Mahally Official";
    if (!acc[merchantId]) {
      acc[merchantId] = {
        id: merchantId,
        name: merchantName,
        phone: getMeta(item, "merchant_phone"),
        email: getMeta(item, "merchant_email"),
        items: [],
        subtotal: 0
      };
    }
    acc[merchantId].items.push(item);
    acc[merchantId].subtotal += parseFloat(item.total || 0);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="px-6 py-4 bg-[#f0f2f2] border-b border-zinc-300 flex items-center justify-between shrink-0" dir="rtl">
          <div>
            <h2 className="text-[15px] font-bold text-zinc-900">تفاصيل الطلب</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              طلب #{order.id}
              {mahallyId && <span className="ms-2 text-[10px] text-zinc-400 uppercase tracking-widest">{mahallyId}</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" dir="rtl">

          {/* Top Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-zinc-500 uppercase text-[11px] font-bold tracking-wide mb-0.5">تاريخ الطلب</p>
                <p className="text-zinc-800 font-medium">
                  {new Date(order.date_created).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 uppercase text-[11px] font-bold tracking-wide mb-0.5">الحالة</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${statusColors}`}>
                  {isCOD && order.status === "on-hold" ? "مؤكد (دفع عند الاستلام)" : order.status}
                </span>
              </div>
              <div>
                <p className="text-zinc-500 uppercase text-[11px] font-bold tracking-wide mb-0.5">المنتجات</p>
                <p className="text-zinc-800 font-medium">{totalItems}</p>
              </div>
            </div>
            <button onClick={handlePrintInvoice} className="print-keep flex items-center gap-1.5 text-brand hover:text-brand-dark hover:underline text-[13px]">
              <Printer size={14} /> طباعة الفاتورة
            </button>
          </div>

          {/* COD info banner */}
          {isCOD && order.status === "on-hold" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <CreditCard size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-amber-800">طلب الدفع عند الاستلام</p>
                <p className="text-[12px] text-amber-700 mt-0.5">سيتم تحصيل الدفع عند تسليم طلبك. تم تأكيد طلبك وجاري تجهيزه.</p>
              </div>
            </div>
          )}

          {/* Receipt Confirmation */}
          {order.status === "completed" && !isConfirmed && (
            <div className="bg-brand-light/30 border border-brand-light rounded-lg p-5 flex items-start gap-4">
              <div className="p-2.5 bg-amber-100 rounded-full shrink-0">
                <Package size={20} className="text-amber-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-bold text-zinc-900 mb-1">هل استلمت طلبك؟</h3>
                <p className="text-[13px] text-zinc-600 mb-3">يرجى تأكيد استلام جميع المنتجات بحالة جيدة لإتمام العملية.</p>
                <button
                  onClick={handleConfirmReceipt}
                  disabled={confirming}
                  className="h-[34px] px-5 bg-brand hover:bg-brand-dark border border-brand rounded-md text-white text-[13px] font-bold shadow-sm transition-all flex items-center gap-2 w-fit"
                >
                  {confirming ? <RefreshCw size={14} className="animate-spin" /> : "نعم، أؤكد الاستلام"}
                </button>
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 flex items-start gap-4">
              <div className="p-2.5 bg-emerald-100 rounded-full text-emerald-600 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-bold text-zinc-900 mb-1">{hasReviewedItems ? "تم تقديم التقييم مسبقاً" : "تم تأكيد الاستلام!"}</h3>
                <p className="text-[13px] text-zinc-600 mb-3">
                  {hasReviewedItems
                    ? "لقد قمت مسبقاً بتقديم تقييم لهذا الطلب. يمكنك مراجعته من سجل حسابك."
                    : "شكراً لك! تقييمك يساعد تجارنا على التحسين."}
                </p>
                {hasReviewedItems ? (
                  <Link
                    href="/account/reviews"
                    onClick={onClose}
                    className="cursor-pointer inline-flex w-fit items-center gap-2 h-[34px] px-5 bg-emerald-600 text-white rounded-md text-[13px] font-bold hover:bg-emerald-700 transition-all"
                  >
                    <Star size={14} className="text-amber-200 fill-amber-200" /> شاهد تقييمك
                  </Link>
                ) : (
                  <Link
                    href={`/account/orders?review=true&id=${order.id}`}
                    onClick={onClose}
                    className="cursor-pointer inline-flex w-fit items-center gap-2 h-[34px] px-5 bg-zinc-900 text-white rounded-md text-[13px] font-bold hover:bg-zinc-800 transition-all"
                  >
                    <Star size={14} className="text-amber-400 fill-amber-400" /> اكتب تقييماً
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Visual Order Tracking Timeline */}
          {(() => {
            if (['cancelled', 'failed', 'refunded'].includes(order.status)) {
              const cancelledBy = order.meta_data?.find(m => m.key === '_cancelled_by_role')?.value;
              let cancelText = "";
              if (cancelledBy === 'customer') cancelText = " - أُلغي من قبلك";
              else if (cancelledBy === 'merchant') cancelText = " - أُلغي من قبل التاجر";

              return (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                  <p className="text-rose-700 text-[13px] font-bold">تتبع الطلب غير متاح لطلبات {order.status === 'cancelled' ? 'ملغاة' : order.status}{cancelText}</p>
                </div>
              );
            }

            const TRACKING_STEPS = [
              { step: 1, label: "تم تأكيد الطلب" },
              { step: 2, label: "تمت معالجة الطلب" },
              { step: 3, label: "جاهز للشحن" },
              { step: 4, label: "في الطريق للتسليم*" },
              { step: 5, label: "تم تسليم الطلب" }
            ];

            let fallbackStep = 1;
            if (order.status === "processing") fallbackStep = 2;
            else if (order.status === "ready" || order.status === "ready-shipment" || order.status === "ready-for-shipping") fallbackStep = 3;
            else if (order.status === "shipped" || order.status === "out-for-delivery") fallbackStep = 4;
            else if (order.status === "completed") fallbackStep = 5;

            const metaStep = order.meta_data?.find(m => m.key === 'mahally_tracking_step')?.value;
            let currentStep = Math.max(metaStep ? parseInt(metaStep, 10) : 1, fallbackStep);
            if (order.status === "completed") currentStep = 5;

            return (
              <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
                <div className="space-y-6 pe-4 relative">
                  {TRACKING_STEPS.map((s, idx) => {
                    const isPast = s.step < currentStep;
                    const isCurrent = s.step === currentStep;
                    const isFuture = s.step > currentStep;
                    const isLast = idx === TRACKING_STEPS.length - 1;

                    return (
                      <div key={s.step} className="flex gap-4 relative">
                        {/* Connecting Line */}
                        {!isLast && (
                          <div 
                            className={`absolute end-[11px] top-[30px] bottom-[-30px] w-[2px] ${isPast ? 'bg-brand' : 'bg-zinc-200'}`}
                            style={{ height: 'calc(100% + 10px)' }}
                          />
                        )}

                        {/* Icon/Circle */}
                        <div className="relative z-10 shrink-0 mt-0.5">
                          {isPast || (isCurrent && s.step === 5) ? (
                            <div className="w-6 h-6 rounded-full bg-[#10a149] text-white flex items-center justify-center outline outline-2 outline-offset-2 outline-dashed outline-[#10a149]/40">
                              <CheckCircle2 size={16} className="text-white" />
                            </div>
                          ) : isCurrent ? (
                            <div className="w-6 h-6 rounded-full bg-white border-2 border-brand flex items-center justify-center outline outline-2 outline-offset-2 outline-dashed outline-brand/60">
                              <div className="w-2.5 h-2.5 bg-brand rounded-full" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white border-2 border-zinc-300 flex items-center justify-center outline outline-2 outline-offset-2 outline-dashed outline-zinc-300">
                              <div className="w-2.5 h-2.5 bg-zinc-200 rounded-full" />
                            </div>
                          )}
                        </div>

                        <div className="pt-0.5">
                          <p className={`text-[14px] font-bold ${isPast || isCurrent ? 'text-zinc-900' : 'text-zinc-400'}`}>
                            {s.label}
                          </p>
                          {s.step === 4 && (
                            <p className={`text-[11px] mt-1 ${isPast || isCurrent ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              * عملية التسليم مرتبطة بمزود الشحن المحلي
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-zinc-200 rounded-lg bg-zinc-50/50">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[12px] font-bold text-zinc-900 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin size={12} className="text-brand" /> عنوان الشحن
                </h4>
                {['pending', 'processing', 'on-hold'].includes(order.status) && !isEditingAddress && (
                  <button onClick={() => setIsEditingAddress(true)} className="text-[11px] font-bold text-brand hover:underline flex items-center gap-1">
                    <Edit2 size={10} /> تعديل
                  </button>
                )}
              </div>
              
              {isEditingAddress ? (
                <div className="space-y-2 text-[12px] mt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={addressForm.first_name} onChange={e => setAddressForm(prev => ({...prev, first_name: e.target.value}))} placeholder="الاسم الأول" className="w-full h-7 px-2 border border-zinc-300 rounded outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                    <input value={addressForm.last_name} onChange={e => setAddressForm(prev => ({...prev, last_name: e.target.value}))} placeholder="الاسم الأخير" className="w-full h-7 px-2 border border-zinc-300 rounded outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                  </div>
                  <input value={addressForm.address_1} onChange={e => setAddressForm(prev => ({...prev, address_1: e.target.value}))} placeholder="العنوان" className="w-full h-7 px-2 border border-zinc-300 rounded outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                  <input value={addressForm.city} onChange={e => setAddressForm(prev => ({...prev, city: e.target.value}))} placeholder="المدينة" className="w-full h-7 px-2 border border-zinc-300 rounded outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                  <input value={addressForm.phone} onChange={e => setAddressForm(prev => ({...prev, phone: e.target.value}))} placeholder="الهاتف" className="w-full h-7 px-2 border border-zinc-300 rounded outline-none focus:border-brand focus:ring-1 focus:ring-brand" dir="ltr" />
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={handleSaveAddress} disabled={savingAddress} className="h-7 px-3 bg-brand hover:bg-brand-dark rounded text-white font-bold border border-brand shadow-sm transition-all">
                      {savingAddress ? "جاري الحفظ..." : "حفظ"}
                    </button>
                    <button onClick={() => {
                      setIsEditingAddress(false);
                      setAddressForm({
                        first_name: currentShipping?.first_name || '',
                        last_name: currentShipping?.last_name || '',
                        address_1: currentShipping?.address_1 || order.billing?.address_1 || '',
                        city: currentShipping?.city || order.billing?.city || '',
                        country: currentShipping?.country || order.billing?.country || '',
                        phone: currentBillingPhone || ''
                      });
                    }} className="h-7 px-3 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-700 font-bold border border-zinc-300">
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[13px] text-zinc-700 space-y-0.5">
                  <p className="font-semibold">{currentShipping?.first_name} {currentShipping?.last_name}</p>
                  <p>{currentShipping?.address_1 || order.billing?.address_1}</p>
                  <p>{currentShipping?.city || order.billing?.city}, {currentShipping?.country || order.billing?.country}</p>
                  <p className="text-zinc-500">Tel: {currentBillingPhone || "—"}</p>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-[12px] font-bold text-zinc-900 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard size={12} className="text-zinc-400" /> الدفع
              </h4>
              <p className="text-[13px] text-zinc-700">{order.payment_method_title || "—"}</p>
              {isCOD && <p className="text-[11px] text-amber-600 font-bold mt-1">الدفع عند التسليم</p>}
            </div>
            <div>
              <h4 className="text-[12px] font-bold text-zinc-900 mb-2 uppercase tracking-wide">ملخص الطلب</h4>
              <div className="text-[12px] space-y-1">
                {Object.values(itemsByVendor).map((vendor) => (
                  <div key={vendor.id} className="flex justify-between text-zinc-600">
                    <span className="flex items-center gap-1">
                      <Store size={10} className="text-zinc-400" />
                      {vendor.name} ({vendor.items.reduce((a, i) => a + (i.quantity || 1), 0)} منتجات)
                    </span>
                    <span dir="ltr">JOD {vendor.subtotal.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-zinc-600 pt-1 border-t border-zinc-100">
                  <span>المجموع الفرعي ({totalItems} منتجات)</span>
                  <span dir="ltr">JOD {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>الشحن</span>
                  <span dir="ltr">{parseFloat(order.shipping_total || 0) > 0 ? `JOD ${parseFloat(order.shipping_total).toFixed(2)}` : "مجاني"}</span>
                </div>
                {parseFloat(order.discount_total || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>خصم</span>
                    <span dir="ltr">-JOD {parseFloat(order.discount_total).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-zinc-900 pt-1 border-t border-zinc-200">
                  <span>المجموع الكلي</span>
                  <span dir="ltr">JOD {parseFloat(order.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Timeline / Notes */}
          {loadingNotes ? (
            <div className="flex items-center gap-2 text-[13px] text-zinc-400">
              <RefreshCw size={14} className="animate-spin" /> جاري تحميل التحديثات…
            </div>
          ) : notes.length > 0 && (
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-[#f0f2f2] border-b border-zinc-200 flex items-center gap-2">
                <History size={14} className="text-zinc-500" />
                <h4 className="text-[13px] font-bold text-zinc-900">تحديثات الطلب والجدول الزمني</h4>
              </div>
              <div className="p-4 space-y-3">
                {notes.map(note => {
                  const isStatus = note.note.toLowerCase().includes("order status changed");
                  return (
                    <div key={note.id} className={`flex gap-3 text-[13px] ${isStatus ? "text-zinc-500 italic" : "text-zinc-800"}`}>
                      <div className="pt-0.5 shrink-0">
                        {isStatus ? <RefreshCw size={13} className="text-zinc-400" /> : <MessageCircle size={13} className="text-[#8f2d4a]" />}
                      </div>
                      <div className="flex-1">
                        <p className={isStatus ? "" : "font-medium leading-relaxed"}>{decodeHTMLEntities(note.note)}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(note.date_created).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vendor Invoices */}
          <div className="space-y-6">
            {Object.values(itemsByVendor).map((vendor) => {
              const hasRealMerchant = vendor.id !== "mahally" && vendor.name !== "Unknown Seller";

              return (
                <div key={vendor.id} className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  {/* Vendor Header */}
                  <div className="px-4 py-3 bg-[#f0f2f2] border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Store size={18} className="text-brand" />
                      <h3 className="text-[14px] font-bold text-zinc-900">
                        فاتورة من: {hasRealMerchant ? (
                          <Link href={`/vendor/${vendor.storeSlug || vendor.id}`} className="text-brand hover:text-brand-dark hover:underline">
                            {vendor.name}
                          </Link>
                        ) : (
                          "محلي (رسمي)"
                        )}
                      </h3>
                    </div>
                    <div className="text-[13px] font-bold text-zinc-900">
                      مجموع التاجر: JOD {vendor.subtotal.toFixed(2)}
                    </div>
                  </div>

                  {/* Vendor Items */}
                  <div className="divide-y divide-zinc-100">
                    {vendor.items.map((item, i) => (
                      <div key={i} className="flex gap-4 p-4 items-start">
                        {/* Image */}
                        <div className="w-20 h-20 bg-white border border-zinc-200 rounded p-1 shrink-0 flex items-center justify-center">
                          {item.image?.src
                            ? <img src={item.image.src} className="w-full h-full object-contain" alt={item.name} />
                            : <Package size={28} className="text-zinc-200" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link href={getProductUrl(item)} className="text-[13px] font-semibold text-brand hover:text-brand-dark hover:underline leading-snug block">
                            {item.name}
                          </Link>

                          {/* SKU & Product/Item IDs */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-400 mt-0.5">
                            {item.sku && (
                              <>
                                <span>SKU: {item.sku}</span>
                                <span className="text-zinc-300">•</span>
                              </>
                            )}
                            <span>Product ID: {item.product_id}</span>
                            <span className="text-zinc-300">•</span>
                            <span>Item ID: {item.id}</span>
                          </div>

                          {/* Qty + Price */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-[11px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">الكمية: {item.quantity}</span>
                            {item.quantity > 1 && (
                              <span className="text-[11px] text-zinc-400" dir="ltr">(JOD {parseFloat(item.price || 0).toFixed(2)} each)</span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {order.status === "completed" && (
                              <Link href={getProductUrl(item)} className="h-[28px] px-4 bg-brand hover:bg-brand-dark border border-brand text-white rounded-md text-[12px] font-bold shadow-sm transition-all flex items-center">
                                شراء مرة أخرى
                              </Link>
                            )}
                            {order.status === "completed" && (
                              <button className="h-[28px] px-4 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-md text-[12px] font-bold shadow-sm transition-all">
                                إرجاع المنتجات
                              </button>
                            )}
                            {hasRealMerchant && (
                              <>
                                <Link 
                                  href={`/messages?to=${vendor.id}&msg=${encodeURIComponent(`مرحباً ${vendor.name}، لدي سؤال بخصوص منتجي الذي اشتريته: "${item.name}" (طلب #${order.id}).`)}`}
                                  className="h-[28px] px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md text-[12px] font-bold transition-all flex items-center gap-1.5"
                                >
                                  <MessageSquare size={12} className="text-zinc-500" />
                                  محادثة مع التاجر
                                </Link>
                                {vendor.phone && (
                                  <a 
                                    href={`https://wa.me/${vendor.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً ${vendor.name}، لدي سؤال بخصوص منتجي الذي اشتريته: "${item.name}" (طلب #${order.id}).`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-[28px] px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[12px] font-bold transition-all flex items-center gap-1.5"
                                  >
                                    <MessageCircle size={12} className="text-emerald-600" />
                                    تواصل واتساب
                                  </a>
                                )}
                                <button 
                                  onClick={() => {
                                    setReportedMerchant({ id: vendor.id, name: vendor.name });
                                    setReportModalOpen(true);
                                  }}
                                  className="h-[28px] px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-md text-[12px] font-bold transition-all flex items-center gap-1.5"
                                >
                                  <AlertTriangle size={12} className="text-rose-500" />
                                  الإبلاغ عن التاجر
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right price */}
                        <div className="text-start shrink-0">
                          <p className="text-[14px] font-bold text-brand">JOD {parseFloat(item.total || 0).toFixed(2)}</p>
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-zinc-400">×{item.quantity}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Print-Only Vendor Invoices ── */}
        <div className="hidden print:block print-invoice-container bg-white p-8 w-full max-w-none">
          {Object.values(itemsByVendor).map((vendor, index) => (
            <div key={vendor.id} className="mb-12 page-break-after-always" style={{ pageBreakAfter: 'always' }}>
              <div className="border-b-2 border-zinc-900 pb-4 mb-6 flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900 uppercase">Invoice</h1>
                  <p className="text-sm text-zinc-500 font-medium mt-1">Order #{order.id}</p>
                </div>
                <div className="text-start">
                  <h2 className="text-xl font-bold text-zinc-900">{vendor.id !== 'mahally' ? vendor.name : 'Mahally Official'}</h2>
                  {vendor.phone && <p className="text-sm text-zinc-600">Tel: {vendor.phone}</p>}
                  {vendor.email && <p className="text-sm text-zinc-600">{vendor.email}</p>}
                </div>
              </div>

              <div className="flex justify-between mb-8">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-2 uppercase text-zinc-500 tracking-wider">Bill To</h3>
                  <p className="text-sm font-bold text-zinc-900">{order.billing?.first_name} {order.billing?.last_name}</p>
                  <p className="text-sm text-zinc-600">{order.billing?.address_1}</p>
                  <p className="text-sm text-zinc-600">{order.billing?.city}, {order.billing?.country}</p>
                  <p className="text-sm text-zinc-600">{order.billing?.phone}</p>
                </div>
                <div className="text-start">
                  <p className="text-sm"><span className="font-bold text-zinc-900">Invoice Date:</span> <span className="text-zinc-600">{new Date(order.date_created).toLocaleDateString()}</span></p>
                  <p className="text-sm"><span className="font-bold text-zinc-900">Payment Method:</span> <span className="text-zinc-600">{order.payment_method_title}</span></p>
                  <p className="text-sm"><span className="font-bold text-zinc-900">Status:</span> <span className="text-zinc-600 uppercase">{order.status}</span></p>
                </div>
              </div>

              <table className="w-full text-end border-collapse mb-8">
                <thead>
                  <tr className="border-b-2 border-zinc-200">
                    <th className="py-2 text-sm font-bold text-zinc-900">Item</th>
                    <th className="py-2 text-sm font-bold text-zinc-900 text-center">Qty</th>
                    <th className="py-2 text-sm font-bold text-zinc-900 text-start">Price</th>
                    <th className="py-2 text-sm font-bold text-zinc-900 text-start">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {vendor.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3">
                        <p className="text-sm font-bold text-zinc-900">{item.name}</p>
                        {item.sku && <p className="text-xs text-zinc-500">SKU: {item.sku}</p>}
                      </td>
                      <td className="py-3 text-sm text-zinc-700 text-center">{item.quantity}</td>
                      <td className="py-3 text-sm text-zinc-700 text-start">JOD {parseFloat(item.price || 0).toFixed(2)}</td>
                      <td className="py-3 text-sm text-zinc-900 font-bold text-start">JOD {parseFloat(item.total || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 border-t-2 border-zinc-200 pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-zinc-900">Vendor Subtotal</span>
                    <span className="text-sm font-bold text-zinc-900">JOD {vendor.subtotal.toFixed(2)}</span>
                  </div>
                  {/* Note: Global shipping/discount are not accurately split by vendor in standard WC without plugins, so we omit them here to avoid confusion or show a disclaimer */}
                  <p className="text-[10px] text-zinc-400 mt-4 leading-tight italic">
                    Note: This is a vendor-specific breakdown. Total shipping, taxes, or global order discounts are calculated at the overall order level and may not be reflected in this subtotal.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-white border-t border-zinc-200 flex justify-end shrink-0" dir="ltr">
          <button onClick={onClose} className="h-[34px] px-6 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-md text-[13px] font-bold shadow-sm transition-all">
            إغلاق
          </button>
        </div>
      </div>
      {/* Report Modal */}
      {reportedMerchant && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setReportedMerchant(null);
          }}
          reportedId={reportedMerchant.id}
          reportedName={reportedMerchant.name}
          type="store"
        />
      )}
    </div>
  );
}
