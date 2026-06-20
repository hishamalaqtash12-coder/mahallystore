"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Store, MapPin, ChevronRight, Star, Loader2, Filter, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function VendorsPage() {
  const { wooId } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [followedStores, setFollowedStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [minRating, setMinRating] = useState(null);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState("Featured");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, fRes] = await Promise.all([
          fetch(`/api/vendors?t=${Date.now()}`, { cache: 'no-store' }),
          wooId ? fetch(`/api/messages/conversations?userId=${wooId}&t=${Date.now()}`, { cache: 'no-store' }) : Promise.resolve({ json: () => ({}) })
        ]);

        const vData = await vRes.json();
        setVendors(Array.isArray(vData.vendors) ? vData.vendors : []);

        if (wooId) {
          const uRes = await fetch(`/api/vendors/follow/status?userId=${wooId}&t=${Date.now()}`, { cache: 'no-store' });
          const uData = await uRes.json();
          setFollowedStores(uData.followed || []);
        }
      } catch (err) {
        console.error("Vendors fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [wooId]);

  const handleToggleFollow = async (vId) => {
    if (!wooId) return;
    if (loadingStores[vId]) return;
    setLoadingStores(prev => ({ ...prev, [vId]: true }));
    const isFollowing = followedStores.some(id => String(id) === String(vId));
    const action = isFollowing ? 'unfollow' : 'follow';

    // Optimistic UI
    setFollowedStores(prev =>
      action === 'follow' ? [...prev, vId] : prev.filter(id => String(id) !== String(vId))
    );

    try {
      await fetch("/api/vendors/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: vId, userId: wooId, action })
      });
    } catch (err) {
      console.error("Follow error:", err);
      // Rollback
      setFollowedStores(prev =>
        action === 'unfollow' ? [...prev, vId] : prev.filter(id => String(id) !== String(vId))
      );
    } finally {
      setLoadingStores(prev => ({ ...prev, [vId]: false }));
    }
  };

  const categories = ["All", ...Array.from(new Set(vendors.map((v) => v.storeCategory).filter(Boolean)))];

  const filtered = vendors.filter((v) => {
    const matchQ = !query ||
      v.storeName.toLowerCase().includes(query.toLowerCase()) ||
      v.storeDescription?.toLowerCase().includes(query.toLowerCase());
    const matchC = catFilter === "All" || v.storeCategory === catFilter;
    const matchR = !minRating || Math.round(v.rating || 0) >= minRating;
    const matchV = !onlyVerified || v.isVerified; // Assuming isVerified exists or check meta

    return matchQ && matchC && matchR && matchV;
  }).sort((a, b) => {
    if (sortBy === "Top Rated") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "Newest") return new Date(b.dateCreated || 0) - new Date(a.dateCreated || 0);
    return 0; // Featured/Default
  });

  return (
    <div className="min-h-screen bg-white pb-20">

      {/* Search Header */}
      <div className="bg-[#fcfcfc] border-b border-zinc-200 py-8 px-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-[28px] font-medium text-zinc-900 leading-tight">دليل المتاجر</h1>
              <p className="text-[14px] text-zinc-600 mt-1">اكتشف وتابع تجارك المحلية المفضلة على محلي.</p>
            </div>

            <div className="relative w-full max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن المتاجر بالاسم أو الوصف..."
                className="w-full h-11 bg-white border border-zinc-300 rounded-md pl-11 pr-4 text-[14px] outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-8 flex gap-8">

        {/* Sidebar Filters */}
        <aside className="w-[240px] shrink-0 hidden md:block">
          <div className="border-b border-zinc-200 pb-3 mb-4">
            <h2 className="text-[14px] font-bold text-zinc-900">القسم</h2>
          </div>
          <ul className="space-y-1">
            {categories.map((c) => (
              <li key={c}>
                <button
                  onClick={() => setCatFilter(c)}
                  className={`text-[13px] w-full text-right py-1 hover:text-brand transition-colors ${catFilter === c ? "font-bold text-zinc-950" : "text-brand-dark"}`}
                >
                  {c === "All" ? "الكل" : c}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-8 border-b border-zinc-200 pb-3 mb-4">
            <h2 className="text-[14px] font-bold text-zinc-900">تقييم المتجر</h2>
          </div>
          <div className="space-y-1">
            {[4, 3, 2, 1].map(stars => (
              <button
                key={stars}
                onClick={() => setMinRating(minRating === stars ? null : stars)}
                className="flex items-center gap-1.5 py-1 w-full group"
              >
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={15} className={i <= stars ? "fill-[#FFA41C] text-[#FFA41C]" : "text-zinc-200 fill-zinc-200"} />
                  ))}
                </div>
                <span className={`text-[13px] ${minRating === stars ? "font-bold text-brand" : "text-zinc-600 group-hover:text-brand"}`}>وأعلى</span>
              </button>
            ))}
          </div>

          <div className="mt-8 border-b border-zinc-200 pb-3 mb-4">
            <h2 className="text-[14px] font-bold text-zinc-900">حالة التاجر</h2>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setOnlyVerified(!onlyVerified)}>
              <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${onlyVerified ? 'bg-brand border-brand' : 'border-zinc-300'}`}>
                {onlyVerified && <CheckCircle size={10} className="text-white" />}
              </div>
              <span className="text-[13px] text-zinc-700 group-hover:text-brand">المتاجر الموثقة فقط</span>
            </label>
          </div>

        </aside>

        {/* Main Content */}
        <div className="flex-1">

          <div className="flex items-center justify-between mb-6 pb-2 border-b border-zinc-100">
            <span className="text-[14px] text-zinc-600">
              {loading ? "جارٍ تحميل المتاجر..." : `${filtered.length} متجرًا`}
            </span>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-zinc-500">ترتيب حسب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-zinc-50 border border-zinc-300 rounded-md px-2 py-1 outline-none text-[13px] font-medium"
              >
                <option value="Featured">مميزة</option>
                <option value="Newest">الأحدث</option>
                <option value="Top Rated">الأعلى تقييمًا</option>
              </select>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-zinc-200 rounded-md p-4 animate-pulse">
                  <div className="h-40 bg-zinc-100 rounded-md mb-4" />
                  <div className="h-4 bg-zinc-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-zinc-50 rounded w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">🏪</div>
              <h3 className="text-[18px] font-bold text-zinc-900">لا توجد متاجر مطابقة للبحث</h3>
              <p className="text-sm text-zinc-500 mt-1">جرّب كلمات مختلفة أو أعد ضبط الفلاتر.</p>
              <button
                onClick={() => { setQuery(""); setCatFilter("All"); }}
                className="mt-4 text-[13px] text-brand-dark font-medium hover:underline"
              >
                مسح جميع الفلاتر
              </button>
            </div>
          )}

          {/* Vendor Cards Grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((v) => (
                <div key={v.id} className="flex flex-col border border-zinc-200 rounded-md overflow-hidden hover:shadow-lg transition-shadow group bg-white">

                  {/* Store Header/Banner */}
                  <Link href={`/vendors/${v.id}`} className="relative h-32 bg-zinc-100 overflow-hidden">
                    {v.storeBanner ? (
                      <Image
                        src={v.storeBanner}
                        alt={v.storeName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-100" />
                    )}
                    <div className="absolute inset-0 bg-black/5" />

                    {/* Logo Overlay */}
                    <div className="absolute -bottom-6 left-4 w-16 h-16 rounded-md bg-white border border-zinc-200 shadow-md overflow-hidden p-1 flex items-center justify-center">
                      {v.storeLogo ? (
                        <Image src={v.storeLogo} alt={v.storeName || "Vendor Logo"} fill className="object-contain p-1" />
                      ) : (
                        <span className="text-zinc-900 font-bold text-xl">{v.storeName[0]?.toUpperCase()}</span>
                      )}
                    </div>
                  </Link>

                  {/* Store Body */}
                  <div className="pt-8 pb-5 px-5 flex flex-col flex-1">
                    <Link href={`/vendors/${v.id}`} className="block">
                      <h2 className="text-[17px] font-bold text-zinc-900 hover:text-brand transition-colors leading-tight">
                        {v.storeName}
                      </h2>
                    </Link>

                    <div className="flex items-center gap-2 mt-1 mb-3">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={`${i < Math.round(v.rating || 0) ? 'text-[#FFA41C] fill-[#FFA41C]' : 'text-zinc-200 fill-zinc-200'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[12px] text-brand-dark hover:text-brand cursor-pointer">
                        {v.rating > 0 ? `${v.rating.toFixed(1)} تقييم` : "متجر جديد"}
                      </span>
                    </div>

                    {v.storeCategory && (
                      <span className="text-[12px] font-medium text-zinc-500 mb-2">{v.storeCategory}</span>
                    )}

                    {v.storeDescription && (
                      <p className="text-[13px] text-zinc-600 line-clamp-2 mb-4 leading-normal flex-1">
                        {v.storeDescription}
                      </p>
                    )}

                    <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
                      <Link
                        href={`/vendors/${v.id}`}
                        className="text-[13px] font-medium text-brand hover:text-brand-dark hover:underline flex items-center gap-1"
                      >
                        زيارة المتجر <ChevronRight size={14} className="rtl:-scale-x-100" />
                      </Link>

                      {Number(v.id) !== Number(wooId) && (
                        <button
                          onClick={() => handleToggleFollow(v.id)}
                          disabled={loadingStores[v.id]}
                          className={`cursor-pointer h-8 px-4 rounded-md text-[12px] font-medium shadow-sm transition-all border flex items-center justify-center gap-1.5 group ${followedStores.some(id => String(id) === String(v.id))
                              ? 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                              : 'bg-brand hover:bg-brand-dark text-white border-brand'
                            } ${loadingStores[v.id] ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {loadingStores[v.id] && (
                            <span className="w-3.5 h-3.5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                          )}
                          {followedStores.some(id => String(id) === String(v.id)) ? (
                            <>
                              <span className="group-hover:hidden">متابع</span>
                              <span className="hidden group-hover:inline">إلغاء المتابعة</span>
                            </>
                          ) : (
                            <>متابعة</>
                          )}
                        </button>
                      )}
                    </div>
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
