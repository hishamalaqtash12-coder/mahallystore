"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useLocation } from "@/context/LocationContext";
import { JORDAN_GOVERNORATES, GOVERNORATES_MAP_AR } from "@/lib/constants";
import { isProductOutOfStock, getCategoryName, getProductUrl, getProductMerchant } from "@/lib/product-utils";

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
  FolderTree,
  Check,
  PlusCircle,
  BarChart3,
  Boxes,
  ChevronLeft,
  History
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

// Global client-side memory cache for mega menu categories products to survive page navigations
const megaCacheGlobal = {};

export default function Header() {
  const t = useTranslations('Header');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { cart, setIsCartOpen, addToCart } = useCart();
  const { user, customerName, isVendor, isApprovedVendor, isAdmin, logout, messagingEnabled, wooId, loading: authLoading, avatarUrl, avatarBgColor } = useAuth();
  const { wishlistIds } = useWishlist();

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileAccountMenuOpen, setIsMobileAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
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
  const [recentSearches, setRecentSearches] = useState([]);
  // Accordion state for Shop by Category
  const [openAccordionId, setOpenAccordionId] = useState(null);

  // Fallback to force hide auth spinner if Next.js router transitions freeze the context state
  const [forceHideSpinner, setForceHideSpinner] = useState(false);
  useEffect(() => {
    if (authLoading) {
      const timer = setTimeout(() => setForceHideSpinner(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setForceHideSpinner(false);
    }
  }, [authLoading, pathname]);

  useEffect(() => {
    const saved = localStorage.getItem('mahally_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) { }
    }
  }, []);

  const searchRef = useRef(null);
  const categoryHoverTimeoutRef = useRef(null);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Build hierarchy from flat categories list (WooCommerce-style: parent field)
  const mainCategories = useMemo(() => {
    if (!categories?.length) return [];

    const byParent = {};
    categories.forEach((cat) => {
      const parentId = cat.parent || 0;
      if (!byParent[parentId]) byParent[parentId] = [];
      byParent[parentId].push(cat);
    });

    const topLevel = byParent[0] || [];

    return topLevel.map((cat) => ({
      ...cat,
      children: byParent[cat.id] || [],
    }));
  }, [categories]);

  const toggleAccordion = (id) => {
    setOpenAccordionId((prev) => (prev === id ? null : id));
  };

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
          // Show stale data immediately while we check live availability
          setRecentViews(parsed.map(p => ({ ...p, availability_checked: false })));

          if (parsed.length > 0) {
            const ids = parsed.map(p => p.id).join(",");
            const res = await fetch(`/api/products?include=${ids}&per_page=${parsed.length}`);
            if (res.ok) {
              const data = await res.json();
              const liveProducts = data.products || [];

              // Always map ALL stored items — mark deleted if not returned by API
              const updatedViews = parsed.map(p => {
                const live = liveProducts.find(lp => lp.id === p.id);
                if (live) {
                  return {
                    ...p,
                    ...live,
                    image: live.images?.[0]?.src || p.image || "https://placehold.co/100",
                    is_deleted: false,
                    availability_checked: true
                  };
                }
                // Product not returned by API = deleted or unpublished
                return {
                  ...p,
                  is_deleted: true,
                  availability_checked: true
                };
              });

              setRecentViews(updatedViews);
              // Don't persist `is_deleted` to localStorage — re-check every time
              localStorage.setItem("mahally_recently_viewed", JSON.stringify(
                updatedViews.filter(p => !p.is_deleted).map(({ availability_checked, ...rest }) => rest)
              ));
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
        // Build readTimestamps from localStorage (same format as the conversations page)
        const readTimes = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`mahally_read_${wooId}_`)) {
            const partnerId = key.replace(`mahally_read_${wooId}_`, "");
            readTimes[partnerId] = Number(localStorage.getItem(key)) || 0;
          }
        }
        const encoded = encodeURIComponent(JSON.stringify(readTimes));
        const res = await fetch(`/api/messages/conversations?userId=${wooId}&readTimestamps=${encoded}`);
        if (res.ok) {
          const data = await res.json();
          // Sum unread from regular conversations + admin thread
          let count = (data.adminUnreadCount || 0);
          if (data.conversations) {
            data.conversations.forEach(conv => {
              // Skip the admin thread here, as it's already counted in adminUnreadCount
              if (conv.role !== "admin" && String(conv.id) !== "1" && String(conv.id) !== "admin") {
                if (conv.unreadCount && conv.unreadCount > 0) count += conv.unreadCount;
              }
            });
          }
          setUnreadMessages(count > 0 ? count : 0);

          // Restore any read timestamps from the server that this browser is missing
          // (fixes messages appearing unread after logout/login on this or another device)
          if (data.syncedReadTimes) {
            Object.entries(data.syncedReadTimes).forEach(([partnerId, ts]) => {
              const lsKey = `mahally_read_${wooId}_${partnerId}`;
              const existing = Number(localStorage.getItem(lsKey)) || 0;
              if (ts > existing) {
                localStorage.setItem(lsKey, ts);
              }
            });
          }
        }
      } catch (e) { }
    };

    if (wooId && messagingEnabled) {
      fetchUnread();
      // Re-check immediately whenever localStorage read-stamps change
      // (the messages page fires a custom event when it marks a chat as read)
      const onReadStamp = (e) => {
        if (e && e.detail && typeof e.detail.subtract === "number") {
          setUnreadMessages(prev => Math.max(0, prev - e.detail.subtract));
        }
        fetchUnread();
      };
      window.addEventListener("mahally_read_updated", onReadStamp);

      const handleClickOutside = (e) => {
        if (searchRef.current && !searchRef.current.contains(e.target)) {
          setShowSuggestions(false);
          setIsCategoryOpen(false);
        }
        if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
          setIsAccountMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("recently_viewed_updated", loadRecentViews);
        window.removeEventListener("mahally_read_updated", onReadStamp);
        if (categoryHoverTimeoutRef.current) {
          clearTimeout(categoryHoverTimeoutRef.current);
        }
      };
    }

    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setIsCategoryOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setIsAccountMenuOpen(false);
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
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('mahally_recent_searches', JSON.stringify(updated));

      setShowSuggestions(false);
      setIsCategoryOpen(false);
      const catParam = selectedCategory !== "All" ? `&cat=${selectedCategory}` : "";
      router.push(`/browse?q=${encodeURIComponent(q)}${catParam}`);
    }
  };

  return (
    <>
      <header className="z-[90] sticky top-0 font-sans shadow-md">

        {/* 1. TOP MAIN HEADER */}
        <div className="bg-white px-2 py-2 flex flex-wrap lg:flex-nowrap items-center min-h-[50px] border-b border-zinc-200 gap-y-2">

          {/* Top Row for Mobile (Hamburger + Logo + Icons) */}
          <div className="w-full lg:w-auto flex items-center justify-between order-1">
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Hamburger - Amazon Style */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex lg:hidden items-center justify-center p-1 border border-transparent rounded-sm text-zinc-900 shrink-0"
              >
                <Menu size={26} strokeWidth={2.5} />
              </button>

              <Link href="/" className="p-1 border border-transparent rounded-sm transition-all flex items-center shrink-0">
                <Image
                  src="/mahally-logo.webp"
                  alt="Mahally.jo Logo"
                  width={100}
                  height={35}
                  className="h-[35px] w-auto object-contain"
                  priority
                />
              </Link>
            </div>

            <div
              onClick={() => setShowLocationModal(true)}
              className="hidden lg:flex flex-col p-2 border border-transparent hover:border-zinc-300 rounded-sm cursor-pointer mx-2 shrink-0"
            >
              <span className="text-zinc-500 text-[12px] leading-none me-5">{t("deliveryTo")}</span>
              <div className="flex items-center gap-1 leading-none mt-1 text-zinc-900">
                <MapPin size={15} className="text-zinc-900" />
                <span className="text-[14px] font-bold">{locale === 'ar' ? (GOVERNORATES_MAP_AR[governorate] || governorate) : governorate}</span>
              </div>
            </div>

            {/* Icons container - moved into the top row for mobile */}
            <div className="flex lg:hidden items-center gap-1">
              <button
                onClick={() => router.replace(pathname, { locale: locale === 'ar' ? 'en' : 'ar' })}
                className="flex items-center justify-center p-1 font-bold text-[13px] text-zinc-900 shrink-0"
              >
                <Globe size={18} className="me-0.5" />
                {locale === 'ar' ? 'EN' : 'AR'}
              </button>

              <div
                className="relative flex items-center justify-center p-1 shrink-0 cursor-pointer text-zinc-900"
                onClick={() => {
                  if (!user) router.push('/login');
                  else setIsMobileAccountMenuOpen(true);
                }}
              >
                <UserCircle size={22} className={isAdmin ? 'text-blue-600' : (isApprovedVendor ? 'text-brand' : 'text-zinc-900')} />
              </div>

              {messagingEnabled && user && (
                <Link href="/messages" className="flex items-center justify-center p-1 relative shrink-0 text-zinc-900">
                  <div className="relative flex items-center justify-center w-[26px] h-[30px]">
                    {unreadMessages > 0 && (
                      <span className="absolute top-0 -end-1 bg-brand text-white text-[10px] font-bold px-1 py-0.5 rounded-full ring-1 ring-white min-w-[16px] text-center leading-none z-10">
                        {unreadMessages}
                      </span>
                    )}
                    <MessageSquare size={20} className="mt-1" />
                  </div>
                </Link>
              )}

              <button onClick={() => setIsCartOpen(true)} className="flex items-center justify-center p-1 relative shrink-0 text-zinc-900">
                <div className="relative flex items-center justify-center w-[32px] h-[30px]">
                  <span className="absolute top-0 end-1/2 -translate-x-1/2 text-brand text-[14px] font-bold z-10 leading-none">{cartItemsCount}</span>
                  <ShoppingCart size={22} className="mt-2" strokeWidth={2.2} />
                </div>
              </button>
            </div>
          </div>

          {/* Search container - Mobile 2nd row, Desktop inline */}
          <div ref={searchRef} className="w-full lg:w-auto lg:flex-1 flex flex-col relative lg:mx-2 group z-[100] order-last lg:order-2">
            <form onSubmit={handleSearch} className={`flex h-[42px] lg:h-10 w-full rounded-lg lg:rounded-md transition-shadow relative bg-white border border-zinc-300 ${showSuggestions ? 'ring-[3px] ring-brand/30 border-brand' : ''}`}>
              <input type="text" placeholder={t("searchPlaceholder")} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }} onFocus={() => { setShowSuggestions(true); setIsCategoryOpen(false); }} className="flex-1 px-3 sm:px-4 pe-10 text-zinc-900 outline-none h-full text-[14px] sm:text-[15px] bg-transparent w-0 min-w-0 rounded-s-md" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute end-[45px] top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 flex items-center justify-center"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="bg-[#f0c14b] hover:bg-[#e2b036] lg:bg-brand lg:hover:bg-brand-dark w-[45px] flex items-center justify-center text-zinc-900 lg:text-white transition-colors shrink-0 rounded-e-lg lg:rounded-e-md border border-[#a88734] lg:border-transparent">
                {isSearching ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Search size={22} />}
              </button>
            </form>
            {showSuggestions && (
              <div className="absolute top-[102%] end-0 w-full bg-white border border-zinc-300 shadow-2xl z-[150] mt-0 rounded-sm overflow-hidden text-zinc-900">
                {searchQuery.length > 0 ? (
                  suggestions.length > 0 ? (
                    <div className="py-0 flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar">
                      {suggestions.map((p) => {
                        const hasDiscount = p.regular_price && p.sale_price && Number(p.regular_price) > Number(p.sale_price);
                        const discountPercent = hasDiscount ? Math.round(((Number(p.regular_price) - Number(p.sale_price)) / Number(p.regular_price)) * 100) : 0;
                        const { name: merchantName } = getProductMerchant(p);

                        return (
                          <Link key={p.id} href={getProductUrl(p)} onClick={() => setShowSuggestions(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 border-b border-zinc-100 last:border-0 transition-colors group">
                            <div className="w-14 h-14 relative shrink-0 bg-white border border-zinc-100 rounded overflow-hidden">
                              <Image src={p.images?.[0]?.src || "https://placehold.co/100"} alt={p.name || "Product"} fill className="object-cover group-hover:scale-105 transition-transform" />
                              {hasDiscount && (
                                <div className="absolute top-0 start-0 bg-brand text-white text-[9px] font-bold px-1 py-0.5 rounded-br-sm z-10 leading-none">
                                  -{discountPercent}%
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-[13px] sm:text-[14px] leading-tight line-clamp-2 font-bold text-zinc-900 group-hover:text-brand transition-colors">{p.name}</p>
                                  {merchantName && (
                                    <div className="flex items-center gap-1 text-zinc-500">
                                      <Store size={10} />
                                      <span className="text-[10px] font-medium truncate">{merchantName}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end shrink-0 mt-0.5">
                                  <span className="text-[13px] font-bold text-brand">{p.price || "0.00"} {t('jod')}</span>
                                  {hasDiscount && (
                                    <span className="text-[11px] text-zinc-400 line-through">{p.regular_price} {t('jod')}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-2">
                                  {p.categories?.length > 0 && (
                                    <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded font-medium truncate max-w-[80px] sm:max-w-[120px]">{p.categories[0].name}</span>
                                  )}
                                  {p.stock_status === 'outofstock' ? (
                                    <span className="text-[10px] text-rose-600 font-bold px-1.5 py-0.5 bg-rose-50 rounded-sm">{t('outOfStock')}</span>
                                  ) : (p.stock_quantity > 0 && p.stock_quantity <= 5) ? (
                                    <span className="text-[10px] text-orange-600 font-bold px-1.5 py-0.5 bg-orange-50 rounded-sm">{t('almostOutOfStock')}</span>
                                  ) : null}
                                </div>

                                {Number(p.average_rating) > 0 && (
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <Star size={12} className="text-amber-400 fill-amber-400" />
                                    <span className="text-[11px] text-zinc-600 font-bold">{Number(p.average_rating).toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (!isSearching && <div className="p-4 text-zinc-400 text-sm italic">{t("noResults")}</div>)
                ) : (
                  <div className="p-4 flex flex-col gap-4">
                    <div>
                      <h4 className="text-[13px] font-bold text-zinc-800 mb-2 uppercase tracking-wider">{locale === 'ar' ? "الأقسام" : "Categories"}</h4>
                      <div className="flex flex-wrap gap-2">
                        {categories.slice(0, 8).map(cat => (
                          <Link key={cat.id} href={`/browse?cat=${cat.slug}`} onClick={() => setShowSuggestions(false)} className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[13px] rounded-full transition-colors whitespace-nowrap">
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {recentSearches.length > 0 && (
                      <div className="pt-3 border-t border-zinc-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[13px] font-bold text-zinc-800 uppercase tracking-wider">{locale === 'ar' ? "عمليات البحث الأخيرة" : "Recent Searches"}</h4>
                          <button type="button" onClick={() => { setRecentSearches([]); localStorage.removeItem('mahally_recent_searches'); }} className="text-[11px] text-zinc-500 hover:text-brand transition-colors">{locale === 'ar' ? "مسح الكل" : "Clear all"}</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((s, i) => (
                            <button key={i} type="button" onClick={() => { setSearchQuery(s); const catParam = selectedCategory !== "All" ? `&cat=${selectedCategory}` : ""; router.push(`/browse?q=${encodeURIComponent(s)}${catParam}`); setShowSuggestions(false); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-[13px] rounded-full transition-colors">
                              <History size={13} className="text-zinc-400" />
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden lg:flex order-2 lg:order-4 me-auto lg:me-0 relative items-center gap-1 sm:gap-2 lg:gap-4">
            <div
              ref={accountMenuRef}
              className={`relative flex flex-col p-1 sm:p-2 border border-transparent hover:border-zinc-300 rounded-sm shrink-0 cursor-pointer ${isAdmin ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200/50' : (isVendor ? 'bg-brand-light/40 border-brand-light/30 ring-1 ring-brand-light/20' : '')}`}
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
              {authLoading && !forceHideSpinner ? (
                <div className="flex items-center justify-center h-[34px] px-2 sm:px-6">
                  <div className="w-5 h-5 border-2 border-[#ccc] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <span className={`text-[10px] sm:text-[12px] leading-none hidden sm:flex items-center gap-1 ${isAdmin ? 'text-blue-700 font-bold' : (isApprovedVendor ? 'text-brand font-bold' : 'text-zinc-500')}`}>
                    {isAdmin && <ShieldCheck size={12} />}
                    <span>
                      {isAdmin ? `${t('adminBoard')} (${customerName || t('admin')})` : (isApprovedVendor ? `${t('vendorPortal')} (${customerName || t('merchant')})` : (user ? `${t('welcomePrefix')} ${customerName || user.displayName || t('customer')}` : t('login')))}
                    </span>
                  </span>
                  <div className="hidden sm:flex items-center gap-1 leading-none mt-1 text-zinc-900">
                    <span className={`text-[14px] font-bold ${isAdmin ? 'text-blue-800' : (isApprovedVendor ? 'text-brand' : '')}`}>{isVendor ? t('dashboard') : t('ordersAndAccount')}</span>
                    {user && <ChevronDown size={12} className={`mt-1 transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180' : ''} ${isAdmin ? 'text-blue-800' : (isApprovedVendor ? 'text-brand' : 'text-zinc-500')}`} />}
                  </div>
                  <div className="sm:hidden flex items-center justify-center text-zinc-900 p-0.5">
                    <UserCircle size={24} className={isAdmin ? 'text-blue-600' : (isApprovedVendor ? 'text-brand' : 'text-zinc-900')} />
                  </div>
                </>
              )}
              {isAccountMenuOpen && user && (!authLoading || forceHideSpinner) && (
                <div className="absolute top-[100%] end-0 pt-2 z-[200]">
                  <div className="absolute top-[4px] end-4 sm:end-10 w-4 h-4 bg-white rotate-45 border-r border-t border-zinc-200 z-[201]"></div>
                  <div className="w-[300px] sm:w-[600px] h-[420px] bg-white text-zinc-900 shadow-[0_12px_40px_rgba(0,0,0,0.18)] rounded-lg border border-zinc-200 flex flex-col sm:flex-row animate-in fade-in zoom-in-95 duration-150 overflow-hidden relative z-[200]">
                    {/* Right Side: Account Menu */}
                    <div className="flex-1 h-full min-h-0 bg-white flex flex-col relative z-10">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 shrink-0">
                        <UserAvatar
                          user={user}
                          customerName={customerName}
                          avatarUrl={avatarUrl}
                          avatarBgColor={avatarBgColor}
                          className="w-9 h-9 rounded-full text-[16px] border border-zinc-200"
                        />
                        <h3 className="font-semibold text-[15px] text-zinc-900 truncate">
                          {customerName || user.displayName || "Customer"}
                        </h3>
                      </div>
                      <ul className="text-[13.5px] text-zinc-700 flex-1 overflow-y-auto custom-scrollbar py-1.5">
                        {isAdmin && (
                          <div className="pb-1.5 mb-1.5 border-b border-zinc-100">
                            <li><Link href="/admin" className="flex items-center gap-2.5 hover:bg-blue-50/60 text-blue-600 font-semibold py-2 px-4 transition-colors"><ShieldCheck size={15} strokeWidth={1.75} className="text-blue-600 shrink-0" /> {t('adminDashboardMenu')}</Link></li>
                            <li><Link href="/admin/vendors" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><Store size={15} strokeWidth={1.75} className="text-zinc-500 shrink-0" /> {t('manageVendors')}</Link></li>
                            <li><Link href="/admin/feedback" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><MessageSquare size={15} strokeWidth={1.75} className="text-zinc-500 shrink-0" /> {t('siteFeedback')}</Link></li>
                            <li><Link href="/admin/settings" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><Settings size={15} strokeWidth={1.75} className="text-zinc-500 shrink-0" /> {t('generalSettings')}</Link></li>
                          </div>
                        )}
                        {(isApprovedVendor && !isAdmin) && (
                          <div className="pb-1.5 mb-1.5 border-b border-zinc-100">
                            <li><Link href="/merchant/dashboard" className="flex items-center gap-2.5 hover:bg-brand-light/50 text-brand font-semibold py-2 px-4 transition-colors"><Store size={15} strokeWidth={1.75} className="text-brand shrink-0" /> {t('vendorDashboard')}</Link></li>
                            <li><Link href="/merchant/dashboard/products" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><PlusCircle size={15} strokeWidth={1.75} className="text-emerald-500 shrink-0" /> {t('addNewProduct')}</Link></li>
                            <li><Link href="/merchant/dashboard/products" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><Package size={15} strokeWidth={1.75} className="text-zinc-500 shrink-0" /> {t('products')}</Link></li>
                            <li><Link href="/merchant/dashboard/inventory" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><Boxes size={15} strokeWidth={1.75} className="text-zinc-500 shrink-0" /> {t('inventory')}</Link></li>
                            <li><Link href="/merchant/dashboard/orders" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><ShoppingCart size={15} strokeWidth={1.75} className="text-zinc-500 shrink-0" /> {t('orders')}</Link></li>
                            <li><Link href="/merchant/dashboard/reviews" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><Star size={15} strokeWidth={1.75} className="text-zinc-500 shrink-0" /> {t('reviews')}</Link></li>
                            <li><Link href="/merchant/dashboard/reports" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><BarChart3 size={15} strokeWidth={1.75} className="text-zinc-500 shrink-0" /> {t('reports')}</Link></li>
                            <li><Link href="/merchant/dashboard/settings" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><Settings size={15} strokeWidth={1.75} className="text-zinc-500 shrink-0" /> {t('storeSettings')}</Link></li>
                          </div>
                        )}
                        {!isAdmin && (
                          <div className="pb-1.5 mb-1.5 border-b border-zinc-100">
                            <li><Link href="/account" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><UserCircle size={15} strokeWidth={1.75} className="text-zinc-600 shrink-0" /> {t('yourProfile')}</Link></li>
                            <li><Link href="/account/security" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><ShieldCheck size={15} strokeWidth={1.75} className="text-zinc-600 shrink-0" /> {t('accountSecurity')}</Link></li>
                            <li><Link href="/account/orders" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><Package size={15} strokeWidth={1.75} className="text-zinc-600 shrink-0" /> {t('yourOrders')}</Link></li>
                            {messagingEnabled && (
                              <li><Link href="/account/reviews" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><MessageSquare size={15} strokeWidth={1.75} className="text-zinc-600 shrink-0" /> {t('yourReviews')}</Link></li>
                            )}
                            <li><Link href="/account/addresses" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><MapPin size={15} strokeWidth={1.75} className="text-zinc-600 shrink-0" /> {t('addresses')}</Link></li>
                            <li><Link href="/account/coupons" className="flex items-center gap-2.5 hover:bg-zinc-50 py-2 px-4 transition-colors"><Tag size={15} strokeWidth={1.75} className="text-zinc-600 shrink-0" /> {t('couponsAndOffers')}</Link></li>
                          </div>
                        )}
                      </ul>
                      <div className="shrink-0 border-t border-zinc-100 p-2">
                        <button onClick={logout} className="cursor-pointer w-full flex items-center gap-2.5 hover:bg-red-50 text-red-600 py-2 px-3 rounded-md transition-colors text-[13.5px] font-medium"><LogOut className="cursor-pointer shrink-0" size={15} strokeWidth={1.75} /> {t('logout')}</button>
                      </div>
                    </div>
                    {/* Left Side: Browsing History */}
                    <div className="hidden sm:flex w-[260px] h-full min-h-0 bg-zinc-50/60 border-r border-zinc-100 flex-col relative z-10">
                      <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-100 shrink-0">
                        <Link href="/account/recently-viewed" className="font-semibold text-[14px] flex items-center gap-1 hover:text-brand transition-colors">{t('browsingHistory')} <ChevronLeft size={14} /></Link>
                      </div>
                      {recentViews.length > 0 ? (
                        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar px-4 py-3">
                          {recentViews.slice(0, 5).map((p) => {
                            const isChecked = p.availability_checked !== false;
                            const ItemWrapper = p.is_deleted ? 'div' : Link;
                            const wrapperProps = p.is_deleted
                              ? { className: "flex items-center gap-2.5 group relative block opacity-60 cursor-default" }
                              : { href: getProductUrl(p), className: "flex items-center gap-2.5 group relative block" };
                            return (
                              <ItemWrapper key={p.id} {...wrapperProps}>
                                <div className="w-11 h-11 bg-white border border-zinc-100 rounded relative shrink-0 overflow-hidden">
                                  <Image src={p.image || p.images?.[0]?.src || "https://placehold.co/100"} alt={p.name || "Recently viewed product"} fill className={`object-cover ${p.is_deleted ? 'grayscale' : ''}`} />
                                </div>
                                <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                                  <p className={`text-[12px] line-clamp-1 leading-tight mb-0.5 ${p.is_deleted ? 'text-zinc-400 line-through' : 'text-zinc-800 group-hover:underline transition-colors'}`}>{p.name}</p>
                                  {p.is_deleted ? (
                                    <p className="text-[10px] text-zinc-400 font-medium">{locale === "ar" ? "غير متوفر" : "Unavailable"}</p>
                                  ) : !isChecked ? (
                                    <p className="text-[10px] text-zinc-400 animate-pulse">{locale === "ar" ? "جارٍ التحقق..." : "Checking..."}</p>
                                  ) : p.stock_status === 'outofstock' ? (
                                    <p className="text-[10px] text-red-600 font-medium">{t("outOfStock")}</p>
                                  ) : (
                                    <p className={`text-[12px] font-bold ${p.is_deleted ? 'text-zinc-300' : ''}`}>{p.price || "0.00"} {t('jod')}</p>
                                  )}
                                </div>
                              </ItemWrapper>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[12.5px] text-zinc-500 flex-1 flex items-center justify-center text-center px-6">{t("noRecentItems")}</p>
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
                  <span className="text-[11px] sm:text-[14px] font-bold text-zinc-900 mt-1">{t("messages")}</span>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-2 end-3 bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                      {unreadMessages}
                    </span>
                  )}
                </div>
              </Link>
            )}

            <Link href="/wishlist" className="flex items-end p-1 sm:p-2 border border-transparent hover:border-zinc-300 rounded-sm cursor-pointer relative shrink-0">
              <div className="flex items-center gap-1 leading-none mt-1 sm:mt-1 relative">
                <Heart size={22} className="text-zinc-900 sm:w-5 sm:h-5" />
                <span className="text-[11px] sm:text-[14px] font-bold text-zinc-900 mt-1">{t("wishlist")}</span>
                {(wishlistIds?.size > 0) && (
                  <span className="absolute -top-2 end-3 bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                    {wishlistIds.size}
                  </span>
                )}
              </div>
            </Link>

            <button
              onClick={() => router.replace(pathname, { locale: locale === 'ar' ? 'en' : 'ar' })}
              className="flex items-center cursor-pointer justify-center p-1 sm:p-2 border border-transparent hover:border-zinc-300 rounded-sm font-bold text-[14px] text-zinc-900 shrink-0"
            >
              <Globe size={18} className="me-1 sm:ms-1" />
              {locale === 'ar' ? 'EN' : 'AR'}
            </button>
            {true && (
              <button onClick={() => setIsCartOpen(true)} className="flex items-end p-1 sm:p-2 border border-transparent hover:border-zinc-300 rounded-sm cursor-pointer relative shrink-0 group touch-target text-zinc-900">
                <div className="relative group-hover:scale-105 transition-transform flex items-center justify-center w-[36px] sm:w-[40px] h-[30px] sm:h-[34px]">
                  <span className="absolute top-0 end-1/2 -translate-x-1/2 text-brand text-[15px] sm:text-[16px] font-bold z-10 leading-none">{cartItemsCount}</span>
                  <svg width="34" height="24" viewBox="0 0 38 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-2 sm:mt-3 w-8 sm:w-[34px]">
                    <path d="M14.5 25C15.8807 25 17 23.8807 17 22.5C17 21.1193 15.8807 20 14.5 20C13.1193 20 12 21.1193 12 22.5C12 23.8807 13.1193 25 14.5 25Z" fill="currentColor" />
                    <path d="M28.5 25C29.8807 25 31 23.8807 31 22.5C31 21.1193 29.8807 20 28.5 20C27.1193 20 26 21.1193 26 22.5C26 23.8807 27.1193 25 28.5 25Z" fill="currentColor" />
                    <path d="M2 2H7L10.5 17H31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 13H33L36 3H8.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[13px] sm:text-[14px] font-bold mb-1 hidden lg:block me-1">{t("cart")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub Nav Bar */}
        <div className="bg-brand-dark relative flex items-center h-[40px]">
          {/* Scroll Right Button (Go Back) */}
          <button
            onClick={() => document.getElementById('sub-nav')?.scrollBy({ left: 150, behavior: 'smooth' })}
            className="absolute start-0 top-0 bottom-0 w-8 bg-brand-dark flex items-center justify-center sm:hidden z-10 text-white shadow-[-4px_0_12px_rgba(143,45,74,0.5)]"
            aria-label={t('scrollRight')}
          >
            <ChevronRight size={18} />
          </button>

          <div id="sub-nav" className="flex-1 text-white px-8 sm:px-4 h-full flex items-center gap-x-2 sm:gap-x-4 text-[13px] sm:text-[14px] overflow-x-auto no-scrollbar whitespace-nowrap border-b border-brand-dark sm:border-0">
            {/* Mobile-only Categories drawer toggle (hides on desktop lg) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex lg:hidden items-center gap-1 p-1.5 sm:p-2 border border-transparent hover:border-white rounded-sm font-bold cursor-pointer select-none touch-target shrink-0"
            >
              <Menu size={20} /> {t('categoriesMenu')}
            </button>

            {/* Desktop-only Categories button wired to Off-Canvas drawer */}
            <div className="hidden lg:flex items-center h-full relative shrink-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-1.5 p-2 h-[32px] border border-transparent hover:border-white rounded-sm font-bold cursor-pointer select-none"
              >
                <Menu size={20} /> {t('categoriesMenu')}
              </button>
            </div>

            <div className="flex items-center gap-1 lg:gap-2 flex-nowrap shrink-0">
              {[
                { label: t("vendors"), href: "/vendors" },
                { label: t("browseAllProducts"), href: "/browse" },
                { label: t("featuredProducts"), href: "/featured-products" },
                { label: t("helpAndSupport"), href: "/help" },
              ].map(link => (
                <Link key={link.label} href={link.href} className="p-1.5 sm:p-2 border border-transparent hover:border-white rounded-sm shrink-0">{link.label}</Link>
              ))}
            </div>
          </div>

          {/* Scroll Left Button (See More) */}
          <button
            onClick={() => document.getElementById('sub-nav')?.scrollBy({ left: -150, behavior: 'smooth' })}
            className="absolute end-0 top-0 bottom-0 w-8 bg-brand-dark flex items-center justify-center sm:hidden z-10 text-white shadow-[4px_0_12px_rgba(143,45,74,0.5)]"
            aria-label={t('scrollLeft')}
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </header>

      {/* SIDEBAR */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[1000] flex">
          <div
            className="absolute inset-0 bg-black/80 animate-in fade-in duration-300"
            onClick={() => {
              setIsSidebarOpen(false);
              setIsExpanded(false);
              setOpenAccordionId(null);
            }}
          />
          <div className="relative w-[85vw] max-w-[365px] h-full bg-white animate-in slide-in-from-left duration-300 flex flex-col shadow-2xl overflow-hidden">
            <Link
              href={user ? "/account" : "/login"}
              onClick={() => setIsSidebarOpen(false)}
              className="bg-brand-dark text-white p-4 py-5 flex items-center gap-3 shrink-0 hover:bg-brand-dark/90 transition-colors"
            >
              <UserCircle size={28} className="text-white" />
              <span className="text-xl font-bold tracking-tight">
                {user ? `${t('welcomePrefix')} ${customerName || user.displayName || t('customer')}` : t('login')}
              </span>
            </Link>
            <div className="flex-1 overflow-y-auto text-[#111] font-sans pb-10">
              <div className="py-4 border-b border-zinc-200">
                <h4 className="px-6 text-[18px] font-bold text-zinc-900 mb-2">{t('trending')}</h4>
                <ul className="text-[14px]">
                  <li><Link href="/featured-products" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 flex items-center gap-3 hover:bg-zinc-100 transition-colors"><Star size={18} className="text-amber-500" /> {t('featuredProductsMenu')}</Link></li>
                  <li><Link href="/browse?sort=newest" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 flex items-center gap-3 hover:bg-zinc-100 transition-colors"><TrendingUp size={18} className="text-blue-500" /> {t('newProducts')}</Link></li>
                </ul>
              </div>

              {/* ===== SHOP BY CATEGORY – ACCORDION ===== */}
              <div className="py-4 border-b border-zinc-200">
                <h4 className="px-6 text-[18px] font-bold text-zinc-900 mb-2">{t('shopByCategory')}</h4>

                {mainCategories.length > 0 ? (
                  <ul className="text-[14px]">
                    {(isExpanded ? mainCategories : mainCategories.slice(0, 8)).map((cat) => {
                      const hasChildren = cat.children && cat.children.length > 0;
                      const isOpen = openAccordionId === cat.id;

                      return (
                        <li key={cat.id} className="border-b border-zinc-100 last:border-b-0">
                          {/* Accordion header */}
                          <div className="flex items-center">
                            <Link
                              href={`/browse?cat=${cat.slug}`}
                              onClick={() => setIsSidebarOpen(false)}
                              className="flex-1 px-6 py-3 hover:bg-zinc-100 transition-colors font-medium flex items-center justify-between"
                            >
                              <span>{decodeHtml(getCategoryName(cat, locale))}</span>
                              {cat.count !== undefined && (
                                <span className="text-[11px] text-zinc-500 bg-zinc-200/50 px-2 py-0.5 rounded-full font-bold ms-2">
                                  {cat.count}
                                </span>
                              )}
                            </Link>

                            {hasChildren ? (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleAccordion(cat.id);
                                }}
                                className="px-4 py-3 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                                aria-expanded={isOpen}
                                aria-label={isOpen ? "Collapse" : "Expand"}
                              >
                                <ChevronDown
                                  size={18}
                                  className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                />
                              </button>
                            ) : (
                              <span className="px-4 py-3">
                                <ChevronRight size={16} className="text-zinc-400" />
                              </span>
                            )}
                          </div>

                          {/* Accordion content – sub-categories */}
                          {hasChildren && (
                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                }`}
                            >
                              <ul className="bg-zinc-50/70 pb-1">
                                {cat.children.map((child) => (
                                  <li key={child.id}>
                                    <Link
                                      href={`/browse?cat=${child.slug}`}
                                      onClick={() => setIsSidebarOpen(false)}
                                      className="px-10 py-2.5 flex items-center justify-between text-[13px] text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors group"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0 group-hover:bg-brand transition-colors" />
                                        <span>{decodeHtml(getCategoryName(child, locale))}</span>
                                      </div>
                                      {child.count !== undefined && (
                                        <span className="text-[10px] text-zinc-400 font-medium">
                                          {child.count}
                                        </span>
                                      )}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      );
                    })}

                    {mainCategories.length > 8 && (
                      <li>
                        <button
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="px-6 py-3 w-full text-end flex items-center gap-2 text-zinc-600 hover:text-zinc-900 font-bold transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              {t('viewLess')} <ChevronDown size={14} className="rotate-180" />
                            </>
                          ) : (
                            <>
                              {t('viewAllMenu')} <ChevronDown size={14} />
                            </>
                          )}
                        </button>
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="px-6 py-5 mx-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center gap-2 mb-2">
                    <FolderTree size={28} className="text-zinc-400" />
                    <p className="text-[13px] text-zinc-500 font-medium">
                      {locale === 'ar' ? "لا توجد أقسام حالياً." : "No categories found."}
                    </p>
                    <Link
                      href="/browse"
                      onClick={() => setIsSidebarOpen(false)}
                      className="mt-1 text-xs font-bold text-brand hover:underline"
                    >
                      {locale === 'ar' ? "تصفح جميع المنتجات" : "Browse All Products"}
                    </Link>
                  </div>
                )}
              </div>

              {isVendor && (
                <div className="py-4 border-b border-zinc-200">
                  <h4 className="px-6 text-[18px] font-bold text-zinc-900 mb-2">{t('ourMerchants')}</h4>
                  <ul className="text-[14px]">
                    <li><Link href="/vendors" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 flex items-center gap-3 hover:bg-zinc-100 transition-colors"><Store size={18} className="text-zinc-500" /> {t('allVendors')}</Link></li>
                    <li><Link href="/merchant/dashboard" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 flex items-center gap-3 hover:bg-zinc-100 transition-colors"><ExternalLink size={18} className="text-zinc-500" /> {t('vendorDashboard')}</Link></li>
                  </ul>
                </div>
              )}
              <div className="py-4 border-b border-zinc-200">
                <h4 className="px-6 text-[18px] font-bold text-zinc-900 mb-2">{t('location')}</h4>
                <button
                  onClick={() => { setShowLocationModal(true); setIsSidebarOpen(false); }}
                  className="px-6 py-3 w-full text-end flex items-center gap-3 hover:bg-zinc-100 transition-colors"
                >
                  <MapPin size={18} className="text-zinc-500" />
                  <div className="flex flex-col">
                    <span className="text-[14px] text-zinc-900 font-medium">{t('deliveryToGov')} {locale === 'ar' ? (GOVERNORATES_MAP_AR[governorate] || governorate) : governorate}</span>
                    <span className="text-[12px] text-brand hover:underline">{t('updateLocation')}</span>
                  </div>
                </button>
              </div>
              <div className="py-4">
                <h4 className="px-6 text-[18px] font-bold text-zinc-900 mb-2">{t('helpAndSettings')}</h4>
                <ul className="text-[14px]">
                  <li><Link href="/account" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 hover:bg-zinc-100 block">{t('yourAccount')}</Link></li>
                  <li><Link href="/about" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 hover:bg-zinc-100 block">{t('aboutMahally')}</Link></li>
                  <li><Link href="/help" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 hover:bg-zinc-100 block">{t('customerService')}</Link></li>
                  {user ? (
                    <li><button onClick={() => { logout(); setIsSidebarOpen(false); }} className="cursor-pointer px-6 py-3 w-full text-end hover:bg-zinc-100 flex items-center gap-3 text-red-600 font-bold"><LogOut size={18} className="cursor-pointer" /> {t('logout')}</button></li>
                  ) : (
                    <li><Link href="/login" onClick={() => setIsSidebarOpen(false)} className="px-6 py-3 hover:bg-zinc-100 block font-bold text-blue-600">{t("login")}</Link></li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          {/* Close button with square border as requested */}
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setIsExpanded(false);
              setOpenAccordionId(null);
            }}
            className="absolute start-[85vw] max-sm:start-[calc(85vw+10px)] sm:start-[380px] top-5 text-white hover:text-brand-light transition-all z-[1100] group flex items-center justify-center w-10 h-10 border-2 border-white rounded-md bg-zinc-900/50 hover:bg-zinc-900/80 shadow-2xl"
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
          <div className="relative w-[85vw] max-w-[365px] h-full h-[100dvh] bg-white animate-in slide-in-from-left duration-300 flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-brand-dark text-white p-4 py-5 flex items-center gap-3 shrink-0">
              <UserAvatar
                user={user}
                customerName={customerName}
                avatarUrl={avatarUrl}
                avatarBgColor={avatarBgColor}
                className="w-12 h-12 rounded-full text-[20px] border border-white shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-bold tracking-tight truncate">
                  {t('welcomePrefix')} {customerName || user?.displayName || t('customer')}
                </span>
                <span className="text-[12px] text-zinc-300 font-medium">
                  {isAdmin ? t('adminBoard') : (isApprovedVendor ? t('vendorPortal') : t('customer'))}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col text-[#111] font-sans">
              <ul className="text-[15px] text-zinc-700 py-2 flex-1 overflow-y-auto pb-6">
                {isAdmin && (
                  <>
                    <li><Link href="/admin" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors text-blue-600 font-bold"><ShieldCheck size={20} className="text-blue-600" /> {t('adminDashboardMenu')}</Link></li>
                    <li><Link href="/admin/vendors" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Store size={20} className="text-zinc-500" /> {t('manageVendors')}</Link></li>
                    <li><Link href="/admin/feedback" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><MessageSquare size={20} className="text-zinc-500" /> {t('siteFeedback')}</Link></li>
                    <li><Link href="/admin/settings" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Settings size={20} className="text-zinc-500" /> {t('generalSettings')}</Link></li>
                    <li className="border-b border-zinc-200 my-2"></li>
                  </>
                )}
                {(isApprovedVendor && !isAdmin) && (
                  <>
                    <li><Link href="/merchant/dashboard" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors text-brand font-bold"><Store size={20} className="text-brand" /> {t('vendorDashboard')}</Link></li>
                    <li><Link href="/merchant/dashboard/products" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Package size={20} className="text-zinc-500" /> {t('products')}</Link></li>
                    <li><Link href="/merchant/dashboard/orders" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><ShoppingCart size={20} className="text-zinc-500" /> {t('orders')}</Link></li>
                    <li><Link href="/merchant/dashboard/settings" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Settings size={20} className="text-zinc-500" /> {t('storeSettings')}</Link></li>
                    <li className="border-b border-zinc-200 my-2"></li>
                  </>
                )}
                {!isAdmin && !isApprovedVendor && (
                  <>
                    <li><Link href="/account" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><UserCircle size={20} className="text-zinc-600" /> {t('yourProfile')}</Link></li>
                    <li><Link href="/account/security" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><ShieldCheck size={20} className="text-zinc-600" /> {t('accountSecurity')}</Link></li>
                    <li><Link href="/account/orders" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Package size={20} className="text-zinc-600" /> {t('yourOrders')}</Link></li>
                    <li><Link href="/wishlist" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Heart size={20} className="text-zinc-600" /> {t('wishlist')}</Link></li>
                    {messagingEnabled && (
                      <>
                        <li><Link href="/messages" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><MessageSquare size={20} className="text-zinc-600" /> {t('messages')}</Link></li>
                        <li><Link href="/account/reviews" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Star size={20} className="text-zinc-600" /> {t('yourReviews')}</Link></li>
                      </>
                    )}
                    <li><Link href="/account/addresses" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><MapPin size={20} className="text-zinc-600" /> {t('addresses')}</Link></li>
                    <li><Link href="/account/coupons" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Tag size={20} className="text-zinc-600" /> {t('couponsAndOffers')}</Link></li>
                    <li className="border-b border-zinc-200 my-2"></li>
                  </>
                )}
                <li><Link href="/account/recently-viewed" onClick={() => setIsMobileAccountMenuOpen(false)} className="flex items-center gap-3.5 hover:bg-zinc-100 py-3 px-6 transition-colors"><Clock size={20} className="text-zinc-600" /> {t('browsingHistory')}</Link></li>
              </ul>
              <div className="p-4 border-t border-zinc-200 shrink-0 bg-zinc-50" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
                <button onClick={() => { logout(); setIsMobileAccountMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 hover:bg-red-50 text-red-600 py-3 px-4 transition-colors font-bold rounded-lg border border-red-200/50 bg-white shadow-sm">
                  <LogOut size={20} /> {t('logout')}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileAccountMenuOpen(false)}
            className="absolute start-[85vw] max-sm:start-[calc(85vw+10px)] sm:start-[380px] top-5 text-white hover:text-brand-light transition-all z-[1100] group flex items-center justify-center w-10 h-10 border-2 border-white rounded-md bg-zinc-900/50 hover:bg-zinc-900/80 shadow-2xl"
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
              <h2 className="text-[17px] font-bold text-zinc-900">{t('chooseLocation')}</h2>
              <button onClick={() => setShowLocationModal(false)} className="text-zinc-400 hover:text-zinc-900"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-[13px] text-zinc-600 mb-4">{t('shippingOptionsMayVary')}</p>
              <div className="grid grid-cols-2 gap-2">
                {JORDAN_GOVERNORATES.map(gov => (
                  <button
                    key={gov}
                    onClick={() => { updateGovernorate(gov); setShowLocationModal(false); }}
                    className={`px-4 py-2 text-[14px] rounded-md border transition-all text-start ${governorate === gov ? 'bg-brand-light border-brand text-brand-dark font-bold' : 'border-zinc-200 hover:border-brand hover:bg-brand-light/20'}`}
                  >
                    {locale === 'ar' ? (GOVERNORATES_MAP_AR[gov] || gov) : gov}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 text-start">
              <button onClick={() => setShowLocationModal(false)} className="px-6 py-2 bg-brand hover:bg-brand-dark border-brand text-white rounded-md text-[13px] font-bold shadow-sm">{t('done')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}