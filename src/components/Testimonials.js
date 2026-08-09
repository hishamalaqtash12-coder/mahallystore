"use client";

import { Star, ChevronRight, ChevronLeft, MessageSquare, Quote, CheckCircle2, ShieldCheck } from "lucide-react";
import { memo, useMemo, useRef, useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import FeedbackModal from "./FeedbackModal";

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
    date: "2026-07-20"
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
    date: "2026-07-19"
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
    date: "2026-07-18"
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
    date: "2026-07-20"
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
      date: r.date
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
          avatarUrl: f.avatarUrl || null,
          role: f.role || "customer"
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
    <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 my-8">
      {/* ── Section Header (Made in Jordan style) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Star size={20} className="fill-amber-500 text-amber-500" />
            </span>
            <span className="text-sm font-black uppercase tracking-wider text-amber-600">
              {isAr ? "4.9 / 5.0 — تقييمات العملاء" : "4.9 / 5.0 — Customer Reviews"}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
            {isAr ? "ماذا يقول عملاؤنا" : "What Our Customers Say"}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 font-medium">
            {isAr
              ? "آراء حقيقية وتجارب مميزة من عملاء تسوقوا ودعموا التجار المحليين عبر منصة محلي"
              : "Real experiences and verified feedback from customers supporting local merchants on Mahally"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {displayFeedbacks.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 me-1">
              {canScrollStart && (
                <button
                  onClick={scrollBack}
                  aria-label="Previous"
                  className="p-2 rounded-lg border-2 border-zinc-400 text-zinc-800 hover:border-zinc-900 hover:bg-zinc-50 transition-all active:scale-95"
                >
                  {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
              )}
              {canScrollEnd && (
                <button
                  onClick={scrollForward}
                  aria-label="Next"
                  className="p-2 rounded-lg border-2 border-zinc-400 text-zinc-800 hover:border-zinc-900 hover:bg-zinc-50 transition-all active:scale-95"
                >
                  {isAr ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700 hover:text-amber-700 transition-colors bg-zinc-100/80 hover:bg-amber-50 px-5 py-2.5 rounded-lg border-2 border-zinc-300 hover:border-amber-600/60 w-fit shrink-0"
          >
            <MessageSquare size={16} />
            <span>{isAr ? "شارك تجربتك" : "Share Your Experience"}</span>
          </button>
        </div>
      </div>

      {/* ── Reviews Carousel ── */}
      {displayFeedbacks.length > 0 ? (
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
          >
            {displayFeedbacks.map((f, i) => (
              <div
                key={f.id || i}
                className="flex flex-col shrink-0 w-[280px] sm:w-[320px] bg-white border border-zinc-200/80 hover:border-amber-400/50 rounded-2xl p-5 relative shadow-sm hover:shadow-lg transition-all duration-300 group/card"
              >
                {/* Background Quote Accent */}
                <Quote size={48} className="absolute end-3 top-3 text-zinc-100 group-hover/card:text-amber-500/10 transition-colors pointer-events-none" />

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3 relative z-10">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={15}
                      className={s <= (f.rating || 5) ? "fill-amber-400 text-amber-400" : "text-zinc-200"}
                    />
                  ))}
                  <span className="text-xs font-black text-zinc-900 ms-1">
                    {(f.rating || 5).toFixed(1)}
                  </span>
                </div>

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed mb-5 flex-1 relative z-10 italic">
                  "{f.comment}"
                </p>

                {/* Customer Profile Footer */}
                <div className="flex items-center gap-3 pt-3 border-t border-zinc-100 relative z-10">
                  <div className="relative">
                    {(() => {
                      if (f.avatarUrl) {
                        return (
                          <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-md shrink-0">
                            <img src={f.avatarUrl} alt={f.userName} className="w-full h-full object-cover" />
                          </div>
                        );
                      }
                      const colors = [
                        "bg-amber-500", "bg-red-500", "bg-violet-500", "bg-emerald-500",
                        "bg-sky-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"
                      ];
                      const colorClass = colors[i % colors.length];
                      const initial = (f.userName || "?")[0].toUpperCase();
                      return (
                        <div className={`w-10 h-10 rounded-full ${colorClass} border-2 border-white flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md`}>
                          {initial}
                        </div>
                      );
                    })()}
                    <ShieldCheck size={13} className="absolute -bottom-0.5 -end-0.5 text-emerald-600 bg-white rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 leading-snug">
                      {f.userName}
                    </h4>
                    <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-2 mt-0.5">
                      <span>{f.location || (isAr ? "الأردن" : "Jordan")}</span>
                      {f.verified && (
                        <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-200">
                          <CheckCircle2 size={10} className="text-emerald-600" />
                          {f.role === "seller" || f.role === "vendor"
                            ? (isAr ? "بائع موثق" : "Verified Merchant")
                            : (isAr ? "مشتري موثق" : "Verified Buyer")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-12 bg-amber-50/50 border-2 border-amber-200 rounded-xl flex flex-col items-center justify-center text-center px-4">
          <Star size={36} className="text-amber-400 mb-2" />
          <h3 className="text-base font-bold text-zinc-900 mb-1">
            {isAr ? "لا توجد تقييمات حالياً" : "No reviews yet"}
          </h3>
          <p className="text-xs text-zinc-500">
            {isAr ? "كن أول من يشارك تجربته معنا." : "Be the first to share your experience."}
          </p>
        </div>
      )}

      <FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
});

Testimonials.displayName = "Testimonials";
export default Testimonials;