import { getVendorBySlug, getVendorById, getCustomersByIds } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Server-side memory cache for vendor profiles
if (!globalThis.VENDOR_CACHE) {
  globalThis.VENDOR_CACHE = new Map();
}
export const VENDOR_CACHE = globalThis.VENDOR_CACHE;
const CACHE_TTL = 300000; // 5 minutes cache expiration

/** GET /api/vendors/[slug] — single vendor profile + products */
export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    // Check Memory Cache
    if (VENDOR_CACHE.has(slug)) {
      const cached = VENDOR_CACHE.get(slug);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return new NextResponse(JSON.stringify(cached.data), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          }
        });
      }
    }
    
    // Check if "slug" is actually an ID (numeric)
    let result;
    let dokanStorePromise = Promise.resolve(null);
    
    if (!isNaN(slug)) {
      const vendorId = parseInt(slug);
      result = await getVendorById(vendorId);
    } else {
      result = await getVendorBySlug(slug);
    }

    if (!result) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const { vendor: v, products } = result;

    // Strict Role Check: Ensure they are actually a vendor
    const isVendor = 
      v.role === "seller" ||
      v.meta_data?.some(m => m.key === "dokan_enable_selling" && m.value === "yes") ||
      v.meta_data?.some(m => m.key === "mahally_vendor_status" && m.value === "approved") ||
      v.meta_data?.some(m => m.key === "mahally_role" && (m.value === "seller" || m.value === "administrator"));
    if (!isVendor) {
      return NextResponse.json({ error: "User is not a vendor" }, { status: 404 });
    }
    const meta = Object.fromEntries((v.meta_data || []).map((m) => [m.key, m.value]));
    
    // Dokan settings are often serialized
    let dokanSettings = {};
    try {
      dokanSettings = typeof meta.dokan_profile_settings === 'string' 
        ? JSON.parse(meta.dokan_profile_settings) 
        : (meta.dokan_profile_settings || {});
    } catch (e) {
      console.warn("Failed to parse dokan_profile_settings", e);
    }

    const followerIds = meta.mahally_follower_ids ? JSON.parse(meta.mahally_follower_ids) : [];
    
    const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
    const api = new WooCommerceRestApi({
      url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://fallback.mahally.local',
      consumerKey: process.env.WC_CONSUMER_KEY,
      consumerSecret: process.env.WC_CONSUMER_SECRET,
      version: "wc/v3"
    });

    const productIds = products.map(p => p.id);
    const reviewsPromise = productIds.length > 0 
      ? api.get("products/reviews", { status: "approved", per_page: 40, product: productIds.join(",") }).catch(() => ({ data: [] }))
      : Promise.resolve({ data: [] });

    // Fetch followers and reviews in parallel
    const [followerDetails, reviewsRes] = await Promise.all([
      getCustomersByIds(followerIds),
      reviewsPromise
    ]);

    const followers = followerIds.map(id => {
      const found = followerDetails.find(c => String(c.id) === String(id));
      return {
        id,
        name: found ? `${found.first_name} ${found.last_name}`.trim() || found.username : `User #${id}`
      };
    });

    // Resolve Dokan store data (using meta fallbacks directly)
    const dokanStore = {};

    const profile = {
      id: v.id,
      name: `${v.first_name} ${v.last_name}`.trim(),
      storeName: dokanStore.store_name || dokanSettings.store_name || meta.mahally_store_name || v.first_name,
      storeSlug: (() => {
        const base = meta.mahally_store_slug || dokanSettings.store_name?.toLowerCase().replace(/\s+/g, '-') || slug;
        const cleanBase = base.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\u0600-\u06FFa-z0-9\-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const stripped = cleanBase.replace(new RegExp(`-${v.id}$`), '') || cleanBase;
        return stripped ? `${stripped}-${v.id}` : String(v.id);
      })(),
      storeDescription: dokanStore.store_description || dokanSettings.store_description || meta.mahally_store_description || "",
      storeCategory: meta.mahally_store_category || "",
      // Use Dokan store API for resolved image URLs (banner/gravatar come as full URLs from this endpoint)
      // Also check wp_user_avatar (WP User Avatar plugin) and WC avatar_url as fallbacks
      storeLogo: meta.mahally_store_logo || dokanStore.gravatar || meta.wp_user_avatar || v.avatar_url || dokanSettings.gravatar_url || dokanSettings.gravatar || null,
      storeBanner: meta.mahally_store_banner || dokanStore.banner || dokanSettings.banner_url || null,
      showPhone: dokanSettings.show_phone !== "no",
      phone: dokanStore.phone || dokanSettings.phone || v.billing?.phone || meta.billing_phone || "",
      showEmail: dokanSettings.show_email === "yes",
      email: v.email || null,
      whatsappNumber: meta.mahally_whatsapp_number || null,
      showWhatsapp: meta.mahally_show_whatsapp !== "no",
      bannerPos: parseInt(meta.mahally_banner_pos || 50),
      logoPos: parseInt(meta.mahally_logo_pos || 50),
      dateCreated: v.date_created || v.registered_date || null,
      averageRating: meta.mahally_average_rating || "0.0",
      salesCount: meta.mahally_sales_count || "0",
      followerCount: meta.mahally_follower_count || "0",
      followers: followers,
      paymentMethods: meta.dokan_profile_settings?.payment || {},
      returnPolicy: meta.mahally_return_policy || "no-returns",
      returnPeriod: meta.mahally_return_period || ""
    };
    
    // Enrich products with live computed ratings
    try {
      const allReviews = reviewsRes.data;

      const ratingMap = {};
      const productReviews = [];
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      
      allReviews.forEach(r => {
        if (!ratingMap[r.product_id]) ratingMap[r.product_id] = { total: 0, count: 0 };
        ratingMap[r.product_id].total += r.rating;
        ratingMap[r.product_id].count += 1;
        
        // If this review belongs to one of the vendor's products, add to list and distribution
        if (products.some(p => p.id === r.product_id)) {
          productReviews.push(r);
          distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        }
      });

      let storeTotalRating = 0;
      let storeReviewCount = 0;

      products.forEach(p => {
        const stats = ratingMap[p.id];
        if (stats && stats.count > 0) {
          p.average_rating = (stats.total / stats.count).toFixed(1);
          p.rating_count = stats.count;
          storeTotalRating += stats.total;
          storeReviewCount += stats.count;
        } else {
          p.average_rating = "0.0";
          p.rating_count = 0;
        }
      });

      if (storeReviewCount > 0) {
        profile.averageRating = (storeTotalRating / storeReviewCount).toFixed(1);
        profile.reviewCount = storeReviewCount;
        
        // Calculate percentages for distribution
        profile.ratingDistribution = Object.keys(distribution).reduce((acc, star) => {
          acc[star] = Math.round((distribution[star] / storeReviewCount) * 100) + "%";
          return acc;
        }, {});
      } else {
        profile.averageRating = "0.0";
        profile.reviewCount = 0;
        profile.ratingDistribution = { 1: "0%", 2: "0%", 3: "0%", 4: "0%", 5: "0%" };
      }
      
      // Attach the actual reviews to the data
      profile.recentReviews = productReviews.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));

    } catch (ratingErr) {
      console.warn("Rating enrichment failed for vendor products:", ratingErr.message);
    }

    const finalResponse = { vendor: profile, products };
    
    // Update Cache
    VENDOR_CACHE.set(slug, {
      data: finalResponse,
      timestamp: Date.now()
    });

    return new NextResponse(JSON.stringify(finalResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error) {
    console.error("Vendor profile API error:", error.message);
    return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 });
  }
}
