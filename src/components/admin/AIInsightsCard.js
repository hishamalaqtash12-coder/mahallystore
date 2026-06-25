"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Lightbulb,
  Clock,
  Store,
} from "lucide-react";

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-zinc-200 rounded ${className}`} />;
}

function AIInsightsCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
          <Sparkles className="h-5 w-5 text-zinc-300" />
        </div>
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-1 h-4 w-48" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-16 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendIcon({ trend }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-zinc-400" />;
}

export default function AIInsightsCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false); // Default to false to avoid automatic loaders
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const fetchInsights = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/insights");
      const result = await response.json();

      if (!result.success) throw new Error(result.error || "Failed to fetch insights");
      setData(result);
      setHasGenerated(true);
      localStorage.setItem("mahally_insights_generated", "true");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Only load automatically if the user previously triggered it in their session
    const saved = localStorage.getItem("mahally_insights_generated");
    if (saved === "true") {
      fetchInsights();
    }
  }, [fetchInsights]);

  if (loading) return <AIInsightsCardSkeleton />;

  if (!hasGenerated) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center py-6 sm:py-10 max-w-lg mx-auto">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-md mb-4 animate-pulse">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-950">Actionable Marketplace Insights</h3>
          <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
            Run a deterministic, data-driven analysis on your live WooCommerce records, aggregating sales velocity, pending orders, and low-stock alerts into optimized suggestions.
          </p>
          <button
            onClick={() => fetchInsights()}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-violet-500 hover:to-purple-500 transition-all active:scale-[0.98] select-none cursor-pointer"
          >
            <Sparkles size={16} />
            Generate Insights
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Failed to load insights</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchInsights()}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data?.insights) return null;

  const { insights, rawMetrics, generatedAt } = data;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-900">AI Insights</h2>
            <p className="text-sm text-zinc-500">
              Updated {new Date(generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchInsights(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 gap-px border-b border-zinc-200 bg-zinc-200 sm:grid-cols-4">
        {[
          { label: "Revenue (7d)", value: `JOD ${rawMetrics.currentRevenue}`, sub: `${rawMetrics.revenueChange}% vs last week`, positive: true },
          { label: "Orders (7d)", value: rawMetrics.orderCount, sub: "This week" },
          { label: "Avg Order", value: `JOD ${rawMetrics.avgOrderValue}`, sub: "Per order" },
          { label: "Pending", value: rawMetrics.unfulfilledCount, sub: "To fulfill", warn: rawMetrics.unfulfilledCount > 0 },
        ].map((m, i) => (
          <div key={i} className="bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">{m.label}</p>
            <p className={`mt-1 text-lg font-bold ${m.warn ? "text-amber-600" : "text-zinc-900"}`}>
              {m.value}
            </p>
            <p className={`text-xs mt-0.5 ${m.positive ? "text-emerald-600" : "text-zinc-400"}`}>
              {m.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Insights Grid */}
      <div className="grid gap-6 p-6 md:grid-cols-3">
        {/* Sales Trends */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendIcon trend={insights.salesTrends.trend} />
            <h3 className="font-medium text-zinc-900">Sales Trends</h3>
          </div>
          <p className="text-sm text-zinc-600">{insights.salesTrends.summary}</p>
          <ul className="space-y-2">
            {insights.salesTrends.highlights.map((highlight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Store Rankings / Performance */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-blue-500" />
            <h3 className="font-medium text-zinc-900">Store Rankings</h3>
          </div>
          <p className="text-sm text-zinc-600">{insights.storePerformance.summary}</p>
          {insights.storePerformance.stores.length > 0 ? (
            <div className="space-y-2.5">
              {insights.storePerformance.stores.map((store, i) => (
                <div key={i} className="rounded-lg bg-zinc-50 border border-zinc-100 p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-zinc-900">{store.storeName}</span>
                    <span className="block text-[10px] text-zinc-500 mt-0.5">{store.ordersCount} orders completed</span>
                  </div>
                  <div className="text-start">
                    <span className="font-bold text-[#800000] block">JOD {store.sales}</span>
                    {store.avgRating > 0 && (
                      <span className="text-[10px] text-amber-600 font-medium">★ {store.avgRating} rating</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No store sales data compiled yet.</p>
          )}
        </div>

        {/* Risk Analysis / Cancellations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h3 className="font-medium text-zinc-900">Risk & Cancellations</h3>
          </div>
          <p className="text-sm text-zinc-600">{insights.riskAnalysis.summary}</p>
          {insights.riskAnalysis.cancellations.length > 0 ? (
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Frequent Cancellations</p>
              {insights.riskAnalysis.cancellations.map((c, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-100 p-2.5 text-xs text-rose-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" size={14} />
                  <div>
                    <span className="font-bold block">{c.name}</span>
                    <span className="text-[10px] block opacity-80 mt-0.5">{c.email}</span>
                    <span className="font-bold block mt-1 text-red-700">{c.count} orders cancelled</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 text-xs text-emerald-800">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>All buyers show perfect checkout completion.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
