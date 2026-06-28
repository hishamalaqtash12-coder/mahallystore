import { NextResponse } from "next/server";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

/**
 * POST /api/auth/reset-password
 * Resets a user's WooCommerce password by phone number.
 * Called after OTP verification in the "forgot password" flow.
 * Body: { phone, newPassword }
 */
export async function POST(request) {
  try {
    const { phone, newPassword } = await request.json();

    if (!phone || !newPassword) {
      return NextResponse.json({ error: "Phone and new password are required." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://fallback.mahally.local';
    
    const api = new WooCommerceRestApi({
      url: WP_URL,
      consumerKey: process.env.WC_CONSUMER_KEY,
      consumerSecret: process.env.WC_CONSUMER_SECRET,
      version: "wc/v3",
    });

    // 1. Find the customer by phone (billing_phone)
    const cleanPhone = phone.replace(/\D/g, "");
    
    let customers = [];
    try {
      const custRes = await api.get("customers", { per_page: 50, order: 'desc', orderby: 'registered_date' });
      const sellerRes = await api.get("customers", { per_page: 50, role: 'seller', order: 'desc', orderby: 'registered_date' });
      const adminRes = await api.get("customers", { per_page: 50, role: 'administrator', order: 'desc', orderby: 'registered_date' });
      
      customers = [
        ...(custRes.data || []),
        ...(sellerRes.data || []),
        ...(adminRes.data || [])
      ];
    } catch (e) {
      return NextResponse.json({ error: "Failed to look up account." }, { status: 502 });
    }

    // Match by billing phone
    const customer = customers.find(c => {
      const cPhone = (c.billing?.phone || "").replace(/\D/g, "");
      if (!cPhone || !cleanPhone) return false;
      return cPhone === cleanPhone || cPhone.endsWith(cleanPhone) || cleanPhone.endsWith(cPhone);
    });

    if (!customer) {
      return NextResponse.json({ error: "No account found for this phone number." }, { status: 404 });
    }

    // 2. Update the customer password
    try {
      await api.put(`customers/${customer.id}`, { password: newPassword });
    } catch (updateErr) {
      const errData = updateErr.response?.data || {};
      return NextResponse.json(
        { error: errData.message || "Failed to update password." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, customerId: customer.id });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
