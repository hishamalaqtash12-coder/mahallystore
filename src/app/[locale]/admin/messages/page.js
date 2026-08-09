"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  MessageSquare,
  Search,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  X,
  Users,
  ChevronRight,
  Shield,
  Filter,
  ArrowRight,
  Clock,
  Download,
  Flame,
  CheckCircle,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts, t) {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return t("justNow");
  if (diff < 3600) return t("minutesAgo", { count: Math.floor(diff / 60) });
  if (diff < 86400) return t("hoursAgo", { count: Math.floor(diff / 3600) });
  return t("daysAgo", { count: Math.floor(diff / 86400) });
}

function formatDate(ts, locale) {
  if (!ts) return "";
  return new Date(ts).toLocaleString(locale === "ar" ? "ar-JO" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Avatar({ name, avatar, size = 32, className = "" }) {
  const initials = (name || "?")[0]?.toUpperCase();
  const colors = ["#be374f", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return avatar ? (
    <img
      src={avatar}
      alt={name}
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 ${className}`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

// ── Export to CSV ────────────────────────────────────────────────────────────

function exportToCSV(threads, t, locale) {
  const rows = [
    [
      t("csvFromUser"),
      t("csvFromRole"),
      t("csvFromEmail"),
      t("csvToUser"),
      t("csvToRole"),
      t("csvToEmail"),
      t("csvMessage"),
      t("csvDateTime"),
      t("csvStatus"),
    ],
  ];

  threads.forEach((thread) => {
    thread.messages.forEach((msg) => {
      const isSenderA = String(msg.senderId) === String(thread.userA?.id);
      const sender = isSenderA ? thread.userA : thread.userB;
      const receiver = isSenderA ? thread.userB : thread.userA;
      rows.push([
        sender?.name || "",
        sender?.role || "",
        sender?.email || "",
        receiver?.name || "",
        receiver?.role || "",
        receiver?.email || "",
        msg.isDeleted ? t("deleted") : msg.text || "",
        formatDate(msg.timestamp, locale),
        msg.isDeleted ? t("statusDeleted") : t("statusActive"),
      ]);
    });
  });

  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mahally_messages_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Single Message Delete Modal ──────────────────────────────────────────────

function DeleteModal({ message, thread, onConfirm, onCancel, loading, t }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-red-50 border-b border-red-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900">{t("deleteMessage")}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">{t("cannotBeUndone")}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-zinc-700 mb-4">{t("deleteWarning")}</p>
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wider">
              {t("messageContent")}
            </p>
            <p className="text-sm text-zinc-800 line-clamp-3 italic">
              “{message?.isDeleted ? t("alreadyDeleted") : message?.text}”
            </p>
            <p className="text-xs text-zinc-400 mt-2">
              {t("between")}: <strong>{thread?.userA?.name}</strong> &amp;{" "}
              <strong>{thread?.userB?.name}</strong>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 h-10 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {t("deleteMessage")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Master Purge Modal ───────────────────────────────────────────────────────

const CONFIRM_PHRASE = "permanently delete";

function MasterPurgeModal({ threads, onClose, onPurgeComplete, t, locale }) {
  const [step, setStep] = useState(1);
  const [phrase, setPhrase] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [purging, setPurging] = useState(false);

  const totalMessages = threads.reduce((s, th) => s + th.messages.length, 0);
  const totalThreads = threads.length;

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      exportToCSV(threads, t, locale);
      setDownloading(false);
      setDownloaded(true);
    }, 600);
  };

  const handlePurge = async () => {
    if (phrase !== CONFIRM_PHRASE) return;
    setPurging(true);
    try {
      const res = await fetch("/api/admin/messages/purge-all", { method: "DELETE" });
      if (!res.ok) throw new Error("Purge failed");
      onPurgeComplete();
    } catch (e) {
      alert(t("purgeFailed") + ": " + e.message);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-950 to-red-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 end-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
              <Flame size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg">{t("masterPurgeTitle")}</h2>
              <p className="text-xs text-white/70">{t("masterPurgeSubtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center transition-all ${step > s
                      ? "bg-emerald-500 text-white"
                      : step === s
                        ? "bg-white text-zinc-900"
                        : "bg-white/20 text-white/60"
                    }`}
                >
                  {step > s ? <CheckCircle size={13} /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-px flex-1 w-8 transition-all ${step > s ? "bg-emerald-500" : "bg-white/20"
                      }`}
                  />
                )}
              </div>
            ))}
            <span className="text-xs text-white/60 ms-2">
              {step === 1
                ? t("stepOverview")
                : step === 2
                  ? t("stepDownload")
                  : t("stepConfirm")}
            </span>
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-800 mb-1">{t("irreversible")}</p>
                  <p className="text-xs text-red-700 leading-relaxed">{t("irreversibleDesc")}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-zinc-900">
                  {totalThreads.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 font-semibold mt-1">
                  {t("conversationThreads")}
                </p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-zinc-900">
                  {totalMessages.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 font-semibold mt-1">{t("totalMessages")}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-500 mb-5 leading-relaxed">{t("nextStepNote")}</p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 h-11 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
              >
                {t("continue")} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="p-6">
            <p className="text-sm font-bold text-zinc-900 mb-1">{t("downloadBackup")}</p>
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed">{t("downloadBackupDesc")}</p>

            <div className="border border-dashed border-zinc-300 rounded-2xl p-6 text-center mb-5 bg-zinc-50">
              <div
                className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all ${downloaded ? "bg-emerald-100" : "bg-blue-100"
                  }`}
              >
                {downloaded ? (
                  <CheckCircle size={22} className="text-emerald-600" />
                ) : (
                  <Download size={22} className="text-blue-600" />
                )}
              </div>
              <p className="text-sm font-bold text-zinc-900 mb-1">
                {downloaded ? t("backupDownloaded") : "mahally_messages.csv"}
              </p>
              <p className="text-xs text-zinc-500 mb-4">
                {downloaded
                  ? t("backupSaved")
                  : t("messagesAcrossThreads", {
                    messages: totalMessages.toLocaleString(),
                    threads: totalThreads.toLocaleString(),
                  })}
              </p>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={`h-10 px-6 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto transition-colors ${downloaded
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                  } disabled:opacity-50`}
              >
                {downloading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                {downloaded ? t("downloadAgain") : t("downloadCsv")}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 h-11 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                {t("back")}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!downloaded}
                className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {!downloaded ? (
                  t("downloadFirst")
                ) : (
                  <>
                    {t("proceedToDelete")} <Flame size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
              <Flame size={16} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 leading-relaxed">
                {t("finalWarning", { count: totalMessages.toLocaleString() })}
              </p>
            </div>

            <p className="text-sm font-bold text-zinc-900 mb-2">{t("typePhrase")}</p>
            <div className="bg-zinc-100 rounded-lg px-3 py-2 mb-3 font-mono text-sm text-zinc-700 font-bold tracking-wide">
              {CONFIRM_PHRASE}
            </div>

            <input
              type="text"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={t("typePhrasePlaceholder")}
              className={`w-full h-11 border rounded-xl px-4 text-sm outline-none transition-all mb-5 ${phrase === CONFIRM_PHRASE
                  ? "border-red-500 ring-2 ring-red-200 bg-red-50 text-red-900 font-bold"
                  : "border-zinc-300 focus:border-zinc-500"
                }`}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 h-11 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                {t("back")}
              </button>
              <button
                onClick={handlePurge}
                disabled={phrase !== CONFIRM_PHRASE || purging}
                className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-black hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {purging ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> {t("deleting")}
                  </>
                ) : (
                  <>
                    <Flame size={14} /> {t("purgeAll")}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AdminMessagesPage() {
  const t = useTranslations("AdminMessages");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const messagesEndRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/messages");
      if (!res.ok) throw new Error(t("failedToLoad"));
      const data = await res.json();
      setThreads(data.threads || []);
      if (selectedThread) {
        const updated = (data.threads || []).find((th) => th.id === selectedThread.id);
        if (updated) setSelectedThread(updated);
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedThread) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread]);

  const filteredThreads = useMemo(() => {
    return threads.filter((th) => {
      const q = search.toLowerCase();
      const nameA = (th.userA?.name || "").toLowerCase();
      const nameB = (th.userB?.name || "").toLowerCase();
      const matchesSearch =
        !q ||
        nameA.includes(q) ||
        nameB.includes(q) ||
        th.messages.some((m) => (m.text || "").toLowerCase().includes(q));
      const matchesRole =
        filterRole === "all" ||
        th.userA?.role === filterRole ||
        th.userB?.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [threads, search, filterRole]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const { message, thread } = deleteTarget;
      const res = await fetch("/api/messages/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: thread.userA.id,
          otherId: thread.userB.id,
          messageId: message.id,
        }),
      });
      if (!res.ok) throw new Error(t("deleteFailed"));
      showToast(t("deleteSuccess"));
      setDeleteTarget(null);
      await fetchData(true);
    } catch (e) {
      showToast(t("deleteFailed"), "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePurgeComplete = async () => {
    setShowPurgeModal(false);
    setSelectedThread(null);
    showToast(t("purgeSuccess"), "success");
    await fetchData(true);
  };

  const totalMessages = threads.reduce((s, th) => s + th.messages.length, 0);
  const deletedMessages = threads.reduce(
    (s, th) => s + th.messages.filter((m) => m.isDeleted).length,
    0
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3" dir={dir}>
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">{t("loadingThreads")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative" dir={dir}>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 end-6 z-[100] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl animate-in slide-in-from-right-4 duration-300 ${toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
            }`}
        >
          {toast.msg}
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          message={deleteTarget.message}
          thread={deleteTarget.thread}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
          t={t}
        />
      )}

      {showPurgeModal && (
        <MasterPurgeModal
          threads={threads}
          onClose={() => setShowPurgeModal(false)}
          onPurgeComplete={handlePurgeComplete}
          t={t}
          locale={locale}
        />
      )}

      {/* Header */}
      <div className="rounded-[28px] border border-zinc-200 bg-gradient-to-br from-zinc-950 via-zinc-900 to-[#be374f] p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
              <Shield size={11} /> {t("moderationCenter")}
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              {t("pageTitle")}
            </h1>
            <p className="mt-2 text-sm text-zinc-300">{t("pageSubtitle")}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportToCSV(threads, t, locale)}
              className="h-10 px-4 rounded-xl border border-white/15 bg-white/10 flex items-center gap-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              <Download size={14} /> {t("exportCsv")}
            </button>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="h-10 px-4 rounded-xl border border-white/15 bg-white/10 flex items-center gap-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />{" "}
              {t("refresh")}
            </button>
            <button
              onClick={() => setShowPurgeModal(true)}
              className="h-10 px-4 rounded-xl bg-red-600 border border-red-500 flex items-center gap-2 text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-900/30"
            >
              <Flame size={14} /> {t("purgeAllMessages")}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: t("totalThreads"),
            value: threads.length,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: t("totalMessages"),
            value: totalMessages,
            icon: MessageSquare,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: t("deletedMessages"),
            value: deletedMessages,
            icon: Trash2,
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            label: t("activeThreads"),
            value: threads.filter((th) => th.messages.some((m) => !m.isDeleted)).length,
            icon: ArrowRight,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {s.label}
              </p>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon size={15} className={s.color} />
              </div>
            </div>
            <p className="text-2xl font-black text-zinc-900">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Main Panel */}
      <div
        className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden"
        style={{ minHeight: 600 }}
      >
        <div className="flex" style={{ height: 680 }}>
          {/* Thread List */}
          <div className="w-full lg:w-[380px] flex-shrink-0 border-e border-zinc-100 flex flex-col">
            <div className="p-4 border-b border-zinc-100 space-y-3">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-xl ps-9 pe-3 text-sm outline-none focus:border-[#be374f] transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Filter size={12} className="text-zinc-400 shrink-0" />
                <div className="flex gap-1">
                  {["all", "vendor", "customer"].map((role) => (
                    <button
                      key={role}
                      onClick={() => setFilterRole(role)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize transition-colors ${filterRole === role
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                    >
                      {t(`role_${role}`)}
                    </button>
                  ))}
                </div>
                <span className="ms-auto text-xs text-zinc-400">
                  {t("threadsCount", { count: filteredThreads.length })}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                  <MessageSquare size={32} className="text-zinc-200 mb-3" />
                  <p className="text-sm font-semibold text-zinc-500">{t("noThreads")}</p>
                  <p className="text-xs text-zinc-400 mt-1">{t("adjustSearch")}</p>
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const lastMsg = thread.messages[thread.messages.length - 1];
                  const isActive = selectedThread?.id === thread.id;
                  const undeleted = thread.messages.filter((m) => !m.isDeleted).length;
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full text-start px-4 py-3.5 border-b border-zinc-50 transition-all flex items-start gap-3 ${isActive
                          ? "bg-[#be374f]/5 border-e-2 border-e-[#be374f]"
                          : "hover:bg-zinc-50"
                        }`}
                    >
                      <div className="relative flex shrink-0">
                        <Avatar
                          name={thread.userA?.name}
                          avatar={thread.userA?.avatar}
                          size={34}
                        />
                        <Avatar
                          name={thread.userB?.name}
                          avatar={thread.userB?.avatar}
                          size={24}
                          className="-ms-2 border-2 border-white self-end"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-bold text-zinc-900 truncate">
                            {thread.userA?.name}
                            <span className="text-zinc-400 font-normal mx-1">↔</span>
                            {thread.userB?.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 shrink-0">
                            {timeAgo(thread.lastTimestamp, t)}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {lastMsg?.isDeleted
                            ? t("deleted")
                            : lastMsg?.text || t("noMessages")}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-zinc-400">
                            {t("messagesCount", { count: undeleted })}
                          </span>
                          {thread.messages.some((m) => m.isDeleted) && (
                            <span className="text-[10px] text-red-400">
                              •{" "}
                              {t("deletedCount", {
                                count: thread.messages.filter((m) => m.isDeleted).length,
                              })}
                            </span>
                          )}
                          {(thread.userA?.role === "vendor" ||
                            thread.userB?.role === "vendor") && (
                              <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full font-semibold">
                                {t("role_vendor")}
                              </span>
                            )}
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`shrink-0 mt-1 ${isActive ? "text-[#be374f]" : "text-zinc-300"
                          }`}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Message View */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedThread ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                  <Shield size={28} className="text-zinc-300" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 mb-1">
                  {t("selectConversation")}
                </h3>
                <p className="text-sm text-zinc-500 max-w-xs">{t("selectConversationDesc")}</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                    <div className="flex items-center gap-1 bg-zinc-50 rounded-xl border border-zinc-200 px-3 py-2">
                      <Avatar
                        name={selectedThread.userA?.name}
                        avatar={selectedThread.userA?.avatar}
                        size={24}
                      />
                      <div className="ms-1">
                        <p className="text-[12px] font-bold text-zinc-900 leading-none">
                          {selectedThread.userA?.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 capitalize mt-0.5">
                          {selectedThread.userA?.role}
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-zinc-400 shrink-0" />
                    <div className="flex items-center gap-1 bg-zinc-50 rounded-xl border border-zinc-200 px-3 py-2">
                      <Avatar
                        name={selectedThread.userB?.name}
                        avatar={selectedThread.userB?.avatar}
                        size={24}
                      />
                      <div className="ms-1">
                        <p className="text-[12px] font-bold text-zinc-900 leading-none">
                          {selectedThread.userB?.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 capitalize mt-0.5">
                          {selectedThread.userB?.role}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 bg-zinc-100 rounded-full px-3 py-1 font-semibold shrink-0">
                    {t("messagesCount", {
                      count: selectedThread.messages.filter((m) => !m.isDeleted).length,
                    })}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 bg-[#fafafa]">
                  {selectedThread.messages.map((msg, i) => {
                    const isSenderA =
                      String(msg.senderId) === String(selectedThread.userA?.id);
                    const sender = isSenderA ? selectedThread.userA : selectedThread.userB;
                    return (
                      <div
                        key={msg.id || i}
                        id={`admin-message-${msg.id}`}
                        className={`flex gap-3 group ${isSenderA ? "" : "flex-row-reverse"}`}
                      >
                        <Avatar
                          name={sender?.name}
                          avatar={sender?.avatar}
                          size={28}
                          className="mt-1 shrink-0"
                        />
                        <div
                          className={`max-w-[65%] flex flex-col gap-1 ${isSenderA ? "" : "items-end"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-zinc-500">
                              {sender?.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                              <Clock size={9} />{" "}
                              {msg.timestamp
                                ? formatDate(msg.timestamp, locale)
                                : msg.time || ""}
                            </span>
                          </div>
                          <div
                            className={`relative flex items-start gap-2 ${isSenderA ? "" : "flex-row-reverse"
                              }`}
                          >
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${msg.isDeleted
                                  ? "bg-zinc-100 text-zinc-400 italic border border-zinc-200"
                                  : isSenderA
                                    ? "bg-white text-zinc-900 border border-zinc-200 shadow-sm"
                                    : "bg-[#be374f] text-white"
                                }`}
                            >
                              {msg.isDeleted ? (
                                <span className="flex items-center gap-1.5">
                                  <Trash2 size={11} /> {t("messageDeleted")}
                                </span>
                              ) : (
                                <>
                                  {msg.replyTo && (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!msg.replyTo.id) return;
                                        const el = document.getElementById(`admin-message-${msg.replyTo.id}`);
                                        if (el) {
                                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                                          el.classList.add("ring-2", "ring-offset-2", "ring-amber-400", "transition-all", "duration-500");
                                          setTimeout(() => {
                                            el.classList.remove("ring-2", "ring-offset-2", "ring-amber-400");
                                          }, 2000);
                                        }
                                      }}
                                      className={`mb-2 p-2 rounded-lg text-xs cursor-pointer active:scale-[0.98] transition-all border-s-2 ${
                                        !isSenderA
                                          ? "bg-white/10 border-white/40 hover:bg-white/20 text-white"
                                          : "bg-black/5 border-zinc-300 hover:bg-black/10 text-zinc-600"
                                      }`}
                                    >
                                      <div className={`font-semibold mb-0.5 ${!isSenderA ? "text-white/80" : "text-[#be374f]"}`}>
                                        {locale === "ar" ? "رد على رسالة" : "Reply to message"}
                                      </div>
                                      <div className="line-clamp-1 opacity-90">{msg.replyTo.text}</div>
                                    </div>
                                  )}
                                  {msg.mediaUrl && (
                                    <div className="mb-2">
                                      {msg.mediaType === "image" ? (
                                        <img
                                          src={msg.mediaUrl}
                                          alt="media"
                                          className="max-w-[200px] rounded-lg"
                                        />
                                      ) : (
                                        <a
                                          href={msg.mediaUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="underline text-xs opacity-80"
                                        >
                                          {t("attachment")}
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  {msg.text}
                                </>
                              )}
                            </div>
                            {!msg.isDeleted && (
                              <button
                                onClick={() =>
                                  setDeleteTarget({ message: msg, thread: selectedThread })
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600 mt-1 shrink-0"
                                title={t("deleteThisMessage")}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-zinc-100 px-6 py-3 bg-white flex items-center gap-3 shrink-0">
                  <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                    <Shield size={12} className="text-amber-600" />
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    <span className="font-bold text-amber-700">{t("adminViewOnly")}</span>{" "}
                    {t("adminViewNote")}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}