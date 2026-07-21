"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import ProductCard from "@/components/ProductCard";
import { useLocale } from "next-intl";
import { getCategoryName, getCategorySlug } from "@/lib/product-utils";
import {
  ChevronRight,
  ChevronDown,
  Home,
  Grid3x3,
  LayoutGrid,
  SlidersHorizontal,
  Tag,
  Package,
  ArrowUpDown,
} from "lucide-react";

const decode = (text) => {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'");
};

export default function CategoryPageClient({
  category,
  products,
  totalPages,
  siblingCategories,
  slug,
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [sortBy, setSortBy] = useState("recommended");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filterOnSale, setFilterOnSale] = useState(false);
  const [filterInStock, setFilterInStock] = useState(false);

  const sortOptions = [
    { value: "recommended", label: isAr ? "الموصى به" : "Recommended" },
    { value: "price-low", label: isAr ? "السعر: من الأقل للأعلى" : "Price: Low → High" },
    { value: "price-high", label: isAr ? "السعر: من الأعلى للأقل" : "Price: High → Low" },
    { value: "newest", label: isAr ? "الأحدث أولاً" : "Newest First" },
    { value: "rating", label: isAr ? "الأعلى تقييماً" : "Top Rated" },
    { value: "popular", label: isAr ? "الأكثر شعبية" : "Most Popular" },
  ];

  const sortedProducts = useMemo(() => {
    let result = [...products];

    if (filterOnSale) result = result.filter((p) => p.on_sale);
    if (filterInStock) result = result.filter((p) => p.stock_status !== "outofstock");

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
        break;
      case "price-high":
        result.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
        break;
      case "newest":
        result.sort((a, b) => b.id - a.id);
        break;
      case "rating":
        result.sort(
          (a, b) =>
            parseFloat(b.average_rating || 0) - parseFloat(a.average_rating || 0)
        );
        break;
      case "popular":
        result.sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0));
        break;
      default:
        break;
    }
    return result;
  }, [products, sortBy, filterOnSale, filterInStock]);

  const categoryName = decode(getCategoryName(category, locale) || slug);
  const categoryDescription = category?.description
    ? decode(category.description.replace(/<[^>]+>/g, ""))
    : null;
  const categoryImage = category?.image?.src || null;
  const productCount = category?.count || products.length;

  // 404-ish fallback
  if (!category) {
    const decodedSlug = decodeURIComponent(slug);
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4" dir={isAr ? "rtl" : "ltr"}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <Package size={24} className="text-zinc-400" />
          </div>
          <h1 className="text-[18px] font-bold text-zinc-900 mb-1">
            {isAr ? "القسم غير موجود" : "Category not found"}
          </h1>
          <p className="text-[12px] text-zinc-500 mb-5 max-w-xs">
            {isAr 
              ? `القسم "${decodedSlug}" غير موجود أو ربما تم حذفه.` 
              : `The category "${decodedSlug}" doesn't exist or has been removed.`}
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 h-8 px-5 bg-zinc-900 text-white text-[11px] font-bold rounded-full hover:bg-zinc-800 transition-colors"
          >
            {isAr ? "تصفح جميع المنتجات" : "Browse All Products"}
            <ChevronRight size={12} className={isAr ? "rotate-180" : ""} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ─── Hero Banner ─── */}
      <div className="relative w-full min-h-[220px] sm:h-[260px] overflow-hidden bg-zinc-900 flex flex-col justify-end">
        {categoryImage ? (
          <>
            <Image
              src={categoryImage}
              alt={categoryName}
              fill
              className="object-cover opacity-50 scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-zinc-900/20" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
        )}

        {/* Content over banner */}
        <div className="relative z-10 w-full pb-6 pt-12 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-white/70 mb-3 font-semibold">
            <Link
              href="/"
              className="hover:text-white transition-colors flex items-center gap-1 shrink-0"
            >
              <Home size={14} />
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight size={12} className="text-white/40 rtl:rotate-180 shrink-0" />
            <Link href="/browse" className="hover:text-white transition-colors shrink-0">
              {isAr ? "التصفح" : "Browse"}
            </Link>
            <ChevronRight size={12} className="text-white/40 rtl:rotate-180 shrink-0" />
            <span className="text-white font-bold truncate max-w-[180px] sm:max-w-none">{categoryName}</span>
          </nav>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-2">
            {categoryName}
          </h1>
          {categoryDescription && (
            <p className="text-xs sm:text-sm md:text-base text-white/80 max-w-xl leading-relaxed line-clamp-2">
              {categoryDescription}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 h-7 px-3 sm:px-3.5 bg-white/15 backdrop-blur-md text-white text-xs sm:text-sm font-extrabold rounded-full border border-white/20 tracking-wide">
              <Package size={14} />
              {productCount} {isAr ? "منتج" : (productCount === 1 ? "product" : "products")}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Sibling Categories ─── */}
      {siblingCategories.length > 0 && (
        <div className="bg-white border-b border-zinc-100 shadow-xs">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-wider shrink-0 me-1">
                {isAr ? "أقسام ذات صلة:" : "Related:"}
              </span>
              {siblingCategories.slice(0, 10).map((cat) => {
                const catLocalizedName = getCategoryName(cat, locale);
                const catLocalizedSlug = getCategorySlug(cat, locale);
                return (
                  <Link
                    key={cat.id}
                    href={`/category/${catLocalizedSlug}`}
                    className="shrink-0 flex items-center gap-1.5 h-8 px-3.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-800 rounded-full transition-all hover:border-brand/40 hover:shadow-xs whitespace-nowrap"
                  >
                    {cat.image?.src && (
                      <div className="w-4 h-4 rounded-full overflow-hidden relative shrink-0">
                        <Image
                          src={cat.image.src}
                          alt={decode(catLocalizedName)}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span dangerouslySetInnerHTML={{ __html: decode(catLocalizedName) }} />
                    {typeof cat.count !== "undefined" && (
                      <span className="text-zinc-400 text-xs font-medium">({cat.count})</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Toolbar ─── */}
      <div className="bg-white border-b border-zinc-100 sticky top-[60px] sm:top-[64px] z-30 shadow-xs">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:h-14">
            
            {/* Scrollable Filter Pill Strip */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs sm:text-sm text-zinc-600 font-medium whitespace-nowrap shrink-0">
                <span className="font-extrabold text-zinc-900">{sortedProducts.length}</span>{" "}
                {isAr ? "منتج" : "results"}
              </span>

              <div className="h-4 w-px bg-zinc-200 shrink-0 mx-0.5" />

              <button
                onClick={() => setFilterOnSale(!filterOnSale)}
                className={`h-8 px-3 sm:px-3.5 rounded-full text-xs sm:text-sm font-bold border transition-all shrink-0 flex items-center gap-1.5 whitespace-nowrap ${
                  filterOnSale
                    ? "bg-brand text-white border-brand shadow-xs"
                    : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <Tag size={13} />
                {isAr ? "تخفيضات" : "On Sale"}
              </button>

              <button
                onClick={() => setFilterInStock(!filterInStock)}
                className={`h-8 px-3 sm:px-3.5 rounded-full text-xs sm:text-sm font-bold border transition-all shrink-0 flex items-center gap-1.5 whitespace-nowrap ${
                  filterInStock
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
                }`}
              >
                {isAr ? "متوفر بالمخزون" : "In Stock"}
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1.5 h-8 px-3.5 sm:px-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-xs sm:text-sm font-bold text-zinc-800 transition-colors whitespace-nowrap"
              >
                <ArrowUpDown size={13} />
                {sortOptions.find((o) => o.value === sortBy)?.label}
                <ChevronDown size={13} className="text-zinc-400" />
              </button>

              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute end-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-zinc-200 shadow-xl z-50 py-1.5 overflow-hidden">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortBy(opt.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-start px-4 py-2 text-xs sm:text-sm font-bold transition-colors ${
                          sortBy === opt.value
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Product Grid ─── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sortedProducts.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <Package size={24} className="text-zinc-400" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-zinc-900 mb-1.5">
              {isAr ? "لا توجد منتجات" : "No products found"}
            </h3>
            <p className="text-xs md:text-sm text-zinc-500 mb-5 max-w-sm mx-auto font-medium">
              {filterOnSale || filterInStock
                ? (isAr ? "جرب إزالة بعض الفلاتر لعرض المزيد من المنتجات." : "Try removing some filters to see more products.")
                : (isAr ? `لا توجد منتجات في قسم "${categoryName}" حتى الآن.` : `There are no products in "${categoryName}" yet.`)}
            </p>
            {(filterOnSale || filterInStock) && (
              <button
                onClick={() => {
                  setFilterOnSale(false);
                  setFilterInStock(false);
                }}
                className="h-9 px-6 bg-zinc-900 text-white text-xs md:text-sm font-bold rounded-full hover:bg-zinc-800 transition-colors shadow-sm"
              >
                {isAr ? "إعادة ضبط الفلاتر" : "Clear Filters"}
              </button>
            )}
          </div>
        ) : (
          <div className="mahally-grid">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
