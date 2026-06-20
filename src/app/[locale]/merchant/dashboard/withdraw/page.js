"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  RefreshCw, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight,
  Wallet,
  History,
  Info
} from "lucide-react";
import Loader from "@/components/Loader";

export default function WithdrawPage() {
  const { user, wooId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const [balance, setBalance] = useState(0);
  const [settings, setSettings] = useState({
    minLimit: 50,
    threshold: 0,
    methods: ["bank"],
    charges: {}
  });
  const [minWithdraw, setMinWithdraw] = useState(50);
  const [requesting, setRequesting] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");

  const fetchData = async () => {
    if (!wooId) return;
    try {
      // Fetch Withdrawals, Balance and Settings in one call
      const withdrawRes = await fetch(`/api/merchant/withdraw?vendorId=${wooId}`);
      const withdrawData = await withdrawRes.json();
      
      if (withdrawData.balance !== undefined) {
        setBalance(parseFloat(withdrawData.balance) || 0);
      }

      if (withdrawData.settings) {
        setSettings(withdrawData.settings);
        setMinWithdraw(parseFloat(withdrawData.settings.minLimit) || 50);
      }

      if (withdrawData.withdrawals) {
        setWithdrawals(withdrawData.withdrawals.map(w => ({
          id: w.id,
          amount: parseFloat(w.amount),
          method: w.method_title || w.method,
          status: w.status === 0 ? 'pending' : w.status === 1 ? 'completed' : 'cancelled',
          date: new Date(w.date).toLocaleDateString()
        })));
      }
    } catch (e) {
      console.error("Failed to sync with Dokan:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, wooId]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (parseFloat(amount) < minWithdraw) {
      alert(`Minimum withdrawal amount is JOD ${minWithdraw}`);
      return;
    }
    if (parseFloat(amount) > balance) {
      alert("Insufficient balance");
      return;
    }

    setRequesting(true);
    try {
      const res = await fetch("/api/merchant/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: wooId,
          amount: parseFloat(amount),
          method: method
        })
      });

      if (res.ok) {
        alert("Withdrawal request submitted successfully!");
        setAmount("");
        // Refresh data locally
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit request");
      }
    } catch (e) {
      alert("Network error. Please try again.");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return (
    <div className="h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Calculating balance" />
    </div>
  );

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Withdraw Earnings</h1>
          <p className="text-[13px] text-zinc-500 font-medium">Request and track your payouts from the marketplace</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-md">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[12px] font-bold text-emerald-700">Withdrawals processed in 3-5 days</span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex gap-4">
         <Info size={24} className="text-amber-600 shrink-0" />
         <div className="space-y-1">
            <h4 className="text-[14px] font-bold text-amber-900">COD Payment Logic (Active)</h4>
            <p className="text-[12px] text-amber-800 leading-relaxed">
               Since your store currently operates on <strong>Cash on Delivery (COD)</strong>, earnings from these orders are only added to your "Available Balance" once the order status is set to <strong>'Completed'</strong>. This ensures payouts only happen for funds you have already received.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="lg:col-span-1">
           <div className="bg-zinc-900 rounded-md p-8 text-white relative overflow-hidden shadow-xl h-full flex flex-col justify-between">
              <div className="relative z-10">
                 <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <Wallet size={16} />
                    <span className="text-[12px] font-bold uppercase tracking-widest">Available Balance</span>
                 </div>
                 <h2 className="text-[48px] font-bold tracking-tight mb-4">
                    <span className="text-[20px] font-medium mr-1 text-zinc-400">JOD</span>
                    {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                 </h2>
                 
                 <div className="space-y-3 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between text-[13px]">
                       <span className="text-zinc-500">Min. Withdrawal</span>
                       <span className="font-bold text-zinc-200">JOD {Number(settings.minLimit || 0).toFixed(2)}</span>
                    </div>
                    {settings.threshold > 0 && (
                       <div className="flex items-center justify-between text-[13px]">
                          <span className="text-zinc-500">Hold Period</span>
                          <span className="font-bold text-zinc-200">{settings.threshold} Days</span>
                       </div>
                    )}
                 </div>
              </div>
              <DollarSign className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5 rotate-12" />
           </div>
        </div>

        {/* Withdrawal Form */}
        <div className="lg:col-span-2">
           <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                 <h3 className="text-[16px] font-bold text-zinc-900">Request Payout</h3>
              </div>
              <form onSubmit={handleRequest} className="p-8 flex-1 flex flex-col justify-between gap-8">
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[13px] font-bold text-zinc-700">Amount to Withdraw</label>
                          <div className="relative group">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[14px] group-focus-within:text-[#be374f] transition-colors">JOD</span>
                             <input 
                               type="number" 
                               step="0.01"
                               value={amount}
                               onChange={(e) => setAmount(e.target.value)}
                               placeholder="0.00"
                               className="w-full h-[52px] pl-14 pr-4 bg-zinc-50 border border-zinc-200 rounded-md text-[18px] font-bold outline-none focus:border-[#be374f] focus:ring-4 focus:ring-[#be374f]/5 focus:bg-white transition-all shadow-inner"
                               required
                             />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[13px] font-bold text-zinc-700">Withdrawal Method</label>
                          <div className="flex gap-2">
                             {['bank', 'paypal'].map((m) => (
                               <button 
                                 key={m}
                                 type="button"
                                 onClick={() => setMethod(m)}
                                 className={`flex-1 flex items-center justify-center gap-2 h-[52px] border rounded-md transition-all ${method === m ? 'border-[#be374f] bg-brand-light text-[#be374f] font-bold shadow-sm ring-1 ring-[#be374f]' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}
                               >
                                  {m === 'bank' ? <DollarSign size={16} /> : <ArrowUpRight size={16} />}
                                  <span className="text-[13px] capitalize">{m}</span>
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    {amount && parseFloat(amount) > 0 && (
                       <div className="p-5 bg-brand-light rounded-md border border-brand/20 animate-in fade-in slide-in-from-top-1 duration-300">
                          <div className="flex justify-between items-center text-[13px] text-brand-dark mb-2">
                             <span className="font-medium">Processing Fee ({method})</span>
                             <span className="font-bold">
                                - JOD {(() => {
                                   const charge = settings.charges?.[method];
                                   if (!charge) return "0.00";
                                   const val = parseFloat(charge.amount);
                                   return (charge.type === 'percentage' ? (parseFloat(amount) * (val / 100)) : val).toFixed(2);
                                })()}
                             </span>
                          </div>
                          <div className="pt-2 border-t border-[#ffdfb3] flex justify-between items-center">
                             <span className="text-[14px] font-bold text-brand-dark">Estimated Receipt</span>
                             <span className="text-[18px] font-black text-brand-dark">
                                JOD {(() => {
                                   const charge = settings.charges?.[method];
                                   let total = parseFloat(amount);
                                   if (charge) {
                                      const val = parseFloat(charge.amount);
                                      total -= (charge.type === 'percentage' ? (total * (val / 100)) : val);
                                   }
                                   return Math.max(0, total).toFixed(2);
                                })()}
                             </span>
                          </div>
                       </div>
                    )}
                 </div>

                 <button 
                   type="submit"
                   disabled={requesting || !amount || parseFloat(amount) < minWithdraw}
                   className="w-full h-[52px] bg-brand hover:bg-brand-dark text-white border-brand rounded-md text-[16px] font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transform active:scale-[0.98]"
                 >
                    {requesting ? <Loader size="sm" text="" /> : <ArrowUpRight size={20} />}
                    Request Funds Now
                 </button>
              </form>
           </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
         <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="text-[16px] font-bold text-zinc-900 flex items-center gap-2">
               <History size={18} className="text-zinc-400" />
               Recent Transactions
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-zinc-100/50 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                     <th className="px-6 py-4">Transaction ID</th>
                     <th className="px-6 py-4">Amount</th>
                     <th className="px-6 py-4">Method</th>
                     <th className="px-6 py-4">Date Requested</th>
                     <th className="px-6 py-4 text-center">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-50">
                  {withdrawals.length > 0 ? withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-zinc-50 transition-colors group">
                       <td className="px-6 py-5 text-[13px] font-bold text-zinc-900">#WD-{w.id}</td>
                       <td className="px-6 py-5 text-[14px] font-black text-zinc-900">JOD {w.amount.toFixed(2)}</td>
                       <td className="px-6 py-5 text-[13px] text-zinc-600 font-medium capitalize">{w.method}</td>
                       <td className="px-6 py-5 text-[12px] text-zinc-400 font-medium">{w.date}</td>
                       <td className="px-6 py-5 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            w.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            w.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                             {w.status}
                          </span>
                       </td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan="5" className="px-6 py-20 text-center text-zinc-400 italic font-medium">No payout history found.</td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
