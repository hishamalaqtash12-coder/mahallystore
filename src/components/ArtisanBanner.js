"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

export default function ArtisanBanner() {
  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 lg:px-8">
      <div className="relative w-full h-[320px] bg-[#3665f3] rounded-2xl overflow-hidden flex flex-col md:flex-row items-center">
        {/* Text Content */}
        <div className="flex-1 p-8 md:p-12 z-10 text-white flex flex-col items-start justify-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Supporting Jordanian Artisans <br className="hidden md:block" />
            & Global Merchants.
          </h2>
          <p className="text-lg md:text-xl text-blue-50/90 font-medium mb-8 max-w-lg">
            Discover unique local craftsmanship and premium international brands,
            delivered directly to your doorstep in Jordan.
          </p>
          <Link
            href="/browse"
            className="px-8 py-3 bg-white text-[#3665f3] rounded-full font-bold text-[16px] hover:bg-blue-50 transition-all flex items-center gap-2 shadow-xl shadow-blue-900/20"
          >
            Shop the world <ChevronRight size={18} />
          </Link>
        </div>

        {/* eBay-style Floating Images on Right */}
        <div className="hidden md:flex flex-1 h-full relative items-center justify-center pr-12">
          <div className="grid grid-cols-2 gap-4 rotate-6 scale-110">
            <div className="w-32 h-40 bg-white rounded-lg shadow-2xl relative overflow-hidden transform -translate-y-4">
              <Image src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=300&auto=format&fit=crop" alt="Handcrafted home decor" fill className="object-cover" />
            </div>
            <div className="w-32 h-32 bg-white rounded-lg shadow-2xl relative overflow-hidden transform translate-x-4">
              <Image src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300&auto=format&fit=crop" alt="Premium accessories" fill className="object-cover" />
            </div>
            <div className="w-40 h-40 bg-[#FFDB00] rounded-full shadow-2xl relative overflow-hidden transform -translate-x-6 flex items-center justify-center p-6 border-4 border-white">
              <Image src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300&auto=format&fit=crop" alt="Luxury watch" fill className="object-contain p-4 mix-blend-multiply" />
            </div>
            <div className="w-32 h-48 bg-white rounded-lg shadow-2xl relative overflow-hidden transform -translate-y-8 translate-x-2">
              <Image src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=300&auto=format&fit=crop" alt="Smart watch" fill className="object-cover" />
            </div>
          </div>

          {/* Abstract background shapes */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-3xl -z-0" />
        </div>
      </div>
    </section>
  );
}
