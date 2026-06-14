import { NextResponse } from "next/server";
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wooId = searchParams.get("wooId");

    if (!wooId) {
      return NextResponse.json({ error: "Missing vendor ID" }, { status: 400 });
    }

    // Dokan coupons are standard WC coupons.
    // We fetch them and filter by the '_dokan_vendor_id' meta key or similar.
    const res = await api.get("coupons", { per_page: 100 });
    
    // Filter to only show this vendor's coupons
    const merchantCoupons = res.data.filter(c => {
      const vendorMeta = c.meta_data?.find(m => m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id');
      return String(vendorMeta?.value) === String(wooId);
    });

    return NextResponse.json(merchantCoupons);
  } catch (error) {
    console.error("Coupons fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { wooId, code, amount, discount_type, description, date_expires, usage_limit, individual_use, product_ids } = body;

    if (!wooId) {
      return NextResponse.json({ error: "Missing vendor ID" }, { status: 400 });
    }

    // Construct the Dokan-compatible payload
    const couponPayload = {
      code,
      amount: amount.toString(),
      discount_type,
      description: description || `Coupon for vendor ${wooId}`,
      date_expires: date_expires ? new Date(date_expires).toISOString() : null,
      usage_limit: usage_limit ? parseInt(usage_limit) : null,
      individual_use: !!individual_use,
      product_ids: product_ids || [],
      meta_data: [
        { key: "_dokan_vendor_id", value: String(wooId) },
        { key: "mahally_owner_id", value: String(wooId) }
      ]
    };

    // Use WooCommerce API with Admin Keys
    const res = await api.post("coupons", couponPayload);
    
    // IMPORTANT: To make it show up in Dokan Dashboard, we might need a WP REST call
    // to change the post author to the vendor ID.
    // However, if we've added the meta, Dokan should pick it up.

    return NextResponse.json(res.data);
  } catch (error) {
    console.error("Coupon creation error:", error.response?.data || error.message);
    return NextResponse.json({ error: error.response?.data?.message || "Failed to create coupon" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id, wooId } = await req.json();

    if (!id || !wooId) {
      return NextResponse.json({ error: "Missing coupon ID or vendor ID" }, { status: 400 });
    }

    // OWNERSHIP CHECK
    try {
      const couponRes = await api.get(`coupons/${id}`);
      const vendorMeta = couponRes.data.meta_data?.find(m => m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id');
      if (String(vendorMeta?.value) !== String(wooId)) {
        return NextResponse.json({ error: "Unauthorized: You do not own this coupon" }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const res = await api.delete(`coupons/${id}`, { force: true });
    return NextResponse.json(res.data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
