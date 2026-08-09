"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Users,
  Sparkles,
  RefreshCw,
  CheckCircle,
  Calendar,
  History,
  Smartphone,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function WhatsAppBroadcaster() {
  const t = useTranslations("AdminWhatsApp");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  // Campaign Form States
  const [recipientType, setRecipientType] = useState("all");
  const [message, setMessage] = useState("");
  const [customNumbers, setCustomNumbers] = useState("");
  const [enhancing, setEnhancing] = useState(false);

  // Dispatch States
  const [dispatching, setDispatching] = useState(false);
  const [dispatchedInfo, setDispatchedInfo] = useState(null);
  const [error, setError] = useState(null);

  // History States
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load History
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/admin/whatsapp/dispatch");
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Failed to fetch /api/admin/whatsapp/dispatch:", res.status, text);
        return;
      }

      if (!contentType.includes("application/json")) {
        const text = await res.text().catch(() => "");
        console.error("Unexpected non-JSON response from /api/admin/whatsapp/dispatch:", text);
        return;
      }

      const data = await res.json();
      if (data && data.success) {
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error("Failed to load broadcast history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Enhance copy with AI
  const handleEnhanceWithAI = async () => {
    if (!message.trim()) {
      alert(t("writeDraftFirst"));
      return;
    }
    try {
      setEnhancing(true);
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message,
          context: "whatsapp_marketing"
        })
      });
      const data = await res.json();
      if (data.enhancedText) {
        setMessage(data.enhancedText);
      }
    } catch (e) {
      console.error("AI enhancement error:", e);
    } finally {
      setEnhancing(false);
    }
  };

  // Dispatch Campaign
  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError(t("messageEmpty"));
      return;
    }
    if (recipientType === "specific" && !customNumbers.trim()) {
      setError(t("phoneRequired"));
      return;
    }

    try {
      setDispatching(true);
      setError(null);
      setDispatchedInfo(null);

      const res = await fetch("/api/admin/whatsapp/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientType, message, customNumbers })
      });
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(t("serverError", { status: res.status }));
        console.error("Dispatch failed:", res.status, text);
        return;
      }

      if (!contentType.includes("application/json")) {
        const text = await res.text().catch(() => "");
        setError(t("unexpectedResponse"));
        console.error("Unexpected non-JSON response from dispatch:", text);
        return;
      }

      const data = await res.json();

      if (data && data.success) {
        setDispatchedInfo({
          count: data.dispatchedCount,
          campaign: data.campaign
        });
        setMessage("");
        setCustomNumbers("");
        fetchHistory();
      } else {
        setError(data.error || t("dispatchFailed"));
      }
    } catch (err) {
      setError(t("unexpectedError"));
    } finally {
      setDispatching(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto" dir={dir}>
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl flex items-center gap-2">
            <MessageSquare className="text-emerald-600" />
            {t("pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{t("pageSubtitle")}</p>
        </div>
      </div>

      {/* Feature Under Development Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3.5 shadow-sm">
        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="text-sm font-bold text-amber-800">{t("featureUnderDevelopmentTitle")}</h3>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            {t("featureUnderDevelopmentDesc")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Composer Form */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleDispatch}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5"
          >
            <h2 className="font-semibold text-zinc-900 text-[16px] flex items-center gap-2">
              <Smartphone size={18} className="text-zinc-500" />
              {t("campaignComposer")}
            </h2>

            {/* Recipient Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {t("recipientsLabel")}
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { id: "all", label: t("allUsers"), icon: Users },
                  { id: "vendors", label: t("merchants"), icon: Users },
                  { id: "customers", label: t("customers"), icon: Users },
                  { id: "specific", label: t("customPhone"), icon: Smartphone }
                ].map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setRecipientType(type.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all text-center select-none ${recipientType === type.id
                        ? "bg-emerald-50/50 border-emerald-500 text-emerald-800"
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                      }`}
                  >
                    <type.icon
                      size={16}
                      className={recipientType === type.id ? "text-emerald-600" : "text-zinc-400"}
                    />
                    <span className="text-[12px] font-bold mt-1">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Numbers list */}
            {recipientType === "specific" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {t("phoneNumbersLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t("phoneNumbersPlaceholder")}
                  value={customNumbers}
                  onChange={(e) => setCustomNumbers(e.target.value)}
                  className="w-full h-10 px-3 border border-zinc-300 rounded-md text-[13px] outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
            )}

            {/* Message drafting */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {t("messageContent")}
                </label>
                <button
                  type="button"
                  onClick={handleEnhanceWithAI}
                  disabled={enhancing}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm hover:from-violet-500 hover:to-purple-500 transition-all cursor-pointer select-none"
                >
                  {enhancing ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  {enhancing ? t("enhancing") : t("enhanceWithGemini")}
                </button>
              </div>
              <div className="relative">
                <textarea
                  rows={6}
                  placeholder={t("messagePlaceholder")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 border border-zinc-300 rounded-md text-[13px] outline-none focus:border-emerald-500 transition-all font-sans leading-relaxed resize-none"
                />
                <span className="absolute bottom-3 start-3 text-[10px] text-zinc-400 font-bold bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200">
                  {t("charsCount", { count: message.length })}
                </span>
              </div>
            </div>

            {/* Dispatch Status logs */}
            {dispatchedInfo && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5">
                <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-800">{t("dispatchSuccessTitle")}</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {t("dispatchSuccessDesc", { count: dispatchedInfo.count })}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-800">{t("dispatchFailedTitle")}</h4>
                  <p className="text-[11px] text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Dispatch Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={dispatching}
                className="w-full flex items-center justify-center gap-2 h-11 bg-emerald-600 text-white rounded-lg font-bold text-[14px] shadow-md hover:bg-emerald-500 transition-all select-none cursor-pointer disabled:bg-emerald-300"
              >
                {dispatching ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {dispatching ? t("dispatching") : t("sendCampaign")}
              </button>
            </div>
          </form>

          {/* Formatting tips */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-[12px] text-zinc-500 space-y-2">
            <p className="font-bold text-zinc-700">{t("formattingTips")}</p>
            <div className="grid grid-cols-3 gap-2 font-mono bg-white p-2.5 rounded border border-zinc-200 text-[11px]">
              <div>*your text* ➡️ <b>your text</b></div>
              <div>_your text_ ➡️ <i>your text</i></div>
              <div>~your text~ ➡️ <span className="line-through">your text</span></div>
            </div>
          </div>
        </div>

        {/* Campaign History Side Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <History size={16} className="text-zinc-400" />
                <h3 className="font-semibold text-zinc-900 text-[14px]">{t("campaignHistory")}</h3>
              </div>
              <button
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} className={loadingHistory ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto max-h-[500px] space-y-3">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-400 mb-2" />
                  <p className="text-[11px] text-zinc-400 font-medium">{t("loadingHistory")}</p>
                </div>
              ) : history.length > 0 ? (
                history.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-lg border border-zinc-100 bg-zinc-50 p-3.5 space-y-2 text-[12px] flex flex-col"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        {t(`recipientType_${campaign.recipientType}`) || campaign.recipientType}
                      </span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDate(campaign.date)}
                      </span>
                    </div>
                    <p className="text-zinc-700 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {campaign.message}
                    </p>
                    <div className="border-t border-zinc-200/60 pt-2 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                      <span>
                        {t("recipients")}: <b>{campaign.recipientCount}</b>
                      </span>
                      <span className="text-emerald-600 font-bold">{t("sent")}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-8 w-8 text-zinc-300 mb-2" />
                  <p className="text-[12px] text-zinc-500 italic">{t("noCampaigns")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}