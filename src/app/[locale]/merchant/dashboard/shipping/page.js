"use client";

import { useAuth } from "@/context/AuthContext";
import { JORDAN_GOVERNORATES, DEFAULT_SHIPPING_DATA } from "@/lib/constants";
import { useEffect, useState } from "react";
import { Truck, Save, Info, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function MerchantShippingPage() {
  const { user, wooId } = useAuth();
  const [shippingData, setShippingData] = useState(DEFAULT_SHIPPING_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (wooId) {
      fetch(`/api/merchant/shipping?vendorId=${wooId}`)
        .then(r => r.json())
        .then(data => {
          if (data.shippingData && Object.keys(data.shippingData).length > 0) {
            setShippingData(data.shippingData);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [wooId]);

  const handleUpdate = (gov, field, value) => {
    setShippingData(prev => ({
      ...prev,
      [gov]: { ...prev[gov], [field]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/merchant/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: wooId, shippingData })
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      alert("Failed to save shipping settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-brand" />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Shipping Settings</h1>
          <p className="text-zinc-500 text-sm">Configure delivery fees for each Jordan governorate.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand hover:bg-brand-dark border-brand px-6 py-2 rounded-md font-bold text-sm shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {success ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3 mb-8">
        <Info size={18} className="text-blue-500 mt-0.5" />
        <p className="text-[13px] text-blue-700 leading-relaxed">
          Set a flat delivery fee for each governorate. If you want to offer free shipping above a certain order amount (e.g., Free delivery over 20 JOD), enter the amount in the "Free Over" column. Leave it blank if you don't offer free shipping.
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-end border-collapse">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 text-[13px] font-bold text-zinc-600 uppercase">Governorate</th>
              <th className="px-6 py-4 text-[13px] font-bold text-zinc-600 uppercase">Delivery Fee (JOD)</th>
              <th className="px-6 py-4 text-[13px] font-bold text-zinc-600 uppercase">Free Over (JOD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {JORDAN_GOVERNORATES.map(gov => (
              <tr key={gov} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-zinc-400" />
                    <span className="font-medium text-zinc-900">{gov}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="relative w-32">
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">JOD</span>
                    <input
                      type="number"
                      step="0.5"
                      value={shippingData[gov]?.fee || 0}
                      onChange={e => handleUpdate(gov, "fee", parseFloat(e.target.value) || 0)}
                      className="w-full pe-12 ps-3 py-2 border border-zinc-200 rounded-md text-sm focus:border-brand outline-none transition-all"
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="relative w-32">
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">JOD</span>
                    <input
                      type="number"
                      step="1"
                      placeholder="Optional"
                      value={shippingData[gov]?.free_over || ""}
                      onChange={e => handleUpdate(gov, "free_over", e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full pe-12 ps-3 py-2 border border-zinc-200 rounded-md text-sm focus:border-brand outline-none transition-all"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {success && (
        <div className="fixed bottom-8 start-8 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={20} />
          <span className="font-medium">Shipping settings updated successfully!</span>
        </div>
      )}
    </div>
  );
}
