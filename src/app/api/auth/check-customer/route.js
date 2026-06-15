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
  console.log("POST /api/auth/check-user hit");
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
          const emailRes = await api.get("customers", { email });
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
      
      // Search both 'customer' and 'seller' roles, since registered vendors have the seller role
      // and the WC API doesn't return sellers when role is unspecified
      let customers = [];
      for (let i = 0; i < 3; i++) {
        try {
          const [custRes, sellerRes] = await Promise.all([
            api.get("customers", { per_page: 100, order: 'desc', orderby: 'registered_date' }),
            api.get("customers", { per_page: 100, role: 'seller', order: 'desc', orderby: 'registered_date' })
          ]);
          customers = [
            ...(custRes.data || []),
            ...(sellerRes.data || [])
          ];
          break;
        } catch (e) {
          if (i === 2) throw e;
          console.warn(`Retry ${i + 1} for check-user due to: ${e.message}`);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      found = customers.find(c => {
        const cPhone = (c.billing?.phone || "").replace(/\D/g, "");
        return cPhone.includes(cleanPhone) || cleanPhone.includes(cPhone);
      });
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

    return NextResponse.json({
      exists: true,
      customer: {
        id: found.id,
        publicId: mahallyId,
        email: found.email,
        displayName: (role === 'vendor' || found.role === 'seller' || found.role === 'administrator')
          ? (meta.mahally_store_name || meta.dokan_profile_settings?.store_name || `${found.first_name} ${found.last_name}`.trim() || found.username)
          : (`${found.first_name} ${found.last_name}`.trim() || found.username),
        role: role,
        vendorStatus: (meta.dokan_enable_selling === "yes" || found.role === 'administrator') ? "approved" : (meta.mahally_vendor_status || "pending"),
        dokanEnabled: meta.dokan_enable_selling === "yes" || found.role === 'administrator',
        storeSlug: meta.dokan_profile_settings?.store_name?.toLowerCase().replace(/\s+/g, '-') || meta.mahally_store_slug || ""
      },
    });
  } catch (error) {
    console.error("Check user API error:", error);
    
    // Detect connection errors (backend down)
    const errorString = (error.message || "") + (error.code || "") + (error.stack || "");
    const isConnectionError = 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ECONNRESET' || 
      errorString.includes('ECONNREFUSED') ||
      errorString.includes('network') ||
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
