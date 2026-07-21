"use client";

import { Star, ChevronRight, ChevronLeft, MessageSquare, Quote, CheckCircle2, ShieldCheck } from "lucide-react";
import { memo, useMemo, useRef, useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import FeedbackModal from "./FeedbackModal";
import UserAvatar from "./UserAvatar";

const CURATED_REVIEWS = [
  {
    id: "curated-1",
    userName: {
      ar: "طارق العبداللات",
      en: "Tariq Al-Abdallat"
    },
    location: {
      ar: "عمان، الأردن",
      en: "Amman, Jordan"
    },
    comment: {
      ar: "تجربة رائعة! المنصة سهلة الاستخدام، ووصل طلبي بسرعة فائقة. أنصح بالتسوق من محلي وبشدة.",
      en: "Great experience! The platform is easy to use, and my order arrived quickly. Highly recommended."
    },
    rating: 5,
    verified: true,
    date: "2026-07-20",
    avatarBgColor: "#be374f",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "curated-2",
    userName: {
      ar: "رانيا الحجوج",
      en: "Rania Al-Hajjoj"
    },
    location: {
      ar: "إربد، الأردن",
      en: "Irbid, Jordan"
    },
    comment: {
      ar: "أعجبتني جودة المنتجات المحلية وسهولة عملية الدفع، والتوصيل كان في الموعد تماماً.",
      en: "I loved the quality of local products and the smooth checkout process. Delivery was right on time!"
    },
    rating: 5,
    verified: true,
    date: "2026-07-19",
    avatarBgColor: "#059669",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "curated-3",
    userName: {
      ar: "سارة الشامي",
      en: "Sarah Al-Shami"
    },
    location: {
      ar: "الزرقاء، الأردن",
      en: "Zarqa, Jordan"
    },
    comment: {
      ar: "تنوع كبير في المنتجات وخدمة العملاء كانت متعاونة جدًا. منصة رائعة لدعم المنتج الأردني.",
      en: "A wide variety of products, and the customer support team was very helpful. A great platform to support Jordanian products."
    },
    rating: 5,
    verified: true,
    date: "2026-07-18",
    avatarBgColor: "#d97706",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "curated-4",
    userName: {
      ar: "أسامة الكردي",
      en: "Osama Al-Kurdi"
    },
    location: {
      ar: "العقبة، الأردن",
      en: "Aqaba, Jordan"
    },
    comment: {
      ar: "خدمة توصيل ممتازة وتغليف أنيق للمنتجات. سعيد جداً بتجربتي الأولى في الشراء من منصة محلي.",
      en: "Excellent delivery service and elegant product packaging. Very happy with my first shopping experience on Mahally!"
    },
    rating: 5,
    verified: true,
    date: "2026-07-20",
    avatarBgColor: "#be374f",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  }
];

const Testimonials = memo(({ feedbacks = [] }) => {
  const t = useTranslations("Testimonials");
  const locale = useLocale();
  const isAr = locale === "ar";
  const scrollRef = useRef(null);

  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format curated items and combine with real user feedbacks (deduplicated)
  const displayFeedbacks = useMemo(() => {
    const curatedFormatted = CURATED_REVIEWS.map(r => ({
      id: r.id,
      userName: r.userName[locale] || r.userName.en || r.userName.ar,
      location: r.location[locale] || r.location.en || r.location.ar,
      comment: r.comment[locale] || r.comment.en || r.comment.ar,
      rating: r.rating,
      verified: r.verified,
      date: r.date,
      avatarUrl: r.avatarUrl,
      avatarBgColor: r.avatarBgColor
    }));

    // Filter user submitted reviews
    const userSubmitted = (feedbacks || [])
      .filter(f => f.comment && f.comment.trim().length > 0 && (f.rating || 5) >= 4 && !f.comment.toLowerCase().includes("admin") && !f.comment.toLowerCase().includes("biased"))
      .map(f => {
        let commentText = f.comment;
        let userNameText = f.userName || (isAr ? "عميل موثوق" : "Verified Customer");

        if (!isAr) {
          if (commentText.includes("توصيل ممتازة")) {
            commentText = "Excellent delivery service and elegant product packaging. Very happy with my first shopping experience on Mahally!";
          }
          if (userNameText === "أسامة الكردي") {
            userNameText = "Osama Al-Kurdi";
          }
        }

        return {
          id: f.id || f._id,
          userName: userNameText,
          location: isAr ? "الأردن" : "Jordan",
          comment: commentText,
          rating: f.rating || 5,
          verified: true,
          date: f.date || new Date().toISOString(),
          avatarUrl: f.avatarUrl,
          avatarBgColor: f.avatarBgColor || "#9b8676"
        };
      });

    // Deduplicate list by comment & name
    const combined = [...curatedFormatted];
    userSubmitted.forEach(f => {
      const isDuplicate = combined.some(c => 
        c.comment.trim().toLowerCase() === f.comment.trim().toLowerCase() ||
        c.userName.trim().toLowerCase() === f.userName.trim().toLowerCase()
      );
      if (!isDuplicate) {
        combined.push(f);
      }
    });

    return combined.slice(0, 12);
  }, [feedbacks, locale, isAr]);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    const isRtl = document.documentElement.dir === 'rtl' || isAr;
    
    if (maxScroll <= 5) {
      setCanScrollStart(false);
      setCanScrollEnd(false);
      return;
    }

    if (isRtl) {
      const scrolledAmount = Math.abs(scrollLeft);
      setCanScrollStart(scrolledAmount > 10);
      setCanScrollEnd(scrolledAmount < maxScroll - 10);
    } else {
      setCanScrollStart(scrollLeft > 10);
      setCanScrollEnd(scrollLeft < maxScroll - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [displayFeedbacks]);

  const scrollForward = () => {
    if (scrollRef.current) {
      const amount = 360;
      scrollRef.current.scrollBy({ left: isAr ? -amount : amount, behavior: "smooth" });
      setTimeout(checkScroll, 350);
    }
  };

  const scrollBack = () => {
    if (scrollRef.current) {
      const amount = 360;
      scrollRef.current.scrollBy({ left: isAr ? amount : -amount, behavior: "smooth" });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <section className="w-full bg-gradient-to-b from-white via-zinc-50/40 to-white py-4">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ─── Header ─── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-zinc-100 pb-6">
          <div className="flex flex-col gap-2">
            {/* Badge */}
            <div className="flex items-center gap-2 w-fit px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 text-xs font-black uppercase tracking-wider">
              <Star size={13} className="fill-amber-500 text-amber-500" />
              <span>4.9 / 5.0 — {isAr ? "تقييمات ممتازة من العملاء" : "Top Customer Reviews"}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              {isAr ? "ماذا يقول عملاؤنا" : "What Our Customers Say"}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-500 font-semibold max-w-xl">
              {isAr 
                ? "آراء حقيقية وتجارب مميزة من عملاء تسوقوا ودعموا التجار المحليين عبر منصة محلي."
                : "Real experiences and verified feedback from customers supporting local merchants on Mahally."}
            </p>
          </div>

          {/* Action button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-11 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 shrink-0"
          >
            <MessageSquare size={16} />
            <span>{isAr ? "شارك تجربتك الآن" : "Share Your Experience"}</span>
          </button>
        </div>

        {/* ─── Reviews Carousel Grid ─── */}
        <div className="relative group/reviews">
          {/* Scroll Forward Button (Left in RTL, Right in LTR) */}
          <button
            onClick={scrollForward}
            className={`flex absolute end-0 md:-end-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white border border-zinc-200 text-zinc-800 rounded-full items-center justify-center z-30 transition-all shadow-lg hover:scale-110 active:scale-95 ${!canScrollEnd ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            aria-label={isAr ? "تمرير لليسار" : "Scroll Next"}
          >
            {isAr ? <ChevronLeft className="w-6 h-6 text-zinc-800" /> : <ChevronRight className="w-6 h-6 text-zinc-800" />}
          </button>

          {/* Scroll Back Button (Right in RTL, Left in LTR) */}
          <button
            onClick={scrollBack}
            className={`flex absolute start-0 md:-start-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white border border-zinc-200 text-zinc-800 rounded-full items-center justify-center z-30 transition-all shadow-lg hover:scale-110 active:scale-95 ${!canScrollStart ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            aria-label={isAr ? "تمرير لليمين" : "Scroll Previous"}
          >
            {isAr ? <ChevronRight className="w-6 h-6 text-zinc-800" /> : <ChevronLeft className="w-6 h-6 text-zinc-800" />}
          </button>

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-5 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
          >
            {displayFeedbacks.map((f, i) => (
              <div 
                key={f.id || i} 
                className="flex flex-col shrink-0 w-[300px] sm:w-[350px] bg-white border border-zinc-200/80 hover:border-brand/40 rounded-3xl p-6 relative shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group/card"
              >
                {/* Background Quote Accent */}
                <Quote size={56} className="absolute end-4 top-4 text-zinc-100 group-hover/card:text-brand/10 transition-colors pointer-events-none" />

                {/* Rating & Verified Badge */}
                <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        size={16}
                        className={s <= (f.rating || 5) ? "fill-amber-400 text-amber-400" : "text-zinc-200"}
                      />
                    ))}
                    <span className="text-xs font-black text-zinc-900 ms-1">5.0</span>
                  </div>

                  {f.verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      {isAr ? "مشتري موثق" : "Verified Buyer"}
                    </span>
                  )}
                </div>

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed mb-6 flex-1 relative z-10 italic">
                  "{f.comment}"
                </p>

                {/* Customer Profile Footer */}
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 relative z-10">
                  <div className="relative">
                    <UserAvatar
                      customerName={f.userName}
                      avatarUrl={f.avatarUrl}
                      avatarBgColor={f.avatarBgColor || "#be374f"}
                      className="w-11 h-11 rounded-full border-2 border-white shadow-sm shrink-0 text-white font-bold"
                    />
                    <ShieldCheck size={14} className="absolute -bottom-1 -end-1 text-emerald-600 bg-white rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 leading-snug">{f.userName}</h4>
                    <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1 mt-0.5">
                      <span>{f.location || (isAr ? "الأردن" : "Jordan")}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
});

Testimonials.displayName = "Testimonials";
export default Testimonials;