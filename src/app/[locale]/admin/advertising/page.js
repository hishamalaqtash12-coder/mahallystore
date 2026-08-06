"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Megaphone, CheckCircle2, XCircle, Clock, Search, Filter } from "lucide-react";

export default function AdminAdvertisingPage() {
  const t = useTranslations("AdminAdvertising");
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [activeAds, setActiveAds] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [actioningId, setActioningId] = useState(null);

  // Manual Promotion State
  const [manualType, setManualType] = useState("product");
  const [manualTargetId, setManualTargetId] = useState("");
  const [manualDuration, setManualDuration] = useState(7);
  const [manualSubmitting, setManualSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      router.push("/login?redirect=/admin/advertising");
      return;
    }
    fetchData();
  }, [user, isAdmin, authLoading, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, prodRes, vendRes] = await Promise.all([
        fetch("/api/admin/advertising"),
        fetch("/api/products?per_page=100"),
        fetch("/api/vendors")
      ]);
      
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.requests || []);
        setActiveAds(data.activeAds || []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }
      if (vendRes.ok) {
        const vendData = await vendRes.json();
        setVendors(vendData || []);
      }
    } catch (error) {
      console.error("Failed to load ad requests", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (orderId, action) => {
    if (!window.confirm(t("confirmCampaignAction", { action: t(action === "approve" ? "approve" : "reject") }))) return;
    
    setActioningId(orderId);
    try {
      const res = await fetch("/api/admin/advertising", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(t("campaignActionSuccess", { action: t(action === "approve" ? "approve" : "reject") }));
      fetchData(); // Refresh list
    } catch (err) {
      alert(t("campaignActionFail", { action: t(action === "approve" ? "approve" : "reject"), message: err.message }));
    } finally {
      setActioningId(null);
    }
  };

  const handleManualPromote = async (e) => {
    e.preventDefault();
    if (!manualTargetId) {
      alert(t("invalidTargetMessage"));
      return;
    }
    if (!window.confirm(t("confirmManualPromotion", { type: t(manualType === 'product' ? 'productLabel' : 'storeLabel'), id: manualTargetId }))) return;

    setManualSubmitting(true);
    try {
      const res = await fetch("/api/admin/advertising", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "manual_promote",
          type: manualType,
          targetId: manualTargetId,
          durationDays: parseInt(manualDuration)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(t("manualPromotionSuccess", { type: t(manualType === 'product' ? 'productLabel' : 'storeLabel') }));
      setManualTargetId("");
    } catch (err) {
      alert(t("manualPromotionFail", { message: err.message }));
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleRevoke = async (type, targetId) => {
    if (!window.confirm(t("confirmRevokeAd", { type: t(type === 'product' ? 'productLabel' : 'storeLabel') }))) return;

    setActioningId(`revoke-${targetId}`);
    try {
      const res = await fetch("/api/admin/advertising", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", type, targetId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(t("adRevokedSuccess", { type: t(type === 'product' ? 'productLabel' : 'storeLabel') }));
      fetchData();
    } catch (err) {
      alert(t("revokeFailed", { message: err.message }));
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center bg-zinc-50 min-h-screen">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-[#be374f] rounded-full animate-spin"></div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    if (status === "completed") return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">{t("statusActive")}</span>;
    if (status === "processing") return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-[11px] font-bold">{t("statusReadyForApproval")}</span>;
    if (status === "pending" || status === "on-hold") return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold">{t("statusAwaitingPayment")}</span>;
    return <span className="px-2.5 py-1 bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-[11px] font-bold">{t("statusRejectedExpired")}</span>;
  };

  const getAdTypeLabel = (type) => type === 'product' ? t('productLabel') : t('storeLabel');
  const formatAdDuration = (daysLeft) =>
    daysLeft <= 0 ? t('durationLifetime') : t('durationDays', { count: daysLeft });

  return (
    <div className="flex-1 p-8 bg-zinc-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Megaphone size={24} className="text-[#be374f]" />
              {t("pageTitle")}
            </h1>
            <p className="text-[13px] text-zinc-500 mt-1">{t("pageSubtitle")}</p>
          </div>
        </div>

        {/* Manual Promotion Tool */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden p-6">
           <h2 className="text-[16px] font-bold text-zinc-900 mb-4 border-b border-zinc-100 pb-3">{t("manualPromotionHeading")}</h2>
           <form onSubmit={handleManualPromote} className="flex flex-col md:flex-row items-end gap-4">
              <div className="space-y-1 w-full md:w-auto flex-1">
                 <label className="text-[12px] font-bold text-zinc-600">{t("promotionTypeLabel")}</label>
                 <select 
                    value={manualType} 
                    onChange={e => setManualType(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-[13px] outline-none focus:border-[#be374f]"
                 >
                    <option value="product">{t("productLabel")}</option>
                    <option value="store">{t("storeLabel")}</option>
                 </select>
              </div>
              <div className="space-y-1 w-full md:w-auto flex-1">
                 <label className="text-[12px] font-bold text-zinc-600">{t("selectTargetLabel")}</label>
                 {manualType === "product" ? (
                   <select 
                      value={manualTargetId} 
                      onChange={e => setManualTargetId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-[13px] outline-none focus:border-[#be374f]"
                   >
                      <option value="">{t("selectProductPlaceholder")}</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({t("idLabel", { id: p.id })})</option>
                      ))}
                   </select>
                 ) : (
                   <select 
                      value={manualTargetId} 
                      onChange={e => setManualTargetId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-[13px] outline-none focus:border-[#be374f]"
                   >
                      <option value="">{t("selectStorePlaceholder")}</option>
                       {vendors.map(v => {
                         const name = v.storeName || v.name || `${t("storeLabel")} #${v.id}`;
                         return <option key={v.id} value={v.id}>{name} ({t("idLabel", { id: v.id })})</option>;
                       })}
                   </select>
                 )}
              </div>
              <div className="space-y-1 w-full md:w-auto flex-1">
                 <label className="text-[12px] font-bold text-zinc-600">{t("durationLabel")}</label>
                 <select 
                    value={manualDuration} 
                    onChange={e => setManualDuration(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-[13px] outline-none focus:border-[#be374f]"
                 >
                    <option value="7">{t("duration7")}</option>
                    <option value="14">{t("duration14")}</option>
                    <option value="30">{t("duration30")}</option>
                    <option value="0">{t("durationLifetime")}</option>
                 </select>
              </div>
              <button 
                 type="submit" 
                 disabled={manualSubmitting}
                 className="h-10 px-6 bg-brand hover:bg-brand-dark text-white font-bold rounded-lg shadow-sm text-[13px] transition-all disabled:opacity-50 whitespace-nowrap"
              >
                 {manualSubmitting ? t("promoting") : t("forcePromote")}
              </button>
           </form>
           <p className="text-[11px] text-zinc-400 mt-3 italic">{t("manualPromotionDisclaimer")}</p>
        </div>

        {/* Active Ads List */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-[#fbfbfb]">
            <h2 className="text-[16px] font-bold text-zinc-900">{t("activePromotionsTitle")}</h2>
          </div>
          
          {activeAds.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center">
              <p className="text-[14px] font-bold text-zinc-700">{t("noActiveAds")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-end border-collapse">
                <thead>
                  <tr className="bg-white border-b border-zinc-200">
                     <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{t("columnType")}</th>
                     <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{t("columnNameId")}</th>
                     <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{t("columnExpiresIn")}</th>
                     <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-start">{t("columnAction")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {activeAds.map((ad, idx) => {
                     const isLifetime = ad.expiry > Date.now() + (1000 * 24 * 60 * 60 * 1000); // More than 3 years is considered lifetime
                     const daysLeft = Math.ceil((ad.expiry - Date.now()) / (1000 * 60 * 60 * 24));
                     
                     return (
                       <tr key={`${ad.type}-${ad.id}-${idx}`} className="hover:bg-zinc-50 transition-colors">
                         <td className="px-6 py-4">
                           <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${ad.type === 'product' ? 'bg-[#fde7ee] text-[#be374f]' : 'bg-[#fde7ee] text-[#be374f]'}`}>
                             {getAdTypeLabel(ad.type)}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                           <p className="text-[13px] font-bold text-zinc-900">{ad.name}</p>
                           <p className="text-[11px] text-zinc-500">{t("idLabel", { id: ad.id })}</p>
                         </td>
                         <td className="px-6 py-4">
                           {isLifetime ? (
                             <span className="text-[13px] font-bold text-emerald-600">{t('durationLifetime')}</span>
                           ) : (
                             <span className="text-[13px] font-bold text-zinc-700">{formatAdDuration(daysLeft)}</span>
                           )}
                         </td>
                         <td className="px-6 py-4 text-start">
                           <button
                             onClick={() => handleRevoke(ad.type, ad.id)}
                             disabled={actioningId === `revoke-${ad.id}`}
                             className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-[12px] font-bold rounded shadow-sm disabled:opacity-50"
                           >
                             {actioningId === `revoke-${ad.id}` ? t("processingAction") : t("revokeButton")}
                           </button>
                         </td>
                       </tr>
                     );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-[#fbfbfb]">
            <h2 className="text-[16px] font-bold text-zinc-900">{t("campaignQueueTitle")}</h2>
          {requests.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <CheckCircle2 size={40} className="text-zinc-200 mb-4" />
              <p className="text-[15px] font-bold text-zinc-700 mb-1">{t("queueEmptyTitle")}</p>
              <p className="text-[13px] text-zinc-500 max-w-sm">{t("queueEmptyDesc")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-end border-collapse">
                <thead>
                  <tr className="bg-white border-b border-zinc-200">
                    <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{t("columnInvoiceDate")}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{t("columnMerchant")}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{t("columnTypeDuration")}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{t("columnCost")}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{t("columnStatus")}</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-start">{t("columnAction")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-[13px] font-bold text-[#be374f]">{t("hashId", { id: req.id })}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{new Date(req.date).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[13px] font-bold text-zinc-900">{req.customerName || t("vendorLabelWithId", { id: req.vendorId })}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[13px] font-bold text-zinc-900 capitalize">{getAdTypeLabel(req.type)}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{formatAdDuration(req.duration)}</p>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-[#be374f]">
                        {t("currencyCode")} {parseFloat(req.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4 text-start">
                        {req.status === "processing" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleAction(req.id, "approve")}
                              disabled={actioningId === req.id}
                              className="px-4 py-1.5 bg-[#be374f] hover:bg-[#8f2d4a] text-white text-[12px] font-bold rounded shadow-sm disabled:opacity-50"
                            >
                              {actioningId === req.id ? t("processingAction") : t("approve")}
                            </button>
                            <button
                              onClick={() => handleAction(req.id, "reject")}
                              disabled={actioningId === req.id}
                              className="px-4 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-[12px] font-bold rounded shadow-sm disabled:opacity-50"
                            >
                              {t("reject")}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">{t("noActionsAvailable")}</span>
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
    </div>
  );
}
