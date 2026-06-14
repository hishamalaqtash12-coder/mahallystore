"use client";

import { Star, ChevronRight, ChevronLeft, MessageSquare } from "lucide-react";
import { memo, useMemo, useRef, useState, useEffect } from "react";
import FeedbackModal from "./FeedbackModal";
import UserAvatar from "./UserAvatar";

const Testimonials = memo(({ feedbacks = [] }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate average rating and total count
  const { averageRating, totalReviews } = useMemo(() => {
    const validFeedbacks = (feedbacks || []).filter(
      f => f.comment && f.comment.trim().length > 0
    );

    if (validFeedbacks.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    const total = validFeedbacks.reduce((sum, f) => sum + (f.rating || 5), 0);
    const avg = total / validFeedbacks.length;

    return {
      averageRating: Math.round(avg * 10) / 10, // Round to 1 decimal
      totalReviews: validFeedbacks.length,
    };
  }, [feedbacks]);

  const displayFeedbacks = useMemo(() => {
    return (feedbacks || [])
      .filter(f => f.comment && f.comment.trim().length > 0)
      .slice(0, 15);
  }, [feedbacks]);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    if (scrollLeft <= 0 && document.documentElement.dir === 'rtl') {
      setCanScrollRight(scrollLeft < -10); // Prev (Right)
      setCanScrollLeft(Math.abs(scrollLeft) < maxScroll - 10); // Next (Left)
    } else {
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < maxScroll - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [displayFeedbacks]);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -350 : 350, behavior: "smooth" });
    setTimeout(checkScroll, 400);
  };

  return (
    <section className="w-full bg-white border-zinc-100">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-extrabold text-black tracking-tight flex items-center gap-3">
              <MessageSquare size={28} className="text-brand" />
              ماذا يقول عملاؤنا
            </h2>

            <div className="flex items-center gap-4">
              <div className="h-1.5 w-20 bg-brand rounded-full"></div>

              {/* Average Rating + Count */}
              {totalReviews > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1 font-semibold text-zinc-900">
                    {averageRating}
                    <span className="text-amber-500">★</span>
                  </div>
                  <span className="text-zinc-500">
                    ({totalReviews} تقييم)
                  </span>
                </div>
              )}
            </div>

            <p className="text-[13px] text-zinc-500 font-medium">
              آراء حقيقية من عملائنا السعداء
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-8 bg-white hover:bg-zinc-50 border border-zinc-400 text-zinc-900 rounded-full text-[14px] font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>شارك تجربتك</span>
            <MessageSquare size={16} className="text-zinc-600" />
          </button>
        </div>

        {/* Reviews Carousel */}
        <div className="relative group">
          <button
            onClick={() => scroll('left')}
            className={`absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-zinc-200 shadow-md hover:bg-zinc-50 rounded-full flex items-center justify-center text-zinc-700 transition-all ${!canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={() => scroll('right')}
            className={`absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-zinc-200 shadow-md hover:bg-zinc-50 rounded-full flex items-center justify-center text-zinc-700 transition-all ${!canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <ChevronRight size={20} />
          </button>

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4"
          >
            {displayFeedbacks.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                <MessageSquare size={40} className="text-zinc-400 mb-4" />
                <p className="text-zinc-900 font-medium">لا توجد آراء بعد</p>
                <p className="text-zinc-500 text-sm mt-1">كن أول من يشارك تجربته!</p>
              </div>
            ) : (
              displayFeedbacks.map((f, i) => {
                const dateObj = new Date(f.date);
                const timeAgo = Math.floor((new Date() - dateObj) / (1000 * 60 * 60 * 24));
                const dateDisplay = timeAgo === 0 ? 'اليوم' : `منذ ${timeAgo} يوم`;

                return (
                  <div key={i} className="flex flex-col shrink-0 w-[300px] md:w-[340px]">
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-4 min-h-[170px] flex flex-col relative shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-0.5 text-amber-500 mb-4">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            size={14}
                            className={s <= (f.rating || 5) ? "fill-current" : "text-zinc-300"}
                          />
                        ))}
                      </div>
                      <p className="text-[14px] text-zinc-700 leading-relaxed flex-1 line-clamp-4">
                        "{f.comment}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3 px-1">
                      <UserAvatar
                        customerName={f.userName}
                        avatarUrl={f.avatarUrl}
                        avatarBgColor={f.avatarBgColor || "#9b8676"}
                        className="w-9 h-9 rounded-full text-[14px] font-semibold border border-zinc-200 shrink-0 text-white"
                      />
                      <div>
                        <h4 className="font-semibold text-zinc-900">{f.userName || 'عميل موثوق'}</h4>
                        <p className="text-xs text-zinc-500">{dateDisplay}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
});

Testimonials.displayName = "Testimonials";
export default Testimonials;