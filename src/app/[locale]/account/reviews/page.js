"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Star, Package, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function AccountReviewsPage() {
  const { user, wooId, email, loading } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (wooId) {
      const userEmail = user?.email || email;
      const reviewsUrl = `/api/reviews?user_id=${wooId}${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ''}`;
      fetch(reviewsUrl)
        .then(r => r.json())
        .then(data => {
          if (data.reviews) setReviews(data.reviews);
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    } else if (!loading) {
      setIsLoading(false);
    }
  }, [wooId, user, email, loading]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-100 border-t-[#be374f] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-8 text-gray-900">Your Reviews</h2>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-100 rounded-md p-6 hover:shadow-sm transition-all">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white border border-gray-100 rounded-md overflow-hidden shrink-0 flex items-center justify-center">
                  {review.product_image ? (
                    <img 
                      src={review.product_image} 
                      alt={review.product_name || "Product"} 
                      className="w-full h-full object-contain p-1" 
                    />
                  ) : (
                    <Package size={24} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-1">
                       {[...Array(5)].map((_, i) => (
                         <Star key={i} size={14} className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                       ))}
                     </div>
                     <span className="text-[12px] text-gray-400 font-medium">{new Date(review.date_created).toLocaleDateString()}</span>
                  </div>
                  <Link 
                    href={`/product/${review.product_id}`} 
                    className="text-[15px] font-bold text-gray-900 hover:text-[#be374f] mb-1 block transition-colors leading-tight"
                  >
                    {review.product_name || `Product #${review.product_id}`}
                  </Link>
                  <div className="text-[14px] text-gray-600 leading-relaxed mt-2" dangerouslySetInnerHTML={{ __html: review.review }} />
                  
                  {/* Detailed Transaction Info Panel */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-md text-[13px]">
                    <div className="space-y-1 border-r border-dashed border-zinc-200 last:border-0 pr-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Reference Details</span>
                      <div className="text-zinc-700 font-medium">Order ID: <span className="font-bold text-zinc-900">{review.order_id ? `#${review.order_id}` : "N/A"}</span></div>
                      <div className="text-zinc-500 text-[11px]">Product ID: #{review.product_id}</div>
                    </div>
                    
                    <div className="space-y-1 sm:border-r sm:border-dashed sm:border-zinc-200 last:border-0 pr-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Merchant Details</span>
                      <div className="text-zinc-700 font-medium truncate max-w-[180px]" title={review.merchant_name}>
                        {review.merchant_name || "Mahally Partner"}
                      </div>
                      {review.merchant_id && (
                        <div className="text-zinc-500 text-[11px]">Merchant ID: #{review.merchant_id}</div>
                      )}
                    </div>
                    
                    <div className="space-y-1 md:border-r md:border-dashed md:border-zinc-200 last:border-0 pr-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Pricing Info</span>
                      <div className="text-zinc-700 font-medium">
                        Product Price: <span className="font-bold text-zinc-900">JOD {parseFloat(review.product_price || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Fulfillment</span>
                      <div className="text-zinc-700 font-medium">
                        Delivery Fees: <span className="font-bold text-zinc-900">JOD {parseFloat(review.delivery_fees || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-md border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
           <Star size={48} className="text-gray-100 mb-4" />
           <h3 className="text-[16px] font-bold mb-2">You haven't added any reviews yet</h3>
           <p className="text-gray-500 text-[14px] mb-8">Share your experience with others by reviewing your purchases!</p>
           <Link href="/account/orders" className="px-10 py-2.5 bg-black text-white rounded-md font-bold text-[14px] transition-all hover:bg-gray-800">
             View Orders
           </Link>
        </div>
      )}
    </div>
  );
}
