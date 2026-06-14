"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X, ShieldAlert, CheckCircle2, Loader2, Info } from "lucide-react";

export default function ReportModal({ isOpen, onClose, reportedId, reportedName, type = "store" }) {
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    
    // Reset state on open
    setReason("");
    setDetails("");
    setStatus(null);
    setErrorMsg("");
    setLoadingSettings(true);

    // Fetch system settings to check if enabled
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoadingSettings(false);
      })
      .catch(() => {
        setLoadingSettings(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setErrorMsg("Please select a reason for reporting.");
      return;
    }
    if (details.trim().length < 10) {
      setErrorMsg("Please provide at least 10 characters of details.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedId,
          reason,
          details
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Failed to submit report. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-2 text-zinc-900">
            <ShieldAlert className="h-5 w-5 text-indigo-600 animate-pulse" />
            <span className="font-bold text-sm">Report {type === "store" ? "Store" : "User"}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {loadingSettings ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              <p className="text-xs text-zinc-500">Checking system parameters...</p>
            </div>
          ) : status === "success" ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 animate-[bounce_0.6s_ease-out_1]">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-bold text-zinc-900 text-sm">Thank You for Reporting</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
                We have logged your concerns regarding <strong className="text-zinc-700">{reportedName || reportedId}</strong>. 
                Our compliance team will investigate this account within 24 hours.
              </p>
              <button 
                onClick={onClose}
                className="mt-6 w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          ) : settings?.reportingEnabled === false ? (
            <div className="py-4">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs text-indigo-900 leading-relaxed mb-6">
                <div className="flex gap-2 items-start">
                  <Info className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Reporting System Paused</strong>
                    <span className="opacity-90 block mt-1">
                      Our administrator has temporarily paused report creations while upgrading platform safeguards. 
                      You can toggle this functionality back on inside <strong className="font-semibold">Admin Settings &gt; General</strong> at any time.
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Go Back
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-zinc-500 leading-relaxed">
                You are initiating a report against <strong className="text-zinc-700 font-semibold">{reportedName || reportedId}</strong>. 
                False reporting is a violation of our community standards.
              </p>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 p-2.5 text-xs text-red-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Reason Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Reason for Report</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
                >
                  <option value="">-- Select a reason --</option>
                  <option value="spam">Spam or Advertisements</option>
                  <option value="fraud">Fraud or Scams</option>
                  <option value="harassment">Harassment or Abuse</option>
                  <option value="counterfeit">Selling Counterfeit items</option>
                  <option value="inappropriate">Inappropriate Store Name/Banner</option>
                  <option value="other">Other Violation</option>
                </select>
              </div>

              {/* Detail Text Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Describe the issue</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please describe specifically what community standards this store violates (min 10 characters)..."
                  className="w-full h-24 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-medium hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={12} className="animate-spin" />}
                  Submit Report
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
