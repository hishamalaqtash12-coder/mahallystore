"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Layers,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import AdminSearch from "@/components/admin/AdminSearch";
import { useTranslations } from "next-intl";

export default function AdminInventoryPage() {
  const t = useTranslations("AdminInventory");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (e) {
        console.error("Failed to fetch products:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const qty = p.stock_quantity ?? p.stockQuantity ?? 0;
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    if (filter === "low-stock")
      return matchesSearch && qty > 0 && qty <= 5;
    if (filter === "out-of-stock")
      return matchesSearch && qty === 0;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("pageSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="h-9 w-9 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("totalProducts"), value: products.length, icon: Layers },
          {
            label: t("lowStock"),
            value: products.filter((p) => {
              const qty = p.stock_quantity ?? p.stockQuantity ?? 0;
              return qty > 0 && qty <= 5;
            }).length,
            icon: AlertTriangle,
            warn: true,
          },
          {
            label: t("outOfStock"),
            value: products.filter((p) => {
              const qty = p.stock_quantity ?? p.stockQuantity ?? 0;
              return qty === 0;
            }).length,
            icon: Trash2,
            danger: true,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-6 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-zinc-500">{s.label}</p>
              <p className={`mt-2 text-3xl font-bold ${s.danger ? "text-red-600" : s.warn ? "text-amber-600" : "text-zinc-900"}`}>
                {s.value}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${s.danger ? "bg-red-50" : s.warn ? "bg-amber-50" : "bg-zinc-100"}`}>
              <s.icon className={`h-5 w-5 ${s.danger ? "text-red-500" : s.warn ? "text-amber-500" : "text-zinc-600"}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <AdminSearch
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={setSearch}
          className="flex-1"
        />
        <div className="flex gap-2">
          {["all", "low-stock", "out-of-stock"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {f.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-[1000px] w-full text-end">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {t("product")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {t("sku")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {t("brand")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {t("price")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide text-center">
                {t("stock")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide text-start">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                    <p className="text-sm text-zinc-500">{t("loadingInventory")}</p>
                  </div>
                </td>
              </tr>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg overflow-hidden border border-zinc-100 bg-zinc-50 shrink-0">
                        {p.image?.sourceUrl ? (
                          <img
                            src={p.image.sourceUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={16} className="text-zinc-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {p.categories?.nodes?.[0]?.name || "General"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-zinc-500">
                    <span className="bg-zinc-50 border border-zinc-100 rounded px-2 py-0.5">
                      {p.sku || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-zinc-600">
                      {p.brands?.map(b => b.name).join(", ") || "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-zinc-900">
                        JOD {parseFloat(p.price || 0).toFixed(2)}
                      </p>
                      {(p.on_sale && parseFloat(p.regular_price || 0) > parseFloat(p.price || 0)) && (
                        <p className="text-[11px] text-zinc-400 line-through font-medium">
                          JOD {parseFloat(p.regular_price).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-bold text-zinc-900">
                        {p.stock_quantity ?? p.stockQuantity ?? 0}
                      </span>
                      {(p.stock_quantity ?? p.stockQuantity ?? 0) > 0 && (p.stock_quantity ?? p.stockQuantity ?? 0) <= 5 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                          Low
                        </span>
                      )}
                      {(p.stock_quantity ?? p.stockQuantity ?? 0) === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-200">
                          Out
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-start">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="h-8 w-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button className="h-8 w-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 hover:text-red-600 hover:border-red-200 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center">
                      <Package size={18} className="text-zinc-400" />
                    </div>
                    <p className="text-sm text-zinc-500">{t("noProductsFound")}</p>
                    {search && (
                      <p className="text-xs text-zinc-400">{t("tryAdjustSearch")}</p>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && filteredProducts.length > 0 && (
          <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {t("showingProducts", { count: filteredProducts.length })}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled
                className="h-8 w-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled
                className="h-8 w-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
