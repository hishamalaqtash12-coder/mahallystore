"use client";

import { useState } from "react";
import { Send, CheckCircle2, Info } from "lucide-react";
import Loader from "@/components/Loader";

export default function ContactForm({ isAr, t }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (res.ok) {
        setSuccess(true);
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        const data = await res.json();
        throw new Error(data.error || (isAr ? "حدث خطأ ما. يرجى المحاولة مرة أخرى." : "Something went wrong. Please try again."));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center space-y-4">
        <CheckCircle2 size={48} className="text-emerald-600 mx-auto" />
        <h3 className="text-lg font-bold text-emerald-900">
          {isAr ? "تم الإرسال بنجاح" : "Message Sent Successfully"}
        </h3>
        <p className="text-sm text-emerald-700 leading-relaxed max-w-md mx-auto">
          {isAr
            ? "شكرًا لتواصلك معنا. لقد استلمنا طلبك وسنقوم بالرد عليك في أقرب وقت ممكن."
            : "Thank you for contacting us. We have received your request and will get back to you shortly."}
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-bold shadow-sm transition-all"
        >
          {isAr ? "إرسال رسالة أخرى" : "Send Another Message"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-800">{t.labelName}</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 bg-white border border-zinc-300 rounded-md px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#be374f] focus:border-transparent transition-all"
            placeholder={t.placeholderName}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-800">{t.labelEmail}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 bg-white border border-zinc-300 rounded-md px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#be374f] focus:border-transparent transition-all"
            placeholder={t.placeholderEmail}
            dir="ltr"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-800">{t.labelSubject}</label>
        <input
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full h-11 bg-white border border-zinc-300 rounded-md px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#be374f] focus:border-transparent transition-all"
          placeholder={t.placeholderSubject}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-800">{t.labelMessage}</label>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full h-32 bg-white border border-zinc-300 rounded-md p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#be374f] focus:border-transparent transition-all resize-none"
          placeholder={t.placeholderMessage}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex gap-2">
          <Info size={16} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="h-11 bg-[#be374f] hover:bg-[#a82e44] text-white w-full md:w-auto px-8 rounded-full font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? (
          <Loader size="sm" text="" />
        ) : (
          <>
            <Send size={16} />
            {t.sendBtn}
          </>
        )}
      </button>
    </form>
  );
}
