"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Megaphone,
  Calendar,
  Clock,
  Search,
  ChevronRight,
  Info,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import Loader from "@/components/Loader";
import { useLocale, useTranslations } from "next-intl";

export default function MerchantAnnouncementsPage() {
  const t = useTranslations("MerchantAnnouncements");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const { user, wooId } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [wooId]);

  const fetchAnnouncements = async () => {
    if (!wooId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAnnouncements(data);
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString(locale === "ar" ? "ar-JO" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="mx-auto space-y-8 pb-20" dir={dir}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
            <Megaphone className="text-[#800000]" />
            {t("pageTitle")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t("pageSubtitle")}</p>
        </div>

        <div className="relative">
          <Search
            className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400"
            size={16}
          />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pe-10 ps-4 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-[#800000] w-full md:w-64 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-zinc-300 mb-4" size={40} />
          <p className="text-zinc-500 font-medium">{t("fetching")}</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Megaphone className="text-zinc-300" size={32} />
          </div>
          <h3 className="text-lg font-bold text-zinc-900">
            {t("noAnnouncements")}
          </h3>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto mt-2">
            {t("noAnnouncementsDesc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnnouncements.map((a) => (
            <div
              key={a.id}
              onClick={() => setSelectedAnnouncement(a)}
              className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#800000]/30 transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-[#800000]/5 text-[#800000] text-[10px] font-black uppercase tracking-widest rounded-md">
                  {a.editedAt ? t("updated") : t("official")}
                </span>
                <span className="text-[11px] text-zinc-400 me-auto font-medium">
                  {formatDate(a.createdAt)}
                </span>
              </div>

              <h3 className="text-[17px] font-bold text-zinc-900 mb-2 group-hover:text-[#800000] transition-colors line-clamp-2">
                {a.title}
              </h3>
              <p className="text-sm text-zinc-500 line-clamp-3 mb-6 leading-relaxed">
                {a.content}
              </p>

              <div className="mt-auto pt-4 border-t border-zinc-50 flex items-center justify-between text-[13px] font-bold text-[#800000]">
                {t("readFull")}
                <ChevronRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform rtl:rotate-180"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-zinc-200">
            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-zinc-900">
                  {selectedAnnouncement.title}
                </h3>
                <div className="flex items-center gap-4 text-xs text-zinc-400 mt-2 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />{" "}
                    {formatDate(selectedAnnouncement.createdAt)}
                  </span>
                  {selectedAnnouncement.editedAt && (
                    <span className="text-amber-600 font-black flex items-center gap-1.5">
                      <Clock size={14} /> {t("lastUpdated")}:{" "}
                      {formatDate(selectedAnnouncement.editedAt)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-2 hover:bg-zinc-200 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap leading-loose text-[16px]">
                {selectedAnnouncement.content}
              </div>

              <div className="mt-10 p-5 bg-blue-50 rounded-2xl flex items-start gap-4 border border-blue-100">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900 mb-1">
                    {t("officialNotice")}
                  </h4>
                  <p className="text-[13px] text-blue-700 leading-relaxed">
                    {t("officialNoticeDesc")}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-zinc-100 bg-white flex justify-end">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-8 py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-zinc-200"
              >
                {t("gotIt")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}