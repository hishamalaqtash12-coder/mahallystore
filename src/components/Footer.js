"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Phone, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Footer() {
   const t = useTranslations("Footer");
   const [settings, setSettings] = useState(null);
   const { user } = useAuth();

   useEffect(() => {
      fetch("/api/settings/public")
         .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
         })
         .then(data => setSettings(data))
         .catch(err => console.error("Failed to load footer settings:", err));
   }, []);

   const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
   };

   const currentYear = new Date().getFullYear();

   // SVG Icons
   const FacebookIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" /></svg>;
   const InstagramIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
   const YoutubeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.582 6.186a2.632 2.632 0 0 0-1.854-1.854C18.094 3.896 12 3.896 12 3.896s-6.094 0-7.728.436a2.631 2.631 0 0 0-1.854 1.854C2 7.82 2 12 2 12s0 4.18.418 5.814a2.63 2.63 0 0 0 1.854 1.854C5.906 20.104 12 20.104 12 20.104s6.094 0 7.728-.436a2.63 2.63 0 0 0 1.854-1.854C22 16.18 22 12 22 12s0-4.18-.418-5.814zm-11.758 8.85v-6.07l5.727 3.035-5.727 3.036z" /></svg>;
   const TikTokIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.06-1.51-.38-.31-.7-.67-.97-1.07v6.23c-.07 2.4-1.22 4.8-3.32 6-1.57.92-3.48 1.17-5.25.7-2.61-.69-4.71-3.05-4.88-5.77-.28-3.41 2.22-6.66 5.6-7.1 1.25-.17 2.53.07 3.65.68V.02z" /></svg>;

   const socialLinks = [
      { key: "facebook", href: settings?.socialFacebook, Icon: FacebookIcon, label: "Facebook" },
      { key: "instagram", href: settings?.socialInstagram, Icon: InstagramIcon, label: "Instagram" },
      { key: "youtube", href: settings?.socialYoutube, Icon: YoutubeIcon, label: "YouTube" },
      { key: "tiktok", href: settings?.socialTikTok, Icon: TikTokIcon, label: "TikTok" },
   ].filter(s => s.href);

   return (
      <footer className="relative font-sans w-full overflow-hidden border-t border-zinc-200">
         {/* base */}
         <div className="absolute inset-0 bg-[#fafafa]" />
         {/* brand glow */}
         <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-brand/10 blur-[100px]" />
         <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-brand/5 blur-[100px]" />

         <div className="relative">
            <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-14 md:py-16">
               <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-8">

                  {/* Right Side in RTL (First DOM element) */}
                  <div className="flex flex-col w-full md:w-1/2">
                     <h3 className="font-extrabold text-[16px] mb-6 text-black">{t("moreAbout")}</h3>
                     <ul className="space-y-3 text-[14px] text-zinc-600 font-medium mb-8">
                        <li><Link href="/" className="hover:text-brand transition-colors">{t("home")}</Link></li>
                        <li><Link href="/conditions" className="hover:text-brand transition-colors">{t("privacyPolicy")}</Link></li>
                        <li><Link href="/contact" className="hover:text-brand transition-colors">{t("contactUs")}</Link></li>
                        {!user && <li><Link href="/register" className="hover:text-brand transition-colors">{t("joinAsMerchant")}</Link></li>}
                        <li><Link href="/about" className="hover:text-brand transition-colors">{t("aboutMahally")}</Link></li>
                        <li><Link href="/help" className="hover:text-brand transition-colors">{t("faq")}</Link></li>
                     </ul>

                     {socialLinks.length > 0 && (
                        <div>
                           <span className="block text-[12px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                              {t("followUs")}
                           </span>
                           <ul className="flex items-center gap-2.5">
                              {socialLinks.map(({ key, href, Icon, label }) => (
                                 <li key={key}>
                                    <a
                                       href={href}
                                       target="_blank"
                                       rel="noreferrer"
                                       aria-label={label}
                                       className="group relative w-10 h-10 rounded-full border border-zinc-200 bg-white text-zinc-500 flex items-center justify-center
                                               transition-all duration-200 ease-out
                                               hover:border-brand hover:bg-brand hover:text-white hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-4px_rgba(0,0,0,0.25)]
                                               focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                    >
                                       <Icon />
                                    </a>
                                 </li>
                              ))}
                           </ul>
                        </div>
                     )}
                  </div>

                  {/* Left Side in RTL (Second DOM element) */}
                  <div className="flex flex-col w-full md:w-1/2 md:items-start text-start">
                     <h3 className="font-extrabold text-[16px] mb-6 text-black">{t("oneMarket")}</h3>
                     <p className="text-[14px] text-zinc-600 leading-relaxed max-w-[400px] mb-8 font-medium">
                        {t("footerDesc")}
                     </p>

                     <a
                        href="tel:+962782760463"
                        className="group inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white pl-5 pr-2 py-2
                                transition-all duration-200 hover:border-brand hover:shadow-[0_6px_16px_-4px_rgba(0,0,0,0.15)]"
                        dir="ltr"
                     >
                        <span className="font-black text-[16px] text-black tracking-wide">
                           +962 7 8276 0463
                        </span>
                        <span className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center transition-colors group-hover:bg-brand-dark">
                           <Phone size={15} />
                        </span>
                     </a>
                  </div>

               </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-zinc-200">
               <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-5 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
                  <p className="text-[13px] text-zinc-400 font-medium">
                     {t.rich("copyright", { year: currentYear, defaultValue: `© ${currentYear} Mahally. All rights reserved.` })}
                  </p>
                  <button
                     onClick={scrollToTop}
                     aria-label={t("backToTop")}
                     className="group flex items-center gap-2 text-[13px] font-semibold text-zinc-500 hover:text-brand transition-colors"
                  >
                     {t("backToTop")}
                     <span className="w-7 h-7 rounded-full border border-zinc-300 flex items-center justify-center transition-all group-hover:border-brand group-hover:-translate-y-0.5">
                        <ArrowUp size={13} />
                     </span>
                  </button>
               </div>
            </div>
         </div>
      </footer>
   );
}