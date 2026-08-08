"use client";

import { Link } from "@/i18n/routing";
import { usePathname } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Package,
  Store,
  MessageSquare,
  MessageCircle,
  ExternalLink,
  LogOut,
  ArrowLeft,
  Settings,
  TrendingUp,
  AlertTriangle,
  Zap,
  Megaphone,
  LayoutGrid,
  Shield
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  {
    groupKey: "sidebarMain",
    items: [
      { nameKey: "sidebarDashboard", href: "/admin", icon: LayoutDashboard },
      { nameKey: "sidebarVendors", href: "/admin/vendors", icon: Store },
    ]
  },
  {
    groupKey: "sidebarInsights",
    items: [
      { nameKey: "sidebarReports", href: "/admin/reports", icon: TrendingUp },
      { nameKey: "sidebarAdvertising", href: "/admin/advertising", icon: Megaphone },
    ]
  },
  {
    groupKey: "sidebarCommunication",
    items: [
      { nameKey: "sidebarMessages", href: "/admin/messages", icon: Shield },
      { nameKey: "sidebarAnnouncements", href: "/admin/announcements", icon: Megaphone },
      { nameKey: "sidebarWhatsApp", href: "/admin/whatsapp", icon: MessageCircle },
      { nameKey: "sidebarFeedback", href: "/admin/feedback", icon: MessageSquare },
    ]
  },
  {
    groupKey: "sidebarSystem",
    items: [
      { nameKey: "sidebarWordPress", href: process.env.NEXT_PUBLIC_WORDPRESS_URL + "/wp-admin", icon: ExternalLink, external: true },
      { nameKey: "sidebarSettings", href: "/admin/settings", icon: Settings },
    ]
  }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === "ar";
  const { logout } = useAuth();
  const t = useTranslations("AdminShell");

  return (
    <aside className={`fixed top-0 z-40 h-screen w-64 bg-white text-zinc-900 flex flex-col border-zinc-200 shadow-sm ${isAr ? 'right-0 border-l' : 'left-0 border-r'}`}>
      <div className="flex h-16 items-center border-b border-zinc-200 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#be374f]">
            <Zap size={16} className="text-white fill-white" />
          </div>
          <span className="text-base font-semibold text-zinc-900">
            Mahally <span className="text-zinc-400 font-normal">{t("sidebarAdmin")}</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
        {menuItems.map((group, idx) => (
          <div key={idx}>
            <p className="px-3 mb-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.22em]">
              {t(group.groupKey)}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const itemUrl = new URL(item.href, 'http://localhost');
                const isExact = pathname === itemUrl.pathname;
                const hasMatchingQuery = itemUrl.search ? (window.location.search === itemUrl.search) : !window.location.search;
                const isActive = isExact && hasMatchingQuery;

                if (item.external) {
                  return (
                    <a
                      key={item.nameKey}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={16} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                        {t(item.nameKey)}
                      </div>
                      <ExternalLink size={12} className="text-zinc-300" />
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.nameKey}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                      ? "bg-zinc-100 text-[#be374f]"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                  >
                    <item.icon
                      size={16}
                      className={isActive ? "text-[#be374f]" : "text-zinc-400"}
                    />
                    {t(item.nameKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-zinc-200 px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={16} className="text-zinc-400" />
          {t("backToStore")}
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} className="cursor-pointer text-zinc-400" />
          {t("signOut")}
        </button>
      </div>
    </aside>
  );
}
