import { NextResponse } from "next/server";
import { dokanApi } from "@/lib/dokan";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wooId = searchParams.get("wooId");

    if (!wooId) {
      return NextResponse.json({ error: "Missing vendor ID" }, { status: 400 });
    }

    // 1. Fetch Dokan Dashboard Stats & Vendor Meta
    let statsData = {};
    let vendorMeta = {};
    try {
      statsData = await dokanApi.getStats(wooId);
      const { wcApi } = await import("@/lib/woocommerce");
      const vendorData = await wcApi.get(`customers/${wooId}`);
      if (vendorData.data && vendorData.data.meta_data) {
        vendorMeta.isRestricted = vendorData.data.meta_data.find(m => m.key === 'mahally_is_restricted')?.value === 'yes';
        vendorMeta.restrictionReason = vendorData.data.meta_data.find(m => m.key === 'mahally_restriction_reason')?.value || '';
        
        const hasFacebook = !!vendorData.data.meta_data.find(m => m.key === 'mahally_facebook')?.value;
        const hasInstagram = !!vendorData.data.meta_data.find(m => m.key === 'mahally_instagram')?.value;
        const hasTwitter = !!vendorData.data.meta_data.find(m => m.key === 'mahally_twitter')?.value;
        vendorMeta.hasSocials = hasFacebook || hasInstagram || hasTwitter;
      }
    } catch (err) {
      console.warn("Could not fetch Dokan stats, using fallbacks:", err.message);
    }
    
    // 2. Fetch Orders for manual calculation (More accurate than Dokan summary)
    let allOrders = [];
    try {
      allOrders = await dokanApi.getOrders(wooId, { per_page: 100 });
      if (!Array.isArray(allOrders)) allOrders = [];
    } catch (err) {
      console.warn("Could not fetch Dokan orders for calculation:", err.message);
    }
    
    // 3. Fetch Products for accurate counting and review filtering
    let productIds = new Set();
    let totalProductCount = 0;
    let recentReviews = [];
    let completedOrders = [];
    let filteredOrders = [];  // declared here so the response builder at the bottom can access it
    let manualTotalRevenue = 0;
    let manualTotalSales = 0;
    let manualActiveOrders = 0;
    
    try {
      // Direct robust fetching instead of unreliable internal fetch
      let vendorProducts = [];
      
      try {
        const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");
        const prodRes = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/products?author=${wooId}&per_page=100&status=any`, {
          headers: { Authorization: `Basic ${auth}` }
        });
        const allProducts = await prodRes.json();
        if (Array.isArray(allProducts)) {
          vendorProducts = allProducts;
        }
      } catch (e) { console.warn("Direct WC API fetch failed in stats:", e.message); }

    // 3. STRICT DATA ISOLATION: Filter products and orders to ensure no merchant sees another's data
    const filteredProducts = (Array.isArray(vendorProducts) ? vendorProducts : []).filter(p => {
      const authorId = String(p.author || p.post_author || "");
      const vendorIdMatch = String(p.store?.id || p.vendor?.id || "");
      const metaVendorId = p.meta_data?.find(m => m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id')?.value;
      
      return authorId === String(wooId) || 
             vendorIdMatch === String(wooId) || 
             String(metaVendorId) === String(wooId);
    });

    filteredOrders = (Array.isArray(allOrders) ? allOrders : []).filter(order => {
      const orderVendorId = order.meta_data?.find(m => m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id')?.value;
      if (String(orderVendorId) === String(wooId)) return true;

      return order.line_items?.some(item => {
        const itemVendorId = item.meta_data?.find(m => m.key === '_vendor_id' || m.key === '_dokan_vendor_id')?.value;
        return String(itemVendorId) === String(wooId);
      });
    });

    productIds = new Set(filteredProducts.map(p => p.id));
    totalProductCount = filteredProducts.length;

    // Filter orders by status for calculation
    completedOrders = filteredOrders.filter(o => o.status === 'completed');
    const processingOrders = filteredOrders.filter(o => o.status === 'processing' || o.status === 'on-hold');
    
    // Calculate total revenue from completed orders only
    manualTotalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    manualTotalSales = completedOrders.length;
    manualActiveOrders = processingOrders.length;
    
    // 3b. Try Dokan Reviews API first (Native and fast)
    try {
      const dokanReviews = await dokanApi.getReviews(wooId);
      if (Array.isArray(dokanReviews)) {
          recentReviews = dokanReviews.slice(0, 10);
      }
    } catch (drErr) {
      // Dokan /reviews endpoint not available — silently fall back to WC API below
    }

    // 3c. Fallback/Supplement: Fetch recent reviews via WC API and filter by product ownership
    if (recentReviews.length === 0) {
      const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");
      const reviewsRes = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/products/reviews?per_page=100`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      const allReviews = await reviewsRes.json();
      
      recentReviews = Array.isArray(allReviews) 
        ? allReviews.filter(r => productIds.has(r.product_id)).slice(0, 10)
        : [];
    }
    } catch (err) {
      console.warn("Could not fetch products/reviews for stats:", err.message);
    }
    
    // 4. Calculate Chart Data (Dynamic Range)
    const daysCount = parseInt(searchParams.get("days") || "7");
    const chartData = [];
    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('sv-SE'); // sv-SE gives YYYY-MM-DD
      const dayLabel = daysCount > 14 
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayRevenue = completedOrders
        .filter(o => o.date_created.startsWith(dateStr))
        .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
        
      chartData.push({ name: dayLabel, revenue: dayRevenue, date: dateStr });
    }

    // Calculate dynamic Revenue Delta compared to previous period of same length
    const nowTime = now.getTime();
    const currentPeriodStart = nowTime - (daysCount * 24 * 60 * 60 * 1000);
    const previousPeriodStart = nowTime - (2 * daysCount * 24 * 60 * 60 * 1000);

    let currentPeriodRevenue = 0;
    let previousPeriodRevenue = 0;

    completedOrders.forEach(o => {
      const orderTime = new Date(o.date_created).getTime();
      if (isNaN(orderTime)) return;
      
      if (orderTime >= currentPeriodStart && orderTime <= nowTime) {
        currentPeriodRevenue += parseFloat(o.total || 0);
      } else if (orderTime >= previousPeriodStart && orderTime < currentPeriodStart) {
        previousPeriodRevenue += parseFloat(o.total || 0);
      }
    });

    let revenueDeltaStr = "0%";
    if (previousPeriodRevenue > 0) {
      const deltaPercent = ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100;
      revenueDeltaStr = (deltaPercent >= 0 ? "+" : "") + deltaPercent.toFixed(1) + "%";
    } else if (currentPeriodRevenue > 0) {
      revenueDeltaStr = "+100.0%";
    }

    return NextResponse.json({
      stats: {
        hasProducts: totalProductCount > 0,
        totalProducts: totalProductCount || statsData.products?.total || 0,
        totalRevenue: manualTotalRevenue.toFixed(2),
        totalSales: manualTotalSales,
        activeOrders: manualActiveOrders,
        averageRating: recentReviews.length > 0 
          ? (recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length).toFixed(1)
          : "0.0",
        avgOrderValue: manualTotalSales > 0 ? (manualTotalRevenue / manualTotalSales).toFixed(2) : "0.00",
        revenueDelta: revenueDeltaStr, 
        ordersDelta: manualActiveOrders > 0 ? `+${manualActiveOrders}` : "0",
        ratingDelta: "0",
        isRestricted: vendorMeta.isRestricted || false,
        restrictionReason: vendorMeta.restrictionReason || '',
        hasSocials: vendorMeta.hasSocials || false
      },
      recentOrders: filteredOrders.slice(0, 10).map(o => ({
        id: o.id,
        date_created: o.date_created,
        billing: o.billing,
        total: o.total,
        status: o.status,
        line_items: o.line_items,
        payment_method_title: o.payment_method_title,
        shipping_total: o.shipping_total
      })),
      recentReviews: recentReviews.map(r => ({
        id: r.id,
        reviewer: r.reviewer,
        rating: r.rating,
        review: r.review,
        date_created: r.date_created,
        product_id: r.product_id,
        product_name: r.product_name || `Product #${r.product_id}`
      })),
      chartData: chartData
    });
  } catch (error) {
    console.error("Merchant stats critical error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch merchant stats",
      stats: {
        totalProducts: 0,
        totalRevenue: "0.00",
        totalSales: 0,
        activeOrders: 0,
        averageRating: "0.0",
        avgOrderValue: "0.00",
        revenueDelta: "0%",
        ordersDelta: "0%",
        ratingDelta: "0"
      },
      recentOrders: [],
      recentReviews: [],
      chartData: []
    }, { status: 200 }); 
  }
}
