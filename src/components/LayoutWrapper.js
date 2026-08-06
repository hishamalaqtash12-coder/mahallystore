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

  // Check if we are in the merchant dashboard, admin dashboard, or auth pages
  const isDashboard = normalized.startsWith("/merchant/dashboard") || normalized.startsWith("/admin");
  const isAuthPage = normalized === "/login" || normalized === "/register";

  if (isDashboard || isAuthPage) {
    return (
      <div className="flex-1 flex flex-col">
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
