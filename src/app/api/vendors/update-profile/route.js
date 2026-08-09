import { updateCustomerMeta, getCustomerById, clearVendorsCache } from "@/lib/woocommerce";
import { VENDOR_CACHE } from "@/app/api/vendors/[slug]/route";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request) {
  try {
    const { id, meta } = await request.json();

    if (!id || !meta) {
      return NextResponse.json({ error: "ID and meta are required" }, { status: 400 });
    }

    // 1. Fetch existing customer to get current Dokan settings
    const customer = await getCustomerById(id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const currentMeta = Object.fromEntries((customer.meta_data || []).map(m => [m.key, m.value]));
    let dokanSettings = currentMeta.dokan_profile_settings || {};
    
    // If it's a string (serialized in PHP), we might need to be careful, 
    // but the REST API usually returns it as an object if handled correctly, 
    // or we might need to parse it if it's raw.
    if (typeof dokanSettings === 'string') {
        try { dokanSettings = JSON.parse(dokanSettings); } catch(e) { dokanSettings = {}; }
    }

    // 2. Sync Mahally keys to Dokan keys
    const metaUpdates = { ...meta };
    const storeLogoUrl = meta.mahally_store_logo || meta.mahally_avatar_url || dokanSettings.gravatar || dokanSettings.gravatar_url || "";
    const storeBannerUrl = meta.mahally_store_banner || dokanSettings.banner || dokanSettings.banner_url || "";

    // Map to Dokan profile settings
    dokanSettings.store_name = meta.mahally_store_name || dokanSettings.store_name;
    dokanSettings.phone = meta.mahally_store_phone || dokanSettings.phone;
    dokanSettings.show_email = meta.mahally_show_email === 'yes' ? 'yes' : 'no';
    dokanSettings.store_description = meta.mahally_store_description || dokanSettings.store_description;
    dokanSettings.banner = storeBannerUrl;
    dokanSettings.banner_url = storeBannerUrl;
    dokanSettings.gravatar = storeLogoUrl;
    dokanSettings.gravatar_url = storeLogoUrl;
    
    // Payment Methods Sync
    if (meta.payment_methods) {
        dokanSettings.payment = {
            ...dokanSettings.payment,
            ...meta.payment_methods
        };
    }
    
    // Prepare meta_data array for WooCommerce API
    // IMPORTANT: Only include keys that are explicitly provided — sending undefined/null
    // deletes the meta key in WooCommerce, which would wipe e.g. whatsapp on a banner-only save.
    const metaDataArray = [
      { key: "dokan_profile_settings", value: dokanSettings },
      meta.mahally_store_name       !== undefined && { key: "mahally_store_name",        value: meta.mahally_store_name },
      meta.mahally_store_phone      !== undefined && { key: "mahally_store_phone",       value: meta.mahally_store_phone },
      meta.mahally_store_phone      !== undefined && { key: "billing_phone",             value: meta.mahally_store_phone },
      meta.mahally_store_phone      !== undefined && { key: "phone",                     value: meta.mahally_store_phone },
      meta.mahally_store_phone      !== undefined && { key: "dokan_store_name",          value: meta.mahally_store_name },
      meta.mahally_store_phone      !== undefined && { key: "dokan_store_phone",         value: meta.mahally_store_phone },
      meta.mahally_return_policy    !== undefined && { key: "mahally_return_policy",     value: meta.mahally_return_policy },
      meta.mahally_return_period    !== undefined && { key: "mahally_return_period",     value: meta.mahally_return_period },
      meta.mahally_whatsapp_number  !== undefined && { key: "mahally_whatsapp_number",   value: meta.mahally_whatsapp_number },
      meta.mahally_show_whatsapp    !== undefined && { key: "mahally_show_whatsapp",     value: meta.mahally_show_whatsapp },
      meta.mahally_store_description!== undefined && { key: "mahally_store_description",value: meta.mahally_store_description },
      meta.mahally_store_banner     !== undefined && { key: "mahally_store_banner",      value: meta.mahally_store_banner },
      meta.mahally_store_logo       !== undefined && { key: "mahally_store_logo",        value: meta.mahally_store_logo },
      (meta.mahally_store_logo !== undefined || meta.mahally_avatar_url !== undefined) && {
        key: "mahally_avatar_url",
        value: meta.mahally_store_logo || meta.mahally_avatar_url || ""
      },
      meta.mahally_banner_pos       !== undefined && { key: "mahally_banner_pos",        value: meta.mahally_banner_pos },
      meta.mahally_logo_pos         !== undefined && { key: "mahally_logo_pos",          value: meta.mahally_logo_pos },
    ].filter(Boolean);

    // Debug: log what meta keys are being saved (visible in npm run dev terminal)
    console.log(`[update-profile] Saving meta for vendor ${id}:`,
      metaDataArray
        .filter(m => m.key !== 'dokan_profile_settings') // skip verbose dokan blob
        .map(m => `${m.key}=${JSON.stringify(m.value)}`)
        .join(' | ')
    );

    // Update customer using the full updateCustomer function to sync billing info
    const updatePayload = {
      billing: {
        phone: meta.mahally_store_phone || customer.billing?.phone || "",
        first_name: meta.mahally_store_name || customer.first_name || "",
        last_name: meta.mahally_store_name ? "" : (customer.last_name || "")
      },
      first_name: meta.mahally_store_name || customer.first_name || "",
      last_name: meta.mahally_store_name ? "" : (customer.last_name || ""),
      meta_data: metaDataArray
    };

    const credentials = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");

    // 1. Sync WooCommerce Customer record
    const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/customers/${id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`
      },
      body: JSON.stringify(updatePayload)
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("WooCommerce update failed:", err);
      return NextResponse.json({ error: "Failed to update WooCommerce profile" }, { status: 500 });
    }

    // 2. Sync underlying WordPress User details (display_name/name, nickname, first_name)
    // This ensures that WordPress/Dokan displays the new store name as the "Author" of products
    // in the admin backend and throughout other parts of the CMS.
    if (meta.mahally_store_name) {
      try {
        const wpUserResponse = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wp/v2/users/${id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Basic ${credentials}`
          },
          body: JSON.stringify({
            name: meta.mahally_store_name,
            nickname: meta.mahally_store_name,
            first_name: meta.mahally_store_name,
            last_name: ""
          })
        });
        if (!wpUserResponse.ok) {
          const wpErr = await wpUserResponse.json();
          console.warn("WordPress User sync warning:", wpErr);
        }
      } catch (wpError) {
        console.error("Failed to sync WordPress User profile name:", wpError.message);
      }
    }

    // Bust the entire vendor cache so the next GET returns fresh data for any slug/id
    if (typeof VENDOR_CACHE.clear === 'function') {
      VENDOR_CACHE.clear();
    }
    
    // Also bust the global vendors list cache (for the /vendors directory page)
    clearVendorsCache();
    
    // Clear Next.js cache for this customer
    revalidateTag(`customer-${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Profile API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
