"use client";

import { useEffect, useState } from "react";
import { Play, X, Settings, ArrowRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";

export default function VideoPromo({
  videoUrl,
  thumbnail,
  title,
  description,
}) {
  const t = useTranslations("VideoPromo");
  const locale = useLocale();
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Translate default Arabic database titles if viewing in English
  const getLocalizedText = (text, defaultKey) => {
    if (locale === 'en') {
      if (text === "دعم المنتجات الأردنية المحلية" || defaultKey === "defaultTitle") {
        return "Supporting Jordanian Local Products";
      }
      if (text === "انضم إلى آلاف المتسوقين الذين يدعمون التجار المحليين في جميع أنحاء المملكة." || defaultKey === "defaultDesc") {
        return "Join thousands of shoppers supporting local merchants across the Kingdom.";
      }
    }
    return text || t(defaultKey);
  };

  const finalVideoUrl = videoUrl || "https://www.youtube.com/embed/XHOmBV4js_E";
  const finalThumbnail = thumbnail || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop";
  const finalTitle = getLocalizedText(title, "defaultTitle");
  const finalDescription = getLocalizedText(description, "defaultDesc");

  const getEmbedUrl = (url) => {
    if (url.includes("embed")) return `${url}?autoplay=1`;

    const idMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return idMatch ? `https://www.youtube.com/embed/${idMatch[1]}?autoplay=1` : url;
  };

  // Prevent body scroll when modal opens
  useEffect(() => {
    if (typeof document !== "undefined" && document.body) {
      document.body.style.overflow = isOpen ? "hidden" : "auto";
    }
    return () => {
      if (typeof document !== "undefined" && document.body) {
        document.body.style.overflow = "auto";
      }
    };
  }, [isOpen]);

  return (
    <>
      <section className="w-full bg-gradient-to-b from-white to-zinc-50/50 py-4">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex flex-col items-center text-center gap-3 mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
              {t("title")}
            </h2>

            <div className="h-1.5 w-16 bg-brand rounded-full"></div>

            <p className="text-sm sm:text-base text-zinc-500 font-medium max-w-lg leading-relaxed">
              {t("subtitle")}
            </p>

            {isAdmin && (
              <Link
                href="/admin/settings"
                className="group mt-2 flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 transition-all"
              >
                <Settings size={14} className="transition-transform group-hover:rotate-90" />
                {t("editVideo")}
              </Link>
            )}
          </div>

          {/* Video Promo Card */}
          <div className="group relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-md hover:shadow-2xl transition-all duration-500">
            <button
              onClick={() => setIsOpen(true)}
              className="relative w-full aspect-video overflow-hidden"
            >
              <Image
                src={finalThumbnail}
                alt={finalTitle}
                fill
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:bg-black/30 transition-all duration-300" />

              {/* Glowing Pulse Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-24 h-24 rounded-full bg-brand/40 animate-ping" />
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-zinc-900 shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-brand group-hover:text-white">
                    <Play fill="currentColor" size={32} className="ms-1" />
                  </div>
                </div>
              </div>

              {/* Title Overlay */}
              <div className="absolute bottom-0 end-0 start-0 p-6 md:p-10 text-start">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight max-w-2xl drop-shadow-md">
                  {finalTitle}
                </h3>
              </div>
            </button>

            {/* Bottom Content Area */}
            <div className="p-6 md:p-8">
              <p className="text-sm sm:text-base leading-relaxed text-zinc-600 font-medium">
                {finalDescription}
              </p>

              {/* Trust Badges Bar */}
              <div className="mt-6 flex flex-wrap items-center gap-3 pt-6 border-t border-zinc-100 text-xs font-bold text-zinc-700">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200">
                  🇯🇴 {locale === "ar" ? "منتجات أردنية محليّة 100%" : "100% Local Products"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200">
                  🚚 {locale === "ar" ? "توصيل سريع لكل المحافظات" : "Fast Delivery Across Jordan"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200">
                  ⭐ {locale === "ar" ? "آلاف التجار والعملاء السعداء" : "Thousands of Happy Buyers"}
                </span>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row w-full gap-3">
                <button
                  onClick={() => setIsOpen(true)}
                  className="flex-1 inline-flex justify-center items-center gap-2 bg-brand hover:bg-brand-dark text-white px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-md active:scale-95 whitespace-nowrap"
                >
                  <Play size={16} className="fill-white" />
                  {t("watchVideo")}
                </button>

                <Link
                  href="/browse"
                  className="flex-1 inline-flex justify-center items-center gap-2 border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-900 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-xs whitespace-nowrap"
                >
                  {t("exploreProducts")}
                  {locale === "ar" ? (
                    <ArrowLeft size={16} />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute start-5 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white hover:text-black transition-all"
          >
            <X size={24} />
          </button>

          <div className="relative w-full max-w-5xl aspect-video overflow-hidden rounded-3xl bg-black shadow-2xl">
            {finalVideoUrl.match(/\.(mp4|webm|ogg|mov)$/) || !finalVideoUrl.includes("yout") ? (
              <video src={finalVideoUrl} controls autoPlay playsInline className="h-full w-full" />
            ) : (
              <iframe
                src={getEmbedUrl(finalVideoUrl)}
                title="Promotional Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}