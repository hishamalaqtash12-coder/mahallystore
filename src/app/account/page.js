"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Phone, ShoppingBag, Heart, LogOut, Settings, Package, ChevronRight } from "lucide-react";
import TemuCustomerDashboard from "@/components/TemuCustomerDashboard";

export default function AccountPage() {
  const { user, loading, logout, wooCustomerDeleted, publicId, backendError, isVendor } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (wooCustomerDeleted) {
      router.replace("/login?reason=account_removed");
      return;
    }
    // Only redirect to login if we are NOT loading, have NO user, and there is NO backend error
    // (If there's a backend error, we want to stay here and show the error)
    if (!loading && !user && !backendError) {
      router.replace("/login");
    }
  }, [user, loading, wooCustomerDeleted]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f6]">
        <div className="w-10 h-10 border-4 border-zinc-200 border-t-[#e77600] rounded-full animate-spin" />
      </div>
    );
  }

  // Remove redundant backendError declaration

  if (!user) {
    if (backendError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f6f6] p-4 text-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full" dir="rtl">
            <h2 className="text-xl font-bold text-zinc-900 mb-2">خطأ في الاتصال</h2>
            <p className="text-zinc-600 mb-6">{backendError.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full h-10 bg-[#FFD814] hover:bg-[#F7CA00] text-zinc-900 rounded-md font-bold transition-all"
            >
              إعادة المحاولة
            </button>
            <button 
              onClick={() => router.push("/login")}
              className="w-full mt-2 h-10 text-zinc-500 hover:text-zinc-900 text-sm font-bold transition-all"
            >
              الذهاب إلى صفحة تسجيل الدخول
            </button>
          </div>
        </div>
      );
    }
    return null; // Will be handled by the useEffect redirect
  }

  useEffect(() => {
    if (user) {
      router.replace("/account/orders");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9]">
      <div className="w-10 h-10 border-4 border-zinc-200 border-t-[#be374f] rounded-full animate-spin" />
    </div>
  );
}
