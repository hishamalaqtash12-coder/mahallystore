"use client";

import { usePathname } from "@/i18n/routing";
import Header from "./Header";
import Footer from "./Footer";
import ServiceStatusBanner from "./ServiceStatusBanner";
import LocaleDirectionSetter from "./LocaleDirectionSetter";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();

  // Check if we are in the merchant dashboard, admin dashboard, or auth pages
  const isDashboard = pathname?.startsWith("/merchant/dashboard") || pathname?.startsWith("/admin");
  const isAuthPage = pathname === "/login" || pathname === "/register";

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
      <Header />
      <main className="flex-1">
        <ServiceStatusBanner />
        {children}
      </main>
      <Footer />
    </>
  );
}
