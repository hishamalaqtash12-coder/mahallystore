import { updateCustomerMeta } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) return NextResponse.json({ error: "Missing vendorId" }, { status: 400 });

    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");
    
    const res = await fetch(`${WP_URL}/wp-json/wc/v3/customers/${vendorId}`, {
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch vendor" }, { status: res.status });
    }
    
    const data = await res.json();
    const meta = data.meta_data || [];
    const shippingMeta = meta.find(m => m.key === "mahally_governorate_shipping");
    
    let shippingData = {};
    if (shippingMeta) {
      if (typeof shippingMeta.value === 'string') {
        try {
          shippingData = JSON.parse(shippingMeta.value);
        } catch (e) {
          console.warn("Failed to parse shipping data:", e.message);
        }
      } else {
        shippingData = shippingMeta.value;
      }
    }
    
    console.log(`[Shipping API] Fetched for vendor ${vendorId}:`, shippingData);

    return NextResponse.json({ shippingData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { vendorId, shippingData } = await request.json();

    if (!vendorId || !shippingData) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    await updateCustomerMeta(vendorId, {
      mahally_governorate_shipping: JSON.stringify(shippingData)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
