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
  Search,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import AdminSearch from "@/components/admin/AdminSearch";
import VisibilityControlTab from "@/components/admin/VisibilityControlTab";
import { useLocale, useTranslations } from "next-intl";

const STATUS_MAP = {
  pending: { color: "bg-amber-50 text-amber-700" },
  approved: { color: "bg-emerald-50 text-emerald-700" },
  rejected: { color: "bg-red-50 text-red-700" },
};

export default function AdminVendorsPage() {
  const t = useTranslations("AdminVendors");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const searchParams = useSearchParams();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "visibility" ? "visibility" : "vendors"
  );

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

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleAction = async (vendorId, action, plan = null) => {
    setActionLoading(`${action}-${vendorId}`);
    if (action === "change_plan") {
      if (!confirm(t("confirmChangePlan", { plan }))) {
        setActionLoading(null);
        return;
      }
    }
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
          action === "approve"
            ? t("vendorApproved")
            : action === "reject"
              ? t("vendorRejected")
              : t("planUpdated"),
          action === "reject" ? "error" : "success"
        );
      }
    } catch {
      showToast(t("actionFailed"), "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action) => {
    const targets = filtered.filter((v) =>
      action === "approve" ? v.status !== "approved" : v.status !== "rejected"
    );
    if (targets.length === 0) {
      showToast(t("noVendorsToUpdate"), "error");
      return;
    }
    const label = action === "approve" ? t("activate") : t("deactivate");
    if (!confirm(t("confirmBulk", { action: label, count: targets.length }))) return;

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
            targets.find((tg) => tg.id === v.id) ? { ...v, status: newStatus } : v
          )
        );
        showToast(
          t("bulkDone", {
            succeeded: data.succeeded,
            action: action === "approve" ? t("activated") : t("deactivated"),
            failed: data.failed > 0 ? t("bulkFailedPart", { failed: data.failed }) : "",
          }),
          data.failed > 0 ? "error" : "success"
        );
      } else {
        showToast(t("bulkFailed"), "error");
      }
    } catch {
      showToast(t("bulkFailed"), "error");
    } finally {
      setBulkLoading(null);
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

  const counts = useMemo(
    () => ({
      all: vendors.length,
      pending: vendors.filter((v) => v.status === "pending").length,
      approved: vendors.filter((v) => v.status === "approved").length,
      rejected: vendors.filter((v) => v.status === "rejected").length,
    }),
    [vendors]
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return t("unknownLabel");
    return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-GB");
  };

  return (
    <div className="space-y-6 sm:space-y-8" dir={dir}>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 start-6 z-[100] px-5 py-3 rounded-xl text-sm font-medium shadow-lg animate-in slide-in-from-start-4 duration-300 ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
            }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("pageSubtitle")}</p>
        </div>
        <button
          onClick={() => {
            fetchVendors();
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {t("refresh")}
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("vendors")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "vendors"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          <Store size={15} />
          {t("vendorsTab")}
        </button>
        <button
          onClick={() => setActiveTab("visibility")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "visibility"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          <LayoutGrid size={15} />
          {t("visibilityTab")}
        </button>
      </div>

      {/* ===== VENDORS TAB ===== */}
      {activeTab === "vendors" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: "all", label: t("allVendors"), icon: Store },
              { key: "pending", label: t("pending"), icon: Clock },
              { key: "approved", label: t("approved"), icon: ShieldCheck },
              { key: "rejected", label: t("rejected"), icon: XCircle },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setFilter(s.key)}
                className={`rounded-xl border p-4 text-end transition-colors ${filter === s.key
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
                    className={`text-2xl font-bold ${filter === s.key ? "text-white" : "text-zinc-900"
                      }`}
                  >
                    {counts[s.key]}
                  </span>
                </div>
                <p
                  className={`text-xs font-medium ${filter === s.key ? "text-zinc-400" : "text-zinc-500"
                    }`}
                >
                  {s.label}
                </p>
              </button>
            ))}
          </div>

          {/* Search */}
          <AdminSearch
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={setQuery}
          />

          {/* Bulk Actions Bar */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-zinc-600 me-auto">
                <Users size={15} className="text-zinc-400" />
                <span>
                  <strong className="text-zinc-900">{filtered.length}</strong>{" "}
                  {t("vendorsShown", { count: filtered.length })}
                </span>
              </div>
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider hidden sm:block">
                {t("bulk")}:
              </span>
              <button
                onClick={() => handleBulkAction("approve")}
                disabled={
                  bulkLoading !== null || filtered.every((v) => v.status === "approved")
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {bulkLoading === "approve" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ToggleRight size={14} />
                )}
                {t("bulkApprove")}
              </button>
              <button
                onClick={() => handleBulkAction("reject")}
                disabled={
                  bulkLoading !== null || filtered.every((v) => v.status === "rejected")
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {bulkLoading === "reject" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ToggleLeft size={14} />
                )}
                {t("bulkReject")}
              </button>
            </div>
          )}

          {/* Vendor List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              <p className="text-sm text-zinc-500">{t("loadingVendors")}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-zinc-200 bg-white">
              <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <Store size={20} className="text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-900">{t("noVendorsFound")}</p>
              <p className="text-xs text-zinc-500 mt-1">{t("tryAdjustFilters")}</p>
              <button
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
              >
                {t("clearFilters")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((v) => {
                const st = STATUS_MAP[v.status] || STATUS_MAP.pending;
                const isApproving = actionLoading === `approve-${v.id}`;
                const isRejecting = actionLoading === `reject-${v.id}`;
                const isActioning = actionLoading?.includes(v.id);
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
                          {t(v.status)}
                        </span>

                        <select
                          value={v.membershipPlan || "free"}
                          onChange={(e) => handleAction(v.id, "change_plan", e.target.value)}
                          disabled={isActioning}
                          className="me-2 border border-zinc-200 rounded-md text-xs py-0.5 px-2 bg-zinc-50 focus:outline-none focus:border-zinc-400"
                        >
                          <option value="free">{t("planFree")}</option>
                          <option value="silver">{t("planSilver")}</option>
                          <option value="gold">{t("planGold")}</option>
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <Store size={12} className="text-zinc-400" />
                          {v.storeCategory || t("general")}
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
                        {t("appliedLabel")} {formatDate(v.dateCreated)}
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
                          {isApproving ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <CheckCircle size={12} />
                          )}
                          {t("approve")}
                        </button>
                      )}
                      {v.status !== "rejected" && (
                        <button
                          onClick={() => handleAction(v.id, "reject")}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
                        >
                          {isRejecting ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {t("reject")}
                        </button>
                      )}
                      {v.status === "approved" && v.storeSlug && (
                        <Link
                          href={`/vendor/${v.storeSlug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                        >
                          {t("viewStore")} <ArrowRight size={12} />
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

      {/* ===== VISIBILITY TAB ===== */}
      {activeTab === "visibility" && <VisibilityControlTab />}
    </div>
  );
}