"use client";

import { useState } from "react";
import { Star, X, Info, Loader2, CheckCircle2, ChevronRight, Package } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function ReviewSubmissionModal({ isOpen, onClose, order, user, userId, reviewedProducts = [], onReviewSubmitted }) {
  const { email: wooEmail, customerName } = useAuth();
  const [step, setStep] = useState(1); // 1: Select Product, 2: Write Review
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !order) return null;

  // Filter out already-reviewed products
  const reviewableItems = order.line_items.filter(
    item => !reviewedProducts.includes(item.product_id)
  );

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (rating === 0 || !reviewText.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.product_id,
          rating: rating,
          review: reviewText,
          reviewer: customerName || user?.displayName || user?.phoneNumber || "Anonymous Customer",
          reviewerEmail: wooEmail || user?.email || "customer@mahally.jo",
          userId: userId // Pass the WooCommerce ID
        })
      });

      if (res.ok) {
        setSuccess(true);
        // Notify parent to update state immediately without reload
        if (onReviewSubmitted) onReviewSubmitted(selectedProduct.product_id);
      }
    } catch (err) {
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <h2 className="text-[17px] font-bold text-zinc-900">
              {success ? "Review Submitted" : step === 1 ? "Create Review" : `Reviewing: ${selectedProduct.name}`}
            </h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 transition-colors">
               <X size={24} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
           {success ? (
             <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                   <CheckCircle2 size={48} />
                </div>
                <h3 className="text-[24px] font-bold text-zinc-900 mb-2">Thank you for your review!</h3>
                <p className="text-[15px] text-zinc-500 max-w-md">Your feedback helps other shoppers make better choices and helps our merchants improve their service.</p>
                <button 
                  onClick={onClose}
                  className="mt-8 h-10 px-8 bg-zinc-900 text-white rounded-md font-bold hover:bg-zinc-800 transition-all"
                >
                  Close
                </button>
             </div>
           ) : step === 1 ? (
             <div className="space-y-6">
                <p className="text-[15px] text-zinc-600">Which item from Order #{order.id} would you like to review?</p>
                {reviewableItems.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400">
                    <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-400" />
                    <p className="font-bold text-zinc-700">All items reviewed!</p>
                    <p className="text-[13px] mt-1">You've already submitted a review for every item in this order.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {reviewableItems.map((item, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSelectProduct(item)}
                        className="flex items-center gap-4 p-4 border border-zinc-200 rounded-lg hover:border-brand hover:bg-brand-light/30 transition-all text-end group"
                      >
                         <div className="w-16 h-16 bg-white border border-zinc-100 rounded-md overflow-hidden shrink-0">
                            {item.image?.src ? (
                               <img src={item.image.src} className="w-full h-full object-contain" />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center text-zinc-200 bg-zinc-50"><Package size={20} /></div>
                            )}
                         </div>
                         <div className="flex-1">
                            <p className="text-[14px] font-bold text-zinc-900 line-clamp-1">{item.name}</p>
                            <p className="text-[12px] text-zinc-400">Sold by {item.meta_data?.find(m => m.key === "merchant_name")?.value || "Mahally Partner"}</p>
                         </div>
                         <ChevronRight size={18} className="text-zinc-300 group-hover:text-brand" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
           ) : (
             <div className="space-y-8">
                {/* Overall Rating */}
                <div>
                   <h3 className="text-[18px] font-bold text-zinc-900 mb-2">Overall rating</h3>
                   <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button 
                          key={s}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(s)}
                          className="transition-transform active:scale-90"
                        >
                           <Star 
                             size={36} 
                             className={`${(hoverRating || rating) >= s ? 'text-[#FFA41C] fill-[#FFA41C]' : 'text-zinc-200 fill-white'}`} 
                             strokeWidth={1.5}
                           />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="me-2 text-[14px] font-bold text-brand-dark">
                          {rating === 5 ? 'I love it!' : rating === 4 ? 'I like it' : rating === 3 ? 'It\'s okay' : rating === 2 ? 'I don\'t like it' : 'I hate it'}
                        </span>
                      )}
                   </div>
                </div>

                {/* Review Text */}
                <div className="space-y-4">
                   <h3 className="text-[18px] font-bold text-zinc-900">Add a written review</h3>
                   <textarea 
                     value={reviewText}
                     onChange={(e) => setReviewText(e.target.value)}
                     placeholder="What did you like or dislike? What was the quality like?"
                     className="w-full min-h-[150px] p-4 border border-zinc-300 rounded-md text-[15px] outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                   />
                </div>

                <div className="bg-blue-50 p-4 rounded-md border border-blue-100 flex items-start gap-3">
                   <Info size={18} className="text-blue-500 mt-0.5" />
                   <p className="text-[12px] text-blue-700 leading-relaxed">
                      Your review will be posted publicly with your name. Please ensure it follows our community guidelines and focuses on the product and your purchase experience.
                   </p>
                </div>
             </div>
           )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center">
             <button 
                onClick={step === 2 ? () => setStep(1) : onClose}
                className="text-[14px] font-medium text-zinc-600 hover:text-zinc-900"
             >
                {step === 2 ? "Back" : "Cancel"}
             </button>
             {step === 2 && (
               <button 
                 onClick={handleSubmit}
                 disabled={submitting || rating === 0 || !reviewText.trim()}
                 className="h-10 px-8 bg-brand hover:bg-brand-dark border border-brand text-white rounded-md text-[14px] font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
               >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Submit Review
               </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
