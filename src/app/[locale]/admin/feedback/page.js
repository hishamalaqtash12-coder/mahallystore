"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  MessageSquare,
  Star,
  Calendar,
  User,
  Search,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Trash2,
} from "lucide-react";

export default function AdminFeedbackPage() {
  const t = useTranslations("AdminFeedback");
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState(null);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feedback");
      const data = await res.json();
      if (data.feedback) setFeedback(data.feedback);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = async (date) => {
    if (!confirm(t("removeFeedbackConfirm"))) return;
    setIsDeleting(date);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackDate: date })
      });
      if (res.ok) {
        setFeedback(prev => prev.filter(f => f.date !== date));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(null);
    }
  };

  useEffect(() => { fetchFeedback(); }, []);

  const filteredFeedback = feedback.filter((item) => {
    const matchesSearch =
      item.comment?.toLowerCase().includes(search.toLowerCase()) ||
      item.specificIssue?.toLowerCase().includes(search.toLowerCase());
    if (filter === "poor") return matchesSearch && item.rating <= 3;
    if (filter === "good") return matchesSearch && item.rating > 3;
    return matchesSearch;
  });

  const avgRating = (
    feedback.reduce((acc, curr) => acc + curr.rating, 0) / (feedback.length || 1)
  ).toFixed(1);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">{t("loadingFeedback")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("pageSubtitle")}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-center">
            <p className="text-xs font-medium text-zinc-500">{t("total")}</p>
            <p className="text-xl font-bold text-zinc-900 mt-0.5">{feedback.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-center">
            <p className="text-xs font-medium text-zinc-500">{t("avgRating")}</p>
            <div className="flex items-center gap-1.5 justify-center mt-0.5">
              <p className="text-xl font-bold text-zinc-900">{avgRating}</p>
              <Star size={14} className="text-amber-400 fill-amber-400" />
            </div>
          </div>
          <button
            onClick={fetchFeedback}
            className="h-9 w-9 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-colors"
            aria-label={t("refresh")}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 bg-white border border-zinc-200 rounded-lg pe-9 ps-4 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {["all", "poor", "good"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {f === "all" ? t("filterAll") : f === "poor" ? t("filterPoor") : t("filterGood")}
            </button>
          ))}
        </div>
      </div>

      {filteredFeedback.length > 0 ? (
        <div className="space-y-4">
          {filteredFeedback.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-zinc-200 bg-white p-6 hover:border-zinc-300 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center">
                    <User size={16} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      {item.userName || `User #${item.userId}`}
                    </p>
                    {item.userEmail && (
                      <p className="text-xs text-zinc-500 font-medium">
                        {item.userEmail}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
                      <Calendar size={11} />
                      {new Date(item.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50">
                    <span className="text-sm font-bold text-zinc-900">{item.rating}</span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={
                            i < item.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-zinc-200 fill-zinc-200"
                          }
                        />
                      ))}
                    </div>
                    {item.rating <= 2 ? (
                      <AlertTriangle size={13} className="text-red-400 me-1" />
                    ) : item.rating >= 4 ? (
                      <CheckCircle size={13} className="text-emerald-400 me-1" />
                    ) : null}
                  </div>

                  <button
                    onClick={() => handleDeleteFeedback(item.date)}
                    disabled={isDeleting === item.date}
                    className="h-9 w-9 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all disabled:opacity-50"
                    title={t("removeFeedback")}
                  >
                    {isDeleting === item.date ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                    {t("detailsLabel")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.categories?.map((cat) => (
                      <span
                        key={cat}
                        className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                    {item.specificIssue && (
                      <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium flex items-center gap-1">
                        <AlertTriangle size={10} />
                        {item.specificIssue}
                      </span>
                    )}
                  </div>
                  {item.path && (
                    <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-100 rounded-lg">
                      <span className="text-xs font-medium text-zinc-400">{t("pageLabel")}</span>
                      <span className="text-xs text-zinc-600 font-mono truncate">
                        {item.path}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                    {t("commentLabel")}
                  </p>
                  <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-lg min-h-[44px]">
                    <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                      {item.comment || t("noWrittenFeedback")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-zinc-200 bg-white">
          <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
            <MessageSquare size={20} className="text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-900">{t("noFeedbackFound")}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {search ? t("noFeedbackDescWhenSearch") : t("noFeedbackDescEmpty")}
          </p>
        </div>
      )}
    </div>
  );
}
