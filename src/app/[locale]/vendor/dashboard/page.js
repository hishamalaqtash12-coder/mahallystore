"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import {
  Store, Eye, EyeOff, Save, CheckCircle, AlertCircle, Loader2, Clock,
  Phone, Mail, ExternalLink, ChevronRight, LayoutGrid, Package, Settings, BarChart3,
} from "lucide-react";

export default function VendorDashboardPage() {
  const { user, loading, isVendor, vendorStatus, wooId } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Editable fields
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeCategory, setStoreCategory] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  // Redirect non-vendors
  useEffect(() => {
    if (!loading && !user) { router.replace("/login"); return; }
    if (!loading && user && !isVendor) { router.replace("/account"); return; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, isVendor]);

  // Load vendor profile
  useEffect(() => {
    if (!wooId) return;
    fetch(`/api/vendor/profile?id=${wooId}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setStoreName(data.storeName || "");
        setStoreDescription(data.storeDescription || "");
        setStoreCategory(data.storeCategory || "");
        setShowPhone(data.showPhone || false);
        setShowEmail(data.showEmail || false);
        setProfileLoading(false);
      })
      .catch(() => setProfileLoading(false));
  }, [wooId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: wooId,
          updates: { storeName, storeDescription, storeCategory, showPhone, showEmail },
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // Loading / auth gate
  if (loading || profileLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f6]">
        <div className="w-10 h-10 border-4 border-zinc-200 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  // Pending vendor — show waiting screen
  if (vendorStatus === "pending") {
    return (
      <div className="min-h-screen bg-[#f6f6f6] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-zinc-100 shadow-sm p-10 text-center space-y-5">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
            <Clock size={32} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-950">Pending Approval</h1>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            Your vendor application is being reviewed by the Mahally team.
            You'll be able to access your dashboard and list products once approved.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-end space-y-2">
            <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest">Your Application</p>
            <p className="text-sm font-bold text-zinc-800">{profile?.storeName || user.displayName}</p>
            <p className="text-[12px] text-zinc-400">{profile?.storeCategory}</p>
          </div>
          <Link href="/" className="block mt-2 text-[11px] font-black text-zinc-400 hover:text-brand uppercase tracking-widest transition-colors">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // Rejected vendor
  if (vendorStatus === "rejected") {
    return (
      <div className="min-h-screen bg-[#f6f6f6] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-zinc-100 shadow-sm p-10 text-center space-y-5">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-950">Application Not Approved</h1>
          <p className="text-sm text-zinc-500 font-medium">
            Unfortunately your vendor application was not approved at this time. Please contact Mahally support for more information.
          </p>
          <Link href="/help" className="block px-6 py-3 bg-zinc-950 text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-brand transition-all inline-block">
            Contact Support
          </Link>
        </div>
      </div>
    );
  }

  // ── Approved vendor dashboard ──
  const navItems = [
    { label: "Overview", icon: LayoutGrid, href: "#overview", active: true },
    { label: "Products", icon: Package, href: "/merchant/dashboard", active: false },
    { label: "Store Page", icon: ExternalLink, href: `/vendors/${profile?.storeSlug}`, active: false, external: true },
    { label: "Settings", icon: Settings, href: "#settings", active: false },
  ];

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      {/* Top bar */}
      <div className="bg-zinc-950 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center text-white font-black text-lg">
            {(storeName || user.displayName || "V")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Vendor Dashboard</p>
            <p className="text-sm font-black text-white leading-none">{storeName || user.displayName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {profile?.storeSlug && (
            <Link href={`/vendors/${profile.storeSlug}`} target="_blank"
              className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors">
              <ExternalLink size={13} /> View Store
            </Link>
          )}
          <span className="flex items-center gap-1.5 bg-emerald-900/50 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-800">
            <CheckCircle size={10} /> Approved
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Store Status", value: "Active", icon: "✅" },
            { label: "Store Slug", value: `/${profile?.storeSlug || "—"}`, icon: "🔗" },
            { label: "Category", value: storeCategory || "—", icon: "📦" },
            { label: "Visibility", value: "Public", icon: "👁️" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-zinc-100 p-5">
              <p className="text-2xl mb-2">{stat.icon}</p>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
              <p className="text-sm font-black text-zinc-950 truncate">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Store Profile Editor */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="px-8 pt-8 pb-4 border-b border-zinc-50">
            <h2 className="text-lg font-black italic uppercase tracking-tighter text-zinc-950">Store Profile</h2>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
              Customize what customers see on your store page
            </p>
          </div>

          {error && (
            <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
              <AlertCircle size={15} /> {error}
            </div>
          )}
          {saved && (
            <div className="mx-8 mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-xs font-bold">
              <CheckCircle size={15} /> Changes saved successfully!
            </div>
          )}

          <form onSubmit={handleSave} className="px-8 pb-8 pt-6 space-y-6">

            {/* Store Name */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Store Name</label>
              <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)}
                className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 text-[13px] font-bold text-zinc-900 focus:border-brand/30 focus:bg-white outline-none transition-all"
                placeholder="Your store name"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Business Category</label>
              <input type="text" value={storeCategory} onChange={(e) => setStoreCategory(e.target.value)}
                className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 text-[13px] font-bold text-zinc-900 focus:border-brand/30 focus:bg-white outline-none transition-all"
                placeholder="e.g. Electronics, Fashion…"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Store Description</label>
              <textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} rows={4}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 pt-4 text-[13px] font-bold text-zinc-900 focus:border-brand/30 focus:bg-white outline-none transition-all resize-none"
                placeholder="Tell customers about your store, what you sell, and why they should shop with you…"
              />
            </div>

            {/* Visibility Toggles */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest block">Contact Visibility</label>
              <p className="text-[11px] text-zinc-400">Choose what customers can see on your public store page</p>

              {[
                { label: "Show Phone Number", icon: Phone, state: showPhone, setter: setShowPhone },
                { label: "Show Email Address", icon: Mail, state: showEmail, setter: setShowEmail },
              ].map(({ label, icon: Icon, state, setter }) => (
                <button key={label} type="button" onClick={() => setter(!state)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${state ? "bg-emerald-50 border-emerald-200" : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${state ? "bg-emerald-100" : "bg-zinc-100"}`}>
                      <Icon size={15} className={state ? "text-emerald-600" : "text-zinc-400"} />
                    </div>
                    <span className={`text-[12px] font-black uppercase tracking-widest ${state ? "text-emerald-700" : "text-zinc-500"}`}>{label}</span>
                  </div>
                  <div className={`w-10 h-5.5 rounded-full transition-all flex items-center px-0.5 ${state ? "bg-emerald-500" : "bg-zinc-200"}`} style={{ height: "22px" }}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${state ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-50 flex items-center justify-between">
              {profile?.storeSlug && (
                <Link href={`/vendors/${profile.storeSlug}`} target="_blank"
                  className="text-[11px] font-black text-zinc-400 hover:text-brand transition-colors uppercase tracking-widest flex items-center gap-1.5">
                  <ExternalLink size={12} /> Preview store page
                </Link>
              )}
              <button type="submit" disabled={saving}
                className="h-12 px-8 bg-zinc-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-brand transition-all flex items-center gap-2.5 disabled:opacity-60 shadow-lg shadow-zinc-900/10">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Manage Products", desc: "Add, edit, and manage your listed products", href: "/merchant/dashboard", icon: Package, color: "brand" },
            { label: "View Your Store Page", desc: "See how customers see your store", href: `/vendors/${profile?.storeSlug || "#"}`, icon: Store, color: "emerald-600", external: true },
          ].map((item) => (
            <Link key={item.label} href={item.href} target={item.external ? "_blank" : undefined}
              className="bg-white p-6 rounded-2xl border border-zinc-100 hover:border-brand hover:shadow-lg transition-all group flex items-center gap-5">
              <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
                <item.icon size={20} className="text-zinc-500 group-hover:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black uppercase tracking-widest text-zinc-950">{item.label}</p>
                <p className="text-[11px] font-medium text-zinc-400 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-zinc-200 group-hover:text-brand shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
