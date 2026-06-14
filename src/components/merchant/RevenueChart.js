"use client";

import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function RevenueChart({ data = [], delta = "0%", days = 7, onRangeChange }) {
  const chartOptions = {
    chart: {
      type: 'area',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    colors: ['#febd69'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0,
        stops: [0, 90, 100]
      }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    grid: {
      borderColor: '#f1f1f1',
      strokeDashArray: 0,
    },
    xaxis: {
      categories: data.map(d => d.name),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#666', fontSize: '11px', fontWeight: 500 }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#666', fontSize: '11px', fontWeight: 500 },
        formatter: (val) => `JOD ${val}`
      }
    },
    tooltip: {
      theme: 'light',
      y: { formatter: (val) => `JOD ${val}` }
    }
  };

  const chartSeries = [{
    name: 'Revenue',
    data: data.map(d => d.revenue)
  }];

  return (
    <div className="bg-white p-6">
      <div className="flex items-center justify-between mb-8">
         <div className="space-y-1">
            <h4 className="text-[17px] font-bold text-zinc-900">Revenue Performance</h4>
            <p className="text-[12px] text-zinc-500">Analytics for the last {days} days</p>
         </div>
          <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-md border border-zinc-200">
             {[
               { label: "7D", value: 7 },
               { label: "15D", value: 15 },
               { label: "30D", value: 30 },
               { label: "90D", value: 90 },
             ].map((opt) => (
               <button
                 key={opt.value}
                 onClick={() => onRangeChange?.(opt.value)}
                 className={`px-3 py-1 text-[11px] font-bold rounded transition-all ${
                   days === opt.value 
                     ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" 
                     : "text-zinc-500 hover:text-zinc-700"
                 }`}
               >
                 {opt.label}
               </button>
             ))}
             <div className="h-4 w-[1px] bg-zinc-200 mx-1" />
             <input 
               type="number"
               placeholder="Days..."
               className="w-16 bg-transparent text-[11px] font-bold text-zinc-700 focus:outline-none px-1"
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   const val = parseInt(e.target.value);
                   if (val > 0 && val <= 365) onRangeChange?.(val);
                 }
               }}
             />
          </div>
      </div>
      <div className="h-[300px]">
        <Chart 
          options={chartOptions}
          series={chartSeries}
          type="area"
          height="100%"
        />
      </div>
    </div>
  );
}
