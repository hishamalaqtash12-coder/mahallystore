"use client";

import { useState, useEffect } from "react";
import {
  Store,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import AIInsightsCard from "@/components/admin/AIInsightsCard";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentVendors, setRecentVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const t = useTranslations("AdminDashboard");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  async function fetchData() {
    try {
      setLoading(true);
      const [statsRes, vendorsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/vendors"),
      ]);
      const statsData = await statsRes.json();
      const vendorsData = await vendorsRes.json();
      setStats(statsData);
      setRecentVendors(vendorsData);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const load = () => {
      fetchData();
    };

    load();
  }, []);

  const handleAction = async (vendorId, action) => {
    setActionLoading(vendorId);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setRecentVendors((prev) =>
          prev.map((v) => (v.id === vendorId ? { ...v, status: data.status } : v))
        );
        showToast(
          action === "approve" ? t("toastApproved") : t("toastRejected"),
          action === "approve" ? "success" : "error"
        );
        const statsRes = await fetch("/api/admin/stats");
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (e) {
      showToast(t("toastFailed"), "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">{t("loading")}</p>
      </div>
    );
  }

  const statCards = [
    {
      label: t("totalRevenue"),
      value: stats?.totalRevenue ? `JOD ${parseFloat(stats.totalRevenue).toLocaleString()}` : "JOD 0",
      icon: TrendingUp,
      trend: "+14.2%",
      up: true,
      href: "/admin/reports",
    },
    {
      label: t("activeVendors"),
      value: stats?.totalVendors ?? 0,
      icon: Store,
      trend: "+5%",
      up: true,
      href: "/admin/vendors",
    },
  ];

  const pendingApplications = recentVendors.filter((v) => v.status === "pending");
  const otherApplications = recentVendors.filter((v) => v.status !== "pending").slice(0, 3);
  const displayQueue = [...pendingApplications, ...otherApplications];

  return (
    <div className="space-y-6 sm:space-y-8 relative">
      {toast && (
        <div
          className={`fixed top-6 start-6 z-[100] px-5 py-3 rounded-xl text-sm font-medium shadow-lg animate-in slide-in-from-start-4 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="rounded-[28px] border border-zinc-200 bg-gradient-to-br from-zinc-950 via-zinc-900 to-[#be374f] p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
              Mahally Admin
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{t("heroTitle")}</h1>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">{t("heroSubtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/announcements"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <Plus size={15} />
              {t("newBroadcast")}
            </Link>
            <button
              onClick={fetchData}
              className="h-10 w-10 rounded-xl border border-white/15 bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {statCards.map((s, idx) => (
          <Link
            key={idx}
            href={s.href}
            className="rounded-2xl border border-zinc-200 bg-white p-6 cursor-pointer hover:border-zinc-300 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">{s.label}</p>
                <p className="mt-2 text-3xl font-bold text-zinc-900">
                  {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                <s.icon className="h-5 w-5 text-[#be374f]" />
              </div>
            </div>
            <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${s.up ? "text-emerald-600" : "text-red-600"}`}>
              {s.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {s.trend} {t("fromLastMonth")}
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#be374f]" />
            <h2 className="font-semibold text-zinc-900">{t("queueTitle")}</h2>
          </div>
          <Link
            href="/admin/vendors"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors flex items-center gap-1"
          >
            {t("viewAllApplications")} <ArrowRight size={12} />
          </Link>
        </div>
        <div className="p-6">
          {displayQueue.length > 0 ? (
            <div className="space-y-4">
              {displayQueue.map((v) => {
                const isActioning = actionLoading === v.id;
                return (
                  <div
                    key={v.id}
                    className="flex flex-col lg:flex-row lg:items-center gap-5 p-4 rounded-2xl border border-zinc-100 bg-zinc-50/70 hover:bg-zinc-50 hover:border-zinc-200 transition-all"
                  >
                    <div className="h-10 w-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-sm font-semibold text-zinc-500 shrink-0">
                      {v.storeName?.[0]?.toUpperCase() || v.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900">{v.storeName || v.name}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          v.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : v.status === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Store size={12} className="text-zinc-400" />
                          {v.storeCategory || "General"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail size={12} className="text-zinc-400" />
                          {v.email}
                        </span>
                        {v.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} className="text-zinc-400" />
                            {v.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {v.status !== "approved" && (
                        <button
                          onClick={() => handleAction(v.id, "approve")}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 select-none cursor-pointer"
                        >
                          {isActioning ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <CheckCircle size={12} />
                          )}
                          {t("approve")}
                        </button>
                      )}
                      {v.status !== "rejected" && (
                        <button
                          onClick={() => handleAction(v.id, "reject")}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50 select-none cursor-pointer"
                        >
                          {isActioning ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {t("reject")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 border border-zinc-200 text-zinc-400">
                <Store size={18} />
              </div>
              <p className="text-sm font-semibold text-zinc-900">{t("queueEmptyTitle")}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{t("queueEmptyDesc")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
