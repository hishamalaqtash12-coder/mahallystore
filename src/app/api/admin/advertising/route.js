import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");
    const headers = { Authorization: `Basic ${auth}` };

    // 1. Fetch Orders
    const ordersRes = await fetch(`${WP_URL}/wp-json/wc/v3/orders?per_page=100`, { headers });
    const allOrders = await ordersRes.json();
    
    const adRequests = (Array.isArray(allOrders) ? allOrders : []).filter(order => 
      (order.meta_data || []).some(m => m.key === "_mahally_is_ad_invoice" && m.value === "yes")
    ).map(order => {
      const type = (order.meta_data || []).find(m => m.key === "_mahally_ad_type")?.value;
      const target = (order.meta_data || []).find(m => m.key === "_mahally_ad_target")?.value;
      const duration = parseInt((order.meta_data || []).find(m => m.key === "_mahally_ad_duration")?.value || "0");

      return {
        id: order.id,
        vendorId: order.customer_id,
        date: order.date_created,
        status: order.status,
        type,
        targetId: target,
        duration,
        total: order.total,
        customerName: `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim()
      };
    });

    // 2. Fetch Products
    const productsRes = await fetch(`${WP_URL}/wp-json/wc/v3/products?per_page=100&status=publish`, { headers });
    const allProducts = await productsRes.json();

    const activeProducts = (Array.isArray(allProducts) ? allProducts : []).filter(p => {
       const status = (p.meta_data || []).find(m => m.key === "_mahally_ad_status")?.value;
       const expiry = parseInt((p.meta_data || []).find(m => m.key === "_mahally_ad_expiry")?.value || "0");
       return status === "active" && expiry > Date.now();
    }).map(p => ({
       id: p.id,
       type: "product",
       name: p.name,
       expiry: parseInt((p.meta_data || []).find(m => m.key === "_mahally_ad_expiry")?.value || "0")
    }));

    // 3. Fetch Vendors
    const vendorsRes = await fetch(`${WP_URL}/wp-json/wc/v3/customers?per_page=100&role=seller`, { headers });
    const allVendors = await vendorsRes.json();

    const activeStores = (Array.isArray(allVendors) ? allVendors : []).filter(v => {
       const status = (v.meta_data || []).find(m => m.key === "_mahally_store_ad_status")?.value;
       const expiry = parseInt((v.meta_data || []).find(m => m.key === "_mahally_store_ad_expiry")?.value || "0");
       return status === "active" && expiry > Date.now();
    }).map(v => ({
       id: v.id,
       type: "store",
       name: (v.meta_data || []).find(m => m.key === "dokan_store_name" || m.key === "mahally_store_name")?.value || v.first_name || `Store #${v.id}`,
       expiry: parseInt((v.meta_data || []).find(m => m.key === "_mahally_store_ad_expiry")?.value || "0")
    }));

    return NextResponse.json({ 
      requests: adRequests,
      activeAds: [...activeProducts, ...activeStores]
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch ad requests" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");
    const headers = { Authorization: `Basic ${auth}` };

    if (action === "manual_promote") {
      const { type, targetId, durationDays } = body;
      if (!type || !targetId || durationDays === undefined) {
         return NextResponse.json({ error: "Missing fields for manual promotion" }, { status: 400 });
      }

      const expiryTimestamp = durationDays > 0 
        ? Date.now() + (durationDays * 24 * 60 * 60 * 1000) 
        : Date.now() + (3650 * 24 * 60 * 60 * 1000); // 10 years for lifetime

      if (type === "product") {
        const existingRes = await fetch(`${WP_URL}/wp-json/wc/v3/products/${targetId}`, { headers });
        const existing = await existingRes.json();
        const currentMeta = existing.meta_data || [];
        const updatedMeta = currentMeta.filter(m => !["_mahally_ad_status", "_mahally_ad_expiry"].includes(m.key));
        
        updatedMeta.push({ key: "_mahally_ad_status", value: "active" });
        updatedMeta.push({ key: "_mahally_ad_expiry", value: String(expiryTimestamp) });

        await fetch(`${WP_URL}/wp-json/wc/v3/products/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ meta_data: updatedMeta })
        });
      } else if (type === "store") {
        const existingRes = await fetch(`${WP_URL}/wp-json/wc/v3/customers/${targetId}`, { headers });
        const existing = await existingRes.json();
        const currentMeta = existing.meta_data || [];

        const updatedMeta = currentMeta.filter(m => !["_mahally_store_ad_status", "_mahally_store_ad_expiry"].includes(m.key));
        updatedMeta.push({ key: "_mahally_store_ad_status", value: "active" });
        updatedMeta.push({ key: "_mahally_store_ad_expiry", value: String(expiryTimestamp) });

        await fetch(`${WP_URL}/wp-json/wc/v3/customers/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ meta_data: updatedMeta })
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "revoke") {
      const { type, targetId } = body;
      if (!type || !targetId) return NextResponse.json({ error: "Missing fields for revoke" }, { status: 400 });

      if (type === "product") {
        const existingRes = await fetch(`${WP_URL}/wp-json/wc/v3/products/${targetId}`, { headers });
        const existing = await existingRes.json();
        const currentMeta = existing.meta_data || [];
        const updatedMeta = currentMeta.filter(m => !["_mahally_ad_status", "_mahally_ad_expiry"].includes(m.key));
        updatedMeta.push({ key: "_mahally_ad_status", value: "expired" });
        updatedMeta.push({ key: "_mahally_ad_expiry", value: "0" });
        await fetch(`${WP_URL}/wp-json/wc/v3/products/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ meta_data: updatedMeta })
        });
      } else if (type === "store") {
        const existingRes = await fetch(`${WP_URL}/wp-json/wc/v3/customers/${targetId}`, { headers });
        const existing = await existingRes.json();
        const currentMeta = existing.meta_data || [];
        const updatedMeta = currentMeta.filter(m => !["_mahally_store_ad_status", "_mahally_store_ad_expiry"].includes(m.key));
        updatedMeta.push({ key: "_mahally_store_ad_status", value: "expired" });
        updatedMeta.push({ key: "_mahally_store_ad_expiry", value: "0" });
        await fetch(`${WP_URL}/wp-json/wc/v3/customers/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ meta_data: updatedMeta })
        });
      }
      return NextResponse.json({ success: true });
    }

    // Standard Invoice Approval Logic
    const { orderId } = body;
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const orderRes = await fetch(`${WP_URL}/wp-json/wc/v3/orders/${orderId}`, { headers });
    const order = await orderRes.json();

    const type = (order.meta_data || []).find(m => m.key === "_mahally_ad_type")?.value;
    const targetId = (order.meta_data || []).find(m => m.key === "_mahally_ad_target")?.value;
    const durationDays = parseInt((order.meta_data || []).find(m => m.key === "_mahally_ad_duration")?.value || "0");

    if (action === "approve") {
      // 1. Mark order as completed
      await fetch(`${WP_URL}/wp-json/wc/v3/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ status: "completed" })
      });

      // 2. Calculate Expiry
      const expiryTimestamp = Date.now() + (durationDays * 24 * 60 * 60 * 1000);

      // 3. Update Target Meta to Active
      if (type === "product") {
        const existingRes = await fetch(`${WP_URL}/wp-json/wc/v3/products/${targetId}`, { headers });
        const existing = await existingRes.json();
        const currentMeta = existing.meta_data || [];
        const updatedMeta = currentMeta.filter(m => !["_mahally_ad_status", "_mahally_ad_expiry"].includes(m.key));
        
        updatedMeta.push({ key: "_mahally_ad_status", value: "active" });
        updatedMeta.push({ key: "_mahally_ad_expiry", value: String(expiryTimestamp) });

        await fetch(`${WP_URL}/wp-json/wc/v3/products/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ meta_data: updatedMeta })
        });
      } else if (type === "store") {
        const existingRes = await fetch(`${WP_URL}/wp-json/wc/v3/customers/${targetId}`, { headers });
        const existing = await existingRes.json();
        const currentMeta = existing.meta_data || [];

        const updatedMeta = currentMeta.filter(m => !["_mahally_store_ad_status", "_mahally_store_ad_expiry"].includes(m.key));
        updatedMeta.push({ key: "_mahally_store_ad_status", value: "active" });
        updatedMeta.push({ key: "_mahally_store_ad_expiry", value: String(expiryTimestamp) });

        await fetch(`${WP_URL}/wp-json/wc/v3/customers/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ meta_data: updatedMeta })
        });
      }
    } else if (action === "reject") {
      // 1. Mark order as cancelled
      await fetch(`${WP_URL}/wp-json/wc/v3/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ status: "cancelled" })
      });

      // 2. Update Target Meta to Rejected
      if (type === "product") {
        const existingRes = await fetch(`${WP_URL}/wp-json/wc/v3/products/${targetId}`, { headers });
        const existing = await existingRes.json();
        const currentMeta = existing.meta_data || [];
        const updatedMeta = currentMeta.filter(m => m.key !== "_mahally_ad_status");
        updatedMeta.push({ key: "_mahally_ad_status", value: "rejected" });
        await fetch(`${WP_URL}/wp-json/wc/v3/products/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ meta_data: updatedMeta })
        });
      } else if (type === "store") {
        const existingRes = await fetch(`${WP_URL}/wp-json/wc/v3/customers/${targetId}`, { headers });
        const existing = await existingRes.json();
        const currentMeta = existing.meta_data || [];
        const updatedMeta = currentMeta.filter(m => m.key !== "_mahally_store_ad_status");
        updatedMeta.push({ key: "_mahally_store_ad_status", value: "rejected" });
        await fetch(`${WP_URL}/wp-json/wc/v3/customers/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ meta_data: updatedMeta })
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ad approval error:", error.response?.data || error.message);
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}
