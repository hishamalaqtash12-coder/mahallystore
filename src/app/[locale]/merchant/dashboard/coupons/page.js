"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  Ticket,
  Plus,
  Search,
  Trash2,
  Edit,
  Tag,
  Calendar,
  Percent,
  RefreshCw,
  MoreVertical,
  Activity,
  TrendingUp
} from "lucide-react";
import Loader from "@/components/Loader";
import AddCouponForm from "@/components/merchant/AddCouponForm";

export default function CouponsPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (en, ar) => (isAr ? ar : en);
  const { user, wooId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchCoupons = async () => {
    if (!wooId) return;
    try {
      const res = await fetch(`/api/merchant/coupons?wooId=${wooId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCoupons(
          data.map((c) => ({
            id: c.id,
            code: c.code,
            type: c.discount_type === "percent" ? "percent" : "fixed",
            amount: parseFloat(c.amount),
            expiry: c.date_expires || "None",
            usage_count: parseInt(c.usage_count || 0, 10),
            usage_limit: parseInt(c.usage_limit || 0, 10),
            usage: `${c.usage_count || 0}/${c.usage_limit || "∞"}`,
            status: c.date_expires && new Date(c.date_expires) < new Date() ? "expired" : "active"
          }))
        );
      }
    } catch (e) {
      console.error("Failed to fetch coupons");
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [wooId]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const res = await fetch("/api/merchant/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, wooId })
      });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filteredCoupons = coupons.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()));

  const activeCount = coupons.filter((c) => c.status === "active").length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.usage_count, 0);
  const avgDiscount = coupons.length > 0 ? coupons.reduce((sum, c) => sum + c.amount, 0) / coupons.length : 0;
  const usageRate = coupons.length > 0 ? (coupons.filter((c) => c.usage_count > 0).length / coupons.length) * 100 : 0;

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Syncing coupons" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {showAddForm && (
        <AddCouponForm
          wooId={wooId}
          onClose={() => setShowAddForm(false)}
          onCouponAdded={() => {
            fetchCoupons();
            setShowAddForm(false);
          }}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">{t("Coupons Management", "إدارة الكوبونات")}</h1>
          <p className="text-[13px] text-zinc-500 font-medium">{t("Create and manage discount codes for your products", "أنشئ وأدر رموز الخصم لمنتجاتك")}</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="h-[38px] px-6 bg-zinc-900 text-white rounded-md text-[13px] font-bold hover:bg-zinc-800 transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={16} /> {t("Create Coupon", "إنشاء كوبون")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t("Total Active", "نشط إجمالياً"), value: activeCount.toString(), color: "bg-emerald-50 text-emerald-700", icon: Ticket },
          { label: t("Total Usage", "إجمالي الاستخدام"), value: totalUsage.toString(), color: "bg-blue-50 text-blue-700", icon: Activity },
          { label: t("Avg. Discount", "متوسط الخصم"), value: `${avgDiscount.toFixed(1)}${coupons[0]?.type === "percent" ? "%" : ""}`, color: "bg-amber-50 text-amber-700", icon: Percent },
          { label: t("Active Rate", "معدل النشاط"), value: `${usageRate.toFixed(0)}%`, color: "bg-purple-50 text-purple-700", icon: TrendingUp }
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-md border border-zinc-100 ${stat.color} flex items-center gap-4 shadow-sm hover:shadow-md transition-all`}>
            <div className="p-2 bg-white/50 rounded-lg"><stat.icon size={20} /></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-70">{stat.label}</p>
              <p className="text-[22px] font-bold tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-zinc-50/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder={t("Search codes...", "ابحث عن الأكواد...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-[36px] bg-white border border-zinc-300 rounded-md pe-9 ps-3 text-[13px] outline-none focus:border-[#be374f] transition-all w-64 shadow-sm"
              />
            </div>
            <select className="h-[36px] px-4 bg-white border border-zinc-300 rounded-md text-[13px] outline-none shadow-sm cursor-pointer">
              <option>{t("All Statuses", "جميع الحالات")}</option>
              <option>{t("Active", "نشط")}</option>
              <option>{t("Expired", "منتهي")}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-end">
            <thead>
              <tr className="bg-zinc-100/50 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">{t("Coupon Code", "رمز الكوبون")}</th>
                <th className="px-6 py-4">{t("Discount Type", "نوع الخصم")}</th>
                <th className="px-6 py-4">{t("Amount", "المبلغ")}</th>
                <th className="px-6 py-4">{t("Expiry Date", "تاريخ الانتهاء")}</th>
                <th className="px-6 py-4 text-center">{t("Usage", "الاستخدام")}</th>
                <th className="px-6 py-4 text-center">{t("Status", "الحالة")}</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCoupons.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-600">
                        <Ticket size={16} />
                      </div>
                      <span className="text-[14px] font-bold text-zinc-900 tracking-tight">{c.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[13px] text-zinc-600 font-medium capitalize">{c.type === "percent" ? t("Percentage", "النسبة المئوية") : t("Fixed Amount", "مبلغ ثابت")}</td>
                  <td className="px-6 py-5 text-[14px] font-bold text-zinc-900">{c.type === "percent" ? `${c.amount}%` : `JOD ${c.amount.toFixed(2)}`}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-[12px] text-zinc-400 font-medium">
                      <Calendar size={12} />
                      {new Date(c.expiry).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="space-y-1">
                      <div className="w-24 h-1.5 bg-zinc-100 rounded-full mx-auto overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.status === "expired" ? "bg-zinc-300" : "bg-[#be374f]"}`}
                          style={{ width: `${(c.usage_count / (c.usage_limit || 100)) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-400">{c.usage}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      c.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-rose-50 text-rose-700 border-rose-100"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-start">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
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
