"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/ProductCard";
import {
  ArrowLeft, Star, MapPin, Mail, Phone as PhoneIcon, ShoppingCart,
  Heart, Package, CheckCircle, ChevronRight, Store, Grid3X3, List,
  Camera, MessageSquare, UserPlus, Settings, Share2, Users, Loader2,
  Search, Info, ShieldCheck, User, ShieldAlert
} from "lucide-react";
import ReportModal from "@/components/ReportModal";
import QuickLookModal from "@/components/QuickLookModal";

export default function VendorProfilePage() {
  const params = useParams();
  const slug = params?.slug;
  const { user, wooId, messagingEnabled } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [view, setView] = useState("grid");
  const [activeTab, setActiveTab] = useState("products");
  const [isFollowing, setIsFollowing] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const [bannerPos, setBannerPos] = useState(50);
  const [logoPos, setLogoPos] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [quickLookProduct, setQuickLookProduct] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  const decodeHtml = (html) => {
    if (!html) return "";
    return html
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#039;/g, "'");
  };

  const isOwner = !!(wooId && data?.vendor?.id && Number(wooId) === Number(data.vendor.id));

  const handleImageUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    setLoading(true);
    try {
      const res = await fetch("/api/vendors/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const result = await res.json();
      if (result.success) {
        setData(prev => ({
          ...prev,
          vendor: {
            ...prev.vendor,
            [type === 'banner' ? 'storeBanner' : 'storeLogo']: result.url
          }
        }));

        await fetch("/api/vendors/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: wooId,
            meta: {
              [type === 'banner' ? 'mahally_store_banner' : 'mahally_store_logo']: result.url
            }
          }),
        });
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const v = data.vendor;
    try {
      const res = await fetch("/api/vendors/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: wooId,
          meta: {
            mahally_banner_pos: bannerPos,
            mahally_logo_pos: logoPos,
            mahally_store_banner: v.storeBanner,
            mahally_store_logo: v.storeLogo
          }
        }),
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const result = await res.json();
      if (result.success) {
        alert("تم تحديث الملف الشخصي بنجاح!");
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      alert("فشل حفظ الملف الشخصي: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/vendors/${slug}?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error(`Vendor fetch failed (${r.status})`);
        return r.json();
      })
      .then((d) => {
        if (d) {
          setData(d);
          if (d.vendor.bannerPos) setBannerPos(d.vendor.bannerPos);
          if (d.vendor.logoPos) setLogoPos(d.vendor.logoPos);
          if (wooId && d.vendor.followers?.some(f => String(f.id) === String(wooId))) {
            setIsFollowing(true);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, wooId]);

  useEffect(() => {
    if (wooId && data?.vendor?.followers) {
      const isFan = data.vendor.followers.some(f => String(f.id) === String(wooId));
      setIsFollowing(isFan);
    } else {
      setIsFollowing(false);
    }
    setStatusChecked(true);
  }, [wooId, data]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-zinc-100 border-t-[#e77600] rounded-full animate-spin" />
    </div>
  );

  if (notFound || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4 p-4 text-center">
      <div className="text-5xl">🏪</div>
      <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">المتجر غير موجود</h1>
      <p className="text-zinc-500 text-[14px]">هذا التاجر غير موجود أو تم تعطيله.</p>
      <Link href="/vendors" className="mt-4 px-6 py-2 bg-[#FFD814] text-zinc-900 rounded-md text-[13px] font-medium border border-[#FCD200] hover:bg-[#F7CA00] shadow-sm">
        العودة إلى المتاجر
      </Link>
    </div>
  );

  const { vendor: v, products } = data;

  const handleFollow = async () => {
    if (!wooId) {
      alert("يرجى تسجيل الدخول لمتابعة هذا المتجر!");
      return;
    }
    if (isFollowPending) return;
    setIsFollowPending(true);

    const newAction = isFollowing ? 'unfollow' : 'follow';
    const currentIsFollowing = isFollowing;

    // Optimistic Update
    setIsFollowing(!currentIsFollowing);

    setData(prev => {
      const currentCount = parseInt(prev.vendor.followerCount || 0);
      let newCount = currentIsFollowing ? Math.max(0, currentCount - 1) : currentCount + 1;

      let newFollowers = [...(prev.vendor.followers || [])];
      if (currentIsFollowing) {
        newFollowers = newFollowers.filter(f => String(f.id) !== String(wooId));
      } else {
        newFollowers.push({
          id: Number(wooId),
          name: user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "أنت"
        });
      }

      return {
        ...prev,
        vendor: {
          ...prev.vendor,
          followerCount: String(newCount),
          followers: newFollowers
        }
      };
    });

    try {
      await fetch("/api/vendors/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: v.id,
          userId: wooId,
          action: newAction
        }),
      });
    } catch (err) {
      console.error("Follow error", err);
      // Rollback
      setIsFollowing(currentIsFollowing);
      setData(prev => {
        const currentCount = parseInt(prev.vendor.followerCount || 0);
        let newCount = currentIsFollowing ? currentCount : Math.max(0, currentCount - 1);
        let newFollowers = [...(prev.vendor.followers || [])];
        if (currentIsFollowing) {
          newFollowers.push({ id: Number(wooId), name: "أنت" });
        } else {
          newFollowers = newFollowers.filter(f => String(f.id) !== String(wooId));
        }
        return {
          ...prev,
          vendor: {
            ...prev.vendor,
            followerCount: String(newCount),
            followers: newFollowers
          }
        };
      });
    } finally {
      setIsFollowPending(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === "All" || p.categories?.some(c => decodeHtml(c.name) === categoryFilter || c.slug === categoryFilter);
    const pPrice = parseFloat(p.price || 0);
    const matchMin = priceRange.min === "" || pPrice >= parseFloat(priceRange.min);
    const matchMax = priceRange.max === "" || pPrice <= parseFloat(priceRange.max);
    return matchSearch && matchCat && matchMin && matchMax;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return parseFloat(a.price || 0) - parseFloat(b.price || 0);
    if (sortBy === "price_desc") return parseFloat(b.price || 0) - parseFloat(a.price || 0);
    if (sortBy === "newest") return new Date(b.date_created || 0) - new Date(a.date_created || 0);
    return 0; // default
  });

  const productCategories = ["All", ...Array.from(new Set(products.flatMap(p => p.categories?.map(c => decodeHtml(c.name)) || [])))];


  return (
    <div className="min-h-screen bg-white pb-20">

      {/* ── Banner / Cover ── */}
      <div className="relative h-[200px] md:h-[260px] bg-zinc-100 overflow-hidden group">
        {v.storeBanner ? (
          <Image
            src={v.storeBanner}
            alt={v.storeName}
            fill
            className="object-cover"
            style={{ objectPosition: `50% ${bannerPos}%` }}
            priority={true}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-zinc-100 flex items-center justify-center">
            <Store size={60} className="text-zinc-300 opacity-50" />
          </div>
        )}

        {isOwner && (
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
            <button
              onClick={() => document.getElementById('cover-upload').click()}
              className="bg-white/90 hover:bg-white text-zinc-950 px-4 py-2 rounded-md text-[12px] font-bold shadow-xl flex items-center gap-2"
            >
              <Camera size={16} /> تغيير صورة الغلاف
            </button>
            {v.storeBanner && (
              <div className="bg-black/60 p-2 rounded-lg w-48">
                <p className="text-[10px] text-white text-center mb-1">تعديل الموضع</p>
                <input type="range" min="0" max="100" value={bannerPos} onChange={(e) => setBannerPos(e.target.value)} className="w-full accent-[#e77600]" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Brand Header ── */}
      <div className="bg-[#fcfcfc] border-b border-zinc-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6 py-4">

            {/* Logo */}
            <div className="relative -mt-16 md:-mt-20 group/logo">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-sm bg-white border border-zinc-200 shadow-md p-1.5 flex items-center justify-center overflow-hidden relative">
                {v.storeLogo ? (
                  <Image src={v.storeLogo} alt={v.storeName || "Store logo"} fill className="object-cover p-1" style={{ objectPosition: `${logoPos}% 50%` }} />
                ) : (
                  <span className="text-zinc-300 font-bold text-5xl">{v.storeName?.[0]}</span>
                )}

                {isOwner && (
                  <button
                    onClick={() => document.getElementById('logo-upload').click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Camera size={24} className="text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Info Area */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                <h1 className="text-[24px] md:text-[28px] font-bold text-zinc-900 leading-tight">
                  {v.storeName} {isOwner && <span className="text-[14px] font-medium text-zinc-400 ml-1">(أنا)</span>}
                </h1>
                <div className="flex items-center gap-0.5 ml-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < Math.round(v.averageRating || 0) ? 'text-[#FFA41C] fill-[#FFA41C]' : 'text-zinc-200 fill-zinc-200'} />
                  ))}
                  <span className="text-[13px] text-[#007185] ml-1">{v.averageRating || "0.0"}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[13px] text-zinc-600">
                <span className="flex items-center gap-1"><Store size={14} className="text-zinc-400" /> {v.storeCategory || "متجر"}</span>
                <span className="flex items-center gap-1"><Users size={14} className="text-zinc-400" /> {v.followerCount || "0"} متابع</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium"><ShieldCheck size={14} /> بائع موثوق</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {!isOwner && (
                <>
                  <button
                    onClick={handleFollow}
                    disabled={isFollowPending}
                    className={`cursor-pointer h-9 px-6 rounded-md text-[13px] font-medium transition-all shadow-sm border flex items-center justify-center gap-2 group ${isFollowing ? 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200' : 'bg-[#FFD814] text-zinc-900 border-[#FCD200] hover:bg-[#F7CA00]'
                      } ${isFollowPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isFollowPending && (
                      <span className="w-3.5 h-3.5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {isFollowing ? (
                      <>
                        <span className="group-hover:hidden">متابع</span>
                        <span className="hidden group-hover:inline">إلغاء المتابعة</span>
                      </>
                    ) : (
                      <>متابعة</>
                    )}
                  </button>
                  {messagingEnabled && v.whatsappNumber && v.showWhatsapp && (
                    <a
                      href={`https://wa.me/${v.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-4 rounded-md text-[13px] font-bold border border-[#25D366] text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center gap-2 transition-all"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.031 0C5.383 0 0 5.383 0 12.031C0 14.156 0.556 16.208 1.583 17.989L0.117 23.351L5.617 21.908C7.339 22.84 9.278 23.351 11.272 23.351H11.277C17.925 23.351 23.311 17.965 23.311 11.317C23.311 8.093 22.056 5.068 19.78 2.788C17.504 0.509 14.479 0 12.031 0ZM12.031 19.467C10.231 19.467 8.5 18.983 6.983 18.083L6.633 17.872L3.372 18.728L4.244 15.544L4.017 15.183C3.028 13.611 2.506 11.8 2.506 9.928C2.506 4.672 6.772 0.406 12.033 0.406C14.583 0.406 16.933 1.4 18.739 3.206C20.544 5.011 21.539 7.361 21.539 9.917C21.539 15.172 17.272 19.439 12.031 19.467ZM17.261 14.133C16.972 13.989 15.544 13.283 15.278 13.189C15.011 13.094 14.817 13.044 14.628 13.333C14.433 13.617 13.889 14.283 13.722 14.472C13.556 14.661 13.389 14.683 13.106 14.539C12.817 14.394 11.878 14.089 10.767 13.094C9.889 12.306 9.306 11.356 9.139 11.067C8.972 10.778 9.122 10.622 9.267 10.478C9.394 10.35 9.55 10.15 9.694 9.983C9.839 9.817 9.889 9.694 9.983 9.506C10.078 9.317 10.028 9.15 9.956 9.006C9.883 8.861 9.306 7.444 9.067 6.861C8.833 6.294 8.6 6.372 8.433 6.361C8.278 6.356 8.083 6.35 7.894 6.35C7.706 6.35 7.394 6.422 7.133 6.706C6.872 6.989 6.133 7.678 6.133 9.083C6.133 10.489 7.156 11.844 7.3 12.033C7.444 12.222 9.306 15.111 12.189 16.35C12.878 16.644 13.406 16.822 13.817 16.956C14.506 17.178 15.133 17.144 15.628 17.067C16.183 16.978 17.261 16.4 17.483 15.756C17.706 15.111 17.706 14.567 17.628 14.472C17.556 14.372 17.361 14.278 17.072 14.133L17.261 14.133Z" />
                      </svg>
                      واتساب
                    </a>
                  )}
                  {messagingEnabled && (
                    user ? (
                      <Link
                        href={`/messages?to=${v.id}`}
                        className="h-9 px-4 rounded-md text-[13px] font-medium border border-zinc-300 text-zinc-700 flex items-center gap-2 hover:bg-zinc-50"
                      >
                        <Mail size={14} /> مراسلة
                      </Link>
                    ) : (
                      <Link
                        href={`/login?redirect=/vendors/${slug}`}
                        className="h-9 px-4 rounded-md text-[13px] font-medium border border-zinc-300 text-zinc-700 flex items-center gap-2 hover:bg-zinc-50"
                      >
                        <Mail size={14} /> مراسلة
                      </Link>
                    )
                  )}
                </>
              )}
              {isOwner && (
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="h-9 px-6 bg-[#e77600] hover:bg-[#c46500] text-white rounded-md text-[13px] font-bold shadow-md transition-all flex items-center gap-2"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />} حفظ ملف المتجر
                </button>
              )}
              {!isOwner && (
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="cursor-pointer p-2 border border-zinc-300 rounded-md text-zinc-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  title="الإبلاغ عن المتجر"
                >
                  <ShieldAlert size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Store Navigation Tabs */}
          <div className="flex gap-1">
            {[
              { id: 'products', label: 'المنتجات', icon: null },
              { id: 'about', label: 'معلومات البائع', icon: null },
              { id: 'reviews', label: 'التقييمات', icon: null },
              { id: 'followers', label: 'المتابعون', icon: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer px-5 py-3 text-[14px] font-medium border-b-2 transition-all ${activeTab === tab.id ? "border-[#e77600] text-[#e77600]" : "border-transparent text-zinc-600 hover:text-zinc-950"}`}
              >
                {tab.label} {tab.id === 'followers' && `(${v.followerCount || 0})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="max-w-[1400px] mx-auto px-4 py-8">

        <input type="file" id="cover-upload" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
        <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />

        {activeTab === "products" && (
          <div className="flex flex-col md:flex-row gap-8">

            {/* Store Sidebar (Filtering) */}
            <aside className="w-full md:w-[220px] shrink-0">
              <div className="mb-6">
                <h3 className="text-[14px] font-bold text-zinc-900 mb-3">ابحث داخل المتجر</h3>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن منتجات..."
                    className="w-full h-9 border border-zinc-300 rounded-md pl-9 pr-3 text-[13px] outline-none focus:border-[#e77600]"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-[14px] font-bold text-zinc-900 mb-3">نطاق السعر</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="الحد الأدنى"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full h-8 border border-zinc-300 rounded-md px-2 text-[12px] outline-none focus:border-[#e77600]"
                  />
                  <span className="text-zinc-400">-</span>
                  <input
                    type="number"
                    placeholder="الحد الأقصى"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full h-8 border border-zinc-300 rounded-md px-2 text-[12px] outline-none focus:border-[#e77600]"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-[14px] font-bold text-zinc-900 mb-3">ترتيب حسب</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-9 border border-zinc-300 rounded-md px-2 text-[13px] outline-none focus:border-[#e77600]"
                >
                  <option value="default">الأكثر ملاءمة</option>
                  <option value="price_asc">السعر من الأقل إلى الأعلى</option>
                  <option value="price_desc">السعر من الأعلى إلى الأقل</option>
                  <option value="newest">الأحدث</option>
                </select>
              </div>

              <div className="mb-6">
                <h3 className="text-[14px] font-bold text-zinc-900 mb-4">فئات المتجر</h3>
                <div className="flex flex-wrap gap-2">
                  {productCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`cursor-pointer h-8 px-4 rounded-full text-[12px] font-bold transition-all border ${categoryFilter === cat
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400'
                        }`}
                    >
                      {cat === "All" ? "الكل" : cat}
                    </button>
                  ))}
                </div>
              </div>


              <div className="border-t border-zinc-100 pt-4">
                <h3 className="text-[14px] font-bold text-zinc-900 mb-3">خدمة العملاء</h3>
                <p className="text-[12px] text-zinc-500 leading-relaxed">
                  هذا التاجر عادةً يرد خلال 24 ساعة. لمعلومات الإرجاع، يرجى مراجعة سياسة مهالي للإرجاع.
                </p>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[18px] font-bold text-zinc-900">المنتجات المميزة</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-zinc-500">عرض:</span>
                  <div className="flex border border-zinc-200 rounded-md overflow-hidden">
                    <button onClick={() => setView("grid")} className={`p-1.5 ${view === 'grid' ? 'bg-zinc-100' : 'bg-white hover:bg-zinc-50'}`}><Grid3X3 size={14} /></button>
                    <button onClick={() => setView("list")} className={`p-1.5 ${view === 'list' ? 'bg-zinc-100' : 'bg-white hover:bg-zinc-50'}`}><List size={14} /></button>
                  </div>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-zinc-200 rounded-xl">
                  <Package size={40} className="mx-auto text-zinc-200 mb-3" />
                  <p className="text-zinc-500 text-[14px]">لم يتم العثور على منتجات تطابق بحثك.</p>
                </div>
              ) : (
                <>
                  {view === 'list' ? (
                    <div className="bg-white border border-zinc-200 shadow-sm rounded-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-200 bg-white text-[13px] text-zinc-600">
                              <th className="px-4 py-3 w-16 text-center"><Camera size={16} className="text-zinc-400 inline" /></th>
                              <th className="px-4 py-3 font-bold">اسم المنتج</th>
                              <th className="px-4 py-3 font-bold">السعر</th>
                              <th className="px-4 py-3 font-bold">الفئة</th>
                              <th className="px-4 py-3 font-bold text-right">الإجراء</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {filteredProducts.map(p => (
                              <tr key={p.id} className="hover:bg-[#f6f7f7] group transition-colors">
                                <td className="px-4 py-3">
                                  <Link href={`/product/${p.id}`}>
                                    <div className="w-[50px] h-[50px] border border-zinc-200 bg-[#F7F7F7] rounded-sm overflow-hidden relative mx-auto">
                                      {p.images?.[0]?.src ? (
                                        <Image src={p.images[0].src} alt={p.name || "منتج"} fill className="object-contain p-1" sizes="50px" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center"><Package size={18} className="text-zinc-200" /></div>
                                      )}
                                    </div>
                                  </Link>
                                </td>
                                <td className="px-4 py-3 align-top pt-4">
                                  <Link href={`/product/${p.id}`} className="font-bold text-[#007185] hover:text-[#9b2c41] text-[14px] leading-tight line-clamp-2">
                                    {p.name}
                                  </Link>
                                  <div className="flex items-center gap-0.5 mt-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={12} className={i < Math.round(p.average_rating || 0) ? 'text-[#FFA41C] fill-[#FFA41C]' : 'text-zinc-200 fill-zinc-200'} />
                                    ))}
                                    <span className="text-[11px] text-[#007185] hover:text-[#9b2c41] cursor-pointer ml-1">{p.rating_count || 0}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 align-top pt-4">
                                  <div className="space-y-0.5 font-normal text-zinc-900">
                                    {p.type === "variable" ? (
                                      <div>
                                        <span className="text-[11px] text-zinc-600 mr-1">من</span>
                                        <span className="font-medium text-[16px]">د.أ {parseFloat(p.price || 0).toFixed(2)}</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col">
                                        {(parseFloat(p.regular_price) > parseFloat(p.price)) && (
                                          <span className="line-through text-zinc-500 text-[11px]">د.أ {parseFloat(p.regular_price).toFixed(2)}</span>
                                        )}
                                        <span className="font-medium text-[16px] text-[#B12704]">د.أ {parseFloat(p.price || 0).toFixed(2)}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 align-top pt-4 text-[13px] text-zinc-600">
                                  {decodeHtml(p.categories?.[0]?.name) || "—"}
                                </td>
                                <td className="px-4 py-3 align-top pt-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={(e) => { e.preventDefault(); setQuickLookProduct(p); }}
                                      className="inline-flex items-center justify-center h-8 px-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-900 text-[12px] font-medium rounded-full shadow-sm transition-colors"
                                    >
                                      نظرة سريعة
                                    </button>
                                    <Link
                                      href={`/product/${p.id}`}
                                      className="inline-flex items-center justify-center h-8 px-4 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-zinc-900 text-[12px] font-medium rounded-full shadow-sm transition-colors"
                                    >
                                      عرض الخيارات
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredProducts.map(p => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="max-w-3xl mx-auto bg-[#fcfcfc] border border-zinc-200 rounded-lg p-8">
            <h2 className="text-[20px] font-bold text-zinc-900 mb-4 flex items-center gap-2"><Info size={20} className="text-zinc-400" /> نبذة عن {v.storeName}</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-[13px] font-bold text-zinc-700 uppercase tracking-wider mb-2">نبذة عن التاجر</h3>
                <p className="text-[14px] text-zinc-600 leading-relaxed">
                  {v.storeDescription || "هذا التاجر عضو موثوق في مجتمع مهالي، ويسعى لتقديم منتجات عالية الجودة وخدمة عملاء متميزة."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-zinc-200">
                <div className="space-y-3">
                  <h3 className="text-[13px] font-bold text-zinc-700 uppercase tracking-wider">معلومات النشاط التجاري</h3>
                  <div className="space-y-2 text-[14px]">
                    <p className="flex items-center gap-2 text-zinc-600"><MapPin size={14} /> الموقع: عمان، الأردن</p>
                    <p className="flex items-center gap-2 text-zinc-600"><Package size={14} /> عضو في مهالي منذ: {new Date(v.dateCreated).toLocaleDateString()}</p>
                    <p className="flex items-center gap-2 text-zinc-600"><ShieldCheck size={14} className="text-emerald-600" /> بائع موثوق</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[13px] font-bold text-zinc-700 uppercase tracking-wider">طرق الاتصال</h3>
                  <div className="space-y-2 text-[14px]">
                    {messagingEnabled && v.whatsappNumber && v.showWhatsapp && (
                      <a href={`https://wa.me/${v.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#25D366] font-bold hover:underline mb-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.031 0C5.383 0 0 5.383 0 12.031C0 14.156 0.556 16.208 1.583 17.989L0.117 23.351L5.617 21.908C7.339 22.84 9.278 23.351 11.272 23.351H11.277C17.925 23.351 23.311 17.965 23.311 11.317C23.311 8.093 22.056 5.068 19.78 2.788C17.504 0.509 14.479 0 12.031 0ZM12.031 19.467C10.231 19.467 8.5 18.983 6.983 18.083L6.633 17.872L3.372 18.728L4.244 15.544L4.017 15.183C3.028 13.611 2.506 11.8 2.506 9.928C2.506 4.672 6.772 0.406 12.033 0.406C14.583 0.406 16.933 1.4 18.739 3.206C20.544 5.011 21.539 7.361 21.539 9.917C21.539 15.172 17.272 19.439 12.031 19.467ZM17.261 14.133C16.972 13.989 15.544 13.283 15.278 13.189C15.011 13.094 14.817 13.044 14.628 13.333C14.433 13.617 13.889 14.283 13.722 14.472C13.556 14.661 13.389 14.683 13.106 14.539C12.817 14.394 11.878 14.089 10.767 13.094C9.889 12.306 9.306 11.356 9.139 11.067C8.972 10.778 9.122 10.622 9.267 10.478C9.394 10.35 9.55 10.15 9.694 9.983C9.839 9.817 9.889 9.694 9.983 9.506C10.078 9.317 10.028 9.15 9.956 9.006C9.883 8.861 9.306 7.444 9.067 6.861C8.833 6.294 8.6 6.372 8.433 6.361C8.278 6.356 8.083 6.35 7.894 6.35C7.706 6.35 7.394 6.422 7.133 6.706C6.872 6.989 6.133 7.678 6.133 9.083C6.133 10.489 7.156 11.844 7.3 12.033C7.444 12.222 9.306 15.111 12.189 16.35C12.878 16.644 13.406 16.822 13.817 16.956C14.506 17.178 15.133 17.144 15.628 17.067C16.183 16.978 17.261 16.4 17.483 15.756C17.706 15.111 17.706 14.567 17.628 14.472C17.556 14.372 17.361 14.278 17.072 14.133L17.261 14.133Z" /></svg>
                        الدردشة عبر واتساب
                      </a>
                    )}
                    {v.showEmail && <p className="flex items-center gap-2 text-zinc-600 hover:text-[#007185]"><Mail size={14} /> {v.email}</p>}
                    {v.showPhone && <p className="flex items-center gap-2 text-zinc-600"><PhoneIcon size={14} /> {v.phone}</p>}
                    {(!messagingEnabled || !v.whatsappNumber || !v.showWhatsapp) && !v.showEmail && !v.showPhone && <p className="text-zinc-400 italic text-[13px]">معلومات الاتصال خاصة.</p>}
                    {messagingEnabled && !isOwner && (
                      user ? (
                        <Link href={`/messages?to=${v.id}`} className="inline-block text-[#007185] font-medium hover:underline">مراسلة عبر مهالي &gt;</Link>
                      ) : (
                        <Link href={`/login?redirect=/vendors/${slug}`} className="inline-block text-[#007185] font-medium hover:underline">مراسلة عبر مهالي &gt;</Link>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row gap-12 bg-[#fcfcfc] border border-zinc-200 rounded-lg p-8 relative overflow-hidden">
              <div className="w-full md:w-64 text-center md:text-left">
                <h2 className="text-[24px] font-bold text-zinc-900 mb-1">{v.averageRating || "0.0"} من 5</h2>
                <div className="flex justify-center md:justify-start gap-0.5 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className={i < Math.round(v.averageRating || 0) ? 'text-[#FFA41C] fill-[#FFA41C]' : 'text-zinc-200 fill-zinc-200'} />
                  ))}
                </div>
                <p className="text-zinc-500 text-[14px] mb-6">
                  ({v.reviewCount || 0}) {v.reviewCount === 1 ? "تقييم" : "التقييمات"}
                </p>
              </div>

              <div className="flex-1 space-y-3">
                {[5, 4, 3, 2, 1].map(stars => {
                  const percentage = v.ratingDistribution?.[stars] || "0%";
                  return (
                    <div key={stars} className="flex items-center gap-4 text-[13px]">
                      <span className="w-12 text-[#007185] hover:underline cursor-pointer">{stars} نجوم</span>
                      <div className="flex-1 h-5 bg-zinc-100 rounded-sm overflow-hidden border border-zinc-200 shadow-inner">
                        <div className="h-full bg-[#FFA41C]" style={{ width: percentage }}></div>
                      </div>
                      <span className="w-10 text-right text-zinc-500">{percentage}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {v.recentReviews?.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-[18px] font-bold text-zinc-900 border-b border-zinc-100 pb-4">أبرز التقييمات لهذا البائع</h3>
                {v.recentReviews.map((rev, idx) => (
                  <div key={idx} className="border-b border-zinc-100 pb-6 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                        <User size={16} />
                      </div>
                      <span className="text-[13px] text-zinc-900 font-medium">{rev.reviewer}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < rev.rating ? 'text-[#FFA41C] fill-[#FFA41C]' : 'text-zinc-200 fill-zinc-200'} />
                        ))}
                      </div>
                      <span className="text-[13px] font-bold text-zinc-900">شراء موثوق</span>
                    </div>
                    <p className="text-[12px] text-zinc-500 mb-2">تمت المراجعة في {new Date(rev.date_created).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-[14px] text-zinc-900 leading-relaxed" dangerouslySetInnerHTML={{ __html: rev.review }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-zinc-200 rounded-xl">
                <MessageSquare size={40} className="mx-auto text-zinc-100 mb-4" />
                <h3 className="text-[18px] font-bold text-zinc-900 mb-2">لا توجد تقييمات بعد</h3>
                <p className="text-[14px] text-zinc-500 max-w-sm mx-auto">
                  لم يترك العملاء أي ملاحظات بعد على متجر هذا البائع. التقييمات تساعد المشترين الآخرين على اتخاذ قرار أفضل.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "followers" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[20px] font-bold text-zinc-900 mb-6 flex items-center gap-2"><Users size={20} className="text-zinc-400" /> المتابعون</h2>

            {v.followers?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {v.followers.map((f) => (
                  <div key={f.id} className="bg-white border border-zinc-200 rounded-lg p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-zinc-900">{f.name}</p>
                      <p className="text-[12px] text-zinc-500">عضو موثوق</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-zinc-200 rounded-xl">
                <Users size={40} className="mx-auto text-zinc-200 mb-4" />
                <h3 className="text-[18px] font-bold text-zinc-900 mb-2">لا يوجد متابعون بعد</h3>
                <p className="text-[14px] text-zinc-500 max-w-sm mx-auto">
                  كن أول من يتابع {v.storeName} لتصلك تحديثاتهم عن المنتجات والعروض الجديدة!
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {v && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          reportedId={v.id}
          reportedName={v.storeName}
          type="store"
        />
      )}
      <QuickLookModal
        product={quickLookProduct}
        isOpen={!!quickLookProduct}
        onClose={() => setQuickLookProduct(null)}
      />
    </div>

  );
}
