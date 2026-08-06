"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  DollarSign
} from "lucide-react";
import * as XLSX from "xlsx";
import Loader from "@/components/Loader";

export default function ReportsPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (en, ar) => (isAr ? ar : en);
  const { wooId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({ totalGross: "0.00", totalNet: "0.00", orderCount: 0, avgOrderValue: "0.00" });
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState("7days");

  useEffect(() => {
    if (!wooId) return;

    const fetchReports = async () => {
      setLoading(true);
      try {
        const days = timeframe === "7days" ? 7 : 30;
        const res = await fetch(`/api/merchant/reports/revenue?wooId=${wooId}&days=${days}&t=${Date.now()}`);
        const data = await res.json();
        if (data.report) setReportData(data.report);
        if (data.summary) setSummary(data.summary);
        if (data.topProducts) setTopProducts(data.topProducts);
        if (data.chartData) setChartData(data.chartData);
      } catch (e) {
        console.error("Failed to fetch reports", e);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [wooId, timeframe]);

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
    XLSX.writeFile(workbook, `Mahally_Sales_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Analyzing sales data" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">{t("Sales & Analytics", "المبيعات والتحليلات")}</h1>
          <p className="text-[13px] text-zinc-500 font-medium">{t("Track your performance and revenue growth", "تابع أدائك ونمو إيراداتك")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-zinc-200 p-1 rounded-lg shadow-sm">
            <button
              onClick={() => setTimeframe("7days")}
              className={`px-4 py-1.5 text-[12px] font-bold rounded-md transition-all ${timeframe === "7days" ? "bg-[#febd69] text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              {t("7 Days", "7 أيام")}
            </button>
            <button
              onClick={() => setTimeframe("30days")}
              className={`px-4 py-1.5 text-[12px] font-bold rounded-md transition-all ${timeframe === "30days" ? "bg-[#febd69] text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              {t("30 Days", "30 يوم")}
            </button>
          </div>
          <button
            onClick={handleExport}
            className="h-[36px] px-4 bg-zinc-900 text-white rounded-md text-[12px] font-bold hover:bg-zinc-800 transition-all shadow-md flex items-center gap-2"
          >
            <Download size={14} /> {t("Export CSV", "تصدير CSV")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("Gross Revenue", "الإيراد الإجمالي"), value: `JOD ${summary.totalGross}`, delta: "+0.0%", isUp: true, icon: DollarSign },
          { label: t("Net Earnings", "الأرباح الصافية"), value: `JOD ${summary.totalNet}`, delta: "+0.0%", isUp: true, icon: TrendingUp },
          { label: t("Total Orders", "إجمالي الطلبات"), value: summary.orderCount.toString(), delta: "+0.0%", isUp: true, icon: ShoppingCart },
          { label: t("Avg. Order Value", "متوسط قيمة الطلب"), value: `JOD ${summary.avgOrderValue}`, delta: "+0.0%", isUp: true, icon: BarChart3 }
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-zinc-200 p-5 rounded-md hover:shadow-md transition-all group relative shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</span>
              <div className="p-2 bg-zinc-50 rounded-lg text-zinc-400 group-hover:text-[#be374f] group-hover:bg-brand-light transition-colors">
                <stat.icon size={18} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-[26px] font-bold text-zinc-900 tracking-tight">{stat.value}</h3>
              <div className={`flex items-center gap-0.5 text-[12px] font-bold ${stat.isUp ? "text-emerald-600" : "text-rose-600"}`}>
                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.delta}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-zinc-200 p-6 rounded-md shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-[16px] font-bold text-zinc-900">{t("Revenue Breakdown", "تفصيل الإيرادات")}</h4>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#be374f]" />
                <span className="text-[12px] text-zinc-500 font-medium">{t("Gross Sales", "المبيعات الإجمالية")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#2271b1]" />
                <span className="text-[12px] text-zinc-500 font-medium">{t("Net Earnings", "الأرباح الصافية")}</span>
              </div>
            </div>
          </div>
          <ReportsAreaChart data={chartData} t={t} />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-zinc-200 p-6 rounded-md shadow-sm">
            <h4 className="text-[16px] font-bold text-zinc-900 mb-6">{t("Top Selling Products", "أفضل المنتجات مبيعاً")}</h4>
            <div className="space-y-4">
              {topProducts.length > 0 ? topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#f3f3f3] flex items-center justify-center text-[11px] font-bold text-zinc-500 group-hover:bg-[#be374f] group-hover:text-white transition-colors">#{i + 1}</div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-zinc-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-zinc-400 font-medium">{p.sales} {t("units sold", "وحدة مباعة")}</p>
                    </div>
                  </div>
                  <p className="text-[13px] font-bold text-zinc-900">JOD {p.revenue.toFixed(2)}</p>
                </div>
              )) : (
                <p className="text-[13px] text-zinc-400 italic py-4 text-center">{t("No sales data yet", "لا توجد بيانات مبيعات بعد")}</p>
              )}
            </div>
            <button className="w-full mt-6 h-[36px] bg-[#f7f8fa] hover:bg-zinc-100 border border-zinc-200 rounded-md text-[12px] font-bold text-zinc-700 transition-all">
              {t("View Inventory Report", "عرض تقرير المخزون")}
            </button>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-md shadow-sm text-white relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-[15px] font-bold mb-2">{t("Commission Summary", "ملخص العمولة")}</h4>
              <p className="text-[12px] text-zinc-400 leading-relaxed mb-4">
                {t("Your current platform fee is ", "رسوم المنصة الحالية هي ")}<span className="text-white font-bold">10%</span> {t("based on your ", "بناءً على ")}<span className="text-[#febd69] font-bold">{t("Silver Plan", "الخطة الفضية")}</span>.
              </p>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#febd69] w-[75%]" />
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">{t("75% of monthly target reached", "تم الوصول إلى 75% من الهدف الشهري")}</p>
            </div>
            <TrendingUp className="absolute -start-4 -bottom-4 w-24 h-24 text-white/5 -rotate-12" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h4 className="text-[16px] font-bold text-zinc-900">{t("Recent Transactions Report", "تقرير المعاملات الأخيرة")}</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-end">
            <thead>
              <tr className="bg-zinc-100/50 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">{t("Order ID", "رقم الطلب")}</th>
                <th className="px-6 py-4">{t("Date", "التاريخ")}</th>
                <th className="px-6 py-4">{t("Customer", "العميل")}</th>
                <th className="px-6 py-4">{t("Gross Revenue", "الإيراد الإجمالي")}</th>
                <th className="px-6 py-4">{t("Net Earnings", "الأرباح الصافية")}</th>
                <th className="px-6 py-4 text-center">{t("Status", "الحالة")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {reportData.slice(0, 10).map((row, i) => (
                <tr key={i} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4 text-[13px] font-bold text-[#be374f] group-hover:text-[#8f2d4a] transition-colors">{row["Order ID"]}</td>
                  <td className="px-6 py-4 text-[12px] text-zinc-400 font-medium">{row["Date"]}</td>
                  <td className="px-6 py-4 text-[13px] font-bold text-zinc-900">{row["Customer"]}</td>
                  <td className="px-6 py-4 text-[13px] font-bold text-zinc-900">JOD {row["Gross Revenue (JOD)"]}</td>
                  <td className="px-6 py-4 text-[13px] font-bold text-emerald-600">JOD {row["Net Earnings (JOD)"]}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      row["Status"] === "Completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>
                      {row["Status"]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportsAreaChart({ data = [], t }) {
  const safeData = Array.isArray(data) && data.length > 0 ? data : [];
  const hasVisibleData = safeData.some((item) => Number(item.gross || 0) > 0 || Number(item.net || 0) > 0);
  const minMax = useMemo(() => {
    const allValues = safeData.flatMap((item) => [Number(item.gross || 0), Number(item.net || 0)]);
    return {
      min: Math.min(...allValues, 0),
      max: Math.max(...allValues, 100)
    };
  }, [safeData]);

  if (!safeData.length || !hasVisibleData) {
    return (
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-12 text-center">
        <p className="text-[14px] font-bold text-zinc-700">{t("No sales data yet", "لا توجد بيانات مبيعات بعد")}</p>
        <p className="text-[12px] text-zinc-500 mt-2">{t("Your revenue chart will appear once orders are received in this date range.", "سيظهر مخطط الإيرادات بمجرد وصول الطلبات ضمن هذا النطاق الزمني.")}</p>
      </div>
    );
  }

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-xl bg-zinc-50 p-5 border border-zinc-200">
      <div className="absolute inset-0 grid grid-cols-12 gap-4 px-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="border-r border-white/20 opacity-50" />
        ))}
      </div>
      <div className="relative h-full w-full flex flex-col justify-end gap-4">
        {safeData.map((row, index) => (
          <div key={index} className="flex items-end gap-3">
            <div className="flex-1">
              <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
                <div className="h-full rounded-full bg-[#febd69]" style={{ width: `${((row.gross || 0) / (minMax.max || 1)) * 100}%` }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
                <div className="h-full rounded-full bg-[#2271b1]" style={{ width: `${((row.net || 0) / (minMax.max || 1)) * 100}%` }} />
              </div>
            </div>
            <span className="min-w-[72px] text-[11px] text-zinc-500">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

