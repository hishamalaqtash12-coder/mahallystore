"use client";

import { usePathname } from "@/i18n/routing";
import Header from "./Header";
import Footer from "./Footer";
import ServiceStatusBanner from "./ServiceStatusBanner";
import LocaleDirectionSetter from "./LocaleDirectionSetter";
import RegistrationPopup from "./RegistrationPopup";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();

  // Normalize pathname by stripping leading locale segment if present (e.g., /en/...)
  let normalized = pathname || "/";
  const maybeLocale = normalized.split('/')[1];
  if (maybeLocale === 'en' || maybeLocale === 'ar') {
    normalized = '/' + normalized.split('/').slice(2).join('/');
    if (normalized === '/') normalized = '/';
  }

  // Check if we are in the merchant dashboard, admin dashboard, auth pages, or messages page
  const isDashboard = normalized.startsWith("/merchant/dashboard") || normalized.startsWith("/admin");
  const isAuthPage = normalized === "/login" || normalized === "/register";
  const isMessagesPage = normalized.startsWith("/messages");

  if (isDashboard || isAuthPage || isMessagesPage) {
    if (isMessagesPage) {
      return (
        <div className="fixed inset-0 flex flex-col bg-white z-50 overflow-hidden">
          {children}
        </div>
      );
    }
    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {!isAuthPage && <ServiceStatusBanner />}
        {children}
      </div>
    );
  }

  return (
    <>
      <LocaleDirectionSetter />
      <RegistrationPopup />
      <Header />
      <main className="flex-1">
        <ServiceStatusBanner />
        {children}
      </main>
      <Footer />
    </>
  );
}
