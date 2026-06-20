"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  User, 
  MessageSquare,
  Undo2,
  Bell,
  LogOut,
  HelpCircle,
  Home,
  Database,
  Clock,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  Truck,
  Megaphone
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  { group: "MAIN", items: [
    { name: "Dashboard", href: "/merchant/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/merchant/dashboard/products", icon: Package },
    { name: "Inventory", href: "/merchant/dashboard/inventory", icon: BarChart3 },
    { name: "Orders", href: "/merchant/dashboard/orders", icon: ShoppingCart },
    { name: "Coupons", href: "/merchant/dashboard/coupons", icon: Database },
    { name: "Promotions", href: "/merchant/dashboard/advertising", icon: Megaphone },
  ]},
  { group: "FINANCE", items: [
    { name: "Withdraw", href: "/merchant/dashboard/withdraw", icon: RefreshCw },
    { name: "Refunds", href: "/merchant/dashboard/refunds", icon: Undo2 },
    { name: "Reports", href: "/merchant/dashboard/reports", icon: BarChart3 },
  ]},
  { group: "FEEDBACK", items: [
    { name: "Inbox", href: "/messages", icon: MessageSquare },
    { name: "Reviews", href: "/merchant/dashboard/reviews", icon: Clock },
    { name: "Website Evaluation", href: "/admin/feedback", icon: BarChart3 },
    { name: "Announcements", href: "/merchant/dashboard/announcements", icon: Bell },
  ]},
  { group: "STORE", items: [
    { name: "Settings", href: "/merchant/dashboard/settings", icon: Settings },
    { name: "Shipping", href: "/merchant/dashboard/shipping", icon: Truck },
    { name: "Billing & Plans", href: "/merchant/dashboard/billing", icon: CreditCard },
    { name: "Help Center", href: "/help", icon: HelpCircle },
  ]}
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, customerName, isVendor, isApprovedVendor, isAdmin, logout, messagingEnabled } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white text-zinc-900 flex flex-col border-r border-zinc-200">
      {/* Logo Area */}
      <div className="p-6 border-b border-zinc-200 h-[60px] flex items-center">
              <Link href="/merchant/dashboard">
                <Image 
                  src="/mahally-logo.webp" 
                  alt="Mahally.jo Logo" 
                  width={140} 
                  height={45} 
                  className="object-contain"
                  priority
                />
              </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto no-scrollbar py-6">
        {menuItems.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-2">{group.group}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                if (item.href === "/admin/feedback" && !isAdmin) return null;
                if (item.href === "/messages" && !messagingEnabled) return null;
                if (item.href === "/merchant/dashboard/reviews" && !messagingEnabled) return null;
                
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all ${isActive ? 'bg-zinc-100 text-[#be374f] font-bold' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}
                  >
                    <item.icon size={18} className={isActive ? 'text-[#be374f]' : 'text-zinc-400'} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Area */}
      <div className="p-4 border-t border-zinc-100">
        <div className="flex items-center gap-3 px-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 text-[11px] font-bold uppercase">
            {customerName ? customerName[0].toUpperCase() : (user?.displayName ? user.displayName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "U"))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-zinc-900 truncate leading-none mb-1">{customerName || user?.displayName || "Merchant"}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] text-zinc-500 truncate leading-none">Seller Central</p>
              {isVendor && !isApprovedVendor && (
                <div className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-bold border border-amber-100">
                  <Clock size={8} /> PENDING
                </div>
              )}
              {isApprovedVendor && (
                <div className="flex items-center gap-0.5 px-1 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold border border-emerald-100">
                  <ShieldCheck size={8} /> ACTIVE
                </div>
              )}
            </div>
          </div>
        </div>
        {isVendor && !isApprovedVendor && (
          <div className="px-2 py-2 mb-2 bg-amber-50 border border-amber-100 rounded-md">
            <p className="text-[10px] text-amber-700 leading-tight">
              <strong>Store Offline:</strong> Your registration is being reviewed. You will be notified once approved.
            </p>
          </div>
        )}
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-2 py-2 text-zinc-400 hover:text-red-600 text-[12px] font-medium transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
