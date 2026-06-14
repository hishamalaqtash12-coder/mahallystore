import { Inter } from "next/font/google";
import "@/styles/index.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import CartDrawer from "@/components/CartDrawer";
import LayoutWrapper from "@/components/LayoutWrapper";
import FloatingWidgets from "@/components/FloatingWidgets";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Mahally | Local Marketplace",
  description: "Shop the best local stores and brands on Mahally.",
};

export default function RootLayout({ children }) {
  const locale = 'ar';
  const dir = 'rtl';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-zinc-900 selection:bg-brand selection:text-white overflow-x-hidden">
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
      </body>
    </html>
  );
}
