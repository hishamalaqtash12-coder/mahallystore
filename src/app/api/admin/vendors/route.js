import { getAllVendorApplications, updateCustomerMeta } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Simple header-based admin guard.
// Set MAHALLY_ADMIN_SECRET in your .env and pass it as `x-admin-secret` header.
function isAdmin(request) {
  const secret = process.env.MAHALLY_ADMIN_SECRET;
  if (!secret) return true; // dev mode: no secret set = open
  return request.headers.get("x-admin-secret") === secret;
}

/** GET /api/admin/vendors — list all vendor applications */
export async function GET(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const vendors = await getAllVendorApplications();

    const list = vendors.map((v) => {
      const meta = Object.fromEntries((v.meta_data || []).map((m) => [m.key, m.value]));
      let dokanSettings = {};
      try {
        const dokanMeta = meta.dokan_profile_settings;
        dokanSettings = typeof dokanMeta === 'string' ? JSON.parse(dokanMeta) : (dokanMeta || {});
      } catch (e) {}

      const storeName = dokanSettings.store_name || meta.mahally_store_name || `${v.first_name} ${v.last_name}`.trim() || v.username || "Store";
      const storeSlug = dokanSettings.store_name?.toLowerCase().replace(/\s+/g, '-') || meta.mahally_store_slug || "";
      const storeDescription = dokanSettings.store_description || meta.mahally_store_description || "";

      return {
        id: v.id,
        name: storeName,
        email: v.email,
        phone: v.billing?.phone || "",
        storeName: storeName,
        storeSlug: storeSlug,
        storeCategory: meta.mahally_store_category || "",
        storeDescription: storeDescription,
        status: (meta.dokan_enable_selling === "yes") ? "approved" : (meta.mahally_vendor_status || "pending"),
        membershipPlan: meta.mahally_membership_plan || "free",
        dateCreated: v.date_created,
      };
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error("Admin vendors API error:", error.message);
    return NextResponse.json({ error: "Failed to fetch vendor applications" }, { status: 500 });
  }
}

/** Helper: approve or reject a single vendor */
async function applySingleAction(vendorId, action) {
  const dokanEnable = action === "approve" ? "yes" : "no";
  const mahallyStatus = action === "approve" ? "approved" : "rejected";

  // Update BOTH fields atomically so both Dokan and the Mahally plugin stay in sync
  await updateCustomerMeta(vendorId, {
    dokan_enable_selling: dokanEnable,
    mahally_vendor_status: mahallyStatus,
  });

  if (action === "approve") {
    try {
      const WooCommerceRestApi = (await import("@woocommerce/woocommerce-rest-api")).default;
      const api = new WooCommerceRestApi({
        url: process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://fallback.mahally.local",
        consumerKey: process.env.WC_CONSUMER_KEY,
        consumerSecret: process.env.WC_CONSUMER_SECRET,
        version: "wc/v3",
      });
      await api.put(`customers/${vendorId}`, { role: "seller" });
    } catch (e) {
      console.warn(`Failed to update user role to seller for vendor ${vendorId}:`, e.message);
    }
  } else if (action === "reject") {
    // Optionally demote role back to customer so they cannot sell
    try {
      const WooCommerceRestApi = (await import("@woocommerce/woocommerce-rest-api")).default;
      const api = new WooCommerceRestApi({
        url: process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://fallback.mahally.local",
        consumerKey: process.env.WC_CONSUMER_KEY,
        consumerSecret: process.env.WC_CONSUMER_SECRET,
        version: "wc/v3",
      });
      await api.put(`customers/${vendorId}`, { role: "customer" });
    } catch (e) {
      console.warn(`Failed to demote vendor ${vendorId} role to customer:`, e.message);
    }
  }
}

/** PATCH /api/admin/vendors — approve, reject, change plan, or bulk action */
export async function PATCH(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // ── Bulk action: { vendorIds: number[], action: "approve" | "reject" } ──
    if (Array.isArray(body.vendorIds)) {
      const { vendorIds, action } = body;
      if (!["approve", "reject"].includes(action)) {
        return NextResponse.json({ error: "action must be approve or reject for bulk operations" }, { status: 400 });
      }

      const newStatus = action === "approve" ? "approved" : "rejected";

      // Process all vendors concurrently
      const results = await Promise.allSettled(
        vendorIds.map((id) => applySingleAction(id, action))
      );

      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - succeeded;

      return NextResponse.json({ success: true, status: newStatus, succeeded, failed, total: vendorIds.length });
    }

    // ── Single action: { vendorId, action, plan? } ──
    const { vendorId, action, plan } = body;

    if (!vendorId || !["approve", "reject", "change_plan"].includes(action)) {
      return NextResponse.json({ error: "vendorId and valid action are required" }, { status: 400 });
    }

    if (action === "change_plan") {
      if (!plan) return NextResponse.json({ error: "plan is required" }, { status: 400 });
      await updateCustomerMeta(vendorId, { mahally_membership_plan: plan });
      return NextResponse.json({ success: true, plan });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    await applySingleAction(vendorId, action);
    return NextResponse.json({ success: true, status: newStatus });

  } catch (error) {
    console.error("Admin vendor action error:", error.message);
    return NextResponse.json({ error: "Failed to update vendor status" }, { status: 500 });
  }
}
