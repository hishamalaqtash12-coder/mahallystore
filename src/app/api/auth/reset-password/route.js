import { NextResponse } from "next/server";

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

    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const auth = Buffer.from(
      `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
    ).toString("base64");

    // 1. Find the customer by phone (billing_phone)
    const searchRes = await fetch(
      `${WP_URL}/wp-json/wc/v3/customers?search=${encodeURIComponent(phone)}&per_page=10`,
      { headers: { Authorization: `Basic ${auth}` } }
    );

    if (!searchRes.ok) {
      return NextResponse.json({ error: "Failed to look up account." }, { status: 502 });
    }

    const customers = await searchRes.json();

    // Match by billing phone or metadata phone
    const customer = customers.find((c) => {
      const billingPhone = c.billing?.phone?.replace(/\s+/g, "") || "";
      const normalizedPhone = phone.replace(/\s+/g, "");
      return billingPhone === normalizedPhone || billingPhone.endsWith(normalizedPhone.replace(/^\+962/, ""));
    });

    if (!customer) {
      // Try searching meta_data for mahally_phone
      return NextResponse.json({ error: "No account found for this phone number." }, { status: 404 });
    }

    // 2. Update the customer password
    const updateRes = await fetch(
      `${WP_URL}/wp-json/wc/v3/customers/${customer.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      }
    );

    if (!updateRes.ok) {
      const errData = await updateRes.json().catch(() => ({}));
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
