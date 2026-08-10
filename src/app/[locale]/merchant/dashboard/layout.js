"use client";

import "@/styles/dashboard.css";
import DashboardSidebar from "@/components/merchant/DashboardSidebar";
import DashboardHeader from "@/components/merchant/DashboardHeader";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";

export default function MerchantLayout({ children }) {
  const { user, isApprovedVendor, isAdmin, loading } = useAuth();
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (!isApprovedVendor) {
        router.replace("/");
      } else if (isAdmin) {
        if (user.email !== "motasem.udeh@gmail.com") {
          router.replace("/admin");
        }
      }
    }
  }, [user, isApprovedVendor, isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
         <Loader size="lg" text="" />
      </div>
    );
  }

  if (!user || !isApprovedVendor) return null;
  if (isAdmin && user.email !== "motasem.udeh@gmail.com") return null;

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-zinc-50 flex font-sans">
      <DashboardSidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
      <div className={`flex-1 flex flex-col min-w-0 min-h-screen relative ${isAr ? "lg:pr-64" : "lg:pl-64"}`}>
        <DashboardHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 xl:px-10 bg-white overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1700px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
