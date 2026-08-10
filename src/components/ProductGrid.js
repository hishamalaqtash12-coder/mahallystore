"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import ProductCard from "./ProductCard";
import SidebarFilter from "./SidebarFilter";
import Loader from "./Loader";
import { ChevronDown, Loader2, SlidersHorizontal, X, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { isMadeInJordanProduct } from "@/lib/made-in-jordan";

export default function ProductGrid({ initialProducts, totalPages: initialTotalPages = 1 }) {
  const t = useTranslations("ProductGrid");
  const locale = useLocale();
  const isAr = locale === "ar";
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isBrowse = pathname === "/browse";
  const isFeaturedPage = pathname === "/featured-products";
  const cat = searchParams.get("cat");
  const q = searchParams.get("q");
  const onDiscount = searchParams.get("onDiscount") === "true";
  const madeInJordanOnly = searchParams.get("madeInJordan") === "true";

  const [products, setProducts] = useState(initialProducts);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("Recommended");
  const [categories, setCategories] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const filterScrollRef = useRef(null);
  const scrollFilters = (direction) => {
    if (filterScrollRef.current) {
      filterScrollRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  // ── Unified filter state (owned here, passed down to SidebarFilter) ──
  const [filters, setFilters] = useState({
    category: cat ? Number(cat) || cat : null,
    minRating: null,
    priceRange: null,   // null = "use full range"
    onSale: onDiscount,
    freeShipping: false,
    inStockOnly: false,
    minDiscount: null,
    tags: [],
    merchant: null,
    madeInJordan: madeInJordanOnly,
    searchQuery: q || "",
  });

  const router = useRouter();

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams(searchParams.toString());

    if (newFilters.category && newFilters.category !== "All") {
      const matchedCat = categories.find(c =>
        c.id === newFilters.category ||
        decodeURIComponent(c.slug) === decodeURIComponent(newFilters.category)
      );
      if (matchedCat) params.set("cat", decodeURIComponent(matchedCat.slug));
      else params.set("cat", newFilters.category);
    } else {
      params.delete("cat");
    }

    if (newFilters.searchQuery) params.set("q", newFilters.searchQuery);
    else params.delete("q");

    if (newFilters.onSale) params.set("onDiscount", "true");
    else params.delete("onDiscount");

    if (newFilters.madeInJordan) params.set("madeInJordan", "true");
    else params.delete("madeInJordan");

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // ── Fetch categories (Bulletproof) ──
  useEffect(() => {
    fetch('/api/categories')
      .then(res => {
        if (!res.ok) throw new Error("Categories fetch failed");
        return res.json();
      })
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(err => {
        console.warn("SidebarFilter categories fetch error:", err.message);
        setCategories([]);
      });
  }, []);

  // ── Sync URL Params to Local State ──
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: cat ? Number(cat) || cat : null,
      searchQuery: q || "",
      onSale: onDiscount,
      madeInJordan: madeInJordanOnly
    }));
  }, [cat, q, onDiscount, madeInJordanOnly]);

  // ── Re-fetch products when URL params change ──
  useEffect(() => {
    let isCurrent = true;
    const frame = window.requestAnimationFrame(() => {
      setLoading(true);
      setCurrentPage(1);
    });

    const params = new URLSearchParams({ per_page: 20 });
    if (cat) params.set("cat", cat);
    if (q) params.set("q", q);
    if (onDiscount) params.set("onDiscount", "true");
    if (madeInJordanOnly) params.set("madeInJordan", "true");
    if (isFeaturedPage) params.set("featured", "true");

    fetch(`/api/products?${params.toString()}`)
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          console.error(`API Error (${res.status}):`, text.slice(0, 100));
          return { products: [], totalPages: 1 };
        }
        return res.json();
      })
      .then(data => {
        if (!isCurrent) return;
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(err => {
        console.error("ProductGrid fetch error:", err);
        if (isCurrent) setProducts([]);
      })
      .finally(() => { if (isCurrent) setLoading(false); });

    return () => {
      isCurrent = false;
      window.cancelAnimationFrame(frame);
    };
  }, [cat, q, onDiscount, isFeaturedPage]);

  // ── Load next page ──
  const loadNextPage = async () => {
    const nextPage = currentPage + 1;
    if (nextPage > totalPages) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: nextPage, per_page: 20 });
      if (cat) params.set("cat", cat);
      if (q) params.set("q", q);
      if (onDiscount) params.set("onDiscount", "true");
      if (madeInJordanOnly) params.set("madeInJordan", "true");
      if (isFeaturedPage) params.set("featured", "true");
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        setProducts(prev => [...prev, ...data.products]);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(nextPage);
      }
    } catch (e) {
      console.error("Failed to load page", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Compute price bounds from current product list ──
  const priceBounds = useMemo(() => {
    const prices = products.map(p => parseFloat(p.price || 0)).filter(p => p > 0);
    if (!prices.length) return { min: 0, max: 500 };
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  // ── Apply all sidebar filters locally ──
  const sortedProducts = useMemo(() => {
    let result = products.filter(p => {
      // Search
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const nameMatch = (p.name || "").toLowerCase().includes(q);
        const tagMatch = p.tags?.some(t => t.name.toLowerCase().includes(q));
        const catMatch = p.categories?.some(c => c.name.toLowerCase().includes(q));
        if (!nameMatch && !tagMatch && !catMatch) return false;
      }
      // Category
      if (filters.category !== null) {
        const matched = p.categories?.some(
          c => c.id === filters.category ||
            c.id.toString() === filters.category?.toString() ||
            decodeURIComponent(c.slug) === decodeURIComponent(filters.category)
        );
        if (!matched) return false;
      }
      // Star rating
      if (filters.minRating !== null) {
        const rating = Math.round(parseFloat(p.average_rating || 0));
        if (rating < filters.minRating) return false;
      }
      // Price range
      if (filters.priceRange) {
        const price = parseFloat(p.price || 0);
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;
      }
      // On sale
      if (filters.onSale && !p.on_sale) return false;
      // Min Discount percentage
      if (filters.minDiscount !== null && filters.minDiscount !== undefined) {
        const price = parseFloat(p.price || 0);
        const regularPrice = parseFloat(p.regular_price || 0);
        const discountPercent = regularPrice > price ? Math.round(((regularPrice - price) / regularPrice) * 100) : 0;
        if (discountPercent < filters.minDiscount) return false;
      }
      // Free Shipping
      if (filters.freeShipping && !p.is_free_shipping) return false;
      // In Stock Only
      if (filters.inStockOnly && p.stock_status === "outofstock") return false;
      // Tags
      if (filters.tags && filters.tags.length > 0) {
        const pTags = (p.tags || []).map(t => t.name);
        if (!filters.tags.every(t => pTags.includes(t))) return false;
      }
      // Made in Jordan
      if (filters.madeInJordan && !isMadeInJordanProduct(p)) return false;
      // Merchant
      if (filters.merchant) {
        const merchantMeta = p.meta_data?.find(m => m.key === "merchant_name")?.value ||
          p.meta_data?.find(m => m.key === "mahally_owner_name")?.value ||
          p.store?.shop_name ||
          p.store?.name;
        const pMerchant = merchantMeta || "Mahally Jo";
        if (pMerchant !== filters.merchant) return false;
      }
      return true;
    });

    switch (sortBy) {
      case "Price: Low to High": result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); break;
      case "Price: High to Low": result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); break;
      case "Newest Arrivals": result.sort((a, b) => b.id - a.id); break;
      case "Top Rated": result.sort((a, b) => parseFloat(b.average_rating || 0) - parseFloat(a.average_rating || 0)); break;
      default: break;
    }
    return result;
  }, [products, sortBy, filters]);

  const displayProducts = isBrowse ? sortedProducts : (isFeaturedPage ? sortedProducts : sortedProducts.slice(0, 10));
  const featuredProductCount = sortedProducts.length;

  // Active filter count for mobile badge
  const activeFilterCount = [
    filters.category !== null,
    filters.minRating !== null,
    filters.onSale,
    filters.minDiscount !== null && filters.minDiscount !== undefined,
    filters.freeShipping,
    filters.inStockOnly,
    (filters.tags || []).length > 0,
    filters.priceRange !== null,
    filters.merchant !== null, filters.madeInJordan,].filter(Boolean).length;

  if (!isBrowse && !isFeaturedPage) {
    return (
      <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 my-8">
        {/* ── Section Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
              {t("title")}
            </h2>
            <div className="h-1.5 w-20 bg-brand rounded-full"></div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 font-medium">
              {t("subtitle")}
            </p>
          </div>

        </div>

        {/* ── Products ── */}
        {products.length === 0 ? (
          <div className="py-12 bg-blue-50/50 border-2 border-blue-200 rounded-xl flex flex-col items-center justify-center text-center px-4">
            <Compass size={36} className="text-blue-400 mb-2" />
            <h3 className="text-base font-bold text-zinc-900 mb-1">
              {t("noProducts")}
            </h3>
            <p className="text-xs text-zinc-500">
              {t("noProductsDesc")}
            </p>
          </div>
        ) : (
          <>
            <div className="mahally-grid">
              {products.slice(0, 10).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700 hover:text-blue-700 transition-colors bg-zinc-100/80 hover:bg-blue-50 px-6 py-3 rounded-full border-2 border-zinc-300 hover:border-blue-600/60 w-fit"
              >
                <span>{t("viewAll")}</span>
                {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </Link>
            </div>
          </>
        )}
      </section>
    );
  }

  return (
    <div className="flex flex-col mx-auto w-full">

      {/* ── Page Heading & Summary (Amazon Style Unified Top Bar) ── */}
      <div className="py-2.5 px-4 bg-[#F8F9FA] border-y border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 w-full select-none text-start">
        <div className="text-[13px] text-[#0F1111] font-normal">
          {isFeaturedPage ? (
            <span>{t("foundFeatured", { count: featuredProductCount, suffix: featuredProductCount === 1 ? t("featuredSuffixSingle") : t("featuredSuffixPlural") })}</span>
          ) : (
            <>
              <span>{t("showingResults", { end: sortedProducts.length, total: totalPages * 20 })}</span>
              <span className="font-bold text-brand me-1">
                &quot;{filters.searchQuery ? filters.searchQuery : (cat ? <span dangerouslySetInnerHTML={{ __html: categories.find(c => c.id === filters.category || decodeURIComponent(c.slug) === decodeURIComponent(filters.category))?.name || t("category") }} /> : t("allProducts"))}&quot;
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[13px] text-[#565959] font-normal">{t("sortBy")}</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-7 pe-2.5 ps-8 bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-md shadow-[0_2px_5px_0_rgba(213,219,219,0.3)] text-[13px] text-[#0f1111] appearance-none cursor-pointer outline-none font-normal hover:border-[#B5B9B9] transition-all"
            >
              <option value="Recommended">{t("sortRecommended")}</option>
              <option value="Price: Low to High">{t("sortPriceLowHigh")}</option>
              <option value="Price: High to Low">{t("sortPriceHighLow")}</option>
              <option value="Top Rated">{t("sortTopRated")}</option>
              <option value="Newest Arrivals">{t("sortNewest")}</option>
            </select>
            <ChevronDown size={12} className="absolute start-2 top-1/2 -translate-y-1/2 text-[#565959] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Top Category Quick Filters (One-Click) ── */}
      {/* {!cat && (
        <div className="mb-4 border-b border-zinc-200 pb-3 relative group/filter-carousel">

          <button
            onClick={(e) => { e.preventDefault(); scrollFilters('left'); }}
            className="absolute -end-4 top-[18px] -translate-y-1/2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center z-10 opacity-0 group-hover/filter-carousel:opacity-100 transition-opacity hover:scale-110 shadow-lg hidden md:flex"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); scrollFilters('right'); }}
            className="absolute -start-4 top-[18px] -translate-y-1/2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center z-10 opacity-0 group-hover/filter-carousel:opacity-100 transition-opacity hover:scale-110 shadow-lg hidden md:flex"
          >
            <ChevronRight size={16} />
          </button>

          <div ref={filterScrollRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 relative scroll-smooth px-1">
            <button
              onClick={() => setFilters(f => ({ ...f, category: null }))}
              className={`flex-shrink-0 h-8 px-4 rounded-full text-[12px] font-bold transition-all border ${!filters.category ? 'bg-[#0F1111] text-white border-[#0F1111]' : 'bg-white text-[#0F1111] border-zinc-300 hover:border-zinc-400'}`}
            >
              All Products
            </button>
            {categories.filter(c => c.parent === 0).map(category => (
              <button
                key={category.id}
                onClick={() => setFilters(f => ({ ...f, category: category.id }))}
                className={`flex-shrink-0 h-8 px-4 rounded-full text-[12px] font-bold transition-all border ${filters.category === category.id ? 'bg-[#0F1111] text-white border-[#0F1111]' : 'bg-white text-[#0F1111] border-zinc-300 hover:border-zinc-400'}`}
              >
                <span dangerouslySetInnerHTML={{ __html: category.name }} />
              </button>
            ))}
          </div>
        </div>
      )} */}

      {/* Main layout: Sidebar + Content */}
      <div className="flex gap-5 items-start w-full px-2 lg:px-4">

        {/* ── Desktop Sidebar (Scrollbar Visible) ── */}
        {!isFeaturedPage && (
          <div className="hidden lg:block sticky top-[76px] max-h-[calc(100vh-80px)] overflow-y-auto ps-2 shrink-0">
            <SidebarFilter
              categories={categories}
              products={products}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              priceBounds={priceBounds}
            />
          </div>
        )}

        {/* ── Mobile Sidebar Drawer ── */}
        {mobileSidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-[110] lg:hidden animate-in fade-in duration-300" onClick={() => setMobileSidebarOpen(false)} />
            <div className={`fixed end-0 top-0 bottom-0 w-[85vw] sm:w-[350px] bg-white z-[120] shadow-2xl lg:hidden animate-in duration-300 flex flex-col ${isAr ? 'slide-in-from-left' : 'slide-in-from-right'}`}>
              {/* Mobile Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <h3 className="font-bold text-lg">{t("filters")}</h3>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500 hover:text-black transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              {/* Filter Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
                <SidebarFilter
                categories={categories}
                products={products}
                filters={filters}
                onFiltersChange={(f) => { handleFiltersChange(f); }}
                priceBounds={priceBounds}
              />
              </div>
            </div>
          </>
        )}

        {/* ── Right: Main Grid ── */}
        <div className="flex-1 min-w-0">

          {/* Results Heading block */}
          <div className="mb-4 select-none">
            <h2 className="text-[20px] font-bold text-[#0F1111] leading-none">{isFeaturedPage ? t("featuredPicks") : t("results")}</h2>
            <p className="text-[13px] text-[#565959] mt-1 leading-snug">{isFeaturedPage ? t("featuredDesc") : t("resultsDesc")}</p>
          </div>

          {/* Mobile Filter Toggle */}
          {!isFeaturedPage && (
            <div className="lg:hidden flex items-center mb-4 px-1 select-none">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="flex items-center gap-1.5 h-8 px-4 border border-[#D5D9D9] rounded-lg text-[12px] font-medium text-[#0F1111] bg-white hover:bg-zinc-50 transition-colors shadow-sm"
              >
                <SlidersHorizontal size={12} />
                {t("filters")} {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>
          )}

          {/* Active filter chips (Amazon Style) */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4 select-none">
              {filters.category !== null && (() => {
                const catObj = categories.find(c => c.id === filters.category || decodeURIComponent(c.slug) === decodeURIComponent(filters.category));
                return catObj ? (
                  <span key="cat" className="inline-flex items-center gap-1 h-6 pe-2.5 ps-1 bg-[#F0F2F2] text-[#0F1111] text-[11px] font-normal rounded-md border border-[#D5D9D9] hover:bg-[#E3E6E6] transition-colors shadow-sm">
                    <span dangerouslySetInnerHTML={{ __html: catObj.name }} />
                    <X size={12} className="cursor-pointer me-1 text-zinc-500 hover:text-zinc-800 p-0.5 rounded-full hover:bg-zinc-250" onClick={() => setFilters(f => ({ ...f, category: null }))} />
                  </span>
                ) : null;
              })()}
              {filters.minRating !== null && (
                <span className="inline-flex items-center gap-1 h-6 pe-2.5 ps-1 bg-[#F0F2F2] text-[#0F1111] text-[11px] font-normal rounded-md border border-[#D5D9D9] hover:bg-[#E3E6E6] transition-colors shadow-sm">
                  {filters.minRating}★ {t("andUp")}
                  <X size={12} className="cursor-pointer me-1 text-zinc-500 hover:text-zinc-800 p-0.5 rounded-full hover:bg-zinc-250" onClick={() => setFilters(f => ({ ...f, minRating: null }))} />
                </span>
              )}
              {filters.onSale && (
                <span className="inline-flex items-center gap-1 h-6 pe-2.5 ps-1 bg-[#F0F2F2] text-[#0F1111] text-[11px] font-normal rounded-md border border-[#D5D9D9] hover:bg-[#E3E6E6] transition-colors shadow-sm">
                  {t("discounted")}
                  <X size={12} className="cursor-pointer me-1 text-zinc-500 hover:text-zinc-800 p-0.5 rounded-full hover:bg-zinc-250" onClick={() => setFilters(f => ({ ...f, onSale: false }))} />
                </span>
              )}
              {filters.minDiscount !== null && filters.minDiscount !== undefined && (
                <span className="inline-flex items-center gap-1 h-6 pe-2.5 ps-1 bg-[#F0F2F2] text-[#0F1111] text-[11px] font-normal rounded-md border border-[#D5D9D9] hover:bg-[#E3E6E6] transition-colors shadow-sm">
                  {filters.minDiscount}{t("discountOrMore")}
                  <X size={12} className="cursor-pointer me-1 text-zinc-500 hover:text-zinc-800 p-0.5 rounded-full hover:bg-zinc-250" onClick={() => setFilters(f => ({ ...f, minDiscount: null }))} />
                </span>
              )}
              {filters.freeShipping && (
                <span className="inline-flex items-center gap-1 h-6 pe-2.5 ps-1 bg-[#F0F2F2] text-[#0F1111] text-[11px] font-normal rounded-md border border-[#D5D9D9] hover:bg-[#E3E6E6] transition-colors shadow-sm">
                  {t("freeShipping")}
                  <X size={12} className="cursor-pointer me-1 text-zinc-500 hover:text-zinc-800 p-0.5 rounded-full hover:bg-zinc-250" onClick={() => setFilters(f => ({ ...f, freeShipping: false }))} />
                </span>
              )}
              {filters.inStockOnly && (
                <span className="inline-flex items-center gap-1 h-6 pe-2.5 ps-1 bg-[#F0F2F2] text-[#0F1111] text-[11px] font-normal rounded-md border border-[#D5D9D9] hover:bg-[#E3E6E6] transition-colors shadow-sm">
                  {t("inStockOnly")}
                  <X size={12} className="cursor-pointer me-1 text-zinc-500 hover:text-zinc-800 p-0.5 rounded-full hover:bg-zinc-250" onClick={() => setFilters(f => ({ ...f, inStockOnly: false }))} />
                </span>
              )}
              {filters.priceRange && (
                <span className="inline-flex items-center gap-1 h-6 pe-2.5 ps-1 bg-[#F0F2F2] text-[#0F1111] text-[11px] font-normal rounded-md border border-[#D5D9D9] hover:bg-[#E3E6E6] transition-colors shadow-sm">
                  {filters.priceRange[0]} - {filters.priceRange[1]} {t("currency")}
                  <X size={12} className="cursor-pointer me-1 text-zinc-500 hover:text-zinc-800 p-0.5 rounded-full hover:bg-zinc-250" onClick={() => setFilters(f => ({ ...f, priceRange: null }))} />
                </span>
              )}
              {(filters.tags || []).map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 h-6 pe-2.5 ps-1 bg-[#F0F2F2] text-[#0F1111] text-[11px] font-normal rounded-md border border-[#D5D9D9] hover:bg-[#E3E6E6] transition-colors shadow-sm">
                  {t("brand")} {tag}
                  <X size={12} className="cursor-pointer me-1 text-zinc-500 hover:text-zinc-800 p-0.5 rounded-full hover:bg-zinc-250" onClick={() => setFilters(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))} />
                </span>
              ))}
              {filters.merchant && (
                <span className="inline-flex items-center gap-1 h-6 pe-2.5 ps-1 bg-[#F0F2F2] text-[#0F1111] text-[11px] font-normal rounded-md border border-[#D5D9D9] hover:bg-[#E3E6E6] transition-colors shadow-sm">
                  {t("seller")} {filters.merchant === "Mahally Jo" ? t("officialMahally") : filters.merchant}
                  <X size={12} className="cursor-pointer me-1 text-zinc-500 hover:text-zinc-800 p-0.5 rounded-full hover:bg-zinc-250" onClick={() => setFilters(f => ({ ...f, merchant: null }))} />
                </span>
              )}
            </div>
          )}

          {/* Grid + Loading overlay */}
          <section className="relative min-h-[400px]">
            {loading && (
              <Loader overlay text={t("loadingProducts")} />
            )}

            {!loading && sortedProducts.length === 0 && (
              <div className="py-24 text-center select-none">
                <p className="text-zinc-950 text-[16px] font-bold mb-1">{t("noProducts")}</p>
                <p className="text-[#565959] text-[13px] mb-5">{t("noProductsDesc")}</p>
                <button
                  onClick={() => handleFiltersChange({ category: null, minRating: null, priceRange: null, onSale: false, freeShipping: false, inStockOnly: false, minDiscount: null, tags: [], merchant: null, madeInJordan: false, searchQuery: "" })}
                  className="h-8 px-6 bg-brand hover:bg-brand-dark border border-brand text-white rounded-lg text-[12px] font-medium shadow-sm transition-all active:scale-98"
                >
                  {t("clearAllFilters")}
                </button>
              </div>
            )}

            <div className="mahally-grid">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {isBrowse ? (
              currentPage < totalPages && !loading && (
                <div className="mt-12 flex justify-center select-none">
                  <button
                    onClick={loadNextPage}
                    className="h-10 px-8 bg-white hover:bg-zinc-50 border border-zinc-400 text-zinc-900 rounded-full text-[14px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{t("showMore")}</span>
                    <ChevronDown size={16} className="text-zinc-600" />
                  </button>
                </div>
              )
            ) : (!isFeaturedPage ? (
              <div className="mt-12 flex justify-center select-none">
                <Link
                  href="/browse"
                  className="h-10 px-8 bg-white hover:bg-zinc-50 border border-zinc-400 text-zinc-900 rounded-full text-[14px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{t("viewAllProducts")}</span>
                  <ChevronRight size={16} className="text-zinc-600 rtl:-scale-x-100" />
                </Link>
              </div>
            ) : null)}
          </section>
        </div>
      </div>
    </div>
  );
}