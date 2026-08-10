"use client";

import { Search, Menu, ChevronDown, User, Settings, LogOut, RefreshCw, Navigation, Globe, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";

// Static routing/category metadata — the human-facing text comes from translations,
// keyed here so we can map over them and call t() per item.
const MERCHANT_PAGE_KEYS = [
  { key: "dashboardHome", path: "/merchant/dashboard" },
  { key: "manageProducts", path: "/merchant/dashboard/products" },
  { key: "inventory", path: "/merchant/dashboard/inventory" },
  { key: "orders", path: "/merchant/dashboard/orders" },
  { key: "coupons", path: "/merchant/dashboard/coupons" },
  { key: "advertising", path: "/merchant/dashboard/advertising" },
  { key: "reviews", path: "/merchant/dashboard/reviews" },
  { key: "announcements", path: "/merchant/dashboard/announcements" },
  { key: "withdraw", path: "/merchant/dashboard/withdraw" },
  { key: "settingsPage", path: "/merchant/dashboard/settings" },
];

export default function DashboardHeader({ onMenuClick }) {
  const t = useTranslations("DashboardHeader");
  const locale = useLocale();
  const isAr = locale === "ar";

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { user, customerName, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const accountMenuRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const merchantPages = MERCHANT_PAGE_KEYS.map((item) => ({
    ...item,
    title: t(`pages.${item.key}.title`),
    description: t(`pages.${item.key}.description`),
    category: t(`pages.${item.key}.category`),
  }));

  const showSearchResults = isSearchFocused && searchQuery.trim().length > 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleReload = () => {
    window.dispatchEvent(new CustomEvent('refresh-dashboard'));
  };

  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  const results = merchantPages.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-30 h-[60px] bg-white border-b border-zinc-200 px-4 lg:px-8 flex items-center justify-between gap-4">
      
      {/* Right Side in RTL (Hamburger + Search) */}
      <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-1.5 sm:p-2 -mx-1.5 sm:-mx-2 rounded-md hover:bg-zinc-50 text-zinc-600 transition-colors shrink-0"
        >
          <Menu size={22} />
        </button>

        {/* Search Area */}
        <div ref={searchRef} className="relative block flex-1 max-w-[16rem] lg:max-w-sm group">
          <div className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-zinc-400">
            <Search size={14} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder={t("searchPlaceholder")}
            className="w-full h-[34px] bg-white border border-zinc-300 rounded-md pe-9 ps-8 text-[13px] focus:border-[#be374f] transition-all outline-none shadow-inner"
          />
          {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label={t("clearSearch")}
            className="absolute inset-y-0 start-2 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X size={14} />
          </button>
        )}

        {showSearchResults && (
          <div className="absolute end-0 start-0 mt-2 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-zinc-100 max-h-[350px] overflow-y-auto animate-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 bg-zinc-50 flex items-center justify-between text-[10px] font-bold text-zinc-400">
              <span>{t("searchResults")}</span>
              <span>{t("escToClose")}</span>
            </div>
            <div className="py-1">
              {results.length === 0 ? (
                <div className="px-4 py-5 text-center text-[12px] text-zinc-400">
                  {t("noResults")}
                </div>
              ) : (
                results.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      router.push(item.path);
                      setSearchQuery("");
                      setIsSearchFocused(false);
                    }}
                    className="w-full text-start px-4 py-2 hover:bg-zinc-50 flex items-start gap-2.5 transition-colors group cursor-pointer"
                  >
                    <div className="h-6 w-6 rounded bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-200 group-hover:text-zinc-800 transition-colors shrink-0">
                      <Navigation size={11} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-zinc-700 truncate group-hover:text-zinc-900">{item.title}</span>
                        <span className="text-[9px] font-bold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 shrink-0">{item.category}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5 truncate leading-none">{item.description}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Left Side in RTL (Actions + Account) */}
      <div className="flex items-center gap-1 sm:gap-4 shrink-0">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={handleReload}
            title={t("reloadData")}
            className="p-1.5 sm:p-2 rounded-md hover:bg-zinc-50 transition-colors text-zinc-600 shrink-0"
          >
            <RefreshCw size={18} />
          </button>
          <button onClick={() => router.push('/merchant/dashboard/settings')} className="hidden sm:block p-1.5 sm:p-2 rounded-md hover:bg-zinc-50 transition-colors text-zinc-600 shrink-0">
            <Settings size={18} />
          </button>
          <button
            onClick={() => router.replace(pathname, { locale: isAr ? 'en' : 'ar' })}
            title={t("switchLanguage")}
            className="p-1.5 sm:p-2 rounded-md hover:bg-zinc-50 transition-colors text-zinc-600 shrink-0"
          >
            <Globe size={18} />
            <span className="sr-only">{isAr ? 'EN' : 'AR'}</span>
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-200 mx-1 sm:mx-2 shrink-0" />

        <div className="relative" ref={accountMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-1 sm:px-3 h-[36px] rounded-md hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-200 shrink-0"
          >
            <div className="w-8 h-8 rounded-full bg-[#febd69] flex items-center justify-center font-bold text-[12px] text-zinc-900 border border-zinc-200 shrink-0">
              {customerName ? customerName[0].toUpperCase() : (user?.displayName ? user.displayName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "U"))}
            </div>
            <div className="hidden sm:flex flex-col items-start min-w-0">
              <span className="text-[13px] font-bold text-zinc-700 leading-tight truncate max-w-[100px] lg:max-w-[150px]">{customerName || user?.displayName || (user?.phoneNumber ? t("merchantFallback") : t("userFallback"))}</span>
              <span className="text-[10px] text-zinc-400 font-medium truncate">{t("sellerAccount")}</span>
            </div>
            <ChevronDown size={12} className={`hidden sm:block text-zinc-400 transition-transform shrink-0 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute end-0 mt-1 w-56 bg-white border border-zinc-200 rounded-md shadow-lg py-2 z-50">
              <button onClick={() => { router.push('/merchant/dashboard/settings'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                <User size={16} /> {t("storeProfile")}
              </button>
              <button onClick={() => { router.push('/merchant/dashboard/settings'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                <Settings size={16} /> {t("settings")}
              </button>
              <div className="h-px bg-zinc-100 my-1" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} className="cursor-pointer text-zinc-400" /> {t("signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}