import { getAllVendorApplications, updateCustomerMeta } from "@/lib/woocommerce";
import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/notifications";

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
    let vendorEmail = null;
    let vendorFirstName = "Merchant";
    let storeName = "Your Store";

    try {
      const WooCommerceRestApi = (await import("@woocommerce/woocommerce-rest-api")).default;
      const api = new WooCommerceRestApi({
        url: process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://fallback.mahally.local",
        consumerKey: process.env.WC_CONSUMER_KEY,
        consumerSecret: process.env.WC_CONSUMER_SECRET,
        version: "wc/v3",
      });
      const custRes = await api.put(`customers/${vendorId}`, { role: "seller" });
      const custData = custRes.data;
      vendorEmail = custData?.email || custData?.billing?.email || null;
      vendorFirstName = custData?.first_name || custData?.username || "Merchant";

      const meta = Object.fromEntries((custData?.meta_data || []).map((m) => [m.key, m.value]));
      storeName = meta.mahally_store_name || meta.dokan_store_name || `${custData?.first_name || ''} ${custData?.last_name || ''}`.trim() || "Your Store";
    } catch (e) {
      console.warn(`Failed to update user role to seller for vendor ${vendorId}:`, e.message);
    }

    // Dispatch Vendor Approval Email
    if (vendorEmail) {
      try {
        const approvalHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 16px; padding: 32px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #be374f; font-size: 28px; font-weight: 900; margin: 0;">Mahally</h1>
              <p style="color: #059669; font-size: 13px; font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Merchant Account Approved</p>
            </div>

            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <p style="color: #065f46; font-size: 18px; font-weight: 800; margin: 0;">🎉 Welcome to Mahally Marketplace!</p>
              <p style="color: #047857; font-size: 14px; margin-top: 6px; margin-bottom: 0;">Great news! Your merchant application for <strong>${storeName}</strong> has been officially approved by our team.</p>
            </div>

            <div style="color: #3f3f46; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              <p>Dear <strong>${vendorFirstName}</strong>,</p>
              <p>You are now ready to start selling your products on Mahally. You can access your full Merchant Dashboard right away to setup your store, list products, and receive orders.</p>
            </div>

            <div style="background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #18181b; font-size: 13px; font-weight: 700; margin: 0 0 8px 0;">What you can do next:</p>
              <ul style="color: #52525b; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Add and manage your store products & inventory</li>
                <li>Customize your vendor store page and logo</li>
                <li>Receive automated order notifications when customers buy from you</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="https://mahallystore.com/merchant/dashboard" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 12px;">
                Go to Merchant Dashboard &rarr;
              </a>
            </div>

            <hr style="border: 0; border-top: 1px solid #f4f4f5; margin: 28px 0 16px 0;" />
            <p style="font-size: 11px; color: #a1a1aa; text-align: center; margin: 0;">Mahally Marketplace • Supporting Local Businesses</p>
          </div>
        `;

        await NotificationService.notify({
          userId: String(vendorId),
          senderId: "1",
          title: "🎉 Congratulations! Your Merchant Account Has Been Approved",
          message: `Your vendor account for ${storeName} has been approved! You can now log into your merchant dashboard and start selling.`,
          channel: ['internal', 'email'],
          type: 'vendor_approval',
          metadata: {
            email: vendorEmail,
            actionUrl: "https://mahallystore.com/merchant/dashboard",
            html: approvalHtml
          }
        }).catch(err => console.warn("Vendor approval email warning:", err.message));
      } catch (emailErr) {
        console.warn("Failed to send vendor approval email:", emailErr.message);
      }
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
