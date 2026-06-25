"use client";

import { Search, ChevronDown, Settings, LogOut, RefreshCw, User, Sparkles, Navigation, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/routing";

const ADMIN_PAGES = [
  { title: "Admin Dashboard", description: "View store stats, charts, and seller list", path: "/admin", category: "Navigation" },
  { title: "Manage Vendors", description: "Verify, reject, or follow local merchants", path: "/admin/vendors", category: "Management" },
  { title: "AI Reports", description: "Marketplace intelligence, best sellers, rates", path: "/admin/reports", category: "Analytics" },
  { title: "Advertising Manager", description: "Control platform ads, banner spots, budgets", path: "/admin/advertising", category: "Marketing" },
  { title: "System Announcements", description: "Broadcast updates to vendors or customers", path: "/admin/announcements", category: "Communication" },
  { title: "WhatsApp Broadcast", description: "Send automated messages to merchants", path: "/admin/whatsapp", category: "Communication" },
  { title: "Website Evaluation", description: "User survey feedback, ratings, issues", path: "/admin/feedback", category: "Compliance" },
  { title: "General Settings", description: "Name, email, and reporting system features", path: "/admin/settings", category: "System" },
  { title: "Homepage Video Settings", description: "Upload or edit promotional YouTube videos", path: "/admin/settings", category: "System" }
];

export default function AdminHeader() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, customerName, logout } = useAuth();
  const router = useRouter();

  const initials = customerName
    ? customerName[0].toUpperCase()
    : user?.displayName
      ? user.displayName[0].toUpperCase()
      : "A";

  const displayName = customerName || user?.displayName || "Admin";

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-zinc-200 px-4 lg:px-6 flex items-center justify-between">
      {/* Search */}
      <div className="relative w-full max-w-sm hidden sm:block">
        <Search
          size={15}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search dashboard, settings, reports..."
          className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-lg pe-9 ps-4 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
        />
        {searchQuery.trim().length > 0 && (
          <div className="absolute end-0 start-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-zinc-100 max-h-[380px] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 bg-zinc-50 flex items-center justify-between text-[11px] font-bold text-zinc-400">
              <span>SEARCH RESULTS</span>
              <span>ESC TO CLOSE</span>
            </div>
            <div className="py-1">
              {(() => {
                const results = ADMIN_PAGES.filter(p =>
                  p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.category.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (results.length === 0) {
                  return (
                    <div className="px-4 py-6 text-center text-xs text-zinc-400">
                      No matching sections or settings found.
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
                    className="w-full text-end px-4 py-2.5 hover:bg-zinc-50 flex items-start gap-3 transition-colors group cursor-pointer"
                  >
                    <div className="h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-200 group-hover:text-zinc-900 transition-colors shrink-0">
                      <Navigation size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-800 truncate group-hover:text-zinc-900">{item.title}</span>
                        <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">{item.category}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-none">{item.description}</p>
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 me-auto">

        {/* Refresh */}
        <button
          onClick={() => window.location.reload()}
          className="h-9 w-9 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
          title="Refresh page"
        >
          <RefreshCw size={15} />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <div className="hidden lg:block text-end">
              <p className="text-sm font-medium text-zinc-900 leading-tight">{displayName}</p>
              <p className="text-xs text-zinc-400">Administrator</p>
            </div>
            <ChevronDown
              size={14}
              className={`hidden lg:block text-zinc-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isUserMenuOpen && (
            <div className="absolute start-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-zinc-100 mb-1">
                <p className="text-xs font-medium text-zinc-400">Signed in as</p>
                <p className="text-sm font-medium text-zinc-900 truncate mt-0.5">{user?.email}</p>
              </div>
              <button
                onClick={() => { router.push("/admin/settings"); setIsUserMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Settings size={15} className="text-zinc-400" />
                Settings
              </button>
              <div className="h-px bg-zinc-100 my-1 mx-2" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} className="cursor-pointer text-red-400" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
