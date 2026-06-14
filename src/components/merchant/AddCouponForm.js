"use client";

import { useState } from "react";
import { X, Save, Percent, DollarSign, Calendar, Info, Loader2 } from "lucide-react";
import Loader from "@/components/Loader";

export default function AddCouponForm({ wooId, onClose, onCouponAdded }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    amount: "",
    discount_type: "percent",
    description: "",
    date_expires: "",
    usage_limit: "",
    individual_use: true,
    product_ids: []
  });
  const [products, setProducts] = useState([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);

  useState(() => {
    // Fetch merchant products for selection
    setFetchingProducts(true);
    fetch(`/api/merchant/products?wooId=${wooId}`)
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setFetchingProducts(false));
  }, [wooId]);

  const toggleProduct = (id) => {
    setFormData(prev => {
      const exists = prev.product_ids.includes(id);
      return {
        ...prev,
        product_ids: exists 
          ? prev.product_ids.filter(pid => pid !== id)
          : [...prev.product_ids, id]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/merchant/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, wooId })
      });

      if (res.ok) {
        const newCoupon = await res.json();
        onCouponAdded(newCoupon);
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create coupon");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[600px] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-[#e77600]/10 rounded-lg text-[#e77600]">
                 <Percent size={20} />
              </div>
              <h2 className="text-[18px] font-bold text-zinc-900">Create New Coupon</h2>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
              <X size={20} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[13px] font-bold text-zinc-700">Coupon Code</label>
                 <input 
                   type="text" 
                   value={formData.code}
                   onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                   placeholder="E.G. SUMMER2026"
                   className="w-full h-[42px] px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] font-bold uppercase outline-none focus:border-[#e77600] focus:bg-white transition-all shadow-inner"
                   required
                 />
                 <p className="text-[11px] text-zinc-400">Customers enter this code at checkout.</p>
              </div>

              <div className="space-y-2">
                 <label className="text-[13px] font-bold text-zinc-700">Discount Type</label>
                 <select 
                   value={formData.discount_type}
                   onChange={e => setFormData({...formData, discount_type: e.target.value})}
                   className="w-full h-[42px] px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] outline-none focus:border-[#e77600] focus:bg-white transition-all shadow-sm"
                 >
                    <option value="percent">Percentage Discount (%)</option>
                    <option value="fixed_cart">Fixed Amount Discount (JOD)</option>
                 </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[13px] font-bold text-zinc-700">Coupon Amount</label>
                 <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                       {formData.discount_type === 'percent' ? '%' : 'JOD'}
                    </span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                      className="w-full h-[42px] pl-12 pr-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] font-bold outline-none focus:border-[#e77600] focus:bg-white transition-all shadow-inner"
                      required
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[13px] font-bold text-zinc-700">Expiry Date</label>
                 <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input 
                      type="date" 
                      value={formData.date_expires}
                      onChange={e => setFormData({...formData, date_expires: e.target.value})}
                      className="w-full h-[42px] pl-12 pr-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] outline-none focus:border-[#e77600] focus:bg-white transition-all shadow-inner"
                    />
                 </div>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[13px] font-bold text-zinc-700">Description (Optional)</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="What is this coupon for?"
                className="w-full h-[80px] p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] outline-none focus:border-[#e77600] focus:bg-white transition-all shadow-inner resize-none"
              />
           </div>

            <div className="flex items-center gap-6 pt-2">
               <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="individual"
                    checked={formData.individual_use}
                    onChange={e => setFormData({...formData, individual_use: e.target.checked})}
                    className="w-4 h-4 accent-[#e77600]"
                  />
                  <label htmlFor="individual" className="text-[13px] font-medium text-zinc-600">Individual use only</label>
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-[13px] font-bold text-zinc-700">Restrict to Products (Optional)</label>
               <div className="max-h-[150px] overflow-y-auto border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 space-y-2">
                  {fetchingProducts ? (
                     <div className="flex items-center justify-center py-4"><Loader2 size={16} className="animate-spin text-zinc-400" /></div>
                  ) : products.length > 0 ? products.map(p => (
                     <label key={p.id} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={formData.product_ids.includes(p.id)}
                          onChange={() => toggleProduct(p.id)}
                          className="w-4 h-4 accent-[#e77600] rounded"
                        />
                        <span className="text-[13px] text-zinc-600 group-hover:text-zinc-900 transition-colors">{p.name}</span>
                     </label>
                  )) : (
                     <p className="text-[12px] text-zinc-400 italic">No products found to restrict.</p>
                  )}
               </div>
               <p className="text-[11px] text-zinc-400">Leave unselected to apply the coupon to your entire store.</p>
            </div>

           <div className="bg-amber-50 rounded-xl p-4 flex gap-3">
              <Info size={18} className="text-amber-600 shrink-0" />
              <p className="text-[12px] text-amber-700 leading-relaxed">
                 Once created, this coupon will be immediately available for customers to use on your products. You can manage its usage from the main dashboard.
              </p>
           </div>

           <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 h-[48px] border border-zinc-200 rounded-xl text-[14px] font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
              >
                 Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-[2] h-[48px] bg-[#FFD814] hover:bg-[#F7CA00] text-zinc-900 border border-[#FCD200] rounded-xl text-[14px] font-black shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                 {loading ? <Loader size="sm" text="" /> : <Save size={18} />}
                 Create Coupon
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
