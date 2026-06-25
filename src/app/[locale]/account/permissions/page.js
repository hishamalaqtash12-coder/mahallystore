"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function AccountPermissionsPage() {
  const { user, wooId, loading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [permissions, setPermissions] = useState([
    { id: 'data_sharing', title: 'Data Sharing with Partners', desc: 'Allow us to share your browsing data with trusted partners to show you more relevant products and offers.', status: 'Granted' },
    { id: 'precise_location', title: 'Precise Location Tracking', desc: 'Enable precise location to find stores near you and get accurate shipping estimates.', status: 'Denied' },
    { id: 'personalized_ads', title: 'Personalized Advertisements', desc: 'Show ads that match your interests based on your shopping history and preferences.', status: 'Granted' },
    { id: 'analytics', title: 'Usage Analytics', desc: 'Help us improve our service by allowing anonymous data collection about how you use the app.', status: 'Granted' }
  ]);

  useEffect(() => {
    if (wooId) {
      // In a real app, fetch these from user metadata
    }
  }, [wooId]);

  const togglePermission = async (id) => {
    setIsSaving(true);
    const updated = permissions.map(p => 
      p.id === id ? { ...p, status: p.status === 'Granted' ? 'Denied' : 'Granted' } : p
    );
    setPermissions(updated);

    try {
      await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wooId,
          updates: {
            meta_data: [{ key: 'mahally_privacy_permissions', value: JSON.stringify(updated) }]
          }
        })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-8 text-gray-900">Data & Privacy Permissions</h2>

      <div className="space-y-3">
        {permissions.map((item) => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-md p-6 flex items-center justify-between group hover:border-[#be374f] transition-all">
            <div className="flex-1 ps-8">
              <h3 className="text-[16px] font-bold mb-1 text-gray-900">{item.title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed max-w-xl">{item.desc}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
               <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md ${item.status === 'Granted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                 {item.status}
               </span>
               <button 
                 onClick={() => togglePermission(item.id)}
                 disabled={isSaving}
                 className="text-[13px] text-[#be374f] font-bold hover:underline transition-all disabled:opacity-50"
               >
                 {item.status === 'Granted' ? 'Revoke' : 'Grant Access'}
               </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-8 bg-gray-50 rounded-md flex items-start gap-6 border border-gray-100">
        <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center text-emerald-600 shadow-sm shrink-0 border border-gray-100">
           <ShieldCheck size={28} />
        </div>
        <div>
           <h4 className="text-[16px] font-bold text-gray-900 mb-1">Your privacy is our priority</h4>
           <p className="text-[13px] text-gray-600 leading-relaxed">
             We only request permissions that are essential for providing a seamless shopping experience. 
             You have full control over your data, and you can revoke these permissions at any time. 
           </p>
        </div>
      </div>

      {isSaving && (
        <div className="fixed bottom-10 end-1/2 -translate-x-1/2 bg-black text-white px-8 py-3 rounded-md shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10 z-[100]">
           <Loader2 size={18} className="animate-spin text-[#be374f]" />
           <span className="text-[14px] font-bold">Updating permissions...</span>
        </div>
      )}
    </div>
  );
}
