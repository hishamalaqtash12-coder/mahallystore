"use client";

import { useAuth } from "@/context/AuthContext";
import { Globe, Coins, Languages, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { redirect } from "next/navigation";

export default function AccountSettingsPage() {
  redirect("/account");

  const { wooId, refreshAuth, loading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeEditing, setActiveEditing] = useState(null); // 'country' | 'language' | 'currency'
  const [settings, setSettings] = useState({
    country: 'Jordan',
    language: 'English',
    currency: 'JOD'
  });

  if (loading) return null;

  const handleSave = async (field, value) => {
    setIsSaving(true);
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wooId,
          updates: {
            meta_data: [
              { key: 'mahally_localization', value: JSON.stringify(newSettings) }
            ]
          }
        })
      });
      if (res.ok) {
        await refreshAuth();
        setActiveEditing(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const countries = ['Jordan', 'Saudi Arabia', 'UAE', 'Kuwait', 'Qatar'];
  const languages = ['English', 'Arabic'];
  const currencies = ['JOD', 'SAR', 'AED', 'KWD', 'USD'];

  const renderEditSection = (field, current, options) => {
    if (activeEditing !== field) return null;
    return (
      <div className="mt-4 p-6 bg-gray-50/50 rounded-md border border-gray-100 animate-in slide-in-from-top-2 duration-300">
        <div className="flex flex-wrap gap-2">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => handleSave(field, opt)}
              disabled={isSaving}
              className={`px-5 py-2 rounded-md border text-[13px] font-bold transition-all flex items-center gap-2 ${current === opt ? 'bg-black border-black text-white' : 'bg-white border-gray-200 hover:border-gray-400'}`}
            >
              {current === opt && <Check size={14} />}
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-8 text-gray-900">Localization Settings</h2>
      
      <div className="bg-white rounded-md border border-gray-100 p-8 space-y-0 divide-y divide-gray-50 shadow-sm">
        {/* Country */}
        <div className="py-8 first:pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 border border-gray-50">
                  <Globe size={24} />
               </div>
               <div>
                 <h4 className="text-[16px] font-bold text-gray-900">Country/Region</h4>
                 <p className="text-[14px] text-gray-500">{settings.country}</p>
               </div>
            </div>
            <button 
               onClick={() => setActiveEditing(activeEditing === 'country' ? null : 'country')}
               className="px-6 py-2 border border-gray-200 rounded-md text-[13px] font-bold hover:bg-gray-50 hover:border-black transition-all"
            >
              {activeEditing === 'country' ? 'Cancel' : 'Change'}
            </button>
          </div>
          {renderEditSection('country', settings.country, countries)}
        </div>

        {/* Language */}
        <div className="py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 border border-gray-50">
                  <Languages size={24} />
               </div>
               <div>
                 <h4 className="text-[16px] font-bold text-gray-900">Language</h4>
                 <p className="text-[14px] text-gray-500">{settings.language}</p>
               </div>
            </div>
            <button 
               onClick={() => setActiveEditing(activeEditing === 'language' ? null : 'language')}
               className="px-6 py-2 border border-gray-200 rounded-md text-[13px] font-bold hover:bg-gray-50 hover:border-black transition-all"
            >
              {activeEditing === 'language' ? 'Cancel' : 'Change'}
            </button>
          </div>
          {renderEditSection('language', settings.language, languages)}
        </div>

        {/* Currency */}
        <div className="py-8 last:pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 border border-gray-50">
                  <Coins size={24} />
               </div>
               <div>
                 <h4 className="text-[16px] font-bold text-gray-900">Currency</h4>
                 <p className="text-[14px] text-gray-500">{settings.currency}</p>
               </div>
            </div>
            <button 
               onClick={() => setActiveEditing(activeEditing === 'currency' ? null : 'currency')}
               className="px-6 py-2 border border-gray-200 rounded-md text-[13px] font-bold hover:bg-gray-50 hover:border-black transition-all"
            >
              {activeEditing === 'currency' ? 'Cancel' : 'Change'}
            </button>
          </div>
          {renderEditSection('currency', settings.currency, currencies)}
        </div>
      </div>

      {isSaving && (
        <div className="fixed bottom-10 end-1/2 -translate-x-1/2 bg-black text-white px-8 py-3 rounded-md shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10 z-[100]">
           <Loader2 size={18} className="animate-spin text-[#be374f]" />
           <span className="text-[14px] font-bold">Saving settings...</span>
        </div>
      )}
    </div>
  );
}
