"use client";

import { useState, useEffect } from "react";
import RevenueChart from "@/components/merchant/RevenueChart";
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  BarChart3, 
  Calendar,
  Download,
  Loader2
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import * as XLSX from 'xlsx';

import Loader from "@/components/Loader";

export default function MerchantRevenue() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const email = user.email || "";
    const phone = user.phoneNumber || "";
    fetch(`/api/merchant/stats?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [user]);

  const handleDownload = async () => {
    if (!user) return;
    setDownloading(true);
    try {
      const email = user.email || "";
      const phone = user.phoneNumber || "";
      const res = await fetch(`/api/merchant/reports/revenue?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
      const d = await res.json();
      
      if (d.report && d.report.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(d.report);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Revenue Report");
        
        // Adjust column widths for better "design"
        const wscols = [
          {wch: 10}, // ID
          {wch: 12}, // Date
          {wch: 20}, // Customer
          {wch: 40}, // Items
          {wch: 18}, // Gross
          {wch: 18}, // Net
          {wch: 12}, // Status
          {wch: 20}, // Payment
        ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `Mahally_Revenue_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        alert("No data available for the report.");
      }
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Analyzing financial data" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Payments & Revenue</h1>
          <p className="text-[13px] text-zinc-500 font-medium">Monitor your store's financial performance and net earnings</p>
        </div>
        <div className="flex gap-3">
          <button className="h-[36px] px-4 bg-white border border-zinc-300 rounded-md text-[12px] font-bold text-zinc-700 hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm">
            <Calendar size={14} className="text-zinc-400" /> 
            {new Date().toLocaleString('default', { month: 'short' })} 1 - {new Date().toLocaleString('default', { month: 'short' })} {new Date().getDate()}
          </button>
          <button 
            onClick={handleDownload}
            disabled={downloading}
            className="h-[36px] px-6 bg-zinc-900 text-white rounded-md text-[12px] font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {downloading ? "Preparing..." : "Export Financial Report"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Gross Revenue", value: `JOD ${data.stats.totalRevenue}`, delta: data.stats.revenueDelta },
          { label: "Net Earnings", value: `JOD ${(parseFloat(data.stats.totalRevenue) * 0.9).toFixed(2)}`, delta: data.stats.revenueDelta },
          { label: "Avg. Order Value", value: `JOD ${data.stats.avgOrderValue}`, delta: data.stats.ordersDelta },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 border border-zinc-200 rounded-md shadow-sm group hover:border-[#febd69] transition-all">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</span>
               <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${stat.delta.startsWith('+') ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                 {stat.delta}
               </span>
            </div>
            <h3 className="text-[32px] font-bold text-zinc-900 tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden p-6">
         <RevenueChart data={data.chartData} delta={data.stats.revenueDelta} />
      </div>
    </div>
  );
}
