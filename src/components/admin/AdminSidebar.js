"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
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
  Megaphone
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  {
    group: "Main", items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Vendors", href: "/admin/vendors", icon: Store },
    ]
  },
  {
    group: "Insights", items: [
      { name: "AI Reports", href: "/admin/reports", icon: TrendingUp },
      { name: "Advertising", href: "/admin/advertising", icon: Megaphone },
    ]
  },
  {
    group: "Communication", items: [
      { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
      { name: "WhatsApp Broadcast", href: "/admin/whatsapp", icon: MessageCircle },
      { name: "Website Evaluation", href: "/admin/feedback", icon: MessageSquare },
    ]
  },
  {
    group: "System", items: [
      { name: "Visibility Controls", href: "/admin/visibility-control", icon: AlertTriangle },
      { name: "WordPress Admin", href: process.env.NEXT_PUBLIC_WORDPRESS_URL + "/wp-admin", icon: ExternalLink, external: true },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ]
  }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-200 bg-white flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-zinc-200 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
            <Zap size={16} className="text-white fill-white" />
          </div>
          <span className="text-base font-semibold text-zinc-900">
            Mahally <span className="text-zinc-400 font-normal">Admin</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
        {menuItems.map((group, idx) => (
          <div key={idx}>
            <p className="px-3 mb-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const itemUrl = new URL(item.href, 'http://localhost');
                const currentUrl = new URL(pathname + (window.location.search || ""), 'http://localhost');

                const isExact = pathname === itemUrl.pathname;
                const hasMatchingQuery = itemUrl.search ? (window.location.search === itemUrl.search) : !window.location.search;

                const isActive = isExact && hasMatchingQuery;

                if (item.external) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={16} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                        {item.name}
                      </div>
                      <ExternalLink size={12} className="text-zinc-300" />
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                  >
                    <item.icon
                      size={16}
                      className={isActive ? "text-zinc-700" : "text-zinc-400"}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-zinc-200 px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={16} className="text-zinc-400" />
          Back to Store
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} className="cursor-pointer text-zinc-400" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
