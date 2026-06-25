"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Globe,
  Bell,
  CreditCard,
  Save,
  RefreshCw,
  Lock,
  Smartphone,
  Cpu,
  Layout,
  Video,
  Image as ImageIcon,
  Type,
  Upload,
  Link2,
  FileImage,
  Play,
  AlignLeft,
  MessageSquare,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({ video: false, thumbnail: false });
  const [activeTab, setActiveTab] = useState("homepage"); // Default to homepage for now

  // Homepage Settings State
  const [promoSettings, setPromoSettings] = useState({
    promoVideoUrl: "",
    promoVideoThumbnail: "",
    promoVideoTitle: "",
    promoVideoDescription: "",
    messagingEnabled: true,
    whatsappEnabled: true,
    advertisingEnabled: true,
    supportEmail: "support@mahally.jo"
  });
  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings", { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setPromoSettings(data);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      setPromoSettings(prev => ({
        ...prev,
        [type === "video" ? "promoVideoUrl" : "promoVideoThumbnail"]: data.url
      }));
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading file.");
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log("Saving Admin Settings Payload:", promoSettings);
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promoSettings)
      });
      
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Failed to save");
      
      console.log("Settings saved response:", responseData);
      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "homepage", label: "Homepage", icon: Layout },
    { id: "general", label: "General", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configure marketplace parameters and content
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors w-fit disabled:opacity-50"
        >
          {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-56 shrink-0 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-end ${
                activeTab === t.id
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <t.icon size={16} className={activeTab === t.id ? "text-zinc-700" : "text-zinc-400"} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 rounded-xl border border-zinc-200 bg-white p-6">
          
          {/* ── Homepage Tab ── */}
          {activeTab === "homepage" && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <Video size={20} className="text-[#800000]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900">Promotional Video Section</h3>
                    <p className="text-xs text-zinc-500">Control the high-impact video banner at the bottom of the home page</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                      <Type size={14} className="text-zinc-400" />
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={promoSettings.promoVideoTitle}
                      onChange={(e) => setPromoSettings(prev => ({ ...prev, promoVideoTitle: e.target.value }))}
                      placeholder="e.g., Mahally Platform — Supporting Jordanian Products"
                      className="w-full h-11 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                      <AlignLeft size={14} className="text-zinc-400" />
                      Section Description
                    </label>
                    <textarea
                      value={promoSettings.promoVideoDescription}
                      onChange={(e) => setPromoSettings(prev => ({ ...prev, promoVideoDescription: e.target.value }))}
                      placeholder="e.g., Empowering local merchants to reach new heights with our digital tools..."
                      className="w-full h-24 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all resize-none"
                    />
                  </div>

                  {/* Video URL / Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                        <Video size={14} className="text-zinc-400" />
                        Promo Video
                      </label>
                      <div className="flex items-center gap-2">
                         <input
                           type="file"
                           id="video-upload"
                           className="hidden"
                           accept="video/*"
                           onChange={(e) => handleFileUpload(e, "video")}
                         />
                         <label 
                           htmlFor="video-upload" 
                           className={`flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${uploading.video ? 'opacity-50 pointer-events-none' : ''}`}
                         >
                           {uploading.video ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                           {uploading.video ? "Uploading..." : "Upload Video File"}
                         </label>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={promoSettings.promoVideoUrl}
                        onChange={(e) => setPromoSettings(prev => ({ ...prev, promoVideoUrl: e.target.value }))}
                        placeholder="Paste YouTube URL or upload a file above"
                        className="w-full h-11 bg-zinc-50 border border-zinc-200 rounded-xl px-4 ps-10 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                      />
                      <Link2 size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    </div>
                    <p className="text-[11px] text-zinc-400">Supported: YouTube links or direct MP4/MOV files</p>
                  </div>

                  {/* Thumbnail URL / Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                        <ImageIcon size={14} className="text-zinc-400" />
                        Banner Image (Thumbnail)
                      </label>
                      <div className="flex items-center gap-2">
                         <input
                           type="file"
                           id="thumbnail-upload"
                           className="hidden"
                           accept="image/*"
                           onChange={(e) => handleFileUpload(e, "thumbnail")}
                         />
                         <label 
                           htmlFor="thumbnail-upload" 
                           className={`flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${uploading.thumbnail ? 'opacity-50 pointer-events-none' : ''}`}
                         >
                           {uploading.thumbnail ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                           {uploading.thumbnail ? "Uploading..." : "Upload Image"}
                         </label>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={promoSettings.promoVideoThumbnail}
                        onChange={(e) => setPromoSettings(prev => ({ ...prev, promoVideoThumbnail: e.target.value }))}
                        placeholder="Paste image URL or upload a file above"
                        className="w-full h-11 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                      />
                      <ImageIcon size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    </div>
                    
                    {/* Preview */}
                    {promoSettings.promoVideoThumbnail && (
                      <div className="mt-4 relative aspect-[21/9] w-full max-w-md rounded-xl overflow-hidden border border-zinc-200 shadow-sm group">
                        <img 
                          src={promoSettings.promoVideoThumbnail} 
                          alt="Thumbnail Preview" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => { e.target.src = "https://placehold.co/800x340?text=Invalid+Image+URL"; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                           <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full border border-white/40 flex items-center justify-center shadow-2xl transition-all group-hover:scale-110">
                              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-brand shadow-[0_0_15px_rgba(255,96,0,0.4)]">
                                <Play size={12} fill="currentColor" className="me-0.5" />
                              </div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <Cpu size={16} className="text-zinc-600" />
                  </div>
                  <h3 className="font-semibold text-zinc-900">Marketplace Identity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">
                      Marketplace Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Mahally Marketplace"
                      className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-lg px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={promoSettings.supportEmail || ""}
                      onChange={(e) => setPromoSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                      placeholder="e.g., support@mahally.jo"
                      className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-lg px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-5 pt-5 border-t border-zinc-100">
                  <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <MessageSquare size={16} className="text-[#800000]" />
                  </div>
                  <h3 className="font-semibold text-zinc-900">System Features</h3>
                </div>

                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">Platform Messaging System</h4>
                      <p className="text-[11px] text-zinc-500">When disabled, all internal chat links and the Inbox page will be hidden.</p>
                    </div>
                    <button
                      onClick={() => setPromoSettings(prev => ({ ...prev, messagingEnabled: !prev.messagingEnabled }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        promoSettings.messagingEnabled ? 'bg-[#800000]' : 'bg-zinc-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          promoSettings.messagingEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">WhatsApp Communication</h4>
                      <p className="text-[11px] text-zinc-500">When disabled, all "Contact via WhatsApp" buttons will be hidden across the platform.</p>
                    </div>
                    <button
                      onClick={() => setPromoSettings(prev => ({ ...prev, whatsappEnabled: !prev.whatsappEnabled }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        promoSettings.whatsappEnabled ? 'bg-emerald-600' : 'bg-zinc-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          promoSettings.whatsappEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">Advertising & Promotions Module</h4>
                      <p className="text-[11px] text-zinc-500">When disabled, the Sponsored Ads section will be replaced with a "Coming Soon" placeholder.</p>
                    </div>
                    <button
                      onClick={() => setPromoSettings(prev => ({ ...prev, advertisingEnabled: !prev.advertisingEnabled }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        promoSettings.advertisingEnabled ? 'bg-[#be374f]' : 'bg-zinc-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          promoSettings.advertisingEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">User & Store Reporting System</h4>
                      <p className="text-[11px] text-zinc-500">Allow users to report stores or other users for violations. Currently disabled by default.</p>
                    </div>
                    <button
                      onClick={() => setPromoSettings(prev => ({ ...prev, reportingEnabled: !prev.reportingEnabled }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        promoSettings.reportingEnabled ? 'bg-indigo-600' : 'bg-zinc-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          promoSettings.reportingEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-5 pt-8 border-t border-zinc-100">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Globe size={16} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-zinc-900">Social Media Links</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">Facebook URL</label>
                    <input
                      type="url"
                      value={promoSettings.socialFacebook || ""}
                      onChange={(e) => setPromoSettings(prev => ({ ...prev, socialFacebook: e.target.value }))}
                      placeholder="https://facebook.com/mahallyjo"
                      className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-lg px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">Instagram URL</label>
                    <input
                      type="url"
                      value={promoSettings.socialInstagram || ""}
                      onChange={(e) => setPromoSettings(prev => ({ ...prev, socialInstagram: e.target.value }))}
                      placeholder="https://instagram.com/mahallyjo"
                      className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-lg px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">Twitter (X) URL</label>
                    <input
                      type="url"
                      value={promoSettings.socialTwitter || ""}
                      onChange={(e) => setPromoSettings(prev => ({ ...prev, socialTwitter: e.target.value }))}
                      placeholder="https://twitter.com/mahallyjo"
                      className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-lg px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">TikTok URL</label>
                    <input
                      type="url"
                      value={promoSettings.socialTikTok || ""}
                      onChange={(e) => setPromoSettings(prev => ({ ...prev, socialTikTok: e.target.value }))}
                      placeholder="https://tiktok.com/@mahallyjo"
                      className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-lg px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ... other tabs ... */}
        </div>
      </div>
    </div>
  );
}
