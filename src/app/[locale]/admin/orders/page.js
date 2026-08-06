"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Package,
} from "lucide-react";
import AdminSearch from "@/components/admin/AdminSearch";
import { useTranslations } from "next-intl";

export default function AdminOrdersPage() {
  const t = useTranslations("AdminOrders");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/orders?status=${statusFilter}&per_page=50`);
        const data = await res.json();
        if (data.orders) setOrders(data.orders);
      } catch (e) {
        console.error("Failed to fetch orders:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [statusFilter]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "completed": return "bg-emerald-50 text-emerald-700";
      case "processing": return "bg-blue-50 text-blue-700";
      case "shipped": return "bg-violet-50 text-violet-700";
      case "pending": return "bg-amber-50 text-amber-700";
      case "cancelled": return "bg-red-50 text-red-700";
      default: return "bg-zinc-50 text-zinc-700";
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
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
          <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
            <Download size={15} />
            {t("export")}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="h-9 w-9 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <AdminSearch
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={setSearch}
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "processing", "completed", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === f
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-end">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {t("orderId")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {t("customer")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {t("date")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {t("total")}
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide text-center">
                {t("status")}
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
                    <p className="text-sm text-zinc-500">{t("loadingOrders")}</p>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-zinc-900">{o.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-500">
                        {o.customer[0]}
                      </div>
                      <p className="text-sm font-medium text-zinc-900">{o.customer}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-zinc-500">{o.date}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-zinc-900">{o.total}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-zinc-400">
                      <Package size={10} />
                      <p className="text-xs">{t("itemsLabel", { count: o.items })}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getStatusStyle(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-start">
                    <button className="h-8 w-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors opacity-0 group-hover:opacity-100 me-auto">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center">
                      <ShoppingCart size={18} className="text-zinc-400" />
                    </div>
                    <p className="text-sm text-zinc-500">{t("noOrdersFound")}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!loading && filteredOrders.length > 0 && (
          <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {t("showingOrders", { count: filteredOrders.length, suffix: filteredOrders.length !== 1 ? "s" : "" })}
            </p>
            <div className="flex items-center gap-1">
              <button disabled className="h-8 w-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <button disabled className="h-8 w-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
