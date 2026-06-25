"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  Flame
} from "lucide-react";
import { useState, useEffect, useMemo, useRef, memo } from "react";

const decodeEntities = (text) => {
  if (!text) return "";
  return text.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'");
};


const MerchantCarousel = memo(({ activeVendors }) => {
  const t = useTranslations("Hero");
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;

      if (scrollLeft <= 0 && document.documentElement.dir === 'rtl') {
        // Chrome/Firefox RTL: scrollLeft goes from 0 (right/start) to -maxScroll (left/end)
        setCanScrollRight(scrollLeft < -10); // Prev (Right)
        setCanScrollLeft(Math.abs(scrollLeft) < maxScroll - 10); // Next (Left)
      } else {
        // Fallback or LTR
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < maxScroll - 10);
      }
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 500);
    }
  };

  return (
    <div className="relative z-40 group/m-carousel bg-zinc-900 rounded-xl p-5 md:p-6 overflow-hidden shadow-2xl">
      {/* Collage Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 h-full w-full">
          {[
            "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=400&auto=format&fit=crop", // Tech
            "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=400&auto=format&fit=crop", // Fashion
            "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=400&auto=format&fit=crop", // Kitchen
            "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop", // Games
            "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=400&auto=format&fit=crop", // Books
            "https://images.unsplash.com/photo-1594035910387-fea47714263f?q=80&w=400&auto=format&fit=crop", // Perfumes
            "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=400&auto=format&fit=crop", // Digital
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=400&auto=format&fit=crop", // Home
            "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?q=80&w=400&auto=format&fit=crop", // Tools
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop", // Accessories
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop", // Shoes
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop"  // Headphones
          ].map((src, idx) => (
            <div key={idx} className="relative w-full h-full min-h-[150px]">
              <Image src={src} alt="Category Background" fill className="object-cover" priority={idx < 4} />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/80 to-[#111]/40"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-8 px-2 gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">{t("stores")}</h2>
          <div className="h-1.5 w-20 bg-brand rounded-full"></div>
          <p className="text-white/60 text-sm mt-1">{t("shopFromLocal")}</p>
        </div>
        {/* <Link href="/vendors" className="text-sm font-bold text-white/80 hover:text-white transition-colors flex items-center gap-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
          عرض جميع المتاجر<ChevronLeft size={14} />
        </Link> */}
      </div>

      <div className="relative z-10">
        {/* Scroll Buttons */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollRight}
          className={`hidden md:flex absolute start-0 md:-start-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full items-center justify-center z-50 transition-all shadow-xl hover:scale-110 active:scale-95 hover:bg-brand hover:border-brand ${!canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <ChevronLeft size={24} className="rtl:rotate-180" />
        </button>

        <button
          onClick={() => scroll('right')}
          disabled={!canScrollLeft}
          className={`hidden md:flex absolute end-0 md:-end-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full items-center justify-center z-50 transition-all shadow-xl hover:scale-110 active:scale-95 hover:bg-brand hover:border-brand ${!canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <ChevronRight size={24} className="rtl:rotate-180" />
        </button>

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 relative"
        >
          {/* First block: Solid yellow block */}
          <Link href="/vendors" className="flex flex-col p-5 bg-[#FFDB00] shrink-0 w-[160px] h-[200px] group/first hover:bg-[#E5C500] transition-all rounded-xl shadow-lg border border-black/10">
            <h3 className="text-[16px] font-bold text-black mt-2 underline group-hover:no-underline leading-tight">{t("viewAllMerchants")}</h3>
            <div className="mt-auto w-8 h-8 bg-black rounded-full flex items-center justify-center text-white shadow-sm">
              <ChevronLeft size={16} />
            </div>
          </Link>

          {activeVendors.map((vendor, i) => (
            <Link
              key={i}
              href={`/vendors/${vendor.id}`}
              className="flex flex-col shrink-0 w-[160px] h-[200px] bg-white group/v transition-all duration-300 rounded-xl border border-white/10 shadow-lg overflow-hidden"
            >
              {/* Top yellow banner */}
              <div className="bg-[#FFDB00] w-full text-center py-1.5 px-2 border-b border-black/5">
                <span className="text-[10px] font-bold text-black line-clamp-1 uppercase tracking-wider">{vendor.category}</span>
              </div>
              {/* Content area */}
              <div className="flex-1 flex flex-col items-center justify-center p-3 relative z-10">
                <div className="w-[80px] h-[80px] rounded-full overflow-hidden mb-3 relative border-[3px] border-zinc-100 shadow-sm group-hover/v:scale-105 transition-transform duration-500">
                  {vendor.logo ? (
                    <Image src={vendor.logo} alt={vendor.name || "Vendor"} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black text-white font-bold text-2xl">
                      {vendor.name[0]}
                    </div>
                  )}
                </div>
                <span className="text-[13px] font-bold text-zinc-900 mb-0.5 text-center w-full truncate px-1">{vendor.name}</span>
                <span className="text-[11px] font-bold text-brand group-hover/v:text-brand-dark group-hover/v:underline mt-1 flex items-center gap-1">
                  {t("shopNow")} <ChevronLeft size={12} />
                </span>
              </div>
            </Link>
          ))}
          {activeVendors.length === 0 && (
            <div className="w-[160px] h-[200px] flex items-center justify-center text-white/50 italic text-[13px] font-medium bg-white/5 rounded-xl border border-dashed border-white/20 backdrop-blur-sm">
              {t("searchingMerchants")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const CategoryCarousel = memo(({ categories }) => {
  const t = useTranslations("Hero");
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Filter out duplicates and Uncategorized
  const uniqueCategories = useMemo(() => {
    const seen = new Set();
    return (categories || []).filter(cat => {
      if (cat.name.toLowerCase() === 'uncategorized') return false;
      if (seen.has(cat.id)) return false;
      seen.add(cat.id);
      return true;
    });
  }, [categories]);


  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;

      if (scrollLeft <= 0 && document.documentElement.dir === 'rtl') {
        // Chrome/Firefox RTL: scrollLeft goes from 0 (right/start) to -maxScroll (left/end)
        setCanScrollRight(scrollLeft < -10); // Prev (Right)
        setCanScrollLeft(Math.abs(scrollLeft) < maxScroll - 10); // Next (Left)
      } else {
        // Fallback or LTR
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < maxScroll - 10);
      }
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 500);
    }
  };

  return (
    <div className="relative z-40 group/carousel">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-extrabold text-black tracking-tight">{t("exploreCategories")}</h2>
          <div className="h-1.5 w-20 bg-brand rounded-full"></div>
        </div>
        <Link href="/browse" className="text-sm font-bold text-zinc-500 hover:text-black transition-colors flex items-center gap-1">
          {t("viewAll")} <ChevronLeft size={16} />
        </Link>
      </div>

      <div className="relative px-2">
        {/* Persistent Navigation Buttons */}
        <button
          onClick={() => scroll('left')}
          className={`flex absolute start-0 md:-start-6 top-1/3 md:top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white border border-zinc-200 text-black rounded-full items-center justify-center z-50 transition-all shadow-xl hover:scale-110 active:scale-95 ${!canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          aria-label="Scroll Left"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 rtl:rotate-180" />
        </button>

        <button
          onClick={() => scroll('right')}
          className={`flex absolute end-0 md:-end-6 top-1/3 md:top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white border border-zinc-200 text-black rounded-full items-center justify-center z-50 transition-all shadow-xl hover:scale-110 active:scale-95 ${!canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          aria-label="Scroll Right"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 rtl:rotate-180" />
        </button>

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-start gap-3 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth relative snap-x snap-mandatory pb-4 pt-1"
        >
          {uniqueCategories.map((cat, i) => (
            <Link
              key={i}
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-2 md:gap-4 shrink-0 group/cat snap-start w-[100px] md:w-auto"
            >
              {/* Circular Category Icon */}
              <div className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] rounded-full bg-white border border-zinc-100 shadow-sm flex items-center justify-center overflow-hidden transition-all duration-500 group-hover/cat:shadow-xl group-hover/cat:scale-110 group-hover/cat:border-brand/30 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand/5 to-transparent opacity-0 group-hover/cat:opacity-100 transition-opacity"></div>
                <div className="w-full h-full relative z-10 transition-transform duration-500">
                  <Image
                    src={cat.image?.src || `https://placehold.co/200x200?text=${encodeURIComponent(cat.name[0])}`}
                    alt={decodeEntities(cat.name)}
                    fill
                    className="object-cover transition-transform duration-500 group-hover/cat:scale-110"
                  />
                </div>
              </div>

              {/* Category Details */}
              <div className="flex flex-col items-center gap-1 w-full px-1 md:px-2 mt-1">
                <span className="text-[12px] md:text-[15px] font-bold text-zinc-800 text-center group-hover/cat:text-brand transition-colors line-clamp-2 md:line-clamp-1 max-w-[140px] leading-tight">
                  {decodeEntities(cat.name)}
                </span>

                {cat.description && (
                  <span className="text-[11px] text-zinc-500 text-center line-clamp-1 max-w-[140px] leading-snug mt-0.5" title={decodeEntities(cat.description)}>
                    {decodeEntities(cat.description.replace(/<[^>]+>/g, ''))}
                  </span>
                )}

                {typeof cat.count !== 'undefined' && (
                  <span className={`text-[10px] font-bold tracking-widest ${cat.count === 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                    ({cat.count}) {t("product")}
                  </span>
                )}

                <div className="h-0.5 w-0 bg-brand group-hover/cat:w-12 mt-1 transition-all duration-300 rounded-full"></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
});


// const FlashDeals = memo(({ products }) => {
//   const scrollRef = useRef(null);
//   const [canScrollLeft, setCanScrollLeft] = useState(false);
//   const [canScrollRight, setCanScrollRight] = useState(true);

//   const deals = useMemo(() => {
//     return (products || []).filter((p) => p.on_sale && p.sale_price).slice(0, 10);
//   }, [products]);

//   const isEmpty = deals.length === 0;

//   const checkScroll = () => {
//     if (scrollRef.current) {
//       const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
//       setCanScrollLeft(scrollLeft > 0);
//       setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
//     }
//   };

//   useEffect(() => {
//     checkScroll();
//     window.addEventListener("resize", checkScroll);
//     return () => window.removeEventListener("resize", checkScroll);
//   }, [deals]);

//   const scroll = (direction) => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollBy({
//         left: direction === "left" ? -280 : 280,
//         behavior: "smooth",
//       });
//       setTimeout(checkScroll, 500);
//     }
//   };

//   return (
//     <div className="border border-zinc-200 rounded-xl overflow-hidden">
//       {/* Header with Gradient */}
//       <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white border-b border-red-600/10">
//         <div className="flex items-center gap-2">
//           <Zap size={14} className="text-white fill-white/20" />
//           <span className="text-[13px] font-bold tracking-tight uppercase">flash deals</span>
//           {!isEmpty && (
//             <span className="text-[9px] font-black text-white bg-white/20 backdrop-blur-md border border-white/30 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
//               live
//             </span>
//           )}
//         </div>
//         <div className="flex items-center gap-4">
//           <Link
//             href="/browse?onsale=true"
//             className="text-[12px] text-white/80 hover:text-white font-bold flex items-center gap-0.5 transition-colors uppercase tracking-tight"
//           >
//             all deals <ChevronRight size={13} />
//           </Link>
//         </div>
//       </div>


//       {/* Body */}
//       {isEmpty ? (
//         <div className="flex items-center justify-center gap-3 py-8 px-4 text-zinc-400">
//           <Clock size={16} />
//           <span className="text-[13px]">no active deals right now — check back soon</span>
//         </div>
//       ) : (
//         <div className="relative">
//           {/* Scroll left */}
//           <button
//             onClick={() => scroll("left")}
//             className={`absolute end-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-zinc-200 rounded-full flex items-center justify-center shadow-sm transition-opacity ${!canScrollLeft ? "opacity-0 pointer-events-none" : "opacity-100"
//               }`}
//           >
//             <ChevronLeft size={14} />
//           </button>

//           {/* Scroll right */}
//           <button
//             onClick={() => scroll("right")}
//             className={`absolute start-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-zinc-200 rounded-full flex items-center justify-center shadow-sm transition-opacity ${!canScrollRight ? "opacity-0 pointer-events-none" : "opacity-100"
//               }`}
//           >
//             <ChevronRight size={14} />
//           </button>

//           <div
//             ref={scrollRef}
//             onScroll={checkScroll}
//             className="flex overflow-x-auto no-scrollbar divide-x divide-zinc-100"
//           >
//             {deals.map((deal, i) => {
//               const discount = Math.round(
//                 ((deal.regular_price - deal.sale_price) / deal.regular_price) * 100
//               );

//               // Actual Data Logic for sold percentage
//               // Formula: (Sales) / (Sales + Stock) * 100
//               const totalSales = parseInt(deal.total_sales || 0);
//               const stock = parseInt(deal.stock_quantity || 10); // Assume 10 if not managed
//               const totalInitial = totalSales + stock;
//               const claimedPercent = totalInitial > 0 ? Math.min(Math.round((totalSales / totalInitial) * 100), 99) : 0;
//               // Add a minimum visual fill if sales exist
//               const displayPercent = totalSales > 0 ? Math.max(claimedPercent, 15) : 5;

//               return (
//                 <Link
//                   key={i}
//                   href={`/product/${deal.slug}`}
//                   className="flex flex-col shrink-0 w-[130px] p-3 gap-1.5 hover:bg-zinc-50 transition-colors"
//                 >
//                   {/* Image */}
//                   <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100">
//                     <Image
//                       src={deal.images?.[0]?.src || "https://placehold.co/130x130"}
//                       alt={deal.name}
//                       fill
//                       className="object-cover"
//                     />
//                     <span className="absolute top-1 end-1 text-[10px] font-medium bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded">
//                       −{discount}%
//                     </span>
//                   </div>

//                   {/* Name */}
//                   <p className="text-[12px] text-zinc-700 line-clamp-2 leading-snug h-8">
//                     {deal.name}
//                   </p>

//                   {/* Price */}
//                   <div className="flex items-baseline gap-1.5">
//                     <span className="text-[13px] font-medium text-zinc-900">
//                       JOD {deal.sale_price}
//                     </span>
//                     <span className="text-[11px] text-zinc-400 line-through">
//                       JOD {deal.regular_price}
//                     </span>
//                   </div>

//                   {/* Progress */}
//                   <div>
//                     <div className="h-[3px] w-full bg-zinc-100 rounded-full overflow-hidden">
//                       <div
//                         className="h-full bg-red-400 rounded-full"
//                         style={{ width: `${displayPercent}%` }}
//                       />
//                     </div>
//                     <p className="mt-1 text-[10px] text-zinc-400">{displayPercent}% sold</p>
//                   </div>
//                 </Link>
//               );
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// const SingleCard = memo(({ title, item, link }) => (
//   <div className="bg-white p-6 flex flex-col h-[440px] border border-zinc-200 hover:border-black transition-colors relative z-10 group box-border">
//     <h2 className="text-[20px] font-bold text-black mb-4 truncate">{title}</h2>
//     <Link href={link} className="flex-1 relative mb-5 block overflow-hidden bg-[#F5F5F5]">
//       <Image
//         src={item?.images?.[0]?.src || "https://placehold.co/400x400"}
//         alt={item.name || title}
//         fill
//         className="object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
//       />
//     </Link>
//     <Link href={link} className="text-[13px] font-bold text-black hover:underline mt-auto inline-block">
//       {title.includes("Top") ? "Shop now" : "Explore more"}
//     </Link>
//   </div>
// ));

const QuadCard = memo(({ title, items, link }) => {
  const t = useTranslations("Hero");
  return (
    <div className="bg-white p-6 flex flex-col h-[440px] border border-zinc-200 hover:border-black transition-colors relative z-10 group box-border">
      <h2 className="text-[20px] font-bold text-black mb-4 truncate">{title}</h2>
      <div className="grid grid-cols-2 gap-4 flex-1 mb-5">
        {items.map((item, i) => (
          <Link href={`/product/${item.slug}`} key={i} className="flex flex-col gap-2 cursor-pointer group/item">
            <div className="relative aspect-square overflow-hidden bg-[#F5F5F5]">
              <Image
                src={item?.images?.[0]?.src || "https://placehold.co/400x400"}
                alt={item.name}
                fill
                className="object-cover mix-blend-multiply group-hover/item:scale-105 transition-transform duration-500"
              />
            </div>
            <span className="text-[12px] text-black line-clamp-1 group-hover/item:underline">{item.name}</span>
          </Link>
        ))}
      </div>
      <Link href={link} className="text-[13px] font-bold text-black hover:underline mt-auto inline-block">
        {t("viewMore")}
      </Link>
    </div>
  );
});
export default function Hero({ products = [], categories = [], vendors = [] }) {
  const t = useTranslations("Hero");
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeVendors = useMemo(() => {
    return (vendors || []).map(v => {
      const meta = Object.fromEntries((v.meta_data || []).map(m => [m.key, m.value]));
      return {
        id: v.id,
        name: (meta.dokan_profile_settings && meta.dokan_profile_settings.store_name) || meta.store_name || meta.mahally_store_name || meta.dokan_store_name || v.store_name || (v.store && v.store.name) || `${v.first_name} ${v.last_name}`.trim() || "Store",
        slug: v.store_slug || (v.store && v.store.slug) || meta.mahally_store_slug || v.id,
        description: v.store_description || meta.mahally_store_description || "",
        category: meta.mahally_store_category || t("generalMerchant"),
        logo: v.gravatar || (v.store && v.store.gravatar) || meta.mahally_avatar_url || meta.mahally_store_logo || null,
        showInCarousel: meta.mahally_show_in_carousel
      };
    }).filter(v => v.showInCarousel !== 'no');
  }, [vendors, t]);

  // Mock Amazon-style banners (representing gaming, fashion, home etc)
  const banners = [
    {
      title: t("bannerLocalMarket"),
      subtitle: t("bannerLocalSubtitle"),
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop",
      bg: "bg-zinc-100"
    },
    {
      title: t("bannerTech"),
      subtitle: t("bannerTechSubtitle"),
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop",
      bg: "bg-zinc-100"
    },
    {
      title: t("bannerFashion"),
      subtitle: t("bannerFashionSubtitle"),
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
      bg: "bg-zinc-200"
    },
    {
      title: t("bannerHome"),
      subtitle: t("bannerHomeSubtitle"),
      image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2070&auto=format&fit=crop",
      bg: "bg-zinc-100"
    },
    {
      title: t("bannerBeauty"),
      subtitle: t("bannerBeautySubtitle"),
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=2070&auto=format&fit=crop",
      bg: "bg-zinc-100"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Dynamically generate cards based on products
  // const cardsData = useMemo(() => {
  //   const generatedCards = [];
  //   const usedTitles = new Set();
  //   const usedProductIds = new Set();

  //   if (products && products.length > 0) {
  //     // 1. Top Sellers
  //     const topSellers = [...products]
  //       .filter(p => !usedProductIds.has(p.id))
  //       .sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0));

  //     if (topSellers.length >= 4) {
  //       const items = topSellers.slice(0, 4);
  //       generatedCards.push({
  //         title: "Top Sellers",
  //         type: "quad",
  //         items,
  //         link: "/browse?sort=popularity"
  //       });
  //       items.forEach(p => usedProductIds.add(p.id));
  //       usedTitles.add("Top Sellers");
  //     }

  //     // 2. Top Rated
  //     const topRated = [...products]
  //       .filter(p => !usedProductIds.has(p.id))
  //       .sort((a, b) => Number(b.average_rating || 0) - Number(a.average_rating || 0));

  //     if (topRated.length >= 4) {
  //       const items = topRated.slice(0, 4);
  //       generatedCards.push({
  //         title: "Top Rated",
  //         type: "quad",
  //         items,
  //         link: "/browse?sort=rating"
  //       });
  //       items.forEach(p => usedProductIds.add(p.id));
  //       usedTitles.add("Top Rated");
  //     }

  //     // 3. Group by Categories
  //     const categoryGroups = {};
  //     products.forEach(p => {
  //       if (usedProductIds.has(p.id)) return;
  //       p.categories?.forEach(cat => {
  //         if (!categoryGroups[cat.name]) categoryGroups[cat.name] = [];
  //         if (!categoryGroups[cat.name].find(item => item.id === p.id)) {
  //           categoryGroups[cat.name].push(p);
  //         }
  //       });
  //     });

  //     const availableCategories = Object.keys(categoryGroups)
  //       .filter(name => name !== 'Uncategorized')
  //       .map(name => ({
  //         name,
  //         slug: products.find(p => p.categories.some(c => c.name === name))?.categories.find(c => c.name === name)?.slug || "",
  //         products: categoryGroups[name]
  //       }))
  //       .sort((a, b) => b.products.length - a.products.length);

  //     for (const cat of availableCategories) {
  //       if (usedTitles.has(cat.name)) continue;
  //       const unusedProducts = cat.products.filter(p => !usedProductIds.has(p.id));

  //       if (unusedProducts.length >= 4) {
  //         const items = unusedProducts.slice(0, 4);
  //         generatedCards.push({
  //           title: cat.name,
  //           type: "quad",
  //           items,
  //           link: `/browse?cat=${cat.slug}`
  //         });
  //         items.forEach(p => usedProductIds.add(p.id));
  //         usedTitles.add(cat.name);
  //       } else if (unusedProducts.length > 0) {
  //         const item = unusedProducts[0];
  //         generatedCards.push({
  //           title: cat.name,
  //           type: "single",
  //           item,
  //           link: `/product/${item.slug}`
  //         });
  //         usedProductIds.add(item.id);
  //         usedTitles.add(cat.name);
  //       }

  //       if (generatedCards.length >= 8) break;
  //     }
  //   }

  //   return generatedCards;
  // }, [products]);


  return (
    <div className="w-full bg-white font-sans relative">

      {/* 1. HERO SLIDER */}
      <div className="relative w-full h-[340px] sm:h-[450px] lg:h-[500px] overflow-hidden">
        {banners.map((banner, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <Image
              src={banner.image}
              alt={banner.title}
              fill
              className="object-cover object-center"
              priority={i < 3}
            />
            {/* Smooth gradient that transitions perfectly into white background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 via-40% to-white to-[100%]" />

            <div className="absolute top-[60px] lg:top-[100px] left-1/2 -translate-x-1/2 text-center z-10 w-full px-4 max-w-5xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-4 sm:mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] tracking-tight leading-tight">{banner.title}</h1>
              <p className="text-base sm:text-lg lg:text-2xl text-white/95 font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] max-w-2xl mx-auto">{banner.subtitle}</p>
            </div>
          </div>
        ))}

        {/* Slider Controls - Kept circular as seen in screenshots */}
        <button
          onClick={() => setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length)}
          className="hidden sm:flex absolute start-6 top-1/3 -translate-y-1/2 w-12 h-12 items-center justify-center group z-20 bg-black rounded-full transition-transform hover:scale-110"
        >
          <ChevronLeft size={24} className="text-white rtl:rotate-180" />
        </button>
        <button
          onClick={() => setCurrentSlide(prev => (prev + 1) % banners.length)}
          className="hidden sm:flex absolute end-6 top-1/3 -translate-y-1/2 w-12 h-12 items-center justify-center group z-20 bg-black rounded-full transition-transform hover:scale-110"
        >
          <ChevronRight size={24} className="text-white rtl:rotate-180" />
        </button>
      </div>

      {/* 2. MAIN CONTENT GRID */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 relative -mt-[140px] sm:-mt-[130px] lg:-mt-[140px] z-30 flex flex-col gap-6 lg:gap-10">
        <MerchantCarousel activeVendors={activeVendors} />
        <CategoryCarousel categories={categories} />

        {/* {cardsData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cardsData.slice(0, 4).map((card, i) => (
              card.type === "single" ? (
                <SingleCard key={i} title={card.title} item={card.item} link={card.link} />
              ) : (
                <QuadCard key={i} title={card.title} items={card.items} link={card.link} />
              )
            ))}
          </div>
        )} */}

      </div>

      {/* 3. ADDITIONAL ROW */}
      {/* {cardsData.length > 4 && (
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cardsData.slice(4, 8).map((card, i) => (
              card.type === "single" ? (
                <SingleCard key={i} title={card.title} item={card.item} link={card.link} />
              ) : (
                <QuadCard key={i} title={card.title} items={card.items} link={card.link} />
              )
            ))}
          </div>
        </div>
      )} */}

    </div>
  );
}
