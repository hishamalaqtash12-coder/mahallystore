"use client";

import { useAuth } from "@/context/AuthContext";
import { ChevronRight, Wallet, History, Plus } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function AccountBalancePage() {
  const { loading } = useAuth();
  if (loading) return null;

  return (
    <div className="w-full">
      <div className="bg-white rounded-md border border-gray-100 p-8 mb-8 shadow-sm overflow-hidden relative">
        <div className="flex items-center justify-between mb-8 relative z-10">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center text-[#be374f] border border-gray-100">
                 <Wallet size={24} />
              </div>
              <div>
                 <p className="text-gray-500 text-[13px] font-medium uppercase tracking-wider">Available Balance</p>
                 <h2 className="text-3xl font-black text-gray-900">JOD 0.00</h2>
              </div>
           </div>
           <button className="px-10 py-3 bg-[#be374f] text-white rounded-md font-bold text-[14px] hover:bg-[#8f2d4a] transition-all shadow-md shadow-[#be374f]/10 active:scale-95">Top Up</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 border-t border-gray-50 relative z-10">
           <div className="p-5 bg-gray-50/50 rounded-md border border-gray-100">
              <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">Credit from returns</p>
              <p className="font-bold text-xl text-gray-900">JOD 0.00</p>
           </div>
           <div className="p-5 bg-gray-50/50 rounded-md border border-gray-100">
              <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">Promotional credit</p>
              <p className="font-bold text-xl text-gray-900">JOD 0.00</p>
           </div>
        </div>
        <div className="absolute -bottom-10 -start-10 opacity-5">
           <Wallet size={200} className="text-gray-900" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
          <button className="text-[13px] text-gray-500 font-bold flex items-center gap-1.5 hover:text-black transition-colors">
             <History size={16} />
             View all
          </button>
      </div>

      <div className="bg-white rounded-md border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
         <div className="w-16 h-16 bg-gray-50 rounded-md flex items-center justify-center mb-4 border border-gray-100">
            <History size={32} className="text-gray-200" />
         </div>
         <p className="text-gray-500 text-[14px] font-medium">No transactions found in the last 30 days.</p>
      </div>
    </div>
  );
}
