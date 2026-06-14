"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  Filter,
  DollarSign
} from "lucide-react";
import dynamic from "next/dynamic";
import * as XLSX from "xlsx";

import Loader from "@/components/Loader";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ReportsPage() {
  const { user, wooId } = useAuth();
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
        console.error("Failed to fetch reports");
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
    XLSX.writeFile(workbook, `Mahally_Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const chartOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
    },
    colors: ['#e77600', '#2271b1'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100]
      }
    },
    xaxis: {
      categories: chartData.map(d => d.day),
      labels: { style: { colors: '#a1a1aa', fontWeight: 600 } }
    },
    yaxis: {
      labels: { style: { colors: '#a1a1aa', fontWeight: 600 } }
    },
    grid: { borderColor: '#f1f1f1' },
    tooltip: { theme: 'light' }
  };

  const chartSeries = [
    {
      name: 'Gross Revenue',
      data: chartData.map(d => d.gross)
    }, 
    {
      name: 'Net Earnings',
      data: chartData.map(d => d.net)
    }
  ];

  if (loading) return (
    <div className="h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Analyzing sales data" />
    </div>
  );

  return (
    <div className="space-y-8 font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Sales & Analytics</h1>
          <p className="text-[13px] text-zinc-500 font-medium">Track your performance and revenue growth</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-white border border-zinc-200 p-1 rounded-lg shadow-sm">
              <button 
                onClick={() => setTimeframe("7days")}
                className={`px-4 py-1.5 text-[12px] font-bold rounded-md transition-all ${timeframe === '7days' ? 'bg-[#febd69] text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                7 Days
              </button>
              <button 
                onClick={() => setTimeframe("30days")}
                className={`px-4 py-1.5 text-[12px] font-bold rounded-md transition-all ${timeframe === '30days' ? 'bg-[#febd69] text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                30 Days
              </button>
           </div>
           <button 
             onClick={handleExport}
             className="h-[36px] px-4 bg-zinc-900 text-white rounded-md text-[12px] font-bold hover:bg-zinc-800 transition-all shadow-md flex items-center gap-2"
           >
             <Download size={14} /> Export CSV
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { label: "Gross Revenue", value: `JOD ${summary.totalGross}`, delta: "+0.0%", isUp: true, icon: DollarSign },
           { label: "Net Earnings", value: `JOD ${summary.totalNet}`, delta: "+0.0%", isUp: true, icon: TrendingUp },
           { label: "Total Orders", value: summary.orderCount.toString(), delta: "+0.0%", isUp: true, icon: ShoppingCart },
           { label: "Avg. Order Value", value: `JOD ${summary.avgOrderValue}`, delta: "+0.0%", isUp: true, icon: BarChart3 },
         ].map((stat, i) => (
           <div key={i} className="bg-white border border-zinc-200 p-5 rounded-md hover:shadow-md transition-all group relative shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</span>
                <div className="p-2 bg-zinc-50 rounded-lg text-zinc-400 group-hover:text-[#e77600] group-hover:bg-orange-50 transition-colors">
                   <stat.icon size={18} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-[26px] font-bold text-zinc-900 tracking-tight">{stat.value}</h3>
                <div className={`flex items-center gap-0.5 text-[12px] font-bold ${stat.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
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
               <h4 className="text-[16px] font-bold text-zinc-900">Revenue Breakdown</h4>
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-[#e77600]" />
                     <span className="text-[12px] text-zinc-500 font-medium">Gross Sales</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-[#2271b1]" />
                     <span className="text-[12px] text-zinc-500 font-medium">Net Earnings</span>
                  </div>
               </div>
            </div>
            <Chart options={chartOptions} series={chartSeries} type="area" height={350} />
         </div>

         <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-zinc-200 p-6 rounded-md shadow-sm">
               <h4 className="text-[16px] font-bold text-zinc-900 mb-6">Top Selling Products</h4>
               <div className="space-y-4">
                  {topProducts.length > 0 ? topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100 group">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#f3f3f3] flex items-center justify-center text-[11px] font-bold text-zinc-500 group-hover:bg-[#e77600] group-hover:text-white transition-colors">#{i+1}</div>
                          <div className="min-w-0">
                             <p className="text-[13px] font-bold text-zinc-900 truncate">{p.name}</p>
                             <p className="text-[11px] text-zinc-400 font-medium">{p.sales} units sold</p>
                          </div>
                       </div>
                       <p className="text-[13px] font-bold text-zinc-900">JOD {p.revenue.toFixed(2)}</p>
                    </div>
                  )) : (
                    <p className="text-[13px] text-zinc-400 italic py-4 text-center">No sales data yet</p>
                  )}
               </div>
               <button className="w-full mt-6 h-[36px] bg-[#f7f8fa] hover:bg-zinc-100 border border-zinc-200 rounded-md text-[12px] font-bold text-zinc-700 transition-all">
                  View Inventory Report
               </button>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-md shadow-sm text-white relative overflow-hidden">
               <div className="relative z-10">
                  <h4 className="text-[15px] font-bold mb-2">Commission Summary</h4>
                  <p className="text-[12px] text-zinc-400 leading-relaxed mb-4">
                     Your current platform fee is <span className="text-white font-bold">10%</span> based on your <span className="text-[#febd69] font-bold">Silver Plan</span>.
                  </p>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-[#febd69] w-[75%]" />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2">75% of monthly target reached</p>
               </div>
               <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 -rotate-12" />
            </div>
         </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
         <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h4 className="text-[16px] font-bold text-zinc-900">Recent Transactions Report</h4>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-zinc-100/50 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                     <th className="px-6 py-4">Order ID</th>
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">Customer</th>
                     <th className="px-6 py-4">Gross Revenue</th>
                     <th className="px-6 py-4">Net Earnings</th>
                     <th className="px-6 py-4 text-center">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-100">
                  {reportData.slice(0, 10).map((row, i) => (
                    <tr key={i} className="hover:bg-zinc-50 transition-colors group">
                       <td className="px-6 py-4 text-[13px] font-bold text-[#007185] group-hover:text-[#c45500] transition-colors">{row["Order ID"]}</td>
                       <td className="px-6 py-4 text-[12px] text-zinc-400 font-medium">{row["Date"]}</td>
                       <td className="px-6 py-4 text-[13px] font-bold text-zinc-900">{row["Customer"]}</td>
                       <td className="px-6 py-4 text-[13px] font-bold text-zinc-900">JOD {row["Gross Revenue (JOD)"]}</td>
                       <td className="px-6 py-4 text-[13px] font-bold text-emerald-600">JOD {row["Net Earnings (JOD)"]}</td>
                       <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            row["Status"] === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
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
