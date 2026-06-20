"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  RotateCcw,
  User,
  Settings,
  FileText,
  Headphones,
  ArrowRight
} from "lucide-react";

// --- Design Tokens ---
const PRIMARY_COLOR = "#be374f";
const ACCENT_COLOR = "#8f2d4a";

// --- Mock Data ---
const HELP_TOPICS = [
  { id: "recommended", title: "المواضيع المقترحة", icon: Headphones },
  { id: "order-issues", title: "مشاكل الطلب", icon: Package },
  { id: "buying", title: "التسوق في محلي", icon: CreditCard },
  { id: "shipping", title: "الشحن والتوصيل", icon: Truck },
  { id: "account", title: "الحساب والأمان", icon: User },
  { id: "promotions", title: "العروض والرصيد", icon: FileText },
  { id: "technical", title: "المشاكل التقنية", icon: Settings },
];

const FAQ_DATA = {
  "recommended": [
    { q: "كيف أتابع طلبي؟", a: "يمكنك متابعة طلبك في قسم 'طلباتي'. اضغط على زر 'تتبع' بجانب الطلب للاطلاع على حالة الشحن الفورية. نرسل أيضًا إشعارات عبر البريد الإلكتروني لكل تحديث." },
    { q: "أين أجد رقم الطلب؟", a: "رقم الطلب هو رقم مكون من 12 رقماً ويبدأ عادةً بـ 'MAH'. يمكنك العثور عليه في رسالة تأكيد الطلب وفي قسم 'طلباتي' داخل حسابك." },
    { q: "كيف ألغي طلبي؟", a: "يمكن إلغاء الطلب خلال 30 دقيقة من إنشائه. اذهب إلى 'طلباتي' وابحث عن الطلب ثم اضغط على 'إلغاء الطلب'. إذا أصبح الطلب في حالة 'قيد المعالجة' أو 'تم الشحن'، سيتوجب الانتظار حتى يتم التوصيل." }
  ],
  "order-issues": [
    { q: "هل يمكنني إلغاء جزء من طلبي؟", a: "نعم، يمكنك إلغاء عناصر محددة من الطلب قبل أن تتم معالجتها للشحن. افتح تفاصيل الطلب واختر 'إلغاء العنصر' للمنتج المطلوب." },
    { q: "كيف أطلب مساعدة بشأن الطلب؟", a: "اختر الطلب من قسم 'طلباتي' واضغط على 'الحصول على مساعدة'. سيتم ربطك بالبائع مباشرةً أو بفريق الدعم الرسمي عبر المراسلة." },
    { q: "طلبت عدة منتجات معاً، لماذا أرى بعضها فقط؟", a: "محلي هو سوق متعدد البائعين. تُدار الطلبات من بائعين مختلفين بشكل منفصل، لذا قد تستلم عدة طرود وأرقام تتبع لطلب واحد." }
  ],
  "buying": [
    { q: "كيف أستخدم رمز الخصم؟", a: "يمكنك إدخال رمز الخصم في صفحة الدفع ضمن قسم 'الدفع'. اضغط على 'تطبيق الكوبون' قبل إتمام الشراء." },
    { q: "هل التسوق على محلي آمن؟", a: "بالتأكيد. نستخدم تشفير SSL لجميع المعاملات ونقدّم حماية شراء محلي لضمان أموالك حتى يتم تسليم الطلب بصورة سليمة." }
  ],
  "shipping": [
    { q: "كم يستغرق الشحن؟", a: "عادةً يستغرق الشحن القياسي داخل الأردن من 2 إلى 5 أيام عمل. قد تختلف المدة حسب موقع البائع." },
    { q: "هل يوجد شحن سريع؟", a: "تتوفر خيارات الشحن السريع لبعض المنتجات. ابحث عن سرعة الشحن 'سريع' أثناء صفحة الدفع." }
  ],
  "account": [
    { q: "كيف أؤمّن حسابي؟", a: "نوصي باستخدام كلمة مرور قوية وفريدة وتمكين أي خيارات تحقق إضافية متاحة في إعدادات الحساب." }
  ],
  "promotions": [
    { q: "كيف تعمل أرصدة العروض؟", a: "تُطبَّق أرصدة العروض تلقائياً على السلة عند الدفع للمنتجات المؤهلة. يمكنك مشاهدة الأرصدة المتاحة في ملفك الشخصي." }
  ],
  "technical": [
    { q: "الموقع يعمل ببطء أو لا يعمل.", a: "جرّب مسح ذاكرة المتصفح وملفات تعريف الارتباط أو استخدام جهاز آخر. إذا استمر المشكلة، اتصل بفريق الدعم." }
  ]
};

const SEARCH_SUGGESTIONS = [
  "كيف أتابع طلبي؟",
  "أين رقم الطلب؟",
  "كيف ألغي طلبي؟",
  "هل يمكنني إلغاء جزء من طلبي؟"
];

import { Suspense } from "react";

function HelpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryFromUrl = searchParams.get("search") || "";
  const topicFromUrl = searchParams.get("topic") || "recommended";

  const [activeTopic, setActiveTopic] = useState(topicFromUrl);
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  // Sync state with URL
  useEffect(() => {
    setActiveTopic(topicFromUrl);
    setSearchQuery(queryFromUrl);
  }, [topicFromUrl, queryFromUrl]);

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleTopicChange = (topicId) => {
    router.push(`/help?topic=${topicId}`);
    setSearchQuery("");
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/help?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
    }
  };

  const handleSuggestionClick = (s) => {
    setSearchQuery(s);
    router.push(`/help?search=${encodeURIComponent(s)}`);
    setIsSearchFocused(false);
  };

  const filteredFaqs = useMemo(() => {
    if (!searchQuery) return FAQ_DATA[activeTopic] || [];

    const queryClean = searchQuery.toLowerCase().trim().replace(/[?.,!]/g, '');
    const results = [];
    
    Object.keys(FAQ_DATA).forEach(topic => {
      FAQ_DATA[topic].forEach((faq, index) => {
        const id = `${topic}-${index}`;
        const questionLower = faq.q.toLowerCase().replace(/[?.,!]/g, '');
        const answerLower = faq.a.toLowerCase().replace(/[?.,!]/g, '');

        // 1. Try exact substring match first
        if (questionLower.includes(queryClean) || answerLower.includes(queryClean)) {
          results.push({ ...faq, id });
          return;
        }

        // 2. Otherwise split into words and check if significant terms match
        const searchWords = queryClean.split(/\s+/).filter(w => w.length > 2);
        if (searchWords.length > 0) {
          const matchAll = searchWords.every(word => questionLower.includes(word) || answerLower.includes(word));
          if (matchAll) {
            results.push({ ...faq, id });
          }
        }
      });
    });
    return results;
  }, [searchQuery, activeTopic]);

  const currentFaqs = useMemo(() => {
    return (FAQ_DATA[activeTopic] || []).map((faq, index) => ({ ...faq, id: `${activeTopic}-${index}` }));
  }, [activeTopic]);

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-800 text-xs">

      {/* 1. Header & Search Area */}
      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-[1000px] mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-zinc-500 mb-6 text-[11px]">
            <Link href="/" className="hover:underline">الرئيسية</Link>
            <ChevronRight size={12} />
            <Link href="/help" className="hover:underline">مركز المساعدة</Link>
            {searchQuery && (
              <>
                <ChevronRight size={12} />
                <span className="text-zinc-800">نتائج البحث</span>
              </>
            )}
          </div>

          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-bold text-zinc-950 mb-6 tracking-tight">مرحباً، كيف يمكننا مساعدتك؟</h1>

            {/* Search Bar Container */}
            <div className="max-w-[500px] mx-auto relative">
              <form
                onSubmit={handleSearchSubmit}
                className={`flex items-center bg-white border rounded-md p-0.5 transition-all ${isSearchFocused ? 'border-brand ring-2 ring-brand/10' : 'border-zinc-300'}`}
              >
                <div className="pl-3 text-zinc-400">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="اسأل سؤالاً..."
                  className="flex-1 px-3 py-1.5 outline-none text-xs bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(""); router.push("/help"); }}
                    className="p-1 mr-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-brand text-white px-5 py-1.5 rounded-sm font-semibold hover:bg-brand-dark transition-all text-xs"
                >
                  بحث
                </button>
              </form>

              {/* Suggestions Dropdown */}
              {isSearchFocused && !searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-lg border border-zinc-200 z-50 overflow-hidden text-left py-2">
                  <div className="px-4 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">عمليات البحث الشائعة</div>
                  {SEARCH_SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-3 text-zinc-700 font-medium"
                    >
                      <Search size={12} className="text-zinc-400" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Layout Grid */}
      <div className="max-w-[1000px] mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">

        {/* Sidebar Nav */}
        <aside className="w-full md:w-[240px] shrink-0 space-y-6">
          <Link
            href="/messages?to=admin"
            className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-all group"
          >
            <div>
              <div className="text-[10px] font-bold text-brand mb-0.5">سجل الدعم</div>
              <div className="text-sm font-bold text-zinc-955 flex items-center gap-1.5">
                تحدث مع خدمة العملاء
                <ArrowRight size={14} className="group-hover:-translate-x-0.5 transition-transform rotate-180" />
              </div>
            </div>
            <div className="w-8 h-8 bg-brand rounded-md flex items-center justify-center text-white">
              <MessageSquare size={16} />
            </div>
          </Link>

          <div>
            <h2 className="text-sm font-bold text-zinc-950 mb-3 px-1 flex items-center gap-2">
              <span className="w-1 h-4 bg-brand rounded-sm inline-block" />
              جميع مواضيع المساعدة
            </h2>
            <nav className="space-y-1">
              {HELP_TOPICS.map((topic) => {
                const isActive = activeTopic === topic.id && !searchQuery;
                return (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicChange(topic.id)}
                    className={`w-full text-right flex items-center justify-between px-3 py-2 rounded-md transition-all ${isActive ? 'bg-brand-light text-brand-dark font-bold shadow-sm' : 'hover:bg-zinc-50 text-zinc-600'}`}
                  >
                    <div className="flex items-center gap-3">
                      <topic.icon size={14} className={isActive ? 'text-brand' : 'text-zinc-400'} />
                      <span className="text-xs">{topic.title}</span>
                    </div>
                    {isActive && <ChevronRight size={14} className="rotate-180" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1">
          {searchQuery ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-zinc-950">نتائج البحث</h2>
                <div className="text-[10px] text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200 font-bold">
                  تم العثور على {filteredFaqs.length} نتيجة
                </div>
              </div>

              <div className="space-y-3">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                    <button
                      onClick={() => toggleExpand(faq.id)}
                      className="w-full p-4 flex items-center justify-between text-right group"
                    >
                      <h3 className="text-xs font-bold text-zinc-900 group-hover:text-brand transition-colors pl-8 leading-snug">
                        {faq.q}
                      </h3>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${expandedItems[faq.id] ? 'bg-brand text-white rotate-180' : 'bg-zinc-100 text-zinc-400'}`}>
                        <ChevronDown size={14} />
                      </div>
                    </button>
                    <div className={`overflow-hidden transition-all duration-200 ${expandedItems[faq.id] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="p-4 pt-0 border-t border-zinc-100">
                        <div className="p-4 rounded bg-zinc-50 text-zinc-600 leading-relaxed border border-zinc-150">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredFaqs.length === 0 && (
                  <div className="text-center py-16 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
                    <h3 className="text-sm font-bold text-zinc-900 mb-1">لا توجد نتائج</h3>
                    <p className="text-zinc-500 max-w-[240px] mx-auto mb-4">لم نجد أي مقالات تطابق "{searchQuery}". جرّب كلمات مختلفة.</p>
                    <button
                      onClick={() => { setSearchQuery(""); router.push("/help"); }}
                      className="text-brand font-bold hover:underline"
                    >
                      مسح البحث وعرض جميع المواضيع
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-base font-bold text-zinc-950">
                  {HELP_TOPICS.find(t => t.id === activeTopic)?.title}
                </h2>
              </div>

              <div className="space-y-3">
                {currentFaqs.map((faq) => (
                  <div key={faq.id} className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                    <button
                      onClick={() => toggleExpand(faq.id)}
                      className="w-full p-4 flex items-center justify-between text-right group"
                    >
                      <h3 className="text-xs font-bold text-zinc-900 group-hover:text-brand transition-colors pl-8 leading-snug">
                        {faq.q}
                      </h3>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${expandedItems[faq.id] ? 'bg-brand text-white rotate-180' : 'bg-zinc-100 text-zinc-400'}`}>
                        <ChevronDown size={14} />
                      </div>
                    </button>
                    <div className={`overflow-hidden transition-all duration-200 ${expandedItems[faq.id] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="p-4 pt-0 border-t border-zinc-100">
                        <div className="p-4 rounded bg-zinc-50 text-zinc-600 leading-relaxed border border-zinc-150">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact CTA Section */}
              <div className="mt-12 p-6 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                <h3 className="text-sm font-bold text-zinc-950 mb-1">هل ما زلت بحاجة للمساعدة؟</h3>
                <p className="text-zinc-600 mb-6 max-w-[400px] mx-auto">فريق الدعم جاهز لمساعدتك في أي استفسار.</p>
                <div className="flex justify-center">
                  <Link
                    href="/messages?to=admin"
                    className="bg-brand text-white px-6 py-2 rounded-sm font-bold hover:bg-brand-dark transition-all flex items-center gap-2 text-xs"
                  >
                    <MessageSquare size={14} />
                    تحدث معنا
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex justify-center items-center"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div></div>}>
      <HelpContent />
    </Suspense>
  );
}
