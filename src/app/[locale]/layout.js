import { Inter } from "next/font/google";
import "@/styles/index.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import CartDrawer from "@/components/CartDrawer";
import LayoutWrapper from "@/components/LayoutWrapper";
import FloatingWidgets from "@/components/FloatingWidgets";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from "next/navigation";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Mahally | Local Marketplace",
  description: "Shop the best local stores and brands on Mahally.",
  icons: {
    icon: "/icon.webp",
  },
  verification: {
    google: "dIJDnbFaVe_P_hFTKBPlRHwaCuj7GQHpKafanYPA7JU",
  },
};

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale)) {
    notFound();
  }
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-zinc-900 selection:bg-brand selection:text-white overflow-x-hidden">
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-FJBEEZDZL6" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FJBEEZDZL6');
          `}
        </Script>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <LocationProvider>
              <CartProvider>
                <WishlistProvider>
                  <LayoutWrapper>
                    <CartDrawer />
                    {children}
                    <FloatingWidgets />
                  </LayoutWrapper>
              </WishlistProvider>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
