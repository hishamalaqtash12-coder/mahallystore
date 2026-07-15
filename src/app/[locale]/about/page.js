import { Link } from "@/i18n/routing";
import { Store, ShoppingBag, Truck, Heart, Users, Globe, ShieldCheck, Zap } from "lucide-react";
import { getLocale } from "next-intl/server";

export const metadata = {
  title: "About Us - Mahally Jo",
  description: "Mahally is a specialized digital platform connecting local Jordanian stores, projects, and factories with customers nationwide.",
};

const content = {
  en: {
    hero: {
      title: "Empowering Local",
      highlight: "Communities",
      sub: "Connecting traditional Jordanian craftsmanship with the modern digital economy. Mahally is the bridge between your favorite local store and your doorstep.",
    },
    intro: {
      badge: "Digital Transformation",
      title: "A Specialized Digital Platform for Local Growth",
      p1: "Mahally is more than just a marketplace; it's a dedicated ecosystem designed to attract and support local stores, projects, and factories. We provide every merchant with a professional digital storefront, integrated payment solutions, and reliable delivery services.",
      p2: "Our mission is to facilitate the reach of local products to every corner of the Kingdom, ensuring the continuity of traditional businesses while contributing significantly to the national economy.",
      stats: [
        { value: "500+", label: "Local Merchants" },
        { value: "10k+", label: "Products Listed" },
        { value: "Jordan", label: "All Governorates" },
        { value: "Fast", label: "Reliable Delivery" },
      ],
    },
    why: {
      title: "One Market… Boundless Products",
      sub: "We shortened the distances so you can shop from your favorite local stores, no matter where you are in Jordan.",
      cards: [
        {
          title: "Same Shop Prices",
          desc: "Enjoy the exact same prices you would find in the physical shop. We ensure transparency and fairness in every transaction.",
        },
        {
          title: "Trusted Quality",
          desc: "Every merchant on Mahally is verified. We take pride in showcasing the authentic quality of Jordanian craftsmanship.",
        },
        {
          title: "Doorstep Delivery",
          desc: "Fast, reliable, and secure. We handle the logistics so you can focus on enjoying your local finds from across the country.",
        },
      ],
    },
    support: {
      title: "Support Your Neighborhood",
      desc: "By choosing Mahally, you are directly supporting the growth of local entrepreneurs, artisans, and family-owned businesses. Your purchase fuels the national economy and keeps our local heritage alive.",
      btnBrowse: "Browse Products",
      btnSell: "Become a Seller",
    },
  },
  ar: {
    hero: {
      title: "نمكّن المجتمعات",
      highlight: "المحلية",
      sub: "نربط الحرف الأردنية الأصيلة بالاقتصاد الرقمي الحديث. محلي هو الجسر بين متجرك المفضل وباب بيتك.",
    },
    intro: {
      badge: "التحول الرقمي",
      title: "منصة رقمية متخصصة لدعم النمو المحلي",
      p1: "محلي ليس مجرد سوق إلكتروني؛ بل هو منظومة متكاملة مصممة لاستقطاب ودعم المتاجر المحلية والمشاريع الصغيرة والمصانع الأردنية. نوفر لكل تاجر واجهة متجر رقمية احترافية، وحلول دفع متكاملة، وخدمات توصيل موثوقة.",
      p2: "مهمتنا هي تسهيل وصول المنتجات المحلية إلى كل ركن من أركان المملكة، وضمان استمرارية الأعمال التقليدية مع الإسهام في الاقتصاد الوطني.",
      stats: [
        { value: "+500", label: "تاجر محلي" },
        { value: "+10k", label: "منتج مدرج" },
        { value: "الأردن", label: "جميع المحافظات" },
        { value: "سريع", label: "توصيل موثوق" },
      ],
    },
    why: {
      title: "سوق واحد… منتجات لا حدود لها",
      sub: "قصّرنا المسافات لتتسوق من متاجرك المحلية المفضلة أينما كنت في الأردن.",
      cards: [
        {
          title: "أسعار المتجر ذاتها",
          desc: "استمتع بنفس الأسعار التي تجدها في المتجر الفعلي. نضمن الشفافية والعدالة في كل معاملة.",
        },
        {
          title: "جودة موثوقة",
          desc: "كل تاجر على منصة محلي موثّق ومُعتمد. نفخر بعرض جودة الحرف الأردنية الأصيلة.",
        },
        {
          title: "توصيل لباب البيت",
          desc: "سريع وموثوق وآمن. نتولى اللوجستيات لتتمتع بمشترياتك من جميع أنحاء البلاد.",
        },
      ],
    },
    support: {
      title: "ادعم حيّك",
      desc: "باختيارك محلي، أنت تدعم مباشرة نمو رواد الأعمال المحليين والحرفيين والشركات العائلية. مشترياتك تعزز الاقتصاد الوطني وتحافظ على تراثنا المحلي.",
      btnBrowse: "تصفّح المنتجات",
      btnSell: "افتح متجرك",
    },
  },
};

const icons = [Store, ShoppingBag, Users, Truck];
const whyIcons = [Zap, ShieldCheck, Truck];

export default async function AboutPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const t = isAr ? content.ar : content.en;

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden" dir={isAr ? "rtl" : "ltr"}>

      {/* 1. Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center text-white overflow-hidden">
        <img
          src="https://www.salesforce.com/blog/wp-content/uploads/sites/2/2020/08/About-Us-Page.jpg"
          alt="Mahally local market"
          className="absolute inset-0 w-full h-full object-cover brightness-[0.4]"
        />
        <div className="relative z-10 max-w-[900px] mx-auto text-center px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            {t.hero.title} <span className="text-brand">{t.hero.highlight}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-[700px] mx-auto leading-relaxed">
            {t.hero.sub}
          </p>
        </div>
      </section>

      {/* 2. Introduction Section */}
      <section className="py-24 px-4 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-light text-brand rounded-full text-sm font-bold uppercase tracking-wider">
              <Globe size={16} />
              <span>{t.intro.badge}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 leading-tight">
              {t.intro.title}
            </h2>
            <p className="text-zinc-600 text-lg leading-relaxed">{t.intro.p1}</p>
            <p className="text-zinc-600 text-lg leading-relaxed">{t.intro.p2}</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {t.intro.stats.map((stat, i) => {
              const Icon = icons[i];
              return (
                <div key={i} className="bg-zinc-50 p-8 rounded-2xl border border-zinc-100 flex flex-col items-center text-center">
                  <Icon size={40} className="text-brand mb-4" />
                  <h3 className="text-2xl font-bold text-zinc-900 mb-1">{stat.value}</h3>
                  <p className="text-zinc-500 text-sm font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Why Mahally */}
      <section className="bg-brand-dark py-24 text-white">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">{t.why.title}</h2>
            <p className="text-white/60 max-w-[700px] mx-auto text-lg">{t.why.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.why.cards.map((card, i) => {
              const Icon = whyIcons[i];
              return (
                <div key={i} className="bg-white/5 backdrop-blur-sm p-10 rounded-2xl border border-white/10 hover:border-brand/30 transition-all group">
                  <div className="w-14 h-14 bg-brand-light rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon size={28} className="text-brand-dark" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{card.title}</h3>
                  <p className="text-white/70 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Support Local */}
      <section className="py-24 px-4 max-w-[1280px] mx-auto text-center">
        <div className="bg-zinc-50 rounded-[32px] p-12 md:p-20 border border-zinc-100">
          <Heart size={64} className="text-brand mx-auto mb-8 animate-pulse" />
          <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-6">{t.support.title}</h2>
          <p className="text-zinc-600 text-lg md:text-xl max-w-[800px] mx-auto mb-10 leading-relaxed">
            {t.support.desc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/browse"
              className="w-full sm:w-auto h-[52px] px-10 bg-brand hover:bg-brand-dark text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-all"
            >
              {t.support.btnBrowse}
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto h-[52px] px-10 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-900 rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-all"
            >
              {t.support.btnSell}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Spacer */}
      <div className="h-20" />

    </div>
  );
}
