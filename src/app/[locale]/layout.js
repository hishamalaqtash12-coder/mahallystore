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
import { notFound } from 'next/navigation';

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
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-zinc-900 selection:bg-brand selection:text-white overflow-x-hidden">
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
