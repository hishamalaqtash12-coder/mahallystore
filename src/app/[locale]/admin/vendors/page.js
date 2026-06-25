"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Store,
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import AdminSearch from "@/components/admin/AdminSearch";

const STATUS_MAP = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700" },
  approved: { label: "Approved", color: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700" },
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

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

  useEffect(() => { fetchVendors(); }, []);

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
            Verify and manage store access requests
          </p>
        </div>
        <button
          onClick={fetchVendors}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards (clickable filter tabs) */}
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
                      href={`/vendors/${v.storeSlug}`}
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
    </div>
  );
}
