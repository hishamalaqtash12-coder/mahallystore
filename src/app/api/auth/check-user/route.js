import { NextResponse } from "next/server";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

import { generateMahallyId } from "@/lib/id-generator";

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://fallback.mahally.local',
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3",
});

async function updateCustomerMeta(customerId, meta) {
  const meta_data = Object.entries(meta).map(([key, value]) => ({ key, value }));
  return api.put(`customers/${customerId}`, { meta_data });
}

/**
 * POST /api/auth/check-user
 * Returns { exists, customer? } where customer includes role/vendor meta.
 */
export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // Handle empty body
      console.warn("Check-user received empty body");
     body = {};
    }
    const { email, phone } = body;

    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
    }

    let found = null;

    // Check by email first
    if (email) {
      for (let i = 0; i < 3; i++) {
        try {
          // Add role: 'all' to ensure administrators and vendors are found,
          // not just regular customers.
          const emailRes = await api.get("customers", { email, role: 'all' });
          if (emailRes.data?.length > 0) found = emailRes.data[0];
          break;
        } catch (e) {
          if (i === 2) throw e;
          console.warn(`Retry ${i + 1} for email check due to: ${e.message}`);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    // Check by phone if still not found
    if (!found && phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      
      let page = 1;
      let hasMore = true;
      
      while (hasMore && page <= 10) {
        let pageCustomers = [];
        for (let i = 0; i < 3; i++) {
          try {
            const custRes = await api.get("customers", { per_page: 100, page: page, order: 'desc', orderby: 'registered_date' });
            const sellerRes = await api.get("customers", { per_page: 100, page: page, role: 'seller', order: 'desc', orderby: 'registered_date' });
            const adminRes = await api.get("customers", { per_page: 50, page: page, role: 'administrator', order: 'desc', orderby: 'registered_date' });

            pageCustomers = [
              ...(custRes.data || []),
              ...(sellerRes.data || []),
              ...(adminRes.data || [])
            ];
            
            // If all responses have less than their per_page limit, we've reached the end
            if ((custRes.data || []).length < 100 && (sellerRes.data || []).length < 100) {
              hasMore = false;
            }
            break;
          } catch (e) {
            if (i === 2) { hasMore = false; break; }
            const delay = 500 * Math.pow(2, i) + Math.random() * 500;
            await new Promise(r => setTimeout(r, delay));
          }
        }
        
        found = pageCustomers.find(c => {
          const cPhone = (c.billing?.phone || "").replace(/\D/g, "");
          if (!cPhone || !cleanPhone) return false;
          return cPhone === cleanPhone || cPhone.endsWith(cleanPhone) || cleanPhone.endsWith(cPhone);
        });

        if (found) break;
        page++;
      }
    }

    if (!found) {
      return NextResponse.json({ exists: false });
    }

    // Extract meta
    const meta = Object.fromEntries((found.meta_data || []).map((m) => [m.key, m.value]));

    // 1. Branded Identity Enforcement
    const role = (found.role === 'seller' || found.role === 'administrator') ? 'vendor' : (meta.mahally_role || "customer");
    let mahallyId = meta.mahally_id || meta.mahally_public_id;

    if (!mahallyId || !mahallyId.startsWith('mah-')) {
      const type = (role === 'vendor' || role === 'shop_manager' || found.role === 'seller' || found.role === 'administrator') ? 'vendor' : 'customer';
      mahallyId = generateMahallyId(type);
      await updateCustomerMeta(found.id, { mahally_id: mahallyId });
    }

    let vendorStatus = "pending";
    let dokanStoreName = null;
    let dokanStoreSlug = null;

    if (found.role === 'administrator') {
      vendorStatus = "approved";
    } else if (role === 'vendor' || role === 'shop_manager' || found.role === 'seller') {
      if (meta.dokan_enable_selling === "yes") {
        vendorStatus = "approved";
      } else {
        // Preserve "rejected" if explicitly set — don't downgrade it to "pending"
        vendorStatus = meta.mahally_vendor_status === "rejected" ? "rejected" : "pending";
      }

      // Auto-sync mahally_vendor_status back to WordPress if it's out of sync
      // (e.g. admin approved via Dokan directly but mahally meta wasn't updated)
      if (meta.mahally_vendor_status !== vendorStatus) {
        try {
          await updateCustomerMeta(found.id, { mahally_vendor_status: vendorStatus });
        } catch (syncErr) {
          console.warn("Failed to sync mahally_vendor_status:", syncErr.message);
        }
      }
    } else {
      vendorStatus = "approved"; // Customers are always approved
    }

    // Extract Dokan store info from already-fetched meta (avoids extra API call)
    if (role === 'vendor' || role === 'shop_manager' || found.role === 'seller' || found.role === 'administrator') {
      // dokan_profile_settings is stored as a serialized PHP object in WC meta
      const dokanSettings = meta.dokan_profile_settings;
      if (dokanSettings && typeof dokanSettings === 'object') {
        dokanStoreName = dokanSettings.store_name || null;
        dokanStoreSlug = dokanSettings.store_name?.toLowerCase().replace(/\s+/g, '-') || null;
      }
      // Also check flat meta keys
      if (!dokanStoreName) {
        dokanStoreName = meta.dokan_store_name || null;
      }
    }

    return NextResponse.json({
      exists: true,
      customer: {
        id: found.id,
        publicId: mahallyId,
        email: found.email,
        displayName: (role === 'vendor' || role === 'shop_manager' || found.role === 'seller' || found.role === 'administrator')
          ? (dokanStoreName || meta.mahally_store_name || meta.dokan_store_name || `${found.first_name} ${found.last_name}`.trim() || found.username)
          : (`${found.first_name} ${found.last_name}`.trim() || found.username),
        role: role,
        isAdmin: found.role === 'administrator',
        vendorStatus: vendorStatus,
        dokanEnabled: meta.dokan_enable_selling === "yes" || found.role === 'administrator',
        storeSlug: dokanStoreSlug || meta.mahally_store_slug || "",
        phone: found.billing?.phone || "",
        address: found.billing?.address_1 || "",
        city: found.billing?.city || "",
        billing: found.billing || {},
        shipping: found.shipping || {},
        notificationPreferences: meta.mahally_notification_preferences || null,
        avatarUrl: meta.mahally_avatar_url || meta.mahally_store_logo || null,
        avatarBgColor: meta.mahally_avatar_bg_color || "#9b8676"
      },
    });
  } catch (error) {
    console.error("Check user API error:", error);
    
    // Detect 401 unauthorized WooCommerce REST API keys
    const isUnauthorized = 
      error.status === 401 || 
      error.data?.status === 401 || 
      (error.message || "").includes("401") || 
      (error.message || "").includes("woocommerce_rest_cannot_view");

    if (isUnauthorized) {
      return NextResponse.json(
        { 
          error: "WooCommerce API credentials unauthorized", 
          code: "UNAUTHORIZED_API",
          message: "The WooCommerce REST API keys are no longer authorized (possibly due to deleted admin user). Logging out."
        }, 
        { status: 401 }
      );
    }

    // Detect connection errors (backend down)
    const isConnectionError = 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ECONNRESET' || 
      (error.message || "").includes('ECONNREFUSED') ||
      (error.message || "").includes('network') ||
      (error.errors && error.errors.some(e => e.code === 'ECONNREFUSED'));

    if (isConnectionError) {
      return NextResponse.json(
        { 
          error: "Backend service unreachable", 
          code: "BACKEND_DOWN",
          message: "The WooCommerce server is currently not responding. Please check your connection or try again later."
        }, 
        { status: 503 }
      );
    }

    // On other errors, return exists:true as a safe fallback for backward compatibility
    return NextResponse.json({ exists: true, error: error.message });
  }
}
