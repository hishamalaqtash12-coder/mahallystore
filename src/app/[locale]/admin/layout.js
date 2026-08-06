"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import "@/styles/dashboard.css";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }) {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const { replace } = useRouter();
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("AdminDashboard");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        replace("/login");
      } else if (!isAdmin) {
        replace("/");
      }
    }
  }, [user, isAdmin, authLoading, replace]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f6]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          <p className="text-sm text-zinc-500">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Prevent flash of unauthorized content
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="flex min-h-screen bg-[#f6f6f6] font-sans">
      <AdminSidebar />
      <div className={`flex-1 flex flex-col min-h-screen relative ${isAr ? "pr-64" : "pl-64"}`}>
        <AdminHeader />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 overflow-y-auto bg-[#f6f6f6]">
          <div className="mx-auto w-full max-w-[1700px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
