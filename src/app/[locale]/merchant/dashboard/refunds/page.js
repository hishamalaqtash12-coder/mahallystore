"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  RotateCcw,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Info
} from "lucide-react";
import Loader from "@/components/Loader";

export default function RefundsPage() {
  const { user, wooId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        const res = await fetch(`/api/merchant/refunds?wooId=${wooId}`);
        const data = await res.json();
        setRefunds(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to fetch refunds");
      } finally {
        setLoading(false);
      }
    };

    if (wooId) fetchRefunds();
    else setLoading(false);
  }, [wooId]);

  if (loading) return (
    <div className="h-[400px] flex items-center justify-center">
      <Loader size="lg" text="Loading refund requests" />
    </div>
  );

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Refund Requests</h1>
          <p className="text-[13px] text-zinc-500 font-medium">Manage and process customer refund requests for your orders</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder="Search order ID or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-[36px] bg-white border border-zinc-300 rounded-md pe-9 ps-3 text-[13px] outline-none focus:border-[#be374f] transition-all w-64 shadow-sm"
              />
            </div>
            <select className="h-[36px] px-4 bg-white border border-zinc-300 rounded-md text-[13px] outline-none shadow-sm cursor-pointer">
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Completed</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-end">
            <thead>
              <tr className="bg-zinc-100/50 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">Request Details</th>
                <th className="px-6 py-4 text-center">Amount</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-start">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {refunds.length > 0 ? (
                refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-zinc-100 flex items-center justify-center text-zinc-500">
                          <RotateCcw size={18} />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-zinc-900">#RF-{r.id}</p>
                          <p className="text-[12px] text-[#be374f] font-medium group-hover:text-[#8f2d4a]">Order #{r.order_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center text-[14px] font-bold text-zinc-900">
                      JOD {r.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-5 text-[13px] text-zinc-600 max-w-[300px] truncate font-medium">
                      {r.reason}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${r.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          r.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-start">
                      <button className="text-[13px] text-[#be374f] font-bold hover:underline">View Details</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-zinc-400 italic">No refund requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-md p-6 flex gap-4 shadow-sm">
        <div className="p-2 bg-white rounded-lg self-start">
          <Info className="text-amber-600" size={18} />
        </div>
        <div className="space-y-1">
          <h4 className="text-[14px] font-bold text-amber-900">Refund Policy</h4>
          <p className="text-[13px] text-amber-700 leading-relaxed">
            Vendors are responsible for reviewing refund requests within 48 hours. Please ensure you communicate with the customer through the messaging system before finalizing a refund.
          </p>
        </div>
      </div>
    </div>
  );
}
