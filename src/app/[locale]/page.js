import { getProducts, getCategories, getVendors, getCustomersByIds } from "@/lib/woocommerce";
export const dynamic = 'force-dynamic';
import Hero from "@/components/Hero";
import LightningDeals from "@/components/LightningDeals";
import LimitedTimeOffers from "@/components/LimitedTimeOffers";
import SuperBuyerSection from "@/components/SuperBuyerSection";
import Testimonials from "@/components/Testimonials";
import VideoPromo from "@/components/VideoPromo";
import ProductGrid from "@/components/ProductGrid";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Smartphone, Watch, Laptop, Shirt, Home as HomeIcon, Zap, Tag, Star, ShieldCheck, Truck, ShoppingBag, Flame, Trophy, Clock, Menu, ChevronDown, Lock, CreditCard, RefreshCcw, Bell } from "lucide-react";

export default async function Home() {
  let products = [];
  let categories = [];
  let vendors = [];
  let feedback = [];
  let promoData = { url: '', thumbnail: '', title: '' };
  let totalPages = 1;

  try {
    const result = await getProducts({ per_page: 40, status: 'publish' }, true);
    products = result.data;
    totalPages = result.totalPages;
    categories = await getCategories({ hide_empty: false, per_page: 100 });
    vendors = await getVendors({ per_page: 20 });

    try {
      const settingsPath = require("path").join(process.cwd(), "src/data/settings.json");
      const settingsContent = require("fs").readFileSync(settingsPath, "utf8");
      const siteSettings = JSON.parse(settingsContent);
      promoData.url = siteSettings.promoVideoUrl || '';
      promoData.thumbnail = siteSettings.promoVideoThumbnail || '';
      promoData.title = siteSettings.promoVideoTitle || '';
      promoData.description = siteSettings.promoVideoDescription || '';
    } catch (fErr) { }

    try {
      const fs = require("fs");
      const path = require("path");
      const FEEDBACK_FILE_PATH = path.join(process.cwd(), "src/data/feedback.json");
      if (fs.existsSync(FEEDBACK_FILE_PATH)) {
        const fileContent = fs.readFileSync(FEEDBACK_FILE_PATH, "utf8");
        feedback = JSON.parse(fileContent);
      }

      // Dynamically resolve customer avatars from WooCommerce
      if (feedback && feedback.length > 0) {
        const userIds = feedback
          .map(f => f.userId)
          .filter(id => id && Number(id) !== 999 && !isNaN(Number(id)));

        if (userIds.length > 0) {
          try {
            const customers = await getCustomersByIds(userIds);
            const customerMap = {};
            customers.forEach(c => {
              const meta = c.meta_data || [];
              const avatarUrl = meta.find(m => m.key === "mahally_avatar_url")?.value || meta.find(m => m.key === "mahally_store_logo")?.value || c.avatar_url || null;
              const avatarBgColor = meta.find(m => m.key === "mahally_avatar_bg_color")?.value || "#9b8676";
              customerMap[c.id] = { avatarUrl, avatarBgColor };
            });

            feedback = feedback.map(f => {
              if (f.userId && customerMap[f.userId]) {
                return {
                  ...f,
                  avatarUrl: customerMap[f.userId].avatarUrl || f.avatarUrl || "",
                  avatarBgColor: customerMap[f.userId].avatarBgColor || f.avatarBgColor || "#9b8676"
                };
              }
              return f;
            });
          } catch (wcErr) {
            console.warn("WooCommerce feedback avatars lookup failed:", wcErr.message);
          }
        }
      }
    } catch (e) {
      console.warn("Could not load feedback.json:", e.message);
    }
  } catch (error) {
    console.error("Home page data fetch error:", error);
  }

  let advertisingEnabled = true;

  try {
    const SETTINGS_PATH = require("path").join(process.cwd(), "src/data/settings.json");
    const fileContent = require("fs").readFileSync(SETTINGS_PATH, "utf8");
    const settings = JSON.parse(fileContent);
    if (settings.advertisingEnabled !== undefined) {
      advertisingEnabled = settings.advertisingEnabled;
    }
  } catch (e) {
    console.error("Failed to load global settings:", e);
  }
  const hasFlashDeals = products.some(p => p.on_sale);
  const hasLimitedOffers = products.some(p => p.on_sale && (p.date_on_sale_to || p.date_on_sale_to_gmt));

  return (
    <div className="flex flex-col pb-20 bg-white">
      {/* 1. HERO (Amazon/Ebay Style Mix) */}
      <div className="mb-8">
        <Hero products={products} categories={categories} vendors={vendors} />
      </div>

      <div className="w-full h-5 bg-[#f4f4f5] border-y border-zinc-200 shadow-[inset_0px_4px_8px_rgba(0,0,0,0.04),inset_0px_-4px_8px_rgba(0,0,0,0.02)]"></div>

      <div className="py-5 bg-white">
        <LightningDeals products={products} />
      </div>

      <div className="w-full h-5 bg-[#f4f4f5] border-y border-zinc-200 shadow-[inset_0px_4px_8px_rgba(0,0,0,0.04),inset_0px_-4px_8px_rgba(0,0,0,0.02)]"></div>

      {/* 3. SUPER BUYER SECTION (AliExpress Style) */}
      <div className="py-5 bg-white">
        <SuperBuyerSection products={products} vendors={vendors} advertisingEnabled={advertisingEnabled} />
      </div>

      <div className="w-full h-5 bg-[#f4f4f5] border-y border-zinc-200 shadow-[inset_0px_4px_8px_rgba(0,0,0,0.04),inset_0px_-4px_8px_rgba(0,0,0,0.02)]"></div>

      {/* 4. TODAY'S DEALS (Ebay Style with Timers) */}
      <div className="py-5 bg-white">
        <LimitedTimeOffers products={products} />
      </div>

      <div className="w-full h-5 bg-[#f4f4f5] border-y border-zinc-200 shadow-[inset_0px_4px_8px_rgba(0,0,0,0.04),inset_0px_-4px_8px_rgba(0,0,0,0.02)]"></div>

      {/* 6. MAIN PRODUCT GRID */}
      <div className="py-5 bg-white">
        <ProductGrid initialProducts={products} totalPages={totalPages} />
      </div>

      <div className="w-full h-5 bg-[#f4f4f5] border-y border-zinc-200 shadow-[inset_0px_4px_8px_rgba(0,0,0,0.04),inset_0px_-4px_8px_rgba(0,0,0,0.02)]"></div>

      {/* 5. COMMUNITY TESTIMONIALS (Google Reviews Style) */}
      <div className="py-5 bg-white">
        <Testimonials feedbacks={feedback} />
      </div>

      <div className="w-full h-5 bg-[#f4f4f5] border-y border-zinc-200 shadow-[inset_0px_4px_8px_rgba(0,0,0,0.04),inset_0px_-4px_8px_rgba(0,0,0,0.02)]"></div>

      {/* 7. PROMO VIDEO */}
      <div className="py-5 bg-white">
        <VideoPromo
          videoUrl={promoData.url}
          thumbnail={promoData.thumbnail}
          title={promoData.title}
          description={promoData.description}
        />
      </div>
    </div>
  );
}
