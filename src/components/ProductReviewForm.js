"use client";

import { useState } from "react";
import { CheckCircle2, X, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ProductReviewForm({ productId, vendorId }) {
  const { wooId } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const isOwner = String(wooId) === String(vendorId);

  if (isOwner) {
    return (
      <div className="mt-2 p-4 bg-zinc-50 border border-zinc-200 rounded-md">
        <div className="flex gap-2 text-zinc-500">
          <Info size={16} className="shrink-0 mt-0.5" />
          <p className="text-[12px] font-medium leading-relaxed">
            You are the owner of this product. Vendors cannot review their own items to ensure marketplace trust.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <h3 className="text-[18px] font-bold text-[#0F1111] mb-1">Review this product</h3>
      <p className="text-[14px] text-[#0F1111] mb-4">Share your thoughts with other customers</p>
      
      <button
        onClick={() => setShowModal(true)}
        className="w-full h-[29px] border border-[#D5D9D9] rounded-md text-[13px] text-[#0F1111] bg-white hover:bg-[#F7FAFA] shadow-sm transition-all"
      >
        Write a customer review
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-white rounded-md w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-[#f0f2f2] border-b border-zinc-300 flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-zinc-900">How reviews work</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-900 transition-colors">
                   <X size={20} />
                </button>
            </div>
            
            <div className="p-8">
              <h3 className="text-[17px] font-bold text-[#007600] leading-snug mb-6">
                All reviews are from customers who have purchased this item from Mahally.
              </h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-[#007600] shrink-0" />
                  <p className="text-[13px] text-zinc-900 leading-snug">Customers purchase items on Mahally.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-[#007600] shrink-0" />
                  <p className="text-[13px] text-zinc-900 leading-snug">Customers will be able to leave a review directly from the order details page after delivery.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-[#007600] shrink-0" />
                  <p className="text-[13px] text-zinc-900 leading-snug">Mahally only displays reviews from customers who have purchased the item.</p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full h-[31px] bg-brand hover:bg-brand-dark text-white border border-brand rounded-md text-[13px] font-bold shadow-sm transition-all mb-4"
              >
                OK
              </button>
              
              <div className="text-center">
                <button className="text-[11px] text-brand hover:text-brand-dark hover:underline transition-colors">
                  To learn more, please refer to the Review Guidelines
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
