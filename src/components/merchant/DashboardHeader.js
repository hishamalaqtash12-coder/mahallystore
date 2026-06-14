"use client";

import { Search, Menu, ChevronDown, User, Settings, LogOut, RefreshCw, Navigation } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const MERCHANT_PAGES = [
  { title: "Merchant Dashboard Home", description: "Overview of store analytics and sales status", path: "/merchant/dashboard", category: "Overview" },
  { title: "Manage Products", description: "Add, edit, or delete items from storefront", path: "/merchant/dashboard/products", category: "Catalog" },
  { title: "Inventory & Stock Levels", description: "Track items in stock and edit inventory", path: "/merchant/dashboard/inventory", category: "Catalog" },
  { title: "Store Orders", description: "Process shipments, refunds, and view history", path: "/merchant/dashboard/orders", category: "Sales" },
  { title: "Store Coupons", description: "Create promotional codes or absolute discounts", path: "/merchant/dashboard/coupons", category: "Marketing" },
  { title: "Advertising & Promo Banners", description: "Run ads for your products on home slider", path: "/merchant/dashboard/advertising", category: "Marketing" },
  { title: "Customer Reviews", description: "Read ratings, testimonials, and customer replies", path: "/merchant/dashboard/reviews", category: "Feedback" },
  { title: "Store Announcements", description: "View recent admin system announcements", path: "/merchant/dashboard/announcements", category: "Information" },
  { title: "Withdrawals & Balances", description: "Request store payouts and view statements", path: "/merchant/dashboard/withdraw", category: "Billing" },
  { title: "Store Settings", description: "Manage logo, banner, and categories", path: "/merchant/dashboard/settings", category: "Settings" }
];

export default function DashboardHeader() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, customerName, logout } = useAuth();
  const router = useRouter();

  const handleReload = () => {
    window.dispatchEvent(new CustomEvent('refresh-dashboard'));
  };

  return (
    <header className="sticky top-0 z-30 h-[60px] bg-white border-b border-zinc-200 px-8 flex items-center justify-between">
      {/* Search Area */}
      <div className="relative w-96 group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
          <Search size={14} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products, orders, coupons, settings..."
          className="w-full h-[31px] bg-white border border-zinc-300 rounded-md pl-9 pr-3 text-[13px] focus:border-[#e77600] transition-all outline-none shadow-inner"
        />
        {searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-zinc-100 max-h-[350px] overflow-y-auto animate-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 bg-zinc-50 flex items-center justify-between text-[10px] font-bold text-zinc-400">
              <span>SEARCH RESULTS</span>
              <span>ESC TO CLOSE</span>
            </div>
            <div className="py-1">
              {(() => {
                const results = MERCHANT_PAGES.filter(p =>
                  p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.category.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (results.length === 0) {
                  return (
                    <div className="px-4 py-5 text-center text-[12px] text-zinc-400">
                      No matching pages or tools found.
                    </div>
                  );
                }

                return results.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      router.push(item.path);
                      setSearchQuery("");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-start gap-2.5 transition-colors group cursor-pointer"
                  >
                    <div className="h-6 w-6 rounded bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-200 group-hover:text-zinc-800 transition-colors shrink-0">
                      <Navigation size={11} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-zinc-700 truncate group-hover:text-zinc-900">{item.title}</span>
                        <span className="text-[9px] font-bold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 shrink-0">{item.category}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5 truncate leading-none">{item.description}</p>
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">


          <button
            onClick={handleReload}
            title="Reload Data"
            className="p-2 rounded-md hover:bg-zinc-50 transition-colors text-zinc-600"
          >
            <RefreshCw size={18} />
          </button>
          <button onClick={() => router.push('/merchant/dashboard/settings')} className="p-2 rounded-md hover:bg-zinc-50 transition-colors text-zinc-600">
            <Settings size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-200 mx-2" />

        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-3 h-[36px] rounded-md hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-200"
          >
            <div className="w-8 h-8 rounded-full bg-[#febd69] flex items-center justify-center font-bold text-[12px] text-zinc-900 border border-zinc-200">
              {customerName ? customerName[0].toUpperCase() : (user?.displayName ? user.displayName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "U"))}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[13px] font-bold text-zinc-700 leading-tight">{customerName || user?.displayName || (user?.phoneNumber ? "Merchant" : "User")}</span>
              <span className="text-[10px] text-zinc-400 font-medium">Verified Vendor</span>
            </div>
            <ChevronDown size={12} className={`text-zinc-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white border border-zinc-200 rounded-md shadow-lg py-2 z-50">
              <button onClick={() => router.push('/merchant/dashboard/settings')} className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                <User size={16} /> Store Profile
              </button>
              <button onClick={() => router.push('/merchant/dashboard/settings')} className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                <Settings size={16} /> Settings
              </button>
              <div className="h-px bg-zinc-100 my-1" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} className="cursor-pointer text-zinc-400" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
