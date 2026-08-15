"use client";

import { useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import Loader from "@/components/Loader";
import Image from "next/image";
import {
  Package,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  X,
  ArrowUpDown
} from "lucide-react";

const T = {
  en: {
    title: "Inventory",
    subtitle: "Monitor stock levels, sales velocity, and fulfillment performance",
    refresh: "Refresh",
    search: "Search products...",
    noResults: "No products match your search.",
    loading: "Loading inventory",
    stats: {
      total: "Total Products",
      confirmed: "Confirmed Sales",
      pending: "Pending Orders",
      cancelled: "Cancelled",
      lowStock: "Low Stock"
    },
    table: {
      product: "Product Info",
      stock: "Stock Level",
      confirmed: "Confirmed",
      pending: "Pending",
      cancelled: "Cancelled",
      status: "Status",
      action: "Quick Refill"
    },
    stockStatus: { instock: "In Stock", outofstock: "Out of Stock", low: "Low Stock" },
    filter: { all: "All Products", low: "Low Stock", out: "Out of Stock", instock: "In Stock" },
    refill: {
      title: "Update Stock",
      subtitle: "Enter the new total stock quantity for this product.",
      label: "New Quantity",
      cancel: "Cancel",
      update: "Update Stock",
      success: "Stock updated!",
      error: "Failed to update stock"
    }
  },
  ar: {
    title: "المخزون",
    subtitle: "تتبع مستويات المخزون وأداء المبيعات والتنفيذ",
    refresh: "تحديث",
    search: "ابحث عن منتج...",
    noResults: "لا توجد منتجات مطابقة لبحثك.",
    loading: "جاري تحميل المخزون",
    stats: {
      total: "إجمالي المنتجات",
      confirmed: "المبيعات المؤكدة",
      pending: "قيد الانتظار",
      cancelled: "ملغاة",
      lowStock: "مخزون منخفض"
    },
    table: {
      product: "معلومات المنتج",
      stock: "مستوى المخزون",
      confirmed: "مؤكد",
      pending: "قيد الانتظار",
      cancelled: "ملغاة",
      status: "الحالة",
      action: "إعادة تعبئة"
    },
    stockStatus: { instock: "متوفر", outofstock: "غير متوفر", low: "مخزون منخفض" },
    filter: { all: "جميع المنتجات", low: "مخزون منخفض", out: "غير متوفر", instock: "متوفر" },
    refill: {
      title: "تحديث المخزون",
      subtitle: "أدخل إجمالي كمية المخزون الجديد لهذا المنتج.",
      label: "الكمية الجديدة",
      cancel: "إلغاء",
      update: "تحديث المخزون",
      success: "تم تحديث المخزون!",
      error: "فشل تحديث المخزون"
    }
  }
};

export default function MerchantInventoryPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = isAr ? T.ar : T.en;
  const { wooId } = useAuth();

  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [refillId, setRefillId] = useState(null);
  const [refillProduct, setRefillProduct] = useState(null);
  const [refillValue, setRefillValue] = useState(0);
  const [updatingStock, setUpdatingStock] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchStats = async () => {
    if (!wooId) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/merchant/inventory-stats?vendorId=${wooId}`);
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch inventory stats", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleQuickRefill = async () => {
    if (!refillId) return;
    setUpdatingStock(true);
    try {
      const res = await fetch("/api/merchant/products/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: refillId, stock_quantity: refillValue, wooId })
      });
      if (res.ok) {
        setRefillId(null);
        setRefillProduct(null);
        setSuccessMsg(t.refill.success);
        setTimeout(() => setSuccessMsg(""), 3000);
        fetchStats();
      }
    } catch (err) {
      alert(t.refill.error);
    } finally {
      setUpdatingStock(false);
    }
  };

  useEffect(() => { fetchStats(); }, [wooId]);

  const summaryStats = useMemo(() => ({
    total: stats.length,
    confirmed: stats.reduce((acc, item) => acc + (item.confirmedOrders || 0), 0),
    pending: stats.reduce((acc, item) => acc + (item.pendingOrders || 0), 0),
    cancelled: stats.reduce((acc, item) => acc + (item.cancelledOrders || 0), 0),
    lowStock: stats.filter(item => item.currentStock <= 5 && item.stockStatus === "instock").length,
    outOfStock: stats.filter(item => item.stockStatus === "outofstock").length
  }), [stats]);

  const filteredStats = useMemo(() => {
    let result = stats.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (stockFilter === "low") result = result.filter(i => i.currentStock <= 5 && i.stockStatus === "instock");
    if (stockFilter === "out") result = result.filter(i => i.stockStatus === "outofstock");
    if (stockFilter === "instock") result = result.filter(i => i.stockStatus === "instock" && i.currentStock > 5);
    if (sortBy === "stock") result = [...result].sort((a, b) => a.currentStock - b.currentStock);
    if (sortBy === "confirmed") result = [...result].sort((a, b) => b.confirmedOrders - a.confirmedOrders);
    if (sortBy === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [stats, searchQuery, stockFilter, sortBy]);

  if (!wooId || loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader size="lg" text={t.loading} />
      </div>
    );
  }

  const filterKeys = ["all", "instock", "low", "out"];
  const filterCount = (f) => {
    if (f === "all") return stats.length;
    if (f === "instock") return stats.filter(i => i.stockStatus === "instock" && i.currentStock > 5).length;
    if (f === "low") return stats.filter(i => i.currentStock <= 5 && i.stockStatus === "instock").length;
    return stats.filter(i => i.stockStatus === "outofstock").length;
  };

  const closeRefill = () => { setRefillId(null); setRefillProduct(null); };

  return (
    <div className="space-y-6 font-sans">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">{t.title}</h1>
          <p className="text-[13px] text-zinc-500 font-medium">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {successMsg && (
            <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
              ✓ {successMsg}
            </span>
          )}
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="h-[36px] px-4 border border-zinc-300 rounded-md text-[13px] font-bold text-zinc-600 hover:bg-zinc-50 shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {t.refresh}
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package size={16} className="text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-end">{t.stats.total}</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{summaryStats.total}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-end">{t.stats.confirmed}</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{summaryStats.confirmed}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm border-l-4 border-l-amber-400">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <RefreshCw size={16} className="text-amber-600" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-end">{t.stats.pending}</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{summaryStats.pending}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
              <XCircle size={16} className="text-rose-600" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-end">{t.stats.cancelled}</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{summaryStats.cancelled}</p>
        </div>

        <div className={`bg-white p-4 rounded-xl border shadow-sm ${summaryStats.lowStock > 0 || summaryStats.outOfStock > 0 ? "border-rose-200 border-l-4 border-l-rose-500" : "border-zinc-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
              <AlertCircle size={16} className="text-rose-600" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-end">{t.stats.lowStock}</span>
          </div>
          <p className={`text-2xl font-bold ${summaryStats.lowStock + summaryStats.outOfStock > 0 ? "text-rose-600" : "text-zinc-900"}`}>
            {summaryStats.lowStock + summaryStats.outOfStock}
          </p>
        </div>
      </div>

      {/* ── Main Table Card ── */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">

        {/* Filter / Search toolbar */}
        <div className="px-4 py-3 border-b border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar w-full sm:w-auto max-w-full">
            {filterKeys.map(f => (
              <button
                key={f}
                onClick={() => setStockFilter(f)}
                className={`h-[30px] px-3.5 rounded-md text-[12px] font-bold transition-all whitespace-nowrap shrink-0 ${
                  stockFilter === f
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 bg-zinc-50 border border-zinc-200"
                }`}
              >
                {t.filter[f]}
                <span className={`ms-1.5 text-[10px] ${stockFilter === f ? "opacity-70" : "text-zinc-400"}`}>
                  ({filterCount(f)})
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative">
              <ArrowUpDown className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="h-[36px] pe-8 ps-3 bg-white border border-zinc-300 rounded-md text-[12px] font-bold outline-none hover:bg-zinc-50 shadow-sm appearance-none cursor-pointer"
              >
                <option value="name">{isAr ? "ترتيب: الاسم" : "Sort: Name"}</option>
                <option value="stock">{isAr ? "ترتيب: المخزون" : "Sort: Stock"}</option>
                <option value="confirmed">{isAr ? "ترتيب: المبيعات" : "Sort: Sales"}</option>
              </select>
            </div>
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-[36px] bg-white border border-zinc-300 rounded-md pe-9 ps-3 text-[13px] outline-none focus:border-[#be374f] transition-all w-full sm:w-56 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-end border-collapse min-w-[780px]">
            <thead className="bg-zinc-100/50 border-b border-zinc-200">
              <tr className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">{t.table.product}</th>
                <th className="px-6 py-4">{t.table.stock}</th>
                <th className="px-6 py-4 text-center">{t.table.confirmed}</th>
                <th className="px-6 py-4 text-center">{t.table.pending}</th>
                <th className="px-6 py-4 text-center">{t.table.cancelled}</th>
                <th className="px-6 py-4 text-center">{t.table.status}</th>
                <th className="px-6 py-4 text-center">{t.table.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredStats.map(product => {
                const isLow = product.currentStock <= 5 && product.stockStatus === "instock";
                const isOut = product.stockStatus === "outofstock";
                const stockPercent = Math.min((product.currentStock / 50) * 100, 100);
                return (
                  <tr key={product.id} className="hover:bg-zinc-50 transition-colors group">

                    {/* Product Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.image
                            ? <Image src={product.image} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                            : <Package size={16} className="text-zinc-400" />
                          }
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-bold text-zinc-900 group-hover:text-[#be374f] transition-colors truncate max-w-[200px]">
                            {product.name}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono mt-0.5">SKU: {product.sku || "—"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Stock Level */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[15px] font-bold ${isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-zinc-900"}`}>
                            {product.currentStock}
                          </span>
                          <span className="text-[11px] text-zinc-400">{isAr ? "وحدة" : "units"}</span>
                        </div>
                        <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isOut ? "bg-rose-500" : isLow ? "bg-amber-400" : "bg-emerald-500"}`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Confirmed */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-bold border border-emerald-100">
                        {product.confirmedOrders || 0}
                      </span>
                    </td>

                    {/* Pending */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-700 text-[12px] font-bold border border-amber-100">
                        {product.pendingOrders || 0}
                      </span>
                    </td>

                    {/* Cancelled */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-700 text-[12px] font-bold border border-rose-100">
                        {product.cancelledOrders || 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border tracking-wider ${
                        isOut
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : isLow
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {isOut ? t.stockStatus.outofstock : isLow ? t.stockStatus.low : t.stockStatus.instock}
                      </span>
                    </td>

                    {/* Refill Button */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => { setRefillId(product.id); setRefillProduct(product); setRefillValue(product.currentStock); }}
                        className={`h-[32px] px-4 rounded-md text-[12px] font-bold shadow-sm transition-all flex items-center gap-1.5 mx-auto ${
                          isOut || isLow
                            ? "bg-brand hover:bg-brand-dark text-white"
                            : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300"
                        }`}
                      >
                        <Plus size={13} />
                        {isAr ? "تعبئة" : "Refill"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStats.length === 0 && (
          <div className="py-20 text-center">
            <AlertCircle size={36} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500 text-[14px] font-medium italic">{t.noResults}</p>
          </div>
        )}

        {/* Footer */}
        {stats.length > 0 && (
          <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
            <p className="text-[12px] text-zinc-500 font-medium">
              {isAr ? `إجمالي المخزون: ${stats.length} منتج` : `Total Inventory: ${stats.length} Products`}
            </p>
            {filteredStats.length < stats.length && (
              <p className="text-[12px] text-zinc-400">
                {isAr ? `يُعرض ${filteredStats.length} من ${stats.length}` : `Showing ${filteredStats.length} of ${stats.length}`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Refill Modal ── */}
      {refillId && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeRefill} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
              <div>
                <h2 className="text-[16px] font-bold text-zinc-900">{t.refill.title}</h2>
                {refillProduct && (
                  <p className="text-[12px] text-zinc-500 mt-0.5 truncate max-w-[220px]">{refillProduct.name}</p>
                )}
              </div>
              <button
                onClick={closeRefill}
                className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-[13px] text-zinc-500">{t.refill.subtitle}</p>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                  {t.refill.label}
                </label>
                <input
                  type="number"
                  min={0}
                  value={refillValue}
                  onChange={e => setRefillValue(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[20px] font-bold text-zinc-900 outline-none focus:border-[#be374f] transition-all"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={closeRefill}
                  className="flex-1 h-10 border border-zinc-200 rounded-xl text-[13px] font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
                >
                  {t.refill.cancel}
                </button>
                <button
                  onClick={handleQuickRefill}
                  disabled={updatingStock}
                  className="flex-1 h-10 bg-zinc-900 text-white rounded-xl text-[13px] font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {updatingStock ? <Loader2 size={16} className="animate-spin" /> : t.refill.update}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
