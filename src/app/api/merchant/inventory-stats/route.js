import { wcApi } from "@/lib/woocommerce";
import { dokanApi } from "@/lib/dokan";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) return NextResponse.json({ error: "Missing vendorId" }, { status: 400 });

    // 1. Robust Product Fetching (Matching merchant/products/route.js logic)
    let products = [];
      try {
        const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");
        const prodRes = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/products?author=${vendorId}&per_page=100&status=any`, {
          headers: { Authorization: `Basic ${auth}` }
        });
        const allProducts = await prodRes.json();
        if (Array.isArray(allProducts)) {
          products = allProducts;
        }
      } catch (e) { console.warn("Direct WC API fetch failed in stats:", e.message); }

    // STRICT DATA ISOLATION: Ensure only products belonging to this vendor are processed
    const filteredProducts = (Array.isArray(products) ? products : []).filter(p => {
      const authorId = String(p.author || p.post_author || "");
      const vendorIdMatch = String(p.store?.id || p.vendor?.id || "");
      const metaVendorId = p.meta_data?.find(m => m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id')?.value;
      
      return authorId === String(vendorId) || 
             vendorIdMatch === String(vendorId) || 
             String(metaVendorId) === String(vendorId);
    });

    // 2. Fetch recent orders to aggregate stats
    let allOrders = [];
    try {
      allOrders = await dokanApi.getOrders(vendorId, { per_page: 100 });
      if (allOrders && !Array.isArray(allOrders) && allOrders.code) {
        throw new Error(allOrders.message);
      }
    } catch (e) {
      console.warn("Dokan order fetch in stats failed, using WC fallback:", e.message);
      const ordersRes = await wcApi.get("orders", { per_page: 100, vendor: vendorId }); 
      allOrders = ordersRes.data || [];
    }

    const vendorProductIds = new Set(filteredProducts.map(p => p.id));

    const stats = filteredProducts.map(p => {
      let confirmed = 0;
      let pending = 0;
      let cancelled = 0;
      let totalSold = 0;

      allOrders.forEach(order => {
        order.line_items.forEach(item => {
          if (vendorProductIds.has(item.product_id) && item.product_id === p.id) {
            if (["processing", "completed", "shipped"].includes(order.status)) {
              confirmed += item.quantity;
              totalSold += item.quantity;
            } else if (["on-hold", "pending"].includes(order.status)) {
              pending += item.quantity;
              // We don't add to totalSold yet as it's not confirmed
            } else if (["cancelled", "refunded"].includes(order.status)) {
              cancelled += item.quantity;
            }
          }
        });
      });

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        currentStock: p.stock_quantity || 0,
        stockStatus: (p.stock_status || 'instock').toLowerCase().replace(/_/g, ''),
        confirmedOrders: confirmed,
        pendingOrders: pending,
        cancelledOrders: cancelled,
        totalSold: totalSold,
        remainingInStock: p.stock_quantity || 0
      };
    });

    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
