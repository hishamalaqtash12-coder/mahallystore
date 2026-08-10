"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import {
  Search,
  Store,
  ChevronRight,
  ChevronDown,
  Star,
  Loader2,
  Check,
  CheckCircle,
  Filter,
  X,
  Award,
  MapPin,
  Heart,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ShoppingBag,
  Verified,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLocale } from "next-intl";
import { Eye } from "lucide-react";
import VendorQuickLookModal from "@/components/VendorQuickLookModal";

export default function VendorsPage() {
  const t = useTranslations("VendorsPage");
  const locale = useLocale();
  const isAr = locale === "ar";
  const { wooId } = useAuth();

  // State
  const [vendors, setVendors] = useState([]);
  const [followedStores, setFollowedStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState({});
  const [following, setFollowing] = useState(new Set());
  const [quickViewVendor, setQuickViewVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minRating, setMinRating] = useState(null);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState("Featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const itemsPerPage = 12;
  const searchInputRef = useRef(null);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedCategory, minRating, onlyVerified, sortBy]);

  // Fetch vendors and followed status
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes] = await Promise.all([
          fetch(`/api/vendors?t=${Date.now()}`, { cache: 'no-store' }),
        ]);

        const vData = await vRes.json();
        setVendors(Array.isArray(vData.vendors) ? vData.vendors : []);

        if (wooId) {
          const uRes = await fetch(`/api/vendors/follow/status?userId=${wooId}&t=${Date.now()}`, { cache: 'no-store' });
          const contentType = uRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const uData = await uRes.json();
            setFollowedStores(uData.followed || []);
          } else {
            console.warn("Follow status API did not return JSON");
            setFollowedStores([]);
          }
        }
      } catch (err) {
        console.error("Vendors fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [wooId]);

  // Handle follow/unfollow
  const handleToggleFollow = useCallback(async (vId) => {
    if (!wooId || loadingStores[vId]) return;

    setLoadingStores(prev => ({ ...prev, [vId]: true }));
    const isFollowing = followedStores.some(id => id === vId);
    const action = isFollowing ? 'unfollow' : 'follow';

    // Optimistic update
    setFollowedStores(prev =>
      action === 'follow' ? [...prev, vId] : prev.filter(id => id !== vId)
    );

    try {
      await fetch("/api/vendors/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: vId, userId: wooId, action })
      });
    } catch (err) {
      console.error("Follow error:", err);
      // Rollback on error
      setFollowedStores(prev =>
        action === 'unfollow' ? [...prev, vId] : prev.filter(id => id !== vId)
      );
    } finally {
      setLoadingStores(prev => ({ ...prev, [vId]: false }));
    }
  }, [wooId, followedStores, loadingStores]);

  // Derived data
  const categories = useMemo(() =>
    ["All", ...new Set(vendors.map(v => v.storeCategory).filter(Boolean))]
    , [vendors]);

  const filteredAndSortedVendors = useMemo(() => {
    let filtered = vendors.filter((v) => {
      const matchQuery = !query ||
        v.storeName.toLowerCase().includes(query.toLowerCase()) ||
        v.storeDescription?.toLowerCase().includes(query.toLowerCase());
      const matchCategory = selectedCategory === "All" || v.storeCategory === selectedCategory;
      const matchRating = !minRating || Math.round(v.rating || 0) >= minRating;
      const matchVerified = !onlyVerified || v.isVerified;

      return matchQuery && matchCategory && matchRating && matchVerified;
    });

    // Sort
    switch (sortBy) {
      case "Top Rated":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "Newest":
        filtered.sort((a, b) =>
          new Date(b.dateCreated || 0).getTime() - new Date(a.dateCreated || 0).getTime()
        );
        break;
      case "Most Followed":
        filtered.sort((a, b) => (b.followers || 0) - (a.followers || 0));
        break;
      default: // Featured
        filtered.sort((a, b) => {
          const scoreA = (a.isVerified ? 10 : 0) + (a.rating || 0) * 2;
          const scoreB = (b.isVerified ? 10 : 0) + (b.rating || 0) * 2;
          return scoreB - scoreA;
        });
        break;
    }

    return filtered;
  }, [vendors, query, selectedCategory, minRating, onlyVerified, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedVendors.length / itemsPerPage);
  const paginatedVendors = useMemo(() =>
    filteredAndSortedVendors.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )
    , [filteredAndSortedVendors, currentPage, itemsPerPage]);

  const getPageNumbers = useCallback(() => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  // Handlers
  const handleClearFilters = () => {
    setQuery("");
    setSelectedCategory("All");
    setMinRating(null);
    setOnlyVerified(false);
    setSortBy("Featured");
    setCurrentPage(1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setQuery('');
    }
  };

  // Render star rating
  const renderStars = (rating = 0) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          className={`${i < Math.round(rating)
            ? 'text-amber-400 fill-amber-400'
            : 'text-gray-300 fill-gray-300'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="bg-[#f6f6f6] min-h-screen pb-20">
      <div className="flex flex-col mx-auto w-full">
        {/* ── Page Heading & Summary (Amazon Style Unified Top Bar) ── */}
        <div className="py-2.5 px-4 bg-[#F8F9FA] border-y border-[#E5E5E5] flex flex-col md:flex-row md:items-center justify-between gap-3 w-full select-none text-start">
          <div className="text-[13px] text-[#0F1111] font-normal flex items-center gap-2 flex-wrap">
            {loading ? (
              <span>{t("loadingStores")}</span>
            ) : (
              <>
                <span className="font-bold">{filteredAndSortedVendors.length}</span>
                <span>{t("storeCount")}</span>
                {filteredAndSortedVendors.length > 0 && (
                  <span className="text-[#565959] ms-2 border-s border-[#D5D9D9] ps-2">
                    {t("showing", {
                      start: (currentPage - 1) * itemsPerPage + 1,
                      end: Math.min(currentPage * itemsPerPage, filteredAndSortedVendors.length)
                    })}
                  </span>
                )}
                {query && (
                  <span className="font-bold text-brand ms-1 border-s border-[#D5D9D9] ps-2">
                    &quot;{query}&quot;
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative group min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={16} />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("searchPlaceholder")}
                className="w-full h-8 pl-9 pr-3 bg-white border border-[#D5D9D9] rounded-md text-[13px] outline-none focus:ring-1 focus:ring-brand focus:border-brand shadow-[0_2px_5px_0_rgba(213,219,219,0.3)] transition-all placeholder:text-gray-400"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[13px] text-[#565959] font-normal">{t("sortBy")}</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-8 pe-2.5 ps-8 bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-md shadow-[0_2px_5px_0_rgba(213,219,219,0.3)] text-[13px] text-[#0f1111] appearance-none cursor-pointer outline-none font-normal hover:border-[#B5B9B9] transition-all"
                >
                  <option value="Featured">{t("featured")}</option>
                  <option value="Newest">{t("newest")}</option>
                  <option value="Top Rated">{t("topRated")}</option>
                  <option value="Most Followed">{t("mostFollowed")}</option>
                </select>
                <ChevronDown size={12} className="absolute start-2 top-1/2 -translate-y-1/2 text-[#565959] pointer-events-none" />
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#F0F2F2] rounded-md p-1 border border-[#D5D9D9]">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded-sm transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-brand" : "text-[#565959] hover:text-[#0f1111]"}`}
                aria-label={t("gridView") || "Grid view"}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1 rounded-sm transition-all ${viewMode === "list" ? "bg-white shadow-sm text-brand" : "text-[#565959] hover:text-[#0f1111]"}`}
                aria-label={t("listView") || "List view"}
              >
                <List size={14} />
              </button>
            </div>

            {/* Mobile Filters Toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-1.5 h-8 px-4 border border-[#D5D9D9] rounded-md text-[13px] font-medium text-[#0F1111] bg-[#F0F2F2] hover:bg-[#E3E6E6] transition-colors shadow-[0_2px_5px_0_rgba(213,219,219,0.3)]"
            >
              <SlidersHorizontal size={14} />
              {t("filters")}
              {(selectedCategory !== "All" || minRating || onlyVerified) && (
                <span className="w-2 h-2 bg-brand rounded-full ms-1" />
              )}
            </button>
          </div>
        </div>

        {/* Main layout: Sidebar + Content */}
        <div className="flex gap-5 items-start w-full px-2 lg:px-4 mt-6">

          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block sticky top-[76px] max-h-[calc(100vh-80px)] overflow-y-auto w-[240px] shrink-0 pe-4 lg:border-l border-[#E5E5E5] min-h-[500px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-bold text-[#0F1111] tracking-tight flex items-center gap-2">
                  <SlidersHorizontal size={16} />
                  {t("filters")}
                </h2>
              </div>

              {/* Active Filters Summary */}
              {(selectedCategory !== "All" || minRating || onlyVerified || query) && (
                <div className="mb-4">
                  <h3 className="text-[14px] font-bold text-[#0F1111] mb-1.5 mt-4 tracking-tight select-none">
                    {t("activeFilters")}
                  </h3>
                  <button onClick={handleClearFilters} className="text-[#007185] hover:text-[#C7511F] hover:underline text-[12px] font-normal mb-2 flex items-center gap-1 transition-colors">
                    <X size={14} />
                    {t("clearAll")}
                  </button>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {query && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand/5 border border-brand/10 text-brand-dark rounded-md text-xs">
                        "{query}"
                        <button onClick={() => setQuery("")} className="hover:text-red-500">
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {selectedCategory !== "All" && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand/5 border border-brand/10 text-brand-dark rounded-md text-xs">
                        {selectedCategory}
                        <button onClick={() => setSelectedCategory("All")} className="hover:text-red-500">
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {minRating && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand/5 border border-brand/10 text-brand-dark rounded-md text-xs">
                        {minRating}+ ★
                        <button onClick={() => setMinRating(null)} className="hover:text-red-500">
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {onlyVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand/5 border border-brand/10 text-brand-dark rounded-md text-xs">
                        <Verified size={12} />
                        {t("verified")}
                        <button onClick={() => setOnlyVerified(false)} className="hover:text-red-500">
                          <X size={12} />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Category Filter */}
              <div className="mb-4">
                <h3 className="text-[14px] font-bold text-[#0F1111] mb-1.5 mt-4 tracking-tight select-none">
                  {t("category")}
                </h3>
                <div className="ps-1">
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => setSelectedCategory("All")}
                        className="flex items-center justify-between w-full group cursor-pointer py-0.5"
                      >
                        <span className={`text-[13px] font-normal transition-colors text-start truncate pe-2 ${selectedCategory === "All" ? 'text-[#9b2c41] font-bold' : 'text-[#0F1111] group-hover:text-[#9b2c41]'
                          }`}>
                          {t("allCategories")}
                        </span>
                      </button>
                    </li>
                    {categories.map((category) => (
                      category !== "All" && (
                        <li key={category}>
                          <button
                            onClick={() => setSelectedCategory(category)}
                            className="flex items-center justify-between w-full group cursor-pointer py-0.5"
                          >
                            <span className={`text-[13px] font-normal transition-colors text-start truncate pe-2 ${selectedCategory === category ? 'text-[#9b2c41] font-bold' : 'text-[#0F1111] group-hover:text-[#9b2c41]'
                              }`}>
                              {category}
                            </span>
                          </button>
                        </li>
                      )
                    ))}
                  </ul>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-4">
                <h3 className="text-[14px] font-bold text-[#0F1111] mb-1.5 mt-4 tracking-tight select-none">
                  {t("storeRating")}
                </h3>
                <div className="space-y-0.5">
                  {[4, 3, 2, 1].map(stars => (
                    <button
                      key={stars}
                      onClick={() => setMinRating(minRating === stars ? null : stars)}
                      className="flex items-center gap-1 py-0.5 w-full group transition-all text-end select-none cursor-pointer"
                    >
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            size={16}
                            className={i <= stars ? "fill-[#FF9900] text-[#FF9900]" : "fill-transparent text-[#CCCCCC]"}
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                      <span className={`text-[13px] ms-1 transition-colors ${minRating === stars ? "text-[#9b2c41] font-bold" : "text-[#0F1111] group-hover:text-[#9b2c41]"}`}>
                        {t("andAbove")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified Filter */}
              <div className="mb-4">
                <h3 className="text-[14px] font-bold text-[#0F1111] mb-1.5 mt-4 tracking-tight select-none">
                  {t("merchantStatus")}
                </h3>
                <div
                  className="flex items-center gap-2 group cursor-pointer py-0.5 select-none"
                  onClick={() => setOnlyVerified(!onlyVerified)}
                >
                  <div className={`w-[14px] h-[14px] border rounded-[3px] flex items-center justify-center transition-all shrink-0 ${onlyVerified
                    ? 'bg-[#be374f] border-[#be374f] shadow-[0_1px_2px_rgba(0,0,0,0.15)]'
                    : 'bg-white border-[#8D9096] group-hover:border-[#be374f] group-hover:shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                    }`}>
                    {onlyVerified && (
                      <Check size={10} className="text-white" strokeWidth={4.5} />
                    )}
                  </div>
                  <span className={`text-[13px] transition-colors flex flex-1 items-center gap-1.5 truncate ${onlyVerified ? 'font-bold text-[#0F1111]' : 'text-[#0F1111] group-hover:text-[#be374f]'
                    }`}>
                    {t("verifiedOnly")}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Results Heading block */}
            <div className="mb-4 select-none">
              <h2 className="text-[20px] font-bold text-[#0F1111] leading-none">{t("results")}</h2>
            </div>

            {/* Vendor Grid/List */}
            {loading ? (
              <div className="mahally-grid">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                    <div className="h-48 bg-gray-100 rounded-xl mb-4" />
                    <div className="h-5 bg-gray-100 rounded w-2/3 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-full mb-1" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : filteredAndSortedVendors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <Store size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t("noStoresTitle")}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {t("noStoresDesc")}
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
                >
                  {t("clearFilters")}
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === "grid"
                  ? "mahally-grid"
                  : "space-y-4"
                }>
                  {paginatedVendors.map((vendor) => (
                    viewMode === "grid" ? (
                      <VendorCard
                        key={vendor.id}
                        vendor={vendor}
                        isFollowing={followedStores.some(id => id === vendor.id)}
                        isLoading={loadingStores[vendor.id] || false}
                        onToggleFollow={() => handleToggleFollow(vendor.id)}
                        isCurrentUser={Number(vendor.id) === Number(wooId)}
                        renderStars={renderStars}
                        t={t}
                        onQuickView={() => setQuickViewVendor(vendor)}
                      />
                    ) : (
                      <VendorListItem
                        key={vendor.id}
                        vendor={vendor}
                        isFollowing={followedStores.some(id => id === vendor.id)}
                        isLoading={loadingStores[vendor.id] || false}
                        onToggleFollow={() => handleToggleFollow(vendor.id)}
                        isCurrentUser={Number(vendor.id) === Number(wooId)}
                        renderStars={renderStars}
                        t={t}
                        onQuickView={() => setQuickViewVendor(vendor)}
                      />
                    )
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      <ChevronRight className="rotate-180" size={16} />
                      {t("previous")}
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((pageNumber) => (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`h-10 w-10 rounded-xl text-sm font-medium transition-all ${currentPage === pageNumber
                            ? "bg-brand text-white shadow-lg shadow-brand/25"
                            : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          {pageNumber}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      {t("next")}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Filters Drawer */}
        {showMobileFilters && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-[110] lg:hidden animate-in fade-in duration-300"
              onClick={() => setShowMobileFilters(false)}
            />
            <div className={`fixed end-0 top-0 bottom-0 w-[85vw] sm:w-[350px] bg-white z-[120] shadow-2xl lg:hidden animate-in duration-300 flex flex-col ${isAr ? 'slide-in-from-left' : 'slide-in-from-right'}`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <h3 className="font-bold text-lg">{t("filters")}</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar space-y-6">
                {/* Category */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("category")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full text-sm transition-all ${selectedCategory === category
                          ? "bg-brand text-white shadow-lg shadow-brand/25"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        {category === "All" ? t("allCategories") : category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("storeRating")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {[4, 3, 2, 1].map(stars => (
                      <button
                        key={stars}
                        onClick={() => setMinRating(minRating === stars ? null : stars)}
                        className={`px-4 py-2 rounded-full text-sm transition-all flex items-center gap-1 ${minRating === stars
                          ? "bg-amber-400 text-white shadow-lg shadow-amber-400/25"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star
                              key={i}
                              size={14}
                              className={i <= stars ? "fill-current text-current" : "fill-transparent text-gray-300"}
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                        <span>+</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verified */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("merchantStatus")}</h3>
                  <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={onlyVerified}
                        onChange={() => setOnlyVerified(!onlyVerified)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${onlyVerified ? "bg-brand border-brand" : "border-gray-300"
                        }`}>
                        {onlyVerified && <CheckCircle size={12} className="text-white" />}
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <Verified size={14} className="text-brand" />
                      {t("verifiedOnly")}
                    </span>
                  </label>
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-3 bg-brand text-white rounded-xl font-medium hover:bg-brand-dark transition-colors shadow-lg shadow-brand/25"
                >
                  {t("applyFilters")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <VendorQuickLookModal
        vendor={quickViewVendor}
        isOpen={!!quickViewVendor}
        onClose={() => setQuickViewVendor(null)}
      />
    </div>
  );
}

// Grid Vendor Card Component
function VendorCard({
  vendor,
  isFollowing,
  isLoading,
  onToggleFollow,
  isCurrentUser,
  renderStars,
  t,
  onQuickView
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Banner */}
      <Link href={`/vendor/${vendor.storeSlug || vendor.id}`} className="relative block h-44 overflow-hidden">
        {vendor.storeBanner ? (
          <Image
            src={vendor.storeBanner}
            alt={vendor.storeName}
            fill
            className={`object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-50 via-red-50 to-red-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Verified Badge */}
        {vendor.isVerified && (
          <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 shadow-lg">
            <Verified size={12} />
            {t("verified")}
          </div>
        )}

        {/* Followers Count */}
        {vendor.followers && vendor.followers > 0 && (
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5">
            <Heart size={12} className="fill-rose-400 text-rose-400" />
            {vendor.followers.toLocaleString()}
          </div>
        )}

        {/* Logo Overlay */}
        <div className="absolute -bottom-6 right-4 w-14 h-14 rounded-xl bg-white border-2 border-white shadow-lg overflow-hidden flex items-center justify-center">
          {vendor.storeLogo ? (
            <Image src={vendor.storeLogo} alt={vendor.storeName} fill className="object-contain p-1.5" />
          ) : (
            <span className="text-gray-900 font-bold text-xl">
              {vendor.storeName[0]?.toUpperCase()}
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="pt-8 pb-4 px-5">
        <Link href={`/vendor/${vendor.storeSlug || vendor.id}`} className="block">
          <h3 className="text-base font-semibold text-gray-900 hover:text-brand transition-colors line-clamp-1">
            {vendor.storeName}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mt-1">
          {renderStars(vendor.rating || 0)}
          {vendor.rating > 0 && (
            <span className="text-xs text-gray-500">
              {vendor.rating.toFixed(1)}
            </span>
          )}
          {vendor.products !== undefined && (
            <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
              <ShoppingBag size={12} />
              {vendor.products}
            </span>
          )}
        </div>

        {vendor.storeCategory && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xs px-2 py-0.5 bg-red-50 text-brand-dark rounded-full font-medium">
              {vendor.storeCategory}
            </span>
          </div>
        )}

        {vendor.storeDescription ? (
          <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-relaxed">
            {vendor.storeDescription}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic line-clamp-2 mt-2 leading-relaxed">
            {t("noDescription")}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Link
              href={`/vendor/${vendor.storeSlug || vendor.id}`}
              className="text-sm font-small text-brand hover:text-brand-dark hover:underline flex items-center gap-1 transition-colors"
            >
              {t("visitStore")}
              <ChevronRight size={14} className="rtl:-scale-x-100" />
            </Link>

            <button
              onClick={onQuickView}
              className="text-sm font-medium text-gray-500 hover:text-brand flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-gray-50"
              aria-label={t("quickView")}
            >
              <Eye size={14} />
              <span className="hidden sm:inline">{t("quickView")}</span>
            </button>
          </div>

          {!isCurrentUser && (
            <button
              onClick={onToggleFollow}
              disabled={isLoading}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${isFollowing
                ? "bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                : "bg-brand text-white hover:bg-brand-dark shadow-sm hover:shadow-md"
                } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isFollowing ? (
                <>
                  <Heart size={14} className="fill-rose-500 text-rose-500" />
                  <span className="hidden sm:inline">{t("following")}</span>
                </>
              ) : (
                <>
                  <Heart size={14} />
                  <span className="hidden sm:inline">{t("follow")}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// List Vendor Card Component
function VendorListItem({
  vendor,
  isFollowing,
  isLoading,
  onToggleFollow,
  isCurrentUser,
  renderStars,
  t,
  onQuickView
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Logo/Banner */}
        <Link
          href={`/vendor/${vendor.storeSlug || vendor.id}`}
          className="relative sm:w-48 h-32 sm:h-auto rounded-xl overflow-hidden shrink-0 bg-gray-100"
        >
          {vendor.storeBanner ? (
            <Image
              src={vendor.storeBanner}
              alt={vendor.storeName}
              fill
              className={`object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-50 flex items-center justify-center">
              <Store size={40} className="text-brand-light" />
            </div>
          )}
          {vendor.isVerified && (
            <div className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1">
              <Verified size={10} />
              {t("verified")}
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link href={`/vendor/${vendor.storeSlug || vendor.id}`} className="block">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-brand transition-colors truncate">
                  {vendor.storeName}
                </h3>
              </Link>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {renderStars(vendor.rating || 0)}
                {vendor.rating > 0 && (
                  <span className="text-sm text-gray-600">
                    {vendor.rating.toFixed(1)}
                  </span>
                )}
                {vendor.storeCategory && (
                  <span className="text-xs px-2 py-0.5 bg-red-50 text-brand-dark rounded-full">
                    {vendor.storeCategory}
                  </span>
                )}
                {vendor.location && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={12} />
                    {vendor.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 sm:mt-0">
              {vendor.followers && vendor.followers > 0 && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Heart size={14} className="fill-rose-400 text-rose-400" />
                  {vendor.followers.toLocaleString()}
                </span>
              )}
              {vendor.products !== undefined && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <ShoppingBag size={14} />
                  {vendor.products}
                </span>
              )}
            </div>
          </div>

          {vendor.storeDescription ? (
            <p className="text-sm text-gray-600 line-clamp-2 mt-2">
              {vendor.storeDescription}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic line-clamp-2 mt-2">
              {t("noDescription")}
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Award size={14} className="text-amber-500" />
                {t("since")} {vendor.dateCreated ? new Date(vendor.dateCreated).getFullYear() : "2024"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/vendor/${vendor.storeSlug || vendor.id}`}
                className="text-sm font-medium text-brand hover:text-brand-dark hover:underline flex items-center gap-1 transition-colors"
              >
                {t("visitStore")}
                <ExternalLink size={14} />
              </Link>

              <button
                onClick={onQuickView}
                className="text-sm font-medium text-gray-500 hover:text-brand flex items-center gap-1 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50"
                aria-label={t("quickView")}
              >
                <Eye size={14} />
                <span className="hidden sm:inline">{t("quickView")}</span>
              </button>

              {!isCurrentUser && (
                <button
                  onClick={onToggleFollow}
                  disabled={isLoading}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${isFollowing
                    ? "bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600"
                    : "bg-brand text-white hover:bg-brand-dark shadow-sm"
                    } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <Heart size={14} className="fill-rose-500 text-rose-500" />
                      {t("following")}
                    </>
                  ) : (
                    <>
                      <Heart size={14} />
                      {t("follow")}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}