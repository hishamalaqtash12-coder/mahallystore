"use client";

import { useRouter } from "@/i18n/routing";
import { useEffect, useState } from "react";
import RevenueChart from "@/components/merchant/RevenueChart";
import OnboardingWizard from "@/components/merchant/OnboardingWizard";
import { useAuth } from "@/context/AuthContext";
import {
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Star,
  Search,
  History,
  RefreshCw,
  Trash2,
  AlertTriangle
} from "lucide-react";
import Image from "next/image";
import * as XLSX from "xlsx";
import Loader from "@/components/Loader";

export default function MerchantDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [chartDays, setChartDays] = useState(7);
  const { user, isApprovedVendor, loading: authLoading, wooId, backendError } = useAuth();

  const fetchData = (days = chartDays) => {
    if (!wooId) return;

    fetch(`/api/merchant/stats?wooId=${wooId}&days=${days}&t=${Date.now()}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  };

  const handleExportReport = () => {
    if (!data) return;
    setDownloading(true);
    try {
      const workbook = XLSX.utils.book_new();

      // 1. Executive Summary Sheet
      const statsData = [
        { "Metric Category": "Financials", "Metric Name": "Total Revenue", Value: `JOD ${data.stats.totalRevenue}`, Description: "Total gross earnings from completed orders" },
        { "Metric Category": "Financials", "Metric Name": "Avg Order Value", Value: `JOD ${data.stats.avgOrderValue}`, Description: "Average amount per sale" },
        { "Metric Category": "Operations", "Metric Name": "Total Sales", Value: data.stats.totalSales, Description: "Total count of completed transactions" },
        { "Metric Category": "Operations", "Metric Name": "Active Orders", Value: data.stats.activeOrders, Description: "Orders currently processing or on-hold" },
        { "Metric Category": "Inventory", "Metric Name": "Total Products", Value: data.stats.totalProducts, Description: "Total listings in your store" },
        { "Metric Category": "Customer Satisfaction", "Metric Name": "Average Rating", Value: data.stats.averageRating, Description: "Average star rating from reviews" },
      ];
      const statsSheet = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, "Executive Summary");

      // 2. Detailed Transactions Sheet
      if (data.recentOrders && data.recentOrders.length > 0) {
        const ordersData = data.recentOrders.map(order => ({
          "Order ID": `#${order.id}`,
          "Date": new Date(order.date_created).toLocaleString(),
          "Customer Name": `${order.billing?.first_name} ${order.billing?.last_name}`,
          "Customer Email": order.billing?.email,
          "Payment Method": order.payment_method_title || "N/A",
          "Items Count": order.line_items?.length || 0,
          "Total Amount (JOD)": parseFloat(order.total),
          "Shipping (JOD)": parseFloat(order.shipping_total || 0),
          "Order Status": order.status.toUpperCase(),
          "Products": order.line_items?.map(item => `${item.name} (x${item.quantity})`).join(", ")
        }));
        const ordersSheet = XLSX.utils.json_to_sheet(ordersData);
        XLSX.utils.book_append_sheet(workbook, ordersSheet, "Detailed Transactions");
      }

      // 3. Customer Reviews Sheet
      if (data.recentReviews && data.recentReviews.length > 0) {
        const reviewsData = data.recentReviews.map(review => ({
          "Reviewer": review.reviewer,
          "Date": new Date(review.date_created).toLocaleString(),
          "Product": review.product_name,
          "Rating": `${review.rating} Stars`,
          "Feedback Text": review.review.replace(/<[^>]*>?/gm, '')
        }));
        const reviewsSheet = XLSX.utils.json_to_sheet(reviewsData);
        XLSX.utils.book_append_sheet(workbook, reviewsSheet, "Customer Reviews");
      }

      // 4. Daily Performance Sheet (from Chart Data)
      if (data.chartData && data.chartData.length > 0) {
        const performanceData = data.chartData.map(day => ({
          "Day": day.name,
          "Date": day.date,
          "Revenue (JOD)": day.revenue
        }));
        const perfSheet = XLSX.utils.json_to_sheet(performanceData);
        XLSX.utils.book_append_sheet(workbook, perfSheet, "7-Day Performance");
      }

      XLSX.writeFile(workbook, `Mahally_Merchant_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Export failed", err);
      alert("Export failed: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    // If there's a backend error, don't redirect yet, let the UI handle it
    if (backendError) return;

    if (!user || !isApprovedVendor) {
      router.replace("/account");
      return;
    }

    fetchData();

    // Listen for global refresh event from Header
    const handleRefresh = () => {
      setLoading(true);
      fetchData(chartDays);
    };
    window.addEventListener('refresh-dashboard', handleRefresh);
    return () => window.removeEventListener('refresh-dashboard', handleRefresh);
  }, [user, authLoading, chartDays]);

  // Remove redundant backendError declaration

  if (loading || !data || authLoading) {
    if (backendError) {
      return (
        <div className="h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white border border-zinc-200 rounded-md shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Sync Connection Error</h2>
          <p className="text-zinc-500 mb-6 max-w-sm">{backendError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="h-10 px-8 bg-brand hover:bg-brand-dark text-white rounded-md font-bold transition-all shadow-md"
          >
            Retry Sync
          </button>
        </div>
      );
    }
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Syncing Marketplace Data" />
      </div>
    );
  }

  const stats = [
    { title: "Total Revenue (Completed)", value: `JOD ${data.stats.totalRevenue}`, icon: TrendingUp, delta: data.stats.revenueDelta, isUp: !data.stats.revenueDelta.startsWith('-'), tooltip: "Only includes earnings from delivered orders" },
    { title: "Active Orders", value: data.stats.activeOrders, icon: ShoppingCart, delta: data.stats.ordersDelta, isUp: data.stats.ordersDelta.startsWith('+'), tooltip: "Orders currently processing or on-hold (excludes canceled)" },
    { title: "Total Products", value: data.stats.totalProducts, icon: Package, delta: "0%", isUp: true },
    { title: "Average Rating", value: data.stats.averageRating, icon: Star, delta: data.stats.ratingDelta, isUp: data.stats.ratingDelta.startsWith('+') },
  ];

  const filteredOrders = (data.recentOrders || []).filter(order => {
    const query = orderSearch.toLowerCase();
    return (
      order.id.toString().includes(query) ||
      (order.billing?.first_name?.toLowerCase() + " " + order.billing?.last_name?.toLowerCase()).includes(query)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Dashboard Overview</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[12px] text-zinc-500 font-medium">Real-time stats synced with WordPress</p>
          </div>
        </div>
      </div>

      {data.stats.isRestricted && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-4 items-start shadow-sm">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-800 font-bold text-sm">Store Restricted from Public View</h3>
            <p className="text-amber-700 text-xs mt-1">Your store is currently hidden from the homepage and main browsing areas by the administrator. Customers can still access your products via direct links.</p>
            {data.stats.restrictionReason && (
              <div className="mt-2 bg-white/60 p-2 rounded text-xs text-amber-900 border border-amber-200/50">
                <span className="font-bold">Reason:</span> {data.stats.restrictionReason}
              </div>
            )}
            <button className="mt-3 bg-amber-500 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-sm hover:bg-amber-600 transition-colors">
              Contact Support to Resolve
            </button>
          </div>
        </div>
      )}

      <OnboardingWizard stats={data.stats} user={user} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white border border-zinc-200 p-5 rounded-md hover:shadow-md transition-all group relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">{stat.title}</span>
                  <stat.icon size={18} className="text-zinc-300 group-hover:text-[#be374f] transition-colors" />
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-[28px] font-bold text-zinc-900 tracking-tight">{stat.value}</h3>
                  <span className={`text-[12px] font-bold ${stat.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stat.delta}
                  </span>
                </div>
                {stat.tooltip && (
                  <div className="absolute top-2 start-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-zinc-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-xl">
                      {stat.tooltip}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Chart */}
            <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-[8px] shadow-sm overflow-hidden">
              <RevenueChart
                data={data.chartData}
                days={chartDays}
                onRangeChange={(val) => {
                  setChartDays(val);
                  setLoading(true);
                  fetchData(val);
                }}
              />
            </div>

            {/* Recent Reviews */}
            <div className="lg:col-span-4 bg-white border border-zinc-200 p-6 rounded-md shadow-sm flex flex-col">
              <h4 className="text-[16px] font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <Star size={18} className="text-amber-400 fill-amber-400" />
                Recent Customer Feedback
              </h4>

              <div className="space-y-5 flex-1">
                {data.recentReviews.length > 0 ? data.recentReviews.map((review, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                    <div className="w-9 h-9 rounded-full bg-[#f3f3f3] flex items-center justify-center text-zinc-600 text-[12px] font-bold shrink-0 border border-zinc-200">
                      {review.reviewer[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[13px] font-bold text-zinc-900 truncate">{review.reviewer}</p>
                        <span className="text-[10px] text-zinc-400">{review.date_created ? new Date(review.date_created).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mb-1">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} size={10} className={j < review.rating ? 'fill-[#FFA41C] text-[#FFA41C]' : 'text-zinc-200'} />
                        ))}
                      </div>
                      <p className="text-[12px] text-zinc-900 font-bold mb-1 line-clamp-1 italic text-zinc-500">
                        Ref: {review.product_name}
                      </p>
                      <p className="text-[12px] text-zinc-600 line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: review.review }} />
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-10 opacity-40">
                    <Search size={32} className="mb-2" />
                    <p className="text-[13px] font-medium">No reviews found</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => router.push("/merchant/dashboard/reviews")}
                className="w-full mt-6 h-[36px] bg-[#f7f8fa] hover:bg-zinc-100 border border-zinc-300 rounded-md text-[13px] font-bold text-zinc-700 transition-all shadow-sm"
              >
                Manage All Feedback
              </button>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-zinc-50/50">
              <h4 className="text-[16px] font-bold text-zinc-900">Recent Transactions</h4>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input
                    type="text"
                    placeholder="Filter orders..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="h-[34px] bg-white border border-zinc-300 rounded-md pe-9 ps-3 text-[13px] outline-none focus:border-[#be374f] transition-all w-64 shadow-sm"
                  />
                </div>
                <button
                  onClick={handleExportReport}
                  disabled={downloading}
                  className="h-[34px] px-4 bg-zinc-900 text-white rounded-md text-[12px] font-bold hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {downloading ? <RefreshCw size={14} className="animate-spin" /> : null}
                  Export Report
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-end">
                <thead className="bg-zinc-100/50 border-b border-zinc-200">
                  <tr className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Buyer</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-bold text-[#be374f] group-hover:text-[#8f2d4a]">#ORD-{order.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[13px] font-bold text-zinc-900">{order.billing.first_name} {order.billing.last_name}</p>
                        <p className="text-[11px] text-zinc-400 font-medium">{order.billing.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[13px] font-bold text-zinc-900 tracking-tight">JOD {parseFloat(order.total).toFixed(2)}</p>
                        <p className="text-[11px] text-zinc-400">{order.line_items.length} items</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${order.status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              'bg-zinc-50 text-zinc-500 border-zinc-200'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center text-[14px] text-zinc-400 italic">
                        No matching transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
    </div>
  );
}
