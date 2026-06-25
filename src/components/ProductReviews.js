"use client";

import { useState } from "react";
import { Star, ChevronDown, ThumbsUp, CheckCircle2, User, MessageSquare } from "lucide-react";
import Image from "next/image";
import ProductReviewForm from "./ProductReviewForm";

export default function ProductReviews({ reviews = [], productName = "", productId, vendorId }) {
  const [filter, setFilter] = useState("Top");

  // Calculate stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / totalReviews).toFixed(1)
    : 0;

  const distribution = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => (Number(r.rating) || 0) === stars).length;
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { stars, count, percentage };
  });

  return (
    <div id="reviews" className="mt-16 pt-10 border-t border-zinc-200">
      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* RIGHT: Summary (RTL) */}
        <div className="lg:w-[300px] shrink-0">
          <h2 className="text-[21px] font-bold text-[#0F1111] mb-2">تقييمات العملاء</h2>
          
          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={18} className={`${i <= Math.round(Number(avgRating)) ? 'text-[#FFA41C] fill-[#FFA41C]' : 'text-zinc-200 fill-zinc-200'}`} />
              ))}
            </div>
            <span className="text-[18px] font-bold text-[#0F1111]">{avgRating} من 5</span>
          </div>
          
          <p className="text-[14px] text-[#565959] mb-4">{totalReviews.toLocaleString()} تقييم</p>
          
          {/* Distribution Bars */}
          <div className="space-y-2 mb-8">
            {distribution.map((item) => (
              <div key={item.stars} className="flex items-center gap-3 group cursor-pointer">
                <span className="text-[13px] text-[#be374f] group-hover:underline w-12 shrink-0">{item.stars} نجوم</span>
                <div className="flex-1 h-5 bg-[#F0F2F2] rounded-sm overflow-hidden border border-[#D5D9D9]">
                  <div 
                    className="h-full bg-[#FFA41C]" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-[13px] text-[#be374f] group-hover:underline w-8 shrink-0">{item.percentage}%</span>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-200 pt-6">
            <ProductReviewForm productId={productId} vendorId={vendorId} />
          </div>
        </div>

        {/* LEFT: List (RTL) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-[21px] font-bold text-[#0F1111]">أهم التقييمات من الأردن</h3>
             <div className="relative">
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="h-8 pe-3 ps-8 bg-[#F0F2F2] border border-[#D5D9D9] rounded-md text-[12px] text-[#0F1111] appearance-none cursor-pointer hover:bg-[#E3E6E6] shadow-sm outline-none"
                >
                   <option>الأهم</option>
                   <option>الأحدث</option>
                </select>
                <ChevronDown size={12} className="absolute start-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
             </div>
          </div>

          {reviews.length === 0 ? (
            <div className="py-10 text-center bg-zinc-50 rounded-lg border border-dashed border-zinc-300">
               <MessageSquare size={32} className="mx-auto text-zinc-300 mb-3" />
               <p className="text-[14px] text-zinc-500 font-medium">لا توجد تقييمات لهذا المنتج حتى الآن.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {reviews.map((review, idx) => (
                <div key={review.id || idx} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {/* Reviewer Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                      <User size={16} className="text-zinc-400" />
                    </div>
                    <span className="text-[13px] text-[#0F1111] font-medium">{review.reviewer || "مستخدم غير معروف"}</span>
                  </div>

                  {/* Rating & Title */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={14} className={`${i <= (Number(review.rating) || 0) ? 'text-[#FFA41C] fill-[#FFA41C]' : 'text-zinc-200 fill-zinc-200'}`} />
                      ))}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="text-[14px] text-[#565959] mb-1">
                    تم التقييم في الأردن في {review.date_created ? new Date(review.date_created).toLocaleDateString('ar-JO', { month: 'long', day: 'numeric', year: 'numeric' }) : "تاريخ غير معروف"}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[12px] font-bold text-[#C45500]">شراء مؤكد</span>
                  </div>

                  {/* Body */}
                  <div 
                    className="text-[14px] text-[#0F1111] leading-relaxed mb-4"
                    dangerouslySetInnerHTML={{ __html: review.review || "" }}
                  />

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <button className="h-8 px-6 border border-[#D5D9D9] rounded-lg text-[13px] text-[#0F1111] hover:bg-[#F7FAFA] shadow-sm">
                      مفيد
                    </button>
                    <span className="text-[12px] text-[#565959] border-r border-zinc-200 ps-4">إبلاغ</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
