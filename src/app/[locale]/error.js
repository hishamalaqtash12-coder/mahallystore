"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";

export default function Error({ error, reset }) {
  const locale = useLocale();
  const isAr = locale === "ar";

  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600 shadow-xs">
          <AlertCircle size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            {isAr ? "تعذّر تحميل هذه الصفحة" : "This page couldn't load"}
          </h1>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            {isAr 
              ? "حدث خطأ غير متوقع أثناء الاتصال بالخادم. يمكنك إعادة المحاولة أو العودة إلى الصفحة الرئيسية."
              : "An unexpected error occurred while connecting to the server. You can try reloading or return to home."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-extrabold text-sm px-6 py-3 rounded-full transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <RefreshCcw size={16} />
            <span>{isAr ? "إعادة المحاولة" : "Try Reloading"}</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-800 font-extrabold text-sm px-6 py-3 rounded-full transition-all cursor-pointer"
          >
            <Home size={16} />
            <span>{isAr ? "الصفحة الرئيسية" : "Go to Homepage"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
