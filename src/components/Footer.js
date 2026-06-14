"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { useState, useEffect } from "react";

export default function Footer() {
   const [settings, setSettings] = useState(null);

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

   // SVG Icons
   const FacebookIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>;
   const InstagramIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
   const TwitterIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
   const TikTokIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.06-1.51-.38-.31-.7-.67-.97-1.07v6.23c-.07 2.4-1.22 4.8-3.32 6-1.57.92-3.48 1.17-5.25.7-2.61-.69-4.71-3.05-4.88-5.77-.28-3.41 2.22-6.66 5.6-7.1 1.25-.17 2.53.07 3.65.68V.02z"/></svg>;

   return (
      <footer className="font-sans w-full bg-[#fafafa] border-t border-zinc-200 py-12 md:py-16">
         <div className="max-w-[1200px] mx-auto px-4 lg:px-8 flex flex-col md:flex-row justify-between gap-12 md:gap-4">
            
            {/* Right Side in RTL (First DOM element) */}
            <div className="flex flex-col w-full md:w-1/2">
               <h3 className="font-extrabold text-[16px] mb-6 text-black">المزيد عن محلي</h3>
               <ul className="space-y-3 text-[14px] text-zinc-600 font-medium mb-8">
                  <li><Link href="/" className="hover:text-brand transition-colors">الرئيسية</Link></li>
                  <li><Link href="/conditions" className="hover:text-brand transition-colors">سياسة الخصوصية</Link></li>
                  <li><Link href="/contact" className="hover:text-brand transition-colors">اتصل بنا</Link></li>
                  <li><Link href="/register" className="hover:text-brand transition-colors">انضم كتاجر</Link></li>
                  <li><Link href="/about" className="hover:text-brand transition-colors">عن محلي</Link></li>
                  <li><Link href="/help" className="hover:text-brand transition-colors">الأسئلة الشائعة</Link></li>
               </ul>
               
               <ul className="flex items-center gap-3 text-white">
                  <li>
                     <a href={settings?.socialFacebook || "#"} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#7A192B] hover:bg-[#5A0F1E] flex items-center justify-center transition-colors">
                        <FacebookIcon />
                     </a>
                  </li>
                  <li>
                     <a href={settings?.socialInstagram || "#"} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#7A192B] hover:bg-[#5A0F1E] flex items-center justify-center transition-colors">
                        <InstagramIcon />
                     </a>
                  </li>
                  <li>
                     <a href={settings?.socialTwitter || "#"} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#7A192B] hover:bg-[#5A0F1E] flex items-center justify-center transition-colors">
                        <TwitterIcon />
                     </a>
                  </li>
                  <li>
                     <a href={settings?.socialTikTok || "#"} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#7A192B] hover:bg-[#5A0F1E] flex items-center justify-center transition-colors">
                        <TikTokIcon />
                     </a>
                  </li>
               </ul>
            </div>

            {/* Left Side in RTL (Second DOM element) */}
            <div className="flex flex-col w-full md:w-1/2 md:items-start text-right">
               <h3 className="font-extrabold text-[16px] mb-6 text-black">سوق واحد... منتجات بلا حدود</h3>
               <p className="text-[14px] text-zinc-600 leading-relaxed max-w-[400px] mb-8 font-medium">
                  اختصرنا عليك المشاوير البعيدة لتشتري من محلك المفضل وين ما كنت بالأردن، جمعنالك كثير متاجر من كل المحافظات بمكان واحد، وبنفس سعر المحل! مع توصيل سريع وموثوق لباب بيتك.
               </p>
               <div className="font-black text-[20px] text-[#7A192B] tracking-wide" dir="ltr" style={{ textAlign: 'right' }}>
                  +962 7 8276 0463
               </div>
            </div>

         </div>
      </footer>
   );
}
