"use client";

import { 
  Shirt, CreditCard, Sparkles, UtensilsCrossed, Coffee, 
  Smartphone, Car, Glasses, Home, BookOpen, Pill, 
  Pencil, Dog, Heart, Gift, Gamepad2, Download, Tent,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useRef } from "react";

const categories = [
  { name: "الملابس", icon: Shirt, slug: "clothing" },
  { name: "الأطعمة", icon: UtensilsCrossed, slug: "foods" },
  { name: "الألعاب", icon: Gamepad2, slug: "games" },
  { name: "الإلكترونيات", icon: Smartphone, slug: "electronics" },
  { name: "البطاقات الرقمية", icon: CreditCard, slug: "digital-cards" },
  { name: "الحيوانات الأليفة", icon: Dog, slug: "pets" },
  { name: "المنزل والمعيشة", icon: Home, slug: "home", active: true },
  { name: "الجمال والعناية", icon: Sparkles, slug: "beauty" },
  { name: "الصيدلية", icon: Pill, slug: "pharmacy" },
  { name: "القرطاسية", icon: Pencil, slug: "stationery" },
  { name: "الكتب", icon: BookOpen, slug: "books" },
  { name: "الهواء الطلق", icon: Tent, slug: "outdoor" },
  { name: "قطع السيارات", icon: Car, slug: "car-parts" },
  { name: "القهوة", icon: Coffee, slug: "coffee" },
  { name: "المنتجات الرقمية", icon: Download, slug: "digital-products" },
  { name: "الهدايا", icon: Gift, slug: "gifts" },
  { name: "النظارات", icon: Glasses, slug: "eyewear" },
];

export default function CategoryNav() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="bg-white border-b border-zinc-100 sticky top-[72px] z-30 shadow-sm overflow-hidden">
      <div className="container mx-auto px-4 relative group">
        {/* Navigation Buttons */}
        <button 
          onClick={() => scroll("right")}
          className="absolute start-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white shadow-md border border-zinc-100 text-zinc-400 hover:text-brand transition-colors lg:opacity-0 lg:group-hover:opacity-100"
        >
          <ChevronRight size={18} />
        </button>
        <button 
          onClick={() => scroll("left")}
          className="absolute end-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white shadow-md border border-zinc-100 text-zinc-400 hover:text-brand transition-colors lg:opacity-0 lg:group-hover:opacity-100"
        >
          <ChevronLeft size={18} />
        </button>

        <div 
          ref={scrollRef}
          className="flex items-center gap-10 py-4 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {categories.map((cat, i) => (
            <Link 
              key={i} 
              href={`/browse?cat=${cat.slug}`}
              className="flex flex-col items-center gap-2 min-w-fit group/item cursor-pointer relative"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${cat.active ? 'bg-brand text-white shadow-lg shadow-brand/20 scale-110' : 'bg-zinc-50 text-zinc-400 group-hover/item:bg-white group-hover/item:shadow-xl group-hover/item:text-brand'}`}>
                <cat.icon size={22} strokeWidth={cat.active ? 2.5 : 1.5} />
              </div>
              <span className={`text-[11px] font-black uppercase tracking-tighter whitespace-nowrap transition-colors ${cat.active ? 'text-brand italic' : 'text-zinc-500 group-hover/item:text-zinc-950'}`}>
                {cat.name}
              </span>
              {cat.active && (
                <div className="absolute -bottom-4 w-6 h-1 bg-brand rounded-full" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
