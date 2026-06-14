"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { 
  ImageIcon, 
  Upload, 
  MapPin, 
  CheckCircle2,
  Save,
  Loader2
} from "lucide-react";
import Loader from "@/components/Loader";

export default function MerchantSettings() {
  const { wooId, refreshAuth } = useAuth();
  
  const [data, setData] = useState({
    storeName: "",
    whatsappNumber: "",
    phone: "",
    bio: "",
    storeBanner: "",
    storeLogo: "",
    showWhatsapp: true,
    returnPolicy: "no-returns",
    returnPeriod: "",
    facebook: "",
    instagram: "",
    twitter: ""
  });

  // Tracks whether the vendor has manually customized the WhatsApp number
  const [whatsappCustomized, setWhatsappCustomized] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!wooId) return;
    fetch(`/api/vendors/${wooId}`)
      .then(res => res.json())
      .then(res => {
         if (res.vendor) {
            const phone = (res.vendor.phone || "").replace(/^\+?962/, '');
            const savedWhatsapp = (res.vendor.whatsappNumber || "").replace(/^\+?962/, '');
            // If a distinct WhatsApp number was explicitly saved, mark it as customized
            const isCustomized = !!savedWhatsapp && savedWhatsapp !== phone;
            if (isCustomized) setWhatsappCustomized(true);
            setData({
              storeName: res.vendor.storeName || "",
              // Default WhatsApp to business phone if not explicitly customized
              whatsappNumber: savedWhatsapp || phone,
              phone,
              bio: res.vendor.storeDescription || "",
              storeBanner: res.vendor.storeBanner || "",
              storeLogo: res.vendor.storeLogo || "",
              showWhatsapp: res.vendor.showWhatsapp !== false,
              returnPolicy: res.vendor.returnPolicy || "no-returns",
              returnPeriod: res.vendor.returnPeriod || "",
              facebook: res.vendor.facebook || res.vendor.social?.facebook || "",
              instagram: res.vendor.instagram || res.vendor.social?.instagram || "",
              twitter: res.vendor.twitter || res.vendor.social?.twitter || ""
            });
         }
         setIsLoading(false);
      })
      .catch(err => {
         console.error(err);
         setIsLoading(false);
      });
  }, [wooId]);

  const handleUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch("/api/vendors/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        setData(prev => ({
          ...prev,
          [type === 'banner' ? 'storeBanner' : 'storeLogo']: result.url
        }));
      }
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const handleSave = async () => {
    if (!wooId) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/vendors/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: wooId,
          meta: {
            mahally_store_name: data.storeName,
            mahally_whatsapp_number: data.whatsappNumber ? `+962${data.whatsappNumber}` : undefined,
            mahally_store_phone: data.phone ? `+962${data.phone}` : undefined,
            mahally_store_description: data.bio,
            mahally_store_banner: data.storeBanner,
            mahally_store_logo: data.storeLogo,
            mahally_show_whatsapp: data.showWhatsapp ? "yes" : "no",
            mahally_return_policy: data.returnPolicy,
            mahally_return_period: data.returnPeriod,
            mahally_facebook: data.facebook,
            mahally_instagram: data.instagram,
            mahally_twitter: data.twitter
          }
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Refresh auth context so the new store name is reflected immediately
        // in the header and sidebar without requiring a re-login.
        await refreshAuth();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader size="lg" text="Fetching store profile" />
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto pb-20 relative font-sans">
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Store Settings</h1>
        <p className="text-[13px] text-zinc-500 font-medium">Configure your store identity and contact details</p>
      </div>

      {/* Floating Toast Notification */}
      {success && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-emerald-50 border border-emerald-200 px-6 py-4 rounded-md shadow-lg flex items-center gap-3 text-[14px] font-bold text-emerald-700">
            <CheckCircle2 size={20} className="text-emerald-500" />
            Changes updated successfully!
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Branding Section */}
        <section className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200">
            <h3 className="text-[14px] font-bold text-zinc-900 uppercase tracking-widest">Branding & Identity</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-3">
                <label className="text-[13px] font-bold text-zinc-900 block">Store Banner</label>
                <input type="file" id="banner-upload" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'banner')} />
                <div 
                  onClick={() => document.getElementById('banner-upload').click()}
                  className="relative aspect-[3/1] bg-zinc-50 border border-zinc-300 rounded-md flex flex-col items-center justify-center group hover:bg-zinc-100 transition-all cursor-pointer overflow-hidden border-dashed shadow-inner"
                >
                    {data.storeBanner ? (
                      <Image src={data.storeBanner} alt="Banner" fill className="object-cover" />
                    ) : (
                      <>
                        <Upload size={20} className="text-zinc-400 group-hover:text-[#e77600] mb-1 transition-colors" />
                        <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">1200x400 px Recommended</span>
                      </>
                    )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[13px] font-bold text-zinc-900 block">Store Logo</label>
                <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'logo')} />
                <div 
                  onClick={() => document.getElementById('logo-upload').click()}
                  className="relative aspect-square bg-zinc-50 border border-zinc-300 rounded-md flex flex-col items-center justify-center group hover:bg-zinc-100 transition-all cursor-pointer overflow-hidden border-dashed shadow-inner"
                >
                    {data.storeLogo ? (
                      <Image src={data.storeLogo} alt="Logo" fill className="object-cover" />
                    ) : (
                      <>
                        <ImageIcon size={20} className="text-zinc-400 group-hover:text-[#e77600] mb-1 transition-colors" />
                        <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider text-center px-2">500x500 px</span>
                      </>
                    )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Store Details Section */}
        <section className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200">
            <h3 className="text-[14px] font-bold text-zinc-900 uppercase tracking-widest">Business Details</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-zinc-900">Official Store Name</label>
                <input type="text" value={data.storeName} onChange={(e) => setData({...data, storeName: e.target.value})} placeholder="Mahally Official Store" className="w-full h-[36px] px-3 bg-white border border-zinc-300 rounded-md text-[13px] focus:border-[#e77600] outline-none shadow-sm transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-zinc-900">Primary Warehouse Location</label>
                <select className="w-full h-[36px] px-3 bg-white border border-zinc-300 rounded-md text-[13px] focus:border-[#e77600] outline-none shadow-sm cursor-pointer transition-all">
                  <option>Amman, Jordan</option>
                  <option>Zarqa, Jordan</option>
                  <option>Irbid, Jordan</option>
                  <option>Aqaba, Jordan</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-zinc-900">WhatsApp Contact</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{data.showWhatsapp ? 'Visible' : 'Hidden'}</span>
                    <button 
                      onClick={() => setData({...data, showWhatsapp: !data.showWhatsapp})}
                      className={`w-8 h-4 rounded-full relative transition-colors ${data.showWhatsapp ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${data.showWhatsapp ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                <div className="flex">
                  <span className="h-[36px] px-3 bg-zinc-50 border border-zinc-300 border-r-0 rounded-l-md text-[13px] font-bold text-zinc-500 flex items-center shadow-sm">+962</span>
                  <input type="tel" value={data.whatsappNumber} onChange={(e) => { const val = e.target.value.replace(/^\+?962/, ''); setWhatsappCustomized(true); setData({...data, whatsappNumber: val}); }} className="flex-1 w-full h-[36px] px-3 bg-white border border-zinc-300 rounded-r-md text-[13px] focus:border-[#e77600] outline-none shadow-sm transition-all" placeholder="7X XXX XXXX" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-zinc-900">Business Phone</label>
                <div className="flex">
                  <span className="h-[36px] px-3 bg-zinc-50 border border-zinc-300 border-r-0 rounded-l-md text-[13px] font-bold text-zinc-500 flex items-center shadow-sm">+962</span>
                  <input type="tel" value={data.phone} onChange={(e) => { const val = e.target.value.replace(/^\+?962/, ''); setData(prev => ({ ...prev, phone: val, whatsappNumber: whatsappCustomized ? prev.whatsappNumber : val })); }} className="flex-1 w-full h-[36px] px-3 bg-white border border-zinc-300 rounded-r-md text-[13px] focus:border-[#e77600] outline-none shadow-sm transition-all" placeholder="7X XXX XXXX" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-zinc-900">Merchant Biography</label>
              <textarea rows={4} value={data.bio} onChange={(e) => setData({...data, bio: e.target.value})} className="w-full p-4 bg-white border border-zinc-300 rounded-md text-[13px] focus:border-[#e77600] outline-none shadow-sm resize-none transition-all font-medium" placeholder="Tell your customers about your brand..."></textarea>
            </div>
            
            <div className="pt-4 border-t border-zinc-200 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-zinc-900">Global Return Policy</label>
                <select 
                  value={data.returnPolicy}
                  onChange={(e) => setData({...data, returnPolicy: e.target.value})}
                  className="w-full h-[36px] px-3 bg-white border border-zinc-300 rounded-md text-[13px] focus:border-[#e77600] outline-none shadow-sm cursor-pointer transition-all"
                >
                  <option value="no-returns">No Returns Accepted</option>
                  <option value="global">Accept Returns (Global)</option>
                </select>
                <p className="text-[11px] text-zinc-500">You can override this on individual products.</p>
              </div>
              
              {data.returnPolicy === "global" && (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-zinc-900">Return Period (Days)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={data.returnPeriod}
                    onChange={(e) => setData({...data, returnPeriod: e.target.value})}
                    className="w-full h-[36px] px-3 bg-white border border-zinc-300 rounded-md text-[13px] focus:border-[#e77600] outline-none shadow-sm transition-all" 
                  />
                  <p className="text-[11px] text-zinc-500">Number of days a customer has to return an item.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Social Links Section */}
        <section className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200">
            <h3 className="text-[14px] font-bold text-zinc-900 uppercase tracking-widest">Social Links</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-zinc-900">Facebook</label>
                <input type="url" value={data.facebook} onChange={(e) => setData({...data, facebook: e.target.value})} placeholder="https://facebook.com/yourstore" className="w-full h-[36px] px-3 bg-white border border-zinc-300 rounded-md text-[13px] focus:border-[#e77600] outline-none shadow-sm transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-zinc-900">Instagram</label>
                <input type="url" value={data.instagram} onChange={(e) => setData({...data, instagram: e.target.value})} placeholder="https://instagram.com/yourstore" className="w-full h-[36px] px-3 bg-white border border-zinc-300 rounded-md text-[13px] focus:border-[#e77600] outline-none shadow-sm transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-zinc-900">Twitter / X</label>
                <input type="url" value={data.twitter} onChange={(e) => setData({...data, twitter: e.target.value})} placeholder="https://twitter.com/yourstore" className="w-full h-[36px] px-3 bg-white border border-zinc-300 rounded-md text-[13px] focus:border-[#e77600] outline-none shadow-sm transition-all" />
              </div>
            </div>
          </div>
        </section>



        <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-md p-6 shadow-sm">
            <div>
               <p className="text-[13px] font-bold text-zinc-900">Commit Changes</p>
               <p className="text-[11px] text-zinc-500 font-medium">Changes will take effect immediately across the marketplace</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`h-[40px] px-10 rounded-md text-[14px] font-bold shadow-md transition-all flex items-center justify-center gap-2 ${success ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600' : 'bg-[#febd69] hover:bg-[#f7ac44] text-zinc-900 border border-[#e5a850]'}`}
            >
              {isSaving ? <Loader size="sm" text="" /> : success ? <><CheckCircle2 size={16} /> Profile Updated</> : "Save Settings"}
            </button>
        </div>
      </div>
    </div>
  );
}
