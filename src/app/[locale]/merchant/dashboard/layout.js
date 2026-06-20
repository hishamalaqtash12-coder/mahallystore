"use client";

import "@/styles/dashboard.css";
import DashboardSidebar from "@/components/merchant/DashboardSidebar";
import DashboardHeader from "@/components/merchant/DashboardHeader";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loader from "@/components/Loader";

export default function MerchantLayout({ children }) {
  const { user, isApprovedVendor, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (!isApprovedVendor) {
        router.replace("/");
      } else if (isAdmin) {
        router.replace("/admin");
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
  if (isAdmin) return null;

  return (
    <div dir="ltr" className="min-h-screen bg-white flex font-sans">
      <DashboardSidebar />
      <div className="flex-1 ml-64 flex flex-col h-screen relative border-l border-zinc-200 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 p-8 bg-white overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
