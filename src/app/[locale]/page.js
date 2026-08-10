import { getProducts, getCategories, getVendors, getCustomersByIds } from "@/lib/woocommerce";
export const dynamic = 'force-dynamic';
import Hero from "@/components/Hero";
import LightningDeals from "@/components/LightningDeals";
import LimitedTimeOffers from "@/components/LimitedTimeOffers";
import SuperBuyerSection from "@/components/SuperBuyerSection";
import Testimonials from "@/components/Testimonials";
import VideoPromo from "@/components/VideoPromo";
import ProductGrid from "@/components/ProductGrid";
import MadeInJordan from "@/components/MadeInJordan";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { ChevronRight, Smartphone, Watch, Laptop, Shirt, Home as HomeIcon, Zap, Tag, Star, ShieldCheck, Truck, ShoppingBag, Flame, Trophy, Clock, Menu, ChevronDown, Lock, CreditCard, RefreshCcw, Bell } from "lucide-react";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export default async function Home() {
  let products = [];
  let categories = [];
  let vendors = [];
  let feedback = [];
  let promoData = { url: '', thumbnail: '', title: '' };
  let totalPages = 1;



  try {
    const settingsPath = join(process.cwd(), "src/data/settings.json");
    if (existsSync(settingsPath)) {
      const siteSettings = JSON.parse(readFileSync(settingsPath, "utf8"));
      promoData.url = siteSettings.promoVideoUrl || '';
      promoData.thumbnail = siteSettings.promoVideoThumbnail || '';
      promoData.title = siteSettings.promoVideoTitle || '';
      promoData.description = siteSettings.promoVideoDescription || '';
    }
  } catch (e) { }

  try {
    const FEEDBACK_FILE_PATH = join(process.cwd(), "src/data/feedback.json");
    if (existsSync(FEEDBACK_FILE_PATH)) {
      feedback = JSON.parse(readFileSync(FEEDBACK_FILE_PATH, "utf8"));
    }
  } catch (e) { }

  // 2. Determine userIds for avatar lookup
  const userIds = feedback && feedback.length > 0
    ? feedback.map(f => f.userId).filter(id => id && Number(id) !== 999 && !isNaN(Number(id)))
    : [];

  // 3. Fetch all remote APIs in parallel to prevent sequential blockages
  try {
    const [productsResult, categoriesResult, allVendors, customersResult] = await Promise.all([
      getProducts({ per_page: 40, status: 'publish' }, true).catch(() => ({ data: [], totalPages: 1 })),
      getCategories({ hide_empty: false, per_page: 100 }).catch(() => []),
      getVendors({ per_page: 100 }).catch(() => []),
      userIds.length > 0 ? getCustomersByIds(userIds).catch(() => []) : Promise.resolve([])
    ]);

    products = productsResult?.data || [];
    totalPages = productsResult?.totalPages || 1;
    categories = categoriesResult || [];

    // Filter strictly approved vendors (must have dokan_enable_selling === "yes")
    const approvedVendors = (allVendors || []).filter(v => {
      if (!v) return false;
      const metaArray = Array.isArray(v.meta_data) ? v.meta_data : [];
      const meta = Object.fromEntries(metaArray.filter(m => m && m.key).map(m => [m.key, m.value]));
      return meta.dokan_enable_selling === "yes";
    });

    const activeList = approvedVendors;

    // Filter featured vendors based on meta field
    const featured = activeList.filter(v => {
      if (!v) return false;
      const metaArray = Array.isArray(v.meta_data) ? v.meta_data : [];
      const meta = Object.fromEntries(metaArray.filter(m => m && m.key).map(m => [m.key, m.value]));
      return meta.mahally_show_in_carousel === "yes";
    });

    vendors = featured.length > 0 ? featured : activeList;

    // Map customer avatars to feedback reviews
    if (Array.isArray(customersResult) && customersResult.length > 0) {
      const customerMap = {};
      customersResult.forEach(c => {
        if (!c) return;
        const meta = Array.isArray(c.meta_data) ? c.meta_data : [];
        const avatarUrl = meta.find(m => m && m.key === "mahally_avatar_url")?.value || meta.find(m => m && m.key === "mahally_store_logo")?.value || c.avatar_url || null;
        const avatarBgColor = meta.find(m => m && m.key === "mahally_avatar_bg_color")?.value || "#9b8676";
        const roleFromMeta = meta.find(m => m && m.key === "mahally_role")?.value;
        const role = roleFromMeta || (c.roles && c.roles.length > 0 ? c.roles[0] : "customer");
        customerMap[c.id] = { avatarUrl, avatarBgColor, role };
      });

      feedback = (feedback || []).map(f => {
        if (f && f.userId && customerMap[f.userId]) {
          return {
            ...f,
            avatarUrl: customerMap[f.userId].avatarUrl || f.avatarUrl || "",
            avatarBgColor: customerMap[f.userId].avatarBgColor || f.avatarBgColor || "#9b8676",
            role: customerMap[f.userId].role || f.role || "customer"
          };
        }
        return f;
      });
    }

  } catch (error) {
    console.error("Home page parallel data fetch error:", error);
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
    <div
      className="flex flex-col pb-20 relative"
      style={{
        backgroundColor: "#faf9f6",
        backgroundImage: `
          linear-gradient(to right, rgba(15,15,15,0.035) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(15,15,15,0.035) 1px, transparent 1px)
        `,
        backgroundSize: "28px 28px",
      }}
    >
      {/* 1. HERO (Amazon/Ebay Style Mix) */}
      <div className="mb-8">
        <Hero products={products} categories={categories} vendors={vendors} />
      </div>

      <div className="w-full h-5 bg-[#f4f4f5] border-y border-zinc-200 shadow-[inset_0px_4px_8px_rgba(0,0,0,0.04),inset_0px_-4px_8px_rgba(0,0,0,0.02)]"></div>

      <div className="py-5">
        <LightningDeals products={products} />
      </div>

      <div className="w-full h-5 bg-[#f4f4f5] border-y border-zinc-200 shadow-[inset_0px_4px_8px_rgba(0,0,0,0.04),inset_0px_-4px_8px_rgba(0,0,0,0.02)]"></div>

      {/* 3. SUPER BUYER SECTION (AliExpress Style) */}
      <div className="py-5">
        <SuperBuyerSection products={products} vendors={vendors} advertisingEnabled={advertisingEnabled} />
      </div>

      <div className="w-full h-5 bg-[#f4f4f5] border-y border-zinc-200 shadow-[inset_0px_4px_8px_rgba(0,0,0,0.04),inset_0px_-4px_8px_rgba(0,0,0,0.02)]"></div>

      {/* 4. TODAY'S DEALS (Ebay Style with Timers) */}
      <div className="py-5">
        <LimitedTimeOffers products={products} />
      </div>

      <div className="w-full h-5 bg-[#f4f4f5] border-y border-zinc-200 shadow-[inset_0px_4px_8px_rgba(0,0,0,0.04),inset_0px_-4px_8px_rgba(0,0,0,0.02)]"></div>

      {/* 5.5 MADE IN JORDAN SECTION */}
      <div className="py-5">
        <MadeInJordan products={products} />
      </div>

      <div className="w-full h-5 bg-[#f4f4f5] border-y border-zinc-200 shadow-[inset_0px_4px_8px_rgba(0,0,0,0.04),inset_0px_-4px_8px_rgba(0,0,0,0.02)]"></div>

      {/* 6. MAIN PRODUCT GRID */}
      <div className="py-5">
        <ProductGrid initialProducts={products} totalPages={totalPages} />
      </div>

      <div className="w-full h-5 bg-[#f4f4f5] border-y border-zinc-200 shadow-[inset_0px_4px_8px_rgba(0,0,0,0.04),inset_0px_-4px_8px_rgba(0,0,0,0.02)]"></div>

      {/* 5. COMMUNITY TESTIMONIALS (Google Reviews Style) */}
      <div className="py-5">
        <Testimonials feedbacks={feedback} />
      </div>

      <div className="w-full h-5 bg-[#f4f4f5] border-y border-zinc-200 shadow-[inset_0px_4px_8px_rgba(0,0,0,0.04),inset_0px_-4px_8px_rgba(0,0,0,0.02)]"></div>

      {/* 7. PROMO VIDEO */}
      <div className="py-5">
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