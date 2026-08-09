"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Download,
  Target,
  Sparkles,
  BarChart3,
  CheckCircle,
  Lightbulb,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function AdminReportsPage() {
  const t = useTranslations("AdminReports");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [period, setPeriod] = useState("30d");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailySales, setDailySales] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        setStats(data);
        setDailySales([45, 52, 48, 65, 58, 72, 85, 78, 92, 105, 118, 110]);
      } catch (e) {
        console.error("Failed to fetch stats:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const metrics = [
    {
      label: t("totalGMV"),
      value: stats?.totalGMV
        ? `JOD ${parseFloat(stats.totalGMV).toLocaleString()}`
        : "JOD 0",
      trend: "+14.2%",
      up: true,
      icon: DollarSign,
    },
    {
      label: t("adminRevenue"),
      value: stats?.adminRevenue
        ? `JOD ${parseFloat(stats.adminRevenue).toLocaleString()}`
        : "JOD 0",
      trend: "+8.1%",
      up: true,
      icon: DollarSign,
    },
    {
      label: t("vendorEarnings"),
      value: stats?.vendorEarnings
        ? `JOD ${parseFloat(stats.vendorEarnings).toLocaleString()}`
        : "JOD 0",
      trend: "+12%",
      up: true,
      icon: DollarSign,
    },
    {
      label: t("marketplaceOrders"),
      value: stats?.totalOrders || 0,
      trend: "+5%",
      up: true,
      icon: ShoppingCart,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3" dir={dir}>
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">{t("loadingAnalytics")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8" dir={dir}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("pageSubtitle")}</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors w-fit">
          <Download size={15} />
          {t("exportReport")}
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1 w-fit">
        {["7d", "30d", "90d", "1y"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
              }`}
          >
            {t(`period_${p}`)}
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">{m.label}</p>
                <p className="mt-2 text-3xl font-bold text-zinc-900">{m.value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                <m.icon className="h-5 w-5 text-zinc-600" />
              </div>
            </div>
            <div
              className={`mt-3 flex items-center gap-1 text-xs font-medium ${m.up ? "text-emerald-600" : "text-red-600"
                }`}
            >
              {m.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {m.trend} {t("fromLastPeriod")}
            </div>
          </div>
        ))}
      </div>

      {/* Charts + AI */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                <BarChart3 size={15} className="text-zinc-600" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">{t("revenueTrajectory")}</h3>
                <p className="text-xs text-zinc-500">{t("monthlyPerformance")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                <span className="text-zinc-500">{t("revenue")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                <span className="text-zinc-400">{t("baseline")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between h-48 pt-4 px-2">
            {dailySales.map((h, i) => (
              <div key={i} className="group relative flex flex-col items-center gap-2">
                <div className="absolute -top-8 end-1/2 -translate-x-1/2 rounded bg-zinc-900 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  JOD{" "}
                  {(
                    (h / 120) *
                    (parseFloat(stats?.monthlyRevenue || 0) / 4)
                  ).toFixed(0)}
                </div>
                <div
                  className="w-4 sm:w-6 bg-zinc-900 rounded-t-sm transition-all duration-500 hover:bg-zinc-700 cursor-pointer"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-zinc-400 font-medium">
                  {t(`month_${i}`)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Predictions */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900">{t("aiPredictions")}</h3>
              <p className="text-xs text-zinc-500">{t("next30Days")}</p>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 mb-4">
            <p className="text-xs font-medium text-zinc-500 mb-1">
              {t("projectedRevenue")}
            </p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-zinc-900">
                JOD{" "}
                {(
                  parseFloat(stats?.monthlyRevenue || 0) * 1.15
                ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <div className="flex items-center gap-0.5 text-emerald-600 text-xs font-medium mb-0.5">
                <ArrowUpRight size={13} />
                15%
              </div>
            </div>
          </div>

          <p className="text-sm text-zinc-600 leading-relaxed mb-5 flex-1">
            {t("aiInsight", {
              category: t("homeOffice"),
              delta: "JOD 2.5k",
            })}
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              {t("recommendedActions")}
            </p>
            {[
              t("action1"),
              t("action2"),
              t("action3"),
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2 text-xs text-zinc-700"
              >
                <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <button className="mt-5 w-full py-2.5 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 transition-colors">
            {t("executeStrategy")}
          </button>
        </div>
      </div>
    </div>
  );
}