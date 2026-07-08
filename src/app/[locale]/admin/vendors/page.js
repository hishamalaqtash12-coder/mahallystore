"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Store,
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Star,
  LayoutGrid,
  Save,
  ToggleLeft,
  ToggleRight,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import AdminSearch from "@/components/admin/AdminSearch";

const STATUS_MAP = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700" },
  approved: { label: "Approved", color: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700" },
};

export default function AdminVendorsPage() {
  const searchParams = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(null); // "approve" | "reject" | null
  const [filter, setFilter] = useState("pending");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "carousel" ? "carousel" : "vendors"
  );

  // Carousel state
  const [featuredIds, setFeaturedIds] = useState([]);
  const [carouselSaving, setCarouselSaving] = useState(false);
  const [carouselQuery, setCarouselQuery] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchVendors = () => {
    setLoading(true);
    fetch("/api/admin/vendors")
      .then((r) => r.json())
      .then((data) => {
        setVendors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  // Load current featured IDs
  const fetchFeatured = () => {
    fetch("/api/admin/featured-vendors")
      .then((r) => r.json())
      .then((data) => setFeaturedIds(data.featuredIds || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchVendors();
    fetchFeatured();
  }, []);

  const handleAction = async (vendorId, action, plan = null) => {
    if (action === "change_plan") {
      if (!confirm(`Are you sure you want to change this vendor's plan to ${plan}?`)) return;
    }
    setActionLoading(vendorId);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, action, plan }),
      });
      const data = await res.json();
      if (data.success) {
        setVendors((prev) =>
          prev.map((v) => {
            if (v.id === vendorId) {
              if (action === "change_plan") return { ...v, membershipPlan: data.plan };
              return { ...v, status: data.status };
            }
            return v;
          })
        );
        showToast(
          action === "approve" ? "Vendor approved successfully" :
          action === "reject" ? "Vendor access revoked" : "Membership plan updated",
          action === "reject" ? "error" : "success"
        );
      }
    } catch {
      showToast("Action failed. Please try again.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action) => {
    const targets = filtered.filter((v) =>
      action === "approve" ? v.status !== "approved" : v.status !== "rejected"
    );
    if (targets.length === 0) {
      showToast("No vendors to update in the current filter.", "error");
      return;
    }
    const label = action === "approve" ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${label} all ${targets.length} vendor(s) shown?`)) return;

    setBulkLoading(action);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorIds: targets.map((v) => v.id), action }),
      });
      const data = await res.json();
      if (data.success) {
        const newStatus = action === "approve" ? "approved" : "rejected";
        setVendors((prev) =>
          prev.map((v) =>
            targets.find((t) => t.id === v.id) ? { ...v, status: newStatus } : v
          )
        );
        showToast(
          `Done! ${data.succeeded} vendor(s) ${action === "approve" ? "activated" : "deactivated"}${
            data.failed > 0 ? `, ${data.failed} failed` : ""
          }.`,
          data.failed > 0 ? "error" : "success"
        );
      } else {
        showToast("Bulk action failed. Please try again.", "error");
      }
    } catch {
      showToast("Bulk action failed. Please try again.", "error");
    } finally {
      setBulkLoading(null);
    }
  };

  const saveFeatured = async () => {
    setCarouselSaving(true);
    try {
      const res = await fetch("/api/admin/featured-vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featuredIds }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Saved! ${featuredIds.length} vendor${featuredIds.length !== 1 ? "s" : ""} will appear in the carousel.`);
      } else {
        showToast("Failed to save carousel selection.", "error");
      }
    } catch {
      showToast("Failed to save carousel selection.", "error");
    } finally {
      setCarouselSaving(false);
    }
  };

  const toggleFeatured = (id) => {
    setFeaturedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const matchStatus = filter === "all" || v.status === filter;
      const matchQuery =
        !query ||
        v.name?.toLowerCase().includes(query.toLowerCase()) ||
        v.storeName?.toLowerCase().includes(query.toLowerCase()) ||
        v.email?.toLowerCase().includes(query.toLowerCase());
      return matchStatus && matchQuery;
    });
  }, [vendors, filter, query]);

  const counts = useMemo(() => ({
    all: vendors.length,
    pending: vendors.filter((v) => v.status === "pending").length,
    approved: vendors.filter((v) => v.status === "approved").length,
    rejected: vendors.filter((v) => v.status === "rejected").length,
  }), [vendors]);

  // Only approved vendors can be featured in carousel
  const approvedVendors = useMemo(() =>
    vendors.filter((v) => v.status === "approved"),
    [vendors]
  );

  const filteredCarousel = useMemo(() =>
    approvedVendors.filter((v) =>
      !carouselQuery ||
      v.storeName?.toLowerCase().includes(carouselQuery.toLowerCase()) ||
      v.name?.toLowerCase().includes(carouselQuery.toLowerCase())
    ),
    [approvedVendors, carouselQuery]
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 start-6 z-[100] px-5 py-3 rounded-xl text-sm font-medium shadow-lg animate-in slide-in-from-start-4 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Vendors</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Verify, manage, and curate vendor visibility
          </p>
        </div>
        <button
          onClick={() => { fetchVendors(); fetchFeatured(); }}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("vendors")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "vendors"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Store size={15} />
          All Vendors
        </button>
        <button
          onClick={() => setActiveTab("carousel")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "carousel"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <LayoutGrid size={15} />
          Homepage Carousel
          {featuredIds.length > 0 && (
            <span className="bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {featuredIds.length}
            </span>
          )}
        </button>
      </div>

      {/* ===== VENDORS TAB ===== */}
      {activeTab === "vendors" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: "all", label: "All Vendors", icon: Store },
              { key: "pending", label: "Pending", icon: Clock },
              { key: "approved", label: "Approved", icon: ShieldCheck },
              { key: "rejected", label: "Rejected", icon: XCircle },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setFilter(s.key)}
                className={`rounded-xl border p-4 text-end transition-colors ${
                  filter === s.key
                    ? "bg-zinc-900 border-zinc-900 text-white"
                    : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <s.icon
                    size={16}
                    className={filter === s.key ? "text-zinc-300" : "text-zinc-400"}
                  />
                  <span
                    className={`text-2xl font-bold ${
                      filter === s.key ? "text-white" : "text-zinc-900"
                    }`}
                  >
                    {counts[s.key]}
                  </span>
                </div>
                <p
                  className={`text-xs font-medium ${
                    filter === s.key ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  {s.label}
                </p>
              </button>
            ))}
          </div>

          {/* Search */}
          <AdminSearch
            placeholder="Search vendors by name, store, or email..."
            value={query}
            onChange={setQuery}
          />

          {/* Bulk Actions Bar */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-zinc-600 me-auto">
                <Users size={15} className="text-zinc-400" />
                <span>
                  <strong className="text-zinc-900">{filtered.length}</strong> vendor{filtered.length !== 1 ? "s" : ""} shown
                </span>
              </div>
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider hidden sm:block">Bulk:</span>
              <button
                onClick={() => handleBulkAction("approve")}
                disabled={bulkLoading !== null || filtered.every((v) => v.status === "approved")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {bulkLoading === "approve" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ToggleRight size={14} />
                )}
                Activate All
              </button>
              <button
                onClick={() => handleBulkAction("reject")}
                disabled={bulkLoading !== null || filtered.every((v) => v.status === "rejected")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {bulkLoading === "reject" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ToggleLeft size={14} />
                )}
                Deactivate All
              </button>
            </div>
          )}

          {/* Vendor List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              <p className="text-sm text-zinc-500">Loading vendors...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-zinc-200 bg-white">
              <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <Store size={20} className="text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-900">No vendors found</p>
              <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters</p>
              <button
                onClick={() => { setFilter("all"); setQuery(""); }}
                className="mt-4 px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((v) => {
                const st = STATUS_MAP[v.status] || STATUS_MAP.pending;
                const isActioning = actionLoading === v.id;
                return (
                  <div
                    key={v.id}
                    className="rounded-xl border border-zinc-200 bg-white p-5 flex flex-col lg:flex-row lg:items-center gap-5 hover:border-zinc-300 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 font-semibold text-base shrink-0">
                      {v.storeName?.[0]?.toUpperCase() || v.name?.[0]?.toUpperCase() || "?"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-900">
                          {v.storeName || v.name}
                        </p>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${st.color}`}>
                          {st.label}
                        </span>
                        {featuredIds.includes(v.id) && (
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                            ★ In Carousel
                          </span>
                        )}
                        <select
                          value={v.membershipPlan || "free"}
                          onChange={(e) => handleAction(v.id, "change_plan", e.target.value)}
                          disabled={isActioning}
                          className="me-2 border border-zinc-200 rounded-md text-xs py-0.5 px-2 bg-zinc-50 focus:outline-none focus:border-zinc-400"
                        >
                          <option value="free">Free</option>
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <Store size={12} className="text-zinc-400" />
                          {v.storeCategory || "General"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Mail size={12} className="text-zinc-400" />
                          {v.email}
                        </span>
                        {v.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone size={12} className="text-zinc-400" />
                            {v.phone}
                          </span>
                        )}
                      </div>
                      {v.storeDescription && (
                        <p className="text-xs text-zinc-400 italic line-clamp-1">
                          "{v.storeDescription}"
                        </p>
                      )}
                      <p className="text-xs text-zinc-400">
                        Applied:{" "}
                        {v.dateCreated
                          ? new Date(v.dateCreated).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {v.status !== "approved" && (
                        <button
                          onClick={() => handleAction(v.id, "approve")}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                          {isActioning ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <CheckCircle size={12} />
                          )}
                          Approve
                        </button>
                      )}
                      {v.status !== "rejected" && (
                        <button
                          onClick={() => handleAction(v.id, "reject")}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
                        >
                          {isActioning ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <XCircle size={12} />
                          )}
                          Reject
                        </button>
                      )}
                      {v.status === "approved" && v.storeSlug && (
                        <Link
                          href={`/vendor/${v.storeSlug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                        >
                          View Store <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== CAROUSEL TAB ===== */}
      {activeTab === "carousel" && (
        <div className="space-y-5">
          {/* Info Banner */}
          <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 flex items-start gap-3">
            <LayoutGrid size={18} className="text-brand mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-zinc-900">Homepage Carousel Control</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Select which <strong>approved</strong> vendors appear in the homepage stores carousel.
                Only the vendors you check below will be shown. Changes take effect immediately after saving.
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-4 py-2.5">
              <ShieldCheck size={15} className="text-emerald-500" />
              <span className="text-sm text-zinc-600"><strong className="text-zinc-900">{approvedVendors.length}</strong> approved vendors</span>
            </div>
            <div className="flex items-center gap-2 bg-white border border-brand/30 rounded-lg px-4 py-2.5">
              <Star size={15} className="text-brand" />
              <span className="text-sm text-zinc-600"><strong className="text-zinc-900">{featuredIds.length}</strong> selected for carousel</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search approved vendors..."
              value={carouselQuery}
              onChange={(e) => setCarouselQuery(e.target.value)}
              className="w-full ps-9 pe-4 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setFeaturedIds(approvedVendors.map(v => v.id))}
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50"
            >
              Select All
            </button>
            <button
              onClick={() => setFeaturedIds([])}
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50"
            >
              Deselect All
            </button>
          </div>

          {/* Vendor Checklist */}
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              <p className="text-sm text-zinc-500">Loading vendors...</p>
            </div>
          ) : approvedVendors.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-zinc-200 bg-white">
              <ShieldCheck size={32} className="mx-auto text-zinc-300 mb-3" />
              <p className="text-sm font-medium text-zinc-900">No approved vendors yet</p>
              <p className="text-xs text-zinc-500 mt-1">Approve vendors from the All Vendors tab first</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCarousel.map((v) => {
                const isSelected = featuredIds.includes(v.id);
                return (
                  <button
                    key={v.id}
                    onClick={() => toggleFeatured(v.id)}
                    className={`relative flex items-center gap-3 p-4 rounded-xl border text-start transition-all ${
                      isSelected
                        ? "border-brand bg-brand/5 shadow-sm"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      isSelected ? "bg-brand text-white" : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {v.storeName?.[0]?.toUpperCase() || v.name?.[0]?.toUpperCase() || "?"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-zinc-900" : "text-zinc-700"}`}>
                        {v.storeName || v.name}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">{v.storeCategory || "General Store"}</p>
                    </div>

                    {/* Checkbox indicator */}
                    <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? "bg-brand border-brand" : "border-zinc-300"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Hidden badge */}
                    {!isSelected && (
                      <span className="absolute top-2 end-2 text-[9px] font-bold text-zinc-300 uppercase tracking-wider">hidden</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Save Button */}
          <div className="sticky bottom-4 flex justify-end pt-4">
            <button
              onClick={saveFeatured}
              disabled={carouselSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand/90 active:scale-95 transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
            >
              {carouselSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {carouselSaving ? "Saving..." : `Save Carousel (${featuredIds.length} selected)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
