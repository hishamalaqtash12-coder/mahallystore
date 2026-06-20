"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useLocation } from "@/context/LocationContext";
import { JORDAN_GOVERNORATES, GOVERNORATES_MAP_AR } from "@/lib/constants";
import { isProductOutOfStock } from "@/lib/product-utils";

const decodeHtml = (html) => {
  if (!html) return '';
  return html.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
};
import {
  Search,
  ShoppingCart,
  MapPin,
  Menu,
  ChevronDown,
  X,
  ChevronRight,
  Globe,
  Star,
  Clock,
  Store,
  HelpCircle,
  Gift,
  Tag,
  Package,
  LogOut,
  UserCircle,
  TrendingUp,
  Activity,
  Flame,
  Info,
  ExternalLink,
  Heart,
  MessageSquare,
  ShieldCheck,
  Settings,
  Check,
  PlusCircle,
  BarChart3,
  Boxes,
  ChevronLeft
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

// Global client-side memory cache for mega menu categories products to survive page navigations
const megaCacheGlobal = {};

export default function Header() {
  const router = useRouter();
  const { cart, setIsCartOpen, addToCart } = useCart();
  const { user, customerName, isVendor, isApprovedVendor, isAdmin, logout, messagingEnabled, wooId, loading: authLoading, avatarUrl, avatarBgColor } = useAuth();
  const { wishlistIds } = useWishlist();

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileAccountMenuOpen, setIsMobileAccountMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeMegaCategory, setActiveMegaCategory] = useState(null);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [megaProducts, setMegaProducts] = useState([]);
  const [loadingMegaProducts, setLoadingMegaProducts] = useState(false);
  const { governorate, updateGovernorate } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [recentViews, setRecentViews] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const searchRef = useRef(null);
  const categoryHoverTimeoutRef = useRef(null);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const cats = await catRes.json();
          setCategories(Array.isArray(cats) ? cats.map(c => ({ ...c, name: decodeHtml(c.name) })) : []);
        }
      } catch (e) {
        console.warn("Header background fetch failed:", e.message);
      }
    };
    fetchData();

    const loadRecentViews = async () => {
      try {
        const stored = localStorage.getItem("mahally_recently_viewed");
        if (stored) {
          const parsed = JSON.parse(stored);
          setRecentViews(parsed);

          if (parsed.length > 0) {
            const ids = parsed.map(p => p.id).join(",");
            const res = await fetch(`/api/products?include=${ids}&per_page=${parsed.length}`);
            if (res.ok) {
              const data = await res.json();
              if (data.products && data.products.length > 0) {
                const updatedViews = parsed.map(p => {
                  const live = data.products.find(lp => lp.id === p.id);
                  if (live) {
                    return {
                      ...p,
                      ...live,
                      image: live.images?.[0]?.src || p.image || "https://placehold.co/100"
                    };
                  }
                  return null;
                }).filter(Boolean);

                setRecentViews(updatedViews);
                localStorage.setItem("mahally_recently_viewed", JSON.stringify(updatedViews));
              }
            }
          }
        }
      } catch (e) { }
    };

    loadRecentViews();
    window.addEventListener("recently_viewed_updated", loadRecentViews);

    const fetchUnread = async () => {
      if (!wooId || !messagingEnabled) return;
      try {
        const res = await fetch(`/api/messages/conversations?userId=${wooId}`);
        if (res.ok) {
          const data = await res.json();
          let count = 0;
          if (data.conversations) {
            data.conversations.forEach(conv => {
              const readStamp = localStorage.getItem(`mahally_read_${wooId}_${conv.id}`);
              if (!readStamp || conv.lastTimestamp > Number(readStamp)) {
                if (conv.lastTimestamp > 0) count++;
              }
            });
          }
          setUnreadMessages(count);
        }
      } catch (e) { }
    };

    if (wooId && messagingEnabled) {
      fetchUnread();
    }

    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("recently_viewed_updated", loadRecentViews);
      if (categoryHoverTimeoutRef.current) {
        clearTimeout(categoryHoverTimeoutRef.current);
      }
    };
  }, [wooId, messagingEnabled]);

  // Fetch real-time products under active category for hover menu Recommended & PC fallback
  useEffect(() => {
    if (!activeMegaCategory) {
      setMegaProducts([]);
      setLoadingMegaProducts(false);
      return;
    }

    const slug = activeMegaCategory.slug;

    // Check global cache for instant 0ms load speed
    if (megaCacheGlobal[slug]) {
      setMegaProducts(megaCacheGlobal[slug]);
      setLoadingMegaProducts(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    setLoadingMegaProducts(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?cat=${slug}&per_page=16&noReviews=true&noMerchant=true`, { signal: controller.signal });
        if (res.ok && active) {
          const data = await res.json();
          const prods = data.products || [];
          if (active) {
            megaCacheGlobal[slug] = prods;
            setMegaProducts(prods);
          }
        } else if (active) {
          setMegaProducts([]);
        }
      } catch (e) {
        if (e.name === 'AbortError') return;
        if (active) setMegaProducts([]);
      } finally {
        if (active) setLoadingMegaProducts(false);
      }
    }, 50); // Small 50ms buffer to combine with client-side hover intent

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [activeMegaCategory]);

  // Hover Intent Event Handlers to block casual mouse sweeps
  const handleCategoryMouseEnter = (cat) => {
    if (categoryHoverTimeoutRef.current) {
      clearTimeout(categoryHoverTimeoutRef.current);
    }
    categoryHoverTimeoutRef.current = setTimeout(() => {
      setActiveMegaCategory(cat);
    }, 200); // 200ms Hover Intent Delay
  };

  const handleCategoryMouseLeave = () => {
    if (categoryHoverTimeoutRef.current) {
      clearTimeout(categoryHoverTimeoutRef.current);
    }
  };

  // Live Search Logic (Safe Fetching)
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const catParam = selectedCategory !== "All" ? `&cat=${selectedCategory}` : "";
        const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}${catParam}&per_page=10`);

        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.products || []);
        } else {
          setSuggestions([]);
        }
      } catch (e) {
        console.error("Search fetch error:", e);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      const catParam = selectedCategory !== "All" ? `&cat=${selectedCategory}` : "";
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}${catParam}`);
    }
  };

  return (
    <>
      <header className="z-[90] sticky top-0 font-sans shadow-md">

        {/* 1. TOP MAIN HEADER */}
        <div className="bg-white px-2 py-2 flex flex-wrap lg:flex-nowrap items-center gap-2 min-h-[50px] border-b border-zinc-200">
          <Link href="/" className="order-1 p-1 sm:p-2 border border-transparent hover:border-zinc-300 rounded-sm transition-all flex items-center shrink-0">
            <Image 
              src="/mahally-logo.webp" 
              alt="Mahally.jo Logo" 
              width={120} 
              height={40} 
              className="object-contain"
              priority
            />
          </Link>

          <div
            onClick={() => setShowLocationModal(true)}
            className="hidden lg:flex order-2 flex-col p-2 border border-transparent hover:border-zinc-300 rounded-sm cursor-pointer ml-2 shrink-0"
          >
            <span className="text-zinc-500 text-[12px] leading-none ml-5">التوصيل إلى</span>
            <div className="flex items-center gap-1 leading-none mt-1 text-zinc-900">
              <MapPin size={15} className="text-zinc-900" />
              <span className="text-[14px] font-bold">{GOVERNORATES_MAP_AR[governorate] || governorate}</span>
            </div>
          </div>

          <div ref={searchRef} className="order-last lg:order-3 w-full lg:w-auto lg:flex-1 flex flex-col relative lg:ml-2 group z-[100]">
            <form onSubmit={handleSearch} className={`flex h-10 w-full rounded-md transition-shadow relative bg-white border border-zinc-300 ${showSuggestions ? 'ring-[3px] ring-[#febd69] border-[#febd69]' : ''}`}>
              <div className="relative shrink-0 h-full flex items-center bg-[#f3f3f3] hover:bg-[#dadada] transition-colors border-l border-zinc-300 rounded-r-md w-[75px] sm:w-[110px]">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-full w-full bg-transparent text-[#555] text-[11px] sm:text-[12px] pl-5 pr-2 sm:pl-6 sm:pr-3 outline-none cursor-pointer font-bold text-zinc-700 appearance-none text-right"
                  aria-label="اختر القسم"
                >
                  <option value="All">الأقسام</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.slug}>{decodeHtml(c.name)}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500">
                  <ChevronDown size={14} />
                </div>
              </div>
              <input type="text" placeholder="ابحث في محلي" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }} onFocus={() => { setShowSuggestions(true); setIsCategoryOpen(false); }} className="flex-1 px-3 sm:px-4 text-zinc-900 outline-none h-full text-[14px] sm:text-[15px] bg-white w-0 min-w-0" />
              <button type="submit" className="bg-[#febd69] hover:bg-[#f3a847] w-[45px] flex items-center justify-center text-zinc-900 transition-colors shrink-0 rounded-l-md">
                {isSearching ? <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /> : <Search size={24} />}
              </button>
            </form>
            {showSuggestions && searchQuery.length > 0 && (
              <div className="absolute top-[102%] left-0 w-full bg-white border border-zinc-300 shadow-2xl z-[150] mt-0 rounded-sm overflow-hidden text-zinc-900">
                {suggestions.length > 0 ? (
                  <div className="py-2">
                    {suggestions.map((p) => (
                      <Link key={p.id} href={`/product/${p.slug || p.id}`} onClick={() => setShowSuggestions(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-100 transition-colors">
                        <div className="w-8 h-8 relative shrink-0 bg-white"><Image src={p.images?.[0]?.src || "https://placehold.co/100"} alt={p.name || "Product"} fill className="object-contain" /></div>
                        <p className="text-[14px] truncate flex-1 font-bold">{p.name}</p>
                      </Link>
                    ))}
                  </div>
                ) : (!isSearching && <div className="p-4 text-zinc-400 text-sm italic">لا توجد نتائج</div>)}
              </div>
            )}
          </div>

          <div className="order-2 lg:order-4 ml-auto lg:ml-0 relative flex items-center gap-1 sm:gap-2 lg:gap-4">
            <div
              className={`relative flex flex-col p-1 sm:p-2 border border-transparent hover:border-zinc-300 rounded-sm shrink-0 cursor-pointer ${isAdmin ? 'bg-blue-900/40 border-blue-500/50 ring-1 ring-blue-500/30' : (isVendor ? 'bg-[#FFD700]/10 border-[#FFD700]/30 ring-1 ring-[#FFD700]/20' : '')}`}
              onMouseEnter={() => { if (user && window.innerWidth >= 640) setIsAccountMenuOpen(true); }}
              onMouseLeave={() => setIsAccountMenuOpen(false)}
              onClick={() => {
                if (!user) {
                  router.push('/login');
                } else if (window.innerWidth < 640) {
                  setIsMobileAccountMenuOpen(true);
                }
              }}
            >
              {authLoading ? (
                <div className="flex items-center justify-center h-[34px] px-2 sm:px-6">
                  <div className="w-5 h-5 border-2 border-[#ccc] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <span className={`text-[10px] sm:text-[12px] leading-none hidden sm:flex items-center gap-1 ${isAdmin ? 'text-blue-400 font-bold' : (isApprovedVendor ? 'text-[#c45500] font-bold' : 'text-zinc-500')}`}>
                    {isAdmin && <ShieldCheck size={12} />}
                    <span>
                      {isAdmin ? `لوحة المشرف (${customerName || 'المشرف'})` : (isApprovedVendor ? `بوابة البائع (${customerName || 'التاجر'})` : (user ? `مرحبًا، ${customerName || user.displayName || 'العميل'}` : 'تسجيل الدخول'))}
                    </span>
                  </span>
                  <div className="hidden sm:flex items-center gap-1 leading-none mt-1 text-zinc-900">
                    <span className={`text-[14px] font-bold ${isAdmin ? 'text-blue-600' : (isApprovedVendor ? 'text-[#c45500]' : '')}`}>{isVendor ? 'لوحة التحكم' : 'الطلبات والحساب'}</span>
                    {user && <ChevronDown size={12} className={`mt-1 ${isAdmin ? 'text-blue-600' : (isApprovedVendor ? 'text-[#c45500]' : 'text-zinc-500')}`} />}
                  </div>
                  <div className="sm:hidden flex items-center justify-center text-zinc-900 p-0.5">
                    <UserCircle size={24} className={isAdmin ? 'text-blue-600' : (isApprovedVendor ? 'text-[#c45500]' : 'text-zinc-900')} />
                  </div>
                </>
              )}
              {isAccountMenuOpen && user && !authLoading && (
                <div className="absolute top-[100%] left-0 pt-2 z-[200]">
                  <div className="absolute top-[4px] left-4 sm:left-10 w-4 h-4 bg-white rotate-45 border-r border-t border-zinc-200 z-[201]"></div>
                  <div className="w-[300px] sm:w-[580px] h-auto max-h-[420px] sm:h-[420px] bg-white text-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-md border border-zinc-200 flex flex-col sm:flex-row animate-in fade-in zoom-in-95 duration-200 overflow-hidden relative z-[200]">
                    {/* Right Side: Account Menu */}
                    <div className="flex-1 h-full bg-white p-5 flex flex-col relative z-10">
                      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-zinc-100 shrink-0">
                        <UserAvatar
                          user={user}
                          customerName={customerName}
                          avatarUrl={avatarUrl}
                          avatarBgColor={avatarBgColor}
                          className="w-12 h-12 rounded-full text-[22px] border border-zinc-200"
                        />
                        <h3 className="font-medium text-[20px] text-zinc-900 truncate">
                          {customerName || user.displayName || "Customer"}
                        </h3>
                      </div>
                      <ul className="space-y-1 text-[15px] text-zinc-700 flex-1 overflow-y-auto pr-1.5 custom-scrollbar pb-2">
                        {isAdmin && (
                          <>
                            <li><Link href="/admin" className="flex items-center gap-3.5 hover:bg-blue-50 text-blue-600 font-bold py-2 px-3 rounded-md transition-colors"><ShieldCheck size={18} strokeWidth={1.5} className="text-blue-600" /> لوحة تحكم المشرف</Link></li>
                            <li><Link href="/admin/vendors" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2 px-3 rounded-md transition-colors text-[14px]"><Store size={18} strokeWidth={1.5} className="text-zinc-500" /> إدارة البائعين</Link></li>
                            <li><Link href="/admin/feedback" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2 px-3 rounded-md transition-colors text-[14px]"><MessageSquare size={18} strokeWidth={1.5} className="text-zinc-500" /> ملاحظات الموقع</Link></li>
                            <li><Link href="/admin/settings" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2 px-3 rounded-md transition-colors text-[14px]"><Settings size={18} strokeWidth={1.5} className="text-zinc-500" /> الإعدادات العامة</Link></li>
                            <li className="border-b border-zinc-100 pb-1 mb-1"></li>
                          </>
                        )}
                        {(isApprovedVendor && !isAdmin) && (
                          <>
                            <li><Link href="/merchant/dashboard" className="flex items-center gap-3.5 hover:bg-[#FFD700]/10 text-[#c45500] font-bold py-2.5 px-3 rounded-md transition-colors"><Store size={20} strokeWidth={1.5} className="text-[#c45500]" /> لوحة البائع</Link></li>
                            <li><Link href="/merchant/dashboard/products" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2 px-3 rounded-md transition-colors text-[14px]"><PlusCircle size={18} strokeWidth={1.5} className="text-emerald-500" /> إضافة منتج جديد</Link></li>
                            <li><Link href="/merchant/dashboard/products" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2 px-3 rounded-md transition-colors text-[14px]"><Package size={18} strokeWidth={1.5} className="text-zinc-500" /> المنتجات</Link></li>
                            <li><Link href="/merchant/dashboard/inventory" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2 px-3 rounded-md transition-colors text-[14px]"><Boxes size={18} strokeWidth={1.5} className="text-zinc-500" /> المخزون</Link></li>
                            <li><Link href="/merchant/dashboard/orders" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2 px-3 rounded-md transition-colors text-[14px]"><ShoppingCart size={18} strokeWidth={1.5} className="text-zinc-500" /> الطلبات</Link></li>
                            <li><Link href="/merchant/dashboard/reviews" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2 px-3 rounded-md transition-colors text-[14px]"><Star size={18} strokeWidth={1.5} className="text-zinc-500" /> التقييمات</Link></li>
                            <li><Link href="/merchant/dashboard/reports" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2 px-3 rounded-md transition-colors text-[14px]"><BarChart3 size={18} strokeWidth={1.5} className="text-zinc-500" /> التقارير</Link></li>
                            <li><Link href="/merchant/dashboard/settings" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2 px-3 rounded-md transition-colors text-[14px]"><Settings size={18} strokeWidth={1.5} className="text-zinc-500" /> إعدادات المتجر</Link></li>
                            <li className="border-b border-zinc-100 pb-1 mb-1"></li>
                          </>
                        )}
                        {!isVendor && (
                          <>
                            <li><Link href="/account" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2.5 px-3 rounded-md transition-colors"><UserCircle size={20} strokeWidth={1.5} className="text-zinc-600" /> ملفك الشخصي</Link></li>
                            <li><Link href="/account/security" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2.5 px-3 rounded-md transition-colors"><ShieldCheck size={20} strokeWidth={1.5} className="text-zinc-600" /> أمان الحساب</Link></li>
                            <li><Link href="/account/orders" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2.5 px-3 rounded-md transition-colors"><Package size={20} strokeWidth={1.5} className="text-zinc-600" /> طلباتك</Link></li>
                            {messagingEnabled && (
                              <li><Link href="/account/reviews" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2.5 px-3 rounded-md transition-colors"><MessageSquare size={20} strokeWidth={1.5} className="text-zinc-600" /> تقييماتك</Link></li>
                            )}
                            <li><Link href="/account/addresses" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2.5 px-3 rounded-md transition-colors"><MapPin size={20} strokeWidth={1.5} className="text-zinc-600" /> العناوين</Link></li>
                            <li><Link href="/account/coupons" className="flex items-center gap-3.5 hover:bg-zinc-50 py-2.5 px-3 rounded-md transition-colors"><Tag size={20} strokeWidth={1.5} className="text-zinc-600" /> القسائم والعروض</Link></li>
                          </>
                        )}
                        <li className="pt-2 mt-2 border-t border-zinc-100"><button onClick={logout} className="cursor-pointer w-full flex items-center gap-3.5 hover:bg-red-50 text-red-600 py-2.5 px-3 rounded-md transition-colors"><LogOut className="cursor-pointer" size={20} strokeWidth={1.5} /> تسجيل الخروج</button></li>
                      </ul>
                    </div>
                    {/* Left Side: Browsing History */}
                    <div className="hidden sm:flex w-[280px] h-full bg-white border-r border-zinc-100 p-5 flex-col relative z-10">
                      <div className="flex justify-between items-center mb-4 shrink-0">
                        <Link href="/account/recently-viewed" className="font-medium text-[16px] flex items-center gap-1 hover:text-[#f77f00] transition-colors">سجل التصفح <ChevronLeft size={16} /></Link>
                      </div>
                      {recentViews.length > 0 ? (
                        <div className="space-y-4 flex-1 overflow-y-auto pr-1.5 custom-scrollbar pb-2">
                          {recentViews.slice(0, 10).map((p) => (
                            <Link href={`/product/${p.slug}`} key={p.id} className="flex items-center gap-3 group relative block">
                              <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded relative shrink-0 overflow-hidden"><Image src={p.image || p.images?.[0]?.src || "https://placehold.co/100"} alt={p.name || "Recently viewed product"} fill className="object-cover" /></div>
                              <div className="flex flex-col flex-1 overflow-hidden">
                                <p className="text-[13px] text-zinc-800 line-clamp-1 group-hover:underline transition-colors leading-tight mb-1">{p.name}</p>
                                {p.stock_status === 'outofstock' ? (
                                  <p className="text-[11px] text-red-600 font-medium mb-0.5">غير متوفر</p>
                                ) : (p.stock_quantity > 0 && p.stock_quantity <= 5) ? (
                                  <p className="text-[11px] text-[#f77f00] font-medium mb-0.5">يكاد ينفد (يتبقى فقط {p.stock_quantity})</p>
                                ) : (
                                  <p className="text-[11px] text-green-600 font-medium mb-0.5">متوفر</p>
                                )}
                                <div className="flex items-center justify-between">
                                  <p className="text-[16px] font-bold">{p.price || "0.00"} د.أ</p>
                                  {p.stock_status !== 'outofstock' && !isVendor && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addToCart(p, 1);
                                        setIsCartOpen(true);
                                      }}
                                      className="w-7 h-7 rounded-full border border-zinc-300 flex items-center justify-center hover:bg-zinc-100 transition-colors cursor-pointer animate-fade-in"
                                      title="أضف إلى السلة"
                                    >
                                      <ShoppingCart size={14} className="text-zinc-700" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[13px] text-zinc-500 py-4 text-center">لا توجد عناصر تمت مشاهدتها مؤخرًا.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {messagingEnabled && user && (
              <Link href="/messages" className="flex items-end p-1 sm:p-2 border border-transparent hover:border-zinc-300 rounded-sm cursor-pointer relative shrink-0">
                <div className="flex items-center gap-1 leading-none mt-1 sm:mt-1 relative">
                  <MessageSquare size={22} className="text-zinc-900 sm:w-5 sm:h-5" />
                  <span className="text-[11px] sm:text-[14px] font-bold text-zinc-900 mt-1">الرسائل</span>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-2 left-3 bg-[#e77600] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-[#131921]">
                      {unreadMessages}
                    </span>
                  )}
                </div>
              </Link>
            )}

            <Link href="/wishlist" className="flex items-end p-1 sm:p-2 border border-transparent hover:border-zinc-300 rounded-sm cursor-pointer relative shrink-0">
              <div className="flex items-center gap-1 leading-none mt-1 sm:mt-1 relative">
                <Heart size={22} className="text-zinc-900 sm:w-5 sm:h-5" />
                <span className="text-[11px] sm:text-[14px] font-bold text-zinc-900 mt-1">المفضلة</span>
                {(wishlistIds?.size > 0) && (
                  <span className="absolute -top-2 left-3 bg-[#e77600] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-[#131921]">
                    {wishlistIds.size}
                  </span>
                )}
              </div>
            </Link>

            {!isVendor && (
              <button onClick={() => setIsCartOpen(true)} className="flex items-end p-1 sm:p-2 border border-transparent hover:border-zinc-300 rounded-sm cursor-pointer relative shrink-0 group touch-target text-zinc-900">
                <div className="relative group-hover:scale-105 transition-transform flex items-center justify-center w-[36px] sm:w-[40px] h-[30px] sm:h-[34px]">
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[#f3a847] text-[15px] sm:text-[16px] font-bold z-10 leading-none">{cartItemsCount}</span>
                  <svg width="34" height="24" viewBox="0 0 38 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-2 sm:mt-3 w-8 sm:w-[34px]">
                    <path d="M14.5 25C15.8807 25 17 23.8807 17 22.5C17 21.1193 15.8807 20 14.5 20C13.1193 20 12 21.1193 12 22.5C12 23.8807 13.1193 25 14.5 25Z" fill="currentColor" />
                    <path d="M28.5 25C29.8807 25 31 23.8807 31 22.5C31 21.1193 29.8807 20 28.5 20C27.1193 20 26 21.1193 26 22.5C26 23.8807 27.1193 25 28.5 25Z" fill="currentColor" />
                    <path d="M2 2H7L10.5 17H31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 13H33L36 3H8.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[13px] sm:text-[14px] font-bold mb-1 hidden lg:block ml-1">السلة</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub Nav Bar */}
        <div className="bg-[#232f3e] relative flex items-center h-[40px]">
          {/* Scroll Right Button (Go Back) */}
          <button
            onClick={() => document.getElementById('sub-nav')?.scrollBy({ left: 150, behavior: 'smooth' })}
            className="absolute right-0 top-0 bottom-0 w-8 bg-[#232f3e] flex items-center justify-center sm:hidden z-10 text-white shadow-[-4px_0_12px_rgba(35,47,62,1)]"
            aria-label="التمرير لليمين"
          >
            <ChevronRight size={18} />
          </button>

          <div id="sub-nav" className="flex-1 text-white px-8 sm:px-4 h-full flex items-center gap-x-2 sm:gap-x-4 text-[13px] sm:text-[14px] overflow-x-auto no-scrollbar whitespace-nowrap border-b border-[#131921] sm:border-0">
            {/* Mobile-only Categories drawer toggle (hides on desktop lg) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex lg:hidden items-center gap-1 p-1.5 sm:p-2 border border-transparent hover:border-white rounded-sm font-bold cursor-pointer select-none touch-target shrink-0"
            >
              <Menu size={20} /> الأقسام
            </button>

            {/* Desktop-only Categories button wired to Off-Canvas drawer */}
            <div className="hidden lg:flex items-center h-full relative shrink-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-1.5 p-2 h-[32px] border border-transparent hover:border-white rounded-sm font-bold cursor-pointer select-none"
              >
                <Menu size={20} /> الأقسام
              </button>
            </div>

            <div className="flex items-center gap-1 lg:gap-2 flex-nowrap shrink-0">
              {[
                { label: "المتاجر", href: "/vendors" },
                { label: "منتجات مميزة", href: "/featured-products" },
                { label: "المساعدة والدعم", href: "/help" },
                { label: "تصفح جميع المنتجات", href: "/browse" }
              ].map(link => (
                <Link key={link.label} href={link.href} className="p-1.5 sm:p-2 border border-transparent hover:border-white rounded-sm shrink-0">{link.label}</Link>
              ))}
            </div>
          </div>

          {/* Scroll Left Button (See More) */}
          <button
            onClick={() => document.getElementById('sub-nav')?.scrollBy({ left: -150, behavior: 'smooth' })}
            className="absolute left-0 top-0 bottom-0 w-8 bg-[#232f3e] flex items-center justify-center sm:hidden z-10 text-white shadow-[4px_0_12px_rgba(35,47,62,1)]"
            aria-label="التمرير لليسار"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </header>
      {/* SIDEBAR */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[1000] flex">
          <div className="absolute inset-0 bg-black/80 animate-in fade-in duration-300" onClick={() => { setIsSidebarOpen(false); setIsExpanded(false); }} />
          <div className="relative w-[85vw] max-w-[365px] h-full bg-white animate-in slide-in-from-left duration-300 flex flex-col shadow-2xl overflow-hidden">
            <Link
              href={user ? "/account" : "/login"}
              onClick={() => setIsSidebarOpen(false)}
              className="bg-[#232f3e] text-white p-4 py-5 flex items-center gap-3 shrink-0 hover:bg-[#1a242f] transition-colors"
            >
              <UserCircle size={28} className="text-white" />
              <span className="text-xl font-bold tracking-tight">
                {user ? `مرحبًا، ${customerName || user.displayName || 'العميل'}` : 'تسجيل الدخول'}
              </span>
            </Link>
            <div className="flex-1 overflow-y-auto text-[#111] font-sans pb-10">
              <div className="py-4 border-b border-zinc-200">
                <h4 className="px-6 text-[18px] font-bold text-zinc-900 mb-2">الرائج</h4>
                <ul className="text-[14px]">
                  <li><Link href="/featured-products" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 flex items-center gap-3 hover:bg-zinc-100 transition-colors"><Star size={18} className="text-amber-500" /> منتجات مميزة</Link></li>
                  <li><Link href="/browse?sort=newest" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 flex items-center gap-3 hover:bg-zinc-100 transition-colors"><TrendingUp size={18} className="text-blue-500" /> المنتجات الجديدة</Link></li>
                </ul>
              </div>
              <div className="py-4 border-b border-zinc-200">
                <h4 className="px-6 text-[18px] font-bold text-zinc-900 mb-2">التسوق حسب القسم</h4>
                <ul className="text-[14px]">
                  {(isExpanded ? categories : categories.slice(0, 8)).map(cat => (
                    <li key={cat.id}>
                      <Link href={`/browse?cat=${cat.slug}`} onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 flex justify-between items-center hover:bg-zinc-100 transition-colors group">
                        {cat.name} <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-900" />
                      </Link>
                    </li>
                  ))}
                  {categories.length > 8 && (
                    <li>
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-6 py-3 w-full text-left flex items-center gap-2 text-zinc-600 hover:text-zinc-900 font-bold transition-colors"
                      >
                        {isExpanded ? (
                          <>عرض أقل <ChevronDown size={14} className="rotate-180" /></>
                        ) : (
                          <>عرض الكل <ChevronDown size={14} /></>
                        )}
                      </button>
                    </li>
                  )}
                </ul>
              </div>
              {isVendor && (
                <div className="py-4 border-b border-zinc-200">
                  <h4 className="px-6 text-[18px] font-bold text-zinc-900 mb-2">تجارنا</h4>
                  <ul className="text-[14px]">
                    <li><Link href="/vendors" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 flex items-center gap-3 hover:bg-zinc-100 transition-colors"><Store size={18} className="text-zinc-500" /> جميع البائعين</Link></li>
                    <li><Link href="/merchant/dashboard" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 flex items-center gap-3 hover:bg-zinc-100 transition-colors"><ExternalLink size={18} className="text-zinc-500" /> لوحة البائع</Link></li>
                  </ul>
                </div>
              )}
              <div className="py-4 border-b border-zinc-200">
                <h4 className="px-6 text-[18px] font-bold text-zinc-900 mb-2">الموقع</h4>
                <button
                  onClick={() => { setShowLocationModal(true); setIsSidebarOpen(false); }}
                  className="px-6 py-3 w-full text-left flex items-center gap-3 hover:bg-zinc-100 transition-colors"
                >
                  <MapPin size={18} className="text-zinc-500" />
                  <div className="flex flex-col">
                    <span className="text-[14px] text-zinc-900 font-medium">التوصيل إلى {GOVERNORATES_MAP_AR[governorate] || governorate}</span>
                    <span className="text-[12px] text-[#007185]">تحديث الموقع</span>
                  </div>
                </button>
              </div>
              <div className="py-4">
                <h4 className="px-6 text-[18px] font-bold text-zinc-900 mb-2">المساعدة والإعدادات</h4>
                <ul className="text-[14px]">
                  <li><Link href="/account" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 hover:bg-zinc-100 block">حسابك</Link></li>
                  <li><Link href="/about" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 hover:bg-zinc-100 block">عن محلي</Link></li>
                  <li><Link href="/help" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 hover:bg-zinc-100 block">خدمة العملاء</Link></li>
                  {user ? (
                    <li><button onClick={() => { logout(); setIsSidebarOpen(false); }} className="cursor-pointer px-6 py-3 w-full text-left hover:bg-zinc-100 flex items-center gap-3 text-red-600 font-bold"><LogOut size={18} className="cursor-pointer" /> تسجيل الخروج</button></li>
                  ) : (
                    <li><Link href="/login" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 hover:bg-zinc-100 block font-bold text-blue-600">تسجيل الدخول</Link></li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          {/* Close button with square border as requested */}
          <button
            onClick={() => { setIsSidebarOpen(false); setIsExpanded(false); }}
            className="absolute right-[85vw] max-sm:right-[calc(85vw+10px)] sm:right-[380px] top-5 text-white hover:text-[#febd69] transition-all z-[1100] group flex items-center justify-center w-10 h-10 border-2 border-white rounded-md bg-zinc-900/50 hover:bg-zinc-900/80 shadow-2xl"
            aria-label="Close menu"
          >
            <X size={28} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* MOBILE ACCOUNT DRAWER */}
      {isMobileAccountMenuOpen && (
        <div className="fixed inset-0 z-[1000] flex sm:hidden">
          <div className="absolute inset-0 bg-black/80 animate-in fade-in duration-300" onClick={() => setIsMobileAccountMenuOpen(false)} />
          <div className="relative w-[85vw] max-w-[365px] h-full bg-white animate-in slide-in-from-left duration-300 flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-[#232f3e] text-white p-4 py-5 flex items-center gap-3 shrink-0">
              <UserAvatar
                user={user}
                customerName={customerName}
                avatarUrl={avatarUrl}
                avatarBgColor={avatarBgColor}
                className="w-12 h-12 rounded-full text-[20px] border border-white shrink-0"
              />
              <span className="text-xl font-bold tracking-tight truncate">
                مرحبًا، {customerName || user?.displayName || 'العميل'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto text-[#111] font-sans pb-10">
              <ul className="text-[15px] text-zinc-700 py-2">
                {isAdmin && (
                  <>
                    <li><Link href="/admin" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors text-blue-600 font-bold"><ShieldCheck size={20} className="text-blue-600" /> لوحة تحكم المشرف</Link></li>
                    <li><Link href="/admin/vendors" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Store size={20} className="text-zinc-500" /> إدارة البائعين</Link></li>
                    <li><Link href="/admin/feedback" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><MessageSquare size={20} className="text-zinc-500" /> ملاحظات الموقع</Link></li>
                    <li><Link href="/admin/settings" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Settings size={20} className="text-zinc-500" /> الإعدادات العامة</Link></li>
                    <li className="border-b border-zinc-200 my-2"></li>
                  </>
                )}
                {(isApprovedVendor && !isAdmin) && (
                  <>
                    <li><Link href="/merchant/dashboard" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors text-[#c45500] font-bold"><Store size={20} className="text-[#c45500]" /> لوحة البائع</Link></li>
                    <li><Link href="/merchant/dashboard/products" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Package size={20} className="text-zinc-500" /> المنتجات</Link></li>
                    <li><Link href="/merchant/dashboard/orders" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><ShoppingCart size={20} className="text-zinc-500" /> الطلبات</Link></li>
                    <li><Link href="/merchant/dashboard/settings" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Settings size={20} className="text-zinc-500" /> إعدادات المتجر</Link></li>
                    <li className="border-b border-zinc-200 my-2"></li>
                  </>
                )}
                {!isVendor && (
                  <>
                    <li><Link href="/account" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><UserCircle size={20} className="text-zinc-600" /> ملفك الشخصي</Link></li>
                    <li><Link href="/account/orders" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Package size={20} className="text-zinc-600" /> طلباتك</Link></li>
                    {messagingEnabled && (
                      <li><Link href="/account/reviews" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><MessageSquare size={20} className="text-zinc-600" /> تقييماتك</Link></li>
                    )}
                    <li><Link href="/account/addresses" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><MapPin size={20} className="text-zinc-600" /> العناوين</Link></li>
                    <li><Link href="/account/coupons" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Tag size={20} className="text-zinc-600" /> القسائم والعروض</Link></li>
                    <li className="border-b border-zinc-200 my-2"></li>
                  </>
                )}
                <li><Link href="/account/recently-viewed" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Clock size={20} className="text-zinc-600" /> سجل التصفح</Link></li>
                <li className="pt-2 mt-2 border-t border-zinc-100">
                  <button onClick={() => { logout(); setIsMobileAccountMenuOpen(false); }} className="w-full text-right flex items-center gap-3.5 hover:bg-red-50 text-red-600 py-3 px-6 transition-colors font-bold"><LogOut size={20} /> تسجيل الخروج</button>
                </li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => setIsMobileAccountMenuOpen(false)}
            className="absolute right-[85vw] max-sm:right-[calc(85vw+10px)] sm:right-[380px] top-5 text-white hover:text-[#febd69] transition-all z-[1100] group flex items-center justify-center w-10 h-10 border-2 border-white rounded-md bg-zinc-900/50 hover:bg-zinc-900/80 shadow-2xl"
            aria-label="Close menu"
          >
            <X size={28} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* LOCATION SELECTOR MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLocationModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <h2 className="text-[17px] font-bold text-zinc-900">اختر موقعك</h2>
              <button onClick={() => setShowLocationModal(false)} className="text-zinc-400 hover:text-zinc-900"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-[13px] text-zinc-600 mb-4">قد تختلف خيارات الشحن وسرعة التوصيل حسب الموقع.</p>
              <div className="grid grid-cols-2 gap-2">
                {JORDAN_GOVERNORATES.map(gov => (
                  <button
                    key={gov}
                    onClick={() => { updateGovernorate(gov); setShowLocationModal(false); }}
                    className={`px-4 py-2 text-[14px] rounded-md border transition-all text-right ${governorate === gov ? 'bg-orange-50 border-orange-400 text-orange-700 font-bold' : 'border-zinc-200 hover:border-orange-400 hover:bg-zinc-50'}`}
                  >
                    {GOVERNORATES_MAP_AR[gov] || gov}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 text-right">
              <button onClick={() => setShowLocationModal(false)} className="px-6 py-2 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-md text-[13px] font-bold shadow-sm">تم</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
