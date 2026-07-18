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
      <section className="w-full bg-white border-zinc-100">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8">

          {/* Header - Consistent with other sections */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-extrabold text-black tracking-tight flex items-center gap-3">
                <Play size={28} className="text-brand" />
                {t("title")}
              </h2>
              <div className="h-1.5 w-20 bg-brand rounded-full"></div>
              <p className="text-[13px] text-zinc-500 font-medium mt-1">
                {t("subtitle")}
              </p>
            </div>

            {isAdmin && (
              <Link
                href="/admin/settings"
                className="group flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 transition-all"
              >
                <Settings size={14} className="transition-transform group-hover:rotate-90" />
                {t("editVideo")}
              </Link>
            )}
          </div>

          {/* Video Promo Card */}
          <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm hover:shadow-xl transition-all duration-500">
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
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-300" />

              {/* Big Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-black shadow-2xl transition-all duration-300 group-hover:scale-110">
                  <Play fill="currentColor" size={36} className="me-1" />
                </div>
              </div>

              {/* Title Overlay */}
              <div className="absolute bottom-0 end-0 start-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-8 md:p-12">
                <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight max-w-2xl">
                  {finalTitle}
                </h3>
              </div>
            </button>

            {/* Bottom Content Area */}
            <div className="p-8 md:p-10">
              <p className="text-[15px] leading-relaxed text-zinc-600 md:text-base">
                {finalDescription}
              </p>

              <div className="mt-8 flex flex-row w-full gap-2 sm:gap-4">
                <button
                  onClick={() => setIsOpen(true)}
                  className="flex-1 inline-flex justify-center items-center gap-1.5 sm:gap-2 bg-brand hover:bg-brand/90 text-white px-2 sm:px-6 py-3 rounded-full text-[13px] sm:text-base font-medium transition-all active:scale-95 whitespace-nowrap"
                >
                  <Play size={16} className="sm:w-[18px] sm:h-[18px]" />
                  {t("watchVideo")}
                </button>

                <Link
                  href="/browse"
                  className="flex-1 inline-flex justify-center items-center gap-1.5 sm:gap-2 border border-zinc-300 hover:border-zinc-400 text-zinc-800 px-2 sm:px-6 py-3 rounded-full text-[13px] sm:text-base font-medium transition-all whitespace-nowrap"
                >
                  {t("exploreProducts")}
                  {locale === "ar" ? (
                    <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
                  ) : (
                    <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
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