"use client";

import { useAuth } from "@/context/AuthContext";
import { ChevronRight, Bell, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AccountNotificationsPage() {
  const { wooId, notificationPreferences, setNotificationPreferences, loading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState([
    { id: 'promotions', title: 'Promotions', desc: 'Be the first to learn about promotions, daily deals, and other exclusive savings.', meta: 'Email & Push', enabled: true },
    { id: 'orders', title: 'Order updates', desc: 'Receive notifications about order confirmations and shipment updates.', meta: 'Email & SMS', enabled: true },
    { id: 'chat', title: 'Chat messages', desc: 'Never miss important messages from sellers.', meta: 'Email & In-app', enabled: true },
    { id: 'trends', title: 'Customers\' activity', desc: 'Keep up with the latest shopping trends. Showing others\' shopping activities.', meta: 'Push only', enabled: false },
    { id: 'profile', title: 'Avatar and username sharing', desc: 'Share your user profile avatar and username with other users when you add a product to cart or purchase.', meta: 'Public', enabled: false }
  ]);

  useEffect(() => {
    if (notificationPreferences) {
      try {
        const parsed = typeof notificationPreferences === 'string' ? JSON.parse(notificationPreferences) : notificationPreferences;
        if (Array.isArray(parsed)) {
          setNotificationSettings(parsed);
        }
      } catch (e) {
        console.error("Failed to parse notification preferences", e);
      }
    }
  }, [notificationPreferences]);

  if (loading) return null;

  const toggleNotification = async (id) => {
    setIsSaving(true);
    const updated = notificationSettings.map(s => {
      if (s.id === id) return { ...s, enabled: !s.enabled };
      return s;
    });
    setNotificationSettings(updated);

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wooId,
          updates: {
            meta_data: [
              { key: 'mahally_notification_preferences', value: JSON.stringify(updated) }
            ]
          }
        })
      });
      if (res.ok) {
        setNotificationPreferences(JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-[#e7f5ed] p-4 rounded-md border border-emerald-100 flex items-center gap-4 mb-10">
        <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-emerald-600 shadow-sm shrink-0 border border-emerald-50">
          <ShieldCheck size={18} />
        </div>
        <p className="text-[13px] text-emerald-800 font-medium">Mahally will never ask for your password or payment details via SMS or Email.</p>
      </div>

      <h2 className="text-2xl font-bold mb-8 text-gray-900">Notification Preferences</h2>

      <div className="bg-white border border-gray-100 rounded-md overflow-hidden divide-y divide-gray-50 shadow-sm">
        {notificationSettings.map((item) => (
          <div key={item.id} className="p-6 flex items-start justify-between group hover:bg-gray-50/5 transition-all">
            <div className="flex flex-col gap-0.5 max-w-2xl pr-8">
              <h3 className="text-[16px] font-bold text-gray-900 group-hover:text-[#be374f] transition-colors">{item.title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-2">{item.desc}</p>
              {item.meta && <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{item.meta}</span>}
            </div>
            
            <button 
              onClick={() => toggleNotification(item.id)}
              disabled={isSaving}
              className={`relative w-12 h-6 rounded-full transition-all flex items-center shrink-0 mt-1 ${item.enabled ? 'bg-[#be374f]' : 'bg-gray-200'}`}
            >
               <div className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-all ${item.enabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>

      {isSaving && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-3 rounded-md shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10 z-[100]">
           <Loader2 size={18} className="animate-spin text-[#be374f]" />
           <span className="text-[14px] font-bold">Preferences saved</span>
        </div>
      )}
    </div>
  );
}
