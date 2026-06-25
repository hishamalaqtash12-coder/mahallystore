"use client";

import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { Heart, Search, Store, Trash2, ChevronRight, ArrowRight, Package, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { getProductMerchant } from "@/lib/product-utils";

export default function WishlistPage() {
  const { wishlist, clearWishlist } = useWishlist();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("all");

  // --- Derived: Filter logic ---
  const uniqueVendors = useMemo(() => {
    const map = new Map();
    wishlist.forEach(p => {
      const { name, id } = getProductMerchant(p);
      if (name && id) map.set(id.toString(), name);
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [wishlist]);

  const filteredWishlist = useMemo(() => {
    return wishlist.filter(p => {
      const { name: merchantName, id: merchantId } = getProductMerchant(p);
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            merchantName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVendor = selectedVendor === "all" || merchantId?.toString() === selectedVendor;
      return matchesSearch && matchesVendor;
    });
  }, [wishlist, searchQuery, selectedVendor]);

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-12 rounded-3xl border border-zinc-200 shadow-sm max-w-md w-full text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={36} className="text-rose-300" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">قائمة المفضلة فارغة</h1>
          <p className="text-zinc-500 mb-8 text-sm">احفظ المنتجات التي تعجبك لتتبعها هنا.</p>
          <Link href="/browse" className="inline-flex items-center gap-2 h-12 px-8 bg-brand hover:bg-brand-dark rounded-full text-sm font-bold text-white transition-all">
            ابدأ التسوق <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
              <Link href="/" className="hover:text-zinc-900">الرئيسية</Link>
              <ChevronRight size={10} />
              <span className="text-zinc-900 font-medium">المفضلة</span>
            </div>
            <h1 className="text-[32px] font-black text-zinc-900 flex items-center gap-3">
              قوائمك <span className="text-zinc-300 font-medium text-[20px]">({wishlist.length})</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search bar */}
            <div className="relative group">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand transition-colors" size={14} />
              <input 
                type="text"
                placeholder="ابحث عن المنتجات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pe-10 ps-10 bg-white border border-zinc-200 rounded-xl text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none w-full md:w-64 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Vendor Filter */}
            {uniqueVendors.length > 0 && (
              <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 h-10 shadow-sm">
                <Store size={14} className="text-zinc-400" />
                <select 
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="text-sm bg-transparent outline-none cursor-pointer font-semibold text-zinc-700 ps-2"
                >
                  <option value="all">جميع المتاجر</option>
                  {uniqueVendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button 
              onClick={clearWishlist}
              className="h-10 px-4 flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-rose-500 transition-colors"
            >
              <Trash2 size={16} /> مسح القائمة
            </button>
          </div>
        </div>

        {/* Advanced Compact Grid */}
        {filteredWishlist.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredWishlist.map((product) => (
              <div key={product.id} className="h-full transform hover:translate-y-[-4px] transition-transform duration-300">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 bg-white rounded-[32px] border border-zinc-100 text-center shadow-sm">
            <Package size={48} className="mx-auto text-zinc-100 mb-4" />
            <p className="text-zinc-400 font-semibold text-lg">لا توجد نتائج</p>
            <p className="text-zinc-300 text-sm">جرّب تعديل الفلاتر أو مصطلح البحث</p>
            <button 
              onClick={() => { setSearchQuery(""); setSelectedVendor("all"); }}
              className="mt-6 text-brand font-bold text-sm hover:underline"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
