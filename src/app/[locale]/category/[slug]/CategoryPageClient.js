"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import ProductCard from "@/components/ProductCard";
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
  const [sortBy, setSortBy] = useState("recommended");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filterOnSale, setFilterOnSale] = useState(false);
  const [filterInStock, setFilterInStock] = useState(false);

  const sortOptions = [
    { value: "recommended", label: "Recommended" },
    { value: "price-low", label: "Price: Low → High" },
    { value: "price-high", label: "Price: High → Low" },
    { value: "newest", label: "Newest First" },
    { value: "rating", label: "Top Rated" },
    { value: "popular", label: "Most Popular" },
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

  const categoryName = decode(category?.name || slug);
  const categoryDescription = category?.description
    ? decode(category.description.replace(/<[^>]+>/g, ""))
    : null;
  const categoryImage = category?.image?.src || null;
  const productCount = category?.count || products.length;

  // 404-ish fallback
  if (!category) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <Package size={24} className="text-zinc-400" />
          </div>
          <h1 className="text-[18px] font-bold text-zinc-900 mb-1">
            Category not found
          </h1>
          <p className="text-[12px] text-zinc-500 mb-5 max-w-xs">
            The category "{slug}" doesn't exist or has been removed.
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 h-8 px-5 bg-zinc-900 text-white text-[11px] font-bold rounded-full hover:bg-zinc-800 transition-colors"
          >
            Browse All Products
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ─── Hero Banner ─── */}
      <div className="relative w-full h-[200px] sm:h-[240px] overflow-hidden bg-zinc-900">
        {categoryImage ? (
          <>
            <Image
              src={categoryImage}
              alt={categoryName}
              fill
              className="object-cover opacity-50 scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/40 to-zinc-900/20" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
        )}

        {/* Content over banner */}
        <div className="relative z-10 h-full flex flex-col justify-end pb-6 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-[10px] text-white/50 mb-3 font-medium">
            <Link
              href="/"
              className="hover:text-white/80 transition-colors flex items-center gap-0.5"
            >
              <Home size={10} />
              Home
            </Link>
            <ChevronRight size={9} className="text-white/30" />
            <Link href="/browse" className="hover:text-white/80 transition-colors">
              Browse
            </Link>
            <ChevronRight size={9} className="text-white/30" />
            <span className="text-white/90">{categoryName}</span>
          </nav>

          <h1 className="text-[28px] sm:text-[34px] font-extrabold text-white tracking-tight leading-none mb-1">
            {categoryName}
          </h1>
          {categoryDescription && (
            <p className="text-[11px] text-white/60 max-w-lg leading-relaxed line-clamp-2">
              {categoryDescription}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 h-5 px-2 bg-white/10 backdrop-blur-sm text-white/80 text-[9px] font-bold rounded-full border border-white/10 uppercase tracking-wider">
              <Package size={9} />
              {productCount} {productCount === 1 ? "product" : "products"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Sibling Categories ─── */}
      {siblingCategories.length > 0 && (
        <div className="bg-white border-b border-zinc-100">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0 ms-1">
                Related:
              </span>
              {siblingCategories.slice(0, 10).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="shrink-0 flex items-center gap-1.5 h-7 px-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-[10px] font-semibold text-zinc-700 rounded-full transition-all hover:border-zinc-300"
                >
                  {cat.image?.src && (
                    <div className="w-4 h-4 rounded-full overflow-hidden relative shrink-0">
                      <Image
                        src={cat.image.src}
                        alt={decode(cat.name)}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span dangerouslySetInnerHTML={{ __html: cat.name }} />
                  {typeof cat.count !== "undefined" && (
                    <span className="text-zinc-400 text-[9px]">({cat.count})</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Toolbar ─── */}
      <div className="bg-white border-b border-zinc-100 sticky top-[64px] z-30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10">
            {/* Left: Count & Filters */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 font-medium">
                <span className="font-bold text-zinc-900">{sortedProducts.length}</span>{" "}
                results
              </span>

              <div className="h-3.5 w-px bg-zinc-200 mx-1" />

              <button
                onClick={() => setFilterOnSale(!filterOnSale)}
                className={`h-6 px-2.5 rounded-full text-[10px] font-bold border transition-all ${
                  filterOnSale
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <Tag size={9} className="inline ms-1 -mt-px" />
                On Sale
              </button>

              <button
                onClick={() => setFilterInStock(!filterInStock)}
                className={`h-6 px-2.5 rounded-full text-[10px] font-bold border transition-all ${
                  filterInStock
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                }`}
              >
                In Stock
              </button>
            </div>

            {/* Right: Sort */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1 h-7 px-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg text-[10px] font-semibold text-zinc-700 transition-colors"
              >
                <ArrowUpDown size={10} />
                {sortOptions.find((o) => o.value === sortBy)?.label}
                <ChevronDown size={10} className="text-zinc-400" />
              </button>

              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute start-0 top-full mt-1 w-44 bg-white rounded-lg border border-zinc-200 shadow-xl z-50 py-1 overflow-hidden">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortBy(opt.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-end px-3 py-1.5 text-[11px] font-medium transition-colors ${
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
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {sortedProducts.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
              <Package size={20} className="text-zinc-400" />
            </div>
            <h3 className="text-[14px] font-bold text-zinc-900 mb-1">
              No products found
            </h3>
            <p className="text-[11px] text-zinc-500 mb-4 max-w-xs mx-auto">
              {filterOnSale || filterInStock
                ? "Try removing some filters to see more products."
                : `There are no products in "${categoryName}" yet.`}
            </p>
            {(filterOnSale || filterInStock) && (
              <button
                onClick={() => {
                  setFilterOnSale(false);
                  setFilterInStock(false);
                }}
                className="h-7 px-4 bg-zinc-900 text-white text-[10px] font-bold rounded-full hover:bg-zinc-800 transition-colors"
              >
                Clear Filters
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
