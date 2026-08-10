"use client";

import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/routing";
import UserAvatar from "@/components/UserAvatar";
import {
  RotateCcw,
  Star,
  User,
  Ticket,
  Wallet,
  Store,
  History,
  MapPin,
  Globe,
  CreditCard,
  ShieldCheck,
  Lock,
  Bell,
  MessageSquare,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  LogOut,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function AccountSidebar({
  user,
  customerName,
  logout,
  isVendor,
  vendorLogo,
  avatarUrl,
  avatarBgColor,
  isMobileOpen,
  setIsMobileOpen,
}) {
  const t = useTranslations("AccountSidebar");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStatus = searchParams
    ? searchParams.get("status") || "all"
    : "all";
  const [isOrdersExpanded, setIsOrdersExpanded] = React.useState(
    pathname.startsWith("/account/orders")
  );

  const sidebarItems = [
    {
      id: "orders",
      icon: RotateCcw,
      label: t("yourOrders"),
      href: "/account/orders",
      expandable: true,
      subItems: [
        { id: "all", label: t("allOrders"), href: "/account/orders" },
        {
          id: "processing",
          label: t("processing"),
          href: "/account/orders?status=processing",
        },
        {
          id: "on-hold",
          label: t("onHold"),
          href: "/account/orders?status=on-hold",
        },
        {
          id: "completed",
          label: t("completed"),
          href: "/account/orders?status=completed",
        },
        {
          id: "cancelled",
          label: t("cancelled"),
          href: "/account/orders?status=cancelled",
        },
      ],
    },
    {
      id: "reviews",
      icon: Star,
      label: t("yourReviews"),
      href: "/account/reviews",
    },
    {
      id: "profile",
      icon: User,
      label: t("profile"),
      href: "/account/profile",
    },
    {
      id: "coupons",
      icon: Ticket,
      label: t("couponsOffers"),
      href: "/account/coupons",
    },
    {
      id: "stores",
      icon: Store,
      label: t("followedStores"),
      href: "/account/followed-stores",
    },
    {
      id: "history",
      icon: History,
      label: t("browsingHistory"),
      href: "/account/recently-viewed",
    },
    {
      id: "addresses",
      icon: MapPin,
      label: t("addresses"),
      href: "/account/addresses",
    },
    {
      id: "payments",
      icon: CreditCard,
      label: t("paymentMethods"),
      href: "/account/payments",
    },
    {
      id: "security",
      icon: ShieldCheck,
      label: t("accountSecurity"),
      href: "/account/security",
    },
    {
      id: "notifications",
      icon: Bell,
      label: t("notifications"),
      href: "/account/notifications",
    },
    {
      id: "feedback",
      icon: MessageSquare,
      label: t("feedback"),
      href: "/account/feedback",
    },
  ];

  const handleLogoutClick = async (e) => {
    e.preventDefault();
    await logout();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[90] md:hidden" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      <aside
        className={`w-72 bg-white md:min-h-screen pt-6 pb-6 shrink-0 flex flex-col
          md:sticky md:top-0 md:block md:h-fit md:z-0
          fixed top-0 bottom-0 z-[100] transition-transform duration-300
          ${dir === "rtl" ? "border-s border-gray-100" : "border-e border-gray-100"}
          ${isMobileOpen 
            ? (dir === "rtl" ? "right-0" : "left-0") 
            : (dir === "rtl" ? "-right-full hidden md:block md:right-auto" : "-left-full hidden md:block md:left-auto")
          }
        `}
        dir={dir}
      >
        <div className="flex justify-end md:hidden mb-2 px-4 shrink-0">
          <button onClick={() => setIsMobileOpen(false)} className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-md">
            <X size={20} />
          </button>
        </div>
      <div className="mb-6 px-7 shrink-0">
        <div className="flex items-center gap-3">
          <UserAvatar
            user={user}
            customerName={customerName}
            avatarUrl={vendorLogo || avatarUrl}
            avatarBgColor={avatarBgColor}
            className="w-11 h-11 rounded-md text-[16px] border border-gray-100/20 shadow-sm shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-[15px] font-bold leading-tight text-gray-900">
              {customerName || user?.displayName || t("userAccount")}
            </span>
          </div>
        </div>
      </div>

      <nav className="space-y-0.5 overflow-y-auto flex-1 px-4 hide-scrollbar">
        {isVendor && (
          <div className="mb-2 pb-2 border-b border-gray-100">
            <Link
              href="/merchant/dashboard"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[14px] transition-all group hover:bg-[#FFD700]/10 font-bold text-[#8f2d4a]"
            >
              <div className="flex items-center gap-3">
                <Store size={19} strokeWidth={2} className="text-[#8f2d4a]" />
                <span>{t("merchantDashboard")}</span>
              </div>
            </Link>
          </div>
        )}

        {sidebarItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.expandable && pathname.startsWith("/account/orders"));

          return (
            <div key={item.id}>
              {item.expandable ? (
                <button
                  onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[14px] transition-all group ${isActive && !isOrdersExpanded
                      ? "bg-gray-100 font-bold text-gray-900"
                      : "hover:bg-gray-50 font-medium text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      size={19}
                      className={
                        isActive
                          ? "text-black"
                          : "text-gray-400 group-hover:text-black"
                      }
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isOrdersExpanded ? (
                    <ChevronUp size={14} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[14px] transition-all group ${isActive
                      ? "bg-gray-100 font-bold text-gray-900"
                      : "hover:bg-gray-50 font-medium text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      size={19}
                      className={
                        isActive
                          ? "text-black"
                          : "text-gray-400 group-hover:text-black"
                      }
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <span>{item.label}</span>
                  </div>
                </Link>
              )}

              {item.expandable && isOrdersExpanded && (
                <div className="ms-9 mt-0.5 space-y-0.5 mb-2">
                  {item.subItems.map((sub) => {
                    const isSubActive =
                      pathname === "/account/orders" &&
                      ((sub.id === "all" && activeStatus === "all") ||
                        (sub.id !== "all" && activeStatus === sub.id));

                    return (
                      <Link
                        key={sub.id}
                        href={sub.href}
                        className={`w-full block text-start px-3 py-1.5 rounded-md text-[13px] transition-all ${isSubActive
                            ? "text-[#be374f] font-bold bg-[#be374f]/5"
                            : "text-gray-500 font-medium hover:text-black hover:bg-gray-50"
                          }`}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] text-rose-600 font-bold hover:bg-rose-50 transition-all group"
          >
            <LogOut size={19} strokeWidth={2} />
            <span>{t("logout")}</span>
          </button>
        </div>
      </nav>
    </aside>
    </>
  );
}