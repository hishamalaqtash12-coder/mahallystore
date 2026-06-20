"use client";

import { useState } from "react";
import { X, AlertCircle, ArrowLeft, Package, CheckCircle2, MessageSquare, HelpCircle, Loader2 } from "lucide-react";

const RETURN_REASONS = [
  "Item was damaged or defective",
  "Incorrect item received",
  "Item does not match description",
  "Better price found elsewhere",
  "Changed my mind / No longer needed",
  "Wrong size / Does not fit",
  "Performance or quality not adequate"
];

export default function ReturnRequestModal({ isOpen, onClose, order, user, onSubmitted }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async () => {
    if (!reason) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderId: order.id, 
          email: user?.email, 
          reason: `${reason}: ${details}` 
        })
      });
      
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onSubmitted?.();
          onClose();
          // Reset for next time
          setTimeout(() => {
            setIsSuccess(false);
            setReason("");
            setDetails("");
          }, 500);
        }, 2500);
      } else {
        alert("Failed to submit request. Please try again.");
      }
    } catch (err) {
      alert("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={!isSubmitting ? onClose : undefined} 
      />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        
        {/* Progress Overlay (Success) */}
        {isSuccess && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-[22px] font-bold text-zinc-900 mb-2">Request Submitted!</h3>
            <p className="text-[14px] text-zinc-500 leading-relaxed">
              We've received your return request for Order #{order.id}. Our customer support team will review it and contact you within 24-48 hours.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-orange-600">
              <ArrowLeft size={20} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-zinc-900">Request Return</h2>
              <p className="text-[12px] text-zinc-400 font-medium">Order #{order.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Order Summary Snapshot */}
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg border border-zinc-200 flex items-center justify-center shrink-0">
               <Package size={20} className="text-zinc-400" />
            </div>
            <div className="min-w-0">
               <p className="text-[13px] font-bold text-zinc-900 truncate">
                 {order.line_items?.length === 1 ? order.line_items[0].name : `${order.line_items?.length} items from your order`}
               </p>
               <p className="text-[12px] text-zinc-500">Delivered on {new Date(order.date_completed || order.date_created).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-zinc-700 flex items-center gap-2">
              <AlertCircle size={14} className="text-brand" />
              Reason for Return
            </label>
            <select 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all appearance-none cursor-pointer"
            >
              <option value="">Select a reason...</option>
              {RETURN_REASONS.map((r, i) => (
                <option key={i} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-zinc-700 flex items-center gap-2">
              <MessageSquare size={14} className="text-zinc-400" />
              Additional Details (Optional)
            </label>
            <textarea 
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please tell us more about the issue..."
              className="w-full min-h-[100px] p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all resize-none"
            />
          </div>

          {/* Info Tip */}
          <div className="flex gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
             <HelpCircle size={18} className="text-blue-500 shrink-0" />
             <p className="text-[12px] text-blue-700 leading-relaxed">
               Once submitted, your request will be reviewed by the merchant. You may be asked to provide photos of the item.
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="h-11 px-6 text-[14px] font-bold text-zinc-500 hover:text-zinc-900 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="h-11 px-8 bg-zinc-900 hover:bg-black text-white rounded-xl text-[14px] font-bold transition-all shadow-lg shadow-zinc-200 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
