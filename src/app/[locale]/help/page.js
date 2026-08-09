"use client";

import { useState, useMemo, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  ChevronRight,
  MessageSquare,
  ChevronDown,
  X,
  HelpCircle,
  Package,
  CreditCard,
  Truck,
  User,
  Settings,
  FileText,
  Headphones,
  Sparkles,
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import { Suspense } from "react";

function HelpContent() {
  const t = useTranslations("Help");
  const locale = useLocale();
  const isAr = locale === "ar";

  const { user, customerName, wooId, isVendor } = useAuth();

  const isTargetAudience = (faq) => {
    if (faq.targetRole) {
      if (faq.targetRole.includes('vendor') && isVendor) return true;
      if (faq.targetRole.includes('customer') && user && !isVendor) return true;
      if (faq.targetRole.includes('guest') && !user) return true;
      return false;
    }
    return true;
  };

  const HELP_TOPICS = useMemo(() => [
    { id: "recommended", title: t("topics.recommended"), icon: Headphones },
    { id: "order-issues", title: t("topics.order-issues"), icon: Package },
    { id: "buying", title: t("topics.buying"), icon: CreditCard },
    { id: "shipping", title: t("topics.shipping"), icon: Truck },
    { id: "account", title: t("topics.account"), icon: User },
    { id: "promotions", title: t("topics.promotions"), icon: FileText },
    { id: "technical", title: t("topics.technical"), icon: Settings },
  ], [t]);

  const FAQ_DATA = t.raw("faqData") || {};

  const searchParams = useSearchParams();
  const router = useRouter();

  const queryFromUrl = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Fetch recent orders if user is logged in
  useEffect(() => {
    if (wooId) {
      setLoadingOrders(true);
      fetch(`/api/orders?customerId=${wooId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setRecentOrders(data.slice(0, 2));
          }
        })
        .catch(err => console.error("Error fetching orders:", err))
        .finally(() => setLoadingOrders(false));
    }
  }, [wooId]);

  // Fetch recently viewed items
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recently_viewed");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentlyViewed(parsed.slice(0, 3));
        }
      }
    } catch (e) { }
  }, []);

  useEffect(() => {
    setSearchQuery(queryFromUrl);
  }, [queryFromUrl]);

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      setIsAiTyping(true);
      setTimeout(() => {
        setIsAiTyping(false);
        router.push(`/help?search=${encodeURIComponent(searchQuery.trim())}`);
      }, 1500);
      setIsSearchFocused(false);
    }
  };

  const renderAction = (action) => {
    if (!action) return null;
    
    switch (action.type) {
      case "vendor_add_product":
        if (isVendor) {
          return <Link href="/merchant/dashboard/products/new" className="mt-3 inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-brand-dark transition-colors">{action.label} <ExternalLink size={14} /></Link>;
        }
        return null;
      case "vendor_orders":
        if (isVendor) {
          return <Link href="/merchant/dashboard/orders" className="mt-3 inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-brand-dark transition-colors">{action.label} <ExternalLink size={14} /></Link>;
        }
        return null;
      case "vendor_withdraw":
        if (isVendor) {
          return <Link href="/merchant/dashboard/withdraw" className="mt-3 inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-brand-dark transition-colors">{action.label} <ExternalLink size={14} /></Link>;
        }
        return null;
      case "vendor_coupons":
        if (isVendor) {
          return <Link href="/merchant/dashboard/coupons" className="mt-3 inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-brand-dark transition-colors">{action.label} <ExternalLink size={14} /></Link>;
        }
        return null;
      case "customer_orders":
        if (user) {
          return <Link href="/account/orders" className="mt-3 inline-flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-zinc-800 transition-colors">{action.label} <ExternalLink size={14} /></Link>;
        }
        return null;
      case "customer_wishlist":
        if (user) {
          return <Link href="/account/wishlist" className="mt-3 inline-flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-zinc-800 transition-colors">{action.label} <ExternalLink size={14} /></Link>;
        }
        return null;
      case "guest_register_vendor":
        if (!user) {
          return <Link href="/register?role=vendor" className="mt-3 inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-brand-dark transition-colors">{action.label} <ExternalLink size={14} /></Link>;
        }
        return null;
      default:
        return null;
    }
  };

  const filteredFaqs = useMemo(() => {
    if (!searchQuery) return [];
    const queryClean = searchQuery.toLowerCase().trim().replace(/[?.,!]/g, '');
    const results = [];

    Object.keys(FAQ_DATA).forEach(topic => {
      FAQ_DATA[topic].forEach((faq, index) => {
        const id = `${topic}-${index}`;
        const questionLower = faq.q.toLowerCase().replace(/[?.,!]/g, '');
        const answerLower = faq.a.toLowerCase().replace(/[?.,!]/g, '');

        let score = 0;
        // Exact match gets highest score
        if (questionLower.includes(queryClean) || answerLower.includes(queryClean)) {
          score += 100;
        }

        // Partial word matches
        const searchWords = queryClean.split(/\s+/).filter(w => w.length > 2);
        if (searchWords.length > 0) {
          searchWords.forEach(word => {
            if (questionLower.includes(word)) score += 20;
            if (answerLower.includes(word)) score += 10;
          });
        }

        if (score > 0 && isTargetAudience(faq)) {
          results.push({ ...faq, id, topic, score });
        }
      });
    });

    // Sort by highest score first
    return results.sort((a, b) => b.score - a.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, FAQ_DATA, isVendor, user]);

  const defaultFaqs = useMemo(() => {
    return (FAQ_DATA["recommended"] || [])
      .filter(isTargetAudience)
      .map((faq, index) => ({ ...faq, id: `recommended-${index}` }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [FAQ_DATA, isVendor, user]);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-zinc-800">
      {/* 1. Hero / AI Search Area */}
      <div className="bg-white border-b border-zinc-200 shadow-sm relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 end-0 p-32 bg-brand/5 blur-[100px] rounded-full -z-10 mix-blend-multiply" />
        <div className="absolute bottom-0 start-0 p-24 bg-blue-500/5 blur-[80px] rounded-full -z-10 mix-blend-multiply" />

        <div className="max-w-[800px] mx-auto px-4 py-16 text-center z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-light/30 border border-brand-light text-brand rounded-full text-[11px] font-bold mb-6">
            <Sparkles size={14} className="animate-pulse" />
            Mahally Assistant
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-zinc-900 mb-8 tracking-tight">
            {t("greeting", { name: customerName || (isAr ? "يا صديقي" : "friend") })}
          </h1>

          <form
            onSubmit={handleSearchSubmit}
            className={`flex items-center bg-white border-2 rounded-2xl p-1.5 transition-all shadow-md ${isSearchFocused ? 'border-brand shadow-brand/10 shadow-xl scale-[1.02]' : 'border-zinc-200 hover:border-zinc-300'}`}
          >
            <div className="pe-4 ps-3 text-zinc-400">
              <Search size={20} className={isSearchFocused ? "text-brand" : ""} />
            </div>
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="flex-1 px-2 py-3 outline-none text-[15px] bg-transparent font-medium placeholder:text-zinc-400 placeholder:font-normal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); router.push("/help"); }}
                className="p-2 text-zinc-400 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-all mx-1"
                title={t("clearSearch")}
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            )}
            <button
              type="submit"
              className="bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-dark transition-all text-[13px] ms-1 shadow-sm flex items-center gap-2"
            >
              <Sparkles size={16} />
              {isAr ? "اسأل" : "Ask"}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 py-12">
        {searchQuery ? (
          /* SEARCH RESULTS / AI ANSWER VIEW */
          <div className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isAiTyping ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-zinc-500 font-medium">
                  <Sparkles size={20} className="animate-pulse text-brand" />
                  {t("aiThinking") || "Mahally Assistant is thinking..."}
                </div>
                <div className="h-24 bg-zinc-100 rounded-2xl animate-pulse w-full max-w-md"></div>
                <div className="h-16 bg-zinc-100 rounded-2xl animate-pulse w-full max-w-sm"></div>
              </div>
            ) : filteredFaqs.length > 0 ? (
              <>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200">
                  <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">{t("aiResponseHeader") || t("searchResults")}</h2>
                    <p className="text-xs text-zinc-500">{t("aiSummary") || (isAr ? `بناءً على سؤالك: "${searchQuery}"` : `Based on your question: "${searchQuery}"`)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden transition-all hover:border-zinc-300 hover:shadow-md">
                      <button
                        onClick={() => toggleExpand(faq.id)}
                        className="w-full p-5 flex items-start justify-between text-start group gap-4"
                      >
                        <div className="flex-1">
                          <div className="text-[10px] font-bold text-brand uppercase tracking-wider mb-2">{HELP_TOPICS.find(t => t.id === faq.topic)?.title || faq.topic}</div>
                          <h3 className="text-sm font-bold text-zinc-900 group-hover:text-brand transition-colors leading-relaxed">
                            {faq.q}
                          </h3>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${expandedItems[faq.id] ? 'bg-brand text-white rotate-180' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                          <ChevronDown size={16} />
                        </div>
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedItems[faq.id] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-5 pt-0">
                          <div className="p-4 rounded-xl bg-zinc-50 text-zinc-700 text-[13px] leading-relaxed border border-zinc-100 relative">
                            {/* Little speech bubble tail */}
                            <div className={`absolute top-0 ${isAr ? 'left-8' : 'right-8'} -mt-2 w-4 h-4 bg-zinc-50 border-l border-t border-zinc-100 rotate-45`} />
                            <div className="relative z-10">
                              <p>{faq.a}</p>
                              {faq.action && renderAction(faq.action)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <div className="w-16 h-16 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle size={28} />
                </div>
                <h3 className="text-base font-bold text-zinc-900 mb-2">{t("noResultsTitle")}</h3>
                <p className="text-sm text-zinc-500 max-w-[300px] mx-auto mb-6">{t("noResultsDesc", { query: searchQuery })}</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => { setSearchQuery(""); router.push("/help"); }}
                    className="px-5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg text-[13px] transition-colors"
                  >
                    {t("clearSearch")}
                  </button>
                  <Link
                    href="/messages?to=admin"
                    className="px-5 py-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-lg text-[13px] transition-colors flex items-center gap-2"
                  >
                    <MessageSquare size={14} />
                    {t("chatWithUs")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* DEFAULT DASHBOARD VIEW */
          <div className="animate-in fade-in duration-500 space-y-10">
            {/* Dynamic Section: Recent Orders (Only if logged in) */}
            {wooId && (
              <section>
                <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <Package size={18} className="text-brand" />
                  {isVendor ? t("merchantOrders") : t("recentOrders")}
                </h2>

                {loadingOrders ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                      <div key={i} className="h-32 bg-zinc-100 rounded-2xl animate-pulse border border-zinc-200" />
                    ))}
                  </div>
                ) : recentOrders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentOrders.map(order => (
                      <div key={order.id} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-[11px] font-bold text-zinc-500 mb-1">{t("orderPlaced", { date: new Date(order.date_created).toLocaleDateString() })}</div>
                            <h3 className="text-sm font-bold text-zinc-900">Order #{order.id}</h3>
                          </div>
                          <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-zinc-200">
                            {order.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Link href={`/account/orders?id=${order.id}`} className="px-3 py-1.5 bg-brand/10 text-brand hover:bg-brand hover:text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1.5">
                            <Truck size={12} />
                            {t("trackOrder")}
                          </Link>
                          <Link href="/messages?to=admin" className="px-3 py-1.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1.5">
                            <MessageSquare size={12} />
                            {t("chatWithSupport")}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-white rounded-2xl border border-dashed border-zinc-300 text-center text-zinc-500 text-sm">
                    {t("noOrders")}
                  </div>
                )}
              </section>
            )}

            {/* Quick Links Section */}
            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <ExternalLink size={18} className="text-blue-500" />
                {t("quickLinks")}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {isVendor ? (
                  // VENDOR LINKS
                  <>
                    <Link href="/merchant/dashboard" className="p-4 bg-white rounded-xl border border-zinc-200 hover:border-purple-300 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-2 text-center group">
                      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                        <Settings size={18} />
                      </div>
                      <span className="text-[12px] font-bold text-zinc-700">{t("merchantDashboard")}</span>
                    </Link>
                    <Link href="/vendor/products" className="p-4 bg-white rounded-xl border border-zinc-200 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-2 text-center group">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <Package size={18} />
                      </div>
                      <span className="text-[12px] font-bold text-zinc-700">{t("merchantProducts")}</span>
                    </Link>
                  </>
                ) : (
                  // CUSTOMER LINKS
                  <>
                    <Link href="/account" className="p-4 bg-white rounded-xl border border-zinc-200 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-2 text-center group">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <User size={18} />
                      </div>
                      <span className="text-[12px] font-bold text-zinc-700">{t("manageAccount")}</span>
                    </Link>
                    <Link href="/browse" className="p-4 bg-white rounded-xl border border-zinc-200 hover:border-green-300 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-2 text-center group">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                        <ShoppingBag size={18} />
                      </div>
                      <span className="text-[12px] font-bold text-zinc-700">{t("browseProducts")}</span>
                    </Link>
                  </>
                )}

                <Link href="/messages?to=admin" className="p-4 bg-white rounded-xl border border-zinc-200 hover:border-brand-light hover:shadow-sm transition-all flex flex-col items-center justify-center gap-2 text-center group">
                  <div className="w-10 h-10 rounded-full bg-brand-light/30 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                    <MessageSquare size={18} />
                  </div>
                  <span className="text-[12px] font-bold text-zinc-700">{t("chatWithSupport")}</span>
                </Link>
                <Link href="/conditions" className="p-4 bg-white rounded-xl border border-zinc-200 hover:border-orange-300 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-2 text-center group">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                    <FileText size={18} />
                  </div>
                  <span className="text-[12px] font-bold text-zinc-700">{t("returnItems")}</span>
                </Link>
              </div>
            </section>

            {/* Recently Viewed (Dynamic) */}
            {recentlyViewed.length > 0 && !isVendor && (
              <section>
                <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-teal-500" />
                  {t("recentlyViewed") || "Jump Back In"}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {recentlyViewed.map(item => (
                    <Link key={item.id} href={`/product/${item.id}`} className="bg-white p-3 rounded-xl border border-zinc-200 flex items-center gap-3 hover:border-brand hover:shadow-sm transition-all">
                      <div className="w-12 h-12 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-bold text-zinc-900 truncate">{item.name}</div>
                        <div className="text-[10px] text-zinc-500">{t("viewProduct") || "View"} &rarr;</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Popular Topics Grid */}
            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <HelpCircle size={18} className="text-purple-500" />
                {t("popularTopics")}
              </h2>
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x rtl:divide-x-reverse border-b border-zinc-200">
                  {HELP_TOPICS.slice(0, 3).map(topic => (
                    <button key={topic.id} onClick={() => { setSearchQuery(topic.title); handleSearchSubmit(); }} className="p-5 flex items-start gap-3 hover:bg-zinc-50 transition-colors text-start">
                      <div className="mt-1 text-zinc-400">
                        <topic.icon size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-900 mb-1">{topic.title}</div>
                        <div className="text-[11px] text-zinc-500 line-clamp-2">
                          {((FAQ_DATA[topic.id] || []).filter(isTargetAudience))[0]?.q || "..."}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Default Recommended FAQs shown immediately without clicking */}
                <div className="p-6 bg-zinc-50/50">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">{t("topics.recommended")}</h3>
                  <div className="space-y-3">
                    {defaultFaqs.slice(0, 4).map((faq) => (
                      <div key={faq.id} className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                        <button
                          onClick={() => toggleExpand(faq.id)}
                          className="w-full p-4 flex items-center justify-between text-start group"
                        >
                          <h3 className="text-[13px] font-bold text-zinc-900 group-hover:text-brand transition-colors pe-8 leading-snug">
                            {faq.q}
                          </h3>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${expandedItems[faq.id] ? 'bg-brand text-white rotate-180' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                            <ChevronDown size={14} />
                          </div>
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedItems[faq.id] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="p-4 pt-0 border-t border-zinc-100">
                            <div className="text-zinc-600 text-[13px] leading-relaxed">
                              <p>{faq.a}</p>
                              {faq.action && (
                                <div>
                                  {renderAction(faq.action)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex justify-center items-center"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div></div>}>
      <HelpContent />
    </Suspense>
  );
}
