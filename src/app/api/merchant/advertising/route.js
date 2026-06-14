import { NextResponse } from "next/server";
import { wcApi } from "@/lib/woocommerce";

const AD_PRICING = {
  7: 10.00,
  14: 18.00,
  30: 35.00
};

export async function POST(req) {
  try {
    const { vendorId, type, targetId, duration } = await req.json();

    if (!vendorId || !type || !targetId || !duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!AD_PRICING[duration]) {
      return NextResponse.json({ error: "Invalid duration package" }, { status: 400 });
    }

    const price = AD_PRICING[duration];
    const itemName = type === "product" 
      ? `Product Promotion - ${duration} Days (Product ID: ${targetId})`
      : `Store Promotion - ${duration} Days (Store ID: ${targetId})`;

    // 1. Create WooCommerce Order (Invoice)
    const orderPayload = {
      customer_id: vendorId,
      payment_method: "bacs", // Bank transfer as default, they can change later
      payment_method_title: "Direct Bank Transfer",
      set_paid: false,
      status: "pending",
      line_items: [
        {
          name: itemName,
          subtotal: String(price),
          total: String(price)
        }
      ],
      meta_data: [
        { key: "_mahally_is_ad_invoice", value: "yes" },
        { key: "_mahally_ad_type", value: type },
        { key: "_mahally_ad_target", value: String(targetId) },
        { key: "_mahally_ad_duration", value: String(duration) },
      ]
    };

    const orderRes = await wcApi.post("orders", orderPayload);
    const orderId = orderRes.data.id;

    // 2. Update Target Meta Data
    if (type === "product") {
      const productRes = await wcApi.get(`products/${targetId}`);
      const currentMeta = productRes.data.meta_data || [];
      
      const updatedMeta = currentMeta.filter(m => !m.key.startsWith("_mahally_ad_"));
      updatedMeta.push({ key: "_mahally_ad_status", value: "pending_payment" });
      updatedMeta.push({ key: "_mahally_ad_duration", value: String(duration) });
      updatedMeta.push({ key: "_mahally_ad_invoice", value: String(orderId) });

      await wcApi.put(`products/${targetId}`, { meta_data: updatedMeta });
    } else if (type === "store") {
      // Need Admin privileges to update customer meta
      const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");
      const existingRes = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/customers/${targetId}`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      const existing = await existingRes.json();
      const currentMeta = existing.meta_data || [];

      const updatedMeta = currentMeta.filter(m => !m.key.startsWith("_mahally_store_ad_"));
      updatedMeta.push({ key: "_mahally_store_ad_status", value: "pending_payment" });
      updatedMeta.push({ key: "_mahally_store_ad_duration", value: String(duration) });
      updatedMeta.push({ key: "_mahally_store_ad_invoice", value: String(orderId) });

      await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/customers/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
        body: JSON.stringify({ meta_data: updatedMeta })
      });
    }

    return NextResponse.json({ success: true, orderId, price });
  } catch (error) {
    console.error("Ad creation error:", error.response?.data || error.message);
    return NextResponse.json({ error: "Failed to create ad request" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) return NextResponse.json({ error: "Vendor ID required" }, { status: 400 });

    // Find all invoices (orders) created for this vendor that are ad invoices
    const ordersRes = await wcApi.get("orders", { customer: vendorId, per_page: 50 });
    
    const campaigns = (ordersRes.data || []).filter(order => 
      order.meta_data.some(m => m.key === "_mahally_is_ad_invoice" && m.value === "yes")
    ).map(order => {
      const type = order.meta_data.find(m => m.key === "_mahally_ad_type")?.value;
      const target = order.meta_data.find(m => m.key === "_mahally_ad_target")?.value;
      const duration = order.meta_data.find(m => m.key === "_mahally_ad_duration")?.value;

      let status = "Unknown";
      if (order.status === "pending" || order.status === "on-hold") status = "Pending Payment";
      else if (order.status === "processing") status = "Pending Admin Approval";
      else if (order.status === "completed") status = "Active";
      else if (order.status === "cancelled" || order.status === "refunded") status = "Rejected / Cancelled";

      return {
        id: order.id,
        date: order.date_created,
        status: status,
        type: type,
        targetId: target,
        duration: duration,
        total: order.total,
        orderStatus: order.status
      };
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}
