"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  DollarSign,
  ArrowUpRight,
  Wallet,
  History,
  Info
} from "lucide-react";
import Loader from "@/components/Loader";

export default function WithdrawPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (en, ar) => (isAr ? ar : en);
  const { wooId } = useAuth();
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
        setWithdrawals(
          withdrawData.withdrawals.map((w) => ({
            id: w.id,
            amount: parseFloat(w.amount),
            method: w.method_title || w.method,
            status: w.status === 0 ? "pending" : w.status === 1 ? "completed" : "cancelled",
            date: new Date(w.date).toLocaleDateString()
          }))
        );
      }
    } catch (e) {
      console.error("Failed to sync with Dokan:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [wooId]);

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

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader size="lg" text={t("Calculating balance", "جارٍ حساب الرصيد")} />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">{t("Withdraw Earnings", "سحب الأرباح")}</h1>
          <p className="text-[13px] text-zinc-500 font-medium">{t("Request and track your payouts from the marketplace", "اطلب وتتبع أرباحك من السوق")}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-md">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[12px] font-bold text-emerald-700">{t("Withdrawals processed in 3-5 days", "تجري معالجة عمليات السحب خلال 3-5 أيام")}</span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex gap-4">
        <Info size={24} className="text-amber-600 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-[14px] font-bold text-amber-900">{t("COD Payment Logic (Active)", "منطق الدفع عند الاستلام (نشط)")}</h4>
          <p className="text-[12px] text-amber-800 leading-relaxed">
            {t("Since your store currently operates on ", "بما أن متجرك يعمل حاليًا على ")}<strong>{t("Cash on Delivery (COD)", "الدفع عند الاستلام")}</strong>{t(", earnings from these orders are only added to your \"Available Balance\" once the order status is set to ", ", يتم إضافة أرباح هذه الطلبات إلى \"الرصيد المتاح\" فقط عندما يتم تعيين حالة الطلب على ")}<strong>{t("'Completed'", "'مكتمل'")}</strong>. {t("This ensures payouts only happen for funds you have already received.", "وهذا يضمن أن يتم الدفع فقط للأموال التي استلمتها بالفعل.")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 rounded-md p-8 text-white relative overflow-hidden shadow-xl h-full flex flex-col justify-between">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Wallet size={16} />
                <span className="text-[12px] font-bold uppercase tracking-widest">{t("Available Balance", "الرصيد المتاح")}</span>
              </div>
              <h2 className="text-[48px] font-bold tracking-tight mb-4">
                <span className="text-[20px] font-medium ms-1 text-zinc-400">JOD</span>
                {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <div className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-zinc-500">{t("Min. Withdrawal", "الحد الأدنى للسحب")}</span>
                  <span className="font-bold text-zinc-200">JOD {Number(settings.minLimit || 0).toFixed(2)}</span>
                </div>
                {settings.threshold > 0 && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-zinc-500">{t("Hold Period", "فترة التعليق")}</span>
                    <span className="font-bold text-zinc-200">{settings.threshold} {t("Days", "أيام")}</span>
                  </div>
                )}
              </div>
            </div>
            <DollarSign className="absolute -start-6 -bottom-6 w-40 h-40 text-white/5 rotate-12" />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="text-[16px] font-bold text-zinc-900">{t("Request Payout", "طلب سحب")}</h3>
            </div>
            <form onSubmit={handleRequest} className="p-8 flex-1 flex flex-col justify-between gap-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-zinc-700">{t("Amount to Withdraw", "المبلغ المراد سحبه")}</label>
                    <div className="relative group">
                      <span className="absolute end-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[14px] group-focus-within:text-[#be374f] transition-colors">JOD</span>
                      <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-[52px] pe-14 ps-4 bg-zinc-50 border border-zinc-200 rounded-md text-[18px] font-bold outline-none focus:border-[#be374f] focus:ring-4 focus:ring-[#be374f]/5 focus:bg-white transition-all shadow-inner"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-zinc-700">{t("Withdrawal Method", "طريقة السحب")}</label>
                    <div className="flex gap-2">
                      {['bank', 'paypal'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMethod(m)}
                          className={`flex-1 flex items-center justify-center gap-2 h-[52px] border rounded-md transition-all ${
                            method === m
                              ? 'border-[#be374f] bg-brand-light text-[#be374f] font-bold shadow-sm ring-1 ring-[#be374f]'
                              : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                          }`}
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
                      <span className="font-medium">{t("Processing Fee", "رسوم المعالجة")} ({method})</span>
                      <span className="font-bold">
                        - JOD {(() => {
                          const charge = settings.charges?.[method];
                          if (!charge) return "0.00";
                          const val = parseFloat(charge.amount);
                          return (charge.type === 'percentage' ? (parseFloat(amount) * (val / 100)) : val).toFixed(2);
                        })()}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#ffdfd1] text-[13px] text-zinc-700">
                      {t("Estimated payout after fees.", "المبلغ المتوقع بعد الرسوم.")}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={requesting || !amount || parseFloat(amount) < minWithdraw || parseFloat(amount) > balance}
                className="w-full h-[52px] bg-brand text-white rounded-md hover:bg-brand/90 transition-all font-bold"
              >
                {requesting ? <Loader size="sm" text="" /> : t("Request Funds Now", "طلب الأموال الآن")}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h4 className="text-[16px] font-bold text-zinc-900">{t("Recent Withdrawals", "السحوبات الأخيرة")}</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-end">
            <thead>
              <tr className="bg-zinc-100/50 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">{t("Request", "الطلب")}</th>
                <th className="px-6 py-4">{t("Amount", "المبلغ")}</th>
                <th className="px-6 py-4">{t("Method", "الطريقة")}</th>
                <th className="px-6 py-4">{t("Date", "التاريخ")}</th>
                <th className="px-6 py-4 text-center">{t("Status", "الحالة")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {withdrawals.length > 0 ? (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-6 py-5 text-[13px] font-bold text-zinc-900">#{w.id}</td>
                    <td className="px-6 py-5 text-[13px] font-bold text-zinc-900">JOD {w.amount.toFixed(2)}</td>
                    <td className="px-6 py-5 text-[13px] text-zinc-600">{w.method}</td>
                    <td className="px-6 py-5 text-[13px] text-zinc-600">{w.date}</td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        w.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : w.status === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-zinc-400 italic">{t("No withdrawal history available.", "لا توجد سجلات سحب متاحة.")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
