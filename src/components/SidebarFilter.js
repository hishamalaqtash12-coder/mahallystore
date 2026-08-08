"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { usePathname } from "@/i18n/routing";
import { Star, ChevronDown, ChevronUp, X, ChevronLeft, ShoppingCart, Check } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { getCategoryName } from "@/lib/product-utils";
import { isMadeInJordanProduct } from "@/lib/made-in-jordan";

// ─── Filter Section Header ──────────────────────────────────────
function SectionTitle({ title }) {
  return (
    <h3 className="text-[14px] font-bold text-[#0F1111] mb-1.5 mt-4 tracking-tight select-none">
      {title}
    </h3>
  );
}

// ─── Amazon Star Rating Row ──────────────────────────────────────────
function StarRow({ stars, selected, onClick }) {
  const t = useTranslations("SidebarFilter");
  return (
    <button
      onClick={onClick}
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
      <span className={`text-[13px] ms-1 transition-colors ${selected ? "text-[#9b2c41] font-bold" : "text-[#0F1111] group-hover:text-[#9b2c41]"}`}>
        {t("andUp")}
      </span>
    </button>
  );
}

// ─── Amazon Checkbox Component ──────────────────────────────────────
function AmazonCheckbox({ label, count, checked, onChange }) {
  return (
    <div 
      className="flex items-center gap-2 group cursor-pointer py-0.5 select-none animate-in fade-in duration-200" 
      onClick={onChange}
    >
      <div className={`w-[14px] h-[14px] border rounded-[3px] flex items-center justify-center transition-all shrink-0 ${
        checked 
          ? 'bg-[#be374f] border-[#be374f] shadow-[0_1px_2px_rgba(0,0,0,0.15)]' 
          : 'bg-white border-[#8D9096] group-hover:border-[#be374f] group-hover:shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
      }`}>
        {checked && (
          <Check size={10} className="text-white" strokeWidth={4.5} />
        )}
      </div>
      <span className={`text-[13px] transition-colors flex-1 truncate ${
        checked ? 'font-bold text-[#0F1111]' : 'text-[#0F1111] group-hover:text-[#be374f]'
      }`}>
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-[#565959] text-[11px] me-auto shrink-0 font-normal">({count})</span>
      )}
    </div>
  );
}

// ─── Main SidebarFilter Component ─────────────────────────────────────────────
export default function SidebarFilter({ categories = [], products = [], filters, onFiltersChange, priceBounds = { min: 0, max: 1000 } }) {
  const t = useTranslations("SidebarFilter");
  const pathname = usePathname();
  const [showAllTags, setShowAllTags] = useState(false);
  const [showAllSellers, setShowAllSellers] = useState(false);

  const activeCategory = useMemo(() => {
    if (!filters.category) return null;
    return categories.find(c => 
      c.id === Number(filters.category) || 
      decodeURIComponent(c.slug) === decodeURIComponent(filters.category)
    );
  }, [filters.category, categories]);

  const locale = useLocale();

  // Handle department section tree structure
  const departmentSection = useMemo(() => {
    const updateCat = (id) => onFiltersChange({ ...filters, category: id });

    if (!activeCategory) {
      return (
        <div className="mb-4">
          <SectionTitle title={t("category")} />
          <div className="max-h-[260px] overflow-y-auto ps-1">
            <ul className="space-y-1">
              {categories.filter(c => c.parent === 0).map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => updateCat(cat.id)}
                    className="flex items-center justify-between w-full group cursor-pointer"
                  >
                    <span 
                      className="text-[13px] font-normal text-[#0F1111] group-hover:text-[#9b2c41] transition-colors text-start truncate pe-2"
                      dangerouslySetInnerHTML={{ __html: getCategoryName(cat, locale) }} 
                    />
                    <span className="text-[#565959] text-[11px] shrink-0 font-normal group-hover:text-[#9b2c41]">({cat.count || 0})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    const parentCategory = activeCategory.parent ? categories.find(c => c.id === activeCategory.parent) : null;
    const children = categories.filter(c => c.parent === activeCategory.id);

    return (
      <div className="mb-4">
        <SectionTitle title={t("category")} />
        <div className="max-h-[260px] overflow-y-auto ps-1">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => updateCat(null)}
                className="text-[13px] font-normal text-[#be374f] hover:text-[#9b2c41] transition-colors flex items-center gap-0.5 w-full text-start cursor-pointer"
              >
                <ChevronLeft size={12} className="shrink-0 rotate-180" />
                <span>{t("allCategories")}</span>
              </button>
            </li>
            {parentCategory && (
              <li className="ps-3">
                <button
                  onClick={() => updateCat(parentCategory.id)}
                  className="text-[13px] font-normal text-[#be374f] hover:text-[#9b2c41] transition-colors flex items-center gap-0.5 w-full text-start cursor-pointer"
                  dangerouslySetInnerHTML={{ __html: `&gt; ${getCategoryName(parentCategory, locale)}` }}
                />
              </li>
            )}
            <li className={`${parentCategory ? 'ps-5' : 'ps-3'}`}>
              <div className="flex items-center justify-between">
                <span
                  className="text-[13px] font-bold text-[#0F1111] truncate pe-2"
                  dangerouslySetInnerHTML={{ __html: getCategoryName(activeCategory, locale) }}
                />
                <span className="text-[#565959] text-[11px] shrink-0 font-normal">({activeCategory.count || 0})</span>
              </div>
            </li>
            {children.map(child => (
              <li key={child.id} className={`${parentCategory ? 'ps-8' : 'ps-6'}`}>
                  <button
                    onClick={() => updateCat(child.id)}
                    className="flex items-center justify-between w-full group cursor-pointer"
                  >
                    <span
                      className="text-[13px] font-normal text-[#0F1111] group-hover:text-[#9b2c41] transition-colors text-start truncate pe-2"
                      dangerouslySetInnerHTML={{ __html: getCategoryName(child, locale) }}
                    />
                    <span className="text-[#565959] text-[11px] shrink-0 font-normal group-hover:text-[#9b2c41]">({child.count || 0})</span>
                  </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }, [activeCategory, categories, filters, onFiltersChange, locale]);

  const allTags = useMemo(() => {
    const tagMap = new Map();
    products.forEach(p => {
      (p.tags || []).forEach(tag => {
        tagMap.set(tag.name, (tagMap.get(tag.name) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [products]);

  const allMerchants = useMemo(() => {
    const merchantMap = new Map();
    products.forEach(p => {
      const merchantMeta = p.meta_data?.find(m => m.key === "merchant_name")?.value || 
                           p.meta_data?.find(m => m.key === "mahally_owner_name")?.value ||
                           p.store?.shop_name || 
                           p.store?.name;
      const name = merchantMeta || "Mahally Jo";
      merchantMap.set(name, (merchantMap.get(name) || 0) + 1);
    });
    return Array.from(merchantMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [products]);

  const displayedTags = showAllTags ? allTags : allTags.slice(0, 8);

  const update = (key, value) => onFiltersChange({ ...filters, [key]: value });

  const clearAll = () => onFiltersChange({
    category: null,
    minRating: null,
    priceRange: null,
    onSale: false,
    freeShipping: false,
    inStockOnly: false,
    minDiscount: null,
    tags: [],
    merchant: null,
    madeInJordan: false,
    colors: [],
    searchQuery: "",
  });

  return (
    <aside className="w-[240px] shrink-0 pe-4 pb-10 border-l border-[#E5E5E5] min-h-[500px]">
      
      {/* ── Shortcut (Clean View All Button) ── */}
      {pathname !== "/browse" && (
        <div className="mb-4">
          <Link
            href="/browse"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-lg text-[12px] font-normal text-[#0F1111] hover:border-[#B5B9B9] transition-all shadow-[0_2px_5px_0_rgba(213,219,219,0.3)] active:bg-[#EAEDED] select-none"
          >
            <ShoppingCart size={14} className="text-[#FF9900]" />
            <span className="font-medium">{t("viewAllProducts")}</span>
          </Link>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5] mb-2 select-none">
        <span className="text-[13px] font-bold text-[#0F1111] tracking-tight">{t("activeFilters")}</span>
        {Object.entries(filters).some(([k, v]) => k !== "searchQuery" && v !== null && v !== false && (Array.isArray(v) ? v.length > 0 : true) && v !== "") && (
          <button onClick={clearAll} className="text-[11px] font-normal text-[#be374f] hover:text-[#9b2c41] transition-colors">
            {t("clearAll")}
          </button>
        )}
      </div>

      {/* ── Department tree ── */}
      {departmentSection}

      {/* ── Customer Reviews ── */}
      <div className="mb-4">
        <SectionTitle title={t("customerReviews")} />
        <div className="space-y-1">
          {[4, 3, 2, 1].map(stars => (
            <StarRow
              key={stars}
              stars={stars}
              selected={filters.minRating === stars}
              onClick={() => update("minRating", filters.minRating === stars ? null : stars)}
            />
          ))}
        </div>
      </div>

      {/* ── Brands (Tags) ── */}
      {allTags.length > 0 && (
        <div className="mb-4">
          <SectionTitle title={t("brands")} />
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto ps-1">
            {displayedTags.map(({ name, count }) => {
              const selected = (filters.tags || []).includes(name);
              return (
                <AmazonCheckbox
                  key={name}
                  label={name}
                  count={count}
                  checked={selected}
                  onChange={() => {
                    const next = selected
                      ? (filters.tags || []).filter(t => t !== name)
                      : [...(filters.tags || []), name];
                    update("tags", next);
                  }}
                />
              );
            })}
          </div>
          {allTags.length > 8 && (
              <button
                onClick={() => setShowAllTags(!showAllTags)}
                className="mt-1.5 text-[12px] font-normal text-[#be374f] hover:text-[#9b2c41] transition-colors flex items-center gap-0.5 select-none cursor-pointer"
              >
                <span>{showAllTags ? t("showLess") : t("showMoreCount", { count: allTags.length })}</span>
                <ChevronDown size={12} className={`transform transition-transform ${showAllTags ? 'rotate-180' : ''}`} />
              </button>
          )}
        </div>
      )}

      {/* ── Made in Jordan ── */}
      <div className="mb-4">
        <SectionTitle title={locale === "ar" ? "المنتجات الأردنية" : "Made in Jordan"} />
        <AmazonCheckbox
          label={locale === "ar" ? "عرض المنتجات المصنوعة في الأردن" : "Show products made in Jordan"}
          count={products.filter(p => isMadeInJordanProduct(p)).length}
          checked={Boolean(filters.madeInJordan)}
          onChange={() => update("madeInJordan", !filters.madeInJordan)}
        />
      </div>

      {/* ── Seller ── */}
      {allMerchants.length > 0 && (() => {
        const displayedSellers = showAllSellers ? allMerchants : allMerchants.slice(0, 6);
        return (
          <div className="mb-4">
            <SectionTitle title={t("seller")} />
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto ps-1">
              {displayedSellers.map(({ name, count }) => {
                const selected = filters.merchant === name;
                return (
                  <AmazonCheckbox
                    key={name}
                    label={name === "Mahally Jo" ? t("officialMahally") : name}
                    count={count}
                    checked={selected}
                    onChange={() => update("merchant", selected ? null : name)}
                  />
                );
              })}
            </div>
            {allMerchants.length > 6 && (
              <button
                onClick={() => setShowAllSellers(!showAllSellers)}
                className="mt-1.5 text-[12px] font-normal text-[#be374f] hover:text-[#9b2c41] transition-colors flex items-center gap-0.5 select-none cursor-pointer"
              >
                <span>{showAllSellers ? t("showLess") : t("showMoreCount", { count: allMerchants.length })}</span>
                <ChevronDown size={12} className={`transform transition-transform ${showAllSellers ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        );
      })()}

      {/* ── Price ── */}
      <div className="mb-4">
        <SectionTitle title={t("price")} />
        
        {/* Amazon Price Buckets */}
        <div className="space-y-1 mb-3">
          {[
            { label: t("under10"), min: 0, max: 10 },
            { label: t("10to25"), min: 10, max: 25 },
            { label: t("25to50"), min: 25, max: 50 },
            { label: t("50andUp"), min: 50, max: 10000 },
          ].map((bucket, i) => {
            const isSelected = filters.priceRange?.[0] === bucket.min && filters.priceRange?.[1] === bucket.max;
            return (
              <button
                 key={i}
                 onClick={() => update("priceRange", isSelected ? null : [bucket.min, bucket.max])}
                 className={`block text-[13px] transition-colors w-full text-start font-normal select-none cursor-pointer ${
                   isSelected 
                     ? "text-[#9b2c41] font-bold" 
                     : "text-[#0F1111] hover:text-[#9b2c41]"
                 }`}
              >
                {bucket.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Dual Slider (Sleek Orange-accented) */}
        <div className="px-1 py-1.5 mb-3">
           <div className="relative w-full h-[3px] bg-zinc-200 rounded-full">
              <div 
                className="absolute h-full bg-[#E47911] rounded-full" 
                style={{ 
                  left: `${((filters.priceRange?.[0] || priceBounds.min) - priceBounds.min) / (priceBounds.max - priceBounds.min) * 100}%`,
                  right: `${100 - ((filters.priceRange?.[1] || priceBounds.max) - priceBounds.min) / (priceBounds.max - priceBounds.min) * 100}%`
                }}
              />
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                value={filters.priceRange?.[0] || priceBounds.min}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), (filters.priceRange?.[1] || priceBounds.max) - 1);
                  update("priceRange", [val, filters.priceRange?.[1] || priceBounds.max]);
                }}
                className="absolute w-full h-1 opacity-0 cursor-pointer pointer-events-auto appearance-none z-30"
              />
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                value={filters.priceRange?.[1] || priceBounds.max}
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), (filters.priceRange?.[0] || priceBounds.min) + 1);
                  update("priceRange", [filters.priceRange?.[0] || priceBounds.min, val]);
                }}
                className="absolute w-full h-1 opacity-0 cursor-pointer pointer-events-auto appearance-none z-30"
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#E47911] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.2)] pointer-events-none z-20"
                style={{ left: `calc(${((filters.priceRange?.[0] || priceBounds.min) - priceBounds.min) / (priceBounds.max - priceBounds.min) * 100}% - 7px)` }}
              />
           </div>
           <div className="flex justify-between text-[11px] font-bold text-zinc-400 select-none">
              <span>{filters.priceRange?.[0] || priceBounds.min} {t("currency")}</span>
              <span>{filters.priceRange?.[1] || priceBounds.max} {t("currency")}</span>
           </div>
        </div>
        
        {/* Custom Min/Max Input Box Row */}
        <div className="flex items-center gap-1.5 mt-2">
           <div className="relative flex-1">
              <span className="absolute start-1.5 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px] font-medium select-none">{t("currency")}</span>
              <input 
                type="number" 
                placeholder={t("minPrice")}
                value={filters.priceRange?.[0] || ""}
                onChange={(e) => update("priceRange", [Number(e.target.value), filters.priceRange?.[1] || priceBounds.max])}
                className="w-full h-7 ps-7 pe-1 bg-white border border-[#8D9096] rounded-[3px] text-[13px] outline-none focus:border-[#E47911] focus:ring-1 focus:ring-[#E47911] transition-all font-normal text-[#0F1111] text-start" 
              />
           </div>
           <div className="relative flex-1">
              <span className="absolute start-1.5 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px] font-medium select-none">{t("currency")}</span>
              <input 
                type="number" 
                placeholder={t("maxPrice")} 
                value={filters.priceRange?.[1] || ""}
                onChange={(e) => update("priceRange", [filters.priceRange?.[0] || priceBounds.min, Number(e.target.value)])}
                className="w-full h-7 ps-7 pe-1 bg-white border border-[#8D9096] rounded-[3px] text-[13px] outline-none focus:border-[#E47911] focus:ring-1 focus:ring-[#E47911] transition-all font-normal text-[#0F1111] text-start"
              />
           </div>
           <button 
             onClick={() => update("priceRange", [filters.priceRange?.[0] || 0, filters.priceRange?.[1] || 10000])}
             className="h-7 px-3 bg-white hover:bg-zinc-50 border border-[#D5D9D9] shadow-[0_2px_5px_0_rgba(213,219,219,0.3)] text-[#0F1111] rounded-[4px] text-[12px] font-normal hover:border-[#B5B9B9] cursor-pointer active:bg-zinc-100 flex items-center justify-center shrink-0 select-none"
           >
             {t("apply")}
           </button>
        </div>
      </div>

      {/* ── Deals & Discounts ── */}
      <div className="mb-4">
        <SectionTitle title={t("dealsAndDiscounts")} />
        <div className="space-y-2">
          <AmazonCheckbox
            label={t("discountedProducts")}
            checked={filters.onSale}
            onChange={() => update("onSale", !filters.onSale)}
          />
          <div className="space-y-1.5 ps-5">
            {[10, 25, 50].map((discount) => {
              const isSelected = filters.minDiscount === discount;
              return (
                <button
                  key={discount}
                  onClick={() => update("minDiscount", isSelected ? null : discount)}
                  className={`block text-[13px] text-start font-normal cursor-pointer transition-colors select-none ${
                    isSelected 
                      ? "text-[#9b2c41] font-bold" 
                      : "text-[#0F1111] hover:text-[#9b2c41]"
                  }`}
                >
                  {discount}{t("discountOrMore")}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Shipping & Availability ── */}
      <div className="mb-4">
        <SectionTitle title={t("shippingAndAvailability")} />
        <div className="space-y-2">
          <AmazonCheckbox
            label={t("eligibleForFreeShipping")}
            checked={filters.freeShipping}
            onChange={() => update("freeShipping", !filters.freeShipping)}
          />
          <AmazonCheckbox
            label={t("inStockOnly")}
            checked={filters.inStockOnly}
            onChange={() => update("inStockOnly", !filters.inStockOnly)}
          />
        </div>
      </div>
    </aside>
  );
}
