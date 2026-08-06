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
  UserCircle,
  Search,
  X,
  Check,
  HeadphoneIcon,
  Headphones,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminSettingsPage() {
  const t = useTranslations("AdminSettings");
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
    supportEmail: "support@mahally.jo",
    supportUserId: null,
    supportUserName: "",
  });

  // Support user search state
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings", { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setPromoSettings(data);
          // Pre-fill the search box if a support user is already assigned
          if (data.supportUserName) setUserSearchQuery(data.supportUserName);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // Live user search with debounce
  useEffect(() => {
    if (!userSearchQuery.trim() || userSearchQuery === promoSettings.supportUserName) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearchQuery)}&role=administrator`);
        if (res.ok) {
          const data = await res.json();
          setUserSearchResults(data.users || []);
          setShowUserDropdown(true);
        }
      } catch (e) {
        console.error("User search error:", e);
      } finally {
        setSearchingUsers(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

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

      if (!res.ok) throw new Error(t("uploadFailed"));
      const data = await res.json();

      setPromoSettings(prev => ({
        ...prev,
        [type === "video" ? "promoVideoUrl" : "promoVideoThumbnail"]: data.url
      }));
    } catch (err) {
      console.error("Upload error:", err);
      alert(t("uploadFailed"));
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
      if (!res.ok) throw new Error(responseData.error || t("settingsSaveError"));
      
      console.log("Settings saved response:", responseData);
      alert(t("settingsSaved"));
    } catch (err) {
      console.error("Save error:", err);
      alert(t("settingsSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "homepage", label: t("homepageTab"), icon: Layout },
    { id: "general", label: t("generalTab"), icon: Settings },
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
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("pageSubtitle")}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors w-fit disabled:opacity-50"
        >
          {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? t("saving") : t("saveChanges")}
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
                    <h3 className="font-bold text-zinc-900">{t("promoVideoSection")}</h3>
                    <p className="text-xs text-zinc-500">{t("promoVideoSectionDesc")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                      <Type size={14} className="text-zinc-400" />
                      {t("sectionHeadingLabel")}
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
                      {t("sectionDescriptionLabel")}
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
                        {t("promoVideoLabel")}
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
                           {uploading.video ? t("uploading") : t("uploadVideoFile")}
                         </label>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={promoSettings.promoVideoUrl}
                        onChange={(e) => setPromoSettings(prev => ({ ...prev, promoVideoUrl: e.target.value }))}
                        placeholder={t("promoVideoPlaceholder")}
                        className="w-full h-11 bg-zinc-50 border border-zinc-200 rounded-xl px-4 ps-10 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                      />
                      <Link2 size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    </div>
                    <p className="text-[11px] text-zinc-400">{t("supportedMedia")}</p>
                  </div>

                  {/* Thumbnail URL / Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                        <ImageIcon size={14} className="text-zinc-400" />
                        {t("bannerImageLabel")}
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
                           {uploading.thumbnail ? t("uploading") : t("uploadImageFile")}
                         </label>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={promoSettings.promoVideoThumbnail}
                        onChange={(e) => setPromoSettings(prev => ({ ...prev, promoVideoThumbnail: e.target.value }))}
                        placeholder={t("bannerImagePlaceholder")}
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
                  <h3 className="font-semibold text-zinc-900">{t("marketplaceIdentity")}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">
                      {t("marketplaceName")}
                    </label>
                    <input
                      type="text"
                      defaultValue={t("marketplaceNameDefault")}
                      className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-lg px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">
                      {t("contactEmail")}
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
                  <h3 className="font-semibold text-zinc-900">{t("systemFeatures")}</h3>
                </div>

                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{t("platformMessagingSystem")}</h4>
                      <p className="text-[11px] text-zinc-500">{t("platformMessagingSystemDesc")}</p>
                    </div>
                    <button
                      dir="ltr"
                      onClick={() => setPromoSettings(prev => ({ ...prev, messagingEnabled: !prev.messagingEnabled }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        promoSettings.messagingEnabled ? 'bg-[#800000]' : 'bg-zinc-300'
                      }`}
                    >
                      <span
                        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                        style={{ transform: promoSettings.messagingEnabled ? 'translateX(20px)' : 'translateX(0px)' }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{t("whatsappCommunication")}</h4>
                      <p className="text-[11px] text-zinc-500">{t("whatsappCommunicationDesc")}</p>
                    </div>
                    <button
                      dir="ltr"
                      onClick={() => setPromoSettings(prev => ({ ...prev, whatsappEnabled: !prev.whatsappEnabled }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        promoSettings.whatsappEnabled ? 'bg-[#800000]' : 'bg-zinc-300'
                      }`}
                    >
                      <span
                        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                        style={{ transform: promoSettings.whatsappEnabled ? 'translateX(20px)' : 'translateX(0px)' }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{t("advertisingModule")}</h4>
                      <p className="text-[11px] text-zinc-500">{t("advertisingModuleDesc")}</p>
                    </div>
                    <button
                      dir="ltr"
                      onClick={() => setPromoSettings(prev => ({ ...prev, advertisingEnabled: !prev.advertisingEnabled }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        promoSettings.advertisingEnabled ? 'bg-[#800000]' : 'bg-zinc-300'
                      }`}
                    >
                      <span
                        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                        style={{ transform: promoSettings.advertisingEnabled ? 'translateX(20px)' : 'translateX(0px)' }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{t("userReportingSystem")}</h4>
                      <p className="text-[11px] text-zinc-500">{t("userReportingSystemDesc")}</p>
                    </div>
                    <button
                      dir="ltr"
                      onClick={() => setPromoSettings(prev => ({ ...prev, reportingEnabled: !prev.reportingEnabled }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        promoSettings.reportingEnabled ? 'bg-[#800000]' : 'bg-zinc-300'
                      }`}
                    >
                      <span
                        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                        style={{ transform: promoSettings.reportingEnabled ? 'translateX(20px)' : 'translateX(0px)' }}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-5 pt-8 border-t border-zinc-100">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Headphones size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{t("supportAgent")}</h3>
                    <p className="text-xs text-zinc-400">{t("supportAgentDesc")}</p>
                  </div>
                </div>

                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 mb-8">
                  {/* Current assignment badge */}
                  {promoSettings.supportUserId ? (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#800000]/10 flex items-center justify-center">
                          <UserCircle size={20} className="text-[#800000]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{promoSettings.supportUserName || `User #${promoSettings.supportUserId}`}</p>
                          <p className="text-[11px] text-zinc-400">ID: {promoSettings.supportUserId} · {t("activeSupportAgent")}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setPromoSettings(prev => ({ ...prev, supportUserId: null, supportUserName: "" }));
                          setUserSearchQuery("");
                        }}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                      >
                        <X size={12} /> {t("resetToDefaultAdmin")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-4 text-[12px] text-zinc-500 bg-white border border-dashed border-zinc-200 rounded-lg px-3 py-2">
                      <UserCircle size={16} className="text-zinc-400" />
                      <span>{t("noSupportAgentAssigned")}</span>
                    </div>
                  )}

                  {/* User search */}
                  <div className="relative">
                    <label className="text-xs font-medium text-zinc-500 mb-1.5 block">{t("searchAssignAdminUser")}</label>
                    <div className="relative">
                      <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => { setUserSearchQuery(e.target.value); setShowUserDropdown(true); }}
                        onFocus={() => { if (userSearchResults.length > 0) setShowUserDropdown(true); }}
                        placeholder={t("searchAdminsPlaceholder")}
                        className="w-full h-9 bg-white border border-zinc-200 rounded-lg ps-9 pe-9 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
                      />
                      {searchingUsers && (
                        <RefreshCw size={14} className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />
                      )}
                      {userSearchQuery && !searchingUsers && (
                        <button
                          onClick={() => { setUserSearchQuery(""); setUserSearchResults([]); setShowUserDropdown(false); }}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Dropdown results */}
                    {showUserDropdown && userSearchResults.length > 0 && (
                      <div className="absolute top-[100%] start-0 end-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden">
                        {userSearchResults.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setPromoSettings(prev => ({ ...prev, supportUserId: u.id, supportUserName: u.name }));
                              setUserSearchQuery(u.name);
                              setShowUserDropdown(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-start hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0 ${promoSettings.supportUserId === u.id ? 'bg-amber-50' : ''}`}
                          >
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                <UserCircle size={18} className="text-zinc-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-900 truncate">{u.name}</p>
                              <p className="text-[11px] text-zinc-400 truncate">{u.email} · ID: {u.id}</p>
                            </div>
                            {promoSettings.supportUserId === u.id && (
                              <Check size={16} className="text-[#800000] shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {showUserDropdown && !searchingUsers && userSearchQuery && userSearchResults.length === 0 && (
                      <div className="absolute top-[100%] start-0 end-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 px-4 py-3 text-sm text-zinc-400 text-center">
                        {t("noAdminUsersFound", { query: userSearchQuery })}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">{t("onlyAdminsCanBeAssigned")}</p>
                </div>

                <div className="flex items-center gap-3 mb-5 pt-5 border-t border-zinc-100">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Globe size={16} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-zinc-900">{t("socialMediaLinks")}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">{t("facebookUrl")}</label>
                    <input
                      type="url"
                      value={promoSettings.socialFacebook || ""}
                      onChange={(e) => setPromoSettings(prev => ({ ...prev, socialFacebook: e.target.value }))}
                      placeholder="https://facebook.com/mahallyjo"
                      className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-lg px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">{t("instagramUrl")}</label>
                    <input
                      type="url"
                      value={promoSettings.socialInstagram || ""}
                      onChange={(e) => setPromoSettings(prev => ({ ...prev, socialInstagram: e.target.value }))}
                      placeholder="https://instagram.com/mahallyjo"
                      className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-lg px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">{t("twitterUrl")}</label>
                    <input
                      type="url"
                      value={promoSettings.socialTwitter || ""}
                      onChange={(e) => setPromoSettings(prev => ({ ...prev, socialTwitter: e.target.value }))}
                      placeholder="https://twitter.com/mahallyjo"
                      className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-lg px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">{t("tiktokUrl")}</label>
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
