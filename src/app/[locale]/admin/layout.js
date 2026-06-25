"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "@/i18n/routing";
import "@/styles/dashboard.css";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }) {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const { replace } = useRouter();

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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Prevent flash of unauthorized content
  }

  return (
    <div dir="ltr" className="flex min-h-screen bg-zinc-50 font-sans">
      <AdminSidebar />
      <div className="flex-1 lg:me-64 flex flex-col h-screen overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
