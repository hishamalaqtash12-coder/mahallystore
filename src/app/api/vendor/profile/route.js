import { updateCustomerMeta, getCustomerById } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/vendor/profile
 * Lets an approved vendor update their store settings.
 * Body: { customerId, updates: { storeName?, storeDescription?, storeCategory?, showPhone?, showEmail?, storeLogo?, storeBanner? } }
 */
export async function PATCH(request) {
  try {
    const { customerId, updates } = await request.json();

    if (!customerId || !updates) {
      return NextResponse.json({ error: "customerId and updates are required" }, { status: 400 });
    }

    // Map frontend-friendly keys to WooCommerce meta keys
    const metaMap = {
      storeName:        "mahally_store_name",
      storeDescription: "mahally_store_description",
      storeCategory:    "mahally_store_category",
      storeLogo:        "mahally_store_logo",
      storeBanner:      "mahally_store_banner",
      showPhone:        "mahally_show_phone",
      showEmail:        "mahally_show_email",
    };

    const metaUpdates = {};
    for (const [k, v] of Object.entries(updates)) {
      if (metaMap[k]) {
        // Booleans → "yes" / "no"
        const mappedValue = typeof v === "boolean" ? (v ? "yes" : "no") : v;
        metaUpdates[metaMap[k]] = mappedValue;
        
        // Also update mahally_avatar_url if storeLogo is being updated
        if (k === "storeLogo") {
          metaUpdates["mahally_avatar_url"] = mappedValue;
        }
      }
    }

    const updated = await updateCustomerMeta(customerId, metaUpdates);
    return NextResponse.json({ success: true, customer: updated });
  } catch (error) {
    console.error("Vendor profile update error:", error.message);
    return NextResponse.json({ error: "Failed to update store profile" }, { status: 500 });
  }
}

/**
 * GET /api/vendor/profile?email=...
 * Returns the current vendor's full profile (for the vendor dashboard)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const id = searchParams.get("id");

    if (!email && !id) {
      return NextResponse.json({ error: "email or id is required" }, { status: 400 });
    }

    let customer = null;
    if (id) {
      customer = await getCustomerById(id);
    }

    if (!customer) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const meta = Object.fromEntries((customer.meta_data || []).map((m) => [m.key, m.value]));

    return NextResponse.json({
      id: customer.id,
      name: `${customer.first_name} ${customer.last_name}`.trim(),
      email: customer.email,
      phone: customer.billing?.phone || "",
      role: meta.mahally_role || "customer",
      vendorStatus: meta.mahally_vendor_status || "pending",
      storeName: meta.mahally_store_name || "",
      storeSlug: meta.mahally_store_slug || "",
      storeDescription: meta.mahally_store_description || "",
      storeCategory: meta.mahally_store_category || "",
      storeLogo: meta.mahally_avatar_url || meta.mahally_store_logo || null,
      storeBanner: meta.mahally_store_banner || null,
      showPhone: meta.mahally_show_phone === "yes",
      showEmail: meta.mahally_show_email === "yes",
    });
  } catch (error) {
    console.error("Vendor profile GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch vendor profile" }, { status: 500 });
  }
}
