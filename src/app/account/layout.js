"use client";

import { useAuth } from "@/context/AuthContext";
import AccountSidebar from "@/components/AccountSidebar";
import FeedbackModal from "@/components/FeedbackModal";
import { ShieldAlert, MessageCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

export default function AccountLayout({ children }) {
  const { user, customerName, isVendor, isApprovedVendor, logout, loading, wooCustomerDeleted, wooId, avatarUrl, avatarBgColor, isAdmin, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [vendorLogo, setVendorLogo] = useState(null);

  useEffect(() => {
    if (!wooId || !isApprovedVendor) { setVendorLogo(null); return; }
    fetch(`/api/vendors/${wooId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.vendor?.storeLogo) setVendorLogo(data.vendor.storeLogo); })
      .catch(() => { });
  }, [wooId, isApprovedVendor]);

  useEffect(() => {
    if (!loading && !user && !pathname.includes('/login')) {
      router.replace("/login");
    }
  }, [user, loading, pathname, router]);

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        router.replace("/admin");
      } else if (role === "vendor" || role === "shop_manager") {
        router.replace("/merchant/dashboard");
      }
    }
  }, [user, loading, isAdmin, role, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9]">
        <div className="w-10 h-10 border-4 border-zinc-200 border-t-[#be374f] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  if (isAdmin || role === "vendor" || role === "shop_manager") return null;



  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col md:flex-row font-sans text-[#222]" dir="rtl">
      <Suspense fallback={<div className="w-full md:w-72 bg-white md:min-h-screen border-l border-gray-100 py-6 px-4 shrink-0" />}>
        <AccountSidebar user={user} customerName={customerName} logout={handleLogout} isVendor={isVendor} vendorLogo={vendorLogo} avatarUrl={avatarUrl} avatarBgColor={avatarBgColor} />
      </Suspense>

      <main className="flex-1 bg-white md:bg-[#f9f9f9] px-8 py-10 md:py-12 lg:py-16 flex flex-col items-center overflow-y-auto">
        <div className="w-full max-w-6xl">
          {children}
        </div>
      </main>

      {/* Floating Widgets */}
      {/* <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50">
        <button
          onClick={() => setIsFeedbackOpen(true)}
          className="bg-white p-3 rounded-md shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all group relative flex items-center justify-center"
        >
          <ShieldAlert size={22} className="text-gray-600 group-hover:text-[#be374f]" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black text-white text-[11px] px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">Feedback</span>
        </button>
      </div> */}

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
}
