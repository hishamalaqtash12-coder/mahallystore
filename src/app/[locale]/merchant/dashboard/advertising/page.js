"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/routing";
import { Megaphone, Store, Package, Plus, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";

const AD_PRICING = {
  7: 10.00,
  14: 18.00,
  30: 35.00
};

export default function MerchantAdvertisingPage() {
  const { user, wooId, isVendor, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  
  // New Campaign Form State
  const [showForm, setShowForm] = useState(false);
  const [adType, setAdType] = useState("product"); // "product" or "store"
  const [selectedProduct, setSelectedProduct] = useState("");
  const [duration, setDuration] = useState(7);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isVendor) {
      router.push("/login?redirect=/merchant/dashboard/advertising");
      return;
    }
    fetchData();
  }, [user, isVendor, authLoading, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Campaigns (Invoices)
      const campRes = await fetch(`/api/merchant/advertising?vendorId=${wooId}`);
      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaigns(campData.campaigns || []);
      }

      // 2. Fetch Merchant Products
      const prodRes = await fetch(`/api/merchant/products?vendorId=${wooId}`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }
    } catch (error) {
      console.error("Failed to load advertising data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (adType === "product" && !selectedProduct) {
      alert("Please select a product to promote.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/merchant/advertising", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: wooId,
          type: adType,
          targetId: adType === "product" ? selectedProduct : wooId,
          duration: duration
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Campaign requested successfully! An invoice (Order #${data.orderId}) has been generated for JOD ${data.price.toFixed(2)}.`);
      setShowForm(false);
      setAdType("product");
      setSelectedProduct("");
      setDuration(7);
      fetchData(); // Refresh list
    } catch (err) {
      alert("Failed to create campaign: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center bg-zinc-50 min-h-screen">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-[#be374f] rounded-full animate-spin"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (status === "Active") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "Pending Payment") return "bg-amber-100 text-amber-700 border-amber-200";
    if (status === "Pending Admin Approval") return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-rose-100 text-rose-700 border-rose-200";
  };

  return (
    <div className="flex-1 p-8 bg-zinc-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Megaphone size={24} className="text-[#be374f]" />
              Advertising & Promotions
            </h1>
            <p className="text-[13px] text-zinc-500 mt-1">Boost your sales by featuring your products or store on the homepage.</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold rounded-full shadow-sm text-[13px] transition-all flex items-center gap-2 border border-[#be374f]"
            >
              <Plus size={16} /> New Campaign
            </button>
          )}
        </div>

        {/* New Campaign Form */}
        {showForm && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
              <h2 className="text-[18px] font-bold text-zinc-900">Create New Campaign</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ad Type */}
                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-zinc-700">What would you like to promote?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      onClick={() => setAdType("product")}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center ${adType === "product" ? "border-[#be374f] bg-[#fde7ee]" : "border-zinc-200 hover:border-zinc-300 bg-white"}`}
                    >
                      <Package size={24} className={adType === "product" ? "text-[#be374f]" : "text-zinc-400"} />
                      <span className={`text-[13px] font-bold ${adType === "product" ? "text-[#be374f]" : "text-zinc-600"}`}>A Product</span>
                    </div>
                    <div 
                      onClick={() => setAdType("store")}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center ${adType === "store" ? "border-[#be374f] bg-[#fde7ee]" : "border-zinc-200 hover:border-zinc-300 bg-white"}`}
                    >
                      <Store size={24} className={adType === "store" ? "text-[#be374f]" : "text-zinc-400"} />
                      <span className={`text-[13px] font-bold ${adType === "store" ? "text-[#be374f]" : "text-zinc-600"}`}>My Entire Store</span>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-zinc-700">Campaign Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[7, 14, 30].map(days => (
                      <div 
                        key={days}
                        onClick={() => setDuration(days)}
                        className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center text-center ${duration === days ? "border-[#be374f] bg-[#fde7ee]" : "border-zinc-200 hover:border-zinc-300 bg-white"}`}
                      >
                        <span className={`text-[16px] font-black ${duration === days ? "text-[#be374f]" : "text-zinc-700"}`}>{days}</span>
                        <span className={`text-[11px] font-bold uppercase ${duration === days ? "text-[#be374f]" : "text-zinc-400"}`}>Days</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Selector */}
              {adType === "product" && (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-zinc-700">Select Product to Promote</label>
                  <select 
                    value={selectedProduct} 
                    onChange={e => setSelectedProduct(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-zinc-300 text-[13px] outline-none focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] bg-white"
                  >
                    <option value="">-- Choose a product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (JOD {p.price})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Summary & Checkout */}
              <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                <div>
                  <p className="text-[12px] text-zinc-500 font-medium">Total Campaign Cost</p>
                  <p className="text-2xl font-black text-[#be374f]">JOD {AD_PRICING[duration].toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-[13px] font-bold text-zinc-600 hover:text-zinc-900 transition-colors">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-1 md:flex-none px-6 py-2.5 bg-[#be374f] hover:bg-[#8f2d4a] text-white font-bold rounded-lg shadow-sm text-[13px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? "Processing..." : "Generate Invoice & Request"} <ArrowRight size={16} />
                  </button>
                </div>
              </div>

            </form>
          </div>
        )}

        {/* Campaign History */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-zinc-900">Your Campaigns</h2>
          </div>
          
          {campaigns.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Megaphone size={40} className="text-zinc-200 mb-4" />
              <p className="text-[15px] font-bold text-zinc-700 mb-1">No campaigns yet</p>
              <p className="text-[13px] text-zinc-500 max-w-sm">Create your first advertising campaign to boost your store's visibility to thousands of customers.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-end border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-[13px] font-bold text-zinc-900">Invoice #{camp.id}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{new Date(camp.date).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-700 capitalize">
                          {camp.type === "store" ? <Store size={14} className="text-[#be374f]"/> : <Package size={14} className="text-[#be374f]"/>}
                          {camp.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-zinc-700">
                        {camp.duration} Days
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-[#be374f]">
                        JOD {parseFloat(camp.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusColor(camp.status)}`}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {camp.status === "Pending Payment" ? (
                          <Link href={`/account/orders/${camp.id}`} className="text-[12px] font-bold text-[#be374f] hover:text-[#be374f] flex items-center gap-1">
                            Pay Now <ExternalLink size={12} />
                          </Link>
                        ) : (
                          <span className="text-[12px] text-zinc-400 italic">No action needed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
